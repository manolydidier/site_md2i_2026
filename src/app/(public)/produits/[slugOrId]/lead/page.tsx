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

  return (
    <main className="lead-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * {
          box-sizing: border-box;
        }

        .lead-root {
          min-height: 100vh;
          font-family: Inter, Arial, Helvetica, sans-serif;
          color: #0f172a;
          background:
            radial-gradient(circle at 8% 0%, rgba(249, 115, 22, 0.16), transparent 34%),
            radial-gradient(circle at 92% 14%, rgba(30, 58, 138, 0.12), transparent 36%),
            linear-gradient(135deg, #f8fafc 0%, #eef2f7 52%, #fff7ed 100%);
          overflow-x: hidden;
        }

        .lead-page {
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
          padding: 24px 22px 70px;
        }

        .lead-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 26px;
          animation: leadFadeDown 0.45s ease both;
        }

        .lead-nav-link {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 0 16px;
          border-radius: 999px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          transition: 0.18s ease;
        }

        .lead-nav-back {
          color: #334155;
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(148, 163, 184, 0.28);
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
        }

        .lead-nav-product {
          color: #9a3412;
          background: #fff7ed;
          border: 1px solid #fed7aa;
        }

        .lead-nav-link:hover {
          transform: translateY(-1px);
          opacity: 0.9;
        }

        .lead-layout {
          display: grid;
          grid-template-columns: minmax(320px, 0.78fr) minmax(440px, 1.22fr);
          gap: 24px;
          align-items: start;
        }

        .lead-aside {
          position: sticky;
          top: 22px;
          display: grid;
          gap: 16px;
          animation: leadFadeLeft 0.55s ease both;
        }

        .product-card,
        .trust-card,
        .form-shell {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(203, 213, 225, 0.86);
          border-radius: 28px;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.1);
          backdrop-filter: blur(14px);
        }

        .product-card {
          overflow: hidden;
        }

        .product-cover {
          position: relative;
          min-height: 220px;
          background: linear-gradient(135deg, #0f172a, #1e3a8a 60%, #f97316 140%);
          overflow: hidden;
        }

        .product-cover img {
          width: 100%;
          height: 260px;
          display: block;
          object-fit: cover;
          transition: transform 0.7s ease;
        }

        .product-card:hover .product-cover img {
          transform: scale(1.04);
        }

        .product-cover-empty {
          height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.16);
          font-size: 104px;
          font-weight: 900;
          letter-spacing: -0.08em;
        }

        .product-cover::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0.72)),
            radial-gradient(circle at 20% 20%, rgba(255,255,255,.2), transparent 35%);
        }

        .product-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 2;
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          padding: 0 12px;
          border-radius: 999px;
          color: #fff7ed;
          background: rgba(15, 23, 42, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(10px);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .product-content {
          padding: 24px;
        }

        .lead-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 13px;
          color: #ea580c;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .lead-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #f97316;
          box-shadow: 0 0 0 6px rgba(249, 115, 22, 0.14);
          animation: leadPulse 2.2s ease-in-out infinite;
        }

        .product-title {
          margin: 0;
          color: #0f172a;
          font-size: clamp(28px, 3vw, 42px);
          line-height: 1.03;
          letter-spacing: -0.055em;
          font-weight: 950;
        }

        .product-text {
          margin: 14px 0 0;
          color: #475569;
          font-size: 14.5px;
          line-height: 1.7;
          font-weight: 600;
        }

        .product-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 20px;
        }

        .meta-box {
          min-height: 82px;
          padding: 14px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .meta-label {
          margin: 0 0 7px;
          color: #64748b;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .meta-value {
          margin: 0;
          color: #0f172a;
          font-size: 14px;
          line-height: 1.35;
          font-weight: 900;
        }

        .trust-card {
          padding: 22px;
        }

        .trust-title {
          margin: 0 0 14px;
          color: #0f172a;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .trust-list {
          display: grid;
          gap: 12px;
        }

        .trust-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: #334155;
          font-size: 13.5px;
          line-height: 1.55;
          font-weight: 700;
        }

        .trust-check {
          width: 22px;
          height: 22px;
          flex: 0 0 22px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          background: linear-gradient(135deg, #16a34a, #15803d);
          font-size: 12px;
          font-weight: 900;
          margin-top: 1px;
        }

        .form-zone {
          animation: leadFadeRight 0.55s 0.06s ease both;
        }

        .form-shell {
          overflow: hidden;
          border-color: rgba(249, 115, 22, 0.32);
        }

        .form-stripe {
          height: 5px;
          background: linear-gradient(90deg, #fb923c, #ea580c, #facc15, #fb923c);
          background-size: 220% 100%;
          animation: leadShimmer 3s linear infinite;
        }

        .form-header {
          padding: 28px 30px 20px;
          border-bottom: 1px solid #e2e8f0;
          background:
            radial-gradient(circle at 10% 0%, rgba(249, 115, 22, 0.1), transparent 34%),
            #ffffff;
        }

        .form-mini {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        .form-mini-icon {
          width: 48px;
          height: 48px;
          border-radius: 15px;
          flex-shrink: 0;
          overflow: hidden;
          color: #ffffff;
          background: linear-gradient(135deg, #f97316, #c2410c);
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
          color: #64748b;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .form-mini-name {
          margin: 0;
          color: #0f172a;
          font-size: 15px;
          line-height: 1.25;
          font-weight: 900;
        }

        .form-title {
          margin: 0;
          color: #0f172a;
          font-size: clamp(26px, 3vw, 40px);
          line-height: 1.08;
          letter-spacing: -0.045em;
          font-weight: 950;
        }

        .form-title span {
          color: #ea580c;
        }

        .form-subtitle {
          max-width: 620px;
          margin: 12px 0 0;
          color: #475569;
          font-size: 15px;
          line-height: 1.65;
          font-weight: 650;
        }

        .form-body {
          padding: 28px 30px 30px;
        }

        .process-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 24px;
        }

        .process-card {
          padding: 20px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(203, 213, 225, 0.78);
          box-shadow: 0 16px 44px rgba(15, 23, 42, 0.07);
          animation: leadFadeUp 0.55s ease both;
        }

        .process-card:nth-child(2) {
          animation-delay: 0.08s;
        }

        .process-card:nth-child(3) {
          animation-delay: 0.16s;
        }

        .process-num {
          width: 40px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          color: #ea580c;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          font-weight: 950;
          margin-bottom: 14px;
        }

        .process-title {
          margin: 0 0 8px;
          color: #0f172a;
          font-size: 15px;
          font-weight: 900;
        }

        .process-text {
          margin: 0;
          color: #64748b;
          font-size: 13.5px;
          line-height: 1.6;
          font-weight: 600;
        }

        .footer-note {
          margin-top: 24px;
          padding: 22px 24px;
          border-radius: 24px;
          background: #0f172a;
          color: #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          animation: leadFadeUp 0.55s 0.18s ease both;
        }

        .footer-note p {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          font-weight: 650;
        }

        .footer-note strong {
          color: #ffffff;
        }

        .footer-note a {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 18px;
          border-radius: 999px;
          color: #1f1308;
          background: #fb923c;
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
          white-space: nowrap;
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

        @keyframes leadPulse {
          0%, 100% { box-shadow: 0 0 0 6px rgba(249,115,22,.14); }
          50% { box-shadow: 0 0 0 10px rgba(249,115,22,.04); }
        }

        @keyframes leadShimmer {
          0% { background-position: 220% 0; }
          100% { background-position: -220% 0; }
        }

        @media (max-width: 1120px) {
          .lead-layout {
            grid-template-columns: 1fr;
          }

          .lead-aside {
            position: static;
          }

          .process-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .lead-page {
            padding: 18px 14px 48px;
          }

          .lead-nav {
            flex-direction: column;
            align-items: stretch;
          }

          .lead-nav-link {
            justify-content: center;
          }

          .product-meta {
            grid-template-columns: 1fr;
          }

          .form-header,
          .form-body {
            padding-left: 20px;
            padding-right: 20px;
          }

          .footer-note {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>

      <div className="lead-page">
        <nav className="lead-nav" aria-label="Navigation produit">
          <Link href="/produits" className="lead-nav-link lead-nav-back">
            <span aria-hidden="true">←</span>
            Retour aux produits
          </Link>

          <Link href={productUrl} className="lead-nav-link lead-nav-product">
            Voir la fiche produit
            <span aria-hidden="true">→</span>
          </Link>
        </nav>

        <section className="lead-layout">
          <aside className="lead-aside">
            <article className="product-card">
              <div className="product-cover">
                {product.coverImage ? (
                  <img src={product.coverImage} alt={product.name} />
                ) : (
                  <div className="product-cover-empty" aria-hidden="true">
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="product-badge">
                  {product.category?.name || "Solution MD2I"}
                </div>
              </div>

              <div className="product-content">
                <div className="lead-kicker">
                  <span className="lead-dot" />
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

            <article className="trust-card">
              <h2 className="trust-title">Ce qui se passe après l’envoi</h2>

              <div className="trust-list">
                <div className="trust-item">
                  <span className="trust-check">✓</span>
                  <span>Votre demande est transmise à l’équipe commerciale.</span>
                </div>

                <div className="trust-item">
                  <span className="trust-check">✓</span>
                  <span>Le produit concerné est automatiquement associé.</span>
                </div>

                <div className="trust-item">
                  <span className="trust-check">✓</span>
                  <span>Une relance commerciale est créée dans le CRM.</span>
                </div>
              </div>
            </article>
          </aside>

          <section className="form-zone">
            <div className="form-shell">
              <div className="form-stripe" />

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
                  Remplissez ce formulaire. Les champs importants sont validés,
                  la demande est sécurisée et votre message arrive directement
                  dans le CRM MD2I.
                </p>
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
                />
              </div>
            </div>

            <div className="process-grid" aria-label="Processus de demande">
              <article className="process-card">
                <div className="process-num">1</div>
                <h3 className="process-title">Vous envoyez votre besoin</h3>
                <p className="process-text">
                  Indiquez vos coordonnées, votre structure et le type de
                  demande souhaité.
                </p>
              </article>

              <article className="process-card">
                <div className="process-num">2</div>
                <h3 className="process-title">MD2I analyse votre contexte</h3>
                <p className="process-text">
                  La demande est qualifiée avec le produit, la source et les
                  informations commerciales.
                </p>
              </article>

              <article className="process-card">
                <div className="process-num">3</div>
                <h3 className="process-title">Vous recevez un retour</h3>
                <p className="process-text">
                  L’équipe peut vous proposer une démonstration, un devis ou un
                  rappel.
                </p>
              </article>
            </div>

            <div className="footer-note">
              <p>
                <strong>Besoin de comparer plusieurs solutions ?</strong>{" "}
                Consultez le catalogue complet MD2I.
              </p>

              <Link href="/produits">Voir le catalogue</Link>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}