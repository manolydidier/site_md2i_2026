'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'

const ORANGE = '#EF9F27'
const ORANGE_DARK = '#d4891a'

function ParticlesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let animId: number
    let pts: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = []
    let W = 0, H = 0

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      pts = Array.from({ length: 50 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .2,
        r: Math.random() * 1 + .3, a: Math.random() * .3 + .05,
      }))
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(239,159,39,${p.a})`; ctx.fill()
      })
      pts.forEach((p, i) => pts.slice(i + 1).forEach(q => {
        const d = Math.hypot(p.x - q.x, p.y - q.y)
        if (d < 120) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y)
          ctx.strokeStyle = `rgba(239,159,39,${.04 * (1 - d / 120)})`
          ctx.lineWidth = .5; ctx.stroke()
        }
      }))
      animId = requestAnimationFrame(draw)
    }

    resize(); draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: .6 }} />
}

const SERVICES = [
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>, title: 'Logiciels SARA', desc: 'Suite complète de gestion financière, comptable et de suivi-évaluation pour projets multi-bailleurs, multi-devises, conforme FED/UE.' },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>, title: 'Développement sur mesure', desc: 'Conception et développement de systèmes d\'information personnalisés, sites web, plateformes e-learning et applications métier.' },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title: 'Formation & Appui', desc: 'Formations personnalisées sur site ou à distance. Téléassistance 24h via TeamViewer et Skype — réponse sous 24h ouvrables.' },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title: 'Audit & Contrôle de gestion', desc: 'Préparation aux audits, contrôle de gestion, suivi budgétaire et opérationnel pour les financements de l\'Union Européenne.' },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, title: 'Hébergement & Maintenance', desc: 'Hébergement de sites et plateformes, maintenance continue, abonnements internet et infogérance.' },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.5"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/></svg>, title: 'Suivi-Évaluation (M&E)', desc: 'SARA M&E — plateforme internet de gestion du cadre logique : objectifs, résultats, indicateurs, budget et calendrier.' },
]

const COUNTRIES = ['🇫🇷 France', '🇲🇬 Madagascar', '🇰🇭 Cambodge', '🇸🇳 Sénégal', '🇨🇮 Côte d\'Ivoire', '🇧🇯 Bénin', '🇨🇲 Cameroun', '🇲🇱 Mali', '🇧🇫 Burkina Faso', '🇹🇳 Tunisie', '🇲🇦 Maroc', '🇪🇹 Éthiopie', '🇧🇷 Brésil', '🇵🇹 Portugal', '+ 40 autres →']

const CLIENTS = ['🏛 Union Européenne — FED', '🎓 ENAP Madagascar', '⚖ ENMG', '🏗 INDDL', '⚖ PAJMA', '🌿 FACMER Santatra', '🏛 CAON Madagascar', '🎓 Ministère Éducation', '🌍 SEMAH Dialogue']

export default function HomePage() {
  useEffect(() => {
    const obs = new IntersectionObserver(entries =>
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('hp-visible') }),
      { threshold: .15 }
    )
    document.querySelectorAll('.hp-reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const sectionStyle = { position: 'relative' as const, zIndex: 1, padding: '100px 6vw' }
  const tagStyle = { fontSize: '10px', letterSpacing: '3px', color: 'rgba(239,159,39,.6)', textTransform: 'uppercase' as const, fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }
  const titleStyle = { fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-1px', marginBottom: '1.25rem' }
  const descStyle = { fontSize: '15px', color: 'rgba(232,230,240,.45)', lineHeight: 1.8, fontWeight: 300, maxWidth: '560px' }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        body { background: #060608; color: #e8e6f0; font-family: 'DM Sans', sans-serif; }
        .hp-reveal { opacity: 0; transform: translateY(20px); transition: opacity .7s, transform .7s; }
        .hp-visible { opacity: 1 !important; transform: translateY(0) !important; }
        @keyframes scrollLine { 0%{left:-100%} 50%,100%{left:100%} }
        @keyframes orbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes dotPulse { 0%,100%{box-shadow:0 0 6px rgba(239,159,39,.7)} 50%{box-shadow:0 0 14px rgba(239,159,39,1)} }
        @keyframes rotateRing { to{transform:rotate(360deg)} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeLeft { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        .svc-card:hover { background: #0d0d10 !important; }
        .svc-card:hover .svc-arrow { color: ${ORANGE} !important; transform: translate(0,0) !important; }
        .svc-card:hover .svc-icon { background: rgba(239,159,39,.15) !important; border-color: rgba(239,159,39,.35) !important; }
        .pill:hover { border-color: rgba(239,159,39,.3) !important; color: rgba(239,159,39,.8) !important; background: rgba(239,159,39,.05) !important; }
        .client-item:hover { color: rgba(232,230,240,.7) !important; border-color: rgba(255,255,255,.15) !important; }
        .contact-card:hover { border-color: rgba(239,159,39,.2) !important; }
        .cf-input:focus { border-color: rgba(239,159,39,.4) !important; background: rgba(239,159,39,.03) !important; }
        .btn-primary:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 32px rgba(239,159,39,.4) !important; }
        .stat-card:hover { border-color: rgba(239,159,39,.3) !important; transform: translateX(-4px) !important; }
      `}</style>

      <ParticlesCanvas />

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1, padding: '0 6vw', overflow: 'hidden' }}>
        <div style={{ fontSize: '11px', letterSpacing: '3px', fontWeight: 500, color: 'rgba(239,159,39,.7)', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeUp .8s .2s both' }}>
          <span style={{ width: '32px', height: '1px', background: 'rgba(239,159,39,.5)' }}/>
          Cabinet IT depuis 1987 — 54 pays
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(42px,6vw,88px)', fontWeight: 800, lineHeight: 1.0, letterSpacing: '-2px', marginBottom: '2rem', animation: 'fadeUp .8s .35s both' }}>
          <span style={{ display: 'block' }}>Management &</span>
          <span style={{ color: ORANGE, textShadow: '0 0 60px rgba(239,159,39,.3)' }}>Développement</span>
          <span style={{ display: 'block', color: '#9a9890', fontWeight: 600 }}>International Informatique</span>
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(232,230,240,.45)', lineHeight: 1.8, maxWidth: '520px', fontWeight: 300, marginBottom: '3rem', animation: 'fadeUp .8s .5s both' }}>
          Logiciels de gestion de projets de développement, conseil financier et formation — au service des organisations internationales depuis plus de 35 ans.
        </p>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', animation: 'fadeUp .8s .65s both' }}>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '13px 28px', borderRadius: '10px', background: `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`, color: '#fff', fontSize: '14px', fontWeight: 500, fontFamily: 'inherit', border: 'none', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s', boxShadow: '0 4px 24px rgba(239,159,39,.25)', position: 'relative', overflow: 'hidden' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Découvrir SARA
          </button>
          <Link href="/contact" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '13px 28px', borderRadius: '10px', background: 'none', color: 'rgba(232,230,240,.7)', fontSize: '14px', fontWeight: 500, fontFamily: 'inherit', border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer', transition: 'all .2s', textDecoration: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Nous contacter
          </Link>
        </div>

        {/* Stats */}
        <div style={{ position: 'absolute', right: '6vw', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeLeft .8s .8s both' }}>
          {[{ num: '54', label: 'PAYS' }, { num: '35+', label: "ANS D'EXPÉRIENCE" }, { num: '3', label: 'LANGUES' }].map((s, i) => (
            <div key={i} className="stat-card" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '20px 24px', textAlign: 'center', backdropFilter: 'blur(20px)', transition: 'border-color .3s, transform .3s', cursor: 'default' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '36px', fontWeight: 800, color: ORANGE, lineHeight: 1, textShadow: '0 0 30px rgba(239,159,39,.3)' }}>{s.num}</div>
              <div style={{ fontSize: '11px', color: 'rgba(232,230,240,.45)', letterSpacing: '.5px', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: '2.5rem', left: '6vw', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'rgba(232,230,240,.3)', letterSpacing: '1px', animation: 'fadeUp .8s 1s both' }}>
          <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,.2)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: ORANGE, animation: 'scrollLine 2s ease-in-out infinite' }} />
          </div>
          DÉFILER
        </div>
      </section>

      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)', margin: '0 6vw' }} />

      {/* SERVICES */}
      <section style={sectionStyle}>
        <div style={tagStyle}><span style={{ width: '20px', height: '1px', background: 'rgba(239,159,39,.4)' }}/>Nos expertises</div>
        <h2 className="hp-reveal" style={titleStyle}>Solutions complètes pour<br />vos projets de développement</h2>
        <p className="hp-reveal" style={{ ...descStyle, marginBottom: 0 }}>De la conception logicielle à la formation, MD2i vous accompagne à chaque étape.</p>

        <div className="hp-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5px', marginTop: '4rem', background: 'rgba(255,255,255,.05)', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,.05)' }}>
          {SERVICES.map((s, i) => (
            <div key={i} className="svc-card" style={{ background: '#060608', padding: '2.5rem', position: 'relative', overflow: 'hidden', transition: 'background .3s', cursor: 'default' }}>
              <div className="svc-icon" style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(239,159,39,.08)', border: '1px solid rgba(239,159,39,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', transition: 'background .3s, border-color .3s' }}>
                {s.icon}
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '17px', fontWeight: 700, marginBottom: '.6rem', color: '#f0ede8' }}>{s.title}</div>
              <div style={{ fontSize: '13px', color: 'rgba(232,230,240,.45)', lineHeight: 1.7, fontWeight: 300 }}>{s.desc}</div>
              <span className="svc-arrow" style={{ position: 'absolute', bottom: '2rem', right: '2rem', fontSize: '18px', color: 'rgba(239,159,39,.3)', transition: 'all .3s', transform: 'translate(4px,-4px)', display: 'block' }}>↗</span>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)', margin: '0 6vw' }} />

      {/* SARA */}
      <section style={sectionStyle}>
        <div style={tagStyle}><span style={{ width: '20px', height: '1px', background: 'rgba(239,159,39,.4)' }}/>Le logiciel phare</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', alignItems: 'center', marginTop: '2rem' }}>
          <div>
            <h2 className="hp-reveal" style={titleStyle}>SARA — La référence<br />de la gestion <span style={{ color: ORANGE }}>FED</span></h2>
            <p className="hp-reveal" style={{ ...descStyle, marginBottom: '1.5rem' }}>Conçu pour les projets financés par le Fonds Européen de Développement, SARA gère la comptabilité multi-devises, multi-bailleurs avec une conformité totale au Guide Pratique FED.</p>
            <div className="hp-reveal" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '1rem' }}>
              {[
                { t: 'Multi-devises & multi-projets', d: 'Gestion simultanée de plusieurs budgets et devises' },
                { t: 'Compatible Windows & Mac', d: 'SARA ULTIMATE — dernière version disponible' },
                { t: 'Rapprochement bancaire automatique', d: 'Gestion des chèques et réconciliation simplifiée' },
                { t: 'Suivi budgétaire en temps réel', d: 'Tableau de bord financements & dépenses' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'rgba(239,159,39,.1)', border: '1px solid rgba(239,159,39,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(232,230,240,.8)', marginBottom: '1px' }}>{f.t}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(232,230,240,.4)' }}>{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup SARA */}
          <div className="hp-reveal" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.02)' }}>
            <div style={{ height: '36px', background: 'rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: '6px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              {['#e24b4a', ORANGE, '#1D9E75'].map((c, i) => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: c }} />)}
              <span style={{ marginLeft: '8px', fontSize: '11px', color: 'rgba(232,230,240,.3)', fontFamily: 'DM Sans, sans-serif' }}>SARA ULTIMATE — Tableau de bord</span>
            </div>
            <div style={{ padding: '20px' }}>
              {[
                { label: 'PROJET', budget: 'BUDGET', progress: 'AVANCEMENT', status: 'STATUT', isHead: true },
              ].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', marginBottom: '6px', fontSize: '11px', background: 'rgba(239,159,39,.08)', color: 'rgba(239,159,39,.8)', fontWeight: 500, letterSpacing: '.3px' }}>
                  <span>PROJET</span><span>BUDGET</span><span style={{ flex: 1, textAlign: 'center' }}>AVANCEMENT</span><span>STATUT</span>
                </div>
              ))}
              {[
                { name: 'PAJMA Madagascar', budget: '€ 2.4M', progress: 78, status: 'Actif', statusColor: '#5DCAA5', statusBg: 'rgba(29,158,117,.15)' },
                { name: 'FACMER Santatra', budget: '€ 1.8M', progress: 55, status: 'Actif', statusColor: '#5DCAA5', statusBg: 'rgba(29,158,117,.15)' },
                { name: 'CAON FED 11', budget: '€ 4.1M', progress: 92, status: 'Clôture', statusColor: ORANGE, statusBg: 'rgba(239,159,39,.15)' },
                { name: 'Cambodge M&E', budget: '€ 3.2M', progress: 41, status: 'Actif', statusColor: '#5DCAA5', statusBg: 'rgba(29,158,117,.15)' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', marginBottom: '6px', fontSize: '12px', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)', color: 'rgba(232,230,240,.6)' }}>
                  <span style={{ color: 'rgba(232,230,240,.8)', minWidth: '140px' }}>{row.name}</span>
                  <span style={{ minWidth: '60px' }}>{row.budget}</span>
                  <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,.06)', margin: '0 12px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '2px', background: `linear-gradient(90deg,${ORANGE},${ORANGE_DARK})`, width: `${row.progress}%` }} />
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, background: row.statusBg, color: row.statusColor }}>{row.status}</span>
                </div>
              ))}
              <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(239,159,39,.05)', border: '1px solid rgba(239,159,39,.1)', borderRadius: '10px' }}>
                <div style={{ fontSize: '10px', color: 'rgba(239,159,39,.6)', letterSpacing: '1px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>SYNTHÈSE GLOBALE</div>
                {[{ l: 'Total engagé', v: '€ 11.5M', c: ORANGE }, { l: "Taux d'exécution", v: '66.5%', c: '#5DCAA5' }].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(232,230,240,.5)', fontFamily: 'DM Sans, sans-serif', marginTop: i > 0 ? '4px' : 0 }}>
                    <span>{item.l}</span><span style={{ color: item.c }}>{item.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)', margin: '0 6vw' }} />

      {/* PRÉSENCE MONDIALE */}
      <section style={{ ...sectionStyle, textAlign: 'center' }}>
        <div style={{ ...tagStyle, justifyContent: 'center' }}><span style={{ width: '20px', height: '1px', background: 'rgba(239,159,39,.4)' }}/>Présence mondiale</div>
        <h2 className="hp-reveal" style={{ ...titleStyle, textAlign: 'center' }}>Active dans <span style={{ color: ORANGE }}>54 pays</span><br />sur 5 continents</h2>
        <div style={{ position: 'relative', width: '280px', height: '280px', margin: '3rem auto' }}>
          {[0, 20, 40].map((inset, i) => (
            <div key={i} style={{ position: 'absolute', inset, borderRadius: '50%', border: '1px solid rgba(239,159,39,.1)', animation: `rotateRing ${[20, 15, 10][i]}s linear ${i % 2 ? 'reverse' : ''} infinite` }} />
          ))}
          <div style={{ position: 'absolute', inset: '80px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(239,159,39,.15),rgba(239,159,39,.03))', border: '1px solid rgba(239,159,39,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '36px', fontWeight: 800, color: ORANGE, textShadow: '0 0 30px rgba(239,159,39,.4)' }}>54</div>
            <div style={{ fontSize: '10px', color: 'rgba(232,230,240,.45)', letterSpacing: '1px' }}>PAYS</div>
          </div>
        </div>
        <div className="hp-reveal" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '700px', margin: '0 auto' }}>
          {COUNTRIES.map((c, i) => (
            <span key={i} className="pill" style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, border: '1px solid rgba(255,255,255,.08)', color: 'rgba(232,230,240,.5)', transition: 'all .2s', cursor: 'default' }}>{c}</span>
          ))}
        </div>
        <div className="hp-reveal" style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '3rem', flexWrap: 'wrap' }}>
          {[{ n: '25', l: 'pays francophones' }, { n: '22', l: 'pays anglophones' }, { n: '7', l: 'pays lusophones' }].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: ORANGE }}>{s.n}</div>
              <div style={{ fontSize: '11px', color: 'rgba(232,230,240,.45)', letterSpacing: '.5px' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)', margin: '0 6vw' }} />

      {/* CLIENTS */}
      <section style={sectionStyle}>
        <div style={tagStyle}><span style={{ width: '20px', height: '1px', background: 'rgba(239,159,39,.4)' }}/>Ils nous font confiance</div>
        <h2 className="hp-reveal" style={titleStyle}>Références &<br />partenaires</h2>
        <div style={{ overflow: 'hidden', marginTop: '3rem', WebkitMaskImage: 'linear-gradient(90deg,transparent,black 10%,black 90%,transparent)', maskImage: 'linear-gradient(90deg,transparent,black 10%,black 90%,transparent)' }}>
          <div style={{ display: 'flex', gap: '1rem', animation: 'marquee 25s linear infinite', whiteSpace: 'nowrap' }}>
            {[...CLIENTS, ...CLIENTS].map((client, i) => (
              <span key={i} className="client-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 500, color: 'rgba(232,230,240,.3)', padding: '10px 20px', border: '1px solid rgba(255,255,255,.06)', borderRadius: '8px', whiteSpace: 'nowrap', transition: 'all .2s', flexShrink: 0 }}>
                {client}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)', margin: '0 6vw' }} />

      {/* CONTACT */}
      <section style={sectionStyle}>
        <div style={tagStyle}><span style={{ width: '20px', height: '1px', background: 'rgba(239,159,39,.4)' }}/>Nous contacter</div>
        <h2 className="hp-reveal" style={titleStyle}>Parlons de votre<br />prochain projet</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginTop: '4rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, label: 'Madagascar', value: 'Lot VA 20 E Tsiadana\nBP 4132, Antananarivo 101\nTél : +261 20 22 627 26\nGSM : +261 34 03 622 69' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, label: 'Email', value: 'madagascar@md2i.eu\nfrance@md2i.eu' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: 'Support', value: 'Téléassistance TeamViewer\nVisioconférence Skype : Md2i-Conseils\nRéponse sous 24h ouvrables' },
            ].map((card, i) => (
              <div key={i} className="hp-reveal contact-card" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '2rem', transition: 'border-color .3s' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239,159,39,.08)', border: '1px solid rgba(239,159,39,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  {card.icon}
                </div>
                <div style={{ fontSize: '11px', letterSpacing: '1px', color: 'rgba(239,159,39,.6)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '.4rem' }}>{card.label}</div>
                <div style={{ fontSize: '14px', color: 'rgba(232,230,240,.7)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{card.value}</div>
              </div>
            ))}
          </div>
          <div className="hp-reveal" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Nom complet', placeholder: 'Jean Dupont', type: 'text' },
              { label: 'Email', placeholder: 'jean@organisation.org', type: 'email' },
              { label: 'Objet', placeholder: 'Demande de démonstration SARA...', type: 'text' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '10px', letterSpacing: '1px', color: 'rgba(232,230,240,.3)', textTransform: 'uppercase', fontWeight: 600 }}>{f.label}</label>
                <input className="cf-input" type={f.type} placeholder={f.placeholder} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '9px', padding: '10px 14px', color: '#f0ede8', fontSize: '14px', fontFamily: 'inherit', outline: 'none', transition: 'border-color .2s' }} />
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '10px', letterSpacing: '1px', color: 'rgba(232,230,240,.3)', textTransform: 'uppercase', fontWeight: 600 }}>Message</label>
              <textarea className="cf-input" placeholder="Décrivez votre projet ou votre besoin..." style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '9px', padding: '10px 14px', color: '#f0ede8', fontSize: '14px', fontFamily: 'inherit', outline: 'none', transition: 'border-color .2s', resize: 'vertical', minHeight: '100px' }} />
            </div>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px 28px', borderRadius: '10px', background: `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`, color: '#fff', fontSize: '14px', fontWeight: 500, fontFamily: 'inherit', border: 'none', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s', boxShadow: '0 4px 24px rgba(239,159,39,.25)', marginTop: '.5rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Envoyer le message
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '4rem 6vw 2rem', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '.75rem' }}>
              <span style={{ color: '#9a9890' }}>MD</span>
              <span style={{ color: ORANGE }}>2</span>
              <span style={{ color: '#9a9890' }}>i</span>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: ORANGE, marginBottom: '3px', boxShadow: '0 0 6px rgba(239,159,39,.8)', animation: 'dotPulse 2s ease-in-out infinite' }} />
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(232,230,240,.45)', maxWidth: '260px', lineHeight: 1.6 }}>Management, Développement International & Informatique — Cabinet fondé à Paris en 1987.</div>
          </div>
          <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap' }}>
            {[
              { title: 'Solutions', links: ['SARA FED', 'SARA M&E', 'SARA ULTIMATE', 'SARA Premium'] },
              { title: 'Services', links: ['Développement', 'Formation', 'Audit', 'Hébergement'] },
              { title: 'Contact', links: ['Madagascar', 'France', 'Support', 'Administration'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 style={{ fontSize: '11px', letterSpacing: '1.5px', color: 'rgba(239,159,39,.6)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>{col.title}</h4>
                {col.links.map((link, j) => (
                  <a key={j} href="#" style={{ display: 'block', fontSize: '13px', color: 'rgba(232,230,240,.45)', marginBottom: '.6rem', transition: 'color .2s' }}>{link}</a>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,.05)', fontSize: '12px', color: 'rgba(232,230,240,.25)', flexWrap: 'wrap', gap: '.5rem' }}>
          <span>© 2026 MD2i Madagascar SARL — Tous droits réservés</span>
          <span>madagascar@md2i.eu · france@md2i.eu</span>
        </div>
      </footer>
    </>  )
}