import jwt from "jsonwebtoken";

const secret = process.env.REALSKILL_JWT_SECRET ?? "test-secret";

const state = (process.env.TEST_STATE ?? "trial") as
  | "trial"
  | "member"
  | "expired"
  | "none";
const freeSkillIdClaimed =
  (process.env.TEST_FREE_CLAIMED ?? "false").toLowerCase() === "true";
const ownedSkillIds = (process.env.TEST_OWNED ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const token = jwt.sign(
  {
    sub: "test-user-1",
    email: "test@example.com",
    access: {
      state,
      freeSkillIdClaimed,
      ownedSkillIds,
    },
  },
  secret,
  {
    algorithm: "HS256",
    issuer: "realskill",
    audience: "skillid",
    expiresIn: "5m",
    jwtid: crypto.randomUUID(),
  },
);

const port = process.env.PORT ?? "3000";
const pathSlug = process.env.TEST_PATH ?? "one-skill-at-a-time";
const next = `/gateway?path=${pathSlug}`;
const url =
  `http://localhost:${port}/auth/exchange` +
  `?t=${token}&next=${encodeURIComponent(next)}`;

console.log(`\nACCESS: state=${state} freeSkillIdClaimed=${freeSkillIdClaimed} owned=[${ownedSkillIds.join(",")}]`);
console.log("\nTOKEN:\n" + token);
console.log("\nTEST URL:\n" + url + "\n");
