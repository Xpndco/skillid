import { Router, type Request, type Response } from "express";
import { verifyHandoff } from "../jwt.js";
import { setSessionCookie, clearSessionCookie } from "../session.js";
import { config } from "../config.js";

export const authRouter = Router();

authRouter.get("/exchange", (req: Request, res: Response) => {
  const token = typeof req.query.t === "string" ? req.query.t : null;
  const next =
    typeof req.query.next === "string" && req.query.next.startsWith("/")
      ? req.query.next
      : "/";

  if (!token) {
    res.status(400).send("missing token");
    return;
  }

  let claims;
  try {
    claims = verifyHandoff(token);
  } catch {
    res.status(401).send("invalid token");
    return;
  }

  setSessionCookie(res, {
    sub: claims.sub,
    email: claims.email,
    access_state: claims.access.state,
    freeSkillIdClaimed: claims.access.freeSkillIdClaimed ?? false,
    ownedSkillIds: claims.access.ownedSkillIds ?? [],
  });

  res.redirect(302, next);
});

authRouter.post("/logout", (_req: Request, res: Response) => {
  clearSessionCookie(res);
  res.redirect(302, config.realskillLoginUrl);
});
