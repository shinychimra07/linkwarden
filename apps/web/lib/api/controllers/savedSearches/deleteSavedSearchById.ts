import { prisma } from "@linkwarden/prisma";

export default async function deleteSavedSearchById(
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
  });

  if (!savedSearch) {
    return { response: "Saved search not found.", status: 404 };
  }

  await prisma.savedSearch.delete({
    where: { id: savedSearchId },
  });

  return { response: savedSearch.id, status: 200 };
}
