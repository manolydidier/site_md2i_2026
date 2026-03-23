'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useSidebar,SIDEBAR_W, SIDEBAR_COLLAPSED } from '../context/SidebarContext'

const ORANGE = '#EF9F27'
const ORANGE_DARK = '#c97d15'
export const ADMIN_SIDEBAR_WIDTH = 272
export const ADMIN_SIDEBAR_COLLAPSED_WIDTH = 68

const MENU_SECTIONS = [
  {
    title: 'Contenu',
    items: [
      {
        href: '/admin',
        label: 'Dashboard',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        ),
      },
      {
        href: '/admin/pages',
        label: 'Pages',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        ),
      },
      {
        href: '/admin/posts',
        label: 'Blog',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        ),
      },
      {
        href: '/admin/projects',
        label: 'Portfolio',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      {
        href: '/admin/products',
        label: 'Produits',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        href: '/admin/messages',
        label: 'Messages',
        badge: { label: '2', color: '#1D9E75' },
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
      {
        href: '/admin/users',
        label: 'Utilisateurs',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        href: '/admin/roles',
        label: 'Rôles',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Système',
    items: [
      {
        href: '/admin/audit',
        label: 'Audit',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        ),
      },
    ],
  },
] as const

type MenuItem = {
  href: string
  label: string
  icon: React.ReactNode
  badge?: {
    label: string
    color: string
  }
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { dark, toggleTheme } = useTheme()

  const [ddOpen, setDdOpen] = useState(false)

 const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar()
  const ddRef = useRef<HTMLDivElement>(null)

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD'

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setDdOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false)
        setDdOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setDdOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const c = {
    shell: dark ? '#0B0B0E' : '#FFFFFF',
    shellSoft: dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)',
    border: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)',
    text: dark ? '#F2EFEA' : '#181818',
    textSoft: dark ? 'rgba(255,255,255,.52)' : 'rgba(0,0,0,.52)',
    textMute: dark ? 'rgba(255,255,255,.30)' : 'rgba(0,0,0,.30)',
    hover: dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)',
    activeBg: dark ? 'rgba(239,159,39,.09)' : 'rgba(239,159,39,.09)',
    activeBorder: 'rgba(239,159,39,.25)',
    ddBg: dark ? '#131318' : '#FFFFFF',
    ddBorder: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)',
    iconBtn: dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)',
  }

  const sidebarW = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_W

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;400;500;600&display=swap');

        @keyframes adm-overlay-in { from{opacity:0} to{opacity:1} }
        @keyframes adm-drop-in { from{opacity:0;transform:translateY(-6px) scale(.98)} to{opacity:1;transform:none} }

        .adm-scroll::-webkit-scrollbar { width: 3px; }
        .adm-scroll::-webkit-scrollbar-thumb { background: rgba(239,159,39,.18); border-radius: 999px; }
        .adm-scroll::-webkit-scrollbar-track { background: transparent; }

        .adm-link { transition: background .15s, color .15s, border-color .15s, transform .15s; }
        .adm-link:hover { background: ${dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)'}; }

        .adm-btn { transition: background .15s, color .15s, border-color .15s; }
        .adm-btn:hover { background: ${dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)'} !important; color: ${dark ? '#F2EFEA' : '#181818'} !important; }

        .adm-dd-item { transition: background .13s; cursor: pointer; }
        .adm-dd-item:hover { background: ${dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)'} !important; }

        .adm-user-card { transition: background .15s, border-color .15s; cursor: pointer; }
        .adm-user-card:hover { background: ${dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'} !important; border-color: ${dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.10)'} !important; }

        .adm-tt-wrap { position: relative; }
        .adm-tt {
          position: absolute; left: calc(100% + 10px); top: 50%;
          transform: translateY(-50%) translateX(-4px);
          background: ${dark ? '#1c1c22' : '#ffffff'};
          color: ${c.text}; border: 1px solid ${c.border};
          border-radius: 9px; padding: 5px 11px;
          font-size: 12px; font-weight: 500; white-space: nowrap;
          pointer-events: none; opacity: 0;
          transition: opacity .15s, transform .15s;
          z-index: 300;
          box-shadow: ${dark ? '0 6px 20px rgba(0,0,0,.35)' : '0 4px 14px rgba(0,0,0,.10)'};
          font-family: 'DM Sans', sans-serif;
        }
        .adm-tt-wrap:hover .adm-tt { opacity: 1; transform: translateY(-50%) translateX(0); }

        .adm-collapse-btn {
          position: absolute; top: 68px; right: -13px;
          width: 26px; height: 26px; border-radius: 50%;
          background: ${dark ? '#1a1a20' : '#ffffff'};
          border: 1.5px solid ${c.border};
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: ${c.textSoft};
          transition: background .18s, border-color .18s, color .18s, transform .2s, box-shadow .2s;
          z-index: 10;
          box-shadow: ${dark ? '0 3px 12px rgba(0,0,0,.35)' : '0 2px 8px rgba(0,0,0,.10)'};
        }
        .adm-collapse-btn:hover {
          background: ${ORANGE} !important;
          border-color: ${ORANGE} !important;
          color: #fff !important;
          transform: scale(1.12);
          box-shadow: 0 4px 14px rgba(239,159,39,.35) !important;
        }

        @media (max-width: 980px) {
          .adm-topbar { display: flex !important; }
          .adm-overlay { display: block !important; }
          .adm-sidebar { transform: translateX(-110%) !important; }
          .adm-sidebar.open { transform: translateX(0) !important; }
          .adm-collapse-btn { display: none !important; }
        }
        @media (min-width: 981px) {
          .adm-topbar { display: none !important; }
          .adm-overlay { display: none !important; }
        }
      `}</style>

      <div className="adm-topbar" style={{
        position: 'sticky', top: 0, zIndex: 120, display: 'none',
        alignItems: 'center', justifyContent: 'space-between',
        height: 56, padding: '0 14px',
        background: c.shell, borderBottom: `1px solid ${c.border}`,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <button onClick={() => setMobileOpen(v => !v)} className="adm-btn" style={{
          width: 36, height: 36, borderRadius: 10,
          border: `1px solid ${mobileOpen ? 'rgba(239,159,39,.35)' : c.border}`,
          background: mobileOpen ? 'rgba(239,159,39,.08)' : c.iconBtn,
          color: mobileOpen ? ORANGE : c.textSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 15, height: 1.6, borderRadius: 999,
                background: mobileOpen ? ORANGE : c.textSoft, display: 'block',
                transition: 'transform .2s, opacity .15s',
                transform: mobileOpen ? (i === 0 ? 'translateY(4.6px) rotate(45deg)' : i === 2 ? 'translateY(-4.6px) rotate(-45deg)' : 'none') : 'none',
                opacity: mobileOpen && i === 1 ? 0 : 1,
              }} />
            ))}
          </div>
        </button>

        <Link href="/admin" onClick={() => setMobileOpen(false)} style={{
          textDecoration: 'none', fontFamily: "'Syne', sans-serif",
          fontWeight: 800, fontSize: 20, display: 'flex', gap: 1,
        }}>
          <span style={{ color: c.textSoft }}>MD</span>
          <span style={{ color: ORANGE }}>2</span>
          <span style={{ color: c.textSoft }}>i</span>
        </Link>

        <button onClick={toggleTheme} className="adm-btn" style={{
          width: 36, height: 36, borderRadius: 10,
          border: `1px solid ${c.border}`, background: c.iconBtn,
          color: c.textSoft, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer',
        }}>
          {dark
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>
      </div>

      <div className="adm-overlay" onClick={() => setMobileOpen(false)} style={{
        display: mobileOpen ? 'block' : 'none',
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.40)',
        zIndex: 118, backdropFilter: 'blur(3px)',
        animation: 'adm-overlay-in .2s ease',
      }} />

      <aside className={`adm-sidebar${mobileOpen ? ' open' : ''}`} style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: sidebarW, zIndex: 119,
        background: c.shell, borderRight: `1px solid ${c.border}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width .28s cubic-bezier(.22,1,.36,1), transform .28s cubic-bezier(.22,1,.36,1)',
        fontFamily: "'DM Sans', sans-serif",
        overflow: 'visible',
        boxShadow: mobileOpen ? '0 20px 60px rgba(0,0,0,.3)' : 'none',
      }}>
        <button
          className="adm-collapse-btn"
          onClick={() => { setCollapsed(v => !v); setDdOpen(false) }}
          title={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"
            style={{ transition: 'transform .28s cubic-bezier(.22,1,.36,1)', transform: collapsed ? 'rotate(180deg)' : 'none' }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div style={{
          height: 68, padding: '0 12px',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: `1px solid ${c.border}`, flexShrink: 0,
          overflow: 'hidden',
        }}>
          <Link href="/admin" onClick={() => setMobileOpen(false)} style={{
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 11,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(239,159,39,.18), rgba(239,159,39,.07))',
              border: '1.5px solid rgba(239,159,39,.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: dark ? '0 0 14px rgba(239,159,39,.12)' : 'none',
            }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 12, color: ORANGE }}>M2</span>
            </div>

            <div style={{
              overflow: 'hidden',
              maxWidth: collapsed ? 0 : 160,
              opacity: collapsed ? 0 : 1,
              transition: 'max-width .28s cubic-bezier(.22,1,.36,1), opacity .18s',
              whiteSpace: 'nowrap',
            }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: c.text, lineHeight: 1, letterSpacing: '-.03em' }}>
                MD<span style={{ color: ORANGE }}>2</span>i
              </div>
              <div style={{ fontSize: 10.5, color: c.textMute, marginTop: 3, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                Admin
              </div>
            </div>
          </Link>
        </div>

        <div className="adm-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'visible', padding: '12px 10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MENU_SECTIONS.map((section) => (
              <div key={section.title}>
                {!collapsed && (
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '.10em',
                      textTransform: 'uppercase',
                      color: c.textMute,
                      padding: '0 8px',
                      marginBottom: 7,
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: ORANGE, opacity: .7 }} />
                    {section.title}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {section.items.map((tab: MenuItem) => {
                    const isActive =
                      tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href)

                    return (
                      <div key={tab.href} className="adm-tt-wrap">
                        <Link
                          href={tab.href}
                          onClick={() => setMobileOpen(false)}
                          className="adm-link"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'space-between',
                            gap: 10,
                            padding: collapsed ? '11px 0' : '10px 10px',
                            borderRadius: 12,
                            textDecoration: 'none',
                            color: isActive ? c.text : c.textSoft,
                            background: isActive ? c.activeBg : 'transparent',
                            border: `1px solid ${isActive ? c.activeBorder : 'transparent'}`,
                            position: 'relative',
                          }}
                        >
                          {isActive && !collapsed && (
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: '22%',
                                bottom: '22%',
                                width: 3,
                                borderRadius: '0 3px 3px 0',
                                background: `linear-gradient(to bottom, ${ORANGE}, ${ORANGE_DARK})`,
                              }}
                            />
                          )}

                          <span style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                            <span
                              style={{
                                display: 'flex',
                                flexShrink: 0,
                                color: isActive ? ORANGE : c.textMute,
                                transition: 'color .15s',
                              }}
                            >
                              {tab.icon}
                            </span>

                            <span
                              style={{
                                maxWidth: collapsed ? 0 : 140,
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                opacity: collapsed ? 0 : 1,
                                transition: 'max-width .28s cubic-bezier(.22,1,.36,1), opacity .18s',
                                fontSize: 13.5,
                                fontWeight: isActive ? 600 : 400,
                              }}
                            >
                              {tab.label}
                            </span>
                          </span>

                          {!collapsed && tab.badge && (
                            <span
                              style={{
                                fontSize: 10,
                                padding: '2px 7px',
                                borderRadius: 999,
                                fontWeight: 700,
                                flexShrink: 0,
                                background: `${tab.badge.color}18`,
                                color: tab.badge.color,
                                border: `1px solid ${tab.badge.color}30`,
                              }}
                            >
                              {tab.badge.label}
                            </span>
                          )}
                        </Link>

                        {collapsed && <div className="adm-tt">{tab.label}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ margin: '14px 4px', height: 1, background: c.border }} />

          <div className="adm-tt-wrap" style={{ marginBottom: 4 }}>
            <Link href="/" target="_blank" className="adm-btn" style={{
              display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10, padding: collapsed ? '11px 0' : '10px 10px',
              borderRadius: 12, textDecoration: 'none',
              color: ORANGE, background: 'rgba(239,159,39,.07)',
              border: '1px solid rgba(239,159,39,.18)',
              fontSize: 13.5, fontWeight: 600,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span style={{ maxWidth: collapsed ? 0 : 120, overflow: 'hidden', whiteSpace: 'nowrap', opacity: collapsed ? 0 : 1, transition: 'max-width .28s cubic-bezier(.22,1,.36,1), opacity .18s' }}>
                Voir le site
              </span>
            </Link>
            {collapsed && <div className="adm-tt">Voir le site</div>}
          </div>

          <div className="adm-tt-wrap">
            <button onClick={toggleTheme} className="adm-btn" style={{
              display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10, padding: collapsed ? '11px 0' : '10px 10px',
              borderRadius: 12, border: `1px solid ${c.border}`,
              background: 'none', color: c.textSoft,
              cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
              fontFamily: 'inherit', width: '100%', textAlign: 'left',
            }}>
              {dark
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              }
              <span style={{ maxWidth: collapsed ? 0 : 120, overflow: 'hidden', whiteSpace: 'nowrap', opacity: collapsed ? 0 : 1, transition: 'max-width .28s cubic-bezier(.22,1,.36,1), opacity .18s' }}>
                {dark ? 'Mode clair' : 'Mode sombre'}
              </span>
            </button>
            {collapsed && <div className="adm-tt">{dark ? 'Mode clair' : 'Mode sombre'}</div>}
          </div>
        </div>

        <div ref={ddRef} style={{ padding: '10px', borderTop: `1px solid ${c.border}`, flexShrink: 0 }}>
          <div onClick={() => !collapsed && setDdOpen(v => !v)} className="adm-user-card" style={{
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 11, padding: collapsed ? '9px 0' : '10px 11px',
            borderRadius: 14, border: `1px solid ${c.border}`, background: c.shellSoft,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_DARK})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#fff',
              boxShadow: `0 3px 10px rgba(239,159,39,.28)`,
            }}>
              {initials}
            </div>

            <div style={{
              minWidth: 0, flex: 1,
              maxWidth: collapsed ? 0 : 160, overflow: 'hidden',
              opacity: collapsed ? 0 : 1,
              transition: 'max-width .28s cubic-bezier(.22,1,.36,1), opacity .18s',
            }}>
              <div style={{ color: c.text, fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session?.user?.name || 'Admin'}
              </div>
              <div style={{ color: c.textMute, fontSize: 11.5, marginTop: 2, whiteSpace: 'nowrap' }}>
                {session?.user?.email || 'Administrateur'}
              </div>
            </div>

            {!collapsed && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={c.textMute} strokeWidth="2.4"
                style={{ transition: 'transform .2s', transform: ddOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </div>

          {!collapsed && ddOpen && (
            <div style={{
              marginTop: 8, borderRadius: 14, padding: 6,
              background: c.ddBg, border: `1px solid ${c.ddBorder}`,
              boxShadow: dark ? '0 12px 36px rgba(0,0,0,.40)' : '0 8px 28px rgba(0,0,0,.10)',
              animation: 'adm-drop-in .18s cubic-bezier(.22,1,.36,1)',
            }}>
              {[
                { href: '/admin/profile', label: 'Mon profil', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
                { href: '/admin/settings', label: 'Paramètres', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> },
              ].map(item => (
                <Link key={item.href} href={item.href} className="adm-dd-item" style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 10,
                  textDecoration: 'none', color: c.text, fontSize: 13,
                }}>
                  <span style={{ color: c.textMute, display: 'flex' }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              <div style={{ height: 1, margin: '5px 4px', background: c.ddBorder }} />

              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="adm-dd-item"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 10,
                  color: '#e05a5a', background: 'none', border: 'none',
                  width: '100%', textAlign: 'left', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}