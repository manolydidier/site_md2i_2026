// src/app/api/cron/send-automation-emails/route.ts

import { NextRequest, NextResponse } from "next/server";
import { processPendingAutomationEmails } from "@/app/lib/email/automation-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;

  // En développement, si aucun CRON_SECRET n'est défini, on autorise.
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
  console.log("[cron-email][HIT]", {
    method: req.method,
    url: req.nextUrl.toString(),
    now: new Date().toISOString(),
    hasSecretParam: Boolean(req.nextUrl.searchParams.get("secret")),
    hasAuthorizationHeader: Boolean(req.headers.get("authorization")),
    hasCronHeader: Boolean(req.headers.get("x-cron-secret")),
    nodeEnv: process.env.NODE_ENV,
  });

  if (!isAuthorized(req)) {
    console.error("[cron-email][UNAUTHORIZED]", {
      hasCronSecret: Boolean(process.env.CRON_SECRET),
    });

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[cron-email][PROCESS_START]");

    const result = await processPendingAutomationEmails({
      limit: 50,
    });

    console.log("[cron-email][PROCESS_SUCCESS]", result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[cron-email][PROCESS_ERROR]", {
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