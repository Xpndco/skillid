import type { Request, Response, NextFunction } from "express";
import { config } from "./config.js";
import { signSession, verifySession, type SessionClaims } from "./jwt.js";

const COOKIE_NAME = "skillid_session";

export function setSessionCookie(
  res: Response,
  claims: Omit<SessionClaims, "exp" | "iat">,
): void {
  const token = signSession(claims);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 30,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function readSession(req: Request): SessionClaims | null {
  const raw = req.cookies?.[COOKIE_NAME];
  if (!raw) return null;
  try {
    return verifySession(raw);
  } catch {
    return null;
  }
}

declare module "express-serve-static-core" {
  interface Request {
    session?: SessionClaims;
  }
}

export function attachSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const s = readSession(req);
  if (s) req.session = s;
  next();
}

export function requireSession(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session) {
    const returnTo = encodeURIComponent(config.publicBaseUrl + req.originalUrl);
    res.redirect(
      302,
      `${config.realskillLoginUrl}?return_to=${returnTo}`,
    );
    return;
  }
  next();
}
