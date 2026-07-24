import { ContactStatus } from "@/generated/prisma/enums";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { checkPermission } from "@/(permisionGuard)/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const access = await checkPermission("messages", "canRead");
    const authenticated = access.ok;

    if (!authenticated) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          count: 0,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const count = await prisma.contactMessage.count({
      where: {
        status: ContactStatus.NEW,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        authenticated: true,
        count,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[messages/new-count]", error);

    return NextResponse.json(
      {
        ok: false,
        authenticated: false,
        count: 0,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}