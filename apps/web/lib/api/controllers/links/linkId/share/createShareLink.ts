import { prisma } from "@linkwarden/prisma";
import crypto from "crypto";

export default async function createShareLink(userId: number, linkId: number) {
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

  if (link.isShared && link.shareToken) {
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

  const shareToken = crypto.randomBytes(16).toString("hex");

  const updatedLink = await prisma.link.update({
    where: { id: linkId },
    data: {
      shareToken,
      isShared: true,
      sharedAt: new Date(),
    },
  });

  return {
    response: {
      shareToken: updatedLink.shareToken,
      shareUrl: `${process.env.NEXTAUTH_URL?.replace("/api/v1/auth", "")}/public/shared/${updatedLink.shareToken}`,
      isShared: true,
      sharedAt: updatedLink.sharedAt,
    },
    status: 200,
  };
}
