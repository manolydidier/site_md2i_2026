// src/app/contact-commercial/page.tsx
// ou le chemin exact de ta page Contact commercial

import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Headphones,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import ProductLeadForm from "@/app/admin/components/crm/ProductLeadForm";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ContactCommercialPage() {
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main style={s.page}>
      <section style={s.hero}>
        <div style={s.heroGlowOne} />
        <div style={s.heroGlowTwo} />

        <div style={s.heroInner}>
          <div style={s.heroContent}>
            <div style={s.eyebrow}>
              <Sparkles size={15} />
              <span>Contact commercial MD2I</span>
            </div>

            <h1 style={s.title}>
              Parlons de votre besoin et trouvons la bonne solution.
            </h1>

            <p style={s.subtitle}>
              Sélectionnez un produit ou service, décrivez votre demande, puis
              l’équipe MD2I vous recontactera avec une réponse adaptée à votre
              contexte.
            </p>

            <div style={s.heroActions}>
              <a href="#demande-commerciale" style={s.primaryButton}>
                Envoyer une demande
                <ArrowRight size={17} />
              </a>

              <div style={s.heroHint}>
                <Clock3 size={16} />
                <span>Réponse rapide par l’équipe commerciale</span>
              </div>
            </div>
          </div>

          <aside style={s.heroCard}>
            <div style={s.heroCardIcon}>
              <Headphones size={24} />
            </div>

            <h2 style={s.heroCardTitle}>Accompagnement personnalisé</h2>

            <p style={s.heroCardText}>
              Votre demande est automatiquement transmise au CRM MD2I pour être
              suivie par notre équipe commerciale.
            </p>

            <div style={s.heroStats}>
              <div>
                <strong>{products.length}</strong>
                <span>solutions disponibles</span>
              </div>

              <div>
                <strong>CRM</strong>
                <span>suivi structuré</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section style={s.benefits}>
        <BenefitCard
          icon={<BadgeCheck size={21} />}
          title="Solution adaptée"
          text="Nous analysons votre demande pour vous orienter vers le bon produit ou service."
        />

        <BenefitCard
          icon={<MailCheck size={21} />}
          title="Suivi commercial"
          text="Votre demande est enregistrée proprement pour faciliter le suivi et les relances."
        />

        <BenefitCard
          icon={<ShieldCheck size={21} />}
          title="Échange professionnel"
          text="Vous êtes recontacté avec une réponse claire, structurée et adaptée à votre projet."
        />
      </section>

      <section id="demande-commerciale" style={s.formSection}>
        <div style={s.formIntro}>
          <p style={s.formEyebrow}>Votre demande</p>

          <h2 style={s.formTitle}>Demande commerciale</h2>

          <p style={s.formDescription}>
            Choisissez le produit ou service qui vous intéresse, puis indiquez
            vos informations. Cela nous permet de mieux comprendre votre besoin
            avant de vous recontacter.
          </p>
        </div>

        <div style={s.formCard}>
          {products.length === 0 && (
            <div style={s.warningBox}>
              Aucun produit publié n’est disponible pour le moment. Vous pouvez
              tout de même envoyer une demande générale si le formulaire le
              permet.
            </div>
          )}

          <ProductLeadForm
            productOptions={products}
            title="Demande commerciale"
            description="Choisissez le produit ou service qui vous intéresse. L’équipe MD2I vous recontactera rapidement."
            defaultRequestType="CONTACT"
          />
        </div>
      </section>

      <section style={s.reassurance}>
        <div style={s.reassuranceInner}>
          <div>
            <p style={s.reassuranceEyebrow}>MD2I</p>
            <h2 style={s.reassuranceTitle}>
              Un interlocuteur pour transformer votre besoin en solution.
            </h2>
          </div>

          <p style={s.reassuranceText}>
            Que votre demande concerne un site web, une solution digitale, un
            CRM, une automatisation, une maintenance ou un accompagnement, nous
            vous aidons à clarifier la meilleure approche.
          </p>
        </div>
      </section>
    </main>
  );
}

function BenefitCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article style={s.benefitCard}>
      <div style={s.benefitIcon}>{icon}</div>

      <div>
        <h3 style={s.benefitTitle}>{title}</h3>
        <p style={s.benefitText}>{text}</p>
      </div>
    </article>
  );
}

const ORANGE = "#EF9F27";
const ORANGE_DARK = "#92400E";
const ORANGE_SOFT = "rgba(239, 159, 39, 0.10)";
const ORANGE_BORDER = "rgba(239, 159, 39, 0.28)";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E5E7EB";
const SURFACE = "#FFFFFF";

const s: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(239,159,39,0.14), transparent 34%), linear-gradient(180deg, #FFFDF8 0%, #F8FAFC 42%, #F1F5F9 100%)",
    color: TEXT,
    fontFamily: "Arial, Helvetica, sans-serif",
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    padding: "72px 20px 44px",
  },

  heroGlowOne: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 999,
    background: "rgba(239,159,39,0.20)",
    filter: "blur(12px)",
  },

  heroGlowTwo: {
    position: "absolute",
    left: -120,
    bottom: -160,
    width: 360,
    height: 360,
    borderRadius: 999,
    background: "rgba(15,23,42,0.08)",
    filter: "blur(16px)",
  },

  heroInner: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1180,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.55fr)",
    gap: 28,
    alignItems: "center",
  },

  heroContent: {
    maxWidth: 760,
  },

  eyebrow: {
    width: "fit-content",
    marginBottom: 18,
    padding: "9px 13px",
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: ORANGE_DARK,
    background: ORANGE_SOFT,
    border: `1px solid ${ORANGE_BORDER}`,
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  title: {
    margin: 0,
    maxWidth: 820,
    color: TEXT,
    fontSize: 56,
    lineHeight: 1.02,
    fontWeight: 900,
    letterSpacing: "-0.055em",
  },

  subtitle: {
    maxWidth: 720,
    margin: "20px 0 0",
    color: MUTED,
    fontSize: 18,
    lineHeight: 1.75,
    fontWeight: 600,
  },

  heroActions: {
    marginTop: 30,
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },

  primaryButton: {
    height: 48,
    padding: "0 20px",
    borderRadius: 999,
    background: ORANGE,
    color: "#1A0D00",
    border: `1px solid ${ORANGE_BORDER}`,
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 900,
    boxShadow: "0 14px 34px rgba(239,159,39,0.22)",
  },

  heroHint: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: MUTED,
    fontSize: 13,
    fontWeight: 800,
  },

  heroCard: {
    padding: 24,
    borderRadius: 26,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.78))",
    border: "1px solid rgba(255,255,255,0.75)",
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.12)",
    backdropFilter: "blur(14px)",
  },

  heroCardIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: ORANGE_DARK,
    background: ORANGE_SOFT,
    border: `1px solid ${ORANGE_BORDER}`,
    marginBottom: 18,
  },

  heroCardTitle: {
    margin: 0,
    color: TEXT,
    fontSize: 21,
    lineHeight: 1.25,
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },

  heroCardText: {
    margin: "10px 0 0",
    color: MUTED,
    fontSize: 14,
    lineHeight: 1.7,
    fontWeight: 600,
  },

  heroStats: {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },

  benefits: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "0 20px 34px",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },

  benefitCard: {
    padding: 20,
    borderRadius: 20,
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    boxShadow: "0 14px 40px rgba(15, 23, 42, 0.05)",
  },

  benefitIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: ORANGE_DARK,
    background: ORANGE_SOFT,
    border: `1px solid ${ORANGE_BORDER}`,
  },

  benefitTitle: {
    margin: 0,
    color: TEXT,
    fontSize: 15,
    fontWeight: 900,
  },

  benefitText: {
    margin: "6px 0 0",
    color: MUTED,
    fontSize: 13,
    lineHeight: 1.6,
    fontWeight: 600,
  },

  formSection: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "24px 20px 54px",
    display: "grid",
    gridTemplateColumns: "minmax(280px, 0.42fr) minmax(0, 0.58fr)",
    gap: 24,
    alignItems: "start",
  },

  formIntro: {
    position: "sticky",
    top: 24,
    padding: 24,
    borderRadius: 24,
    background: "#111827",
    border: `1px solid ${ORANGE_BORDER}`,
    boxShadow: "0 20px 60px rgba(15, 23, 42, 0.16)",
  },

  formEyebrow: {
    margin: "0 0 10px",
    color: ORANGE,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },

  formTitle: {
    margin: 0,
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 1.15,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },

  formDescription: {
    margin: "12px 0 0",
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 1.7,
    fontWeight: 600,
  },

  formCard: {
    padding: 22,
    borderRadius: 26,
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.09)",
  },

  warningBox: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    background: "#FFF7ED",
    border: "1px solid #FED7AA",
    color: ORANGE_DARK,
    fontSize: 13,
    lineHeight: 1.6,
    fontWeight: 800,
  },

  reassurance: {
    padding: "0 20px 64px",
  },

  reassuranceInner: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: 28,
    borderRadius: 26,
    background:
      "linear-gradient(135deg, rgba(239,159,39,0.14), rgba(255,255,255,0.9))",
    border: `1px solid ${ORANGE_BORDER}`,
    display: "grid",
    gridTemplateColumns: "minmax(0, 0.48fr) minmax(0, 0.52fr)",
    gap: 24,
    alignItems: "center",
  },

  reassuranceEyebrow: {
    margin: "0 0 8px",
    color: ORANGE_DARK,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },

  reassuranceTitle: {
    margin: 0,
    color: TEXT,
    fontSize: 28,
    lineHeight: 1.2,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },

  reassuranceText: {
    margin: 0,
    color: MUTED,
    fontSize: 15,
    lineHeight: 1.8,
    fontWeight: 600,
  },
};