import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import getSavedSearches from "@/lib/api/controllers/savedSearches/getSavedSearches";
import postSavedSearch from "@/lib/api/controllers/savedSearches/postSavedSearch";
import { PostSavedSearchSchema } from "@linkwarden/lib/schemaValidation";

export default async function savedSearches(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  if (req.method === "GET") {
    const result = await getSavedSearches(user.id);
    return res.status(result.status).json({ response: result.response });
  }

  if (req.method === "POST") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const dataValidation = PostSavedSearchSchema.safeParse(req.body);

    if (!dataValidation.success) {
      return res.status(400).json({
        response: `Error: ${
          dataValidation.error.issues[0].message
        } [${dataValidation.error.issues[0].path.join(", ")}]`,
      });
    }

    const result = await postSavedSearch(user.id, dataValidation.data);
    return res.status(result.status).json({ response: result.response });
  }
}
