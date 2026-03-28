import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import createShareLink from "@/lib/api/controllers/links/linkId/share/createShareLink";
import revokeShareLink from "@/lib/api/controllers/links/linkId/share/revokeShareLink";
import getShareLink from "@/lib/api/controllers/links/linkId/share/getShareLink";

export default async function share(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  const linkId = Number(req.query.id);

  if (req.method === "GET") {
    const result = await getShareLink(user.id, linkId);
    return res.status(result.status).json({ response: result.response });
  } else if (req.method === "POST") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response: "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const result = await createShareLink(user.id, linkId);
    return res.status(result.status).json({ response: result.response });
  } else if (req.method === "DELETE") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response: "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const result = await revokeShareLink(user.id, linkId);
    return res.status(result.status).json({ response: result.response });
  }
}

