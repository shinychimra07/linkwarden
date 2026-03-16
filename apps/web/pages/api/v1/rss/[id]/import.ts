import { prisma } from "@linkwarden/prisma";
import verifyUser from "@/lib/api/verifyUser";
import { NextApiRequest, NextApiResponse } from "next";
import importRssItems from "@/lib/api/controllers/rss/importRssItems";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "POST") {
    if (process.env.NEXT_PUBLIC_DEMO === "true") {
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });
    }

    const rssId = Number(req.query.id);

    const rssSubscription = await prisma.rssSubscription.findUnique({
      where: { id: rssId },
      include: {
        collection: true,
      },
    });

    if (!rssSubscription) {
      return res.status(404).json({ response: "RSS subscription not found." });
    }

    if (rssSubscription.ownerId !== user.id) {
      return res.status(403).json({ response: "Permission denied." });
    }

    const autoTag = req.body.autoTag !== false;
    const maxItems = Math.min(Number(req.body.maxItems) || 50, 200);

    const result = await importRssItems(
      user.id,
      rssSubscription,
      autoTag,
      maxItems
    );

    return res.status(result.status).json({ response: result.response });
  }
}
