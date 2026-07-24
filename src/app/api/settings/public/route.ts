import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

// Lecture publique — uniquement les champs destinés au site public (footer, etc.).
// Pas de garde RBAC ici volontairement.
export async function GET() {
  try {
    const settings = await prisma.siteSetting.findUnique({ where: { id: "default" } });

    if (!settings) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({
      data: {
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        contactPhoneHref: settings.contactPhoneHref,
        address: settings.address,
        websiteUrl: settings.websiteUrl,
        linkedinUrl: settings.linkedinUrl,
        facebookUrl: settings.facebookUrl,
        xUrl: settings.xUrl,
        maintenanceMode: settings.maintenanceMode,
      },
    });
  } catch (error) {
    console.error("[GET /api/settings/public]", error);
    return NextResponse.json({ data: null });
  }
}
