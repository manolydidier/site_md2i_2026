import { ContactStatus } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { redirectBack } from "@/app/lib/messages/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const guard = await withPermission(request, { resource: "messages", action: "canUpdate" });
    if (!guard.ok) return guard.response;

    const formData = await request.formData();

    const hasNew = Object.values(ContactStatus).includes("NEW" as ContactStatus);
    const hasRead = Object.values(ContactStatus).includes(
      "READ" as ContactStatus
    );

    if (hasNew && hasRead) {
      await prisma.contactMessage.updateMany({
        where: {
          status: "NEW" as ContactStatus,
        },
        data: {
          status: "READ" as ContactStatus,
        },
      });
    }

    return redirectBack(request, formData);
  } catch (error) {
    console.error("[admin/messages/read-all]", error);

    return NextResponse.redirect(new URL("/admin/messages", request.url), {
      status: 303,
    });
  }
}