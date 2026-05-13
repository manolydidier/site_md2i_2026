import Link from "next/link";
import { notFound } from "next/navigation";

import ProductLeadForm from "@/app/admin/components/crm/ProductLeadForm";
import { prisma } from "@/app/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

type ProductLeadPageProps = {
  params: Promise<{
    slugOrId: string;
  }>;
};

export const dynamic = "force-dynamic";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
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
  if (!Number.isFinite(numeric)) return raw;
  return `${new Intl.NumberFormat("fr-FR").format(numeric)} Ar`;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Non renseigné";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "Non renseigné";
  }
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
      publishedAt: true,
      createdAt: true,
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!product) notFound();

  const productUrl = `/produits/${product.slug || product.id}`;
  const priceLabel = formatPrice(product.price);
  const dateLabel = formatDate(product.publishedAt || product.createdAt);

  return (
    <main className="lp-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800;9..144,900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        :root {
          --o-50:  #fff7ed;
          --o-100: #ffedd5;
          --o-200: #fed7aa;
          --o-300: #fdba74;
          --o-400: #fb923c;
          --o-500: #f97316;
          --o-600: #ea580c;
          --o-700: #c2410c;
          --ink-900: #0d1117;
          --ink-800: #1c2330;
          --ink-700: #2d3a4f;
          --ink-500: #4b617a;
          --ink-400: #708399;
          --ink-300: #a4b3c4;
          --ink-200: #d1dae4;
          --ink-100: #e8eef5;
          --ink-50:  #f4f7fb;
          --white:   #ffffff;

          --r-sm: 10px;
          --r-md: 16px;
          --r-lg: 22px;
          --r-xl: 28px;

          --font-display: 'Fraunces', Georgia, serif;
          --font-body:    'Plus Jakarta Sans', sans-serif;

          --shadow-sm: 0 1px 2px rgba(13,17,23,.05), 0 4px 12px rgba(13,17,23,.06);
          --shadow-md: 0 2px 8px rgba(13,17,23,.06), 0 12px 32px rgba(13,17,23,.08);
          --shadow-lg: 0 4px 16px rgba(13,17,23,.06), 0 20px 60px rgba(13,17,23,.12);

          --gutter: clamp(20px, 4vw, 64px);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--ink-900);
          background: var(--ink-50);
          position: relative;
          overflow-x: hidden;
        }

        .lp-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse 60% 50% at 5% -5%,  rgba(249,115,22,.13) 0%, transparent 55%),
            radial-gradient(ellipse 50% 45% at 98% 102%, rgba(234,88,12,.09) 0%, transparent 55%),
            radial-gradient(ellipse 40% 30% at 50% 110%, rgba(251,146,60,.06) 0%, transparent 60%),
            linear-gradient(175deg, #f4f7fb 0%, #eef2f8 50%, #fbf6f0 100%);
        }
        .lp-bg::after {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle at 1px 1px, rgba(249,115,22,.05) 1px, transparent 0);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 60% 70% at 50% 40%, black 30%, transparent 100%);
        }

        /* ── Full-width wrapper ── */
        .lp-wrap {
          position: relative;
          z-index: 1;
          width: 100%;
          margin: 0;
          padding: clamp(24px, 3vw, 40px) var(--gutter) clamp(56px, 6vw, 96px);
        }

        /* ── Topbar ── */
        .lp-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: clamp(24px, 2.5vw, 36px);
          animation: fadeDown .5s ease both;
        }

        .lp-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 42px;
          padding: 0 20px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: all .2s ease;
          white-space: nowrap;
        }
        .lp-btn svg { flex-shrink: 0; transition: transform .2s; }

        .lp-btn-ghost {
          color: var(--ink-700);
          background: var(--white);
          border: 1.5px solid var(--ink-200);
          box-shadow: var(--shadow-sm);
        }
        .lp-btn-ghost:hover {
          border-color: var(--o-400);
          color: var(--o-700);
          transform: translateY(-1px);
        }
        .lp-btn-ghost:hover svg { transform: translateX(-3px); }

        .lp-btn-primary {
          color: var(--white);
          background: linear-gradient(135deg, var(--o-500) 0%, var(--o-600) 100%);
          box-shadow: 0 4px 14px rgba(249,115,22,.35);
        }
        .lp-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(249,115,22,.45);
          filter: brightness(1.05);
        }
        .lp-btn-primary:hover svg { transform: translateX(3px); }

        /* ── HERO — asymmetric for full-width ── */
        .lp-hero {
          display: grid;
          grid-template-columns: 1fr minmax(420px, 560px);
          gap: clamp(16px, 1.6vw, 24px);
          align-items: stretch;
          animation: fadeUp .55s .1s ease both;
        }

        /* LEFT: unified product card */
        .lp-product-card {
          background: var(--white);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--ink-100);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .lp-cover {
          position: relative;
          aspect-ratio: 21 / 9;
          min-height: 240px;
          max-height: 380px;
          background: linear-gradient(135deg, var(--ink-800) 0%, var(--ink-900) 100%);
          overflow: hidden;
          flex-shrink: 0;
        }
        .lp-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform .8s ease;
        }
        .lp-product-card:hover .lp-cover img { transform: scale(1.04); }

        .lp-cover-empty {
          width: 100%; height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: clamp(100px, 14vw, 200px);
          font-weight: 900;
          color: rgba(255,255,255,.10);
          letter-spacing: -.06em;
          user-select: none;
        }

        .lp-cover-shade {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(13,17,23,.05) 0%, rgba(13,17,23,.55) 100%);
          pointer-events: none;
        }

        .lp-cover-chip {
          position: absolute;
          top: 20px;
          left: 20px;
          height: 32px;
          padding: 0 16px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--white);
          background: rgba(13,17,23,.55);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255,255,255,.16);
          z-index: 2;
        }
        .lp-cover-chip::before {
          content: '';
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--o-400);
          box-shadow: 0 0 0 3px rgba(251,146,60,.3);
        }

        .lp-card-body {
          padding: clamp(24px, 2.5vw, 44px);
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .lp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          align-self: flex-start;
          height: 28px;
          padding: 0 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--o-700);
          background: var(--o-50);
          border: 1.5px solid var(--o-200);
          margin-bottom: 18px;
        }
        .lp-eyebrow-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--o-500);
          animation: pulse 2s ease-in-out infinite;
        }

        .lp-title {
          font-family: var(--font-display);
          font-size: clamp(30px, 3.6vw, 52px);
          font-weight: 900;
          line-height: 1.04;
          letter-spacing: -.035em;
          color: var(--ink-900);
          margin-bottom: 16px;
        }
        .lp-title em {
          font-style: italic;
          font-weight: 800;
          color: var(--o-500);
        }

        .lp-subtitle {
          font-size: clamp(14.5px, 1vw, 16px);
          font-weight: 500;
          color: var(--ink-500);
          line-height: 1.7;
          margin-bottom: 28px;
          max-width: 720px;
        }

        .lp-meta-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .lp-meta {
          padding: 14px 16px;
          border-radius: var(--r-md);
          background: var(--ink-50);
          border: 1.5px solid var(--ink-100);
          transition: all .2s;
          min-width: 0;
        }
        .lp-meta:hover {
          border-color: var(--o-200);
          background: var(--o-50);
        }
        .lp-meta-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .lp-meta-icon {
          width: 18px; height: 18px;
          color: var(--o-500);
          flex-shrink: 0;
        }
        .lp-meta-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--ink-400);
        }
        .lp-meta-value {
          font-size: 13.5px;
          font-weight: 800;
          color: var(--ink-900);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }

        .lp-checks {
          margin-top: auto;
          padding: 20px;
          border-radius: var(--r-md);
          background: linear-gradient(135deg, var(--o-50) 0%, #fffaf3 100%);
          border: 1.5px solid var(--o-100);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .lp-check-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 14px;
          font-weight: 600;
          color: var(--ink-700);
          line-height: 1.55;
        }
        .lp-check-icon {
          width: 22px; height: 22px;
          flex-shrink: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--o-500), var(--o-600));
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
          margin-top: 1px;
          box-shadow: 0 3px 8px rgba(249,115,22,.3);
        }

        /* RIGHT: form card */
        .lp-form-card {
          background: var(--white);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-lg);
          border: 1.5px solid var(--o-200);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .lp-form-stripe {
          height: 4px;
          background: linear-gradient(90deg, var(--o-400), var(--o-600), var(--o-400));
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
          flex-shrink: 0;
        }

        .lp-form-head {
          padding: clamp(24px, 2vw, 32px) clamp(24px, 2vw, 36px) 22px;
          border-bottom: 1px solid var(--ink-100);
          flex-shrink: 0;
        }

        .lp-form-mini {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: var(--r-md);
          background: var(--ink-50);
          margin-bottom: 20px;
        }
        .lp-form-mini-thumb {
          width: 44px; height: 44px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          background: linear-gradient(135deg, var(--o-500), var(--o-600));
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--white);
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 900;
        }
        .lp-form-mini-thumb img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .lp-form-mini-info { min-width: 0; flex: 1; }
        .lp-form-mini-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--ink-400);
          margin-bottom: 2px;
        }
        .lp-form-mini-name {
          font-size: 14.5px;
          font-weight: 800;
          color: var(--ink-900);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lp-form-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 26px;
          padding: 0 12px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--o-700);
          background: var(--o-50);
          border: 1.5px solid var(--o-200);
          margin-bottom: 12px;
        }
        .lp-form-badge::before {
          content: '';
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--o-500);
        }

        .lp-form-title {
          font-family: var(--font-display);
          font-size: clamp(24px, 1.8vw, 30px);
          font-weight: 900;
          line-height: 1.15;
          letter-spacing: -.025em;
          color: var(--ink-900);
          margin-bottom: 8px;
        }
        .lp-form-sub {
          font-size: 14px;
          font-weight: 500;
          color: var(--ink-500);
          line-height: 1.6;
        }

        .lp-form-body {
          padding: 24px clamp(24px, 2vw, 36px) clamp(24px, 2vw, 36px);
          flex: 1;
        }

        /* ── STEPS ── */
        .lp-steps-section {
          margin-top: clamp(20px, 2vw, 32px);
          padding: clamp(28px, 3vw, 44px);
          background: var(--white);
          border-radius: var(--r-xl);
          border: 1px solid var(--ink-100);
          box-shadow: var(--shadow-md);
          animation: fadeUp .55s .25s ease both;
        }
        .lp-steps-header {
          text-align: center;
          margin-bottom: clamp(24px, 2.5vw, 36px);
        }
        .lp-steps-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 28px;
          padding: 0 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--o-700);
          background: var(--o-50);
          border: 1.5px solid var(--o-200);
          margin-bottom: 12px;
        }
        .lp-steps-title {
          font-family: var(--font-display);
          font-size: clamp(24px, 2.2vw, 32px);
          font-weight: 900;
          letter-spacing: -.025em;
          color: var(--ink-900);
        }
        .lp-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(14px, 1.4vw, 20px);
        }
        .lp-step-card {
          padding: clamp(20px, 2vw, 28px);
          border-radius: var(--r-md);
          background: var(--ink-50);
          border: 1.5px solid var(--ink-100);
          transition: all .25s ease;
          position: relative;
          overflow: hidden;
        }
        .lp-step-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--o-400), var(--o-600));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .3s ease;
        }
        .lp-step-card:hover {
          background: var(--white);
          border-color: var(--o-200);
          box-shadow: 0 10px 28px rgba(249,115,22,.12);
          transform: translateY(-3px);
        }
        .lp-step-card:hover::before { transform: scaleX(1); }

        .lp-step-num {
          width: 44px; height: 44px;
          border-radius: 14px;
          background: var(--white);
          border: 2px solid var(--ink-100);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 900;
          color: var(--o-500);
          margin-bottom: 16px;
          transition: all .25s;
        }
        .lp-step-card:hover .lp-step-num {
          background: var(--o-50);
          border-color: var(--o-300);
          transform: scale(1.05);
        }
        .lp-step-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--ink-900);
          margin-bottom: 8px;
        }
        .lp-step-text {
          font-size: 13.5px;
          font-weight: 500;
          color: var(--ink-500);
          line-height: 1.65;
        }

        /* ── FOOTER BANNER ── */
        .lp-footer {
          margin-top: clamp(16px, 1.6vw, 24px);
          padding: clamp(22px, 2.4vw, 32px) clamp(24px, 3vw, 40px);
          border-radius: var(--r-xl);
          background: linear-gradient(135deg, var(--ink-900) 0%, var(--ink-800) 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          position: relative;
          overflow: hidden;
          animation: fadeUp .55s .35s ease both;
        }
        .lp-footer::before {
          content: '';
          position: absolute;
          top: -100px; right: -100px;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,.28), transparent 70%);
          pointer-events: none;
        }
        .lp-footer::after {
          content: '';
          position: absolute;
          bottom: -60px; left: 10%;
          width: 180px; height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(234,88,12,.18), transparent 70%);
          pointer-events: none;
        }
        .lp-footer-text {
          font-size: 15px;
          font-weight: 500;
          color: rgba(255,255,255,.78);
          line-height: 1.55;
          z-index: 1;
          max-width: 720px;
        }
        .lp-footer-text strong {
          color: var(--white);
          font-weight: 800;
        }
        .lp-footer-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 44px;
          padding: 0 24px;
          border-radius: 999px;
          font-size: 13.5px;
          font-weight: 800;
          color: var(--ink-900);
          background: var(--o-400);
          text-decoration: none;
          flex-shrink: 0;
          transition: all .2s;
          box-shadow: 0 4px 16px rgba(249,115,22,.4);
          z-index: 1;
        }
        .lp-footer-link:hover {
          background: var(--o-500);
          color: var(--white);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(249,115,22,.5);
        }
        .lp-footer-link svg { transition: transform .2s; }
        .lp-footer-link:hover svg { transform: translateX(3px); }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(249,115,22,.18); }
          50%      { box-shadow: 0 0 0 6px rgba(249,115,22,.06); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .lp-hero { grid-template-columns: 1fr; }
        }

        @media (max-width: 720px) {
          .lp-topbar { flex-direction: column; }
          .lp-btn { width: 100%; justify-content: center; }
          .lp-cover { min-height: 200px; aspect-ratio: 16/9; }
          .lp-meta-row { grid-template-columns: 1fr; }
          .lp-steps { grid-template-columns: 1fr; }
          .lp-footer {
            flex-direction: column;
            align-items: flex-start;
          }
          .lp-footer-link { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="lp-bg" aria-hidden="true" />

      <div className="lp-wrap">

        {/* ═══ TOP NAVIGATION ═══ */}
        <nav className="lp-topbar" aria-label="Navigation produit">
          <Link href="/produits" className="lp-btn lp-btn-ghost">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Retour aux produits
          </Link>

          <Link href={productUrl} className="lp-btn lp-btn-primary">
            Voir la fiche produit
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </nav>

        {/* ═══ HERO ═══ */}
        <section className="lp-hero">

          {/* LEFT: Unified product card */}
          <article className="lp-product-card">
            <div className="lp-cover">
              {product.coverImage ? (
                <img src={product.coverImage} alt={product.name} />
              ) : (
                <div className="lp-cover-empty" aria-hidden="true">
                  {product.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="lp-cover-shade" />
              <div className="lp-cover-chip">
                {product.category?.name || "Solution MD2I"}
              </div>
            </div>

            <div className="lp-card-body">
              <span className="lp-eyebrow">
                <span className="lp-eyebrow-dot" />
                Demande commerciale
              </span>

              <h1 className="lp-title">
                Parlons de <em>{product.name}</em>
              </h1>

              <p className="lp-subtitle">
                Présentez-nous votre besoin. L'équipe MD2I vous recontacte
                rapidement pour une démonstration, un devis ou une information
                adaptée à votre contexte.
              </p>

              <div className="lp-meta-row">
                <div className="lp-meta">
                  <div className="lp-meta-head">
                    <svg className="lp-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                    <span className="lp-meta-label">Produit</span>
                  </div>
                  <div className="lp-meta-value" title={product.name}>{product.name}</div>
                </div>

                <div className="lp-meta">
                  <div className="lp-meta-head">
                    <svg className="lp-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                      <line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                    <span className="lp-meta-label">Tarif</span>
                  </div>
                  <div className="lp-meta-value">{priceLabel}</div>
                </div>

                <div className="lp-meta">
                  <div className="lp-meta-head">
                    <svg className="lp-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span className="lp-meta-label">Publication</span>
                  </div>
                  <div className="lp-meta-value">{dateLabel}</div>
                </div>
              </div>

              <div className="lp-checks">
                {[
                  "Demande transmise directement à l'équipe commerciale MD2I.",
                  "Démonstration, devis ou rappel — selon votre choix.",
                  "Demande associée au produit pour un suivi optimal.",
                ].map((text, i) => (
                  <div className="lp-check-item" key={i}>
                    <div className="lp-check-icon">✓</div>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* RIGHT: Form card */}
          <aside className="lp-form-card" id="demande">
            <div className="lp-form-stripe" />

            <div className="lp-form-head">
              <div className="lp-form-mini">
                <div className="lp-form-mini-thumb">
                  {product.coverImage ? (
                    <img src={product.coverImage} alt="" />
                  ) : (
                    product.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="lp-form-mini-info">
                  <div className="lp-form-mini-label">Demande pour</div>
                  <div className="lp-form-mini-name">{product.name}</div>
                </div>
              </div>

              <div className="lp-form-badge">Réponse personnalisée</div>

              <h2 className="lp-form-title">
                Demandez une démo ou un devis
              </h2>

              <p className="lp-form-sub">
                Remplissez les informations ci-dessous. Plus votre message est
                précis, plus notre retour sera adapté.
              </p>
            </div>

            <div className="lp-form-body">
              <ProductLeadForm
                productId={product.id}
                productSlug={product.slug}
                productName={product.name}
                title={`Votre demande pour ${product.name}`}
                description="Indiquez vos coordonnées et votre besoin. MD2I vous recontactera rapidement."
                defaultRequestType="DEMO"
                showProductSelect={false}
              />
            </div>
          </aside>
        </section>

        {/* ═══ STEPS ═══ */}
        <section className="lp-steps-section" aria-label="Comment ça fonctionne">
          <div className="lp-steps-header">
            <div className="lp-steps-eyebrow">Le processus</div>
            <h2 className="lp-steps-title">Comment ça fonctionne</h2>
          </div>

          <div className="lp-steps">
            {[
              {
                num: "1",
                title: "Analyse du besoin",
                text: "Nous identifions votre contexte, votre secteur et les fonctionnalités utiles à votre organisation.",
              },
              {
                num: "2",
                title: "Démonstration ou devis",
                text: "MD2I vous propose une présentation, une estimation ou une offre commerciale sur mesure.",
              },
              {
                num: "3",
                title: "Suivi commercial",
                text: "Votre demande est enregistrée pour faciliter les relances et l'historique de vos échanges.",
              },
            ].map(({ num, title, text }) => (
              <article className="lp-step-card" key={num}>
                <div className="lp-step-num">{num}</div>
                <h3 className="lp-step-title">{title}</h3>
                <p className="lp-step-text">{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ═══ FOOTER BANNER ═══ */}
        <div className="lp-footer">
          <p className="lp-footer-text">
            <strong>Besoin de comparer plusieurs solutions&nbsp;?</strong>{" "}
            Consultez le catalogue complet des produits MD2I et trouvez la
            solution adaptée à votre structure.
          </p>
          <Link href="/produits" className="lp-footer-link">
            Voir le catalogue
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

      </div>
    </main>
  );
}