import { prisma } from "@linkwarden/prisma";
import getPermission from "@/lib/api/getPermission";

export default async function removeCollectionMember(
  userId: number,
  collectionId: number,
  memberId: number
) {
  if (!collectionId || !memberId)
    return { response: "Invalid collection or member ID.", status: 400 };

  const collectionIsAccessible = await getPermission({ userId, collectionId });

  const isOwner = collectionIsAccessible?.ownerId === userId;
  const isSelf = memberId === userId;

  if (!isOwner && !isSelf)
    return {
      response: "Only the owner can remove members, or you can remove yourself.",
      status: 403,
    };

  const existingMember = await prisma.usersAndCollections.findUnique({
    where: {
      userId_collectionId: { userId: memberId, collectionId },
    },
  });

  if (!existingMember)
    return { response: "Member not found in this collection.", status: 404 };

  await prisma.usersAndCollections.delete({
    where: {
      userId_collectionId: { userId: memberId, collectionId },
    },
  });

  return { status: 200, response: "Member removed from collection." };
}
