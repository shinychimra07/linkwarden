import { prisma } from "@linkwarden/prisma";

export default async function getShareLink(userId: number, linkId: number) {
  if (!linkId) return { response: "Invalid link ID.", status: 400 };

  const link = await prisma.link.findUnique({
    where: { id: linkId },
    include: { collection: { include: { members: true } } },
  });

  if (!link) return { response: "Link not found.", status: 404 };

  const isOwner = link.collection.ownerId === userId;
  const isMember = link.collection.members.some((m) => m.userId === userId);

  if (!isOwner && !isMember) {
    return { response: "Permission denied.", status: 403 };
  }

  if (!link.isShared || !link.shareToken) {
    return {
      response: { isShared: false, shareToken: null, shareUrl: null, sharedAt: null },
      status: 200,
    };
  }

  return {
    response: {
      shareToken: link.shareToken,
      shareUrl: `${process.env.NEXTAUTH_URL?.replace("/api/v1/auth", "")}/public/shared/${link.shareToken}`,
      isShared: true,
      sharedAt: link.sharedAt,
    },
    status: 200,
  };
}
