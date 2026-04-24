import { config } from "./config.js";
import type { SessionClaims } from "./jwt.js";
import type { SkillPath } from "./paths.js";

interface HubGrantResponse {
  success?: boolean;
  realskillUserId?: string;
  skillPathSlug?: string;
  courseSlug?: string;
  accessGranted?: boolean;
  alreadyHadAccess?: boolean;
}

export interface GrantResult {
  ok: boolean;
  mocked: boolean;
  alreadyHadAccess?: boolean;
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
    const mockResponse: HubGrantResponse = {
      success: true,
      realskillUserId: user.sub,
      skillPathSlug: path.slug,
      courseSlug: path.courseSlug,
      accessGranted: true,
      alreadyHadAccess: false,
    };
    console.log(
      "[hub] mock grant (no INTEGRATION_HUB_URL/API_KEY):",
      payload,
      "→",
      mockResponse,
    );
    return { ok: true, mocked: true, alreadyHadAccess: false };
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

    const body = (await res.json().catch(() => null)) as HubGrantResponse | null;
    if (!body || body.success !== true || body.accessGranted !== true) {
      return {
        ok: false,
        mocked: false,
        error: "hub returned non-grant response",
      };
    }
    return {
      ok: true,
      mocked: false,
      alreadyHadAccess: body.alreadyHadAccess === true,
    };
  } catch (err) {
    return { ok: false, mocked: false, error: (err as Error).message };
  }
}
