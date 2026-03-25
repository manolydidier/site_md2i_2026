'use client'
import { signIn } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import api from '../lib/axios'
import { useTheme } from '../context/ThemeContext'
import logo from '../../assets/md2i_logo.png'

type Tab = 'login' | 'register'

const ORANGE      = '#EF9F27'
const ORANGE_DARK = '#c97d15'
const ORANGE_GLOW = 'rgba(239,159,39,.22)'

// ─── Validation ───────────────────────────────────────────────────────────────
const rules = {
  email:   (v: string) => !v ? "L'email est requis" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Format invalide (ex: nom@domaine.com)' : null,
  pass:    (v: string) => !v ? 'Le mot de passe est requis' : v.length < 4 ? 'Trop court' : null,
  strong:  (v: string) => !v ? 'Le mot de passe est requis' : v.length < 8 ? 'Minimum 8 caractères' : !/[A-Z]/.test(v) ? 'Au moins une majuscule' : !/[0-9]/.test(v) ? 'Au moins un chiffre' : null,
  confirm: (v: string, ref: string) => !v ? 'Confirmez le mot de passe' : v !== ref ? 'Les mots de passe ne correspondent pas' : null,
  name:    (v: string) => !v ? 'Ce champ est requis' : v.length < 2 ? 'Minimum 2 caractères' : null,
}

// ─── Password Strength Bar ────────────────────────────────────────────────────
function PasswordStrength({ value }: { value: string }) {
  const strength = !value ? 0 : value.length < 6 ? 1 : value.length < 8 ? 2 : /[A-Z]/.test(value) && /[0-9]/.test(value) && value.length >= 8 ? 4 : 3
  const labels   = ['', 'Faible', 'Moyen', 'Bien', 'Fort']
  const colors   = ['', '#e24b4a', '#f5a623', '#3dd68c', '#1D9E75']
  if (!value) return null
  return (
    <div style={{ marginTop: '-6px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', transition: 'background .3s', background: i <= strength ? colors[strength] : 'rgba(128,128,128,.18)' }} />
        ))}
      </div>
      <p style={{ fontSize: '10px', color: colors[strength], fontWeight: 600, letterSpacing: '.5px' }}>{labels[strength]}</p>
    </div>
  )
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function Field({ label, type: initType, placeholder, value, onChange, error, dark, showStrength }: {
  label: string; type: string; placeholder: string
  value: string; onChange: (v: string) => void
  error?: string; dark: boolean; showStrength?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  const type      = initType === 'password' && visible ? 'text' : initType
  const hasErr    = !!error
  const hasOk     = !error && value.length > 0
  const borderColor = hasErr
    ? 'rgba(226,75,74,.55)'
    : hasOk   ? 'rgba(61,214,140,.45)'
    : focused  ? `${ORANGE}66`
    : dark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.13)'
  const shadow = focused
    ? `0 0 0 3px ${hasErr ? 'rgba(226,75,74,.10)' : ORANGE_GLOW}`
    : hasErr ? '0 0 0 3px rgba(226,75,74,.08)' : 'none'

  return (
    <div style={{ marginBottom: '.75rem' }}>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '1.4px', marginBottom: '7px', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,.36)' : 'rgba(0,0,0,.42)' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: initType === 'password' ? '11px 72px 11px 14px' : '11px 38px 11px 14px',
            borderRadius: '11px',
            border: `1.5px solid ${borderColor}`,
            fontSize: '14px',
            fontFamily: 'inherit',
            background: dark ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.025)',
            color: dark ? '#f0ede8' : '#1a1918',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color .2s, box-shadow .2s',
            boxShadow: shadow,
            animation: hasErr ? 'shake .35s ease' : 'none',
          }}
        />
        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {initType === 'password' && (
            <button type="button" onClick={() => setVisible(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)', padding: '2px', display: 'flex', alignItems: 'center', lineHeight: 1 }}>
              {visible
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          )}
          {(hasErr || hasOk) && (
            <span style={{ fontSize: '13px', color: hasErr ? '#e24b4a' : '#3dd68c', fontWeight: 700 }}>
              {hasErr ? '✕' : '✓'}
            </span>
          )}
        </div>
      </div>
      {showStrength && <PasswordStrength value={value} />}
      {hasErr && (
        <p style={{ fontSize: '11px', color: '#e24b4a', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', animation: 'msgIn .2s ease' }}>
          <span style={{ fontWeight: 700 }}>✕</span> {error}
        </p>
      )}
    </div>
  )
}

// ─── Animated Grid Background ─────────────────────────────────────────────────
function GridCanvas({ dark }: { dark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let animId: number
    let t = 0
    type Particle = { x: number; y: number; r: number; vx: number; vy: number; a: number; pulse: number }
    let particles: Particle[] = []

    function resize() {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      particles = Array.from({ length: 55 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.4 + 0.4,
        vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
        a: Math.random() * .45 + .08, pulse: Math.random() * Math.PI * 2,
      }))
    }

    function draw() {
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      ctx.clearRect(0, 0, W, H)
      t += 0.012

      const step = 48
      for (let gx = 0; gx < W; gx += step) {
        for (let gy = 0; gy < H; gy += step) {
          const wave = Math.sin(gx * .018 + t) * Math.cos(gy * .018 + t * .7) * .4 + .6
          ctx.beginPath()
          ctx.arc(gx, gy, 0.9, 0, Math.PI * 2)
          ctx.fillStyle = dark
            ? `rgba(239,159,39,${wave * .14})`
            : `rgba(239,159,39,${wave * .09})`
          ctx.fill()
        }
      }

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        p.pulse += 0.03
        const pulsedA = p.a * (0.7 + Math.sin(p.pulse) * 0.3)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(239,159,39,${pulsedA})`
        ctx.fill()
      })

      particles.forEach((p, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const d = Math.hypot(p.x - particles[j].x, p.y - particles[j].y)
          if (d < 95) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(239,159,39,${.055 * (1 - d / 95)})`
            ctx.lineWidth = .5; ctx.stroke()
          }
        }
      })
      animId = requestAnimationFrame(draw)
    }

    resize(); draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [dark])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    />
  )
}

// ─── OTP Modal ────────────────────────────────────────────────────────────────
function OtpModal({ email, dark, onVerified, onClose }: {
  email: string; dark: boolean; onVerified: () => void; onClose: () => void
}) {
  const [digits,    setDigits]    = useState(['', '', '', '', '', ''])
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [success,   setSuccess]   = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  useEffect(() => { setTimeout(() => inputsRef.current[0]?.focus(), 100) }, [])

  async function submitCode(code: string) {
    setLoading(true); setError('')
    try {
      await api.post('/api/auth/verify-email', { email, code })
      setSuccess(true)
      setTimeout(onVerified, 1200)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Code incorrect')
      setDigits(['', '', '', '', '', ''])
      setTimeout(() => inputsRef.current[0]?.focus(), 50)
    }
    setLoading(false)
  }

  function handleDigit(i: number, val: string) {
    const cleaned = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]; next[i] = cleaned; setDigits(next); setError('')
    if (cleaned && i < 5) inputsRef.current[i + 1]?.focus()
    if (cleaned && i === 5) {
      const code = [...next.slice(0, 5), cleaned].join('')
      if (code.length === 6) setTimeout(() => submitCode(code), 80)
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus()
    if (e.key === 'ArrowLeft'  && i > 0) inputsRef.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < 5) inputsRef.current[i + 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) { setDigits(paste.split('')); submitCode(paste) }
  }

  async function handleResend() {
    setResending(true); setError('')
    try {
      await api.post('/api/auth/send-verification', { email })
      setCountdown(60); setDigits(['', '', '', '', '', ''])
      setTimeout(() => inputsRef.current[0]?.focus(), 50)
    } catch { setError('Erreur lors du renvoi') }
    setResending(false)
  }

  const bg        = dark ? '#0e0e16'               : '#ffffff'
  const border    = dark ? 'rgba(255,255,255,.09)'  : 'rgba(0,0,0,.1)'
  const txt       = dark ? '#f0ede8'               : '#1a1918'
  const muted     = dark ? 'rgba(255,255,255,.38)'  : 'rgba(0,0,0,.45)'
  const dim       = dark ? 'rgba(255,255,255,.22)'  : 'rgba(0,0,0,.28)'
  const inpBg     = dark ? 'rgba(255,255,255,.05)'  : 'rgba(0,0,0,.04)'
  const inpBorder = dark ? 'rgba(255,255,255,.15)'  : 'rgba(0,0,0,.15)'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 24, padding: '2.5rem 2rem', width: '100%', maxWidth: 400, boxShadow: '0 40px 80px rgba(0,0,0,.5)', animation: 'modalIn .28s cubic-bezier(.22,1,.36,1)', textAlign: 'center' }}>
        {success ? (
          <div style={{ padding: '1rem 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(29,158,117,.12)', border: '1.5px solid rgba(29,158,117,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px', lineHeight: '64px' }}>
              ✓
            </div>
            <h3 style={{ color: '#1D9E75', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Email vérifié !</h3>
            <p style={{ color: muted, fontSize: 13 }}>Connexion en cours…</p>
          </div>
        ) : (
          <>
            <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'rgba(239,159,39,.1)', border: '1.5px solid rgba(239,159,39,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 20px', lineHeight: '58px' }}>
              🔐
            </div>
            <h3 style={{ color: txt, fontSize: 20, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-.02em' }}>Vérifiez votre email</h3>
            <p style={{ color: muted, fontSize: 13, lineHeight: 1.65, margin: '0 0 28px' }}>
              Nous avons envoyé un code à 6 chiffres à<br/>
              <strong style={{ color: ORANGE }}>{email}</strong>
            </p>

            {/* Champs OTP */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }} onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputsRef.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  style={{
                    width: 46, height: 56, textAlign: 'center',
                    fontSize: 22, fontWeight: 700, fontFamily: 'monospace',
                    borderRadius: 12,
                    border: `2px solid ${error ? 'rgba(226,75,74,.5)' : d ? ORANGE : inpBorder}`,
                    background: d ? 'rgba(239,159,39,.08)' : inpBg,
                    color: txt, outline: 'none',
                    transition: 'border-color .18s, background .18s',
                    boxShadow: d ? `0 0 0 3px rgba(239,159,39,.12)` : 'none',
                  }}
                />
              ))}
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16, color: '#e24b4a', fontSize: 13, animation: 'msgIn .2s ease' }}>
                <span style={{ fontWeight: 700 }}>✕</span> {error}
              </div>
            )}

            <button
              onClick={() => { const code = digits.join(''); if (code.length === 6) submitCode(code) }}
              disabled={loading || digits.join('').length < 6}
              style={{
                width: '100%', padding: '13px 20px', borderRadius: 11, border: 'none',
                background: `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`,
                color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                cursor: loading || digits.join('').length < 6 ? 'not-allowed' : 'pointer',
                opacity: digits.join('').length < 6 ? .5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginBottom: 16, boxShadow: `0 4px 20px ${ORANGE_GLOW}`, transition: 'opacity .2s',
              }}
            >
              {loading && (
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite', display: 'inline-block' }} />
              )}
              {loading ? 'Vérification…' : 'Vérifier le code'}
            </button>

            <div style={{ fontSize: 13, color: dim }}>
              {countdown > 0 ? (
                <span>Renvoyer dans <strong style={{ color: txt }}>{countdown}s</strong></span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: ORANGE, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: 0 }}
                >
                  {resending ? 'Envoi…' : '↻ Renvoyer le code'}
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              style={{ marginTop: 20, background: 'none', border: 'none', cursor: 'pointer', color: dim, fontSize: 12, fontFamily: 'inherit', textDecoration: 'underline' }}
            >
              Annuler et changer d'email
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function AuthPage() {
  const router = useRouter()
  const { dark, toggleTheme } = useTheme()
  const [tab,     setTab]     = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [gmsg,    setGmsg]    = useState<{ text: string; type: 'err' | 'ok' } | null>(null)
  const [mobile,  setMobile]  = useState(false)

  // Login
  const [lEmail, setLEmail] = useState('')
  const [lPass,  setLPass]  = useState('')
  const [lErr,   setLErr]   = useState<Record<string, string>>({})

  // Register
  const [rFirst,   setRFirst]   = useState('')
  const [rLast,    setRLast]    = useState('')
  const [rEmail,   setREmail]   = useState('')
  const [rPass,    setRPass]    = useState('')
  const [rConfirm, setRConfirm] = useState('')
  const [rErr,     setRErr]     = useState<Record<string, string>>({})

  // OTP — déclarés ICI dans le composant
  const [otpEmail,    setOtpEmail]    = useState('')
  const [showOtp,     setShowOtp]     = useState(false)
  const [pendingPass, setPendingPass] = useState('')

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function switchTab(t: Tab) { setTab(t); setGmsg(null); setLErr({}); setRErr({}) }

  // ── Login ──────────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    const ee = rules.email(lEmail); if (ee) errs.email = ee
    const pe = rules.pass(lPass);   if (pe) errs.pass  = pe
    if (Object.keys(errs).length) { setLErr(errs); setGmsg({ text: 'Veuillez corriger les erreurs ci-dessus', type: 'err' }); return }
    setLoading(true)
    const result = await signIn('credentials', { email: lEmail, password: lPass, redirect: false })
    if (result?.error) {
      if (result.error === 'EMAIL_NOT_VERIFIED') {
        await api.post('/api/auth/send-verification', { email: lEmail }).catch(() => {})
        setOtpEmail(lEmail)
        setPendingPass(lPass)
        setShowOtp(true)
      } else {
        setLErr({ pass: 'Identifiants incorrects' })
        setGmsg({ text: 'Email ou mot de passe incorrect', type: 'err' })
      }
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  // ── Register ───────────────────────────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
  e.preventDefault()
  const errs: Record<string, string> = {}
  const fn = rules.name(rFirst);              if (fn) errs.first   = fn
  const ln = rules.name(rLast);               if (ln) errs.last    = ln
  const em = rules.email(rEmail);             if (em) errs.email   = em
  const ps = rules.strong(rPass);             if (ps) errs.pass    = ps
  const co = rules.confirm(rConfirm, rPass);  if (co) errs.confirm = co
  if (Object.keys(errs).length) {
    setRErr(errs)
    setGmsg({ text: 'Veuillez corriger les erreurs ci-dessus', type: 'err' })
    return
  }
  setLoading(true)
  try {
    const res = await api.post('/api/auth/register', {
      firstName: rFirst, lastName: rLast, email: rEmail, password: rPass,
    })
    if (res.data?.success) {
      // ✅ PAS de send-verification ici — register envoie déjà le mail
      setOtpEmail(rEmail)
      setPendingPass(rPass)
      setShowOtp(true)
      setGmsg(null)
    }
  } catch (err: any) {
    const msg = err.response?.data?.error || 'Erreur serveur, réessayez'
    if (msg.toLowerCase().includes('email')) setRErr({ email: 'Cet email est déjà utilisé' })
    setGmsg({ text: msg, type: 'err' })
  }
  setLoading(false)
}

  // ── Après vérification OTP ─────────────────────────────────────────────────
  async function handleOtpVerified() {
    setShowOtp(false)
    setGmsg({ text: '✓ Email vérifié ! Connexion…', type: 'ok' })
    const result = await signIn('credentials', { email: otpEmail, password: pendingPass, redirect: false })
    if (result?.ok) router.push('/admin')
    else { setGmsg({ text: 'Connectez-vous maintenant.', type: 'ok' }); switchTab('login') }
  }

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const pageBg      = dark ? '#060609'                  : '#f2efe9'
  const navBg       = dark ? 'rgba(6,6,9,.82)'          : 'rgba(242,239,233,.92)'
  const navBorder   = dark ? 'rgba(255,255,255,.06)'    : 'rgba(0,0,0,.08)'
  const cardBg      = dark ? 'rgba(255,255,255,.025)'   : 'rgba(255,255,255,.82)'
  const cardBorder  = dark ? 'rgba(255,255,255,.08)'    : 'rgba(0,0,0,.09)'
  const leftBg      = dark
    ? 'linear-gradient(150deg,rgba(239,159,39,.10) 0%,rgba(60,38,8,.18) 50%,rgba(6,6,9,.25) 100%)'
    : 'linear-gradient(150deg,rgba(239,159,39,.16) 0%,rgba(239,159,39,.07) 55%,rgba(242,239,233,.35) 100%)'
  const leftBorder  = dark ? 'rgba(255,255,255,.07)'    : 'rgba(0,0,0,.08)'
  const rightBg     = dark ? 'rgba(10,10,16,.58)'       : 'rgba(255,255,255,.78)'
  const titleColor  = dark ? '#ede9e0'                  : '#161412'
  const descColor   = dark ? 'rgba(255,255,255,.38)'    : 'rgba(0,0,0,.46)'
  const tabInactive = dark ? 'rgba(255,255,255,.32)'    : 'rgba(0,0,0,.4)'
  const footColor   = dark ? 'rgba(255,255,255,.3)'     : 'rgba(0,0,0,.4)'

  const btnStyle: React.CSSProperties = {
    width: '100%', padding: '13px 20px',
    borderRadius: '11px', border: 'none',
    background: `linear-gradient(135deg,${ORANGE} 0%,${ORANGE_DARK} 100%)`,
    color: '#fff', fontSize: '14px', fontWeight: 600,
    fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? .65 : 1,
    boxShadow: `0 4px 28px ${ORANGE_GLOW}`,
    transition: 'transform .15s, box-shadow .2s, opacity .2s',
    letterSpacing: '.4px', overflow: 'hidden', position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pageIn    { from{opacity:0;transform:translateY(18px) scale(.985)} to{opacity:1;transform:none} }
        @keyframes panelIn   { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:none} }
        @keyframes formIn    { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:none} }
        @keyframes msgIn     { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }
        @keyframes modalIn   { from{opacity:0;transform:translateY(14px) scale(.96)} to{opacity:1;transform:none} }
        @keyframes shake     { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes shine     { 0%{left:-110%} 45%,100%{left:160%} }
        @keyframes orbPulse  { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes dotPop    { from{opacity:0;transform:scale(.5)} to{opacity:1;transform:scale(1)} }
        @keyframes featSlide { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:none} }
        @keyframes circuitPulse { 0%,100%{opacity:.3} 50%{opacity:.7} }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px ${dark ? 'rgba(15,15,22,1)' : 'rgba(248,246,241,1)'} inset !important;
          -webkit-text-fill-color: ${dark ? '#ede9e0' : '#161412'} !important;
          caret-color: ${dark ? '#ede9e0' : '#161412'};
        }
        input::placeholder { color: ${dark ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.28)'} !important; }

        .auth-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 36px rgba(239,159,39,.38) !important; }
        .auth-btn:active:not(:disabled) { transform: translateY(0) scale(.99); }
        .back-link:hover { color: ${dark ? 'rgba(255,255,255,.75)' : 'rgba(0,0,0,.75)'} !important; }
        .theme-btn:hover { background: ${dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'} !important; }
        .feat-row:hover .feat-icon { border-color: rgba(239,159,39,.55) !important; background: rgba(239,159,39,.16) !important; }

        @media (max-width: 767px) {
          .auth-split { flex-direction: column !important; max-width: 480px !important; border-radius: 20px !important; }
          .auth-left  { width: 100% !important; border-right: none !important; border-bottom: 1px solid ${leftBorder} !important; padding: 1.5rem 1.75rem !important; }
          .auth-right { padding: 1.5rem !important; }
          .auth-left-features { display: none !important; }
          .auth-left-circuit  { display: none !important; }
          .auth-left-desc     { display: none !important; }
          .auth-left-stats    { display: none !important; }
          .auth-wrapper { padding: 1rem !important; align-items: flex-start !important; padding-top: 1.2rem !important; }
          .auth-nav { padding: 0.75rem 1.25rem !important; }
          .nav-admin-badge { display: none !important; }
        }
        @media (max-width: 400px) {
          .auth-split { border-radius: 16px !important; }
          .auth-left  { padding: 1.5rem 1.25rem !important; }
          .auth-right { padding: 1.25rem !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: pageBg, color: titleColor, fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden', transition: 'background .3s' }}>

        {/* ── Canvas background ── */}
        <GridCanvas dark={dark} />

        {/* ── OTP Modal — rendu ICI dans le return, dans le composant ── */}
        {showOtp && (
          <OtpModal
            email={otpEmail}
            dark={dark}
            onVerified={handleOtpVerified}
            onClose={() => setShowOtp(false)}
          />
        )}

        {/* ── Orbes de lumière ── */}
        {[
          { w: 560, h: 560, top: '-180px', right: '-120px', color: 'rgba(239,159,39,.16)', delay: '0s',   dur: '8s'  },
          { w: 380, h: 380, bottom: '-100px', left: '-90px', color: 'rgba(80,80,220,.10)', delay: '-3.5s', dur: '11s' },
          { w: 220, h: 220, top: '35%', left: '8%',          color: 'rgba(239,159,39,.10)', delay: '-5s',   dur: '9s'  },
        ].map((o, i) => (
          <div key={i} style={{
            position: 'absolute', width: o.w, height: o.h, borderRadius: '50%',
            background: `radial-gradient(circle,${o.color} 0%,transparent 72%)`,
            filter: 'blur(72px)', pointerEvents: 'none', zIndex: 0,
            ...o, animation: `orbPulse ${o.dur} ease-in-out ${o.delay} infinite`,
          } as React.CSSProperties} />
        ))}

        {/* ── Navbar ── */}
        <nav className="auth-nav" style={{
          height: '60px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 2rem',
          position: 'relative', zIndex: 20,
          borderBottom: `1px solid ${navBorder}`,
          background: navBg, backdropFilter: 'blur(22px)',
          transition: 'background .3s, border-color .3s',
        }}>
          <img src={logo.src} alt="MD2i" style={{ height: '32px', width: 'auto' }} />

          <span className="nav-admin-badge" style={{
            fontSize: '9.5px', letterSpacing: '2.2px', fontWeight: 600,
            padding: '3px 11px', borderRadius: '20px',
            border: '1px solid rgba(239,159,39,.22)',
            color: 'rgba(239,159,39,.65)', background: 'rgba(239,159,39,.07)',
            textTransform: 'uppercase',
          }}>
            Administration
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="theme-btn"
              onClick={toggleTheme}
              title={dark ? 'Mode clair' : 'Mode sombre'}
              style={{
                width: '34px', height: '34px', borderRadius: '9px',
                border: `1px solid ${dark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.12)'}`,
                background: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: dark ? 'rgba(255,255,255,.48)' : 'rgba(0,0,0,.48)',
                transition: 'all .2s',
              }}
            >
              {dark
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>
            <a href="/" className="back-link" style={{ fontSize: '12px', color: dark ? 'rgba(255,255,255,.36)' : 'rgba(0,0,0,.42)', textDecoration: 'none', fontWeight: 500, transition: 'color .2s', whiteSpace: 'nowrap' }}>
              ← Retour
            </a>
          </div>
        </nav>

        {/* ── Wrapper principal ── */}
        <div className="auth-wrapper" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 'calc(100vh - 60px)', padding: '2rem 1rem',
          position: 'relative', zIndex: 10,
        }}>
          <div className="auth-split" style={{
            display: 'flex', width: '100%', maxWidth: '920px',
            borderRadius: '24px', overflow: 'hidden',
            border: `1px solid ${cardBorder}`,
            background: cardBg, backdropFilter: 'blur(4px)',
            boxShadow: dark
              ? '0 32px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.04)'
              : '0 24px 64px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.04)',
            animation: 'pageIn .65s cubic-bezier(.22,1,.36,1) both',
          }}>

            {/* ── Panel Gauche ── */}
            <div className="auth-left" style={{
              width: '42%', minWidth: 0,
              background: leftBg,
              padding: '3rem 2.6rem',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              borderRight: `1px solid ${leftBorder}`,
              position: 'relative', overflow: 'hidden',
              animation: 'panelIn .7s cubic-bezier(.22,1,.36,1) .1s both',
            }}>
              {/* Grille SVG de fond */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: dark ? 1 : 0.7 }}>
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
                      <path d="M 44 0 L 0 0 0 44" fill="none" stroke="rgba(239,159,39,0.06)" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)"/>
                </svg>
              </div>

              {/* Orbe déco interne */}
              <div style={{ position: 'absolute', width: '220px', height: '220px', borderRadius: '50%', top: '-60px', right: '-60px', background: 'radial-gradient(circle,rgba(239,159,39,.20) 0%,transparent 72%)', filter: 'blur(48px)', pointerEvents: 'none', zIndex: 0 }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginBottom: '1.6rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: ORANGE, boxShadow: `0 0 10px ${ORANGE}`, animation: 'dotPop .4s ease .3s both' }} />
                  <p style={{ fontSize: '10px', letterSpacing: '2.5px', color: 'rgba(239,159,39,.72)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Cabinet IT · Solutions digitales
                  </p>
                </div>

                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, lineHeight: 1.15, color: titleColor, marginBottom: '1rem' }}>
                  Votre espace<br />
                  <span style={{ color: ORANGE }}>MD2i</span>{' '}
                  <span style={{ color: dark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.45)', fontWeight: 600 }}>Admin</span>
                </h1>

                <p className="auth-left-desc" style={{ fontSize: '13px', color: descColor, lineHeight: 1.75, fontWeight: 300, maxWidth: '280px' }}>
                  Gérez votre présence digitale, vos contenus et vos clients depuis un seul endroit sécurisé.
                </p>
              </div>

              {/* Features */}
              <div className="auth-left-features" style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 1, marginTop: '2rem' }}>
                {[
                  { icon: '⚡', title: 'Dashboard temps réel', desc: 'Stats, messages et contenus centralisés', delay: '.2s' },
                  { icon: '🔒', title: 'Accès sécurisé JWT', desc: 'Sessions chiffrées et rôles granulaires', delay: '.35s' },
                  { icon: '✦', title: 'Éditeur GrapesJS', desc: 'Créez vos pages sans coder', delay: '.5s' },
                ].map((f, i) => (
                  <div key={i} className="feat-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', animation: `featSlide .5s cubic-bezier(.22,1,.36,1) ${f.delay} both`, cursor: 'default' }}>
                    <div className="feat-icon" style={{
                      width: '33px', height: '33px', borderRadius: '9px', flexShrink: 0,
                      background: 'rgba(239,159,39,.09)', border: '1px solid rgba(239,159,39,.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', transition: 'all .2s',
                    }}>
                      {f.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: dark ? 'rgba(255,255,255,.78)' : 'rgba(0,0,0,.78)', marginBottom: '1px' }}>{f.title}</p>
                      <p style={{ fontSize: '11px', color: dark ? 'rgba(255,255,255,.32)' : 'rgba(0,0,0,.42)' }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Circuit PCB animé */}
              <div className="auth-left-circuit" style={{ position: 'relative', zIndex: 1, marginTop: '1.4rem' }}>
                <svg viewBox="0 0 260 110" style={{ width: '100%' }} xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="cglow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="1.8" result="b"/>
                      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <filter id="cglowStrong" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="b"/>
                      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>

                  {/* Pistes secondaires */}
                  <g stroke={dark ? 'rgba(239,159,39,.15)' : 'rgba(239,159,39,.12)'} strokeWidth=".6" fill="none">
                    <line x1="0"   y1="55" x2="260" y2="55"/>
                    <line x1="30"  y1="0"  x2="30"  y2="110"/>
                    <line x1="130" y1="0"  x2="130" y2="110"/>
                    <line x1="230" y1="0"  x2="230" y2="110"/>
                  </g>

                  {/* Pistes principales */}
                  <g stroke={dark ? 'rgba(239,159,39,.42)' : 'rgba(239,159,39,.35)'} strokeWidth=".85" fill="none" filter="url(#cglow)">
                    <polyline points="6,82 50,82 50,62 100,62 100,82 160,82 160,62 210,62 210,82 254,82"/>
                    <polyline points="6,28 50,28 50,48 100,48 100,28 160,28 160,48 210,48 210,28 254,28"/>
                    <line x1="50"  y1="28" x2="50"  y2="82"/>
                    <line x1="100" y1="28" x2="100" y2="82"/>
                    <line x1="160" y1="28" x2="160" y2="82"/>
                    <line x1="210" y1="28" x2="210" y2="82"/>
                    <polyline points="100,55 130,55 130,28"/>
                    <polyline points="160,55 130,55"/>
                  </g>

                  {/* Noeuds / vias */}
                  <g filter="url(#cglow)">
                    {[
                      [50,28],[100,28],[160,28],[210,28],
                      [50,82],[100,82],[160,82],[210,82],
                      [50,55],[100,55],[160,55],[210,55],
                      [130,28],[130,55],
                    ].map(([cx,cy], i) => (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r="4.5" fill="none" stroke={dark ? 'rgba(239,159,39,.5)' : 'rgba(239,159,39,.45)'} strokeWidth=".8"/>
                        <circle cx={cx} cy={cy} r="2.2" fill={dark ? 'rgba(239,159,39,.75)' : 'rgba(239,159,39,.65)'}/>
                      </g>
                    ))}
                  </g>

                  {/* LEDs clignotantes */}
                  {[[50,28,0],[160,82,1],[210,28,2],[100,55,3]].map(([cx,cy,phase]) => (
                    <circle key={`led-${cx}-${cy}`} cx={cx} cy={cy} r="2.8" fill={ORANGE} filter="url(#cglowStrong)">
                      <animate attributeName="opacity" values="1;0.15;1" dur={`${1.8 + phase * 0.55}s`} repeatCount="indefinite"/>
                    </circle>
                  ))}

                  {/* Points de données en transit */}
                  <circle r="3.2" fill={ORANGE} filter="url(#cglowStrong)" opacity="0.9">
                    <animateMotion dur="3.2s" repeatCount="indefinite" begin="0s">
                      <mpath href="#path-top"/>
                    </animateMotion>
                    <animate attributeName="r" values="3.2;4;3.2" dur="0.6s" repeatCount="indefinite"/>
                  </circle>

                  <circle r="2.8" fill="#3dd68c" filter="url(#cglowStrong)" opacity="0.85">
                    <animateMotion dur="4s" repeatCount="indefinite" begin="-1.6s">
                      <mpath href="#path-bot-rev"/>
                    </animateMotion>
                  </circle>

                  <circle r="2.4" fill={ORANGE} filter="url(#cglowStrong)" opacity="0.7">
                    <animateMotion dur="2.6s" repeatCount="indefinite" begin="-0.8s">
                      <mpath href="#path-cross"/>
                    </animateMotion>
                  </circle>

                  <circle r="2.2" fill="#4fa3e0" filter="url(#cglowStrong)" opacity="0.8">
                    <animateMotion dur="2.0s" repeatCount="indefinite" begin="-1.2s">
                      <mpath href="#path-center"/>
                    </animateMotion>
                  </circle>

                  {/* Chemins invisibles pour animateMotion */}
                  <path id="path-top"     d="M6,28 L50,28 L50,48 L100,48 L100,28 L160,28 L160,48 L210,48 L210,28 L254,28" fill="none" stroke="none"/>
                  <path id="path-bot-rev" d="M254,82 L210,82 L210,62 L160,62 L160,82 L100,82 L100,62 L50,62 L50,82 L6,82"  fill="none" stroke="none"/>
                  <path id="path-cross"   d="M50,28 L50,82 L160,82 L160,28 L210,28 L210,82"                                fill="none" stroke="none"/>
                  <path id="path-center"  d="M100,55 L130,55 L130,28 L160,28 L160,55"                                      fill="none" stroke="none"/>

                  {/* Résistances */}
                  {[[72,25,0],[72,85,0],[185,25,0],[185,85,0]].map(([rx,ry,rot],i) => (
                    <rect key={`res-${i}`} x={rx-8} y={ry-3.5} width="16" height="7" rx="1.5"
                      fill={dark ? 'rgba(40,40,50,.9)' : 'rgba(200,200,210,.9)'}
                      stroke={dark ? 'rgba(239,159,39,.4)' : 'rgba(239,159,39,.35)'} strokeWidth=".7"/>
                  ))}

                  {/* Condensateurs */}
                  {[[130,82],[6,55],[254,55]].map(([cx,cy],i) => (
                    <g key={`cap-${i}`}>
                      <rect x={cx-5} y={cy-6} width="10" height="12" rx="1"
                        fill={dark ? 'rgba(30,50,80,.95)' : 'rgba(100,140,200,.8)'}
                        stroke={dark ? 'rgba(100,160,255,.5)' : 'rgba(50,100,200,.4)'} strokeWidth=".7"/>
                      <line x1={cx} y1={cy-3} x2={cx} y2={cy+3} stroke={dark ? 'rgba(100,160,255,.6)' : 'rgba(50,100,200,.5)'} strokeWidth="1.2"/>
                    </g>
                  ))}
                </svg>
              </div>

              {/* Stats mini */}
              <div className="auth-left-stats" style={{ display: 'flex', gap: '20px', marginTop: '1.2rem', position: 'relative', zIndex: 1 }}>
                {[['54', 'pays'], ['35+', "ans d'exp."], ['100+', 'projets']].map(([v, l]) => (
                  <div key={l}>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 800, color: ORANGE, lineHeight: 1 }}>{v}</p>
                    <p style={{ fontSize: '9.5px', color: descColor, letterSpacing: '.8px', marginTop: '2px', textTransform: 'uppercase' }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Panel Droit ── */}
            <div className="auth-right" style={{ flex: 1, minWidth: 0, padding: '2rem 2.2rem 1.4rem', background: rightBg, backdropFilter: 'blur(32px)' }}>

              {/* Tabs */}
              <div style={{ display: 'flex', background: dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.05)', borderRadius: '13px', padding: '3px', marginBottom: '1.2rem', border: `1px solid ${dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)'}`, position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: '3px', bottom: '3px',
                  width: 'calc(50% - 3px)', borderRadius: '10px',
                  background: `linear-gradient(135deg,${ORANGE} 0%,${ORANGE_DARK} 100%)`,
                  transition: 'left .32s cubic-bezier(.22,1,.36,1)',
                  left: tab === 'login' ? '3px' : 'calc(50%)',
                  boxShadow: `0 2px 16px ${ORANGE_GLOW}`,
                }} />
                {(['login', 'register'] as Tab[]).map(t => (
                  <button key={t} onClick={() => switchTab(t)} style={{
                    flex: 1, padding: '9px 8px', borderRadius: '10px', border: 'none',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    fontFamily: 'inherit', background: 'none',
                    color: tab === t ? '#fff' : tabInactive,
                    position: 'relative', zIndex: 1, transition: 'color .2s',
                    letterSpacing: '.2px',
                  }}>
                    {t === 'login' ? 'Connexion' : 'Inscription'}
                  </button>
                ))}
              </div>

              {/* Message global */}
              {gmsg && (
                <div style={{
                  fontSize: '12.5px', padding: '10px 14px', borderRadius: '10px',
                  marginBottom: '1.25rem', animation: 'msgIn .25s ease',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  border: `1px solid ${gmsg.type === 'err' ? 'rgba(226,75,74,.22)' : 'rgba(61,214,140,.22)'}`,
                  color: gmsg.type === 'err' ? '#e24b4a' : '#3dd68c',
                  background: gmsg.type === 'err'
                    ? dark ? 'rgba(226,75,74,.09)' : 'rgba(226,75,74,.07)'
                    : dark ? 'rgba(61,214,140,.09)' : 'rgba(61,214,140,.07)',
                }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>{gmsg.type === 'err' ? '✕' : '✓'}</span>
                  {gmsg.text}
                </div>
              )}

              {/* ── LOGIN ── */}
              {tab === 'login' && (
                <form onSubmit={handleLogin} style={{ animation: 'formIn .32s cubic-bezier(.22,1,.36,1)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.1rem', gap: '3px' }}>
                    <img src={logo.src} alt="MD2i" style={{ height: '34px', width: 'auto', opacity: dark ? 0.9 : 1 }} />
                    <p style={{ fontSize: '11px', color: dark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.34)', letterSpacing: '.5px' }}>Connectez-vous à votre espace</p>
                  </div>
                  <Field label="Adresse email" type="email" placeholder="admin@md2i.com"
                    value={lEmail} onChange={v => { setLEmail(v); setLErr(p => ({ ...p, email: '' })) }}
                    error={lErr.email} dark={dark} />
                  <Field label="Mot de passe" type="password" placeholder="••••••••"
                    value={lPass} onChange={v => { setLPass(v); setLErr(p => ({ ...p, pass: '' })) }}
                    error={lErr.pass} dark={dark} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '.8rem', marginTop: '-2px' }}>
                    <a href="#" style={{ fontSize: '11.5px', color: 'rgba(239,159,39,.65)', textDecoration: 'none', letterSpacing: '.2px', fontWeight: 500 }}>
                      Mot de passe oublié ?
                    </a>
                  </div>
                  <button type="submit" disabled={loading} className="auth-btn" style={btnStyle}>
                    <span style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent)', animation: 'shine 2.8s ease-in-out infinite' }} />
                    {loading && <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,.22)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />}
                    <span>{loading ? 'Connexion en cours…' : 'Se connecter'}</span>
                    {!loading && <span style={{ fontSize: '16px' }}>→</span>}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '12px', color: footColor, marginTop: '.8rem' }}>
                    Pas de compte ?{' '}
                    <a href="#" onClick={e => { e.preventDefault(); switchTab('register') }} style={{ color: 'rgba(239,159,39,.8)', textDecoration: 'none', fontWeight: 600 }}>
                      S'inscrire
                    </a>
                  </p>
                </form>
              )}

              {/* ── REGISTER ── */}
              {tab === 'register' && (
                <form onSubmit={handleRegister} style={{ animation: 'formIn .32s cubic-bezier(.22,1,.36,1)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.1rem', gap: '3px' }}>
                    <img src={logo.src} alt="MD2i" style={{ height: '34px', width: 'auto', opacity: dark ? 0.9 : 1 }} />
                    <p style={{ fontSize: '11px', color: dark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.34)', letterSpacing: '.5px' }}>Créez votre compte administrateur</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <Field label="Prénom" type="text" placeholder="Jean"
                      value={rFirst} onChange={v => { setRFirst(v); setRErr(p => ({ ...p, first: '' })) }}
                      error={rErr.first} dark={dark} />
                    <Field label="Nom" type="text" placeholder="Dupont"
                      value={rLast} onChange={v => { setRLast(v); setRErr(p => ({ ...p, last: '' })) }}
                      error={rErr.last} dark={dark} />
                  </div>
                  <Field label="Adresse email" type="email" placeholder="jean@md2i.com"
                    value={rEmail} onChange={v => { setREmail(v); setRErr(p => ({ ...p, email: '' })) }}
                    error={rErr.email} dark={dark} />
                  <Field label="Mot de passe" type="password" placeholder="Min. 8 car. + majuscule + chiffre"
                    value={rPass} onChange={v => { setRPass(v); setRErr(p => ({ ...p, pass: '' })) }}
                    error={rErr.pass} dark={dark} showStrength />
                  <Field label="Confirmer le mot de passe" type="password" placeholder="••••••••"
                    value={rConfirm} onChange={v => { setRConfirm(v); setRErr(p => ({ ...p, confirm: '' })) }}
                    error={rErr.confirm} dark={dark} />
                  <button type="submit" disabled={loading} className="auth-btn" style={btnStyle}>
                    <span style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent)', animation: 'shine 2.8s ease-in-out infinite' }} />
                    {loading && <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,.22)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />}
                    <span>{loading ? 'Création du compte…' : 'Créer mon compte'}</span>
                    {!loading && <span style={{ fontSize: '16px' }}>→</span>}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '12px', color: footColor, marginTop: '.8rem' }}>
                    Déjà un compte ?{' '}
                    <a href="#" onClick={e => { e.preventDefault(); switchTab('login') }} style={{ color: 'rgba(239,159,39,.8)', textDecoration: 'none', fontWeight: 600 }}>
                      Se connecter
                    </a>
                  </p>
                </form>
              )}

              {/* Séparateur + footer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1rem' }}>
                <div style={{ flex: 1, height: '1px', background: dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(239,159,39,.45)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span style={{ fontSize: '10px', color: dark ? 'rgba(255,255,255,.20)' : 'rgba(0,0,0,.26)', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>JWT · MD2i © {new Date().getFullYear()}</span>
                </div>
                <div style={{ flex: 1, height: '1px', background: dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)' }} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}