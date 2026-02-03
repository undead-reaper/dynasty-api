import { matches } from "@/drizzle/schemas/matches";
import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";

export const commentaries = pgTable("commentaries", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .notNull()
    .references(() => matches.id),
  minute: integer("minute"),
  sequence: integer("sequence"),
  period: text("period"),
  eventType: text("event_type"),
  actor: text("actor"),
  team: text("team"),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}).enableRLS();

export const CommentarySelectSchema = createSelectSchema(commentaries);
export const CommentaryInsertSchema = createInsertSchema(commentaries);
export const CommentaryUpdateSchema = createUpdateSchema(commentaries);
