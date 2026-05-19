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
      {
        slug: cleanSlugOrId,
      },
      ...(isUuid(cleanSlugOrId)
        ? [
            {
              id: cleanSlugOrId,
            },
          ]
        : []),
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

  if (!product) {
    notFound();
  }

  const productUrl = `/produits/${product.slug || product.id}`;
  const priceLabel = formatPrice(product.price);
  const categoryLabel = product.category?.name || "Solution MD2I";

  return (
    <main className="lead-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

        .lead-root {
          --lead-font-body: "DM Sans", Inter, Arial, Helvetica, sans-serif;
          --lead-bg: #050608;
          --lead-panel: rgba(255, 255, 255, 0.07);
          --lead-panel-strong: rgba(255, 255, 255, 0.105);
          --lead-border: rgba(255, 255, 255, 0.12);
          --lead-text: #f8fafc;
          --lead-muted: rgba(226, 232, 240, 0.7);
          --lead-soft: rgba(148, 163, 184, 0.78);
          --lead-gold: #fcd34d;
          --lead-amber: #f59e0b;
          --lead-cyan: #22d3ee;
          --lead-emerald: #34d399;
          min-height: 100vh;
          color: var(--lead-text);
          background:
            linear-gradient(120deg, rgba(252, 211, 77, 0.09), transparent 28%),
            linear-gradient(240deg, rgba(34, 211, 238, 0.09), transparent 28%),
            linear-gradient(180deg, #050608 0%, #09090b 48%, #050608 100%);
          font-family: var(--lead-font-body);
          overflow-x: hidden;
        }

        .lead-root,
        .lead-root * {
          box-sizing: border-box;
        }

        .lead-root::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.82), transparent 78%);
        }

        .lead-page {
          position: relative;
          width: min(1440px, 100%);
          margin: 0 auto;
          padding: clamp(18px, 3vw, 34px) clamp(16px, 4vw, 56px) clamp(60px, 7vw, 96px);
        }

        .lead-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: clamp(28px, 4vw, 54px);
          animation: leadFadeDown 0.48s ease both;
        }

        .lead-nav-link {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 0 18px;
          border-radius: 999px;
          color: rgba(248, 250, 252, 0.86);
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .lead-nav-link:hover {
          transform: translateY(-2px);
          border-color: rgba(252, 211, 77, 0.34);
          background: rgba(255, 255, 255, 0.09);
        }

        .lead-nav-product {
          color: #0f172a;
          background: #fcd34d;
          border-color: rgba(252, 211, 77, 0.72);
          box-shadow: 0 18px 42px rgba(202, 138, 4, 0.22);
        }

        .lead-layout {
          display: grid;
          grid-template-columns: minmax(320px, 0.82fr) minmax(520px, 1.18fr);
          gap: clamp(18px, 2vw, 28px);
          align-items: start;
        }

        .lead-aside {
          position: sticky;
          top: 22px;
          display: grid;
          gap: 16px;
          animation: leadFadeLeft 0.58s ease both;
        }

        .glass-card {
          border: 1px solid var(--lead-border);
          background:
            linear-gradient(145deg, rgba(255, 255, 255, 0.105), rgba(255, 255, 255, 0.038)),
            rgba(9, 9, 11, 0.62);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.09),
            0 28px 86px rgba(0, 0, 0, 0.36);
          backdrop-filter: blur(24px);
        }

        .product-card {
          overflow: hidden;
          border-radius: 30px;
        }

        .product-cover {
          position: relative;
          min-height: 272px;
          overflow: hidden;
          background:
            linear-gradient(135deg, rgba(252, 211, 77, 0.18), transparent 46%),
            linear-gradient(150deg, #0f172a, #020617 68%);
        }

        .product-cover img {
          width: 100%;
          height: 300px;
          display: block;
          object-fit: cover;
          opacity: 0.9;
          filter: saturate(1.04) contrast(1.04);
          transition: transform 0.7s ease;
        }

        .product-card:hover .product-cover img {
          transform: scale(1.035);
        }

        .product-cover-empty {
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.12);
          font-size: clamp(92px, 12vw, 160px);
          font-weight: 900;
          letter-spacing: -0.08em;
        }

        .product-cover::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(5, 6, 8, 0.1), rgba(5, 6, 8, 0.84)),
            linear-gradient(90deg, rgba(5, 6, 8, 0.38), transparent);
        }

        .product-badge {
          position: absolute;
          left: 18px;
          top: 18px;
          z-index: 2;
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 13px;
          border-radius: 999px;
          color: #fef3c7;
          background: rgba(15, 23, 42, 0.62);
          border: 1px solid rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(14px);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .product-content {
          padding: clamp(22px, 2.4vw, 30px);
        }

        .lead-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          color: var(--lead-gold);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .lead-kicker svg {
          width: 15px;
          height: 15px;
        }

        .product-title {
          max-width: 640px;
          margin: 0;
          color: #ffffff;
          font-size: clamp(32px, 4.4vw, 58px);
          line-height: 0.98;
          letter-spacing: -0.06em;
          font-weight: 950;
        }

        .product-text {
          margin: 18px 0 0;
          color: var(--lead-muted);
          font-size: 15.5px;
          line-height: 1.78;
          font-weight: 600;
        }

        .product-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 24px;
        }

        .meta-box {
          min-height: 92px;
          padding: 16px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .meta-label {
          margin: 0 0 8px;
          color: var(--lead-soft);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .meta-value {
          margin: 0;
          color: #ffffff;
          font-size: 14px;
          line-height: 1.38;
          font-weight: 900;
        }

        .trust-card {
          border-radius: 26px;
          padding: 22px;
        }

        .trust-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 16px;
          color: #ffffff;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .trust-title svg {
          color: var(--lead-cyan);
        }

        .trust-list {
          display: grid;
          gap: 12px;
        }

        .trust-item {
          display: grid;
          grid-template-columns: 34px 1fr;
          gap: 11px;
          align-items: start;
          color: rgba(226, 232, 240, 0.74);
          font-size: 13.5px;
          line-height: 1.55;
          font-weight: 700;
        }

        .trust-check {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          color: var(--lead-emerald);
          background: rgba(52, 211, 153, 0.1);
          border: 1px solid rgba(52, 211, 153, 0.22);
        }

        .form-zone {
          min-width: 0;
          animation: leadFadeRight 0.58s 0.05s ease both;
        }

        .form-shell {
          overflow: hidden;
          border-radius: 34px;
        }

        .form-header {
          position: relative;
          padding: clamp(24px, 3vw, 38px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background:
            linear-gradient(135deg, rgba(252, 211, 77, 0.12), transparent 42%),
            linear-gradient(240deg, rgba(34, 211, 238, 0.09), transparent 38%),
            rgba(255, 255, 255, 0.035);
        }

        .form-mini {
          width: fit-content;
          max-width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
          padding: 10px 12px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .form-mini-icon {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          flex-shrink: 0;
          overflow: hidden;
          color: #09090b;
          background: linear-gradient(135deg, #fcd34d, #22d3ee);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 950;
        }

        .form-mini-icon img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .form-mini-label {
          margin: 0 0 3px;
          color: var(--lead-soft);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .form-mini-name {
          margin: 0;
          color: #ffffff;
          font-size: 15px;
          line-height: 1.25;
          font-weight: 900;
        }

        .form-title {
          max-width: 760px;
          margin: 0;
          color: #ffffff;
          font-size: clamp(31px, 4vw, 54px);
          line-height: 1.02;
          letter-spacing: -0.055em;
          font-weight: 950;
        }

        .form-title span {
          color: var(--lead-gold);
        }

        .form-subtitle {
          max-width: 690px;
          margin: 16px 0 0;
          color: var(--lead-muted);
          font-size: 15.5px;
          line-height: 1.78;
          font-weight: 600;
        }

        .form-highlights {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 24px;
        }

        .highlight {
          min-height: 78px;
          padding: 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .highlight svg {
          color: var(--lead-cyan);
          margin-bottom: 8px;
        }

        .highlight span {
          display: block;
          color: rgba(226, 232, 240, 0.78);
          font-size: 12px;
          line-height: 1.35;
          font-weight: 800;
        }

        .form-body {
          padding: clamp(20px, 2.6vw, 34px);
        }

        .process-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 18px;
        }

        .process-card {
          min-height: 180px;
          padding: 20px;
          border-radius: 24px;
          animation: leadFadeUp 0.55s ease both;
        }

        .process-card:nth-child(2) {
          animation-delay: 0.08s;
        }

        .process-card:nth-child(3) {
          animation-delay: 0.16s;
        }

        .process-icon {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          color: #09090b;
          background: #fcd34d;
          margin-bottom: 16px;
        }

        .process-title {
          margin: 0 0 8px;
          color: #ffffff;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .process-text {
          margin: 0;
          color: var(--lead-soft);
          font-size: 13px;
          line-height: 1.62;
          font-weight: 650;
        }

        .footer-note {
          margin-top: 18px;
          padding: 22px 24px;
          border-radius: 26px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          animation: leadFadeUp 0.55s 0.18s ease both;
        }

        .footer-note p {
          margin: 0;
          color: var(--lead-muted);
          font-size: 14px;
          line-height: 1.65;
          font-weight: 650;
        }

        .footer-note strong {
          color: #ffffff;
        }

        .footer-note a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 18px;
          border-radius: 999px;
          color: #09090b;
          background: #fcd34d;
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
          white-space: nowrap;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .footer-note a:hover {
          transform: translateY(-2px);
          background: #fde68a;
        }

        @keyframes leadFadeDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes leadFadeLeft {
          from { opacity: 0; transform: translateX(-18px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes leadFadeRight {
          from { opacity: 0; transform: translateX(18px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes leadFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .lead-root *,
          .lead-root *::before,
          .lead-root *::after {
            animation-duration: 0.001ms !important;
            scroll-behavior: auto !important;
            transition-duration: 0.001ms !important;
          }
        }

        @media (max-width: 1180px) {
          .lead-layout {
            grid-template-columns: 1fr;
          }

          .lead-aside {
            position: static;
          }

          .product-cover {
            min-height: 220px;
          }

          .product-cover img,
          .product-cover-empty {
            height: 260px;
          }
        }

        @media (max-width: 780px) {
          .lead-page {
            padding-bottom: 54px;
          }

          .lead-nav {
            align-items: stretch;
            flex-direction: column;
          }

          .lead-nav-link {
            width: 100%;
          }

          .product-meta,
          .form-highlights,
          .process-grid {
            grid-template-columns: 1fr;
          }

          .form-shell {
            border-radius: 26px;
          }

          .form-header,
          .form-body {
            padding-left: 18px;
            padding-right: 18px;
          }

          .footer-note {
            align-items: stretch;
            flex-direction: column;
          }

          .footer-note a {
            width: 100%;
          }
        }
      `}</style>

      <div className="lead-page">
        <nav className="lead-nav" aria-label="Navigation produit">
          <Link href="/produits" className="lead-nav-link">
            <ArrowLeft size={17} aria-hidden="true" />
            Retour aux produits
          </Link>

          <Link href={productUrl} className="lead-nav-link lead-nav-product">
            Voir la fiche produit
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </nav>

        <section className="lead-layout">
          <aside className="lead-aside">
            <article className="product-card glass-card">
              <div className="product-cover">
                {product.coverImage ? (
                  <img src={product.coverImage} alt={product.name} />
                ) : (
                  <div className="product-cover-empty" aria-hidden="true">
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="product-badge">
                  <BadgeCheck size={14} aria-hidden="true" />
                  {categoryLabel}
                </div>
              </div>

              <div className="product-content">
                <div className="lead-kicker">
                  <Sparkles aria-hidden="true" />
                  Demande commerciale
                </div>

                <h1 className="product-title">{product.name}</h1>

                <p className="product-text">
                  {product.excerpt?.trim() ||
                    "Présentez votre besoin à l’équipe MD2I pour recevoir une réponse adaptée."}
                </p>

                <div className="product-meta">
                  <div className="meta-box">
                    <p className="meta-label">Produit</p>
                    <p className="meta-value">{product.name}</p>
                  </div>

                  <div className="meta-box">
                    <p className="meta-label">Tarif</p>
                    <p className="meta-value">{priceLabel}</p>
                  </div>
                </div>
              </div>
            </article>

            <article className="trust-card glass-card">
              <h2 className="trust-title">
                <ShieldCheck size={19} aria-hidden="true" />
                Après l’envoi
              </h2>

              <div className="trust-list">
                <div className="trust-item">
                  <span className="trust-check">
                    <CheckCircle2 size={18} aria-hidden="true" />
                  </span>
                  <span>Votre demande est transmise à l’équipe commerciale MD2I.</span>
                </div>

                <div className="trust-item">
                  <span className="trust-check">
                    <CheckCircle2 size={18} aria-hidden="true" />
                  </span>
                  <span>Le produit concerné est automatiquement associé au lead.</span>
                </div>

                <div className="trust-item">
                  <span className="trust-check">
                    <CheckCircle2 size={18} aria-hidden="true" />
                  </span>
                  <span>Une relance est créée dans le CRM pour assurer le suivi.</span>
                </div>
              </div>
            </article>
          </aside>

          <section className="form-zone">
            <div className="form-shell glass-card">
              <header className="form-header">
                <div className="form-mini">
                  <div className="form-mini-icon">
                    {product.coverImage ? (
                      <img src={product.coverImage} alt="" />
                    ) : (
                      product.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div>
                    <p className="form-mini-label">Demande pour</p>
                    <p className="form-mini-name">{product.name}</p>
                  </div>
                </div>

                <h2 className="form-title">
                  Demander une <span>démo</span> ou un <span>devis</span>
                </h2>

                <p className="form-subtitle">
                  Quelques informations suffisent pour qualifier votre demande,
                  sécuriser le suivi commercial et vous orienter vers la bonne
                  réponse MD2I.
                </p>

                <div className="form-highlights" aria-label="Garanties du formulaire">
                  <div className="highlight">
                    <Clock3 size={18} aria-hidden="true" />
                    <span>Réponse commerciale structurée</span>
                  </div>
                  <div className="highlight">
                    <LockKeyhole size={18} aria-hidden="true" />
                    <span>Formulaire sécurisé anti-spam</span>
                  </div>
                  <div className="highlight">
                    <WalletCards size={18} aria-hidden="true" />
                    <span>Produit associé au CRM</span>
                  </div>
                </div>
              </header>

              <div className="form-body">
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

            <div className="process-grid" aria-label="Processus de demande">
              <article className="process-card glass-card">
                <div className="process-icon">
                  <MessageSquareText size={20} aria-hidden="true" />
                </div>
                <h3 className="process-title">Vous décrivez le besoin</h3>
                <p className="process-text">
                  Indiquez votre contexte, vos coordonnées et le type de demande souhaité.
                </p>
              </article>

              <article className="process-card glass-card">
                <div className="process-icon">
                  <FileCheck2 size={20} aria-hidden="true" />
                </div>
                <h3 className="process-title">MD2I qualifie la demande</h3>
                <p className="process-text">
                  Le produit, la source et les informations commerciales sont associés.
                </p>
              </article>

              <article className="process-card glass-card">
                <div className="process-icon">
                  <ShieldCheck size={20} aria-hidden="true" />
                </div>
                <h3 className="process-title">Vous recevez un retour</h3>
                <p className="process-text">
                  L’équipe peut proposer une démonstration, un devis ou un rappel.
                </p>
              </article>
            </div>

            <div className="footer-note glass-card">
              <p>
                <strong>Besoin de comparer plusieurs solutions ?</strong>{" "}
                Consultez le catalogue complet MD2I avant de finaliser votre demande.
              </p>

              <Link href="/produits">
                Voir le catalogue
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
