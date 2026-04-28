import type { SessionClaims } from "./jwt.js";
import type { SkillPath } from "./paths.js";

export type AccessDecision =
  | { kind: "allowed"; reason: "member" | "owned" | "trial_onboarding" }
  | { kind: "free_claim" }
  | { kind: "blocked"; reason: "free_already_claimed" | "no_access" };

export function checkPathAccess(
  session: SessionClaims | null | undefined,
  path: SkillPath,
): AccessDecision {
  const ownedSkillIds: string[] = Array.isArray(session?.ownedSkillIds)
    ? session!.ownedSkillIds
    : [];
  const state = session?.access_state ?? "none";
  const freeSkillIdClaimed = session?.freeSkillIdClaimed ?? false;

  if (ownedSkillIds.includes(path.slug)) {
    return { kind: "allowed", reason: "owned" };
  }
  if (state === "member") {
    return { kind: "allowed", reason: "member" };
  }
  if (state === "trial" && path.isOnboarding) {
    return { kind: "allowed", reason: "trial_onboarding" };
  }
  if (!freeSkillIdClaimed && ownedSkillIds.length === 0) {
    return { kind: "free_claim" };
  }
  if (freeSkillIdClaimed) {
    return { kind: "blocked", reason: "free_already_claimed" };
  }
  return { kind: "blocked", reason: "no_access" };
}

export type StageContext = "browsing" | "active" | "completed";
export type StageNumber = 2 | 3 | 4;
export type StageStatus = "next" | "active" | "completed" | "locked";

export interface StageView {
  current: StageNumber;
  status: StageStatus;
  visible: StageNumber[];
}

export function currentStage(
  session: SessionClaims | null | undefined,
  context: StageContext,
): StageView {
  if (session?.access_state === "member") {
    return { current: 3, status: "active", visible: [3, 4] };
  }
  const status: StageStatus =
    context === "browsing"
      ? "next"
      : context === "completed"
        ? "completed"
        : "active";
  return { current: 2, status, visible: [2, 3, 4] };
}
