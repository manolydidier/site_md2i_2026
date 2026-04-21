'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '@/app/context/ThemeContext'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
}

type RibbonTab = 'home' | 'insert' | 'layout'

const FONT_FAMILIES = [
  { label: 'Calibri', value: 'Calibri, Arial, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
]

const FONT_SIZES = [
  { label: '10', value: '2' },
  { label: '12', value: '3' },
  { label: '14', value: '4' },
  { label: '18', value: '5' },
  { label: '24', value: '6' },
  { label: '32', value: '7' },
]

/* ── SVG icon set ─────────────────────────────────────────────────────────── */
const Icon = {
  undo: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 6.5a4.5 4.5 0 1 0 1.17-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M2 3.5v3h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  redo: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12 6.5a4.5 4.5 0 1 1-1.17-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M12 3.5v3H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  clear: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4.5h8M5.5 4.5v5.5M9 10l2.5 2.5M11.5 10L9 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  bold: () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M3.5 3h3.5a2.5 2.5 0 0 1 0 5H3.5V3zM3.5 8h4a2.5 2.5 0 0 1 0 5h-4V8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  italic: () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5.5 3h4M3.5 13h4M7.5 3 5 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  underline: () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M3.5 3v4a3 3 0 0 0 6 0V3M2.5 12h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  strike: () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 7h9M5 5.5c0-1.1.9-2 2-2s2 .9 2 2M8 9c0 1.1-.9 2-2 2s-2-.9-2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  ul: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="2.5" cy="4" r="1.1" fill="currentColor"/><circle cx="2.5" cy="7" r="1.1" fill="currentColor"/><circle cx="2.5" cy="10" r="1.1" fill="currentColor"/><path d="M5 4h7M5 7h7M5 10h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  ol: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 3h1.5v4M1.5 7h2M1.5 9.5h.5a1 1 0 0 1 0 2c-.3 0-.5-.1-.5-.1v.1c0 .1.2.3.8.5H1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 4h7M5.5 7h7M5.5 10h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  outdent: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 7h7M2 10h10M4.5 5.5 2 7l2.5 1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  indent: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M7 7h5M2 10h10M2 5.5 4.5 7 2 8.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  alignL: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M2 7h6M2 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  alignC: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M2 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  alignR: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M6 7h6M2 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  alignJ: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M2 7h10M2 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  link: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M6 9a3 3 0 0 0 4.5 0L12 7.5a3 3 0 0 0-4.5-4L6.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M8 5a3 3 0 0 0-4.5 0L2 6.5a3 3 0 0 0 4.5 4L7.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  unlink: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 4.5 8.5 3a3 3 0 0 1 4.5 4L11 8.5M7 9.5 5.5 11a3 3 0 0 1-4.5-4L2.5 5.5M3 3l8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  img: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.25"/><circle cx="5" cy="6" r="1" fill="currentColor"/><path d="M2 9.5l3-2.5 2 2 2-2L12 10" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/></svg>,
  upload: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 9.5v1.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9.5M7 2v7M4.5 4.5 7 2l2.5 2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  table: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.25"/><path d="M2 6h10M7 6v5" stroke="currentColor" strokeWidth="1.25"/></svg>,
  hr: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M4 5l-2 2 2 2M10 5l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  expand: () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 2H11v2.5M5 11H2.5V8.5M11 8.5V11H8.5M2.5 5V2.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  collapse: () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9.5 3.5 11 2M2 11l1.5-1.5M11 9.5l-1.5-1.5M3.5 3.5 2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M8 5h2.5M8 5V2.5M5 8H2.5M5 8v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  check: () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3.5 3.5L11 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close: () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 2.5l8 8M10.5 2.5l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  file: () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M3 2h4.5l3 3V11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2"/><path d="M7.5 2v3H10.5M4.5 7h4M4.5 9h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  pen: () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 1.5l2.5 2.5L4 11.5H1.5V9L9 1.5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/></svg>,
  quote: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5c0 1.7 1.3 3 3 3v3H2V8a6 6 0 0 1 6-6V4a3 3 0 0 0-5 0zM9 5c0 1.7 1.3 3 3 3v3H8V8a6 6 0 0 1 6-6V4a3 3 0 0 0-5 0z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  code: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 4.5 2 7l3 2.5M9 4.5l3 2.5-3 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

/* ── Divider ─────────────────────────────────────────────────────────────── */
function Divider({ dark }: { dark: boolean }) {
  return (
    <div style={{
      width: 1,
      alignSelf: 'stretch',
      margin: '7px 2px',
      background: dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.09)',
    }} />
  )
}

/* ── Toolbar group ───────────────────────────────────────────────────────── */
function Group({
  title,
  children,
  dark,
}: {
  title: string
  children: React.ReactNode
  dark: boolean
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      padding: '6px 10px 4px',
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
      <span style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        color: dark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)',
        userSelect: 'none',
        marginTop: 2,
      }}>
        {title}
      </span>
    </div>
  )
}

/* ── Sidebar field ───────────────────────────────────────────────────────── */
function SideField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        color: 'rgba(120,110,100,.7)',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Commencez à écrire…',
  minHeight = 240,
}: RichTextEditorProps) {
  const { dark } = useTheme()

  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isInternalChange = useRef(false)

  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [fullScreen, setFullScreen] = useState(false)
  const [activeTab, setActiveTab] = useState<RibbonTab>('home')
  const [saved, setSaved] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [draftValue, setDraftValue] = useState(value || '')
  const [initialValue, setInitialValue] = useState(value || '')
  const [docTitle, setDocTitle] = useState('Sans titre')
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].value)
  const [fontSize, setFontSize] = useState('4')
  const [textColor, setTextColor] = useState('#111111')
  const [highlightColor, setHighlightColor] = useState('#fef08a')
  const [pageWidth, setPageWidth] = useState(820)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [pagePadding, setPagePadding] = useState(40)

  /* ── design tokens ──────────────────────────────────────────────────────── */
  const tk = {
    appBg:       dark ? '#0c1118' : '#eaecf0',
    modalBg:     dark ? '#111827' : '#ffffff',
    topBg:       dark ? '#0f1623' : '#ffffff',
    ribbonBg:    dark ? '#141e2c' : '#f5f7fa',
    sidebarBg:   dark ? '#101724' : '#f9fafb',
    pageBg:      '#ffffff',
    pageText:    '#1c1917',
    border:      dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.09)',
    borderMed:   dark ? 'rgba(255,255,255,.11)' : 'rgba(0,0,0,.13)',
    text:        dark ? '#f0ece6' : '#111827',
    soft:        dark ? 'rgba(240,236,230,.55)' : 'rgba(17,24,39,.52)',
    muted:       dark ? 'rgba(240,236,230,.3)' : 'rgba(17,24,39,.3)',
    accent:      '#f59e0b',
    accentHover: '#d97706',
    accentBg:    'rgba(245,158,11,.12)',
    accentBord:  'rgba(245,158,11,.25)',
    btnBg:       dark ? 'rgba(255,255,255,.045)' : '#ffffff',
    overlay:     dark ? 'rgba(2,4,16,.72)' : 'rgba(15,23,42,.5)',
    green:       '#10b981',
  }

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!isOpen) {
      setDraftValue(value || '')
      setInitialValue(value || '')
    }
  }, [value, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel()
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, draftValue])

  useEffect(() => {
    if (isOpen && editorRef.current && editorRef.current.innerHTML !== draftValue && !isInternalChange.current) {
      editorRef.current.innerHTML = draftValue || ''
    }
    isInternalChange.current = false
  }, [draftValue, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => editorRef.current?.focus(), 40)
    return () => clearTimeout(t)
  }, [isOpen])

  const previewText = useMemo(() => {
    if (typeof document === 'undefined') return ''
    const d = document.createElement('div')
    d.innerHTML = value || ''
    return (d.textContent || d.innerText || '').trim()
  }, [value])

  const stats = useMemo(() => {
    if (typeof document === 'undefined') return { words: 0, chars: 0 }
    const d = document.createElement('div')
    d.innerHTML = draftValue || ''
    const text = (d.textContent || d.innerText || '').trim()
    return { chars: text.length, words: text ? text.split(/\s+/).length : 0 }
  }, [draftValue])

  const focusEditor = () => editorRef.current?.focus()
  const handleInput = () => {
    if (!editorRef.current) return
    isInternalChange.current = true
    setDraftValue(editorRef.current.innerHTML)
    setSaved(false)
  }

  const exec = (cmd: string, val?: string) => {
    focusEditor(); document.execCommand(cmd, false, val); handleInput()
  }
  const formatBlock = (tag: 'P' | 'H1' | 'H2' | 'H3' | 'BLOCKQUOTE' | 'PRE') => {
    focusEditor(); document.execCommand('formatBlock', false, tag); handleInput()
  }
  const applyTextColor = (c: string) => {
    setTextColor(c); focusEditor()
    document.execCommand('styleWithCSS', false, 'true')
    document.execCommand('foreColor', false, c); handleInput()
  }
  const applyHighlightColor = (c: string) => {
    setHighlightColor(c); focusEditor()
    document.execCommand('styleWithCSS', false, 'true')
    document.execCommand('hiliteColor', false, c); handleInput()
  }
  const handleCreateLink = () => {
    focusEditor()
    const url = window.prompt("URL du lien", 'https://')
    if (!url) return
    document.execCommand('createLink', false, url); handleInput()
  }
  const handleInsertImageUrl = () => {
    focusEditor()
    const url = window.prompt("URL de l'image", 'https://')
    if (!url) return
    document.execCommand('insertImage', false, url); handleInput()
  }
  const handleLocalImage = (file?: File | null) => {
    if (!file) return
    const r = new FileReader()
    r.onload = () => {
      focusEditor()
      document.execCommand('insertImage', false, String(r.result)); handleInput()
    }
    r.readAsDataURL(file)
  }
  const handleInsertTable = () => {
    const ri = window.prompt('Lignes', '3'), ci = window.prompt('Colonnes', '3')
    if (!ri || !ci) return
    const rows = Math.max(1, Number(ri)), cols = Math.max(1, Number(ci))
    if (!Number.isFinite(rows) || !Number.isFinite(cols)) return
    const html = `<table class="rte-table"><tbody>${Array.from({length:rows}).map(()=>`<tr>${Array.from({length:cols}).map(()=>'<td>&nbsp;</td>').join('')}</tr>`).join('')}</tbody></table><p></p>`
    focusEditor(); document.execCommand('insertHTML', false, html); handleInput()
  }
  const openEditor = () => {
    setDraftValue(value || ''); setInitialValue(value || ''); setSaved(false); setIsOpen(true)
  }
  const handleCancel = () => { setDraftValue(initialValue || ''); setIsOpen(false); setFullScreen(false) }
  const handleSave = () => {
    const html = editorRef.current?.innerHTML || draftValue || ''
    onChange(html); setInitialValue(html); setDraftValue(html); setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }
  const handleApply = () => {
    const html = editorRef.current?.innerHTML || draftValue || ''
    onChange(html); setInitialValue(html); setDraftValue(html); setIsOpen(false); setFullScreen(false)
  }

  /* ── shared styles ──────────────────────────────────────────────────────── */
  const btn: React.CSSProperties = {
    height: 28,
    minWidth: 28,
    padding: '0 7px',
    borderRadius: 6,
    border: `1px solid ${tk.border}`,
    background: tk.btnBg,
    color: tk.text,
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexShrink: 0,
    transition: 'background .1s, border-color .1s',
  }

  const accentBtn: React.CSSProperties = {
    ...btn,
    background: tk.accent,
    color: '#fff',
    border: 'none',
    fontWeight: 600,
    padding: '0 12px',
    height: 30,
  }

  const ghostBtn: React.CSSProperties = {
    ...btn,
    height: 30,
    padding: '0 12px',
  }

  const sel: React.CSSProperties = {
    height: 28,
    borderRadius: 6,
    border: `1px solid ${tk.border}`,
    background: tk.btnBg,
    color: tk.text,
    padding: '0 7px',
    fontSize: 12,
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
  }

  const tabBtn = (active: boolean): React.CSSProperties => ({
    height: 30,
    padding: '0 12px',
    borderRadius: 7,
    border: active ? `1.5px solid ${tk.accentBord}` : '1.5px solid transparent',
    background: active ? tk.accentBg : 'transparent',
    color: active ? tk.accent : tk.soft,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: active ? 700 : 600,
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'all .12s',
  })

  /* ── Ribbon content ─────────────────────────────────────────────────────── */
  const renderRibbon = () => {
    if (activeTab === 'home') return (
      <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 'max-content', height: 62 }}>
        <Group title="Historique" dark={dark}>
          <button style={btn} onClick={() => exec('undo')}><Icon.undo /></button>
          <button style={btn} onClick={() => exec('redo')}><Icon.redo /></button>
          <button style={btn} onClick={() => exec('removeFormat')}><Icon.clear /></button>
        </Group>
        <Divider dark={dark} />
        <Group title="Styles" dark={dark}>
          <button style={{ ...btn, fontWeight: 400, fontSize: 11 }} onClick={() => formatBlock('P')}>P</button>
          <button style={{ ...btn, fontWeight: 800, fontSize: 11 }} onClick={() => formatBlock('H1')}>H1</button>
          <button style={{ ...btn, fontWeight: 800, fontSize: 11 }} onClick={() => formatBlock('H2')}>H2</button>
          <button style={{ ...btn, fontWeight: 800, fontSize: 11 }} onClick={() => formatBlock('H3')}>H3</button>
          <button style={btn} onClick={() => formatBlock('BLOCKQUOTE')}><Icon.quote /></button>
          <button style={btn} onClick={() => formatBlock('PRE')}><Icon.code /></button>
        </Group>
        <Divider dark={dark} />
        <Group title="Police" dark={dark}>
          <select value={fontFamily} onChange={e => { setFontFamily(e.target.value); exec('fontName', e.target.value) }} style={{ ...sel, minWidth: 118 }}>
            {FONT_FAMILIES.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
          </select>
          <select value={fontSize} onChange={e => { setFontSize(e.target.value); exec('fontSize', e.target.value) }} style={{ ...sel, minWidth: 60 }}>
            {FONT_SIZES.map(f => <option key={f.label} value={f.value}>{f.label}px</option>)}
          </select>
          <button style={btn} onClick={() => exec('bold')}><Icon.bold /></button>
          <button style={btn} onClick={() => exec('italic')}><Icon.italic /></button>
          <button style={btn} onClick={() => exec('underline')}><Icon.underline /></button>
          <button style={btn} onClick={() => exec('strikeThrough')}><Icon.strike /></button>
        </Group>
        <Divider dark={dark} />
        <Group title="Couleurs" dark={dark}>
          <label style={{ ...btn, cursor: 'pointer', gap: 6, padding: '0 8px', position: 'relative' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: textColor }}>A</span>
            <span style={{ width: 11, height: 3, borderRadius: 2, background: textColor, display: 'block' }} />
            <input type="color" value={textColor} onChange={e => applyTextColor(e.target.value)}
              style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }} />
          </label>
          <label style={{ ...btn, cursor: 'pointer', gap: 6, padding: '0 8px', position: 'relative' }}>
            <span style={{ fontSize: 11 }}>ab</span>
            <span style={{ width: 11, height: 3, borderRadius: 2, background: highlightColor, border: '1px solid rgba(0,0,0,.1)', display: 'block' }} />
            <input type="color" value={highlightColor} onChange={e => applyHighlightColor(e.target.value)}
              style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }} />
          </label>
        </Group>
        <Divider dark={dark} />
        <Group title="Paragraphe" dark={dark}>
          <button style={btn} onClick={() => exec('insertUnorderedList')}><Icon.ul /></button>
          <button style={btn} onClick={() => exec('insertOrderedList')}><Icon.ol /></button>
          <button style={btn} onClick={() => exec('outdent')}><Icon.outdent /></button>
          <button style={btn} onClick={() => exec('indent')}><Icon.indent /></button>
          <button style={btn} onClick={() => exec('justifyLeft')}><Icon.alignL /></button>
          <button style={btn} onClick={() => exec('justifyCenter')}><Icon.alignC /></button>
          <button style={btn} onClick={() => exec('justifyRight')}><Icon.alignR /></button>
          <button style={btn} onClick={() => exec('justifyFull')}><Icon.alignJ /></button>
        </Group>
      </div>
    )

    if (activeTab === 'insert') return (
      <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 'max-content', height: 62 }}>
        <Group title="Liens" dark={dark}>
          <button style={btn} onClick={handleCreateLink}><Icon.link /></button>
          <button style={btn} onClick={() => exec('unlink')}><Icon.unlink /></button>
        </Group>
        <Divider dark={dark} />
        <Group title="Images" dark={dark}>
          <button style={{ ...btn, gap: 5, padding: '0 9px' }} onClick={handleInsertImageUrl}>
            <Icon.img /> <span style={{ fontSize: 11 }}>URL</span>
          </button>
          <button style={{ ...btn, gap: 5, padding: '0 9px' }} onClick={() => fileInputRef.current?.click()}>
            <Icon.upload /> <span style={{ fontSize: 11 }}>Fichier</span>
          </button>
        </Group>
        <Divider dark={dark} />
        <Group title="Objets" dark={dark}>
          <button style={{ ...btn, gap: 5, padding: '0 9px' }} onClick={handleInsertTable}>
            <Icon.table /> <span style={{ fontSize: 11 }}>Tableau</span>
          </button>
          <button style={btn} onClick={() => exec('insertHorizontalRule')}><Icon.hr /></button>
        </Group>
      </div>
    )

    /* layout tab */
    return (
      <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 'max-content', height: 62 }}>
        <Group title="Page" dark={dark}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: tk.soft, minWidth: 44 }}>Largeur</span>
              <input type="range" min={700} max={1100} value={pageWidth} onChange={e => setPageWidth(Number(e.target.value))} style={{ width: 100 }} />
              <span style={{ fontSize: 10, color: tk.muted, minWidth: 32 }}>{pageWidth}px</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: tk.soft, minWidth: 44 }}>Marges</span>
              <input type="range" min={20} max={80} value={pagePadding} onChange={e => setPagePadding(Number(e.target.value))} style={{ width: 100 }} />
              <span style={{ fontSize: 10, color: tk.muted, minWidth: 32 }}>{pagePadding}px</span>
            </div>
          </div>
        </Group>
        <Divider dark={dark} />
        <Group title="Lecture" dark={dark}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: tk.soft, minWidth: 52 }}>Interligne</span>
            <input type="range" min={1.2} max={2.2} step={0.05} value={lineHeight} onChange={e => setLineHeight(Number(e.target.value))} style={{ width: 90 }} />
            <span style={{ fontSize: 10, color: tk.muted, minWidth: 28 }}>{lineHeight.toFixed(1)}</span>
          </div>
        </Group>
        <Divider dark={dark} />
        <Group title="Affichage" dark={dark}>
          <button style={{ ...btn, gap: 5, padding: '0 10px' }} onClick={() => setFullScreen(v => !v)}>
            {fullScreen ? <><Icon.collapse /> Réduire</> : <><Icon.expand /> Plein écran</>}
          </button>
          <button style={{ ...btn, gap: 5, padding: '0 10px' }} onClick={() => setSidebarOpen(v => !v)}>
            {sidebarOpen ? 'Masquer' : 'Panneau'}
          </button>
        </Group>
      </div>
    )
  }

  const charCount = useMemo(() => {
    const d = typeof document !== 'undefined' ? document.createElement('div') : null
    if (!d) return 0
    d.innerHTML = value || ''
    return (d.textContent || d.innerText || '').trim().length
  }, [value])

  return (
    <>
      {/* ── Preview card ──────────────────────────────────────────────────── */}
      <div style={{
        border: `1px solid ${tk.borderMed}`,
        borderRadius: 14,
        overflow: 'hidden',
        background: dark ? '#0f1520' : '#fff',
        boxShadow: dark ? 'none' : '0 1px 6px rgba(0,0,0,.06)',
      }}>
        <div style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${tk.border}`,
          background: tk.topBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: tk.accent, display: 'flex' }}><Icon.file /></span>
            <span style={{ fontSize: 12, fontWeight: 600, color: tk.soft, letterSpacing: '.02em' }}>Éditeur de texte</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {charCount > 0 && <span style={{ fontSize: 11, color: tk.muted }}>{charCount} car.</span>}
            <button type="button" onClick={openEditor} style={{
              ...ghostBtn,
              background: tk.accentBg,
              border: `1px solid ${tk.accentBord}`,
              color: tk.accent,
              fontWeight: 600,
              gap: 5,
            }}>
              <Icon.pen /> Ouvrir
            </button>
          </div>
        </div>

        <div onClick={openEditor} style={{
          minHeight: Math.max(100, minHeight * 0.5),
          padding: '16px 18px',
          cursor: 'text',
          color: tk.text,
          fontSize: 13.5,
          lineHeight: 1.75,
          background: dark ? 'rgba(255,255,255,.012)' : '#fff',
        }}>
          {previewText
            ? <div dangerouslySetInnerHTML={{ __html: value }} style={{ pointerEvents: 'none' }} />
            : <span style={{ color: tk.muted, fontStyle: 'italic', fontSize: 13 }}>{placeholder}</span>}
        </div>
      </div>

      {/* ── Full modal ────────────────────────────────────────────────────── */}
      {mounted && isOpen && createPortal(
        <>
          <div onClick={handleCancel} style={{
            position: 'fixed', inset: 0,
            background: tk.overlay,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 9998,
          }} />

          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: fullScreen ? 0 : 14,
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              width: fullScreen ? '100vw' : 'min(1480px, 98vw)',
              height: fullScreen ? '100dvh' : 'min(95vh, 1000px)',
              background: tk.modalBg,
              border: fullScreen ? 'none' : `1px solid ${tk.borderMed}`,
              borderRadius: fullScreen ? 0 : 18,
              overflow: 'hidden',
              boxShadow: fullScreen ? 'none' : '0 40px 120px rgba(0,0,0,.38)',
              display: 'flex',
              flexDirection: 'column',
            }}>

              {/* ── Title bar */}
              <div style={{
                padding: '9px 14px',
                background: tk.topBg,
                borderBottom: `1px solid ${tk.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexShrink: 0,
              }}>
                {/* left: dot + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: tk.accent, flexShrink: 0, display: 'block',
                  }} />
                  <input
                    value={docTitle}
                    onChange={e => setDocTitle(e.target.value)}
                    style={{
                      border: 'none', background: 'transparent',
                      color: tk.text, fontSize: 13.5, fontWeight: 700,
                      outline: 'none', minWidth: 160, letterSpacing: '.01em',
                    }}
                  />
                </div>

                {/* center: tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {(['home', 'insert', 'layout'] as RibbonTab[]).map(tab => (
                    <button key={tab} style={tabBtn(activeTab === tab)} onClick={() => setActiveTab(tab)}>
                      {tab === 'home' ? 'Accueil' : tab === 'insert' ? 'Insertion' : 'Mise en page'}
                    </button>
                  ))}
                </div>

                {/* right: actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {saved && (
                    <span style={{ fontSize: 11.5, color: tk.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon.check /> Enregistré
                    </span>
                  )}
                  <button type="button" style={ghostBtn} onClick={() => setFullScreen(v => !v)}>
                    {fullScreen ? <Icon.collapse /> : <Icon.expand />}
                  </button>
                  <button type="button" style={ghostBtn} onClick={handleCancel}>
                    <Icon.close />
                    <span style={{ fontSize: 12, marginLeft: 3 }}>Annuler</span>
                  </button>
                  <button type="button" style={accentBtn} onClick={handleApply}>
                    <Icon.check />
                    <span style={{ fontSize: 12, marginLeft: 3 }}>Appliquer</span>
                  </button>
                </div>
              </div>

              {/* ── Ribbon */}
              <div style={{
                background: tk.ribbonBg,
                borderBottom: `1px solid ${tk.border}`,
                overflowX: 'auto',
                overflowY: 'hidden',
                flexShrink: 0,
              }}>
                {renderRibbon()}
              </div>

              {/* ── Body: sidebar + editor */}
              <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

                {/* Sidebar */}
                {sidebarOpen && (
                  <div style={{
                    width: 240,
                    borderRight: `1px solid ${tk.border}`,
                    background: tk.sidebarBg,
                    padding: '16px 14px',
                    overflowY: 'auto',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}>
                    <div style={{
                      fontSize: 9.5, fontWeight: 800, letterSpacing: '.12em',
                      textTransform: 'uppercase', color: tk.muted,
                    }}>
                      Propriétés
                    </div>

                    <SideField label="Titre">
                      <input
                        value={docTitle}
                        onChange={e => setDocTitle(e.target.value)}
                        style={{
                          width: '100%', height: 34, borderRadius: 8,
                          border: `1px solid ${tk.border}`,
                          background: dark ? 'rgba(255,255,255,.04)' : '#fff',
                          color: tk.text, padding: '0 10px', outline: 'none',
                          fontSize: 12, fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </SideField>

                    <SideField label="Largeur de page">
                      <input type="range" min={700} max={1100} value={pageWidth}
                        onChange={e => setPageWidth(Number(e.target.value))} style={{ width: '100%' }} />
                      <span style={{ fontSize: 11, color: tk.soft }}>{pageWidth}px</span>
                    </SideField>

                    <SideField label="Marges">
                      <input type="range" min={20} max={80} value={pagePadding}
                        onChange={e => setPagePadding(Number(e.target.value))} style={{ width: '100%' }} />
                      <span style={{ fontSize: 11, color: tk.soft }}>{pagePadding}px</span>
                    </SideField>

                    <SideField label="Interligne">
                      <input type="range" min={1.2} max={2.2} step={0.05} value={lineHeight}
                        onChange={e => setLineHeight(Number(e.target.value))} style={{ width: '100%' }} />
                      <span style={{ fontSize: 11, color: tk.soft }}>{lineHeight.toFixed(2)}</span>
                    </SideField>

                    <SideField label="Couleur du texte">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: textColor,
                          border: `1px solid ${tk.border}`, overflow: 'hidden', flexShrink: 0,
                          position: 'relative',
                        }}>
                          <input type="color" value={textColor} onChange={e => applyTextColor(e.target.value)}
                            style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none' }} />
                        </div>
                        <span style={{ fontSize: 11, color: tk.soft, fontFamily: 'monospace' }}>{textColor}</span>
                      </div>
                    </SideField>

                    <SideField label="Surlignage">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: highlightColor,
                          border: `1px solid ${tk.border}`, overflow: 'hidden', flexShrink: 0,
                          position: 'relative',
                        }}>
                          <input type="color" value={highlightColor} onChange={e => applyHighlightColor(e.target.value)}
                            style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none' }} />
                        </div>
                        <span style={{ fontSize: 11, color: tk.soft, fontFamily: 'monospace' }}>{highlightColor}</span>
                      </div>
                    </SideField>

                    {/* Stats card */}
                    <div style={{
                      borderRadius: 10,
                      border: `1px solid ${tk.border}`,
                      background: dark ? 'rgba(255,255,255,.03)' : '#ffffff',
                      padding: '12px 13px',
                      marginTop: 'auto',
                    }}>
                      <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: tk.muted, marginBottom: 10 }}>
                        Statistiques
                      </div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        {[
                          ['Mots', stats.words],
                          ['Caractères', stats.chars],
                        ].map(([label, val]) => (
                          <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: 11, color: tk.muted }}>{label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: tk.soft, fontVariantNumeric: 'tabular-nums' }}>{val}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <kbd style={{
                          fontSize: 10, background: dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)',
                          border: `1px solid ${tk.border}`, borderRadius: 4,
                          padding: '1px 5px', fontFamily: 'inherit', color: tk.muted,
                        }}>⌘S</kbd>
                        <span style={{ fontSize: 10.5, color: tk.muted }}>pour enregistrer</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Editor canvas */}
                <div style={{
                  flex: 1, minWidth: 0,
                  overflow: 'auto',
                  background: tk.appBg,
                  padding: '28px 18px 60px',
                }}>
                  <div style={{
                    width: `min(${pageWidth}px, 100%)`,
                    margin: '0 auto',
                    background: tk.pageBg,
                    borderRadius: 12,
                    boxShadow: dark
                      ? '0 0 0 1px rgba(255,255,255,.05), 0 24px 64px rgba(0,0,0,.45)'
                      : '0 0 0 1px rgba(0,0,0,.055), 0 8px 40px rgba(15,23,42,.09)',
                    overflow: 'hidden',
                  }}>
                    {/* doc header */}
                    <div style={{
                      padding: '10px 20px',
                      borderBottom: '1px solid rgba(0,0,0,.055)',
                      background: '#fafaf8',
                      display: 'flex', alignItems: 'center', gap: 7,
                    }}>
                      <span style={{ color: 'rgba(87,83,78,.4)', display: 'flex' }}><Icon.file /></span>
                      <span style={{ fontSize: 11.5, color: '#78716c', fontWeight: 600, letterSpacing: '.03em' }}>
                        {docTitle}
                      </span>
                    </div>

                    {/* editable */}
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={handleInput}
                      data-placeholder={placeholder}
                      style={{
                        minHeight,
                        padding: `${pagePadding}px ${pagePadding + 4}px ${pagePadding * 1.5}px`,
                        color: tk.pageText,
                        fontSize: 15,
                        lineHeight,
                        outline: 'none',
                        overflowWrap: 'anywhere',
                        fontFamily: fontFamily,
                      }}
                      dangerouslySetInnerHTML={{ __html: draftValue || '' }}
                    />
                  </div>
                </div>
              </div>

              {/* ── Status bar */}
              <div style={{
                padding: '7px 14px',
                borderTop: `1px solid ${tk.border}`,
                background: tk.topBg,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12, flexWrap: 'wrap', flexShrink: 0,
              }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, color: tk.muted }}>{stats.words} mots</span>
                  <span style={{ fontSize: 11.5, color: tk.muted }}>{stats.chars} car.</span>
                  <span style={{ fontSize: 11.5, color: tk.muted }}>
                    {fullScreen ? 'Plein écran' : 'Fenêtre'}
                    {sidebarOpen ? ' · Panneau visible' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" style={ghostBtn} onClick={handleCancel}>
                    <Icon.close />
                    <span style={{ fontSize: 12, marginLeft: 3 }}>Annuler</span>
                  </button>
                  <button type="button" style={accentBtn} onClick={handleApply}>
                    <Icon.check />
                    <span style={{ fontSize: 12, marginLeft: 3 }}>Appliquer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" hidden
            onChange={e => handleLocalImage(e.target.files?.[0] || null)} />

          <style>{`
            [contenteditable="true"]:empty:before {
              content: attr(data-placeholder);
              color: rgba(87,83,78,.35);
              pointer-events: none;
              font-style: italic;
            }
            [contenteditable="true"] h1 {
              font-size: 2rem; line-height: 1.2; margin: 0 0 .8rem;
              font-weight: 800; letter-spacing: -.025em;
            }
            [contenteditable="true"] h2 {
              font-size: 1.55rem; line-height: 1.25; margin: 0 0 .65rem;
              font-weight: 700; letter-spacing: -.018em;
            }
            [contenteditable="true"] h3 {
              font-size: 1.2rem; line-height: 1.3; margin: 0 0 .5rem; font-weight: 700;
            }
            [contenteditable="true"] p { margin: 0 0 .75rem; }
            [contenteditable="true"] ul,
            [contenteditable="true"] ol { margin: 0 0 .75rem; padding-left: 1.4rem; }
            [contenteditable="true"] li { margin-bottom: .25rem; }
            [contenteditable="true"] blockquote {
              margin: 1rem 0; padding: 12px 18px;
              border-left: 3px solid #f59e0b;
              background: rgba(245,158,11,.05);
              border-radius: 0 8px 8px 0;
              font-style: italic; color: #57534e;
            }
            [contenteditable="true"] pre {
              margin: 1rem 0; padding: 14px 16px; border-radius: 10px;
              background: #f5f5f4; border: 1px solid rgba(0,0,0,.07);
              font-size: 13px; overflow-x: auto;
              font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            }
            [contenteditable="true"] a { color: #2563eb; text-decoration: underline; }
            [contenteditable="true"] img { max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 1rem 0; }
            [contenteditable="true"] hr { border: 0; border-top: 1px solid rgba(0,0,0,.1); margin: 1.5rem 0; }
            [contenteditable="true"] table.rte-table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
            [contenteditable="true"] table.rte-table td,
            [contenteditable="true"] table.rte-table th {
              border: 1px solid rgba(0,0,0,.11); padding: 8px 12px; min-width: 80px; vertical-align: top;
            }
            [contenteditable="true"] table.rte-table th { background: rgba(0,0,0,.025); font-weight: 600; }
            [contenteditable="true"] table.rte-table tr:hover td { background: rgba(0,0,0,.015); }
          `}</style>
        </>,
        document.body
      )}
    </>
  )
}