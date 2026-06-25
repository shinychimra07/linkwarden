import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import getCollectionMembers from "@/lib/api/controllers/collections/collectionId/members/getCollectionMembers";

export default async function collectionMembers(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  const collectionId = Number(req.query.id);

  if (req.method === "GET") {
    const result = await getCollectionMembers(user.id, collectionId);
    return res.status(result.status).json({ response: result.response });
  }
}
