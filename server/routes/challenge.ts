import { Router, type Request, type Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { challengeProgress } from "../schema.js";
import { getPath, type SkillPath } from "../paths.js";
import { requireSession } from "../session.js";
import { layout, escapeHtml, renderStageBar } from "../views.js";
import { videoEmbedUrl } from "../urls.js";
import { currentStage } from "../entitlements.js";
import type { SessionClaims } from "../jwt.js";
import { config } from "../config.js";

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

export const challengeRouter = Router();

challengeRouter.use(requireSession);

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

  const totalDays = path.days.length;
  const completed = progress.status === "completed";
  const currentDay = completed ? totalDays : progress.currentDay;
  const completedCount = completed ? totalDays : currentDay - 1;
  const pct = Math.round((completedCount / totalDays) * 100);

  const dayItems = path.days
    .map((d) => {
      const isDone = completed || d.day < currentDay;
      const isCurrent = !completed && d.day === currentDay;
      const isLocked = !isDone && !isCurrent;

      const badge = isDone ? "✓" : String(d.day);

      if (isCurrent) {
        const embed = d.videoUrl ? videoEmbedUrl(d.videoUrl) : null;
        const videoBlock = embed
          ? `<div class="video"><iframe src="${escapeHtml(embed)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
          : "";
        return `<li class="day-card current">
          <div class="top">
            <div class="badge">${badge}</div>
            <div class="body">
              <p class="title">${escapeHtml(d.title)}</p>
              <p class="summary">${escapeHtml(d.summary)}</p>
            </div>
          </div>
          ${videoBlock}
          <div class="actions">
            <a class="cta btn-primary" href="${escapeHtml(d.realskillUrl)}" target="_blank" rel="noopener">${escapeHtml(d.ctaLabel)}</a>
            <form method="post" action="/challenge/${encodeURIComponent(slug)}/complete">
              <input type="hidden" name="day" value="${d.day}">
              <button class="cta btn-secondary" type="submit">Complete Day ${d.day}</button>
            </form>
          </div>
        </li>`;
      }

      const statusLabel = isDone ? "Complete" : "Locked";
      const cls = isDone ? "done" : "locked";
      return `<li class="day-card ${cls}">
        <div class="badge">${badge}</div>
        <div class="body">
          <p class="title">${escapeHtml(d.title)}</p>
          <p class="summary">${escapeHtml(d.summary)}</p>
        </div>
        <div class="status">${statusLabel}</div>
      </li>`;
    })
    .join("");

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

  const header = `
    <div class="challenge-header">
      <div class="progress-meta">
        <span class="label">Your progress</span>
        <span class="pct">${pct}%</span>
      </div>
      <p class="day-counter">${completed ? `Completed` : `Day ${currentDay} of ${totalDays}`}</p>
      <div class="progress-bar ${completed ? "complete" : ""}">
        <div class="fill" style="width: ${pct}%"></div>
      </div>
    </div>
  `;

  const body = `
    ${stageBar}
    <h1>${escapeHtml(path.title)}</h1>
    <p class="tagline">${escapeHtml(path.tagline)}</p>
    ${completionBlock}
    ${header}
    <ol class="days">${dayItems}</ol>
  `;
  res.type("html").send(layout(path.title + " — SkillID", body));
});

challengeRouter.post(
  "/:slug/complete",
  async (req: Request, res: Response) => {
    const slug = req.params.slug;
    const path = getPath(slug);
    if (!path) {
      res.status(404).send("Path not found");
      return;
    }

    const submittedDay = Number(req.body?.day);
    if (!Number.isInteger(submittedDay) || submittedDay < 1) {
      res.status(400).send("invalid day");
      return;
    }

    const progress = await loadProgress(req.session!.sub, slug);
    if (!progress) {
      res.redirect(302, `/gateway?path=${encodeURIComponent(slug)}`);
      return;
    }

    if (progress.status === "completed") {
      res.redirect(302, `/challenge/${encodeURIComponent(slug)}`);
      return;
    }

    if (submittedDay !== progress.currentDay) {
      res.redirect(302, `/challenge/${encodeURIComponent(slug)}`);
      return;
    }

    const nextDay = progress.currentDay + 1;
    const totalDays = path.days.length;
    const isFinished = nextDay > totalDays;

    await db
      .update(challengeProgress)
      .set({
        currentDay: isFinished ? totalDays : nextDay,
        status: isFinished ? "completed" : "active",
        completedAt: isFinished ? sql`now()` : null,
        lastActivityAt: sql`now()`,
      })
      .where(eq(challengeProgress.id, progress.id));

    res.redirect(302, `/challenge/${encodeURIComponent(slug)}`);
  },
);
