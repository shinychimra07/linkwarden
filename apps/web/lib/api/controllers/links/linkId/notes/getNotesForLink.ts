import { prisma } from "@linkwarden/prisma";
import { UsersAndCollections } from "@linkwarden/prisma/client";
import getPermission from "@/lib/api/getPermission";

export default async function getNotesForLink(
  userId: number,
  linkId: number
) {
  if (!linkId)
    return {
      response: "Please choose a valid link.",
      status: 401,
    };

  const collectionIsAccessible = await getPermission({ userId, linkId });

  const memberHasAccess = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === userId
  );

  if (collectionIsAccessible?.ownerId !== userId && !memberHasAccess)
    return {
      response: "Collection is not accessible.",
      status: 401,
    };

  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { id: true, notes: true, updatedAt: true },
  });

  if (!link)
    return {
      response: "Link not found.",
      status: 404,
    };

  return {
    response: {
      linkId: link.id,
      notes: link.notes,
      updatedAt: link.updatedAt,
    },
    status: 200,
  };
}
