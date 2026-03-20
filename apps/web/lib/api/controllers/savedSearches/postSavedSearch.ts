import { prisma } from "@linkwarden/prisma";
import { PostSavedSearchSchemaType } from "@linkwarden/lib/schemaValidation";

export default async function postSavedSearch(
  userId: number,
  body: PostSavedSearchSchemaType
) {
  if (body.collectionId) {
    const collection = await prisma.collection.findFirst({
      where: {
        id: body.collectionId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    });

    if (!collection) {
      return { response: "Collection not found or not accessible.", status: 403 };
    }
  }

  if (body.tagIds && body.tagIds.length > 0) {
    const tagCount = await prisma.tag.count({
      where: {
        id: { in: body.tagIds },
        ownerId: userId,
      },
    });

    if (tagCount !== body.tagIds.length) {
      return { response: "One or more tags not found.", status: 400 };
    }
  }

  const existingSavedSearch = await prisma.savedSearch.findFirst({
    where: {
      name: body.name,
      ownerId: userId,
    },
  });

  if (existingSavedSearch) {
    return { response: "A saved search with that name already exists.", status: 400 };
  }

  const savedSearch = await prisma.savedSearch.create({
    data: {
      name: body.name,
      description: body.description || "",
      searchQuery: body.searchQuery || "",
      collectionId: body.collectionId || null,
      sortBy: body.sortBy || "createdAt",
      sortOrder: body.sortOrder || "desc",
      ownerId: userId,
      ...(body.tagIds && body.tagIds.length > 0
        ? { tags: { connect: body.tagIds.map((id) => ({ id })) } }
        : {}),
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

  return { response: savedSearch, status: 200 };
}
