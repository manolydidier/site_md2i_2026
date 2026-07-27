'use client'
import { signIn } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import api from '../lib/axios'
import { useTheme } from '../context/ThemeContext'
import logo from '../../assets/md2i_logo.png'
import '../(public)/public-theme.css'
import styles from './login.module.css'

type Tab = 'login' | 'register'

function accentTokens(dark: boolean) {
  return {
    accent: dark ? '#F7B955' : '#EF9F27',
    accentStrong: dark ? '#F4A62A' : '#B6620E',
    glow: dark ? 'rgba(247,185,85,.22)' : 'rgba(239,159,39,.22)',
  }
}

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
  const { accent, glow } = accentTokens(dark)
  const type      = initType === 'password' && visible ? 'text' : initType
  const hasErr    = !!error
  const hasOk     = !error && value.length > 0
  const borderColor = hasErr
    ? 'rgba(226,75,74,.55)'
    : hasOk   ? 'rgba(61,214,140,.45)'
    : focused  ? `${accent}66`
    : dark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.13)'
  const shadow = focused
    ? `0 0 0 3px ${hasErr ? 'rgba(226,75,74,.10)' : glow}`
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
            height: '48px',
            padding: initType === 'password' ? '0 78px 0 14px' : '0 38px 0 14px',
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
            animation: hasErr ? `${styles.shake} .35s ease` : 'none',
          }}
        />
        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {initType === 'password' && (
            <button
              type="button"
              onClick={() => setVisible(v => !v)}
              aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-pressed={visible}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', flexShrink: 0 }}
            >
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
        <p role="alert" style={{ fontSize: '11px', color: '#e24b4a', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontWeight: 700 }}>✕</span> {error}
        </p>
      )}
    </div>
  )
}

// ─── OTP Modal ────────────────────────────────────────────────────────────────
function OtpModal({ email, dark, onVerified, onClose }: {
  email: string; dark: boolean; onVerified: () => void; onClose: () => void
}) {
  const { accent } = accentTokens(dark)
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
    <div role="dialog" aria-modal="true" aria-label="Vérification de l'email" style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 24, padding: '2.5rem 2rem', width: '100%', maxWidth: 400, boxShadow: '0 40px 80px rgba(0,0,0,.5)', animation: `${styles.modalIn} .28s cubic-bezier(.22,1,.36,1)`, textAlign: 'center' }}>
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
            <h3 style={{ fontFamily: 'var(--font-heading), sans-serif', color: txt, fontSize: 20, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-.02em' }}>Vérifiez votre email</h3>
            <p style={{ color: muted, fontSize: 13, lineHeight: 1.65, margin: '0 0 28px' }}>
              Nous avons envoyé un code à 6 chiffres à<br/>
              <strong style={{ color: accent }}>{email}</strong>
            </p>

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
                  aria-label={`Chiffre ${i + 1} sur 6 du code de vérification`}
                  style={{
                    width: 46, height: 56, textAlign: 'center',
                    fontSize: 22, fontWeight: 700, fontFamily: 'monospace',
                    borderRadius: 12,
                    border: `2px solid ${error ? 'rgba(226,75,74,.5)' : d ? accent : inpBorder}`,
                    background: d ? 'rgba(239,159,39,.08)' : inpBg,
                    color: txt, outline: 'none',
                    transition: 'border-color .18s, background .18s',
                    boxShadow: d ? `0 0 0 3px rgba(239,159,39,.12)` : 'none',
                  }}
                />
              ))}
            </div>

            {error && (
              <div role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16, color: '#e24b4a', fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>✕</span> {error}
              </div>
            )}

            <button
              onClick={() => { const code = digits.join(''); if (code.length === 6) submitCode(code) }}
              disabled={loading || digits.join('').length < 6}
              className="publicBtnPrimary"
              style={{
                width: '100%',
                cursor: loading || digits.join('').length < 6 ? 'not-allowed' : 'pointer',
                opacity: digits.join('').length < 6 ? .5 : 1,
                marginBottom: 16,
              }}
            >
              {loading && (
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: `${styles.spin ?? 'spin'} .6s linear infinite`, display: 'inline-block' }} />
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
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: accent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: '8px', minHeight: '36px' }}
                >
                  {resending ? 'Envoi…' : '↻ Renvoyer le code'}
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              style={{ marginTop: 20, background: 'none', border: 'none', cursor: 'pointer', color: dim, fontSize: 12, fontFamily: 'inherit', textDecoration: 'underline', padding: '8px', minHeight: '36px' }}
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
  const { accent, accentStrong, glow } = accentTokens(dark)
  const [tab,     setTab]     = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [gmsg,    setGmsg]    = useState<{ text: string; type: 'err' | 'ok' } | null>(null)

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

  // OTP
  const [otpEmail,    setOtpEmail]    = useState('')
  const [showOtp,     setShowOtp]     = useState(false)
  const [pendingPass, setPendingPass] = useState('')

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
  const navBg       = dark ? '#0b0b10'                  : '#f2efe9'
  const navBorder   = dark ? 'rgba(255,255,255,.08)'    : 'rgba(0,0,0,.08)'
  const cardBg      = dark ? 'rgba(255,255,255,.03)'    : '#ffffff'
  const cardBorder  = dark ? 'rgba(255,255,255,.10)'    : 'rgba(0,0,0,.10)'
  const leftBg      = dark
    ? 'linear-gradient(150deg,rgba(239,159,39,.10) 0%,rgba(60,38,8,.18) 50%,rgba(6,6,9,.25) 100%)'
    : 'linear-gradient(150deg,rgba(239,159,39,.14) 0%,rgba(239,159,39,.05) 55%,rgba(242,239,233,.30) 100%)'
  const leftBorder  = dark ? 'rgba(255,255,255,.09)'    : 'rgba(0,0,0,.09)'
  const rightBg     = dark ? '#0c0c12'                  : '#ffffff'
  const titleColor  = dark ? '#ede9e0'                  : '#161412'
  const descColor   = dark ? 'rgba(255,255,255,.38)'    : 'rgba(0,0,0,.46)'
  const tabInactive = dark ? 'rgba(255,255,255,.32)'    : 'rgba(0,0,0,.4)'
  const footColor   = dark ? 'rgba(255,255,255,.3)'     : 'rgba(0,0,0,.4)'

  return (
    <div
      className={`public-theme-shell ${styles.page}`}
      data-theme={dark ? 'dark' : 'light'}
      style={{ minHeight: '100vh', background: pageBg, color: titleColor, fontFamily: 'var(--font-body), sans-serif', position: 'relative', transition: 'background .3s' }}
    >
      {showOtp && (
        <OtpModal
          email={otpEmail}
          dark={dark}
          onVerified={handleOtpVerified}
          onClose={() => setShowOtp(false)}
        />
      )}

      {/* ── Navbar ── */}
      <nav className={styles.authNav} style={{
        height: '60px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 2rem',
        position: 'relative', zIndex: 20,
        borderBottom: `1px solid ${navBorder}`,
        background: navBg,
        transition: 'background .3s, border-color .3s',
      }}>
        <Image src={logo} alt="MD2i" style={{ height: 32, width: 'auto' }} priority />

        <span className={styles.navAdminBadge} style={{
          fontSize: '9.5px', letterSpacing: '2.2px', fontWeight: 600,
          padding: '3px 11px', borderRadius: '20px',
          border: '1px solid rgba(239,159,39,.22)',
          color: 'rgba(239,159,39,.75)', background: 'rgba(239,159,39,.08)',
          textTransform: 'uppercase',
        }}>
          Administration
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={styles.themeBtn}
            onClick={toggleTheme}
            aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            title={dark ? 'Mode clair' : 'Mode sombre'}
            style={{
              width: '44px', height: '44px', borderRadius: '10px',
              border: `1px solid ${dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)'}`,
              background: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: dark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.55)',
              transition: 'all .2s',
            }}
          >
            {dark
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
          <a href="/" className={styles.backLink} style={{ fontSize: '12px', color: dark ? 'rgba(255,255,255,.42)' : 'rgba(0,0,0,.48)', textDecoration: 'none', fontWeight: 500, transition: 'color .2s', whiteSpace: 'nowrap', padding: '10px 6px', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
            ← Retour
          </a>
        </div>
      </nav>

      {/* ── Wrapper principal ── */}
      <div className={styles.authWrapper} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)', padding: '2rem 1rem',
        position: 'relative', zIndex: 10,
      }}>
        <div className={styles.authSplit} style={{
          display: 'flex', width: '100%', maxWidth: '920px',
          borderRadius: '24px', overflow: 'hidden',
          border: `1px solid ${cardBorder}`,
          background: cardBg,
          boxShadow: dark
            ? '0 32px 80px rgba(0,0,0,.55)'
            : '0 24px 64px rgba(0,0,0,.12)',
        }}>

          {/* ── Panel Gauche ── */}
          <div className={styles.authLeft} style={{
            width: '42%', minWidth: 0,
            background: leftBg,
            padding: '3rem 2.6rem',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            borderRight: `1px solid ${leftBorder}`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginBottom: '1.6rem' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent, boxShadow: `0 0 10px ${accent}` }} />
                <p style={{ fontSize: '10px', letterSpacing: '2.5px', color: 'rgba(239,159,39,.8)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Cabinet IT · Solutions digitales
                </p>
              </div>

              <h1 style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, lineHeight: 1.15, color: titleColor, marginBottom: '1rem' }}>
                Votre espace<br />
                <span style={{ color: accent }}>MD2i</span>{' '}
                <span style={{ color: dark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.45)', fontWeight: 600 }}>Admin</span>
              </h1>

              <p className={styles.authLeftDesc} style={{ fontSize: '13px', color: descColor, lineHeight: 1.75, fontWeight: 300, maxWidth: '280px' }}>
                Gérez votre présence digitale, vos contenus et vos clients depuis un seul endroit sécurisé.
              </p>
            </div>

            <div className={styles.authLeftFeatures} style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 1, marginTop: '2rem' }}>
              {[
                { icon: '⚡', title: 'Dashboard temps réel', desc: 'Stats, messages et contenus centralisés' },
                { icon: '🔒', title: 'Accès sécurisé JWT', desc: 'Sessions chiffrées et rôles granulaires' },
                { icon: '✦', title: 'Éditeur GrapesJS', desc: 'Créez vos pages sans coder' },
              ].map((f) => (
                <div key={f.title} className={styles.featRow} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className={styles.featIcon} style={{
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

            <div className={styles.authLeftStats} style={{ display: 'flex', gap: '20px', marginTop: '1.6rem', position: 'relative', zIndex: 1 }}>
              {[['54', 'pays'], ['35+', "ans d'exp."], ['100+', 'projets']].map(([v, l]) => (
                <div key={l}>
                  <p style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: '18px', fontWeight: 800, color: accent, lineHeight: 1 }}>{v}</p>
                  <p style={{ fontSize: '9.5px', color: descColor, letterSpacing: '.8px', marginTop: '2px', textTransform: 'uppercase' }}>{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Panel Droit ── */}
          <div className={styles.authRight} style={{ flex: 1, minWidth: 0, padding: '2rem 2.2rem 1.4rem', background: rightBg }}>

            {/* Tabs */}
            <div role="tablist" aria-label="Connexion ou inscription" style={{ display: 'flex', background: dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.05)', borderRadius: '13px', padding: '3px', marginBottom: '1.2rem', border: `1px solid ${dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)'}`, position: 'relative' }}>
              <div style={{
                position: 'absolute', top: '3px', bottom: '3px',
                width: 'calc(50% - 3px)', borderRadius: '10px',
                background: `linear-gradient(135deg,${accent} 0%,${accentStrong} 100%)`,
                transition: 'left .32s cubic-bezier(.22,1,.36,1)',
                left: tab === 'login' ? '3px' : 'calc(50%)',
                boxShadow: `0 2px 16px ${glow}`,
              }} />
              {(['login', 'register'] as Tab[]).map(t => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => switchTab(t)}
                  style={{
                    flex: 1, minHeight: '44px', padding: '9px 8px', borderRadius: '10px', border: 'none',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    fontFamily: 'inherit', background: 'none',
                    color: tab === t ? '#fff' : tabInactive,
                    position: 'relative', zIndex: 1, transition: 'color .2s',
                    letterSpacing: '.2px',
                  }}
                >
                  {t === 'login' ? 'Connexion' : 'Inscription'}
                </button>
              ))}
            </div>

            {gmsg && (
              <div role="status" style={{
                fontSize: '12.5px', padding: '10px 14px', borderRadius: '10px',
                marginBottom: '1.25rem',
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
              <form onSubmit={handleLogin}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.1rem', gap: '3px' }}>
                  <Image src={logo} alt="MD2i" style={{ height: 34, width: 'auto', opacity: dark ? 0.9 : 1 }} />
                  <p style={{ fontSize: '11px', color: dark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.34)', letterSpacing: '.5px' }}>Connectez-vous à votre espace</p>
                </div>
                <Field label="Adresse email" type="email" placeholder="admin@md2i.com"
                  value={lEmail} onChange={v => { setLEmail(v); setLErr(p => ({ ...p, email: '' })) }}
                  error={lErr.email} dark={dark} />
                <Field label="Mot de passe" type="password" placeholder="••••••••"
                  value={lPass} onChange={v => { setLPass(v); setLErr(p => ({ ...p, pass: '' })) }}
                  error={lErr.pass} dark={dark} />
                <button type="submit" disabled={loading} className={`publicBtnPrimary ${styles.authBtn}`} style={{ width: '100%', marginTop: '.4rem', position: 'relative', overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent)', animation: `${styles.shine ?? 'shine'} 2.8s ease-in-out infinite` }} />
                  {loading && <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,.22)', borderTopColor: '#fff', borderRadius: '50%', animation: `${styles.spin ?? 'spin'} .6s linear infinite` }} />}
                  <span>{loading ? 'Connexion en cours…' : 'Se connecter'}</span>
                  {!loading && <span style={{ fontSize: '16px' }}>→</span>}
                </button>
                <p style={{ textAlign: 'center', fontSize: '12px', color: footColor, marginTop: '.8rem' }}>
                  Pas de compte ?{' '}
                  <button type="button" onClick={() => switchTab('register')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,159,39,.85)', textDecoration: 'none', fontWeight: 600, fontFamily: 'inherit', fontSize: 'inherit', padding: '4px 2px' }}>
                    S'inscrire
                  </button>
                </p>
              </form>
            )}

            {/* ── REGISTER ── */}
            {tab === 'register' && (
              <form onSubmit={handleRegister}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.1rem', gap: '3px' }}>
                  <Image src={logo} alt="MD2i" style={{ height: 34, width: 'auto', opacity: dark ? 0.9 : 1 }} />
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
                <button type="submit" disabled={loading} className={`publicBtnPrimary ${styles.authBtn}`} style={{ width: '100%', marginTop: '.4rem', position: 'relative', overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', top: 0, left: '-110%', width: '55%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent)', animation: `${styles.shine ?? 'shine'} 2.8s ease-in-out infinite` }} />
                  {loading && <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,.22)', borderTopColor: '#fff', borderRadius: '50%', animation: `${styles.spin ?? 'spin'} .6s linear infinite` }} />}
                  <span>{loading ? 'Création du compte…' : 'Créer mon compte'}</span>
                  {!loading && <span style={{ fontSize: '16px' }}>→</span>}
                </button>
                <p style={{ textAlign: 'center', fontSize: '12px', color: footColor, marginTop: '.8rem' }}>
                  Déjà un compte ?{' '}
                  <button type="button" onClick={() => switchTab('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,159,39,.85)', textDecoration: 'none', fontWeight: 600, fontFamily: 'inherit', fontSize: 'inherit', padding: '4px 2px' }}>
                    Se connecter
                  </button>
                </p>
              </form>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1rem' }}>
              <div style={{ flex: 1, height: '1px', background: dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(239,159,39,.5)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span style={{ fontSize: '10px', color: dark ? 'rgba(255,255,255,.24)' : 'rgba(0,0,0,.3)', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>JWT · MD2i © {new Date().getFullYear()}</span>
              </div>
              <div style={{ flex: 1, height: '1px', background: dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)' }} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
