// src/app/api/campaigns/[id]/send/route.ts

import { NextRequest, NextResponse } from "next/server";

type RouteParams = Promise<{
  id?: string;
}>;

export async function POST(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  const resolvedParams = await params;
  const campaignId = resolvedParams.id;

  if (!campaignId) {
    return NextResponse.json(
      {
        success: false,
        error: "campaignId manquant dans l’ancienne route /api/campaigns/[id]/send.",
      },
      { status: 400 }
    );
  }

  console.warn("[legacy-campaign-send][REDIRECT_TO_NEW_ROUTE]", {
    campaignId,
  });

  const body = await req.text().catch(() => "");

  const url = new URL(
    `/api/email-marketing/campaigns/${campaignId}/send`,
    req.url
  );

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": req.headers.get("Content-Type") || "application/json",
      cookie: req.headers.get("cookie") || "",
    },
    body: body || JSON.stringify({ limit: 50, retryFailed: false }),
  });

  const data = await response.json().catch(() => null);

  return NextResponse.json(data, {
    status: response.status,
  });
}