import { prisma } from "@linkwarden/prisma";
import { UpdateSavedSearchSchemaType } from "@linkwarden/lib/schemaValidation";

export default async function updateSavedSearchById(
  userId: number,
  savedSearchId: number,
  body: UpdateSavedSearchSchemaType
) {
  if (!savedSearchId)
    return { response: "Please choose a valid saved search.", status: 400 };

  const existingSavedSearch = await prisma.savedSearch.findFirst({
    where: {
      id: savedSearchId,
      ownerId: userId,
    },
  });

  if (!existingSavedSearch) {
    return { response: "Saved search not found.", status: 404 };
  }

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

  if (body.name && body.name !== existingSavedSearch.name) {
    const duplicate = await prisma.savedSearch.findFirst({
      where: {
        name: body.name,
        ownerId: userId,
        id: { not: savedSearchId },
      },
    });

    if (duplicate) {
      return { response: "A saved search with that name already exists.", status: 400 };
    }
  }

  const savedSearch = await prisma.savedSearch.update({
    where: { id: savedSearchId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.icon !== undefined && { icon: body.icon }),
      ...(body.searchQuery !== undefined && { searchQuery: body.searchQuery }),
      ...(body.collectionId !== undefined && {
        collectionId: body.collectionId ?? null,
      }),
      ...(body.sortBy !== undefined && { sortBy: body.sortBy }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      ...(body.tagIds !== undefined && {
        tags: {
          set: body.tagIds.map((id) => ({ id })),
        },
      }),
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
