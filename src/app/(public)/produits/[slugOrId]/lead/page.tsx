import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FileCheck2,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

import ProductLeadForm from "@/app/admin/components/crm/ProductLeadForm";
import { T } from "@/app/i18n/T";
import { prisma } from "@/app/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import LeadThemeShell from "./LeadThemeShell";

type ProductLeadPageProps = {
  params: Promise<{
    slugOrId: string;
  }>;
};

export const dynamic = "force-dynamic";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
    value
  );
}

function formatPrice(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const raw =
    typeof value === "object" && value !== null && "toString" in value
      ? String(value.toString())
      : String(value);

  const numeric = Number(raw);

  if (!Number.isFinite(numeric)) {
    return raw;
  }

  return `${new Intl.NumberFormat("fr-FR").format(numeric)} Ar`;
}

function safeImage(value?: string | null) {
  return value?.trim() || "/placeholder-reference.svg";
}

export default async function ProductLeadPage({ params }: ProductLeadPageProps) {
  const { slugOrId } = await params;
  const cleanSlugOrId = decodeURIComponent(slugOrId).trim();

  const productWhere: Prisma.ProductWhereInput = {
    status: "PUBLISHED",
    OR: [
      { slug: cleanSlugOrId },
      ...(isUuid(cleanSlugOrId) ? [{ id: cleanSlugOrId }] : []),
    ],
  };

  const product = await prisma.product.findFirst({
    where: productWhere,
    select: {
      id: true,
      name: true,
      slug: true,
      excerpt: true,
      price: true,
      coverImage: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!product) notFound();

  const productUrl = `/produits/${product.slug || product.id}`;
  const priceLabel = formatPrice(product.price);
  const categoryLabel = product.category?.name || "Solution MD2I";

  return (
    <LeadThemeShell>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .lead-page {
          --orange: #ef9f27;
          --orange-2: #f7c060;
          --ink: #18181b;
          --muted: #6b7280;
          --line: rgba(15, 23, 42, 0.08);
          --surface: rgba(255,255,255,.96);
          --surface-soft: rgba(248,250,252,.92);
          --surface-glass: rgba(255,255,255,.14);
          --shadow: 0 18px 54px rgba(15, 23, 42, .10);
          --shadow-strong: 0 34px 100px rgba(15, 23, 42, .24);

          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(239,159,39,.10), transparent 30%),
            linear-gradient(180deg, #fffaf3 0%, #ffffff 44%, #f8fafc 100%);
          color: var(--ink);
          font-family: Inter, Arial, Helvetica, sans-serif;

          --lead-font-body: "Inter";
          --lead-form-ink: #18181b;
          --lead-form-strong: #18181b;
          --lead-form-bg: rgba(255,255,255,.96);
          --lead-muted: rgba(24,24,27,.72);
          --lead-soft: rgba(24,24,27,.48);
          --lead-border: rgba(15,23,42,.10);
          --lead-panel-border: rgba(15,23,42,.10);
          --lead-panel-hover-bg: rgba(15,23,42,.035);
          --lead-field-bg: rgba(248,250,252,.92);
          --lead-field-focus-bg: #ffffff;
          --lead-placeholder: rgba(24,24,27,.42);
          --lead-option-text: #18181b;
          --lead-option-bg: #ffffff;
          --lead-gold: #ef9f27;
          --lead-amber: #f7c060;
          --lead-cyan: #2f7f8f;
          --lead-emerald: #168447;
          --lead-accent-soft: rgba(239,159,39,.10);
          --lead-accent-border: rgba(239,159,39,.28);
          --lead-cta-bg: #ef9f27;
          --lead-cta-hover: #f7a928;
          --lead-button-text: #ffffff;
        }

        .lead-page.lp-dark,
        .lp-dark .lead-page {
          --ink: #f8fafc;
          --muted: #94a3b8;
          --line: rgba(255,255,255,.10);
          --surface: rgba(15,23,42,.94);
          --surface-soft: rgba(15,23,42,.76);
          --surface-glass: rgba(255,255,255,.13);
          --shadow: 0 18px 54px rgba(0,0,0,.30);
          --shadow-strong: 0 34px 100px rgba(0,0,0,.58);

          background:
            radial-gradient(circle at top left, rgba(239,159,39,.12), transparent 34%),
            linear-gradient(180deg, #020617 0%, #080b13 42%, #020617 100%);

          --lead-form-ink: #f8fafc;
          --lead-form-strong: #ffffff;
          --lead-form-bg: rgba(15,23,42,.78);
          --lead-muted: rgba(226,232,240,.72);
          --lead-soft: rgba(148,163,184,.72);
          --lead-border: rgba(255,255,255,.12);
          --lead-panel-border: rgba(255,255,255,.14);
          --lead-panel-hover-bg: rgba(255,255,255,.08);
          --lead-field-bg: rgba(3,7,18,.52);
          --lead-field-focus-bg: rgba(3,7,18,.66);
          --lead-placeholder: rgba(148,163,184,.72);
          --lead-option-text: #0f172a;
          --lead-option-bg: #ffffff;
          --lead-gold: #ef9f27;
          --lead-amber: #f7c060;
          --lead-cyan: #22d3ee;
          --lead-emerald: #34d399;
          --lead-accent-soft: rgba(239,159,39,.14);
          --lead-accent-border: rgba(239,159,39,.34);
          --lead-cta-bg: #ef9f27;
          --lead-cta-hover: #fbbf24;
          --lead-button-text: #09090b;
        }

        .lead-page *,
        .lead-page *::before,
        .lead-page *::after {
          box-sizing: border-box;
        }

        .lead-hero {
          position: relative;
          min-height: 620px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
          isolation: isolate;
        }

        .lead-hero-bg {
          position: absolute;
          inset: 0;
          z-index: -2;
          background: #020617;
        }

        .lead-hero-bg img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          filter: saturate(1.04) contrast(1.04);
        }

        .lead-hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(2,6,23,.86), rgba(2,6,23,.56), rgba(2,6,23,.22)),
            linear-gradient(180deg, rgba(2,6,23,.10), rgba(2,6,23,.88));
        }

        .lead-hero-inner {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 138px 0 72px;
          color: #fff;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 34px;
          color: rgba(255,255,255,.68);
          font-size: 13px;
          font-weight: 650;
        }

        .breadcrumb a {
          color: rgba(255,255,255,.78);
          text-decoration: none;
          transition: color .18s ease;
        }

        .breadcrumb a:hover {
          color: var(--orange);
        }

        .breadcrumb strong {
          max-width: 560px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(255,255,255,.94);
          font-weight: 800;
        }

        .lead-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 34px;
          align-items: end;
        }

        .lead-copy {
          max-width: 860px;
        }

        .lead-kicker-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .lead-kicker,
        .lead-chip {
          min-height: 34px;
          padding: 0 13px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .05em;
        }

        .lead-kicker {
          background: rgba(239,159,39,.24);
          border: 1px solid rgba(239,159,39,.42);
          color: #fff;
          text-transform: uppercase;
        }

        .lead-chip {
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.18);
          color: rgba(255,255,255,.88);
        }

        .lead-hero h1 {
          margin: 0;
          font-size: clamp(38px, 6vw, 78px);
          line-height: .96;
          letter-spacing: -.065em;
          font-weight: 950;
        }

        .lead-subtitle {
          margin: 24px 0 0;
          max-width: 760px;
          color: rgba(255,255,255,.78);
          font-size: clamp(16px, 2vw, 20px);
          line-height: 1.75;
          font-weight: 550;
        }

        .lead-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 34px;
        }

        .primary-action,
        .secondary-action {
          min-height: 48px;
          padding: 0 20px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 850;
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .primary-action {
          border: none;
          background: linear-gradient(135deg, var(--orange), var(--orange-2));
          color: #fff;
          box-shadow: 0 14px 30px rgba(239,159,39,.30);
        }

        .secondary-action {
          border: 1px solid rgba(255,255,255,.18);
          background: rgba(255,255,255,.12);
          color: #fff;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .primary-action:hover,
        .secondary-action:hover {
          transform: translateY(-2px);
        }

        .lead-summary-card {
          border-radius: 24px;
          padding: 22px;
          background: rgba(255,255,255,.13);
          border: 1px solid rgba(255,255,255,.16);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          box-shadow: 0 26px 90px rgba(0,0,0,.28);
        }

        .summary-eyebrow {
          display: block;
          margin-bottom: 12px;
          color: var(--orange);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .summary-title {
          display: grid;
          gap: 4px;
          padding-bottom: 18px;
          margin-bottom: 18px;
          border-bottom: 1px solid rgba(255,255,255,.12);
        }

        .summary-title strong {
          font-size: 18px;
          line-height: 1.25;
        }

        .summary-title span {
          color: rgba(255,255,255,.62);
          font-size: 14px;
        }

        .summary-list {
          display: grid;
          gap: 12px;
        }

        .summary-item {
          display: grid;
          gap: 4px;
        }

        .summary-item span {
          color: rgba(255,255,255,.52);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .09em;
          text-transform: uppercase;
        }

        .summary-item strong {
          color: #fff;
          font-size: 14px;
          line-height: 1.4;
        }

        .lead-body {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 72px 0 84px;
        }

        .lead-form-card {
          overflow: hidden;
          border-radius: 28px;
          background: var(--surface);
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
        }

        .lead-form-head {
          position: relative;
          padding: clamp(24px, 4vw, 38px);
          border-bottom: 1px solid var(--line);
          background:
            radial-gradient(circle at top right, rgba(239,159,39,.16), transparent 36%),
            linear-gradient(180deg, var(--surface), var(--surface-soft));
        }

        .lead-form-product-row {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
          padding: 10px 12px;
          border-radius: 16px;
          border: 1px solid var(--line);
          background: rgba(255,255,255,.70);
          box-shadow: 0 8px 22px rgba(15,23,42,.06);
          max-width: 100%;
        }

        .lp-dark .lead-form-product-row {
          background: rgba(255,255,255,.06);
        }

        .lead-form-thumb {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          overflow: hidden;
          flex-shrink: 0;
          background: linear-gradient(135deg, var(--orange), var(--orange-2));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: 900;
          color: #fff;
        }

        .lead-form-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .lead-form-label {
          margin: 0 0 3px;
          color: var(--muted);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .1em;
        }

        .lead-form-product {
          margin: 0;
          color: var(--ink);
          font-size: 14px;
          line-height: 1.35;
          font-weight: 900;
        }

        .lead-form-title {
          max-width: 760px;
          margin: 0 0 13px;
          color: var(--ink);
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 950;
          letter-spacing: -.06em;
          line-height: 1.04;
        }

        .lead-form-title span {
          color: var(--orange);
        }

        .lead-form-sub {
          max-width: 720px;
          margin: 0 0 22px;
          color: var(--muted);
          font-size: 15px;
          line-height: 1.75;
        }

        .lead-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .lead-mini-chip {
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--line);
          background: var(--surface);
          color: var(--muted);
          font-size: 12px;
          font-weight: 800;
        }

        .lead-mini-chip svg {
          color: var(--orange);
        }

        .lead-form-body {
          padding: clamp(22px, 4vw, 36px);
          background: linear-gradient(180deg, var(--surface), var(--surface-soft));
        }

        .lead-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 24px;
        }

        .lead-step {
          padding: 22px;
          border-radius: 24px;
          background: var(--surface);
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
        }

        .lead-step-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .lead-step-num {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(239,159,39,.10);
          border: 1px solid rgba(239,159,39,.24);
          color: var(--orange);
          font-size: 12px;
          font-weight: 950;
        }

        .lead-step-icon {
          width: 36px;
          height: 36px;
          border-radius: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(47,127,143,.10);
          border: 1px solid rgba(47,127,143,.18);
          color: #2f7f8f;
        }

        .lead-step h3 {
          margin: 0 0 8px;
          color: var(--ink);
          font-size: 15px;
          font-weight: 900;
          letter-spacing: -.025em;
        }

        .lead-step p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.68;
        }

        .lead-footer-cta {
          margin-top: 24px;
          padding: clamp(24px, 4vw, 38px);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(239,159,39,.24), transparent 42%),
            #111827;
          border: 1px solid rgba(255,255,255,.10);
          color: #fff;
          box-shadow: var(--shadow);
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 22px;
          align-items: center;
        }

        .lead-footer-cta h2 {
          margin: 0 0 8px;
          font-size: clamp(24px, 3vw, 36px);
          line-height: 1.05;
          letter-spacing: -.045em;
          font-weight: 950;
        }

        .lead-footer-cta p {
          margin: 0;
          color: rgba(255,255,255,.68);
          line-height: 1.7;
          font-size: 15px;
        }

        @media (max-width: 980px) {
          .lead-hero {
            min-height: auto;
          }

          .lead-hero-inner {
            padding: 128px 0 46px;
          }

          .lead-hero-grid {
            grid-template-columns: 1fr;
          }

          .lead-steps {
            grid-template-columns: 1fr;
          }

          .lead-footer-cta {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .lead-hero-inner,
          .lead-body {
            width: min(100% - 28px, 1180px);
          }

          .lead-hero h1 {
            font-size: 40px;
          }

          .lead-actions {
            flex-direction: column;
          }

          .primary-action,
          .secondary-action {
            width: 100%;
          }

          .breadcrumb strong {
            max-width: 260px;
          }

          .lead-footer-cta a {
            width: 100%;
          }
        }
      `}</style>

      <main className="lead-page">
        <section className="lead-hero">
          <div className="lead-hero-bg">
            <img src={safeImage(product.coverImage)} alt="" />
            <div className="lead-hero-overlay" />
          </div>

          <div className="lead-hero-inner">
            <nav className="breadcrumb" aria-label="Fil d’Ariane">
              <Link href="/">Accueil</Link>
              <span>/</span>
              <Link href="/produits">Produits</Link>
              <span>/</span>
              <Link href={productUrl}>{product.name}</Link>
              <span>/</span>
              <strong>Demande</strong>
            </nav>

            <div className="lead-hero-grid">
              <div className="lead-copy">
                <div className="lead-kicker-row">
                  <span className="lead-kicker">
                    <Sparkles size={13} aria-hidden="true" />
                    Demande commerciale
                  </span>

                  <span className="lead-chip">
                    <BadgeCheck size={13} aria-hidden="true" />
                    {categoryLabel}
                  </span>

                  <span className="lead-chip">
                    {priceLabel ?? <T k="productsPage.card.onRequest">Sur devis</T>}
                  </span>
                </div>

                <h1>
                  <T k="productLeadPage.formHeadingPrefix">Demander une</T>{" "}
                  <span>démo</span> ou un <span>devis</span>
                </h1>

                <p className="lead-subtitle">
                  <T k="productLeadPage.formSub">
                    Quelques informations suffisent pour qualifier votre demande,
                    sécuriser le suivi commercial et vous orienter vers la bonne
                    réponse MD2I.
                  </T>
                </p>

                <div className="lead-actions">
                  <a href="#lead-form" className="primary-action">
                    Remplir le formulaire
                    <ArrowRight size={15} aria-hidden="true" />
                  </a>

                  <Link href={productUrl} className="secondary-action">
                    <ArrowLeft size={15} aria-hidden="true" />
                    Voir la fiche produit
                  </Link>
                </div>
              </div>

              <aside className="lead-summary-card">
                <span className="summary-eyebrow">Produit concerné</span>

                <div className="summary-title">
                  <strong>{product.name}</strong>
                  <span>{categoryLabel}</span>
                </div>

                <div className="summary-list">
                  <div className="summary-item">
                    <span>Produit</span>
                    <strong>{product.name}</strong>
                  </div>

                  <div className="summary-item">
                    <span>Tarif</span>
                    <strong>
                      {priceLabel ?? <T k="productsPage.card.onRequest">Sur devis</T>}
                    </strong>
                  </div>

                  <div className="summary-item">
                    <span>Suivi</span>
                    <strong>CRM MD2I</strong>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="lead-body" id="lead-form">
          <div className="lead-form-card">
            <header className="lead-form-head">
              <div className="lead-form-product-row">
                <div className="lead-form-thumb">
                  {product.coverImage ? (
                    <img src={product.coverImage} alt="" />
                  ) : (
                    product.name.charAt(0).toUpperCase()
                  )}
                </div>

                <div>
                  <p className="lead-form-label">
                    <T k="productLeadPage.formFor">Demande pour</T>
                  </p>
                  <p className="lead-form-product">{product.name}</p>
                </div>
              </div>

              <h2 className="lead-form-title">
                <T k="productLeadPage.formHeadingPrefix">Demander une</T>{" "}
                <span>
                  <T k="productLeadPage.demo">démo</T>
                </span>{" "}
                <T k="productLeadPage.formHeadingOr">ou un</T>{" "}
                <span>
                  <T k="productLeadPage.quote">devis</T>
                </span>
              </h2>

              <p className="lead-form-sub">
                <T k="productLeadPage.formSub">
                  Quelques informations suffisent pour qualifier votre demande,
                  sécuriser le suivi commercial et vous orienter vers la bonne
                  réponse MD2I.
                </T>
              </p>

              <div className="lead-chips" aria-label="Garanties du formulaire">
                <div className="lead-mini-chip">
                  <Clock3 size={13} aria-hidden="true" />
                  <T k="productLeadPage.chips.structured">
                    Réponse commerciale structurée
                  </T>
                </div>

                <div className="lead-mini-chip">
                  <LockKeyhole size={13} aria-hidden="true" />
                  <T k="productLeadPage.chips.secure">
                    Formulaire sécurisé anti-spam
                  </T>
                </div>

                <div className="lead-mini-chip">
                  <WalletCards size={13} aria-hidden="true" />
                  <T k="productLeadPage.chips.crm">Produit associé au CRM</T>
                </div>
              </div>
            </header>

            <div className="lead-form-body">
              <ProductLeadForm
                productId={product.id}
                productSlug={product.slug}
                productName={product.name}
                title=""
                description=""
                defaultRequestType="DEMO"
                showProductSelect={false}
                variant="premium"
                hideHeader
              />
            </div>
          </div>

          <div className="lead-steps" aria-label="Processus de demande">
            {[
              {
                icon: <MessageSquareText size={16} />,
                num: "01",
                key: "describe",
                title: "Vous décrivez le besoin",
                text: "Indiquez votre contexte, vos coordonnées et le type de demande souhaité.",
              },
              {
                icon: <FileCheck2 size={16} />,
                num: "02",
                key: "qualify",
                title: "MD2I qualifie la demande",
                text: "Le produit, la source et les informations commerciales sont associés.",
              },
              {
                icon: <ShieldCheck size={16} />,
                num: "03",
                key: "reply",
                title: "Vous recevez un retour",
                text: "L'équipe peut proposer une démonstration, un devis ou un rappel.",
              },
            ].map((step) => (
              <article key={step.num} className="lead-step">
                <div className="lead-step-head">
                  <span className="lead-step-num">{step.num}</span>
                  <span className="lead-step-icon" aria-hidden="true">
                    {step.icon}
                  </span>
                </div>

                <h3>
                  <T k={`productLeadPage.steps.${step.key}.title`}>
                    {step.title}
                  </T>
                </h3>

                <p>
                  <T k={`productLeadPage.steps.${step.key}.text`}>
                    {step.text}
                  </T>
                </p>
              </article>
            ))}
          </div>

          <div className="lead-footer-cta">
            <div>
              <h2>
                <T k="productLeadPage.footer.title">
                  Besoin de comparer plusieurs solutions ?
                </T>
              </h2>

              <p>
                <T k="productLeadPage.footer.text">
                  Consultez le catalogue complet MD2I avant de finaliser votre
                  demande.
                </T>
              </p>
            </div>

            <Link href="/produits" className="primary-action">
              <T k="productLeadPage.footer.cta">Voir le catalogue</T>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </LeadThemeShell>
  );
}
