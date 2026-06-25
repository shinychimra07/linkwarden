import { prisma } from "@linkwarden/prisma";

export default async function getSavedSearches(userId: number) {
  const savedSearches = await prisma.savedSearch.findMany({
    where: {
      ownerId: userId,
    },
    include: {
      collection: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      tags: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return { response: savedSearches, status: 200 };
}
