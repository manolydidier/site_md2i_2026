import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

async function createIfMissing({
  userId,
  name,
  description,
  trigger,
  steps,
}: {
  userId: string;
  name: string;
  description: string;
  trigger:
    | "CONTACT_CREATED"
    | "CONTACT_STATUS_CUSTOMER"
    | "CONTACT_STATUS_INACTIVE";
  steps: {
    position: number;
    delayValue: number;
    delayUnit: "MINUTES" | "HOURS" | "DAYS";
    subject: string;
    content: string;
  }[];
}) {
  const existing = await prisma.emailAutomation.findFirst({
    where: {
      userId,
      name,
      trigger,
    },
    select: {
      id: true,
    },
  });

  if (existing) return existing;

  return prisma.emailAutomation.create({
    data: {
      userId,
      name,
      description,
      trigger,
      isActive: true,
      steps: {
        create: steps,
      },
    },
    include: {
      steps: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });
}

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const welcome = await createIfMissing({
    userId,
    name: "Bienvenue prospect",
    description: "Séquence automatique envoyée aux nouveaux contacts.",
    trigger: "CONTACT_CREATED",
    steps: [
      {
        position: 1,
        delayValue: 0,
        delayUnit: "MINUTES",
        subject: "Bienvenue {{firstName}}",
        content: `
          <p>Bonjour {{contactName}},</p>
          <p>Merci pour votre inscription.</p>
          <p>Nous sommes ravis de vous compter parmi nos contacts.</p>
          <p>Vous allez recevoir prochainement des informations utiles sur nos services.</p>
        `,
      },
      {
        position: 2,
        delayValue: 2,
        delayUnit: "DAYS",
        subject: "Voici comment nous pouvons vous aider",
        content: `
          <p>Bonjour {{contactName}},</p>
          <p>Nous accompagnons nos prospects et clients avec des solutions adaptées à leurs besoins.</p>
          <p>Si vous avez une question, vous pouvez simplement répondre à cet email.</p>
        `,
      },
      {
        position: 3,
        delayValue: 5,
        delayUnit: "DAYS",
        subject: "Souhaitez-vous en savoir plus ?",
        content: `
          <p>Bonjour {{contactName}},</p>
          <p>Je voulais savoir si vous souhaitez recevoir plus d’informations sur nos offres.</p>
          <p>Répondez simplement à cet email, et nous vous guiderons.</p>
        `,
      },
    ],
  });

  const customer = await createIfMissing({
    userId,
    name: "Bienvenue client",
    description: "Séquence envoyée quand un contact devient client.",
    trigger: "CONTACT_STATUS_CUSTOMER",
    steps: [
      {
        position: 1,
        delayValue: 0,
        delayUnit: "MINUTES",
        subject: "Merci pour votre confiance {{firstName}}",
        content: `
          <p>Bonjour {{contactName}},</p>
          <p>Merci pour votre confiance.</p>
          <p>Nous sommes heureux de vous compter parmi nos clients.</p>
        `,
      },
      {
        position: 2,
        delayValue: 1,
        delayUnit: "DAYS",
        subject: "Bien commencer avec nous",
        content: `
          <p>Bonjour {{contactName}},</p>
          <p>Voici quelques conseils pour bien démarrer avec notre service.</p>
          <p>Notre équipe reste disponible si vous avez besoin d’aide.</p>
        `,
      },
      {
        position: 3,
        delayValue: 7,
        delayUnit: "DAYS",
        subject: "Votre avis nous intéresse",
        content: `
          <p>Bonjour {{contactName}},</p>
          <p>Nous aimerions savoir comment se passe votre expérience.</p>
          <p>Votre retour nous aide à améliorer notre service.</p>
        `,
      },
    ],
  });

  const inactive = await createIfMissing({
    userId,
    name: "Réactivation contact inactif",
    description: "Séquence envoyée aux contacts devenus inactifs.",
    trigger: "CONTACT_STATUS_INACTIVE",
    steps: [
      {
        position: 1,
        delayValue: 0,
        delayUnit: "MINUTES",
        subject: "Toujours intéressé {{firstName}} ?",
        content: `
          <p>Bonjour {{contactName}},</p>
          <p>Nous avons remarqué que vous n’avez pas interagi récemment.</p>
          <p>Souhaitez-vous toujours recevoir nos informations ?</p>
        `,
      },
      {
        position: 2,
        delayValue: 3,
        delayUnit: "DAYS",
        subject: "Une dernière information pour vous",
        content: `
          <p>Bonjour {{contactName}},</p>
          <p>Voici une dernière information qui pourrait vous intéresser.</p>
          <p>Si vous souhaitez continuer, répondez simplement à cet email.</p>
        `,
      },
    ],
  });

  return NextResponse.json({
    success: true,
    automations: {
      welcome,
      customer,
      inactive,
    },
  });
}