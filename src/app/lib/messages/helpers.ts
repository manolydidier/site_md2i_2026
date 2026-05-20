import { ContactStatus } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { isAdminMessagesAuthenticated } from "@/app/lib/admin-auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isJsonRequest(request: NextRequest) {
  return request.headers
    .get("content-type")
    ?.toLowerCase()
    .includes("application/json");
}

export function getLoginUrl(request: NextRequest) {
  const loginUrl = new URL("/admin/messages/login", request.url);

  const currentUrl = new URL(request.url);
  const referer = request.headers.get("referer");

  if (referer) {
    try {
      const refererUrl = new URL(referer);

      if (
        refererUrl.origin === currentUrl.origin &&
        refererUrl.pathname.startsWith("/admin/messages")
      ) {
        loginUrl.searchParams.set(
          "callbackUrl",
          `${refererUrl.pathname}${refererUrl.search}`
        );
      }
    } catch {
      loginUrl.searchParams.set("callbackUrl", "/admin/messages");
    }
  } else {
    loginUrl.searchParams.set("callbackUrl", "/admin/messages");
  }

  return loginUrl;
}

export async function requireAdminApiAuth(request: NextRequest) {
  const authenticated = await isAdminMessagesAuthenticated();

  if (authenticated) {
    return null;
  }

  const loginUrl = getLoginUrl(request);

  if (isJsonRequest(request)) {
    return NextResponse.json(
      {
        ok: false,
        authRequired: true,
        loginUrl: `${loginUrl.pathname}${loginUrl.search}`,
        error: "Session expirée. Veuillez vous reconnecter.",
      },
      { status: 401 }
    );
  }

  return NextResponse.redirect(loginUrl, {
    status: 303,
  });
}

export function getMessageId(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!UUID_RE.test(id)) {
    throw new Error("ID de message invalide.");
  }

  return id;
}

export function getContactStatus(formData: FormData) {
  const status = String(formData.get("status") || "");

  if (!Object.values(ContactStatus).includes(status as ContactStatus)) {
    throw new Error("Statut invalide.");
  }

  return status as ContactStatus;
}

export function getSafeReturnUrl(request: NextRequest, formData: FormData) {
  const returnTo = String(formData.get("returnTo") || "");

  if (returnTo.startsWith("/admin/messages")) {
    return new URL(returnTo, request.url);
  }

  const referer = request.headers.get("referer");

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const currentUrl = new URL(request.url);

      if (
        refererUrl.origin === currentUrl.origin &&
        refererUrl.pathname.startsWith("/admin/messages")
      ) {
        return refererUrl;
      }
    } catch {}
  }

  return new URL("/admin/messages", request.url);
}

export function redirectBack(request: NextRequest, formData: FormData) {
  return NextResponse.redirect(getSafeReturnUrl(request, formData), {
    status: 303,
  });
}