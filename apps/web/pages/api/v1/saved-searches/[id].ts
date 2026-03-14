import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";
import getSavedSearchById from "@/lib/api/controllers/savedSearches/getSavedSearchById";
import updateSavedSearchById from "@/lib/api/controllers/savedSearches/updateSavedSearchById";
import deleteSavedSearchById from "@/lib/api/controllers/savedSearches/deleteSavedSearchById";
import { UpdateSavedSearchSchema } from "@linkwarden/lib/schemaValidation";

export default async function savedSearch(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  const savedSearchId = Number(req.query.id);

  if (req.method === "GET") {
    const result = await getSavedSearchById(user.id, savedSearchId);
    return res.status(result.status).json({ response: result.response });
  }

  if (req.method === "PUT") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const dataValidation = UpdateSavedSearchSchema.safeParse(req.body);

    if (!dataValidation.success) {
      return res.status(400).json({
        response: `Error: ${
          dataValidation.error.issues[0].message
        } [${dataValidation.error.issues[0].path.join(", ")}]`,
      });
    }

    const result = await updateSavedSearchById(
      user.id,
      savedSearchId,
      dataValidation.data
    );
    return res.status(result.status).json({ response: result.response });
  }

  if (req.method === "DELETE") {
    if (process.env.NEXT_PUBLIC_DEMO === "true")
      return res.status(400).json({
        response:
          "This action is disabled because this is a read-only demo of Linkwarden.",
      });

    const result = await deleteSavedSearchById(user.id, savedSearchId);
    return res.status(result.status).json({ response: result.response });
  }
}
