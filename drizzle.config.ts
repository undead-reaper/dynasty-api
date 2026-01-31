import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { serverEnv } from "./src/env/server";

export default defineConfig({
  schema: "./src/drizzle/schemas",
  out: "./src/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: serverEnv.DATABASE_URL,
  },
});
