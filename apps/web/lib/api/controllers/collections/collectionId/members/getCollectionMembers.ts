import { prisma } from "@linkwarden/prisma";
import getPermission from "@/lib/api/getPermission";

export default async function getCollectionMembers(
  userId: number,
  collectionId: number
) {
  if (!collectionId)
    return { response: "Please choose a valid collection.", status: 400 };

  const collectionIsAccessible = await getPermission({ userId, collectionId });

  if (!collectionIsAccessible)
    return { response: "Collection is not accessible.", status: 401 };

  const members = await prisma.usersAndCollections.findMany({
    where: { collectionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const owner = await prisma.user.findUnique({
    where: { id: collectionIsAccessible.ownerId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
    },
  });

  return {
    status: 200,
    response: {
      owner,
      members: members.map((m) => ({
        userId: m.userId,
        canCreate: m.canCreate,
        canUpdate: m.canUpdate,
        canDelete: m.canDelete,
        user: m.user,
        createdAt: m.createdAt,
      })),
    },
  };
}
