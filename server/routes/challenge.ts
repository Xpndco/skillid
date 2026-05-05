import { Router, type Request, type Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import {
  challengeProgress,
  type ItemMarks,
  type MarkValue,
} from "../schema.js";
import { getPath, type SkillPath, type SkillPathDay } from "../paths.js";
import { requireSession } from "../session.js";
import { layout, escapeHtml, renderStageBar } from "../views.js";
import { videoEmbedUrl } from "../urls.js";
import { currentStage } from "../entitlements.js";
import type { SessionClaims } from "../jwt.js";
import { config } from "../config.js";
import { emitHubEvent } from "../hub.js";

export const challengeRouter = Router();

challengeRouter.use(requireSession);

interface MarkState {
  gotIt: number[];
  needsWork: number[];
  open: number[]; // includes "not_yet" and untouched
  itemsCompleted: number;
  totalItems: number;
}

function readMarkState(marks: ItemMarks, totalItems: number): MarkState {
  const gotIt: number[] = [];
  const needsWork: number[] = [];
  const open: number[] = [];
  for (let i = 1; i <= totalItems; i++) {
    const mark = marks[String(i)];
    if (mark === "got_it") gotIt.push(i);
    else if (mark === "needs_work") needsWork.push(i);
    else open.push(i);
  }
  return {
    gotIt,
    needsWork,
    open,
    itemsCompleted: gotIt.length,
    totalItems,
  };
}

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

function statusBadge(state: MarkState, item: number): {
  label: string;
  cls: string;
  icon: string;
} {
  if (state.gotIt.includes(item)) {
    return { label: "Got it", cls: "got", icon: "✓" };
  }
  if (state.needsWork.includes(item)) {
    return { label: "Needs Work", cls: "needs", icon: "•" };
  }
  return { label: "Open", cls: "open", icon: String(item) };
}

function itemRow(slug: string, day: SkillPathDay, badge: ReturnType<typeof statusBadge>, action: string): string {
  return `<a class="item-row item-${badge.cls}" href="/challenge/${encodeURIComponent(slug)}/items/${day.day}">
    <span class="item-badge" aria-hidden="true">${badge.icon}</span>
    <span class="item-body">
      <span class="item-num">Item ${day.day}</span>
      <span class="item-title">${escapeHtml(day.title)}</span>
    </span>
    <span class="item-action">${action}</span>
  </a>`;
}

function progressBarSegments(state: MarkState): string {
  const segs: string[] = [];
  for (let i = 1; i <= state.totalItems; i++) {
    let cls = "seg-untouched";
    if (state.gotIt.includes(i)) cls = "seg-got";
    else if (state.needsWork.includes(i)) cls = "seg-needs";
    segs.push(`<span class="seg ${cls}"></span>`);
  }
  return segs.join("");
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

  const totalItems = path.days.length;
  const state = readMarkState(progress.marks ?? {}, totalItems);
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

  const progressBand = `
    <div class="progress-band">
      <div class="progress-counts">
        <strong>${state.itemsCompleted} of ${totalItems} items</strong>
        ${state.needsWork.length > 0 ? ` &middot; ${state.needsWork.length} in Needs Work` : ""}
      </div>
      <div class="progress-bar-tri" aria-hidden="true">${progressBarSegments(state)}</div>
    </div>
  `;

  let nextCard = "";
  if (!completed) {
    if (state.open.length > 0) {
      const nextNum = state.open[0]!;
      const nextDay = path.days.find((d) => d.day === nextNum);
      if (nextDay) {
        nextCard = `
          <div class="next-card">
            <div class="next-label">Next</div>
            <div class="next-title">Item ${nextDay.day}: ${escapeHtml(nextDay.title)}</div>
            <p class="next-summary">${escapeHtml(nextDay.summary)}</p>
            <p><a class="cta btn-primary" href="/challenge/${encodeURIComponent(slug)}/items/${nextDay.day}">Start this item</a></p>
          </div>
        `;
      }
    } else if (state.needsWork.length > 0) {
      const reNum = state.needsWork[0]!;
      const reDay = path.days.find((d) => d.day === reNum);
      if (reDay) {
        nextCard = `
          <div class="next-card">
            <div class="next-label">Next</div>
            <div class="next-title">Re-train Item ${reDay.day}: ${escapeHtml(reDay.title)}</div>
            <p class="next-summary">Every item you've started is marked. Re-train items in Needs Work until they're locked in.</p>
            <p><a class="cta btn-primary" href="/challenge/${encodeURIComponent(slug)}/items/${reDay.day}">Re-train this item</a></p>
          </div>
        `;
      }
    }
  }

  const groups: string[] = [];
  if (state.needsWork.length > 0) {
    const rows = state.needsWork
      .map((n) => path.days.find((d) => d.day === n))
      .filter((d): d is SkillPathDay => !!d)
      .map((d) => itemRow(slug, d, statusBadge(state, d.day), "Re-train"))
      .join("");
    groups.push(`<div class="item-group">
      <div class="item-group-label">Needs Work &middot; ${state.needsWork.length}</div>
      ${rows}
    </div>`);
  }
  if (state.open.length > 0) {
    const rows = state.open
      .map((n) => path.days.find((d) => d.day === n))
      .filter((d): d is SkillPathDay => !!d)
      .map((d) => itemRow(slug, d, statusBadge(state, d.day), "Start"))
      .join("");
    groups.push(`<div class="item-group">
      <div class="item-group-label">Open &middot; ${state.open.length}</div>
      ${rows}
    </div>`);
  }
  if (state.gotIt.length > 0) {
    const rows = state.gotIt
      .map((n) => path.days.find((d) => d.day === n))
      .filter((d): d is SkillPathDay => !!d)
      .map((d) => itemRow(slug, d, statusBadge(state, d.day), "Re-visit"))
      .join("");
    groups.push(`<div class="item-group">
      <div class="item-group-label">Got It &middot; ${state.gotIt.length}</div>
      ${rows}
    </div>`);
  }

  const body = `
    ${stageBar}
    <h1>${escapeHtml(path.title)}</h1>
    <p class="tagline">${escapeHtml(path.tagline)}</p>
    ${completionBlock}
    ${progressBand}
    ${nextCard}
    <div class="item-list">${groups.join("")}</div>
  `;
  res.type("html").send(layout(path.title + " — SkillID", body));
});

challengeRouter.get(
  "/:slug/items/:n",
  async (req: Request, res: Response) => {
    const slug = req.params.slug;
    const path = getPath(slug);
    if (!path) {
      res.status(404).send("Path not found");
      return;
    }

    const n = Number(req.params.n);
    if (!Number.isInteger(n) || n < 1 || n > path.days.length) {
      res.status(404).send("Item not found");
      return;
    }

    const day = path.days.find((d) => d.day === n);
    if (!day) {
      res.status(404).send("Item not found");
      return;
    }

    const progress = await loadProgress(req.session!.sub, slug);
    if (!progress) {
      res.redirect(302, `/gateway?path=${encodeURIComponent(slug)}`);
      return;
    }

    const totalItems = path.days.length;
    const state = readMarkState(progress.marks ?? {}, totalItems);
    const currentMark = (progress.marks ?? {})[String(n)];

    const embed = day.videoUrl ? videoEmbedUrl(day.videoUrl) : null;
    const videoBlock = embed
      ? `<div class="video"><iframe src="${escapeHtml(embed)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
      : "";

    const trainCta = `<a class="cta btn-primary" href="${escapeHtml(day.realskillUrl)}" target="_blank" rel="noopener">${escapeHtml(day.ctaLabel)}</a>`;

    const currentMarkLabel = currentMark
      ? currentMark === "got_it"
        ? `<span class="current-mark mark-got">Currently marked: Got it</span>`
        : currentMark === "needs_work"
          ? `<span class="current-mark mark-needs">Currently marked: Needs Work</span>`
          : `<span class="current-mark mark-not-yet">Currently marked: Not yet</span>`
      : "";

    const body = `
      <p><a class="back-link" href="/challenge/${encodeURIComponent(slug)}">&larr; Back to Skill ID</a></p>
      <p class="item-num-label">Item ${day.day} of ${totalItems} &middot; ${state.itemsCompleted} locked in so far</p>
      <h1>${escapeHtml(day.title)}</h1>
      <p class="tagline">${escapeHtml(day.summary)}</p>
      ${videoBlock}
      <div class="item-actions">
        <p class="train-instruction">Train this for 10&ndash;20 minutes inside RealSkill. When you're done, mark it.</p>
        <p>${trainCta}</p>
      </div>
      <form class="mark-form" method="post" action="/challenge/${encodeURIComponent(slug)}/items/${day.day}/mark">
        <p class="mark-prompt">After training, mark it:</p>
        <div class="mark-buttons">
          <button type="submit" name="mark" value="got_it" class="cta btn-mark mark-got">Got it</button>
          <button type="submit" name="mark" value="needs_work" class="cta btn-mark mark-needs">Needs Work</button>
          <button type="submit" name="mark" value="not_yet" class="cta btn-mark mark-not-yet">Not yet</button>
        </div>
        ${currentMarkLabel}
      </form>
    `;
    res.type("html").send(layout(day.title + " — SkillID", body));
  },
);

challengeRouter.post(
  "/:slug/items/:n/mark",
  async (req: Request, res: Response) => {
    const slug = req.params.slug;
    const path = getPath(slug);
    if (!path) {
      res.status(404).send("Path not found");
      return;
    }

    const n = Number(req.params.n);
    if (!Number.isInteger(n) || n < 1 || n > path.days.length) {
      res.status(400).send("invalid item");
      return;
    }

    const rawMark = req.body?.mark;
    if (
      rawMark !== "got_it" &&
      rawMark !== "needs_work" &&
      rawMark !== "not_yet"
    ) {
      res.status(400).send("invalid mark");
      return;
    }
    const mark = rawMark as MarkValue;

    const progress = await loadProgress(req.session!.sub, slug);
    if (!progress) {
      res.redirect(302, `/gateway?path=${encodeURIComponent(slug)}`);
      return;
    }

    const oldMarks: ItemMarks = (progress.marks ?? {}) as ItemMarks;
    const wasFirstMark = Object.keys(oldMarks).length === 0;
    const newMarks: ItemMarks = { ...oldMarks, [String(n)]: mark };

    const totalItems = path.days.length;
    const allGotIt = (() => {
      for (let i = 1; i <= totalItems; i++) {
        if (newMarks[String(i)] !== "got_it") return false;
      }
      return true;
    })();

    const wasCompleted = progress.status === "completed";
    const justCompleted = allGotIt && !wasCompleted;

    await db
      .update(challengeProgress)
      .set({
        marks: newMarks,
        status: allGotIt ? "completed" : "active",
        completedAt: justCompleted ? sql`now()` : progress.completedAt,
        lastActivityAt: sql`now()`,
      })
      .where(eq(challengeProgress.id, progress.id));

    if (wasFirstMark) {
      await emitHubEvent("skillid.method_started", {
        realskillUserId: req.session!.sub,
        email: req.session!.email,
        skillPathSlug: slug,
        courseSlug: path.courseSlug,
        firstItem: n,
        firstMark: mark,
      });
    }
    if (justCompleted) {
      await emitHubEvent("skillid.method_completed", {
        realskillUserId: req.session!.sub,
        email: req.session!.email,
        skillPathSlug: slug,
        courseSlug: path.courseSlug,
        totalItems,
      });
    }

    res.redirect(302, `/challenge/${encodeURIComponent(slug)}`);
  },
);
