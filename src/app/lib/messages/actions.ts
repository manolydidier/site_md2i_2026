"use server";

import { ContactStatus } from "@/generated/prisma/enums"; 
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { requireAdminMessagesAuth } from "../admin-auth";
import { logoutAdminMessagesAction } from "./login/actions";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getId(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!UUID_RE.test(id)) {
    throw new Error("ID de message invalide.");
  }

  return id;
}

function getStatus(value: FormDataEntryValue | null) {
  const status = String(value || "");

  if (!Object.values(ContactStatus).includes(status as ContactStatus)) {
    throw new Error("Statut invalide.");
  }

  return status as ContactStatus;
}

export async function updateMessageStatusAction(formData: FormData) {
  await requireAdminMessagesAuth();

  const id = getId(formData);
  const status = getStatus(formData.get("status"));

  await prisma.contactMessage.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/messages");
}

export async function markMessageReadAction(formData: FormData) {
  await requireAdminMessagesAuth();

  const id = getId(formData);

  if (!Object.values(ContactStatus).includes("READ" as ContactStatus)) {
    return;
  }

  await prisma.contactMessage.update({
    where: { id },
    data: { status: "READ" as ContactStatus },
  });

  revalidatePath("/admin/messages");
}

export async function deleteMessageAction(formData: FormData) {
  await requireAdminMessagesAuth();

  const id = getId(formData);

  await prisma.contactMessage.delete({
    where: { id },
  });

  revalidatePath("/admin/messages");
  redirect("/admin/messages");
}

export async function markAllNewAsReadAction() {
  await requireAdminMessagesAuth();

  if (!Object.values(ContactStatus).includes("READ" as ContactStatus)) {
    return;
  }

  if (!Object.values(ContactStatus).includes("NEW" as ContactStatus)) {
    return;
  }

  await prisma.contactMessage.updateMany({
    where: {
      status: "NEW" as ContactStatus,
    },
    data: {
      status: "READ" as ContactStatus,
    },
  });

  revalidatePath("/admin/messages");
}

export { logoutAdminMessagesAction };