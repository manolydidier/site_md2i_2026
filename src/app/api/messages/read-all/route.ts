import { ContactStatus } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import {
  redirectBack,
  requireAdminApiAuth,
} from "@/app/lib/messages/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const authResponse = await requireAdminApiAuth(request);

    if (authResponse) return authResponse;

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