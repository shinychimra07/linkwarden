import React, { ReactElement, useEffect, useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import { useTranslation } from "next-i18next";
import { useCollections } from "@linkwarden/router/collections";
import { useUser } from "@linkwarden/router/user";
import getServerSideProps from "@/lib/client/getServerSideProps";
import ProfilePhoto from "@/components/ProfilePhoto";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NextPageWithLayout } from "../../_app";

type CollectionMember = {
  userId: number;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  user: {
    id: number;
    name: string | null;
    username: string | null;
    email: string | null;
    image: string | null;
  };
};

type MembersResponse = {
  owner: {
    id: number;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  members: CollectionMember[];
};

const CollectionSettingsPage: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const collectionId = Number(router.query.id);

  const { data: collections = [] } = useCollections();
  const { data: user = {} } = useUser();

  const [membersData, setMembersData] = useState<MembersResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const collection = collections.find(
    (c) => c.id === collectionId
  );

  const isOwner = collection?.ownerId === (user as { id?: number })?.id;

  useEffect(() => {
    if (!collectionId) return;

    const fetchMembers = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/v1/collections/${collectionId}/members`
        );
        const data = await res.json();
        if (res.ok) {
          setMembersData(data.response);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [collectionId]);

  const handlePermissionToggle = async (
    memberId: number,
    permission: "canCreate" | "canUpdate" | "canDelete",
    currentValue: boolean
  ) => {
    const load = toast.loading(t("updating"));

    try {
      const res = await fetch(
        `/api/v1/collections/${collectionId}/members/${memberId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [permission]: !currentValue }),
        }
      );

      if (res.ok) {
        toast.dismiss(load);
        toast.success(t("updated"));

        setMembersData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            members: prev.members.map((m) =>
              m.userId === memberId
                ? { ...m, [permission]: !currentValue }
                : m
            ),
          };
        });
      } else {
        const data = await res.json();
        toast.dismiss(load);
        toast.error(data.response);
      }
    } catch {
      toast.dismiss(load);
      toast.error(t("error"));
    }
  };

  const handleRemoveMember = async (memberId: number, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this collection?`)) return;

    const load = toast.loading(t("removing"));

    try {
      const res = await fetch(
        `/api/v1/collections/${collectionId}/members/${memberId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        toast.dismiss(load);
        toast.success(t("removed"));
        setMembersData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            members: prev.members.filter((m) => m.userId !== memberId),
          };
        });
      } else {
        const data = await res.json();
        toast.dismiss(load);
        toast.error(data.response);
      }
    } catch {
      toast.dismiss(load);
      toast.error(t("error"));
    }
  };

  if (!collection) {
    return <div className="p-5">Collection not found.</div>;
  }

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{collection.name} — Settings</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Manage sharing and member permissions
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <Separator className="mb-6" />

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Owner</h2>
        {membersData?.owner && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <ProfilePhoto
              src={membersData.owner.image || undefined}
              name={membersData.owner.name || membersData.owner.username || "?"}
            />
            <div>
              <p className="font-medium">
                {membersData.owner.name || membersData.owner.username}
              </p>
              <p className="text-sm text-neutral-500">Owner</p>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">
          Members ({membersData?.members.length || 0})
        </h2>

        {loading ? (
          <p className="text-neutral-500">Loading members...</p>
        ) : membersData?.members.length === 0 ? (
          <p className="text-neutral-500">
            No members yet. Share this collection to add members.
          </p>
        ) : (
          <div className="space-y-3">
            {membersData?.members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
              >
                <div className="flex items-center gap-3">
                  <ProfilePhoto
                    src={member.user.image || undefined}
                    name={
                      member.user.name || member.user.username || "?"
                    }
                  />
                  <div>
                    <p className="font-medium">
                      {member.user.name || member.user.username}
                    </p>
                    <p className="text-sm text-neutral-500">
                      @{member.user.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    {(
                      ["canCreate", "canUpdate", "canDelete"] as const
                    ).map((perm) => (
                      <button
                        key={perm}
                        onClick={() =>
                          isOwner &&
                          handlePermissionToggle(
                            member.userId,
                            perm,
                            member[perm]
                          )
                        }
                        disabled={!isOwner}
                        className={`px-2 py-1 text-xs rounded ${
                          member[perm]
                            ? "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300"
                            : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
                        } ${isOwner ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                      >
                        {perm.replace("can", "")}
                      </button>
                    ))}
                  </div>

                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleRemoveMember(
                          member.userId,
                          member.user.name || member.user.username || "member"
                        )
                      }
                      className="text-red-500 hover:text-red-600"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

CollectionSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export { getServerSideProps };
export default CollectionSettingsPage;
