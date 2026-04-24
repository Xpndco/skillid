import jwt from "jsonwebtoken";
import { config } from "./config.js";

export type AccessState = "trial" | "member" | "expired" | "none";

export interface HandoffAccess {
  state: AccessState;
  freeSkillIdClaimed: boolean;
  ownedSkillIds: string[];
}

export interface HandoffClaims {
  sub: string;
  email: string;
  access: HandoffAccess;
  iss: string;
  aud: string;
  jti: string;
  exp: number;
  iat: number;
}

export interface SessionClaims {
  sub: string;
  email: string;
  access_state: AccessState;
  freeSkillIdClaimed: boolean;
  ownedSkillIds: string[];
  exp: number;
  iat: number;
}

export function verifyHandoff(token: string): HandoffClaims {
  const decoded = jwt.verify(token, config.realskillJwtSecret, {
    algorithms: ["HS256"],
    issuer: "realskill",
    audience: "skillid",
  }) as HandoffClaims;
  return decoded;
}

export function signSession(
  claims: Omit<SessionClaims, "exp" | "iat">,
  ttlSeconds = 60 * 60 * 24 * 30,
): string {
  return jwt.sign(claims, config.sessionSecret, {
    algorithm: "HS256",
    expiresIn: ttlSeconds,
  });
}

export function verifySession(token: string): SessionClaims {
  return jwt.verify(token, config.sessionSecret, {
    algorithms: ["HS256"],
  }) as SessionClaims;
}
