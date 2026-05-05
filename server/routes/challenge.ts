import { Router, type Request, type Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db.js";
import { challengeProgress } from "../schema.js";
import { getPath, type SkillPath } from "../paths.js";
import { requireSession } from "../session.js";
import { layout, escapeHtml, renderStageBar } from "../views.js";
import { currentStage } from "../entitlements.js";
import type { SessionClaims } from "../jwt.js";
import { config } from "../config.js";

export const challengeRouter = Router();

challengeRouter.use(requireSession);

interface CompletionMessage {
  headline: string;
  ctaLabel: string;
  ctaHref: string;
}

function completionMessage(
  session: SessionClaims,
  path: SkillPath,
): CompletionMessage {
  if (session.access_state === "trial" && path.isOnboarding) {
    return {
      headline: "You've found your starting point.",
      ctaLabel: "Start your guided training",
      ctaHref: config.realskillReactivateUrl,
    };
  }
  if (session.access_state === "trial") {
    return {
      headline: "You've completed your first Skill ID.",
      ctaLabel: "Build your full system",
      ctaHref: config.realskillReactivateUrl,
    };
  }
  if (session.access_state === "member") {
    return {
      headline: "You've completed this Skill ID.",
      ctaLabel: "Choose your next Skill Path",
      ctaHref: config.realskillReactivateUrl,
    };
  }
  return {
    headline: "You've completed your free Skill Path.",
    ctaLabel: "Keep building your system",
    ctaHref: config.realskillReactivateUrl,
  };
}

async function loadProgress(userId: string, slug: string) {
  const rows = await db
    .select()
    .from(challengeProgress)
    .where(
      and(
        eq(challengeProgress.realskillUserId, userId),
        eq(challengeProgress.skillPathSlug, slug),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

const METHOD_STEPS_HTML = `
  <ol class="method-steps">
    <li><strong>Open the first item.</strong> Tap the first video in the checklist.</li>
    <li><strong>Watch it.</strong> Pay attention to the cues and what you're being asked to do.</li>
    <li><strong>Do it.</strong> Follow the suggested time on screen &mdash; usually 10 to 20 minutes.</li>
    <li><strong>Check it off when you're done.</strong></li>
    <li>
      <strong>Answer the question: Does this need more work?</strong>
      <ul>
        <li><strong>Yes</strong> &rarr; it goes to your Needs Work folder. "Needs work" just means you're bad at it right now. If you're okay at it, you don't need to flag it.</li>
        <li><strong>No</strong> &rarr; mark it complete and move on.</li>
      </ul>
    </li>
    <li><strong>Star it if you want.</strong> Star anything at any time &mdash; favorites, fun ones, or stuff you just want to revisit. Starred items are ones you'll come back to a few times along the way.</li>
    <li><strong>Move to the next item.</strong> Same loop: watch, do it (10&ndash;20 min), check off, answer the question.</li>
    <li><strong>After every 3&ndash;4 items, swing back to your Needs Work folder and redo one.</strong> This is how you actually fix the weak spots instead of just collecting them.</li>
    <li><strong>Keep cycling.</strong> New item &rarr; new item &rarr; new item &rarr; loop back to Needs Work &rarr; repeat. Hit your starred ones when you're drawn to them.</li>
    <li><strong>You're done when all 13 (or however many) are checked off.</strong> That's a completed Skill ID.</li>
  </ol>
`;

challengeRouter.get("/:slug", async (req: Request, res: Response) => {
  const slug = req.params.slug;
  const path = getPath(slug);
  if (!path) {
    res.status(404).send("Path not found");
    return;
  }

  const progress = await loadProgress(req.session!.sub, slug);
  if (!progress) {
    res.redirect(302, `/gateway?path=${encodeURIComponent(slug)}`);
    return;
  }

  const completed = progress.status === "completed";

  const stageBar = renderStageBar(
    currentStage(req.session, completed ? "completed" : "active"),
  );

  const completionBlock = completed
    ? (() => {
        const msg = completionMessage(req.session!, path);
        return `<div class="completion-block">
          <h2>${escapeHtml(msg.headline)}</h2>
          <p><a class="cta btn-primary" href="${escapeHtml(msg.ctaHref)}">${escapeHtml(msg.ctaLabel)}</a></p>
        </div>`;
      })()
    : "";

  const trainUrl =
    path.days[0]?.realskillUrl ??
    "https://app.possibletraining.com/dashboard/skill-id";
  const trainCta = `<a class="cta btn-primary cta-train" href="${escapeHtml(trainUrl)}" target="_blank" rel="noopener">Train Inside RealSkill</a>`;

  const body = `
    ${stageBar}
    <h1>${escapeHtml(path.title)}</h1>
    <p class="tagline">${escapeHtml(path.tagline)}</p>
    ${completionBlock}

    <div class="method-intro">
      A Skill ID is a series of training items (around 13). Your job is to work through them in order, with built-in loops back to the items you struggled with. All of the training and marking happens inside RealSkill.
    </div>

    <p>${trainCta}</p>

    <div class="method-card">
      <h2>How to Complete a Skill ID</h2>
      ${METHOD_STEPS_HTML}
    </div>

    <p>${trainCta}</p>
  `;

  res.type("html").send(layout(path.title + " — SkillID", body));
});
