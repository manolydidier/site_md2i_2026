import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { logAudit } from "@/(permisionGuard)/lib/audit";

export const dynamic = "force-dynamic";

const SETTINGS_ID = "default";

export async function GET(req: NextRequest) {
  const guard = await withPermission(req, { resource: "settings", action: "canRead" });
  if (!guard.ok) return guard.response;

  try {
    const settings = await prisma.siteSetting.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error("[GET /api/settings]", error);
    return NextResponse.json({ error: "Impossible de charger les paramètres." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await withPermission(req, { resource: "settings", action: "canUpdate" });
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();

    const data = {
      contactEmail: typeof body.contactEmail === "string" ? body.contactEmail.trim() || null : undefined,
      contactPhone: typeof body.contactPhone === "string" ? body.contactPhone.trim() || null : undefined,
      contactPhoneHref: typeof body.contactPhoneHref === "string" ? body.contactPhoneHref.trim() || null : undefined,
      address: typeof body.address === "string" ? body.address.trim() || null : undefined,
      websiteUrl: typeof body.websiteUrl === "string" ? body.websiteUrl.trim() || null : undefined,
      linkedinUrl: typeof body.linkedinUrl === "string" ? body.linkedinUrl.trim() || null : undefined,
      facebookUrl: typeof body.facebookUrl === "string" ? body.facebookUrl.trim() || null : undefined,
      xUrl: typeof body.xUrl === "string" ? body.xUrl.trim() || null : undefined,
      maintenanceMode: typeof body.maintenanceMode === "boolean" ? body.maintenanceMode : undefined,
    };

    const settings = await prisma.siteSetting.upsert({
      where: { id: SETTINGS_ID },
      update: data,
      create: { id: SETTINGS_ID, ...data },
    });

    await logAudit({
      actorId: guard.session.user.id,
      action: "update",
      entity: "settings",
      entityId: SETTINGS_ID,
      metadata: data,
      req,
    });

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error("[PATCH /api/settings]", error);
    return NextResponse.json({ error: "Impossible d'enregistrer les paramètres." }, { status: 500 });
  }
}
