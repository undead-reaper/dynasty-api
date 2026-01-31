import { db } from "@/drizzle";
import { matches } from "@/drizzle/schemas/matches";
import { getMatchStatus } from "@/utils/match-status";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "@/validations/matches";
import { desc } from "drizzle-orm";
import { Router } from "express";

export const matchRouter = Router();

const MAX_LIMIT = 100;

matchRouter.get("/", async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid query parameters.",
      details: parsed.error.issues,
    });
  } else {
    const limit = Math.min(parsed.data.limit || 50, MAX_LIMIT);
    try {
      const data = await db
        .select()
        .from(matches)
        .orderBy(desc(matches.createdAt))
        .limit(limit);

      return res.status(200).json({ data });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to fetch matches.",
        details: JSON.stringify(error),
      });
    }
  }
});

matchRouter.post("/", async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid Payload.",
      details: parsed.error.issues,
    });
  } else {
    const {
      startTime,
      endTime,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      sport,
    } = parsed.data;
    try {
      const status = getMatchStatus({
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      });

      const matchInsert = {
        sport: sport,
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: status as "scheduled" | "live" | "finished",
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      };

      const [event] = await db.insert(matches).values(matchInsert).returning();
      return res.status(201).json({ data: event });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to create match.",
        details: JSON.stringify(error),
      });
    }
  }
});
