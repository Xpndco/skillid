import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const challengeProgress = pgTable(
  "challenge_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    realskillUserId: text("realskill_user_id").notNull(),
    skillPathSlug: text("skill_path_slug").notNull(),
    currentDay: integer("current_day").notNull().default(1),
    status: text("status").notNull().default("active"),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    userPathUnique: uniqueIndex("challenge_progress_user_path_idx").on(
      t.realskillUserId,
      t.skillPathSlug,
    ),
  }),
);

export type ChallengeProgress = typeof challengeProgress.$inferSelect;
export type NewChallengeProgress = typeof challengeProgress.$inferInsert;
