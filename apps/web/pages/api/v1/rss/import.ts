import { prisma } from "@linkwarden/prisma";
import setCollection from "@/lib/api/setCollection";
import verifyUser from "@/lib/api/verifyUser";
import {
  PostRssSubscriptionSchema,
  RssImportSchema,
} from "@linkwarden/lib/schemaValidation";
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

    const subscriptionValidation = PostRssSubscriptionSchema.safeParse(
      req.body
    );

    if (!subscriptionValidation.success) {
      return res.status(400).json({
        response: `Error: ${
          subscriptionValidation.error.issues[0].message
        } [${subscriptionValidation.error.issues[0].path.join(", ")}]`,
      });
    }

    const importValidation = RssImportSchema.safeParse(req.body);
    const importOptions = importValidation.success
      ? importValidation.data
      : { autoTag: true, maxItems: 50 };

    const { name, url, collectionId, collectionName } =
      subscriptionValidation.data;

    const rssSubscriptionCount = await prisma.rssSubscription.count({
      where: { ownerId: user.id },
    });

    const RSS_SUBSCRIPTION_LIMIT_PER_USER =
      Number(process.env.RSS_SUBSCRIPTION_LIMIT_PER_USER) || 20;

    if (rssSubscriptionCount >= RSS_SUBSCRIPTION_LIMIT_PER_USER) {
      return res.status(403).json({
        response: `You have reached the limit of ${RSS_SUBSCRIPTION_LIMIT_PER_USER} RSS subscriptions.`,
      });
    }

    const linkCollection = await setCollection({
      userId: user.id,
      collectionId,
      collectionName,
    });

    if (!linkCollection) {
      return res.status(403).json({
        response:
          "You do not have permission to add a link to this collection.",
      });
    }

    const existingRssSubscription = await prisma.rssSubscription.findFirst({
      where: { name, ownerId: user.id },
    });

    if (existingRssSubscription) {
      return res
        .status(400)
        .json({ response: "RSS Subscription with that name already exists." });
    }

    const rssSubscription = await prisma.rssSubscription.create({
      data: {
        name,
        url,
        ownerId: user.id,
        collection: { connect: { id: linkCollection.id } },
      },
      include: { collection: true },
    });

    const importResult = await importRssItems(
      user.id,
      rssSubscription,
      importOptions.autoTag,
      importOptions.maxItems
    );

    return res.status(importResult.status).json({
      response: {
        subscription: {
          id: rssSubscription.id,
          name: rssSubscription.name,
          url: rssSubscription.url,
          collectionId: rssSubscription.collectionId,
        },
        import: importResult.response,
      },
    });
  }
}
