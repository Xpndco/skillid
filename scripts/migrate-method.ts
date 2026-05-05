/**
 * One-off backfill for the Skill ID Method migration.
 *
 * Existing rows in challenge_progress predate the `marks` field. Under the
 * old day-based model, a row with current_day = N implied items 1..N-1 were
 * "completed." Under the Method, completion means an item was explicitly
 * marked "got_it." This script seeds `marks` for existing users so their
 * dashboards reflect their prior progress.
 *
 * Run once after `npm run db:push` adds the columns:
 *   npm run migrate-method
 *
 * Idempotent: only updates rows where marks is still {} (default).
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const TOTAL_ITEMS_PER_PATH = 10;

async function backfill() {
  const completedFill: Record<string, "got_it"> = {};
  for (let i = 1; i <= TOTAL_ITEMS_PER_PATH; i++) {
    completedFill[String(i)] = "got_it";
  }

  const completedRes = await sql`
    UPDATE challenge_progress
    SET marks = ${JSON.stringify(completedFill)}::jsonb
    WHERE status = 'completed'
      AND marks = '{}'::jsonb
    RETURNING id
  `;
  console.log(`[migrate-method] backfilled ${completedRes.length} completed rows`);

  const activeRows = await sql`
    SELECT id, current_day
    FROM challenge_progress
    WHERE status = 'active'
      AND current_day > 1
      AND marks = '{}'::jsonb
  `;

  for (const row of activeRows as Array<{ id: string; current_day: number }>) {
    const fill: Record<string, "got_it"> = {};
    for (let i = 1; i < row.current_day; i++) {
      fill[String(i)] = "got_it";
    }
    await sql`
      UPDATE challenge_progress
      SET marks = ${JSON.stringify(fill)}::jsonb
      WHERE id = ${row.id}
    `;
  }
  console.log(`[migrate-method] backfilled ${activeRows.length} active rows`);

  const remaining = await sql`
    SELECT COUNT(*)::int AS count
    FROM challenge_progress
    WHERE marks = '{}'::jsonb
  `;
  console.log(
    `[migrate-method] rows still with empty marks (no prior progress): ${(remaining as Array<{ count: number }>)[0]?.count ?? 0}`,
  );
}

backfill()
  .then(() => {
    console.log("[migrate-method] done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[migrate-method] failed:", err);
    process.exit(1);
  });
