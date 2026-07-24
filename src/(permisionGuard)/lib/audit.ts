import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";

interface LogAuditParams {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  req?: NextRequest;
}

function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

// Écrit un événement dans audit_logs. N'échoue jamais bruyamment : une erreur
// d'écriture du journal ne doit pas casser l'action métier qui l'a déclenchée.
export async function logAudit({ actorId, action, entity, entityId, metadata, req }: LogAuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        metadata: metadata ? (JSON.parse(JSON.stringify(metadata)) as object) : undefined,
        ipAddress: req ? getClientIp(req) : null,
        userAgent: req?.headers.get("user-agent") ?? null,
      },
    });
  } catch (error) {
    console.error("[logAudit]", error);
  }
}
