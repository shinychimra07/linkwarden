import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import getServerSideProps from "@/lib/client/getServerSideProps";

type SharedLinkData = {
  id: number;
  name: string;
  url: string | null;
  description: string;
  type: string;
  icon: string | null;
  color: string | null;
  preview: string | null;
  collection: { id: number; name: string; color: string; icon: string | null };
  tags: { id: number; name: string }[];
  createdBy: { id: number; name: string | null; username: string | null; image: string | null };
  sharedAt: string;
  createdAt: string;
};

const SharedLinkPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const [link, setLink] = useState<SharedLinkData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/v1/public/shared/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.response?.id) {
          setLink(data.response);
        } else {
          setError(data.response || "Link not found.");
        }
      })
      .catch(() => setError("Failed to load shared link."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="max-w-xl p-5 m-auto w-full flex flex-col items-center gap-5">
          <div className="w-20 h-20 skeleton rounded-xl"></div>
          <div className="w-full h-10 skeleton rounded-xl"></div>
          <div className="w-full h-10 skeleton rounded-xl"></div>
          <div className="w-full h-10 skeleton rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="flex h-screen">
        <div className="max-w-md m-auto text-center p-5">
          <i className="bi-link-45deg text-6xl text-neutral-400" />
          <h1 className="text-2xl font-bold mt-4">Link Not Found</h1>
          <p className="text-neutral-500 mt-2">
            {error || "This shared link doesn't exist or has been revoked."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{link.name || "Shared Link"} — Linkwarden</title>
        <meta name="description" content={link.description || `Shared bookmark: ${link.name}`} />
      </Head>

      <div className="flex min-h-screen bg-base-100">
        <div className="max-w-2xl m-auto w-full p-5 sm:p-8">
          <div className="card bg-base-200 shadow-lg rounded-2xl overflow-hidden">
            {link.preview && (
              <figure className="h-48 overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                <img
                  src={link.preview}
                  alt={link.name}
                  className="w-full h-full object-cover"
                />
              </figure>
            )}

            <div className="card-body p-6">
              <div className="flex items-start gap-3">
                {link.icon && (
                  <img src={link.icon} alt="" className="w-8 h-8 rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold leading-tight">{link.name}</h1>
                  {link.url && (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm truncate block mt-1"
                    >
                      <i className="bi-box-arrow-up-right mr-1" />
                      {link.url}
                    </a>
                  )}
                </div>
              </div>

              {link.description && (
                <p className="text-neutral-600 dark:text-neutral-400 mt-4">
                  {link.description}
                </p>
              )}

              {link.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {link.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="badge badge-outline badge-sm"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="divider my-3" />

              <div className="flex items-center justify-between text-sm text-neutral-500">
                <div className="flex items-center gap-2">
                  <i className="bi-folder2" />
                  <span style={{ color: link.collection.color }}>
                    {link.collection.name}
                  </span>
                </div>
                <div>
                  Shared {new Date(link.sharedAt).toLocaleDateString(undefined, {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </div>
              </div>

              {link.url && (
                <div className="mt-4">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary w-full"
                  >
                    <i className="bi-box-arrow-up-right mr-2" />
                    Visit Link
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="text-center mt-6 text-sm text-neutral-400">
            Shared via <span className="font-semibold">Linkwarden</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SharedLinkPage;

export { getServerSideProps };
