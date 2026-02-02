import { db } from "@/drizzle";
import { commentaries } from "@/drizzle/schemas/commentaries";
import {
  createCommentarySchema,
  listCommentariesQuerySchema,
} from "@/validations/commentaries";
import { matchIdParamSchema } from "@/validations/matches";
import { desc, eq } from "drizzle-orm";
import { Router } from "express";

export const commentaryRouter = Router();
const MAX_LIMIT = 100;

commentaryRouter.get("/", async (req, res) => {
  const paramsResult = matchIdParamSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res
      .status(400)
      .json({ error: "Invalid match ID", details: paramsResult.error.issues });
  } else {
    const queryResult = listCommentariesQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: queryResult.error.issues,
      });
    } else {
      try {
        const { id: matchId } = paramsResult.data;
        const { limit = 10 } = queryResult.data;
        const safeLimit = Math.min(limit, MAX_LIMIT);
        const results = await db
          .select()
          .from(commentaries)
          .where(eq(commentaries.matchId, matchId))
          .orderBy(desc(commentaries.createdAt))
          .limit(safeLimit);
        return res.status(200).json({ commentaries: results });
      } catch (error) {
        console.error("Error fetching commentaries:", error);
        return res.status(500).json({ error: "Failed to fetch commentaries" });
      }
    }
  }
});

commentaryRouter.post("/", async (req, res) => {
  const paramsResult = matchIdParamSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res
      .status(400)
      .json({ error: "Invalid match ID", details: paramsResult.error.issues });
  } else {
    const bodyResult = createCommentarySchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        error: "Invalid commentary data",
        details: bodyResult.error.issues,
      });
    } else {
      try {
        const { ...rest } = bodyResult.data;
        const [result] = await db
          .insert(commentaries)
          .values({
            matchId: paramsResult.data.id,
            ...rest,
          })
          .returning();
        return res.status(201).json({ commentary: result });
      } catch (error) {
        console.error("Error creating commentary:", error);
        return res.status(500).json({ error: "Failed to create commentary" });
      }
    }
  }
});
