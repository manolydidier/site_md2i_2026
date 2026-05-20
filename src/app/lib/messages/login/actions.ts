"use server";

import { redirect } from "next/navigation";
import {
  clearAdminMessagesSession,
  setAdminMessagesSession,
} from "../../admin-auth";

export async function loginAdminMessagesAction(formData: FormData) {
  const password = String(formData.get("password") || "");

  if (!process.env.ADMIN_MESSAGES_PASSWORD) {
    throw new Error("ADMIN_MESSAGES_PASSWORD est manquant dans .env");
  }

  if (password !== process.env.ADMIN_MESSAGES_PASSWORD) {
    redirect("/admin/messages/login?error=1");
  }

  await setAdminMessagesSession();

  redirect("/admin/messages");
}

export async function logoutAdminMessagesAction() {
  await clearAdminMessagesSession();

  redirect("/admin/messages/login");
}