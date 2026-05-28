import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getRequiredEnv(key: string) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${key}`);
  }

  return value;
}

export async function GET() {
  const clientId = getRequiredEnv("LINKEDIN_CLIENT_ID");
  const redirectUri = getRequiredEnv("LINKEDIN_REDIRECT_URI");

  const scope = "openid profile w_member_social";

  const authorizationUrl = new URL(
    "https://www.linkedin.com/oauth/v2/authorization"
  );

  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("state", `crm-md2i-${Date.now()}`);
  authorizationUrl.searchParams.set("scope", scope);

  console.log("[LinkedIn OAuth] scope demande:", scope);
  console.log("[LinkedIn OAuth] url:", authorizationUrl.toString());

  return NextResponse.redirect(authorizationUrl);
}