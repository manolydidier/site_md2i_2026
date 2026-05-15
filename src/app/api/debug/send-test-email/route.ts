// src/app/api/debug/send-test-email/route.ts

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sendTestEmail } from "@/app/lib/email/sender";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handler(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let to = "";
  let subject = "Test Resend direct";

  if (req.method === "GET") {
    to = String(req.nextUrl.searchParams.get("to") || "").trim();
    subject = String(
      req.nextUrl.searchParams.get("subject") || subject
    ).trim();
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));

    to = String(body.to || "").trim();
    subject = String(body.subject || subject).trim();
  }

  if (!to) {
    return NextResponse.json(
      {
        success: false,
        error: "Ajoute ?to=ton-email@gmail.com dans l'URL.",
      },
      { status: 400 }
    );
  }

  console.log("[debug/send-test-email] start", {
    method: req.method,
    to,
    subject,
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    emailFrom: process.env.EMAIL_FROM,
    emailFromName: process.env.EMAIL_FROM_NAME,
  });

  const result = await sendTestEmail({
    to,
    subject,
    html: `
      <div class="email-shell">
        <div class="email-hero">
          <span class="email-eyebrow">Test Resend</span>
          <h1 class="email-title">Email de test réussi</h1>
          <p class="email-text">
            Si vous recevez cet email, le sender existant fonctionne correctement.
          </p>
        </div>

        <div class="email-section">
          <div class="email-card">
            <p class="email-text">
              Date du test : ${new Date().toISOString()}
            </p>
          </div>
        </div>
      </div>
    `,
  });

  console.log("[debug/send-test-email] result", result);

  const status = result.success ? 200 : 500;

  return NextResponse.json(result, { status });
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}