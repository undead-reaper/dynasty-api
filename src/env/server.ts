import { createEnv } from "@t3-oss/env-core";
import z from "zod";

export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.string(),
    PORT: z.string(),
    HOST: z.string(),
    ARCJET_KEY: z.string(),
    ARCJET_ENV: z.enum(["development", "production", "staging"]),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
