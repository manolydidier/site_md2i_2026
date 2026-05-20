import { ContactStatus } from "@/generated/prisma/enums";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { isAdminMessagesAuthenticated } from "@/app/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authenticated = await isAdminMessagesAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          ok: false,
          count: 0,
        },
        { status: 401 }
      );
    }

    const count = await prisma.contactMessage.count({
      where: {
        status: "NEW" as ContactStatus,
      },
    });

    return NextResponse.json({
      ok: true,
      count,
    });
  } catch (error) {
    console.error("[messages/new-count]", error);

    return NextResponse.json(
      {
        ok: false,
        count: 0,
      },
      { status: 500 }
    );
  }
}