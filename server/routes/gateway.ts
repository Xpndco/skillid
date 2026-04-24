import { Router, type Request, type Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db.js";
import { challengeProgress } from "../schema.js";
import { getPath } from "../paths.js";
import { requireSession, setSessionCookie } from "../session.js";
import { checkPathAccess } from "../entitlements.js";
import { grantSkillIdAccessViaHub } from "../hub.js";

export const gatewayRouter = Router();

gatewayRouter.get(
  "/",
  requireSession,
  async (req: Request, res: Response) => {
    const slug = typeof req.query.path === "string" ? req.query.path : null;
    if (!slug) {
      res.status(400).send("missing path");
      return;
    }

    const path = getPath(slug);
    if (!path) {
      res.status(404).send("unknown path");
      return;
    }

    const session = req.session!;
    const decision = checkPathAccess(session, path);

    if (decision.kind === "blocked") {
      res.redirect(302, `/paths/${encodeURIComponent(slug)}?access=blocked`);
      return;
    }

    if (decision.kind === "free_claim") {
      const grant = await grantSkillIdAccessViaHub(session, path);
      if (!grant.ok) {
        console.error("[gateway] hub grant failed:", grant.error);
        res.redirect(
          302,
          `/paths/${encodeURIComponent(slug)}?access=grant_failed`,
        );
        return;
      }
      const existingOwned = Array.isArray(session.ownedSkillIds)
        ? session.ownedSkillIds
        : [];
      const newOwned = [...existingOwned, slug];
      setSessionCookie(res, {
        sub: session.sub,
        email: session.email,
        access_state: session.access_state ?? "none",
        freeSkillIdClaimed: true,
        ownedSkillIds: newOwned,
      });
      session.freeSkillIdClaimed = true;
      session.ownedSkillIds = newOwned;
    }

    const existing = await db
      .select()
      .from(challengeProgress)
      .where(
        and(
          eq(challengeProgress.realskillUserId, session.sub),
          eq(challengeProgress.skillPathSlug, slug),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(challengeProgress).values({
        realskillUserId: session.sub,
        skillPathSlug: slug,
      });
    }

    res.redirect(302, `/challenge/${encodeURIComponent(slug)}`);
  },
);
