// src/app/r/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TrackedLinkForRedirect = {
  id: string;
  slug: string;
  destinationUrl: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
};

function withTrackingParams(destination: URL, link: TrackedLinkForRedirect) {
  const params: Array<[string, string | null]> = [
    ["utm_source", link.utmSource],
    ["utm_medium", link.utmMedium],
    ["utm_campaign", link.utmCampaign],
    ["utm_content", link.utmContent],
    ["utm_term", link.utmTerm],
    ["crm_tracked_link", link.slug],
  ];

  for (const [key, value] of params) {
    if (value && !destination.searchParams.has(key)) {
      destination.searchParams.set(key, value);
    }
  }

  return destination;
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    null
  );
}

function isLikelyBot(userAgent: string | null) {
  if (!userAgent) return false;

  const normalized = userAgent.toLowerCase();

  return [
    "bot",
    "crawler",
    "spider",
    "preview",
    "facebookexternalhit",
    "facebot",
    "linkedinbot",
    "twitterbot",
    "slackbot",
    "discordbot",
    "whatsapp",
    "telegrambot",
    "skypeuripreview",
    "google-inspectiontool",
  ].some((value) => normalized.includes(value));
}

function createFallbackUrl(request: NextRequest) {
  return new URL("/", request.nextUrl.origin);
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function createDestinationUrl({
  request,
  link,
}: {
  request: NextRequest;
  link: TrackedLinkForRedirect;
}) {
  try {
    return withTrackingParams(
      new URL(link.destinationUrl, request.nextUrl.origin),
      link
    );
  } catch {
    return createFallbackUrl(request);
  }
}

async function trackClick({
  request,
  link,
}: {
  request: NextRequest;
  link: TrackedLinkForRedirect;
}) {
  const referrer = request.headers.get("referer");
  const userAgent = request.headers.get("user-agent");
  const ipAddress = getClientIp(request);
  const isBot = isLikelyBot(userAgent);

  try {
    await prisma.crmTrackedLinkClick.create({
      data: {
        linkId: link.id,
        referrer,
        userAgent,
        ipAddress,
        isBot,
      },
    });

    if (!isBot) {
      await prisma.crmTrackedLink.update({
        where: {
          id: link.id,
        },
        data: {
          clickCount: {
            increment: 1,
          },
          lastClickedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("[crm-tracked-link][TRACK_CLICK_ERROR]", {
      slug: link.slug,
      error,
    });
  }
}

async function handleRedirect({
  request,
  context,
  shouldTrack,
}: {
  request: NextRequest;
  context: { params: Promise<{ slug: string }> };
  shouldTrack: boolean;
}) {
  const { slug } = await context.params;
  const cleanSlug = safeDecodeURIComponent(slug || "").trim();

  if (!cleanSlug) {
    return NextResponse.redirect(createFallbackUrl(request));
  }

  const link = await prisma.crmTrackedLink.findUnique({
    where: {
      slug: cleanSlug,
    },
    select: {
      id: true,
      slug: true,
      destinationUrl: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      utmContent: true,
      utmTerm: true,
    },
  });

  if (!link) {
    return NextResponse.redirect(createFallbackUrl(request));
  }

  const destination = createDestinationUrl({
    request,
    link,
  });

  if (shouldTrack) {
    await trackClick({
      request,
      link,
    });
  }

  const response = NextResponse.redirect(destination);

  response.headers.set("Cache-Control", "no-store, max-age=0");

  response.cookies.set(
    "md2i_crm_tracking",
    JSON.stringify({
      slug: link.slug,
      source: link.utmSource,
      medium: link.utmMedium,
      campaign: link.utmCampaign,
      content: link.utmContent,
      clickedAt: new Date().toISOString(),
    }),
    {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    }
  );

  return response;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  return handleRedirect({
    request,
    context,
    shouldTrack: true,
  });
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  return handleRedirect({
    request,
    context,
    shouldTrack: false,
  });
}
