import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import toast from "react-hot-toast";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Props = {
  onClose: () => void;
  link: LinkIncludingShortenedCollectionAndTags;
};

type ShareState = {
  isShared: boolean;
  shareToken: string | null;
  shareUrl: string | null;
  sharedAt: string | null;
};

export default function ShareLinkModal({ onClose, link }: Props) {
  const [shareState, setShareState] = useState<ShareState>({
    isShared: false,
    shareToken: null,
    shareUrl: null,
    sharedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchShareState();
  }, []);

  const fetchShareState = async () => {
    try {
      const res = await fetch(`/api/v1/links/${link.id}/share`);
      const data = await res.json();
      if (res.ok) {
        setShareState(data.response);
      }
    } catch {
      toast.error("Failed to load share status.");
    } finally {
      setLoading(false);
    }
  };

  const toggleShare = async () => {
    setToggling(true);
    try {
      if (shareState.isShared) {
        const res = await fetch(`/api/v1/links/${link.id}/share`, {
          method: "DELETE",
        });
        if (res.ok) {
          setShareState({ isShared: false, shareToken: null, shareUrl: null, sharedAt: null });
          toast.success("Share link revoked.");
        } else {
          const data = await res.json();
          toast.error(data.response);
        }
      } else {
        const res = await fetch(`/api/v1/links/${link.id}/share`, {
          method: "POST",
        });
        const data = await res.json();
        if (res.ok) {
          setShareState(data.response);
          toast.success("Share link created!");
        } else {
          toast.error(data.response);
        }
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setToggling(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareState.shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareState.shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy.");
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">Share Link</p>
      <Separator className="my-3" />

      {loading ? (
        <div className="flex justify-center py-8">
          <i className="bi-arrow-clockwise animate-spin text-2xl" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Public sharing</p>
              <p className="text-sm text-neutral-500">
                Anyone with the link can view this bookmark
              </p>
            </div>
            <button
              onClick={toggleShare}
              disabled={toggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                shareState.isShared ? "bg-primary" : "bg-neutral-300 dark:bg-neutral-600"
              }`}
              data-testid="share-toggle"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  shareState.isShared ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {shareState.isShared && shareState.shareUrl && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareState.shareUrl}
                  className="flex-1 rounded-md border bg-base-200 px-3 py-2 text-sm"
                  data-testid="share-url-input"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  data-testid="copy-share-url"
                >
                  <i className={copied ? "bi-check-lg" : "bi-clipboard"} />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              {shareState.sharedAt && (
                <p className="text-xs text-neutral-500">
                  Shared on{" "}
                  {new Date(shareState.sharedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center">
            <div className="text-sm text-neutral-500 truncate max-w-[300px]">
              <i className="bi-link-45deg mr-1" />
              {link.name || link.url}
            </div>
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
