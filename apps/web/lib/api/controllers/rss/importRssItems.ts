import { prisma } from "@linkwarden/prisma";
import { RssSubscription, Collection } from "@linkwarden/prisma/client";
import { hasPassedLimit } from "@linkwarden/lib/verifyCapacity";
import Parser from "rss-parser";

type RssSubscriptionWithCollection = RssSubscription & {
  collection: Collection;
};

function extractCategoryTags(item: Parser.Item): string[] {
  const tags: string[] = [];

  if (item.categories) {
    for (const cat of item.categories) {
      const trimmed = typeof cat === "string" ? cat.trim() : String(cat).trim();
      if (trimmed && trimmed.length <= 50) {
        tags.push(trimmed.toLowerCase());
      }
    }
  }

  return Array.from(new Set(tags)).slice(0, 5);
}

export default async function importRssItems(
  userId: number,
  rssSubscription: RssSubscriptionWithCollection,
  autoTag: boolean,
  maxItems: number
) {
  const parser = new Parser();

  let feed: Parser.Output<Parser.Item>;
  try {
    feed = await parser.parseURL(rssSubscription.url);
  } catch (error) {
    return {
      status: 502,
      response: `Failed to fetch RSS feed: ${rssSubscription.url}`,
    };
  }

  if (!feed.items || feed.items.length === 0) {
    return { status: 200, response: { imported: 0, tagged: 0, links: [] } };
  }

  const items = feed.items
    .filter((item) => item.link)
    .slice(0, maxItems);

  const existingLinks = await prisma.link.findMany({
    where: {
      collectionId: rssSubscription.collectionId,
      createdById: userId,
      url: { in: items.map((item) => item.link!).filter(Boolean) },
    },
    select: { url: true },
  });

  const existingUrls = new Set(existingLinks.map((l) => l.url));
  const newItems = items.filter((item) => !existingUrls.has(item.link!));

  const hasTooManyLinks = await hasPassedLimit(userId, newItems.length);
  if (hasTooManyLinks) {
    return {
      status: 403,
      response: "Link limit reached. Upgrade your plan or delete existing links.",
    };
  }

  const createdLinks = [];
  let taggedCount = 0;

  for (const item of newItems) {
    let tagConnections: { id: number }[] = [];

    if (autoTag) {
      const categoryNames = extractCategoryTags(item);

      if (categoryNames.length > 0) {
        const existingTags = await prisma.tag.findMany({
          where: {
            ownerId: userId,
            name: { in: categoryNames },
          },
        });

        const existingTagNames = new Set(existingTags.map((t) => t.name));
        const newTagNames = categoryNames.filter(
          (name) => !existingTagNames.has(name)
        );

        const newTags = await Promise.all(
          newTagNames.map((name) =>
            prisma.tag.create({
              data: { name, ownerId: userId },
            })
          )
        );

        tagConnections = [...existingTags, ...newTags].map((t) => ({
          id: t.id,
        }));

        if (tagConnections.length > 0) taggedCount++;
      }
    }

    const link = await prisma.link.create({
      data: {
        name: item.title || "",
        url: item.link!,
        description: item.contentSnippet?.slice(0, 500) || "",
        type: "url",
        createdBy: { connect: { id: userId } },
        collection: { connect: { id: rssSubscription.collectionId } },
        ...(tagConnections.length > 0
          ? { tags: { connect: tagConnections } }
          : {}),
      },
      include: {
        tags: { select: { id: true, name: true } },
      },
    });

    createdLinks.push(link);
  }

  const feedLastPubDate =
    (feed as any).lastBuildDate ??
    feed.items.reduce((acc, item) => {
      const pubDate = item.pubDate ? new Date(item.pubDate) : null;
      return pubDate && pubDate > acc ? pubDate : acc;
    }, new Date(0));

  if (feedLastPubDate) {
    await prisma.rssSubscription.update({
      where: { id: rssSubscription.id },
      data: { lastBuildDate: new Date(feedLastPubDate) },
    });
  }

  return {
    status: 200,
    response: {
      imported: createdLinks.length,
      tagged: taggedCount,
      skippedDuplicates: items.length - newItems.length,
      links: createdLinks,
    },
  };
}
