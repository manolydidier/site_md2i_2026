// Petit client fetch partagé entre MessageActions.tsx et MailList.tsx : les
// deux ont besoin de la même gestion d'authentification expirée (redirection
// suivie côté fetch -> détectée via response.redirected, ou 401/authRequired
// renvoyé proprement par l'API JSON).

type ApiResult = {
  ok?: boolean;
  authRequired?: boolean;
  loginUrl?: string;
  error?: string;
  message?: {
    id: string;
    status: string;
    updatedAt: string;
  };
};

export class AuthRequiredError extends Error {
  loginUrl: string;

  constructor(loginUrl: string) {
    super("Session expirée. Veuillez vous reconnecter.");
    this.name = "AuthRequiredError";
    this.loginUrl = loginUrl;
  }
}

export async function postJson(
  url: string,
  body: Record<string, unknown>,
  method: "POST" | "DELETE" = "POST"
) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    redirect: "follow",
    body: JSON.stringify(body),
  });

  if (response.redirected) {
    const redirectedUrl = new URL(response.url);

    if (redirectedUrl.pathname.includes("/login")) {
      throw new AuthRequiredError(
        `${redirectedUrl.pathname}${redirectedUrl.search}`
      );
    }
  }

  const data = (await response.json().catch(() => null)) as ApiResult | null;

  if (response.status === 401 || data?.authRequired) {
    throw new AuthRequiredError(data?.loginUrl || "/login");
  }

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "Action impossible.");
  }

  return data;
}
