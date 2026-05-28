import { NextRequest, NextResponse } from "next/server";

import { processDueCrmPublications } from "@/app/lib/crm-publication-cron";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret && process.env.NODE_ENV !== "production") {
    return true;
  }

  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const secretParam = req.nextUrl.searchParams.get("secret");

  return (
    authHeader === `Bearer ${secret}` ||
    cronHeader === secret ||
    secretParam === secret
  );
}

async function runCron(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(
    50,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 20))
  );

  try {
    const result = await processDueCrmPublications({ limit });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[cron-crm-publications][PROCESS_ERROR]", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return runCron(req);
}

export async function POST(req: NextRequest) {
  return runCron(req);
}
