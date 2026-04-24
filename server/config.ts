import "dotenv/config";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const config = {
  databaseUrl: req("DATABASE_URL"),
  port: Number(process.env.PORT ?? 3000),
  realskillJwtSecret: req("REALSKILL_JWT_SECRET"),
  sessionSecret: req("SESSION_SECRET"),
  realskillLoginUrl: req("REALSKILL_LOGIN_URL"),
  realskillReactivateUrl: req("REALSKILL_REACTIVATE_URL"),
  publicBaseUrl: req("PUBLIC_BASE_URL"),
  integrationHubUrl: process.env.INTEGRATION_HUB_URL ?? "",
  integrationHubApiKey: process.env.INTEGRATION_HUB_API_KEY ?? "",
  isProd: process.env.NODE_ENV === "production",
};
