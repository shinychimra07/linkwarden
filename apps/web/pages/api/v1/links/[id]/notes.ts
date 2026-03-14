import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import getNotesForLink from "@/lib/api/controllers/links/linkId/notes/getNotesForLink";
import updateNotesForLink from "@/lib/api/controllers/links/linkId/notes/updateNotesForLink";

export default async function notes(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  const linkId = Number(req.query.id);

  if (req.method === "GET") {
    const result = await getNotesForLink(user.id, linkId);
    return res.status(result.status).json({ response: result.response });
  } else if (req.method === "PUT") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const result = await updateNotesForLink(user.id, linkId, req.body);
    return res.status(result.status).json({ response: result.response });
  }
}
