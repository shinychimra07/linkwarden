import type { NextApiRequest, NextApiResponse } from "next";
import getSharedLink from "@/lib/api/controllers/public/links/getSharedLink";

export default async function sharedLink(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const result = await getSharedLink(req.query.token as string);
    return res.status(result.status).json({ response: result.response });
  }

  return res.status(405).json({ response: "Method not allowed." });
}
