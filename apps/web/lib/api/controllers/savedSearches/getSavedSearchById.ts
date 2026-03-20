import { prisma } from "@linkwarden/prisma";

export default async function getSavedSearchById(
  userId: number,
  savedSearchId: number
) {
  if (!savedSearchId)
    return { response: "Please choose a valid saved search.", status: 400 };

  const savedSearch = await prisma.savedSearch.findFirst({
    where: {
      id: savedSearchId,
      ownerId: userId,
    },
    include: {
      collection: {
        select: { id: true, name: true, color: true },
      },
      tags: {
        select: { id: true, name: true },
      },
    },
  });

  if (!savedSearch) {
    return { response: "Saved search not found.", status: 404 };
  }

  return { response: savedSearch, status: 200 };
}
