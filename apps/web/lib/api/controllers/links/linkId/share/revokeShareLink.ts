import { prisma } from "@linkwarden/prisma";

export default async function revokeShareLink(userId: number, linkId: number) {
  if (!linkId) return { response: "Invalid link ID.", status: 400 };

  const link = await prisma.link.findUnique({
    where: { id: linkId },
    include: { collection: { include: { members: true } } },
  });

  if (!link) return { response: "Link not found.", status: 404 };

  const isOwner = link.collection.ownerId === userId;
  const isMember = link.collection.members.some(
    (m) => m.userId === userId && m.canUpdate
  );

  if (!isOwner && !isMember) {
    return { response: "Permission denied.", status: 403 };
  }

  if (!link.isShared) {
    return { response: "Link is not currently shared.", status: 400 };
  }

  await prisma.link.update({
    where: { id: linkId },
    data: {
      shareToken: null,
      isShared: false,
      sharedAt: null,
    },
  });

  return { response: "Share link revoked.", status: 200 };
}
