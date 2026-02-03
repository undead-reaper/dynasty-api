import { serverEnv } from "@/env/server";
import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";
import type { NextFunction, Request, Response } from "express";

const arcjetKey = serverEnv.ARCJET_KEY;
const arcjetMode = serverEnv.ARCJET_ENV === "production" ? "DRY_RUN" : "LIVE";

export const httpArcjet = arcjet({
  key: arcjetKey,
  rules: [
    shield({ mode: arcjetMode }),
    detectBot({
      mode: arcjetMode,
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
    }),
    slidingWindow({
      mode: arcjetMode,
      max: 50,
      interval: "10s",
    }),
  ],
});

export const wsArcjet = arcjet({
  key: arcjetKey,
  rules: [
    shield({ mode: arcjetMode }),
    detectBot({
      mode: arcjetMode,
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
    }),
    slidingWindow({
      mode: arcjetMode,
      max: 5,
      interval: "2s",
    }),
  ],
});

export const securityMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const decision = await httpArcjet.protect(req);
      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return res.status(429).json({ message: "Too Many Requests" });
        } else {
          return res.status(403).json({ message: "Forbidden" });
        }
      } else {
        next();
      }
    } catch (error) {
      console.error("Arcjet error:", error);
      return res.status(503).json({ message: "Service Unavailable" });
    }
  };
};
