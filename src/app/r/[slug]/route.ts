import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

function withUtmParams(destination: URL, link: {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
}) {
  const params: Array<[string, string | null]> = [
    ["utm_source", link.utmSource],
    ["utm_medium", link.utmMedium],
    ["utm_campaign", link.utmCampaign],
    ["utm_content", link.utmContent],
    ["utm_term", link.utmTerm],
  ];

  for (const [key, value] of params) {
    if (value && !destination.searchParams.has(key)) {
      destination.searchParams.set(key, value);
    }
  }

  return destination;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  const link = await prisma.crmTrackedLink.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      destinationUrl: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      utmContent: true,
      utmTerm: true,
    },
  });

  if (!link) {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  const destination = withUtmParams(
    new URL(link.destinationUrl, request.nextUrl.origin),
    link
  );

  const referrer = request.headers.get("referer");
  const userAgent = request.headers.get("user-agent");

  await prisma.$transaction([
    prisma.crmTrackedLink.update({
      where: {
        id: link.id,
      },
      data: {
        clickCount: {
          increment: 1,
        },
        lastClickedAt: new Date(),
      },
    }),
    prisma.crmTrackedLinkClick.create({
      data: {
        linkId: link.id,
        referrer,
        userAgent,
      },
    }),
  ]);

  return NextResponse.redirect(destination);
}
