import { Router, type Request, type Response } from "express";
import { getPath } from "../paths.js";
import { layout, escapeHtml } from "../views.js";
import { checkPathAccess } from "../entitlements.js";
import { config } from "../config.js";

export const pathsRouter = Router();

interface CtaState {
  kind: "primary" | "message";
  label?: string;
  href?: string;
  message?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

function computeCta(req: Request, slug: string): CtaState {
  const session = req.session;
  const gatewayHref = `/gateway?path=${encodeURIComponent(slug)}`;

  if (!session) {
    return { kind: "primary", label: "Start Your Skill Path", href: gatewayHref };
  }

  const path = getPath(slug)!;
  const decision = checkPathAccess(session, path);

  if (decision.kind === "allowed") {
    const label =
      decision.reason === "owned"
        ? "Continue Your Skill Path"
        : "Start Your Skill Path";
    return { kind: "primary", label, href: gatewayHref };
  }

  if (decision.kind === "free_claim") {
    return {
      kind: "primary",
      label: "Claim This Free Skill Path",
      href: gatewayHref,
    };
  }

  if (decision.reason === "free_already_claimed") {
    return {
      kind: "message",
      message:
        "You've already claimed your free Skill Path. Activate a RealSkill membership to unlock this one.",
      secondaryLabel: "Unlock This Skill Path",
      secondaryHref: config.realskillReactivateUrl,
    };
  }

  return {
    kind: "message",
    message:
      "This Skill Path requires a RealSkill membership or an owned Skill ID.",
    secondaryLabel: "Unlock This Skill Path",
    secondaryHref: config.realskillReactivateUrl,
  };
}

pathsRouter.get("/:slug", (req: Request, res: Response) => {
  const path = getPath(req.params.slug);
  if (!path) {
    res.status(404).send("Path not found");
    return;
  }

  const cta = computeCta(req, path.slug);
  const accessFlag = req.query.access;
  const showBlockedNote = accessFlag === "blocked";
  const showGrantFailedNote = accessFlag === "grant_failed";

  const ctaBlock =
    cta.kind === "primary"
      ? `<p><a class="cta btn-primary" href="${escapeHtml(cta.href!)}">${escapeHtml(cta.label!)}</a></p>`
      : `<div class="access-msg">
           <p>${escapeHtml(cta.message!)}</p>
           <p><a class="cta btn-primary" href="${escapeHtml(cta.secondaryHref!)}">${escapeHtml(cta.secondaryLabel!)}</a></p>
         </div>`;

  const blockedBanner = showBlockedNote
    ? `<div class="access-msg" style="margin-bottom:1rem"><p>You don't currently have access to this Skill Path.</p></div>`
    : showGrantFailedNote
      ? `<div class="access-msg" style="margin-bottom:1rem"><p>We couldn't grant access to this Skill Path just now. Please try again.</p></div>`
      : "";

  const guideCopy =
    cta.kind === "primary"
      ? `<p class="guide-copy">After you claim this Skill ID, we'll guide you through a 10-day Skill Path that shows you exactly how to use it inside RealSkill.</p>`
      : "";

  const body = `
    <h1>${escapeHtml(path.title)}</h1>
    <p class="tagline">${escapeHtml(path.tagline)}</p>
    <p>10-day Skill Path. Complete one day at a time.</p>
    ${blockedBanner}
    ${guideCopy}
    ${ctaBlock}
  `;
  res.type("html").send(layout(path.title + " — SkillID", body));
});
