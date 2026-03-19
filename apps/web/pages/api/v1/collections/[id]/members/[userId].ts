import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import updateCollectionMember from "@/lib/api/controllers/collections/collectionId/members/updateCollectionMember";
import removeCollectionMember from "@/lib/api/controllers/collections/collectionId/members/removeCollectionMember";

export default async function collectionMember(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  const collectionId = Number(req.query.id);
  const memberId = Number(req.query.userId);

  if (req.method === "PUT") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const result = await updateCollectionMember(
      user.id,
      collectionId,
      memberId,
      req.body
    );
    return res.status(result.status).json({ response: result.response });
  }

  if (req.method === "DELETE") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const result = await removeCollectionMember(
      user.id,
      collectionId,
      memberId
    );
    return res.status(result.status).json({ response: result.response });
  }
}
