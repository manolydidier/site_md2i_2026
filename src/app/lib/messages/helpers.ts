import { ContactStatus } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isJsonRequest(request: NextRequest) {
  return request.headers
    .get("content-type")
    ?.toLowerCase()
    .includes("application/json");
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