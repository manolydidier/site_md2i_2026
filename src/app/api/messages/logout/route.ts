import { NextRequest, NextResponse } from "next/server";
import { clearAdminMessagesSession } from "@/app/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await clearAdminMessagesSession();

  return NextResponse.redirect(new URL("/admin/messages/login", request.url), {
    status: 303,
  });
}