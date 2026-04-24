import { config } from "./config.js";
import type { SessionClaims } from "./jwt.js";
import type { SkillPath } from "./paths.js";

export interface GrantResult {
  ok: boolean;
  mocked: boolean;
  error?: string;
}

export async function grantSkillIdAccessViaHub(
  user: SessionClaims,
  path: SkillPath,
): Promise<GrantResult> {
  const payload = {
    realskillUserId: user.sub,
    email: user.email,
    skillPathSlug: path.slug,
    courseSlug: path.courseSlug,
    source: "skillid_free_claim" as const,
  };

  if (!config.integrationHubUrl || !config.integrationHubApiKey) {
    console.log("[hub] mock grant (no INTEGRATION_HUB_URL/API_KEY):", payload);
    return { ok: true, mocked: true };
  }

  try {
    const res = await fetch(
      `${config.integrationHubUrl}/api/skillid/grant-access`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.integrationHubApiKey}`,
        },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        mocked: false,
        error: `hub ${res.status}: ${text.slice(0, 200)}`,
      };
    }
    return { ok: true, mocked: false };
  } catch (err) {
    return { ok: false, mocked: false, error: (err as Error).message };
  }
}
