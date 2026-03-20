import { prisma } from "@linkwarden/prisma";
import getPermission from "@/lib/api/getPermission";

type UpdateMemberBody = {
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
};

export default async function updateCollectionMember(
  userId: number,
  collectionId: number,
  memberId: number,
  body: UpdateMemberBody
) {
  if (!collectionId || !memberId)
    return { response: "Invalid collection or member ID.", status: 400 };

  const collectionIsAccessible = await getPermission({ userId, collectionId });

  if (!(collectionIsAccessible?.ownerId === userId))
    return {
      response: "Only the collection owner can manage member permissions.",
      status: 403,
    };

  if (memberId === userId)
    return { response: "Cannot modify your own permissions.", status: 400 };

  const existingMember = await prisma.usersAndCollections.findUnique({
    where: {
      userId_collectionId: { userId: memberId, collectionId },
    },
  });

  if (!existingMember)
    return { response: "Member not found in this collection.", status: 404 };

  const updated = await prisma.usersAndCollections.update({
    where: {
      userId_collectionId: { userId: memberId, collectionId },
    },
    data: {
      ...(body.canCreate !== undefined && { canCreate: body.canCreate }),
      ...(body.canUpdate !== undefined && { canUpdate: body.canUpdate }),
      ...(body.canDelete !== undefined && { canDelete: body.canDelete }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
  });

  return {
    status: 200,
    response: {
      userId: updated.userId,
      canCreate: updated.canCreate,
      canUpdate: updated.canUpdate,
      canDelete: updated.canDelete,
      user: updated.user,
    },
  };
}
