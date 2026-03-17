import { prisma } from "@linkwarden/prisma";
import { UsersAndCollections } from "@linkwarden/prisma/client";
import getPermission from "@/lib/api/getPermission";
import { z } from "zod";

const UpdateNotesSchema = z.object({
  notes: z.string().max(10000),
});

export default async function updateNotesForLink(
  userId: number,
  linkId: number,
  body: unknown
) {
  const dataValidation = UpdateNotesSchema.safeParse(body);

  if (!dataValidation.success) {
    return {
      response: `Error: ${
        dataValidation.error.issues[0].message
      } [${dataValidation.error.issues[0].path.join(", ")}]`,
      status: 400,
    };
  }

  if (!linkId)
    return {
      response: "Please choose a valid link.",
      status: 401,
    };

  const collectionIsAccessible = await getPermission({ userId, linkId });

  const memberHasAccess = collectionIsAccessible?.members.some(
    (e: UsersAndCollections) => e.userId === userId && e.canUpdate
  );

  const isCollectionOwner = collectionIsAccessible?.ownerId === userId;

  if (!isCollectionOwner && !memberHasAccess)
    return {
      response: "Collection is not accessible.",
      status: 401,
    };

  const updatedLink = await prisma.link.update({
    where: { id: linkId },
    data: { notes: dataValidation.data.notes },
    select: { id: true, notes: true, updatedAt: true },
  });

  return {
    response: {
      linkId: updatedLink.id,
      notes: updatedLink.notes,
      updatedAt: updatedLink.updatedAt,
    },
    status: 200,
  };
}
