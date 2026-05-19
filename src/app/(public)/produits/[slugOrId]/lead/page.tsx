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
    return "Sur devis";
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
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

        .lp {
          --font: "Sora", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

          /*
            Light mode non-blanc :
            ambiance ivoire / sable / orange doux,
            lisible et moins fatigante qu'un fond blanc pur.
          */
          --bg: #efe9df;
          --bg-soft: #f7f1e8;
          --surface: #fff8ee;
          --surface-2: #f4ecdf;
          --surface-3: #fff1d7;
          --surface-glass: rgba(255, 248, 238, .86);

          --border: #ded2c1;
          --border-strong: #cbb89f;
          --divider: #e7dcca;

          --text: #1f1a14;
          --text-2: #4d4438;
          --text-3: #7c6f5e;
          --text-muted: #8a7d6b;

          --accent: #ef9f27;
          --accent-dark: #a8560a;
          --accent-hover: #d8891e;
          --accent-bg: #fff0d3;
          --accent-bg-2: #fff6e7;
          --accent-border: #efc27f;
          --accent-text: #753a06;

          --green: #168447;
          --green-bg: #eaf7ee;
          --green-border: #a6dcb9;
          --green-text: #13592f;

          --blue-bg: #eaf2ff;
          --blue-border: #b9cef4;
          --blue-text: #214d92;

          --shadow-xs: 0 1px 2px rgba(55, 41, 22, .06);
          --shadow-sm: 0 8px 22px rgba(55, 41, 22, .08);
          --shadow-md: 0 18px 45px rgba(55, 41, 22, .11);
          --shadow-accent: 0 14px 30px rgba(239, 159, 39, .22);

          /*
            Variables transmises au ProductLeadForm variant="premium".
            Cela évite que le formulaire redevienne blanc en mode light.
          */
          --lead-font-body: "Sora";
          --lead-form-ink: #1f1a14;
          --lead-form-strong: #1f1a14;
          --lead-form-bg: #fff8ee;
          --lead-muted: #5b5044;
          --lead-soft: #7c6f5e;
          --lead-border: #ded2c1;
          --lead-panel-border: #d7c7b1;
          --lead-panel-hover-bg: #f4ecdf;
          --lead-field-bg: #fffaf3;
          --lead-field-focus-bg: #ffffff;
          --lead-placeholder: #9a8b76;
          --lead-option-text: #1f1a14;
          --lead-option-bg: #fff8ee;
          --lead-gold: #a8560a;
          --lead-amber: #d8891e;
          --lead-cyan: #2f7f8f;
          --lead-emerald: #168447;
          --lead-accent-soft: #fff0d3;
          --lead-accent-border: #efc27f;
          --lead-cta-bg: #ef9f27;
          --lead-cta-hover: #f5a623;
          --lead-button-text: #ffffff;

          font-family: var(--font);
          background:
            radial-gradient(circle at 8% 0%, rgba(239,159,39,.18), transparent 32%),
            radial-gradient(circle at 95% 18%, rgba(168,86,10,.10), transparent 30%),
            linear-gradient(180deg, #f7f1e8 0%, #efe9df 44%, #ebe2d5 100%);
          color: var(--text);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        .lp-dark {
          --bg: #0f1115;
          --bg-soft: #14161b;
          --surface: #17191f;
          --surface-2: #1d2027;
          --surface-3: #211b12;
          --surface-glass: rgba(23,25,31,.86);

          --border: #2a2e37;
          --border-strong: #3a404c;
          --divider: #232730;

          --text: #f8fafc;
          --text-2: #cbd5e1;
          --text-3: #94a3b8;
          --text-muted: #7c8797;

          --accent: #f59e0b;
          --accent-dark: #fbbf24;
          --accent-hover: #fbbf24;
          --accent-bg: rgba(245,158,11,.13);
          --accent-bg-2: rgba(245,158,11,.08);
          --accent-border: rgba(245,158,11,.35);
          --accent-text: #facc15;

          --green: #22c55e;
          --green-bg: rgba(34,197,94,.12);
          --green-border: rgba(34,197,94,.35);
          --green-text: #86efac;

          --blue-bg: rgba(59,130,246,.12);
          --blue-border: rgba(59,130,246,.32);
          --blue-text: #93c5fd;

          --shadow-xs: 0 1px 2px rgba(0,0,0,.25);
          --shadow-sm: 0 10px 28px rgba(0,0,0,.25);
          --shadow-md: 0 22px 55px rgba(0,0,0,.35);
          --shadow-accent: 0 14px 34px rgba(245,158,11,.16);

          --lead-form-ink: #f8fafc;
          --lead-form-strong: #ffffff;
          --lead-form-bg: rgba(9, 9, 11, .58);
          --lead-muted: rgba(226, 232, 240, .72);
          --lead-soft: rgba(148, 163, 184, .72);
          --lead-border: rgba(255,255,255,.12);
          --lead-panel-border: rgba(255,255,255,.14);
          --lead-panel-hover-bg: rgba(255,255,255,.08);
          --lead-field-bg: rgba(3, 7, 18, .52);
          --lead-field-focus-bg: rgba(3, 7, 18, .66);
          --lead-placeholder: rgba(148,163,184,.72);
          --lead-option-text: #0f172a;
          --lead-option-bg: #ffffff;
          --lead-gold: #f59e0b;
          --lead-amber: #f59e0b;
          --lead-cyan: #22d3ee;
          --lead-emerald: #34d399;
          --lead-accent-soft: rgba(245,158,11,.13);
          --lead-accent-border: rgba(245,158,11,.35);
          --lead-cta-bg: #ef9f27;
          --lead-cta-hover: #fbbf24;
          --lead-button-text: #09090b;

          background:
            radial-gradient(circle at top left, rgba(245,158,11,.10), transparent 34%),
            linear-gradient(180deg, #101116 0%, var(--bg) 38%, var(--bg) 100%);
        }

        .lp *,
        .lp *::before,
        .lp *::after {
          box-sizing: border-box;
        }

        .lp-page {
          width: min(1320px, 100%);
          margin: 0 auto;
          padding: clamp(18px, 3vw, 34px) clamp(16px, 4vw, 44px) clamp(64px, 8vw, 96px);
        }

        .lp-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: clamp(28px, 4vw, 48px);
        }

        .lp-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 12px;
          font-family: var(--font);
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          border: 1px solid var(--border);
          background: var(--surface-glass);
          color: var(--text-2);
          box-shadow: var(--shadow-xs);
          transition:
            border-color .18s ease,
            background .18s ease,
            color .18s ease,
            box-shadow .18s ease,
            transform .18s ease;
          white-space: nowrap;
          backdrop-filter: blur(12px);
        }

        .lp-btn:hover {
          transform: translateY(-1px);
          border-color: var(--border-strong);
          background: var(--surface);
          color: var(--text);
          box-shadow: var(--shadow-sm);
        }

        .lp-btn-accent {
          background: linear-gradient(135deg, var(--accent), var(--accent-hover));
          border-color: rgba(239,159,39,.70);
          color: #ffffff;
          box-shadow: var(--shadow-accent);
        }

        .lp-btn-accent:hover {
          background: linear-gradient(135deg, var(--accent-hover), var(--accent));
          border-color: var(--accent-hover);
          color: #ffffff;
          box-shadow: 0 18px 36px rgba(239,159,39,.25);
        }

        .lp-grid {
          display: grid;
          grid-template-columns: minmax(310px, 360px) minmax(0, 1fr);
          gap: clamp(20px, 3vw, 30px);
          align-items: start;
        }

        .lp-sidebar {
          position: sticky;
          top: 24px;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
          border-radius: 22px;
          overflow: hidden;
          background: var(--surface);
          box-shadow: var(--shadow-md);
        }

        .lp-cover {
          position: relative;
          background: var(--surface-2);
          border-bottom: 1px solid var(--border);
          overflow: hidden;
        }

        .lp-cover::after {
          content: "";
          position: absolute;
          inset: auto 0 0;
          height: 42%;
          background: linear-gradient(180deg, transparent, rgba(31,26,20,.28));
          pointer-events: none;
        }

        .lp-dark .lp-cover::after {
          background: linear-gradient(180deg, transparent, rgba(15,23,42,.46));
        }

        .lp-cover img {
          width: 100%;
          height: 220px;
          display: block;
          object-fit: cover;
          transform: scale(1.01);
        }

        .lp-cover-empty {
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 76px;
          font-weight: 800;
          color: var(--accent-dark);
          letter-spacing: -0.06em;
          background:
            radial-gradient(circle at 20% 20%, rgba(239,159,39,.22), transparent 36%),
            linear-gradient(135deg, var(--surface-2), var(--accent-bg));
        }

        .lp-cat-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          background: rgba(255,248,238,.94);
          border: 1px solid rgba(255,255,255,.58);
          font-size: 10px;
          font-weight: 800;
          color: #2f251a;
          letter-spacing: .08em;
          text-transform: uppercase;
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 24px rgba(55,41,22,.14);
        }

        .lp-dark .lp-cat-badge {
          background: rgba(15,23,42,.76);
          border-color: rgba(255,255,255,.12);
          color: #f8fafc;
        }

        .lp-product-info {
          padding: 24px 24px 22px;
        }

        .lp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          font-weight: 800;
          color: var(--accent-text);
          text-transform: uppercase;
          letter-spacing: .1em;
          margin-bottom: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          background: var(--accent-bg);
          border: 1px solid var(--accent-border);
        }

        .lp-product-name {
          font-size: clamp(21px, 2.4vw, 28px);
          font-weight: 800;
          letter-spacing: -.04em;
          line-height: 1.12;
          margin: 0 0 12px;
          color: var(--text);
        }

        .lp-product-excerpt {
          font-size: 14px;
          line-height: 1.78;
          color: var(--text-2);
          margin: 0;
        }

        .lp-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-top: 1px solid var(--divider);
          background: var(--surface-2);
        }

        .lp-meta-cell {
          padding: 15px 20px;
        }

        .lp-meta-cell:first-child {
          border-right: 1px solid var(--divider);
        }

        .lp-meta-label {
          font-size: 10px;
          font-weight: 800;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: .1em;
          margin: 0 0 5px;
        }

        .lp-meta-value {
          font-size: 14px;
          font-weight: 800;
          color: var(--text);
          margin: 0;
          line-height: 1.35;
        }

        .lp-trust {
          border-top: 1px solid var(--divider);
          padding: 20px 24px 24px;
          background: linear-gradient(180deg, transparent, rgba(22,132,71,.04));
        }

        .lp-trust-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 800;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: .08em;
          margin: 0 0 15px;
        }

        .lp-trust-title svg {
          color: var(--green);
        }

        .lp-trust-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .lp-trust-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          line-height: 1.62;
          color: var(--text-2);
        }

        .lp-check {
          flex-shrink: 0;
          margin-top: 2px;
          color: var(--green);
        }

        .lp-main {
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-width: 0;
        }

        .lp-form-card {
          border: 1px solid var(--border);
          border-radius: 22px;
          overflow: hidden;
          background: var(--surface);
          box-shadow: var(--shadow-md);
        }

        .lp-form-header {
          position: relative;
          padding: clamp(24px, 4vw, 36px);
          border-bottom: 1px solid var(--border);
          background:
            radial-gradient(circle at top right, rgba(239,159,39,.14), transparent 36%),
            linear-gradient(180deg, var(--surface), var(--surface-2));
        }

        .lp-form-product-row {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
          padding: 10px 12px;
          border-radius: 15px;
          border: 1px solid var(--border);
          background: var(--surface-glass);
          box-shadow: var(--shadow-xs);
          max-width: 100%;
        }

        .lp-form-thumb {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          overflow: hidden;
          flex-shrink: 0;
          background: linear-gradient(135deg, var(--accent), #fbbf24);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: 800;
          color: #ffffff;
        }

        .lp-form-thumb img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .lp-form-for-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .09em;
          color: var(--text-3);
          margin: 0 0 3px;
        }

        .lp-form-for-name {
          font-size: 14px;
          font-weight: 800;
          color: var(--text);
          margin: 0;
          line-height: 1.35;
        }

        .lp-form-heading {
          max-width: 760px;
          font-size: clamp(26px, 4vw, 42px);
          font-weight: 800;
          letter-spacing: -.055em;
          line-height: 1.04;
          color: var(--text);
          margin: 0 0 13px;
        }

        .lp-form-heading span {
          color: var(--accent-dark);
        }

        .lp-dark .lp-form-heading span {
          color: var(--accent);
        }

        .lp-form-sub {
          font-size: 15px;
          line-height: 1.75;
          color: var(--text-2);
          margin: 0 0 22px;
          max-width: 680px;
        }

        .lp-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .lp-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 32px;
          padding: 0 11px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--surface);
          font-size: 12px;
          font-weight: 700;
          color: var(--text-2);
          box-shadow: var(--shadow-xs);
        }

        .lp-chip svg {
          color: var(--accent-dark);
        }

        .lp-form-body {
          padding: clamp(22px, 4vw, 34px);
          background:
            linear-gradient(180deg, var(--surface), var(--surface-2));
        }

        .lp-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .lp-step {
          padding: 20px 20px 22px;
          border: 1px solid var(--border);
          border-radius: 18px;
          background: var(--surface);
          box-shadow: var(--shadow-sm);
        }

        .lp-step-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
        }

        .lp-step-num {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: var(--accent-bg);
          color: var(--accent-text);
          border: 1px solid var(--accent-border);
          font-size: 12px;
          font-weight: 800;
        }

        .lp-step-icon {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: var(--blue-bg);
          color: var(--blue-text);
          border: 1px solid var(--blue-border);
        }

        .lp-step-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--text);
          margin: 0 0 7px;
          letter-spacing: -.02em;
        }

        .lp-step-text {
          font-size: 13px;
          line-height: 1.68;
          color: var(--text-2);
          margin: 0;
        }

        .lp-footer-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 22px;
          border: 1px solid var(--border);
          border-radius: 20px;
          background:
            linear-gradient(135deg, var(--surface), var(--surface-2));
          box-shadow: var(--shadow-sm);
        }

        .lp-footer-strip p {
          font-size: 14px;
          line-height: 1.65;
          color: var(--text-2);
          margin: 0;
        }

        .lp-footer-strip strong {
          color: var(--text);
        }

        @media (max-width: 1080px) {
          .lp-grid {
            grid-template-columns: 1fr;
          }

          .lp-sidebar {
            position: static;
          }

          .lp-cover img,
          .lp-cover-empty {
            height: 220px;
          }

          .lp-steps {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .lp-nav {
            flex-direction: column;
            align-items: stretch;
          }

          .lp-btn {
            width: 100%;
          }

          .lp-meta {
            grid-template-columns: 1fr;
          }

          .lp-meta-cell:first-child {
            border-right: none;
            border-bottom: 1px solid var(--divider);
          }

          .lp-form-product-row {
            width: 100%;
          }

          .lp-chips {
            flex-direction: column;
          }

          .lp-chip {
            justify-content: flex-start;
          }

          .lp-footer-strip {
            flex-direction: column;
            align-items: stretch;
          }

          .lp-footer-strip a {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .lp *,
          .lp *::before,
          .lp *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <div className="lp-page">
        <nav className="lp-nav" aria-label="Navigation produit">
          <Link href="/produits" className="lp-btn">
            <ArrowLeft size={15} aria-hidden="true" />
            Retour aux produits
          </Link>

          <Link href={productUrl} className="lp-btn lp-btn-accent">
            Voir la fiche produit
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </nav>

        <div className="lp-grid">
          <aside className="lp-sidebar">
            <div className="lp-cover">
              {product.coverImage ? (
                <img src={product.coverImage} alt={product.name} />
              ) : (
                <div className="lp-cover-empty" aria-hidden="true">
                  {product.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="lp-cat-badge">
                <BadgeCheck size={12} aria-hidden="true" />
                {categoryLabel}
              </div>
            </div>

            <div className="lp-product-info">
              <div className="lp-eyebrow">
                <Sparkles size={12} aria-hidden="true" />
                Demande commerciale
              </div>

              <h1 className="lp-product-name">{product.name}</h1>

              <p className="lp-product-excerpt">
                {product.excerpt?.trim() ||
                  "Présentez votre besoin à l'équipe MD2I pour recevoir une réponse adaptée."}
              </p>
            </div>

            <div className="lp-meta">
              <div className="lp-meta-cell">
                <p className="lp-meta-label">Produit</p>
                <p className="lp-meta-value">{product.name}</p>
              </div>

              <div className="lp-meta-cell">
                <p className="lp-meta-label">Tarif</p>
                <p className="lp-meta-value">{priceLabel}</p>
              </div>
            </div>

            <div className="lp-trust">
              <h2 className="lp-trust-title">
                <ShieldCheck size={16} aria-hidden="true" />
                Après l'envoi
              </h2>

              <div className="lp-trust-list">
                {[
                  "Votre demande est transmise à l'équipe commerciale MD2I.",
                  "Le produit concerné est automatiquement associé au lead.",
                  "Une relance est créée dans le CRM pour assurer le suivi.",
                ].map((text) => (
                  <div key={text} className="lp-trust-item">
                    <CheckCircle2
                      size={15}
                      className="lp-check"
                      aria-hidden="true"
                    />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="lp-main">
            <div className="lp-form-card">
              <header className="lp-form-header">
                <div className="lp-form-product-row">
                  <div className="lp-form-thumb">
                    {product.coverImage ? (
                      <img src={product.coverImage} alt="" />
                    ) : (
                      product.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div>
                    <p className="lp-form-for-label">Demande pour</p>
                    <p className="lp-form-for-name">{product.name}</p>
                  </div>
                </div>

                <h2 className="lp-form-heading">
                  Demander une <span>démo</span> ou un <span>devis</span>
                </h2>

                <p className="lp-form-sub">
                  Quelques informations suffisent pour qualifier votre demande,
                  sécuriser le suivi commercial et vous orienter vers la bonne
                  réponse MD2I.
                </p>

                <div className="lp-chips" aria-label="Garanties du formulaire">
                  <div className="lp-chip">
                    <Clock3 size={13} aria-hidden="true" />
                    Réponse commerciale structurée
                  </div>

                  <div className="lp-chip">
                    <LockKeyhole size={13} aria-hidden="true" />
                    Formulaire sécurisé anti-spam
                  </div>

                  <div className="lp-chip">
                    <WalletCards size={13} aria-hidden="true" />
                    Produit associé au CRM
                  </div>
                </div>
              </header>

              <div className="lp-form-body">
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

            <div className="lp-steps" aria-label="Processus de demande">
              {[
                {
                  icon: <MessageSquareText size={16} />,
                  num: "01",
                  title: "Vous décrivez le besoin",
                  text: "Indiquez votre contexte, vos coordonnées et le type de demande souhaité.",
                },
                {
                  icon: <FileCheck2 size={16} />,
                  num: "02",
                  title: "MD2I qualifie la demande",
                  text: "Le produit, la source et les informations commerciales sont associés.",
                },
                {
                  icon: <ShieldCheck size={16} />,
                  num: "03",
                  title: "Vous recevez un retour",
                  text: "L'équipe peut proposer une démonstration, un devis ou un rappel.",
                },
              ].map((step) => (
                <article key={step.num} className="lp-step">
                  <div className="lp-step-head">
                    <span className="lp-step-num">{step.num}</span>
                    <span className="lp-step-icon" aria-hidden="true">
                      {step.icon}
                    </span>
                  </div>

                  <h3 className="lp-step-title">{step.title}</h3>
                  <p className="lp-step-text">{step.text}</p>
                </article>
              ))}
            </div>

            <div className="lp-footer-strip">
              <p>
                <strong>Besoin de comparer plusieurs solutions ?</strong>{" "}
                Consultez le catalogue complet MD2I avant de finaliser votre
                demande.
              </p>

              <Link href="/produits" className="lp-btn lp-btn-accent">
                Voir le catalogue
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </LeadThemeShell>
  );
}