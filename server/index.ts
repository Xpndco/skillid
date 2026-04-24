import express from "express";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { attachSession } from "./session.js";
import { authRouter } from "./routes/auth.js";
import { gatewayRouter } from "./routes/gateway.js";
import { pathsRouter } from "./routes/paths.js";
import { challengeRouter } from "./routes/challenge.js";

const app = express();

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(attachSession);

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/gateway", gatewayRouter);
app.use("/paths", pathsRouter);
app.use("/challenge", challengeRouter);

app.get("/", (_req, res) => {
  res.redirect(302, "/paths/one-skill-at-a-time");
});

app.listen(config.port, () => {
  console.log(`SkillID listening on :${config.port}`);
});
