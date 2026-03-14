#!/usr/bin/env bash
set -eo pipefail

BASE_URL="${NEXTAUTH_URL:-http://localhost:3000/api/v1/auth}"
APP_URL="${BASE_URL%/api/v1/auth}"
USERNAME="${TEST_USERNAME:-test}"
PASSWORD="${TEST_PASSWORD:-password}"
COOKIE_JAR=$(mktemp)
trap "rm -f $COOKIE_JAR" EXIT

echo "Auth config: APP_URL=${APP_URL}, USERNAME=${USERNAME}" >&2

# Seed the test user (ignore if already exists)
echo "Seeding test user..." >&2
SEED_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${APP_URL}/api/v1/users" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\",\"name\":\"Test User\"}" 2>&1) || true
SEED_HTTP_CODE=$(echo "$SEED_RESPONSE" | tail -1)
echo "Seed user response: HTTP ${SEED_HTTP_CODE}" >&2

# Get CSRF token (also saves cookies to jar)
echo "Fetching CSRF token..." >&2
CSRF_RESPONSE=$(curl -s -c "$COOKIE_JAR" "${BASE_URL}/csrf")
echo "CSRF response: ${CSRF_RESPONSE}" >&2
CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CSRF_TOKEN" ]; then
  echo "ERROR: Failed to get CSRF token" >&2
  exit 1
fi
echo "CSRF token obtained" >&2

# Authenticate - follow redirects and capture all cookies
echo "Authenticating..." >&2
AUTH_RESPONSE=$(curl -s -L -w "\n%{http_code}" \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "${BASE_URL}/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${USERNAME}&password=${PASSWORD}&csrfToken=${CSRF_TOKEN}" 2>&1)
AUTH_HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -1)
echo "Auth response: HTTP ${AUTH_HTTP_CODE}" >&2

# Extract session token from cookie jar
echo "Cookie jar contents:" >&2
cat "$COOKIE_JAR" >&2

SESSION_TOKEN=$(grep 'next-auth.session-token' "$COOKIE_JAR" | awk '{print $NF}')

if [ -z "$SESSION_TOKEN" ]; then
  echo "ERROR: No session token in cookie jar" >&2
  exit 1
fi

echo "Session token obtained successfully" >&2
echo "next-auth.session-token=${SESSION_TOKEN}"
