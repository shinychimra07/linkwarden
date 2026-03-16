import { prisma } from "@linkwarden/prisma";

export default async function getSharedLink(token: string) {
  if (!token) return { response: "Share token is required.", status: 400 };

  const link = await prisma.link.findUnique({
    where: { shareToken: token },
    include: {
      collection: { select: { id: true, name: true, color: true, icon: true } },
      tags: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, username: true, image: true } },
    },
  });

  if (!link || !link.isShared) {
    return { response: "Shared link not found or sharing has been revoked.", status: 404 };
  }

  return {
    response: {
      id: link.id,
      name: link.name,
      url: link.url,
      description: link.description,
      type: link.type,
      icon: link.icon,
      color: link.color,
      preview: link.preview,
      collection: link.collection,
      tags: link.tags,
      createdBy: link.createdBy,
      sharedAt: link.sharedAt,
      createdAt: link.createdAt,
    },
    status: 200,
  };
}
