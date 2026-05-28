import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type LinkedInTokenResponse = {
  access_token?: string;
  expires_in?: number;
  id_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type LinkedInUserInfoResponse = {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  email?: string;
  email_verified?: boolean;
  error?: string;
  error_description?: string;
  message?: string;
  status?: number;
};

function getRequiredEnv(key: string) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${key}`);
  }

  return value;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function getLinkedInUserInfo(accessToken: string) {
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = (await response.json()) as LinkedInUserInfoResponse;

  if (!response.ok || !data.sub) {
    return {
      personId: "",
      name: "",
      error: data,
    };
  }

  return {
    personId: data.sub,
    name: data.name || "",
    error: null,
  };
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get(
    "error_description"
  );

  if (error) {
    return new NextResponse(
      `
        <main style="font-family: system-ui; padding: 32px;">
          <h1>Erreur LinkedIn</h1>
          <p><strong>${escapeHtml(error)}</strong></p>
          <p>${escapeHtml(errorDescription || "")}</p>
        </main>
      `,
      {
        status: 400,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  }

  if (!code) {
    return NextResponse.json(
      {
        error: "Code LinkedIn manquant.",
      },
      {
        status: 400,
      }
    );
  }

  const clientId = getRequiredEnv("LINKEDIN_CLIENT_ID");
  const clientSecret = getRequiredEnv("LINKEDIN_CLIENT_SECRET");
  const redirectUri = getRequiredEnv("LINKEDIN_REDIRECT_URI");

  const params = new URLSearchParams();

  params.set("grant_type", "authorization_code");
  params.set("code", code);
  params.set("client_id", clientId);
  params.set("client_secret", clientSecret);
  params.set("redirect_uri", redirectUri);

  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const data = (await response.json()) as LinkedInTokenResponse;

  if (!response.ok || !data.access_token) {
    return new NextResponse(
      `
        <main style="font-family: system-ui; padding: 32px;">
          <h1>Impossible de recuperer le token LinkedIn</h1>
          <pre style="white-space: pre-wrap; background: #f8fafc; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">${escapeHtml(
            JSON.stringify(data, null, 2)
          )}</pre>
        </main>
      `,
      {
        status: response.status,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  }

  const userInfo = await getLinkedInUserInfo(data.access_token);

  const expiresInDays = data.expires_in
    ? Math.round(data.expires_in / 60 / 60 / 24)
    : null;

  const envBlock = `LINKEDIN_ACCESS_TOKEN="${data.access_token}"
LINKEDIN_AUTHOR_TYPE="PERSON"
LINKEDIN_PERSON_ID="${userInfo.personId}"`;

  return new NextResponse(
    `
      <main style="font-family: system-ui; max-width: 960px; margin: 0 auto; padding: 32px;">
        <h1>Token LinkedIn recupere</h1>

        <p>Copiez ces lignes dans votre fichier <code>.env</code> :</p>

        <pre style="white-space: pre-wrap; background: #0f172a; color: #e2e8f0; padding: 16px; border-radius: 8px;">${escapeHtml(
          envBlock
        )}</pre>

        <h2>Informations</h2>

        <pre style="white-space: pre-wrap; background: #f8fafc; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">${escapeHtml(
          JSON.stringify(
            {
              scope: data.scope,
              expires_in_seconds: data.expires_in,
              expires_in_days: expiresInDays,
              linkedin_person_id: userInfo.personId,
              linkedin_name: userInfo.name,
              userinfo_error: userInfo.error,
            },
            null,
            2
          )
        )}</pre>

        ${
          userInfo.personId
            ? `<p style="color: #166534;">OK : LINKEDIN_PERSON_ID est bien recupere.</p>`
            : `<p style="color: #b91c1c;">Erreur : LINKEDIN_PERSON_ID est vide. Verifiez que le produit OpenID Connect est bien ajoute a votre app LinkedIn.</p>`
        }

        <p style="color: #64748b;">
          Apres avoir colle ces valeurs dans .env, arretez puis relancez npm run dev.
        </p>
      </main>
    `,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    }
  );
}