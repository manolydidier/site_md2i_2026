import type { Editor } from "grapesjs";

// Marqueur utilisé pour ne jamais injecter deux fois le CSS des blocs dans une même page.
const CSS_MARKER = "MD2I_BASE_BLOCKS";

const ICON = {
  hero: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h6M7 13h10"/></svg>`,
  cta: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="8" width="18" height="8" rx="2"/><path d="M8 12h4"/></svg>`,
  cards: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="5" height="14" rx="1"/><rect x="9.5" y="5" width="5" height="14" rx="1"/><rect x="16" y="5" width="5" height="14" rx="1"/></svg>`,
  quote: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 8c-2 1-3 2.5-3 5s1.5 4 3.5 4"/><path d="M16 8c-2 1-3 2.5-3 5s1.5 4 3.5 4"/></svg>`,
  pricing: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="7" height="16" rx="1"/><rect x="12" y="4" width="9" height="16" rx="1"/></svg>`,
  gallery: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>`,
  stats: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20V10M12 20V4M20 20v14"/></svg>`,
  team: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 5-5s5 2 5 5M11 20c0-3 2.5-5 5-5s5 2 5 5"/></svg>`,
  faq: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 1.5-2.5 3.5"/><path d="M12 17h.01"/></svg>`,
  logos: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6" cy="12" r="3"/><rect x="11" y="9" width="6" height="6" rx="1"/><circle cx="19" cy="12" r="2.5"/></svg>`,
  newsletter: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 7l9 6 9-6"/></svg>`,
  spacer: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 4v16M8 7l4-3 4 3M8 17l4 3 4-3"/></svg>`,
  footer: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="10" rx="1"/><path d="M3 18h18"/></svg>`,
  section: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2" stroke-dasharray="3 3"/></svg>`,
};

const SECTIONS_BLOCKS_CSS = `
/* ${CSS_MARKER} */
.hero-md2i {
  padding: 56px 24px;
}

.hero-md2i__inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px;
  border-radius: 28px;
  border: 1px solid rgba(239,159,39,.18);
  background: rgba(239,159,39,.06);
}

.hero-md2i__badge {
  display: inline-block;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(239,159,39,.10);
  color: #ef9f27;
  border: 1px solid rgba(239,159,39,.18);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.hero-md2i h1 {
  margin: 16px 0 10px;
  font-size: clamp(34px, 6vw, 62px);
  line-height: 1.02;
}

.hero-md2i p {
  margin: 0 0 22px;
  max-width: 760px;
  line-height: 1.7;
}

.hero-md2i__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ef9f27, #c97d15);
  color: #fff;
  text-decoration: none;
  font-weight: 700;
}

.cards-md2i {
  padding: 24px;
}

.cards-md2i__grid {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.cards-md2i__item {
  padding: 22px;
  border-radius: 18px;
  border: 1px solid rgba(0,0,0,.08);
  background: #fff;
  box-shadow: 0 14px 34px rgba(15,23,42,.06);
}

.body-light-demo {
  max-width: 1100px;
  margin: 0 auto;
  padding: 28px;
  border-radius: 22px;
  border: 1px dashed rgba(239,159,39,.35);
  background: rgba(239,159,39,.06);
}

.hero-bg-md2i {
  position: relative;
  padding: 96px 24px;
  text-align: center;
  background: linear-gradient(rgba(10,10,14,.55), rgba(10,10,14,.55)), url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1600&auto=format&fit=crop') center/cover no-repeat;
  color: #fff;
}

.hero-bg-md2i__inner {
  max-width: 780px;
  margin: 0 auto;
}

.hero-bg-md2i h1 {
  margin: 0 0 14px;
  font-size: clamp(32px, 6vw, 58px);
  line-height: 1.05;
}

.hero-bg-md2i p {
  margin: 0 0 26px;
  font-size: 17px;
  line-height: 1.7;
  color: rgba(255,255,255,.86);
}

.hero-bg-md2i__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ef9f27, #c97d15);
  color: #fff;
  text-decoration: none;
  font-weight: 700;
}

.cta-md2i {
  padding: 48px 24px;
}

.cta-md2i__inner {
  max-width: 980px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 36px 40px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(239,159,39,.14), rgba(201,125,21,.10));
  border: 1px solid rgba(239,159,39,.22);
}

.cta-md2i h2 {
  margin: 0 0 6px;
  font-size: clamp(22px, 3vw, 30px);
}

.cta-md2i p {
  margin: 0;
  color: rgba(0,0,0,.6);
}

.cta-md2i__btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ef9f27, #c97d15);
  color: #fff;
  text-decoration: none;
  font-weight: 700;
}

.features-md2i {
  padding: 48px 24px;
}

.features-md2i__grid {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.features-md2i__item {
  padding: 24px 20px;
  border-radius: 18px;
  border: 1px solid rgba(0,0,0,.08);
  background: #fff;
}

.features-md2i__icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(239,159,39,.12);
  font-size: 20px;
  margin-bottom: 14px;
}

.features-md2i__item h3 {
  margin: 0 0 6px;
  font-size: 16px;
}

.features-md2i__item p {
  margin: 0;
  font-size: 14px;
  color: rgba(0,0,0,.6);
  line-height: 1.6;
}

.testimonial-md2i {
  padding: 48px 24px;
}

.testimonial-md2i__card {
  max-width: 720px;
  margin: 0 auto;
  padding: 36px;
  border-radius: 24px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.08);
  text-align: center;
  box-shadow: 0 20px 44px rgba(15,23,42,.06);
}

.testimonial-md2i__quote {
  font-size: 20px;
  line-height: 1.6;
  color: #181818;
  margin: 0 0 20px;
}

.testimonial-md2i__author {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.testimonial-md2i__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(239,159,39,.16);
}

.testimonial-md2i__name {
  font-weight: 700;
  font-size: 14px;
}

.testimonial-md2i__role {
  font-size: 13px;
  color: rgba(0,0,0,.5);
}

.pricing-md2i {
  padding: 48px 24px;
}

.pricing-md2i__grid {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

.pricing-md2i__plan {
  padding: 30px 26px;
  border-radius: 22px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.08);
}

.pricing-md2i__plan--highlight {
  border: 2px solid #ef9f27;
  box-shadow: 0 20px 44px rgba(239,159,39,.16);
}

.pricing-md2i__plan h3 {
  margin: 0 0 4px;
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: rgba(0,0,0,.5);
}

.pricing-md2i__price {
  margin: 4px 0 18px;
  font-size: 36px;
  font-weight: 800;
}

.pricing-md2i__price span {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0,0,0,.5);
}

.pricing-md2i__list {
  list-style: none;
  margin: 0 0 22px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
  color: rgba(0,0,0,.7);
}

.pricing-md2i__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  border-radius: 12px;
  background: rgba(239,159,39,.10);
  color: #ef9f27;
  border: 1px solid rgba(239,159,39,.24);
  text-decoration: none;
  font-weight: 700;
}

.pricing-md2i__plan--highlight .pricing-md2i__btn {
  background: linear-gradient(135deg, #ef9f27, #c97d15);
  color: #fff;
  border: none;
}

.gallery-md2i {
  padding: 48px 24px;
}

.gallery-md2i__grid {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.gallery-md2i__grid img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 16px;
  display: block;
}

.stats-md2i {
  padding: 44px 24px;
}

.stats-md2i__grid {
  max-width: 980px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  text-align: center;
}

.stats-md2i__number {
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 800;
  color: #ef9f27;
}

.stats-md2i__label {
  margin-top: 6px;
  font-size: 13px;
  color: rgba(0,0,0,.55);
}

.team-md2i {
  padding: 48px 24px;
}

.team-md2i__grid {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.team-md2i__card {
  text-align: center;
}

.team-md2i__avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  margin: 0 auto 14px;
  background: rgba(239,159,39,.14);
}

.team-md2i__name {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 2px;
}

.team-md2i__role {
  font-size: 13px;
  color: rgba(0,0,0,.5);
}

.faq-md2i {
  padding: 48px 24px;
}

.faq-md2i__list {
  max-width: 780px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-md2i__item {
  padding: 18px 22px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.08);
}

.faq-md2i__item summary {
  cursor: pointer;
  font-weight: 700;
  list-style: none;
}

.faq-md2i__item summary::-webkit-details-marker {
  display: none;
}

.faq-md2i__item p {
  margin: 12px 0 0;
  color: rgba(0,0,0,.6);
  line-height: 1.6;
}

.logos-md2i {
  padding: 40px 24px;
}

.logos-md2i__row {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-around;
  gap: 24px;
  opacity: .6;
}

.logos-md2i__row span {
  font-weight: 800;
  font-size: 18px;
  letter-spacing: .04em;
}

.newsletter-md2i {
  padding: 48px 24px;
}

.newsletter-md2i__inner {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
  padding: 36px;
  border-radius: 24px;
  background: rgba(239,159,39,.06);
  border: 1px solid rgba(239,159,39,.18);
}

.newsletter-md2i h2 {
  margin: 0 0 8px;
  font-size: 24px;
}

.newsletter-md2i p {
  margin: 0 0 22px;
  color: rgba(0,0,0,.6);
}

.newsletter-md2i__form {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.newsletter-md2i__form input {
  flex: 1;
  min-width: 220px;
  min-height: 48px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,.14);
}

.newsletter-md2i__form button {
  min-height: 48px;
  padding: 0 22px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #ef9f27, #c97d15);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.spacer-md2i {
  height: 64px;
}

.footer-md2i {
  padding: 40px 24px 26px;
  border-top: 1px solid rgba(0,0,0,.08);
}

.footer-md2i__grid {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 24px;
}

.footer-md2i__brand {
  font-weight: 800;
  font-size: 18px;
  margin-bottom: 8px;
}

.footer-md2i__col h4 {
  margin: 0 0 10px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: rgba(0,0,0,.5);
}

.footer-md2i__col a {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: rgba(0,0,0,.7);
  text-decoration: none;
}

.footer-md2i__bottom {
  max-width: 1100px;
  margin: 24px auto 0;
  padding-top: 18px;
  border-top: 1px solid rgba(0,0,0,.06);
  font-size: 13px;
  color: rgba(0,0,0,.45);
}

@media (max-width: 840px) {
  .cards-md2i__grid,
  .features-md2i__grid,
  .pricing-md2i__grid,
  .gallery-md2i__grid,
  .stats-md2i__grid,
  .team-md2i__grid {
    grid-template-columns: 1fr 1fr;
  }

  .footer-md2i__grid {
    grid-template-columns: 1fr 1fr;
  }

  .hero-md2i__inner {
    padding: 24px;
  }
}

@media (max-width: 560px) {
  .cards-md2i__grid,
  .features-md2i__grid,
  .pricing-md2i__grid,
  .gallery-md2i__grid,
  .stats-md2i__grid,
  .team-md2i__grid,
  .footer-md2i__grid {
    grid-template-columns: 1fr;
  }
}
`;

export const BASE_BLOCKS_CSS = SECTIONS_BLOCKS_CSS;

// Injecte le CSS des blocs une seule fois par page (marqueur MD2I_BASE_BLOCKS dans le CSS courant).
export function ensureBaseBlocksCss(editor: Editor) {
  const currentCss = editor.getCss() || "";
  if (currentCss.includes(CSS_MARKER)) return;
  editor.setStyle(`${currentCss}\n\n${BASE_BLOCKS_CSS}`);
}

export function registerCommonBlocks(editor: Editor) {
  const CATEGORY = "Sections";

  editor.Blocks.add("hero-md2i", {
    label: "Hero centré",
    category: CATEGORY,
    media: ICON.hero,
    select: true,
    content: `
      <section class="hero-md2i">
        <div class="hero-md2i__inner">
          <span class="hero-md2i__badge">MD2I</span>
          <h1>Votre titre principal</h1>
          <p>Un texte d'introduction élégant pour présenter votre service.</p>
          <a href="#" class="hero-md2i__btn">Découvrir</a>
        </div>
      </section>
    `,
  });

  editor.Blocks.add("hero-bg-md2i", {
    label: "Hero image de fond",
    category: CATEGORY,
    media: ICON.hero,
    select: true,
    content: `
      <section class="hero-bg-md2i">
        <div class="hero-bg-md2i__inner">
          <h1>Un titre impactant sur fond image</h1>
          <p>Décrivez votre offre en une phrase claire et engageante.</p>
          <a href="#" class="hero-bg-md2i__btn">En savoir plus</a>
        </div>
      </section>
    `,
  });

  editor.Blocks.add("cta-md2i", {
    label: "Bannière CTA",
    category: CATEGORY,
    media: ICON.cta,
    select: true,
    content: `
      <section class="cta-md2i">
        <div class="cta-md2i__inner">
          <div>
            <h2>Prêt à démarrer ?</h2>
            <p>Contactez-nous pour en discuter dès aujourd'hui.</p>
          </div>
          <a href="#" class="cta-md2i__btn">Nous contacter</a>
        </div>
      </section>
    `,
  });

  editor.Blocks.add("card-grid-md2i", {
    label: "Cards 3 colonnes",
    category: CATEGORY,
    media: ICON.cards,
    select: true,
    content: `
      <section class="cards-md2i">
        <div class="cards-md2i__grid">
          <article class="cards-md2i__item"><h3>Bloc 1</h3><p>Texte de présentation.</p></article>
          <article class="cards-md2i__item"><h3>Bloc 2</h3><p>Texte de présentation.</p></article>
          <article class="cards-md2i__item"><h3>Bloc 3</h3><p>Texte de présentation.</p></article>
        </div>
      </section>
    `,
  });

  editor.Blocks.add("features-md2i", {
    label: "Fonctionnalités 4 colonnes",
    category: CATEGORY,
    media: ICON.cards,
    select: true,
    content: `
      <section class="features-md2i">
        <div class="features-md2i__grid">
          <div class="features-md2i__item"><div class="features-md2i__icon">🚀</div><h3>Rapide</h3><p>Décrivez cet avantage en une phrase.</p></div>
          <div class="features-md2i__item"><div class="features-md2i__icon">🔒</div><h3>Sécurisé</h3><p>Décrivez cet avantage en une phrase.</p></div>
          <div class="features-md2i__item"><div class="features-md2i__icon">⚙️</div><h3>Flexible</h3><p>Décrivez cet avantage en une phrase.</p></div>
          <div class="features-md2i__item"><div class="features-md2i__icon">💬</div><h3>Support</h3><p>Décrivez cet avantage en une phrase.</p></div>
        </div>
      </section>
    `,
  });

  editor.Blocks.add("testimonial-md2i", {
    label: "Témoignage",
    category: CATEGORY,
    media: ICON.quote,
    select: true,
    content: `
      <section class="testimonial-md2i">
        <div class="testimonial-md2i__card">
          <p class="testimonial-md2i__quote">« Un exemple de citation client mettant en avant la qualité du service. »</p>
          <div class="testimonial-md2i__author">
            <div class="testimonial-md2i__avatar"></div>
            <div>
              <div class="testimonial-md2i__name">Nom Prénom</div>
              <div class="testimonial-md2i__role">Fonction, Entreprise</div>
            </div>
          </div>
        </div>
      </section>
    `,
  });

  editor.Blocks.add("pricing-md2i", {
    label: "Tarifs 3 colonnes",
    category: CATEGORY,
    media: ICON.pricing,
    select: true,
    content: `
      <section class="pricing-md2i">
        <div class="pricing-md2i__grid">
          <div class="pricing-md2i__plan">
            <h3>Starter</h3>
            <div class="pricing-md2i__price">29€<span>/mois</span></div>
            <ul class="pricing-md2i__list"><li>Fonction 1</li><li>Fonction 2</li><li>Fonction 3</li></ul>
            <a href="#" class="pricing-md2i__btn">Choisir</a>
          </div>
          <div class="pricing-md2i__plan pricing-md2i__plan--highlight">
            <h3>Pro</h3>
            <div class="pricing-md2i__price">59€<span>/mois</span></div>
            <ul class="pricing-md2i__list"><li>Tout Starter</li><li>Fonction 4</li><li>Fonction 5</li></ul>
            <a href="#" class="pricing-md2i__btn">Choisir</a>
          </div>
          <div class="pricing-md2i__plan">
            <h3>Entreprise</h3>
            <div class="pricing-md2i__price">Sur devis</div>
            <ul class="pricing-md2i__list"><li>Tout Pro</li><li>Support dédié</li><li>SLA</li></ul>
            <a href="#" class="pricing-md2i__btn">Nous contacter</a>
          </div>
        </div>
      </section>
    `,
  });

  editor.Blocks.add("gallery-md2i", {
    label: "Galerie image",
    category: CATEGORY,
    media: ICON.gallery,
    select: true,
    content: `
      <section class="gallery-md2i">
        <div class="gallery-md2i__grid">
          <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800&auto=format&fit=crop" alt="" />
          <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop" alt="" />
          <img src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop" alt="" />
        </div>
      </section>
    `,
  });

  editor.Blocks.add("stats-md2i", {
    label: "Statistiques",
    category: CATEGORY,
    media: ICON.stats,
    select: true,
    content: `
      <section class="stats-md2i">
        <div class="stats-md2i__grid">
          <div><div class="stats-md2i__number">120+</div><div class="stats-md2i__label">Clients</div></div>
          <div><div class="stats-md2i__number">15</div><div class="stats-md2i__label">Ans d'expérience</div></div>
          <div><div class="stats-md2i__number">98%</div><div class="stats-md2i__label">Satisfaction</div></div>
          <div><div class="stats-md2i__number">24/7</div><div class="stats-md2i__label">Support</div></div>
        </div>
      </section>
    `,
  });

  editor.Blocks.add("team-md2i", {
    label: "Équipe",
    category: CATEGORY,
    media: ICON.team,
    select: true,
    content: `
      <section class="team-md2i">
        <div class="team-md2i__grid">
          <div class="team-md2i__card"><div class="team-md2i__avatar"></div><div class="team-md2i__name">Nom Prénom</div><div class="team-md2i__role">Fonction</div></div>
          <div class="team-md2i__card"><div class="team-md2i__avatar"></div><div class="team-md2i__name">Nom Prénom</div><div class="team-md2i__role">Fonction</div></div>
          <div class="team-md2i__card"><div class="team-md2i__avatar"></div><div class="team-md2i__name">Nom Prénom</div><div class="team-md2i__role">Fonction</div></div>
          <div class="team-md2i__card"><div class="team-md2i__avatar"></div><div class="team-md2i__name">Nom Prénom</div><div class="team-md2i__role">Fonction</div></div>
        </div>
      </section>
    `,
  });

  editor.Blocks.add("faq-md2i", {
    label: "FAQ / Accordéon",
    category: CATEGORY,
    media: ICON.faq,
    select: true,
    content: `
      <section class="faq-md2i">
        <div class="faq-md2i__list">
          <details class="faq-md2i__item"><summary>Première question fréquente ?</summary><p>Réponse détaillée à la question posée.</p></details>
          <details class="faq-md2i__item"><summary>Deuxième question fréquente ?</summary><p>Réponse détaillée à la question posée.</p></details>
          <details class="faq-md2i__item"><summary>Troisième question fréquente ?</summary><p>Réponse détaillée à la question posée.</p></details>
        </div>
      </section>
    `,
  });

  editor.Blocks.add("logos-md2i", {
    label: "Logos partenaires",
    category: CATEGORY,
    media: ICON.logos,
    select: true,
    content: `
      <section class="logos-md2i">
        <div class="logos-md2i__row">
          <span>Logo</span><span>Logo</span><span>Logo</span><span>Logo</span><span>Logo</span>
        </div>
      </section>
    `,
  });

  editor.Blocks.add("newsletter-md2i", {
    label: "Newsletter",
    category: CATEGORY,
    media: ICON.newsletter,
    select: true,
    content: `
      <section class="newsletter-md2i">
        <div class="newsletter-md2i__inner">
          <h2>Restez informé</h2>
          <p>Recevez nos actualités directement par email.</p>
          <form class="newsletter-md2i__form">
            <input type="email" placeholder="Votre adresse email" />
            <button type="submit">S'inscrire</button>
          </form>
        </div>
      </section>
    `,
  });

  editor.Blocks.add("body-section-light", {
    label: "Section claire",
    category: CATEGORY,
    media: ICON.section,
    select: true,
    content: `
      <section class="body-light-demo">
        <h2>Section claire</h2>
        <p>Cette section laisse mieux voir les styles globaux de la page.</p>
      </section>
    `,
  });

  editor.Blocks.add("spacer-md2i", {
    label: "Espaceur",
    category: CATEGORY,
    media: ICON.spacer,
    select: true,
    content: `<div class="spacer-md2i"></div>`,
  });

  editor.Blocks.add("footer-md2i", {
    label: "Footer",
    category: CATEGORY,
    media: ICON.footer,
    select: true,
    content: `
      <footer class="footer-md2i">
        <div class="footer-md2i__grid">
          <div class="footer-md2i__col"><div class="footer-md2i__brand">MD2I</div><p>Votre partenaire digital.</p></div>
          <div class="footer-md2i__col"><h4>Produit</h4><a href="#">Fonctionnalités</a><a href="#">Tarifs</a></div>
          <div class="footer-md2i__col"><h4>Entreprise</h4><a href="#">À propos</a><a href="#">Contact</a></div>
          <div class="footer-md2i__col"><h4>Légal</h4><a href="#">Mentions légales</a><a href="#">Confidentialité</a></div>
        </div>
        <div class="footer-md2i__bottom">© MD2I — Tous droits réservés.</div>
      </footer>
    `,
  });

  ensureBaseBlocksCss(editor);
}
