import { createEnv } from "@t3-oss/env-core";
import z from "zod";

export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.string(),
    PORT: z.string(),
    HOST: z.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
