import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "md2i_admin_messages_session";

function getPassword() {
  const password = process.env.ADMIN_MESSAGES_PASSWORD;

  if (!password) {
    throw new Error("ADMIN_MESSAGES_PASSWORD est manquant dans .env");
  }

  return password;
}

function getSecret() {
  return (
    process.env.ADMIN_MESSAGES_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    getPassword()
  );
}

export function createAdminSessionToken() {
  return createHash("sha256")
    .update(`${getPassword()}.${getSecret()}`)
    .digest("hex");
}

function safeEqual(a: string, b: string) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) return false;

  return timingSafeEqual(bufferA, bufferB);
}

export async function isAdminMessagesAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return false;

  return safeEqual(token, createAdminSessionToken());
}

export async function requireAdminMessagesAuth() {
  const authenticated = await isAdminMessagesAuthenticated();

  if (!authenticated) {
    redirect("/admin/messages/login");
  }
}

export async function setAdminMessagesSession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",

    /**
     * IMPORTANT :
     * Le backoffice est sur /admin/messages,
     * mais les actions POST sont sur /api/messages.
     * Donc le cookie doit être disponible sur tout le site.
     */
    path: "/",

    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminMessagesSession() {
  const cookieStore = await cookies();

  cookieStore.delete({
    name: COOKIE_NAME,
    path: "/",
  });
}