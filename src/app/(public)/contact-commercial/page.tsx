// src/app/contact-commercial/page.tsx

import { ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Headphones,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { prisma } from "@/app/lib/prisma";
import { T } from "@/app/i18n/T";
import { LocalizedProductLeadForm } from "./LocalizedProductLeadForm";

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
    <main className="cc-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

        .cc-page {
          --cc-font: "Sora", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

          --cc-bg: #f8fafc;
          --cc-bg-2: #ffffff;
          --cc-surface: #ffffff;
          --cc-surface-soft: #fbfcfe;
          --cc-surface-warm: #fffaf2;
          --cc-surface-orange: #fff7ed;

          --cc-border: #e2e8f0;
          --cc-border-strong: #cbd5e1;

          --cc-text: #0f172a;
          --cc-text-soft: #334155;
          --cc-muted: #64748b;

          --cc-orange: #ef9f27;
          --cc-orange-dark: #b6620e;
          --cc-orange-soft: #fff7ed;
          --cc-orange-border: #fed7aa;

          --cc-green: #16a34a;
          --cc-green-soft: #ecfdf3;
          --cc-green-border: #a7f3c5;

          --cc-blue-soft: #eff6ff;
          --cc-blue-border: #bfdbfe;
          --cc-blue-text: #1e40af;

          --cc-shadow-sm: 0 8px 22px rgba(15, 23, 42, 0.055);
          --cc-shadow-md: 0 18px 45px rgba(15, 23, 42, 0.075);
          --cc-shadow-lg: 0 24px 70px rgba(15, 23, 42, 0.095);

          /*
            Variables pour ProductLeadForm variant="premium".
            Elles gardent le formulaire blanc, lisible et cohérent.
          */
          --lead-font-body: "Sora";
          --lead-form-ink: #0f172a;
          --lead-form-strong: #0f172a;
          --lead-form-bg: #ffffff;
          --lead-muted: #475569;
          --lead-soft: #64748b;
          --lead-border: #e2e8f0;
          --lead-panel-border: #e2e8f0;
          --lead-panel-hover-bg: #f8fafc;
          --lead-field-bg: #ffffff;
          --lead-field-focus-bg: #ffffff;
          --lead-placeholder: #94a3b8;
          --lead-option-text: #0f172a;
          --lead-option-bg: #ffffff;
          --lead-gold: #b6620e;
          --lead-amber: #d8891e;
          --lead-cyan: #2563eb;
          --lead-emerald: #16a34a;
          --lead-accent-soft: #fff7ed;
          --lead-accent-border: #fed7aa;
          --lead-cta-bg: #ef9f27;
          --lead-cta-hover: #f5a623;
          --lead-button-text: #ffffff;

          min-height: 100vh;
          color: var(--cc-text);
          font-family: var(--cc-font);
          background:
            radial-gradient(circle at 8% 0%, rgba(239, 159, 39, 0.08), transparent 30%),
            radial-gradient(circle at 95% 10%, rgba(37, 99, 235, 0.045), transparent 28%),
            linear-gradient(180deg, #ffffff 0%, #fbfcfe 42%, #f8fafc 100%);
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        .cc-page *,
        .cc-page *::before,
        .cc-page *::after {
          box-sizing: border-box;
        }

        .cc-container {
          width: min(1180px, 100%);
          margin: 0 auto;
          padding-left: clamp(16px, 4vw, 32px);
          padding-right: clamp(16px, 4vw, 32px);
        }

        .cc-hero {
          position: relative;
          overflow: hidden;
          padding: clamp(54px, 7vw, 84px) 0 34px;
        }

        .cc-hero::before {
          content: "";
          position: absolute;
          top: -140px;
          right: -100px;
          width: 360px;
          height: 360px;
          border-radius: 999px;
          background: rgba(239, 159, 39, 0.11);
          filter: blur(18px);
          pointer-events: none;
        }

        .cc-hero::after {
          content: "";
          position: absolute;
          left: -150px;
          bottom: -170px;
          width: 380px;
          height: 380px;
          border-radius: 999px;
          background: rgba(37, 99, 235, 0.045);
          filter: blur(18px);
          pointer-events: none;
        }

        .cc-hero-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(310px, 0.52fr);
          gap: clamp(22px, 4vw, 36px);
          align-items: center;
        }

        .cc-eyebrow {
          width: fit-content;
          margin: 0 0 18px;
          padding: 9px 13px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--cc-orange-dark);
          background: var(--cc-orange-soft);
          border: 1px solid var(--cc-orange-border);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .cc-title {
          max-width: 860px;
          margin: 0;
          color: var(--cc-text);
          font-size: clamp(38px, 6vw, 64px);
          line-height: 1.02;
          font-weight: 800;
          letter-spacing: -0.06em;
        }

        .cc-title span {
          color: var(--cc-orange-dark);
        }

        .cc-subtitle {
          max-width: 740px;
          margin: 20px 0 0;
          color: var(--cc-text-soft);
          font-size: clamp(15.5px, 1.6vw, 18px);
          line-height: 1.78;
          font-weight: 500;
        }

        .cc-hero-actions {
          margin-top: 30px;
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .cc-primary-link {
          min-height: 48px;
          padding: 0 20px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--cc-orange), #d8891e);
          color: #ffffff;
          border: 1px solid rgba(239, 159, 39, 0.62);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 800;
          box-shadow: 0 14px 30px rgba(239, 159, 39, 0.22);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .cc-primary-link:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 38px rgba(239, 159, 39, 0.28);
        }

        .cc-hero-hint {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--cc-muted);
          font-size: 13px;
          font-weight: 700;
        }

        .cc-hero-hint svg {
          color: var(--cc-orange-dark);
        }

        .cc-hero-card {
          padding: 24px;
          border-radius: 26px;
          background:
            radial-gradient(circle at top right, rgba(239, 159, 39, 0.09), transparent 36%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.96), #ffffff);
          border: 1px solid var(--cc-border);
          box-shadow: var(--cc-shadow-lg);
        }

        .cc-hero-card-icon {
          width: 54px;
          height: 54px;
          margin-bottom: 18px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--cc-orange-dark);
          background: var(--cc-orange-soft);
          border: 1px solid var(--cc-orange-border);
        }

        .cc-hero-card h2 {
          margin: 0;
          color: var(--cc-text);
          font-size: 21px;
          line-height: 1.25;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .cc-hero-card p {
          margin: 10px 0 0;
          color: var(--cc-text-soft);
          font-size: 14px;
          line-height: 1.72;
          font-weight: 500;
        }

        .cc-hero-stats {
          margin-top: 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .cc-stat {
          padding: 14px;
          border-radius: 18px;
          background: var(--cc-surface-soft);
          border: 1px solid var(--cc-border);
        }

        .cc-stat strong {
          display: block;
          color: var(--cc-text);
          font-size: 22px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .cc-stat span {
          display: block;
          margin-top: 6px;
          color: var(--cc-muted);
          font-size: 12px;
          line-height: 1.45;
          font-weight: 700;
        }

        .cc-benefits {
          padding: 0 0 34px;
        }

        .cc-benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .cc-benefit-card {
          padding: 20px;
          border-radius: 22px;
          background: var(--cc-surface);
          border: 1px solid var(--cc-border);
          display: flex;
          align-items: flex-start;
          gap: 14px;
          box-shadow: var(--cc-shadow-sm);
        }

        .cc-benefit-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--cc-orange-dark);
          background: var(--cc-orange-soft);
          border: 1px solid var(--cc-orange-border);
        }

        .cc-benefit-card h3 {
          margin: 0;
          color: var(--cc-text);
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.01em;
        }

        .cc-benefit-card p {
          margin: 7px 0 0;
          color: var(--cc-text-soft);
          font-size: 13px;
          line-height: 1.62;
          font-weight: 500;
        }

        .cc-form-section {
          padding: 24px 0 54px;
        }

        .cc-form-grid {
          display: grid;
          grid-template-columns: minmax(280px, 0.42fr) minmax(0, 0.58fr);
          gap: 24px;
          align-items: start;
        }

        .cc-form-intro {
          position: sticky;
          top: 24px;
          padding: 24px;
          border-radius: 26px;
          background:
            radial-gradient(circle at top right, rgba(239, 159, 39, 0.1), transparent 34%),
            linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%);
          border: 1px solid var(--cc-border);
          box-shadow: var(--cc-shadow-md);
        }

        .cc-form-intro-badge {
          width: fit-content;
          margin: 0 0 14px;
          padding: 7px 11px;
          border-radius: 999px;
          color: var(--cc-orange-dark);
          background: var(--cc-orange-soft);
          border: 1px solid var(--cc-orange-border);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .cc-form-intro h2 {
          margin: 0;
          color: var(--cc-text);
          font-size: 30px;
          line-height: 1.14;
          font-weight: 800;
          letter-spacing: -0.045em;
        }

        .cc-form-intro p {
          margin: 13px 0 0;
          color: var(--cc-text-soft);
          font-size: 14px;
          line-height: 1.72;
          font-weight: 500;
        }

        .cc-form-points {
          margin-top: 18px;
          display: grid;
          gap: 10px;
        }

        .cc-form-point {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          color: var(--cc-text-soft);
          font-size: 13px;
          line-height: 1.55;
          font-weight: 600;
        }

        .cc-form-point svg {
          margin-top: 1px;
          flex-shrink: 0;
          color: var(--cc-green);
        }

        .cc-form-card {
          padding: clamp(16px, 2vw, 22px);
          border-radius: 26px;
          background:
            linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%);
          border: 1px solid var(--cc-border);
          box-shadow: var(--cc-shadow-lg);
        }

        .cc-warning {
          margin-bottom: 16px;
          padding: 14px;
          border-radius: 16px;
          background: var(--cc-orange-soft);
          border: 1px solid var(--cc-orange-border);
          color: var(--cc-orange-dark);
          font-size: 13px;
          line-height: 1.6;
          font-weight: 800;
        }

        .cc-reassurance {
          padding: 0 0 64px;
        }

        .cc-reassurance-card {
          padding: clamp(24px, 4vw, 34px);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(239, 159, 39, 0.12), transparent 34%),
            linear-gradient(135deg, #ffffff 0%, #fbfcfe 60%, #fffaf2 100%);
          border: 1px solid var(--cc-border);
          display: grid;
          grid-template-columns: minmax(0, 0.48fr) minmax(0, 0.52fr);
          gap: 24px;
          align-items: center;
          box-shadow: var(--cc-shadow-md);
        }

        .cc-reassurance-badge {
          margin: 0 0 9px;
          color: var(--cc-orange-dark);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .cc-reassurance-card h2 {
          margin: 0;
          color: var(--cc-text);
          font-size: clamp(24px, 3vw, 32px);
          line-height: 1.18;
          font-weight: 800;
          letter-spacing: -0.045em;
        }

        .cc-reassurance-card p {
          margin: 0;
          color: var(--cc-text-soft);
          font-size: 15px;
          line-height: 1.8;
          font-weight: 500;
        }

        @media (max-width: 980px) {
          .cc-hero-grid,
          .cc-form-grid,
          .cc-reassurance-card {
            grid-template-columns: 1fr;
          }

          .cc-form-intro {
            position: static;
          }

          .cc-benefits-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .cc-hero {
            padding-top: 42px;
          }

          .cc-hero-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .cc-primary-link {
            width: 100%;
          }

          .cc-hero-hint {
            justify-content: center;
            text-align: center;
          }

          .cc-hero-stats {
            grid-template-columns: 1fr;
          }

          .cc-benefit-card {
            padding: 18px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cc-page *,
          .cc-page *::before,
          .cc-page *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <section className="cc-hero">
        <div className="cc-container">
          <div className="cc-hero-grid">
            <div>
              <div className="cc-eyebrow">
                <Sparkles size={15} aria-hidden="true" />
                <span>
                  <T k="contactCommercial.eyebrow">
                    Contact commercial MD2I
                  </T>
                </span>
              </div>

              <h1 className="cc-title">
                <T k="contactCommercial.title">
                  Parlons de votre besoin et trouvons la
                </T>{" "}
                <span>
                  <T k="contactCommercial.titleEmphasis">
                    bonne solution.
                  </T>
                </span>
              </h1>

              <p className="cc-subtitle">
                <T k="contactCommercial.subtitle">
                  Sélectionnez un produit ou service, décrivez votre demande,
                  puis l’équipe MD2I vous recontactera avec une réponse adaptée
                  à votre contexte.
                </T>
              </p>

              <div className="cc-hero-actions">
                <a href="#demande-commerciale" className="cc-primary-link">
                  <T k="contactCommercial.cta">Envoyer une demande</T>
                  <ArrowRight size={17} aria-hidden="true" />
                </a>

                <div className="cc-hero-hint">
                  <Clock3 size={16} aria-hidden="true" />
                  <span>
                    <T k="contactCommercial.hint">
                      Réponse rapide par l’équipe commerciale
                    </T>
                  </span>
                </div>
              </div>
            </div>

            <aside className="cc-hero-card">
              <div className="cc-hero-card-icon">
                <Headphones size={24} aria-hidden="true" />
              </div>

              <h2>
                <T k="contactCommercial.cardTitle">
                  Accompagnement personnalisé
                </T>
              </h2>

              <p>
                <T k="contactCommercial.cardText">
                  Votre demande est automatiquement transmise au CRM MD2I pour
                  être suivie par notre équipe commerciale.
                </T>
              </p>

              <div className="cc-hero-stats">
                <div className="cc-stat">
                  <strong>{products.length}</strong>
                  <span>
                    <T k="contactCommercial.solutionsAvailable">
                      solutions disponibles
                    </T>
                  </span>
                </div>

                <div className="cc-stat">
                  <strong>CRM</strong>
                  <span>
                    <T k="contactCommercial.crmTracking">
                      suivi structuré
                    </T>
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="cc-benefits">
        <div className="cc-container">
          <div className="cc-benefits-grid">
            <BenefitCard
              icon={<BadgeCheck size={21} />}
              title={<T k="contactCommercial.benefits.adaptedTitle">Solution adaptée</T>}
              text={<T k="contactCommercial.benefits.adaptedText">Nous analysons votre demande pour vous orienter vers le bon produit ou service.</T>}
            />

            <BenefitCard
              icon={<MailCheck size={21} />}
              title={<T k="contactCommercial.benefits.followTitle">Suivi commercial</T>}
              text={<T k="contactCommercial.benefits.followText">Votre demande est enregistrée proprement pour faciliter le suivi et les relances.</T>}
            />

            <BenefitCard
              icon={<ShieldCheck size={21} />}
              title={<T k="contactCommercial.benefits.exchangeTitle">Échange professionnel</T>}
              text={<T k="contactCommercial.benefits.exchangeText">Vous êtes recontacté avec une réponse claire, structurée et adaptée à votre projet.</T>}
            />
          </div>
        </div>
      </section>

      <section id="demande-commerciale" className="cc-form-section">
        <div className="cc-container">
          <div className="cc-form-grid">
            <aside className="cc-form-intro">
              <p className="cc-form-intro-badge">
                <T k="contactCommercial.introBadge">Votre demande</T>
              </p>

              <h2>
                <T k="contactCommercial.introTitle">
                  Demande commerciale
                </T>
              </h2>

              <p>
                <T k="contactCommercial.introText">
                  Choisissez le produit ou service qui vous intéresse, puis
                  indiquez vos informations. Cela nous permet de mieux
                  comprendre votre besoin avant de vous recontacter.
                </T>
              </p>

              <div className="cc-form-points">
                <div className="cc-form-point">
                  <CheckCircle2 size={15} aria-hidden="true" />
                  <span>
                    <T k="contactCommercial.points.qualification">
                      Qualification claire de votre besoin.
                    </T>
                  </span>
                </div>

                <div className="cc-form-point">
                  <CheckCircle2 size={15} aria-hidden="true" />
                  <span>
                    <T k="contactCommercial.points.crm">
                      Suivi commercial structuré dans le CRM.
                    </T>
                  </span>
                </div>

                <div className="cc-form-point">
                  <CheckCircle2 size={15} aria-hidden="true" />
                  <span>
                    <T k="contactCommercial.points.product">
                      Retour adapté au produit ou service sélectionné.
                    </T>
                  </span>
                </div>
              </div>
            </aside>

            <div className="cc-form-card">
              {products.length === 0 && (
                <div className="cc-warning">
                  <T k="contactCommercial.warning">
                    Aucun produit publié n’est disponible pour le moment. Vous
                    pouvez tout de même envoyer une demande générale si le
                    formulaire le permet.
                  </T>
                </div>
              )}

              <LocalizedProductLeadForm productOptions={products} />
            </div>
          </div>
        </div>
      </section>

      <section className="cc-reassurance">
        <div className="cc-container">
          <div className="cc-reassurance-card">
            <div>
              <p className="cc-reassurance-badge">
                <T k="contactCommercial.reassuranceBadge">MD2I</T>
              </p>

              <h2>
                <T k="contactCommercial.reassuranceTitle">
                  Un interlocuteur pour transformer votre besoin en solution.
                </T>
              </h2>
            </div>

            <p>
              <T k="contactCommercial.reassuranceText">
                Que votre demande concerne un site web, une solution digitale,
                un CRM, une automatisation, une maintenance ou un
                accompagnement, nous vous aidons à clarifier la meilleure
                approche.
              </T>
            </p>
          </div>
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
  title: ReactNode;
  text: ReactNode;
}) {
  return (
    <article className="cc-benefit-card">
      <div className="cc-benefit-icon" aria-hidden="true">
        {icon}
      </div>

      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  );
}
