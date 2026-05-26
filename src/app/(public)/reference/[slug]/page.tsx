import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";

type ReferencePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function decodeSlug(value: string) {
  return decodeURIComponent(value || "").trim();
}

function stripHtml(value?: string | null) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function hasHtml(value?: string | null) {
  return Boolean(value && /<\/?[a-z][\s\S]*>/i.test(value));
}

function HtmlContent({
  content,
  className,
}: {
  content?: string | null;
  className?: string;
}) {
  const value = content?.trim();

  if (!value) return null;

  if (hasHtml(value)) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{
          __html: value,
        }}
      />
    );
  }

  return <p className={className}>{value}</p>;
}

async function getReference(slug: string) {
  return prisma.reference.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
  });
}

async function getRelatedReferences({
  slug,
  category,
}: {
  slug: string;
  category: string;
}) {
  return prisma.reference.findMany({
    where: {
      status: "PUBLISHED",
      slug: {
        not: slug,
      },
      category,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      image: true,
      client: true,
      country: true,
      category: true,
      date: true,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: 3,
  });
}

export async function generateMetadata({ params }: ReferencePageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);

  const reference = await getReference(slug);

  if (!reference) {
    return {
      title: "Référence introuvable | MD2I",
      description: "Cette référence est introuvable ou non publiée.",
    };
  }

  const description = stripHtml(reference.excerpt).slice(0, 160);

  return {
    title: `${reference.title} | Référence MD2I`,
    description,
    openGraph: {
      title: reference.title,
      description,
      images: reference.image ? [{ url: reference.image }] : [],
    },
  };
}

export default async function ReferenceDetailPage({
  params,
}: ReferencePageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);

  const reference = await getReference(slug);

  if (!reference) {
    notFound();
  }

  const relatedReferences = await getRelatedReferences({
    slug: reference.slug,
    category: reference.category,
  });

  const technologies = Array.isArray(reference.technologies)
    ? reference.technologies
    : [];

  const tags = Array.isArray(reference.tags) ? reference.tags : [];

  const stats = [
    { label: "Client", value: reference.client },
    { label: "Pays", value: reference.country },
    { label: "Année", value: reference.date },
    { label: "Catégorie", value: reference.category },
    { label: "Impact", value: reference.impact },
    { label: "Durée", value: reference.duration },
    { label: "Équipe", value: reference.team },
    { label: "Budget", value: reference.budget },
  ].filter((item) => Boolean(item.value));

  return (
    <main className="reference-detail-page">
      <section className="reference-hero">
        <div className="reference-hero-media">
          {reference.image ? <img src={reference.image} alt="" /> : null}
          <div className="reference-hero-overlay" />
        </div>

        <div className="reference-hero-inner">
          <nav className="breadcrumb" aria-label="Fil d’Ariane">
            <Link href="/">Accueil</Link>
            <span>/</span>
            <Link href="/reference">Références</Link>
            <span>/</span>
            <strong>{reference.title}</strong>
          </nav>

          <div className="reference-hero-grid">
            <div className="reference-hero-text">
              <div className="pill-row">
                <span className="pill main">{reference.category}</span>
                <span className="pill">{reference.country}</span>
                <span className="pill">{reference.date}</span>
              </div>

              <h1>{reference.title}</h1>

              <HtmlContent
                content={reference.excerpt}
                className="reference-hero-excerpt"
              />

              <div className="reference-hero-actions">
                <Link href="/contact-commercial" className="primary-link">
                  Discuter d’un projet similaire
                </Link>

                <Link href="/reference" className="secondary-link">
                  Voir toutes les références
                </Link>
              </div>
            </div>

            <aside className="reference-hero-card">
              <span className="card-eyebrow">Fiche projet</span>

              <div className="card-title">
                <strong>{reference.client}</strong>
                <span>{reference.country}</span>
              </div>

              <div className="mini-stats">
                {stats.slice(0, 5).map((item) => (
                  <div key={item.label} className="mini-stat">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="reference-content">
        <div className="reference-content-grid">
          <article className="article-card">
            <div className="section-heading">
              <span>Contexte & réalisation</span>
              <h2>Détails du projet</h2>
            </div>

            <HtmlContent content={reference.details} className="rich-content" />

            {reference.gjsHtml ? (
              <div
                className="builder-content"
                dangerouslySetInnerHTML={{
                  __html: reference.gjsHtml,
                }}
              />
            ) : null}
          </article>

          <aside className="side-panel">
            <div className="info-card">
              <h3>Informations clés</h3>

              <div className="info-list">
                {stats.map((item) => (
                  <div key={item.label} className="info-item">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            {technologies.length > 0 ? (
              <div className="info-card">
                <h3>Technologies</h3>

                <div className="tag-list">
                  {technologies.map((technology) => (
                    <span key={technology}>{technology}</span>
                  ))}
                </div>
              </div>
            ) : null}

            {tags.length > 0 ? (
              <div className="info-card">
                <h3>Tags</h3>

                <div className="tag-list soft">
                  {tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="cta-card">
              <h3>Vous avez un besoin similaire ?</h3>
              <p>
                Parlons de votre contexte, de vos contraintes techniques et des
                scénarios d’exploitation possibles.
              </p>

              <Link
                href={`/contact-commercial?reference=${encodeURIComponent(
                  reference.slug
                )}`}
              >
                Contacter MD2I
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {relatedReferences.length > 0 ? (
        <section className="related-section">
          <div className="related-head">
            <span>Autres réalisations</span>
            <h2>Références similaires</h2>
          </div>

          <div className="related-grid">
            {relatedReferences.map((item) => (
              <Link
                key={item.id}
                href={`/reference/${item.slug}`}
                className="related-card"
              >
                <div className="related-image">
                  {item.image ? <img src={item.image} alt={item.title} /> : null}
                </div>

                <div className="related-body">
                  <span>
                    {item.category} · {item.country}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.client}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <style>{`
        .reference-detail-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(239,159,39,.10), transparent 30%),
            linear-gradient(180deg, #fffaf3 0%, #ffffff 42%, #f7f8fb 100%);
          color: #101114;
          font-family: Inter, DM Sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .reference-hero {
          position: relative;
          min-height: 680px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
          isolation: isolate;
        }

        .reference-hero-media {
          position: absolute;
          inset: 0;
          z-index: -2;
          background: #111827;
        }

        .reference-hero-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(1.05) contrast(1.04);
        }

        .reference-hero-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          background:
            linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.48), rgba(0,0,0,.18)),
            linear-gradient(180deg, rgba(0,0,0,.18), rgba(0,0,0,.84));
        }

        .reference-hero-inner {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 138px 0 72px;
          color: white;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 34px;
          color: rgba(255,255,255,.68);
          font-size: 13px;
        }

        .breadcrumb a {
          color: rgba(255,255,255,.78);
          text-decoration: none;
        }

        .breadcrumb a:hover {
          color: #EF9F27;
        }

        .breadcrumb strong {
          color: rgba(255,255,255,.92);
          font-weight: 700;
        }

        .reference-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 34px;
          align-items: end;
        }

        .reference-hero-text {
          max-width: 820px;
        }

        .pill-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          padding: 0 13px;
          border-radius: 999px;
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.18);
          color: rgba(255,255,255,.88);
          backdrop-filter: blur(10px);
          font-size: 13px;
          font-weight: 700;
        }

        .pill.main {
          color: #fff;
          background: rgba(239,159,39,.24);
          border-color: rgba(239,159,39,.44);
        }

        .reference-hero h1 {
          margin: 0;
          font-size: clamp(38px, 6vw, 78px);
          line-height: .96;
          letter-spacing: -0.065em;
          max-width: 980px;
        }

        .reference-hero-excerpt {
          margin: 24px 0 0;
          max-width: 760px;
          color: rgba(255,255,255,.78);
          font-size: clamp(16px, 2vw, 20px);
          line-height: 1.7;
        }

        .reference-hero-excerpt p {
          margin: 0;
        }

        .reference-hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 34px;
        }

        .primary-link,
        .secondary-link {
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 0 20px;
          text-decoration: none;
          font-weight: 800;
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .primary-link {
          background: #EF9F27;
          color: white;
          box-shadow: 0 18px 40px rgba(239,159,39,.28);
        }

        .primary-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 46px rgba(239,159,39,.36);
        }

        .secondary-link {
          background: rgba(255,255,255,.12);
          color: white;
          border: 1px solid rgba(255,255,255,.18);
          backdrop-filter: blur(10px);
        }

        .secondary-link:hover {
          background: rgba(255,255,255,.18);
          transform: translateY(-2px);
        }

        .reference-hero-card {
          border-radius: 28px;
          padding: 22px;
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.16);
          backdrop-filter: blur(24px);
          box-shadow: 0 24px 80px rgba(0,0,0,.26);
        }

        .card-eyebrow {
          display: block;
          margin-bottom: 12px;
          color: #EF9F27;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .card-title {
          display: grid;
          gap: 4px;
          padding-bottom: 18px;
          margin-bottom: 18px;
          border-bottom: 1px solid rgba(255,255,255,.12);
        }

        .card-title strong {
          font-size: 18px;
        }

        .card-title span {
          color: rgba(255,255,255,.62);
          font-size: 14px;
        }

        .mini-stats,
        .info-list {
          display: grid;
          gap: 12px;
        }

        .mini-stat,
        .info-item {
          display: grid;
          gap: 4px;
        }

        .mini-stat span,
        .info-item span {
          color: rgba(255,255,255,.52);
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .mini-stat strong {
          color: white;
          font-size: 14px;
          line-height: 1.35;
        }

        .reference-content {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 72px 0;
        }

        .reference-content-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 350px;
          gap: 28px;
          align-items: start;
        }

        .article-card,
        .info-card,
        .cta-card {
          background: rgba(255,255,255,.86);
          border: 1px solid rgba(15,23,42,.08);
          box-shadow: 0 18px 60px rgba(15,23,42,.06);
        }

        .article-card {
          border-radius: 32px;
          padding: clamp(26px, 4vw, 46px);
        }

        .section-heading {
          margin-bottom: 28px;
        }

        .section-heading span,
        .related-head span {
          display: block;
          margin-bottom: 8px;
          color: #EF9F27;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .1em;
        }

        .section-heading h2,
        .related-head h2 {
          margin: 0;
          font-size: clamp(26px, 3vw, 40px);
          line-height: 1.05;
          letter-spacing: -.04em;
        }

        .rich-content,
        .builder-content {
          color: rgba(15,23,42,.78);
          font-size: 16px;
          line-height: 1.85;
        }

        .rich-content > *:first-child,
        .builder-content > *:first-child {
          margin-top: 0;
        }

        .rich-content h2,
        .rich-content h3,
        .builder-content h2,
        .builder-content h3 {
          color: #101114;
          line-height: 1.18;
          letter-spacing: -.025em;
          margin-top: 32px;
        }

        .rich-content p,
        .builder-content p {
          margin: 0 0 18px;
        }

        .rich-content ul,
        .rich-content ol,
        .builder-content ul,
        .builder-content ol {
          padding-left: 22px;
          margin: 18px 0;
        }

        .rich-content li,
        .builder-content li {
          margin: 8px 0;
        }

        .side-panel {
          position: sticky;
          top: 100px;
          display: grid;
          gap: 16px;
        }

        .info-card,
        .cta-card {
          border-radius: 24px;
          padding: 22px;
        }

        .info-card h3,
        .cta-card h3 {
          margin: 0 0 16px;
          font-size: 18px;
          letter-spacing: -.02em;
        }

        .info-item {
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(15,23,42,.08);
        }

        .info-item:last-child {
          padding-bottom: 0;
          border-bottom: 0;
        }

        .info-item span {
          color: rgba(15,23,42,.42);
        }

        .info-item strong {
          color: #101114;
          font-size: 14px;
          line-height: 1.4;
        }

        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag-list span {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(239,159,39,.10);
          color: #C97D15;
          border: 1px solid rgba(239,159,39,.18);
          font-size: 13px;
          font-weight: 800;
        }

        .tag-list.soft span {
          background: rgba(15,23,42,.05);
          color: rgba(15,23,42,.66);
          border-color: rgba(15,23,42,.06);
        }

        .cta-card {
          background:
            radial-gradient(circle at top right, rgba(239,159,39,.22), transparent 44%),
            #111827;
          color: white;
          border-color: rgba(255,255,255,.10);
        }

        .cta-card p {
          color: rgba(255,255,255,.68);
          line-height: 1.65;
          margin: 0 0 18px;
        }

        .cta-card a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 16px;
          border-radius: 999px;
          background: #EF9F27;
          color: white;
          text-decoration: none;
          font-weight: 800;
        }

        .related-section {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 0 0 84px;
        }

        .related-head {
          margin-bottom: 24px;
        }

        .related-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .related-card {
          overflow: hidden;
          border-radius: 26px;
          background: white;
          border: 1px solid rgba(15,23,42,.08);
          color: inherit;
          text-decoration: none;
          box-shadow: 0 18px 60px rgba(15,23,42,.06);
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .related-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 70px rgba(15,23,42,.12);
        }

        .related-image {
          aspect-ratio: 16 / 10;
          background: #e5e7eb;
          overflow: hidden;
        }

        .related-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform .3s ease;
        }

        .related-card:hover .related-image img {
          transform: scale(1.04);
        }

        .related-body {
          padding: 18px;
        }

        .related-body span {
          color: #EF9F27;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .06em;
        }

        .related-body h3 {
          margin: 8px 0 8px;
          font-size: 18px;
          line-height: 1.25;
          letter-spacing: -.02em;
        }

        .related-body p {
          margin: 0;
          color: rgba(15,23,42,.54);
          font-size: 14px;
        }

        @media (max-width: 980px) {
          .reference-hero {
            min-height: auto;
          }

          .reference-hero-inner {
            padding: 128px 0 46px;
          }

          .reference-hero-grid,
          .reference-content-grid {
            grid-template-columns: 1fr;
          }

          .side-panel {
            position: static;
          }

          .related-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .reference-hero-inner,
          .reference-content,
          .related-section {
            width: min(100% - 28px, 1180px);
          }

          .reference-hero h1 {
            font-size: 40px;
          }

          .reference-hero-card {
            border-radius: 22px;
          }

          .article-card {
            border-radius: 24px;
            padding: 22px;
          }

          .reference-hero-actions {
            flex-direction: column;
          }

          .primary-link,
          .secondary-link {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
