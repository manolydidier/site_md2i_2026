'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import api from '@/app/lib/axios'
import { useTheme } from '@/app/context/ThemeContext'
import {
  translateDynamicItems,
  translateGrapesComponents,
  translateHtmlContent,
} from '@/app/i18n/dynamic'
import { type Locale, normalizeLocale } from '@/app/i18n/settings'
import grapesjs, { Editor } from 'grapesjs'
import 'grapesjs/dist/css/grapes.min.css'

type Product = {
  id: string
  name: string
  slug: string
  excerpt?: string | null
  price?: number | string | null
  coverImage?: string | null
  images?: unknown
  publishedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  gjsHtml?: string | null
  gjsJs?: string | null
  gjsStyles?: unknown
  gjsComponents?: unknown
  category?: {
    id: string
    name: string
    slug?: string | null
  } | null
}

type CanvasEventHandlers = {
  preventDrag: (e: Event) => boolean
  preventContextMenu: (e: Event) => boolean
  preventSelectStart: (e: Event) => void
  preventCopy: (e: Event) => boolean | void
  preventPaste: (e: Event) => boolean | void
  handleAnchorClick: (e: Event) => void
}

type GrapesComponentInput = Parameters<Editor['setComponents']>[0]
type GrapesStyleInput = Parameters<Editor['setStyle']>[0]

type GrapesComponentNode = {
  set: (key: string, value: unknown) => void
  components?: () => {
    length: number
    forEach: (callback: (component: GrapesComponentNode) => void) => void
  }
}

type GrapesStyleReceiver = {
  addStyle: (style: Record<string, string>) => void
}

type ViewerDomComponents = {
  getType?: (type: string) => unknown
  addType: (type: string, definition: unknown) => void
}

type EditorWithEventHandlers = Editor & {
  __eventHandlers?: CanvasEventHandlers
}

type EditorWithOptionalHighlighter = Editor & {
  getHighlighter?: () => {
    remove: () => void
  }
}

function getUiColors(dark: boolean) {
  return {
    buttonBg: dark ? 'rgba(15, 23, 42, 0.78)' : 'rgba(255, 255, 255, 0.96)',
    buttonBgHover: dark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 1)',
    buttonText: dark ? '#fff7ed' : '#111827',
    buttonBorder: dark ? 'rgba(255, 226, 194, 0.13)' : 'rgba(15, 23, 42, 0.08)',
    buttonShadow: dark
      ? '0 24px 70px rgba(0,0,0,.42)'
      : '0 24px 70px rgba(15,23,42,.10)',

    panelBg: dark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.94)',
    panelBorder: dark ? 'rgba(255, 226, 194, 0.13)' : 'rgba(15, 23, 42, 0.08)',
    panelText: dark ? '#fff7ed' : '#111827',
    panelMuted: dark ? '#d8c3ab' : '#475569',

    appBg: dark ? '#020617' : '#f8fafc',

    pageBg: dark
      ? 'radial-gradient(circle at 12% 8%, rgba(239,159,39,.18), transparent 28rem), radial-gradient(circle at 88% 12%, rgba(255,190,107,.10), transparent 32rem), linear-gradient(180deg, #020617 0%, #07101f 42%, #020617 100%)'
      : 'radial-gradient(circle at 12% 8%, rgba(239,159,39,.10), transparent 26rem), radial-gradient(circle at 88% 12%, rgba(15,23,42,.04), transparent 30rem), linear-gradient(180deg, #ffffff 0%, #f8fafc 52%, #ffffff 100%)',

    cardBg: dark ? 'rgba(15, 23, 42, 0.86)' : 'rgba(255, 255, 255, 0.96)',
    cardBorder: dark ? 'rgba(255, 226, 194, 0.13)' : 'rgba(15, 23, 42, 0.08)',

    mutedText: dark ? '#d8c3ab' : '#64748b',

    accent1: '#ef9f27',
    accent2: '#f7c060',
    accent3: '#d9791f',
    accentSoft: dark ? 'rgba(239,159,39,.17)' : 'rgba(239,159,39,.10)',
    accentBorder: dark ? 'rgba(247,192,96,.36)' : 'rgba(239,159,39,.28)',
    accentGlow: '0 0 34px rgba(239,159,39,.16)',
    accentGlowStrong: '0 18px 42px rgba(239,159,39,.38)',
    primaryBg: 'linear-gradient(135deg, #d9791f, #f7c060)',
    primaryText: '#1d0d03',

    neutral1: dark ? '#ead7c0' : '#64748b',
    neutral2: dark ? '#94a3b8' : '#475569',

    text: dark ? '#fff7ed' : '#0f172a',
    textSoft: dark ? 'rgba(255,247,237,.76)' : 'rgba(15,23,42,.72)',
    textMuted: dark ? 'rgba(255,247,237,.52)' : 'rgba(15,23,42,.48)',

    line: dark ? 'rgba(255,226,194,.13)' : 'rgba(15,23,42,.08)',
    gridLine: dark ? 'rgba(255,226,194,.08)' : 'rgba(118,77,38,.08)',

    orangeSoft: dark ? 'rgba(239,159,39,.17)' : 'rgba(239,159,39,.08)',
    orangeBorder: dark ? 'rgba(247,192,96,.36)' : 'rgba(239,159,39,.28)',

    glassBg: dark
      ? 'linear-gradient(135deg, rgba(255,255,255,.10), rgba(255,255,255,.045))'
      : 'linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.84))',

    glassBorder: dark ? 'rgba(255,226,194,.14)' : 'rgba(15,23,42,.08)',

    heroBg: dark ? '#020617' : '#fff8ee',
    heroShape: 'rgba(239,159,39,.22)',
    heroImageFilter: `saturate(${dark ? '1.02' : '1.06'}) contrast(1.05)`,
    heroImageOpacity: dark ? '.74' : '.86',
    heroOverlay: dark
      ? 'linear-gradient(90deg, rgba(2,6,23,.92), rgba(2,6,23,.66), rgba(2,6,23,.22)), linear-gradient(180deg, rgba(2,6,23,.14), rgba(2,6,23,.94))'
      : 'linear-gradient(90deg, rgba(32,19,10,.72), rgba(32,19,10,.44), rgba(32,19,10,.10)), linear-gradient(180deg, rgba(255,248,238,.06), rgba(255,248,238,.92))',
    ambientGlow: dark
      ? 'radial-gradient(circle at 16% 10%, rgba(239,159,39,.20), transparent 30rem), radial-gradient(circle at 86% 18%, rgba(247,192,96,.12), transparent 34rem)'
      : 'radial-gradient(circle at 16% 10%, rgba(239,159,39,.20), transparent 30rem), radial-gradient(circle at 86% 18%, rgba(122,92,62,.10), transparent 34rem)',
    builderBg: dark ? '#020617' : '#ffffff',
    galleryBg: dark ? '#0b1220' : '#fffaf3',
    ctaBg: dark
      ? 'radial-gradient(circle at top right, rgba(239,159,39,.24), transparent 42%), #0f172a'
      : 'radial-gradient(circle at top right, rgba(239,159,39,.24), transparent 42%), #20130a',
    ctaBorder: 'rgba(255,255,255,.10)',
  }
}

type UiColors = ReturnType<typeof getUiColors>
type RgbColor = { r: number; g: number; b: number }

function stringifyThemeSource(value: unknown) {
  if (!value) return ''

  if (typeof value === 'string') {
    return value.slice(0, 30000)
  }

  try {
    return JSON.stringify(value).slice(0, 30000)
  } catch {
    return ''
  }
}

function getProductThemeSource(product: Product | null) {
  return [
    product?.slug,
    product?.name,
    product?.category?.slug,
    product?.category?.name,
    stringifyThemeSource(product?.gjsHtml),
    stringifyThemeSource(product?.gjsStyles),
    stringifyThemeSource(product?.gjsComponents),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function getProductThemeKey(product: Product | null) {
  const source = getProductThemeSource(product)

  if (
    source.includes('spm-page') ||
    source.includes('passation') ||
    source.includes('marches')
  ) {
    return 'procurement'
  }

  if (
    source.includes('sara-page') ||
    source.includes('sara-paie') ||
    source.includes('sara paie')
  ) {
    return 'sara'
  }

  return 'default'
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function toRgbColor(r: number, g: number, b: number): RgbColor {
  return {
    r: clampChannel(r),
    g: clampChannel(g),
    b: clampChannel(b),
  }
}

function expandHexColor(value: string) {
  if (value.length === 3 || value.length === 4) {
    return value
      .slice(0, 3)
      .split('')
      .map((part) => part + part)
      .join('')
  }

  return value.slice(0, 6)
}

function hexToRgb(value: string): RgbColor | null {
  const normalized = expandHexColor(value.replace('#', '').trim())

  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null

  return toRgbColor(
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  )
}

function channelToHex(value: number) {
  return clampChannel(value).toString(16).padStart(2, '0')
}

function rgbToHex(color: RgbColor) {
  return `#${channelToHex(color.r)}${channelToHex(color.g)}${channelToHex(
    color.b,
  )}`
}

function rgbToRgba(color: RgbColor, alpha: number) {
  return `rgba(${color.r},${color.g},${color.b},${alpha})`
}

function mixRgb(color: RgbColor, target: RgbColor, amount: number): RgbColor {
  return toRgbColor(
    color.r + (target.r - color.r) * amount,
    color.g + (target.g - color.g) * amount,
    color.b + (target.b - color.b) * amount,
  )
}

function getColorLuminance(color: RgbColor) {
  const transform = (channel: number) => {
    const value = channel / 255
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4)
  }

  return (
    transform(color.r) * 0.2126 +
    transform(color.g) * 0.7152 +
    transform(color.b) * 0.0722
  )
}

function getColorSaturation(color: RgbColor) {
  const max = Math.max(color.r, color.g, color.b)
  const min = Math.min(color.r, color.g, color.b)

  return max === 0 ? 0 : (max - min) / max
}

function isUsableAccentColor(color: RgbColor) {
  const max = Math.max(color.r, color.g, color.b)
  const min = Math.min(color.r, color.g, color.b)
  const luminance = getColorLuminance(color)
  const saturation = getColorSaturation(color)

  return (
    saturation >= 0.18 &&
    max >= 70 &&
    min <= 245 &&
    luminance >= 0.045 &&
    luminance <= 0.88
  )
}

function addWeightedColor(
  colors: Map<string, { color: RgbColor; score: number }>,
  color: RgbColor | null,
  weight: number,
) {
  if (!color || !isUsableAccentColor(color)) return

  const saturation = getColorSaturation(color)
  const luminance = getColorLuminance(color)
  const balance = luminance > 0.18 && luminance < 0.74 ? 1.35 : 0.9
  const score = weight * (1 + saturation * 3) * balance
  const key = rgbToHex(color)
  const current = colors.get(key)

  colors.set(key, {
    color,
    score: (current?.score ?? 0) + score,
  })
}

function extractProductAccentColor(product: Product | null): RgbColor | null {
  const source = getProductThemeSource(product)
  const colors = new Map<string, { color: RgbColor; score: number }>()

  const rgbRegex =
    /rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)/gi
  const hexRegex = /#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/gi

  let rgbMatch: RegExpExecArray | null
  while ((rgbMatch = rgbRegex.exec(source))) {
    const alpha =
      rgbMatch[4] === undefined ? 1 : Number.parseFloat(rgbMatch[4])
    const weight = Number.isFinite(alpha) && alpha < 0.2 ? 0.35 : 1

    addWeightedColor(
      colors,
      toRgbColor(
        Number.parseFloat(rgbMatch[1]),
        Number.parseFloat(rgbMatch[2]),
        Number.parseFloat(rgbMatch[3]),
      ),
      weight,
    )
  }

  let hexMatch: RegExpExecArray | null
  while ((hexMatch = hexRegex.exec(source))) {
    addWeightedColor(colors, hexToRgb(hexMatch[1]), 1)
  }

  return [...colors.values()].sort((a, b) => b.score - a.score)[0]?.color ?? null
}

function buildAdaptiveUiColors(
  base: UiColors,
  dark: boolean,
  accent: RgbColor,
): UiColors {
  const white = toRgbColor(255, 255, 255)
  const black = toRgbColor(0, 0, 0)
  const accentStrong = dark ? mixRgb(accent, white, 0.16) : mixRgb(accent, black, 0.08)
  const accentBright = dark ? mixRgb(accent, white, 0.34) : mixRgb(accent, white, 0.18)
  const accentDeep = dark ? mixRgb(accent, black, 0.32) : mixRgb(accent, black, 0.28)
  const shellDeep = mixRgb(accent, black, dark ? 0.9 : 0.84)
  const shellMid = mixRgb(accent, black, dark ? 0.82 : 0.7)
  const shellLight = mixRgb(accent, white, 0.9)
  const primaryMid = mixRgb(accent, black, dark ? 0.16 : 0.08)
  const primaryText = getColorLuminance(primaryMid) > 0.42 ? '#0f172a' : '#ffffff'

  return {
    ...base,
    buttonText: dark ? '#f8fafc' : '#0f172a',
    buttonBorder: dark ? rgbToRgba(accentBright, 0.18) : rgbToRgba(accent, 0.14),
    buttonShadow: dark
      ? '0 24px 70px rgba(0,0,0,.42)'
      : `0 24px 70px ${rgbToRgba(accentDeep, 0.13)}`,

    panelBg: dark ? rgbToRgba(shellMid, 0.76) : 'rgba(255, 255, 255, 0.94)',
    panelBorder: dark ? rgbToRgba(accentBright, 0.16) : rgbToRgba(accent, 0.13),
    panelText: dark ? '#f8fafc' : '#0f172a',
    panelMuted: dark ? rgbToHex(mixRgb(accentBright, white, 0.2)) : '#475569',

    appBg: dark ? rgbToHex(shellDeep) : rgbToHex(shellLight),
    pageBg: dark
      ? `radial-gradient(circle at 12% 8%, ${rgbToRgba(accent, 0.18)}, transparent 28rem), radial-gradient(circle at 86% 18%, ${rgbToRgba(accentBright, 0.1)}, transparent 32rem), linear-gradient(180deg, ${rgbToHex(shellDeep)} 0%, ${rgbToHex(shellMid)} 44%, ${rgbToHex(shellDeep)} 100%)`
      : `radial-gradient(circle at 12% 8%, ${rgbToRgba(accent, 0.12)}, transparent 26rem), radial-gradient(circle at 86% 18%, ${rgbToRgba(accentDeep, 0.08)}, transparent 30rem), linear-gradient(180deg, ${rgbToHex(shellLight)} 0%, #ffffff 52%, #f8fafc 100%)`,

    cardBg: dark ? rgbToRgba(shellMid, 0.86) : 'rgba(255, 255, 255, 0.96)',
    cardBorder: dark ? rgbToRgba(accentBright, 0.16) : rgbToRgba(accent, 0.14),
    mutedText: dark ? rgbToHex(mixRgb(accentBright, white, 0.16)) : '#64748b',

    accent1: rgbToHex(accentStrong),
    accent2: rgbToHex(accentBright),
    accent3: rgbToHex(accentDeep),
    accentSoft: dark ? rgbToRgba(accent, 0.17) : rgbToRgba(accent, 0.1),
    accentBorder: dark ? rgbToRgba(accentBright, 0.38) : rgbToRgba(accent, 0.26),
    accentGlow: `0 0 34px ${rgbToRgba(accent, 0.16)}`,
    accentGlowStrong: `0 18px 42px ${rgbToRgba(accentDeep, dark ? 0.36 : 0.28)}`,
    primaryBg: `linear-gradient(135deg, ${rgbToHex(primaryMid)}, ${rgbToHex(
      accentBright,
    )})`,
    primaryText,

    neutral1: dark ? rgbToHex(mixRgb(accentBright, white, 0.14)) : '#64748b',
    neutral2: dark ? rgbToHex(mixRgb(accentBright, white, 0.04)) : '#475569',

    text: dark ? '#f8fafc' : '#0f172a',
    textSoft: dark ? 'rgba(248,250,252,.76)' : 'rgba(15,23,42,.72)',
    textMuted: dark ? 'rgba(248,250,252,.52)' : 'rgba(15,23,42,.48)',

    line: dark ? rgbToRgba(accentBright, 0.16) : rgbToRgba(accent, 0.12),
    gridLine: dark ? rgbToRgba(accentBright, 0.08) : rgbToRgba(accent, 0.08),

    orangeSoft: dark ? rgbToRgba(accent, 0.17) : rgbToRgba(accent, 0.1),
    orangeBorder: dark ? rgbToRgba(accentBright, 0.38) : rgbToRgba(accent, 0.26),

    glassBg: dark
      ? `linear-gradient(135deg, ${rgbToRgba(accentBright, 0.1)}, rgba(255,255,255,.045))`
      : `linear-gradient(135deg, rgba(255,255,255,.96), ${rgbToRgba(
          shellLight,
          0.84,
        )})`,
    glassBorder: dark ? rgbToRgba(accentBright, 0.16) : rgbToRgba(accent, 0.12),

    heroBg: dark ? rgbToHex(shellDeep) : rgbToHex(shellLight),
    heroShape: `linear-gradient(135deg, ${rgbToRgba(accentBright, 0.3)}, ${rgbToRgba(
      accentDeep,
      0.16,
    )})`,
    heroImageFilter: `saturate(${dark ? '1.04' : '1.06'}) contrast(1.04) brightness(${dark ? '.84' : '.92'})`,
    heroImageOpacity: dark ? '.72' : '.84',
    heroOverlay: dark
      ? `linear-gradient(90deg, ${rgbToRgba(shellDeep, 0.94)}, ${rgbToRgba(shellMid, 0.68)}, ${rgbToRgba(shellMid, 0.24)}), linear-gradient(180deg, ${rgbToRgba(shellDeep, 0.12)}, ${rgbToRgba(shellDeep, 0.94)})`
      : `linear-gradient(90deg, ${rgbToRgba(shellDeep, 0.82)}, ${rgbToRgba(shellDeep, 0.52)}, ${rgbToRgba(shellDeep, 0.14)}), linear-gradient(180deg, ${rgbToRgba(shellLight, 0.04)}, ${rgbToRgba(shellLight, 0.94)})`,
    ambientGlow: dark
      ? `radial-gradient(circle at 16% 10%, ${rgbToRgba(accent, 0.2)}, transparent 30rem), radial-gradient(circle at 86% 18%, ${rgbToRgba(accentBright, 0.12)}, transparent 34rem)`
      : `radial-gradient(circle at 16% 10%, ${rgbToRgba(accent, 0.18)}, transparent 30rem), radial-gradient(circle at 86% 18%, ${rgbToRgba(accentDeep, 0.1)}, transparent 34rem)`,
    builderBg: dark ? rgbToHex(shellDeep) : rgbToHex(mixRgb(accent, white, 0.95)),
    galleryBg: dark ? rgbToHex(shellMid) : rgbToHex(shellLight),
    ctaBg: dark
      ? `radial-gradient(circle at top right, ${rgbToRgba(accent, 0.22)}, transparent 42%), linear-gradient(135deg, ${rgbToHex(shellDeep)}, ${rgbToHex(shellMid)})`
      : `radial-gradient(circle at top right, ${rgbToRgba(accent, 0.22)}, transparent 42%), linear-gradient(135deg, ${rgbToHex(shellDeep)}, ${rgbToHex(accentDeep)})`,
    ctaBorder: dark ? rgbToRgba(accentBright, 0.16) : 'rgba(255,255,255,.14)',
  }
}

function getProductUiColors(product: Product | null, dark: boolean): UiColors {
  const base = getUiColors(dark)
  const themeKey = getProductThemeKey(product)

  if (themeKey === 'procurement') {
    return {
      ...base,
      buttonText: dark ? '#f3fff8' : '#0f172a',
      buttonBorder: dark ? 'rgba(220,255,235,.15)' : 'rgba(8,122,67,.12)',
      buttonShadow: dark
        ? '0 24px 70px rgba(0,0,0,.42)'
        : '0 24px 70px rgba(8,122,67,.11)',

      panelBg: dark ? 'rgba(6, 17, 13, 0.78)' : 'rgba(255, 255, 255, 0.94)',
      panelBorder: dark ? 'rgba(220,255,235,.15)' : 'rgba(8,122,67,.12)',
      panelText: dark ? '#f3fff8' : '#0f172a',
      panelMuted: dark ? '#b7c8bd' : '#475569',

      appBg: dark ? '#020f0b' : '#f4fff8',
      pageBg: dark
        ? 'radial-gradient(circle at 12% 8%, rgba(53,242,143,.16), transparent 28rem), radial-gradient(circle at 86% 18%, rgba(34,211,238,.10), transparent 32rem), linear-gradient(180deg, #020f0b 0%, #061711 44%, #020f0b 100%)'
        : 'radial-gradient(circle at 12% 8%, rgba(53,242,143,.12), transparent 26rem), radial-gradient(circle at 86% 18%, rgba(8,122,67,.08), transparent 30rem), linear-gradient(180deg, #f4fff8 0%, #ffffff 52%, #f8fafc 100%)',

      cardBg: dark ? 'rgba(6, 17, 13, 0.86)' : 'rgba(255, 255, 255, 0.96)',
      cardBorder: dark ? 'rgba(220,255,235,.15)' : 'rgba(8,122,67,.14)',
      mutedText: dark ? '#b7c8bd' : '#64748b',

      accent1: '#087a43',
      accent2: '#35f28f',
      accent3: '#22d3ee',
      accentSoft: dark ? 'rgba(53,242,143,.16)' : 'rgba(8,122,67,.08)',
      accentBorder: dark ? 'rgba(53,242,143,.36)' : 'rgba(8,122,67,.22)',
      accentGlow: '0 0 34px rgba(53,242,143,.16)',
      accentGlowStrong: '0 18px 42px rgba(8,122,67,.30)',
      primaryBg: 'linear-gradient(135deg, #065f46, #087a43)',
      primaryText: '#f3fff8',

      neutral1: dark ? '#dcffeb' : '#64748b',
      neutral2: dark ? '#b7c8bd' : '#475569',

      text: dark ? '#f3fff8' : '#0f172a',
      textSoft: dark ? 'rgba(243,255,248,.76)' : 'rgba(15,23,42,.72)',
      textMuted: dark ? 'rgba(243,255,248,.52)' : 'rgba(15,23,42,.48)',

      line: dark ? 'rgba(220,255,235,.15)' : 'rgba(8,122,67,.12)',
      gridLine: dark ? 'rgba(220,255,235,.08)' : 'rgba(8,122,67,.08)',

      orangeSoft: dark ? 'rgba(53,242,143,.16)' : 'rgba(8,122,67,.08)',
      orangeBorder: dark ? 'rgba(53,242,143,.36)' : 'rgba(8,122,67,.22)',

      glassBg: dark
        ? 'linear-gradient(135deg, rgba(220,255,235,.10), rgba(220,255,235,.045))'
        : 'linear-gradient(135deg, rgba(255,255,255,.96), rgba(244,255,248,.84))',
      glassBorder: dark ? 'rgba(220,255,235,.15)' : 'rgba(8,122,67,.12)',

      heroBg: dark ? '#020f0b' : '#f4fff8',
      heroShape: 'linear-gradient(135deg, rgba(53,242,143,.26), rgba(34,211,238,.16))',
      heroImageFilter: `saturate(${dark ? '1.02' : '1.06'}) contrast(1.03)`,
      heroImageOpacity: dark ? '.70' : '.82',
      heroOverlay: dark
        ? 'linear-gradient(90deg, rgba(2,15,11,.94), rgba(6,23,17,.68), rgba(6,23,17,.24)), linear-gradient(180deg, rgba(2,15,11,.12), rgba(2,15,11,.94))'
        : 'linear-gradient(90deg, rgba(3,45,29,.88), rgba(3,45,29,.58), rgba(3,45,29,.16)), linear-gradient(180deg, rgba(244,255,248,.04), rgba(244,255,248,.94))',
      ambientGlow: dark
        ? 'radial-gradient(circle at 16% 10%, rgba(53,242,143,.18), transparent 30rem), radial-gradient(circle at 86% 18%, rgba(34,211,238,.12), transparent 34rem)'
        : 'radial-gradient(circle at 16% 10%, rgba(53,242,143,.18), transparent 30rem), radial-gradient(circle at 86% 18%, rgba(8,122,67,.10), transparent 34rem)',
      builderBg: dark ? '#020f0b' : '#f8fffb',
      galleryBg: dark ? '#061711' : '#f4fff8',
      ctaBg: dark
        ? 'radial-gradient(circle at top right, rgba(53,242,143,.22), transparent 42%), linear-gradient(135deg, #03130b, #064e3b)'
        : 'radial-gradient(circle at top right, rgba(53,242,143,.24), transparent 42%), linear-gradient(135deg, #032d1d, #087a43)',
      ctaBorder: dark ? 'rgba(220,255,235,.14)' : 'rgba(255,255,255,.14)',
    }
  }

  if (themeKey === 'sara') {
    return {
      ...base,
      buttonText: dark ? '#fff7ed' : '#2b1606',
      buttonBorder: dark ? 'rgba(226,201,171,.14)' : 'rgba(124,95,70,.13)',
      buttonShadow: dark
        ? '0 24px 70px rgba(0,0,0,.44)'
        : '0 24px 70px rgba(124,95,70,.13)',

      panelBg: dark ? 'rgba(42, 25, 12, 0.76)' : 'rgba(255, 250, 243, 0.94)',
      panelBorder: dark ? 'rgba(226,201,171,.14)' : 'rgba(124,95,70,.13)',
      panelText: dark ? '#fff7ed' : '#2b1606',
      panelMuted: dark ? '#d6c2aa' : '#6b5846',

      appBg: dark ? '#100a06' : '#fffaf3',
      pageBg: dark
        ? 'radial-gradient(circle at 12% 8%, rgba(240,179,111,.18), transparent 28rem), radial-gradient(circle at 86% 18%, rgba(210,126,38,.12), transparent 32rem), linear-gradient(180deg, #100a06 0%, #1b1008 44%, #100a06 100%)'
        : 'radial-gradient(circle at 12% 8%, rgba(240,179,111,.15), transparent 26rem), radial-gradient(circle at 86% 18%, rgba(124,95,70,.10), transparent 30rem), linear-gradient(180deg, #fffaf3 0%, #ffffff 52%, #fff7ef 100%)',

      cardBg: dark ? 'rgba(42, 25, 12, 0.86)' : 'rgba(255, 250, 243, 0.96)',
      cardBorder: dark ? 'rgba(226,201,171,.14)' : 'rgba(124,95,70,.13)',
      mutedText: dark ? '#d6c2aa' : '#6b5846',

      accent1: '#d27e26',
      accent2: '#f0b36f',
      accent3: '#7c5f46',
      accentSoft: dark ? 'rgba(240,179,111,.18)' : 'rgba(210,126,38,.10)',
      accentBorder: dark ? 'rgba(240,179,111,.38)' : 'rgba(210,126,38,.26)',
      accentGlow: '0 0 34px rgba(210,126,38,.18)',
      accentGlowStrong: '0 18px 42px rgba(210,126,38,.32)',
      primaryBg: 'linear-gradient(135deg, #d27e26, #f0b36f)',
      primaryText: '#271305',

      neutral1: dark ? '#e2c9ab' : '#6b5846',
      neutral2: dark ? '#d6c2aa' : '#7c5f46',

      text: dark ? '#fff7ed' : '#2b1606',
      textSoft: dark ? 'rgba(255,247,237,.76)' : 'rgba(43,22,6,.72)',
      textMuted: dark ? 'rgba(255,247,237,.52)' : 'rgba(43,22,6,.50)',

      line: dark ? 'rgba(226,201,171,.14)' : 'rgba(124,95,70,.12)',
      gridLine: dark ? 'rgba(226,201,171,.08)' : 'rgba(124,95,70,.08)',

      orangeSoft: dark ? 'rgba(240,179,111,.18)' : 'rgba(210,126,38,.10)',
      orangeBorder: dark ? 'rgba(240,179,111,.38)' : 'rgba(210,126,38,.26)',

      glassBg: dark
        ? 'linear-gradient(135deg, rgba(226,201,171,.11), rgba(226,201,171,.045))'
        : 'linear-gradient(135deg, rgba(255,250,243,.96), rgba(255,247,239,.84))',
      glassBorder: dark ? 'rgba(226,201,171,.15)' : 'rgba(124,95,70,.12)',

      heroBg: dark ? '#100a06' : '#fff8ef',
      heroShape: 'linear-gradient(135deg, rgba(240,179,111,.34), rgba(210,126,38,.16))',
      heroImageFilter: `saturate(${dark ? '1.04' : '1.06'}) contrast(1.04) brightness(${dark ? '.82' : '.92'})`,
      heroImageOpacity: dark ? '.72' : '.84',
      heroOverlay: dark
        ? 'linear-gradient(90deg, rgba(16,10,6,.94), rgba(59,36,18,.66), rgba(59,36,18,.20)), linear-gradient(180deg, rgba(16,10,6,.12), rgba(16,10,6,.94))'
        : 'linear-gradient(90deg, rgba(59,36,18,.78), rgba(59,36,18,.48), rgba(59,36,18,.12)), linear-gradient(180deg, rgba(255,248,239,.06), rgba(255,248,239,.92))',
      ambientGlow: dark
        ? 'radial-gradient(circle at 16% 10%, rgba(240,179,111,.20), transparent 30rem), radial-gradient(circle at 86% 18%, rgba(210,126,38,.12), transparent 34rem)'
        : 'radial-gradient(circle at 16% 10%, rgba(240,179,111,.20), transparent 30rem), radial-gradient(circle at 86% 18%, rgba(124,95,70,.10), transparent 34rem)',
      builderBg: dark ? '#100a06' : '#fffaf5',
      galleryBg: dark ? '#1b1008' : '#fff7ef',
      ctaBg: dark
        ? 'radial-gradient(circle at top right, rgba(240,179,111,.22), transparent 42%), linear-gradient(135deg, #1d0d03, #3b2412)'
        : 'radial-gradient(circle at top right, rgba(240,179,111,.24), transparent 42%), linear-gradient(135deg, #2b1606, #7c5f46)',
      ctaBorder: dark ? 'rgba(226,201,171,.14)' : 'rgba(255,255,255,.14)',
    }
  }

  const extractedAccent = extractProductAccentColor(product)

  return extractedAccent
    ? buildAdaptiveUiColors(base, dark, extractedAccent)
    : base
}

function formatPrice(value: Product['price'], locale: Locale) {
  if (value === null || value === undefined || value === '') {
    return locale === 'en' ? 'Price on request' : 'Prix sur demande'
  }

  const numeric = Number(value)

  if (!Number.isFinite(numeric)) return String(value)

  return `${new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR').format(
    numeric,
  )} Ar`
}

function formatDate(value: string | null | undefined, locale: Locale) {
  if (!value) return locale === 'en' ? 'Not specified' : 'Non renseigné'

  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function getProductLeadHref(product: Product) {
  const identifier = product.slug || product.id
  return `/produits/${encodeURIComponent(identifier)}/lead`
}

function normalizeProductImages(images: unknown, coverImage?: string | null) {
  const urls: string[] = []

  if (Array.isArray(images)) {
    for (const item of images) {
      if (typeof item === 'string' && item.trim()) {
        urls.push(item.trim())
      }
    }
  } else if (typeof images === 'string' && images.trim()) {
    try {
      const parsed = JSON.parse(images)

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'string' && item.trim()) {
            urls.push(item.trim())
          }
        }
      } else {
        urls.push(images.trim())
      }
    } catch {
      urls.push(images.trim())
    }
  }

  if (coverImage && !urls.includes(coverImage)) {
    urls.unshift(coverImage)
  }

  return urls
}

function safeImage(src?: string | null) {
  return src?.trim() || '/placeholder-reference.svg'
}

function registerViewerComponentTypes(editor: Editor) {
  const domComponents = editor.DomComponents as unknown as ViewerDomComponents

  const addType = (
    type: string,
    tagName: string,
    options: {
      voidTag?: boolean
      droppable?: boolean
      isComponent?: (el: Element) => false | { type: string }
    } = {},
  ) => {
    if (domComponents.getType?.(type)) return

    domComponents.addType(type, {
      isComponent:
        options.isComponent ??
        ((el: Element) => {
          return el.tagName?.toLowerCase() === tagName ? { type } : false
        }),
      model: {
        defaults: {
          tagName,
          void: Boolean(options.voidTag),
          droppable: options.droppable ?? !options.voidTag,
          editable: false,
          draggable: false,
          selectable: false,
          hoverable: false,
          highlightable: false,
          copyable: false,
          removable: false,
        },
      },
    })
  }

  addType('button', 'button')
  addType('input', 'input', { voidTag: true, droppable: false })
  addType('range', 'input', {
    voidTag: true,
    droppable: false,
    isComponent: (el) =>
      el.tagName?.toLowerCase() === 'input' &&
      (el as HTMLInputElement).type === 'range'
        ? { type: 'range' }
        : false,
  })
  addType('label', 'label')
  addType('svg', 'svg')
  addType('svg-in', 'path', { voidTag: true, droppable: false })
}

function syncEmbeddedTheme(
  editor: Editor,
  dark: boolean,
  ui: UiColors,
) {
  const canvasDoc = editor.Canvas?.getDocument()

  if (!canvasDoc) return

  const productPageRootQuery =
    '.project-theme, .md2i-support, .sara-page, [data-theme], [id$="-page"], body > div:first-child, body > main:first-child'
  const theme = dark ? 'dark' : 'light'
  const pageBg = ui.builderBg
  const pageText = ui.text

  let baseStyle = canvasDoc.getElementById(
    'viewer-base-style',
  ) as HTMLStyleElement | null

  if (!baseStyle) {
    baseStyle = canvasDoc.createElement('style')
    baseStyle.id = 'viewer-base-style'
    canvasDoc.head.appendChild(baseStyle)
  }

  baseStyle.innerHTML = `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: ${pageBg} !important;
      color: ${pageText} !important;
      overflow-x: hidden !important;
    }
  `

  canvasDoc.documentElement.setAttribute('data-app-theme', theme)
  canvasDoc.body.setAttribute('data-app-theme', theme)

  const themeRoot = canvasDoc.querySelector(
    productPageRootQuery,
  ) as HTMLElement | null

  if (themeRoot) {
    themeRoot.setAttribute('data-theme', theme)
    themeRoot.style.minHeight = '100%'
    themeRoot.style.setProperty('--viewer-shell-bg', pageBg)
    themeRoot.style.setProperty('--viewer-shell-text', pageText)
    themeRoot.style.setProperty('--viewer-shell-accent', ui.accent2)
  }

  const wrapper = editor.getWrapper() as GrapesStyleReceiver | null

  if (wrapper) {
    wrapper.addStyle({
      'background-color': pageBg,
      color: pageText,
      'min-height': '100%',
      height: 'auto',
      margin: '0',
      padding: '0',
    })
  }

  editor.refresh()
}

function measureCanvasHeight(
  editor: Editor,
  setCanvasHeight: (height: number) => void,
) {
  try {
    const iframeEl = editor.Canvas.getFrameEl()

    if (iframeEl?.contentDocument) {
      const body = iframeEl.contentDocument.body
      const html = iframeEl.contentDocument.documentElement

      if (body && html) {
        const h = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.scrollHeight,
          html.offsetHeight,
          720,
        )

        setCanvasHeight(h)
      }
    }
  } catch (e) {
    console.warn('Error measuring height:', e)
  }
}

function scheduleCanvasMeasurements(
  editor: Editor,
  setCanvasHeight: (height: number) => void,
) {
  ;[180, 520, 1100, 1800].forEach((delay) => {
    setTimeout(() => {
      measureCanvasHeight(editor, setCanvasHeight)
    }, delay)
  })
}

export default function ProductDetailClient() {
  const params = useParams()
  const router = useRouter()
  const { dark } = useTheme()
  const { t, i18n } = useTranslation()
  const locale = normalizeLocale(i18n.resolvedLanguage || i18n.language)
  const slugOrId = params?.slugOrId as string

  const mountRef = useRef<HTMLDivElement>(null)
  const gjsRef = useRef<Editor | null>(null)

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canvasHeight, setCanvasHeight] = useState(900)

  const ui = useMemo(() => getProductUiColors(product, dark), [product, dark])

  const gallery = useMemo(
    () => normalizeProductImages(product?.images, product?.coverImage),
    [product?.images, product?.coverImage],
  )

  const hasGjsContent = Boolean(product?.gjsComponents || product?.gjsHtml)
  const leadHref = product ? getProductLeadHref(product) : '#'
  const heroImage = safeImage(gallery[0] || product?.coverImage)

  useEffect(() => {
    if (!slugOrId) return

    let cancelled = false

    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await api.get<Product>(`/api/products/public/${slugOrId}`)
        const nextProduct = res.data

        const [translatedProduct] = await translateDynamicItems<Product>(
          [nextProduct],
          locale,
          ['name', 'excerpt', 'category.name'],
        )

        const localizedProduct = translatedProduct ?? nextProduct

        const [translatedComponents, translatedHtml] = await Promise.all([
          localizedProduct.gjsComponents
            ? translateGrapesComponents(localizedProduct.gjsComponents, locale)
            : Promise.resolve(localizedProduct.gjsComponents),
          !localizedProduct.gjsComponents && localizedProduct.gjsHtml
            ? translateHtmlContent(localizedProduct.gjsHtml, locale)
            : Promise.resolve(localizedProduct.gjsHtml),
        ])

        if (cancelled) return

        setProduct({
          ...localizedProduct,
          gjsComponents: translatedComponents,
          gjsHtml: translatedHtml,
        })

        if (nextProduct?.slug && slugOrId !== nextProduct.slug) {
          router.replace(`/produits/${nextProduct.slug}`)
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setError(t('productsPage.errors.load'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [slugOrId, router, locale, t])

  useEffect(() => {
    if (!mountRef.current || !product || !hasGjsContent) return

    if (gjsRef.current) {
      gjsRef.current.destroy()
      gjsRef.current = null
    }

    const editor = grapesjs.init({
      container: mountRef.current,
      height: '100%',
      width: '100%',
      fromElement: false,
      storageManager: false,
      panels: {
        defaults: [],
      },
      plugins: [],
      canvas: {
        styles: [
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
        ],
      },
      protectedCss: '',
      editable: false,
      components: {
        defaults: {
          editable: false,
          draggable: false,
          selectable: false,
          hoverable: false,
          highlightable: false,
          copyable: false,
          removable: false,
        },
      },
      commands: {
        defaults: [
          { id: 'core:component:delete', run: () => {} },
          { id: 'core:component:copy', run: () => {} },
          { id: 'core:component:paste', run: () => {} },
          { id: 'core:component:duplicate', run: () => {} },
          { id: 'core:component:move', run: () => {} },
          { id: 'core:component:select', run: () => {} },
          { id: 'core:component:style', run: () => {} },
          { id: 'core:component:enter', run: () => {} },
          { id: 'core:component:exit', run: () => {} },
          { id: 'core:component:remove', run: () => {} },
          { id: 'core:component:create', run: () => {} },
          { id: 'core:component:add', run: () => {} },
          { id: 'core:component:clone', run: () => {} },
        ],
      },
      dragManager: {
        disable: true,
      },
      selectorManager: {
        disable: true,
      },
      traitManager: {
        disable: true,
      },
      styleManager: {
        disable: true,
      },
      layerManager: {
        disable: true,
      },
      blockManager: {
        disable: true,
      },
      deviceManager: {
        disable: true,
      },
      allowScripts: true,
    } as unknown as Parameters<typeof grapesjs.init>[0])

    gjsRef.current = editor
    registerViewerComponentTypes(editor)

    editor.on('component:selected', () => {
      editor.select(undefined)
    })

    editor.on('component:mouseover', () => {
      ;(editor as EditorWithOptionalHighlighter).getHighlighter?.().remove()
    })

    editor.on('load', () => {
      const commands = editor.Commands.getAll()

      Object.keys(commands).forEach((cmdId) => {
        if (cmdId.startsWith('core:')) {
          editor.Commands.add(cmdId, {
            run: () => {},
            stop: () => {},
          })
        }
      })

      if (product.gjsComponents) {
        editor.setComponents(product.gjsComponents as GrapesComponentInput)
      } else if (product.gjsHtml) {
        editor.setComponents(product.gjsHtml)
      }

      if (product.gjsStyles) {
        editor.setStyle(product.gjsStyles as GrapesStyleInput)
      }

      const allComponents = editor.getComponents()

      const disableComponent = (component: GrapesComponentNode) => {
        if (component && component.set) {
          component.set('editable', false)
          component.set('draggable', false)
          component.set('selectable', false)
          component.set('hoverable', false)
          component.set('highlightable', false)
          component.set('copyable', false)
          component.set('removable', false)
          component.set('toolbar', null)
          component.set('badge', null)

          if (component.components && component.components().length > 0) {
            component.components().forEach((child) =>
              disableComponent(child),
            )
          }
        }
      }

      ;(allComponents as unknown as {
        forEach: (callback: (component: unknown) => void) => void
      }).forEach((component) =>
        disableComponent(component as unknown as GrapesComponentNode),
      )

      const setupCanvas = () => {
        try {
          const canvasDoc = editor.Canvas?.getDocument()

          if (!canvasDoc) {
            setTimeout(setupCanvas, 50)
            return
          }

          let readonlyStyle = canvasDoc.getElementById(
            'readonly-styles',
          ) as HTMLStyleElement | null

          if (!readonlyStyle) {
            readonlyStyle = canvasDoc.createElement('style')
            readonlyStyle.id = 'readonly-styles'
            canvasDoc.head.appendChild(readonlyStyle)
          }

          readonlyStyle.innerHTML = `
            * {
              -webkit-tap-highlight-color: transparent !important;
            }

            *:active,
            *:focus {
              outline: none !important;
            }

            img,
            svg,
            canvas {
              -webkit-user-drag: none !important;
              user-drag: none !important;
            }

            a,
            button,
            [role="button"] {
              cursor: pointer !important;
            }

            input[type="range"] {
              --viewer-range-accent: var(--gold, var(--accent, var(--primary, ${ui.accent2})));
              --viewer-range-track: ${ui.line};
              --viewer-range-thumb: #f8fafc;
              width: 100% !important;
              max-width: 100% !important;
              min-height: 30px !important;
              margin: 8px 0 0 !important;
              display: block !important;
              cursor: pointer !important;
              -webkit-appearance: none !important;
              appearance: none !important;
              accent-color: var(--viewer-range-accent) !important;
              background: transparent !important;
            }

            input[type="range"]:focus-visible {
              outline: 3px solid color-mix(in srgb, var(--viewer-range-accent) 42%, transparent) !important;
              outline-offset: 4px !important;
              border-radius: 999px !important;
            }

            input[type="range"]::-webkit-slider-runnable-track {
              height: 10px !important;
              border-radius: 999px !important;
              border: 1px solid rgba(255, 255, 255, 0.14) !important;
              background: linear-gradient(
                90deg,
                color-mix(in srgb, var(--viewer-range-accent) 80%, #ffffff 0%),
                var(--viewer-range-track)
              ) !important;
              box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12) !important;
            }

            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none !important;
              appearance: none !important;
              width: 22px !important;
              height: 22px !important;
              margin-top: -7px !important;
              border-radius: 999px !important;
              border: 3px solid var(--viewer-range-accent) !important;
              background: var(--viewer-range-thumb) !important;
              box-shadow: 0 8px 22px rgba(0, 0, 0, 0.28) !important;
            }

            input[type="range"]::-moz-range-track {
              height: 10px !important;
              border-radius: 999px !important;
              border: 1px solid rgba(255, 255, 255, 0.14) !important;
              background: var(--viewer-range-track) !important;
            }

            input[type="range"]::-moz-range-progress {
              height: 10px !important;
              border-radius: 999px !important;
              background: var(--viewer-range-accent) !important;
            }

            input[type="range"]::-moz-range-thumb {
              width: 18px !important;
              height: 18px !important;
              border-radius: 999px !important;
              border: 3px solid var(--viewer-range-accent) !important;
              background: var(--viewer-range-thumb) !important;
              box-shadow: 0 8px 22px rgba(0, 0, 0, 0.28) !important;
            }
          `

          const preventDrag = (e: Event) => {
            e.preventDefault()
            e.stopPropagation()
            return false
          }

          const preventContextMenu = (e: Event) => {
            e.preventDefault()
            return false
          }

          const preventSelectStart = (e: Event) => {
            const target = e.target as HTMLElement

            if (
              !target.closest('input') &&
              !target.closest('textarea') &&
              !target.closest('[contenteditable="true"]')
            ) {
              e.preventDefault()
            }
          }

          const preventCopy = (e: Event) => {
            const target = e.target as HTMLElement

            if (!target.closest('input') && !target.closest('textarea')) {
              e.preventDefault()
              return false
            }
          }

          const preventPaste = (e: Event) => {
            const target = e.target as HTMLElement

            if (!target.closest('input') && !target.closest('textarea')) {
              e.preventDefault()
              return false
            }
          }

          const handleAnchorClick = (e: Event) => {
            const target = e.target as HTMLElement | null
            const link = target?.closest?.('a[href]') as HTMLAnchorElement | null

            if (!link) return

            e.preventDefault()
            e.stopPropagation()

            const href = link.getAttribute('href')
            if (!href) return

            const absoluteHref = new URL(href, window.location.origin).toString()
            const isDownload = link.hasAttribute('download')
            const downloadName = link.getAttribute('download') || ''
            const targetBlank = link.getAttribute('target') === '_blank'

            if (isDownload) {
              const tempLink = window.document.createElement('a')
              tempLink.href = absoluteHref
              tempLink.style.display = 'none'

              if (downloadName) {
                tempLink.setAttribute('download', downloadName)
              }

              tempLink.setAttribute('rel', 'noopener noreferrer')
              window.document.body.appendChild(tempLink)
              tempLink.click()
              tempLink.remove()
              return
            }

            if (targetBlank) {
              window.open(absoluteHref, '_blank', 'noopener,noreferrer')
              return
            }

            window.open(absoluteHref, '_blank', 'noopener,noreferrer')
          }

          canvasDoc.body.addEventListener('dragstart', preventDrag)
          canvasDoc.body.addEventListener('drop', preventDrag)
          canvasDoc.body.addEventListener('dragenter', preventDrag)
          canvasDoc.body.addEventListener('dragover', preventDrag)
          canvasDoc.body.addEventListener('dragend', preventDrag)
          canvasDoc.body.addEventListener('contextmenu', preventContextMenu)
          canvasDoc.body.addEventListener('selectstart', preventSelectStart)
          canvasDoc.body.addEventListener('copy', preventCopy)
          canvasDoc.body.addEventListener('paste', preventPaste)
          canvasDoc.body.addEventListener('click', handleAnchorClick, true)

          ;(editor as EditorWithEventHandlers).__eventHandlers = {
            preventDrag,
            preventContextMenu,
            preventSelectStart,
            preventCopy,
            preventPaste,
            handleAnchorClick,
          } satisfies CanvasEventHandlers

          if (product.gjsJs?.trim()) {
            const existing = canvasDoc.querySelector('script[data-product-js]')

            if (existing) {
              existing.remove()
            }

            const script = canvasDoc.createElement('script')
            script.setAttribute('data-product-js', 'true')
            script.text = product.gjsJs
            canvasDoc.body.appendChild(script)
          }

          syncEmbeddedTheme(editor, dark, ui)

          scheduleCanvasMeasurements(editor, setCanvasHeight)

          editor.runCommand('preview')
        } catch (e) {
          console.warn('Error setting up canvas:', e)
        }
      }

      setupCanvas()
    })

    return () => {
      if (gjsRef.current) {
        const currentEditor = gjsRef.current

        try {
          const canvasDoc = currentEditor.Canvas?.getDocument()
          const handlers = (currentEditor as EditorWithEventHandlers)
            .__eventHandlers

          if (canvasDoc && handlers) {
            canvasDoc.body.removeEventListener(
              'dragstart',
              handlers.preventDrag,
            )
            canvasDoc.body.removeEventListener('drop', handlers.preventDrag)
            canvasDoc.body.removeEventListener(
              'dragenter',
              handlers.preventDrag,
            )
            canvasDoc.body.removeEventListener(
              'dragover',
              handlers.preventDrag,
            )
            canvasDoc.body.removeEventListener(
              'dragend',
              handlers.preventDrag,
            )
            canvasDoc.body.removeEventListener(
              'contextmenu',
              handlers.preventContextMenu,
            )
            canvasDoc.body.removeEventListener(
              'selectstart',
              handlers.preventSelectStart,
            )
            canvasDoc.body.removeEventListener('copy', handlers.preventCopy)
            canvasDoc.body.removeEventListener('paste', handlers.preventPaste)
            canvasDoc.body.removeEventListener(
              'click',
              handlers.handleAnchorClick,
              true,
            )
          }
        } catch {}

        currentEditor.destroy()
        gjsRef.current = null
      }
    }
  }, [product, dark, hasGjsContent, ui])

  useEffect(() => {
    const editor = gjsRef.current

    if (!editor || !hasGjsContent) return

    syncEmbeddedTheme(editor, dark, ui)

    scheduleCanvasMeasurements(editor, setCanvasHeight)
  }, [dark, hasGjsContent, ui])

  const goBack = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push('/produits')
  }

  if (loading) {
    return (
      <div
        className="product-state-page"
        style={{
          background: ui.pageBg,
          color: ui.text,
        }}
      >
        <div className="product-state-card">{t('productDetail.loading')}</div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div
        className="product-state-page"
        style={{
          background: ui.pageBg,
          color: ui.text,
        }}
      >
        <div className="product-state-card">
          <p>{error || t('productDetail.notFound')}</p>

          <button onClick={goBack}>{t('productDetail.back')}</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        .gjs-pn-panel,
        .gjs-pn-panels,
        [class*='gjs-pn-'],
        .gjs-off-prv,
        .gjs-toolbar,
        .gjs-badge,
        .gjs-highlighter,
        .gjs-placeholder,
        .gjs-spot-default,
        .gjs-tooltip,
        .gjs-toolbar-item,
        .gjs-badge-edit {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
          pointer-events: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }

        .gjs-cv-canvas {
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: visible !important;
        }

        .gjs-cv-canvas__frames {
          pointer-events: none;
          width: 100% !important;
          height: 100% !important;
        }

        .gjs-cv-canvas__frames iframe {
          pointer-events: auto !important;
          width: 100% !important;
          height: 100% !important;
          position: relative !important;
          z-index: 1 !important;
        }

        .gjs-editor {
          background: transparent !important;
          border: none !important;
          height: 100% !important;
        }

        .product-detail-page {
          --product-accent: ${ui.accent2};
          --product-accent-strong: ${ui.accent1};
          --product-accent-soft: ${ui.accentSoft};
          --product-accent-border: ${ui.accentBorder};
          min-height: 100vh;
          background: ${ui.pageBg};
          color: ${ui.text};
          font-family: Inter, Arial, Helvetica, sans-serif;
          position: relative;
          isolation: isolate;
          overflow-x: hidden;
        }

        .product-detail-page::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: -2;
          pointer-events: none;
          opacity: ${dark ? '.18' : '.16'};
          background-image:
            linear-gradient(${ui.gridLine} 1px, transparent 1px),
            linear-gradient(90deg, ${ui.gridLine} 1px, transparent 1px);
          background-size: 92px 92px;
          mask-image: radial-gradient(circle at 50% 12%, #000 0, transparent 72%);
        }

        .product-detail-page::after {
          content: '';
          position: fixed;
          inset: 0;
          z-index: -3;
          pointer-events: none;
          opacity: ${dark ? '.20' : '.12'};
          background: ${ui.ambientGlow};
        }

        .product-hero {
          position: relative;
          min-height: 680px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
          isolation: isolate;
          box-shadow: inset 0 -1px 0 ${ui.accentBorder};
        }

        .product-hero::before {
          content: '';
          position: absolute;
          right: -14%;
          top: 10%;
          z-index: -1;
          width: min(58vw, 760px);
          aspect-ratio: 1;
          opacity: ${dark ? '.42' : '.34'};
          background: ${ui.heroShape};
          filter: blur(4px);
          clip-path: polygon(46% 0, 86% 13%, 100% 51%, 71% 92%, 24% 100%, 0 62%, 12% 18%);
          animation: productMorph 16s ease-in-out infinite alternate;
        }

        @keyframes productMorph {
          0% {
            clip-path: polygon(46% 0, 86% 13%, 100% 51%, 71% 92%, 24% 100%, 0 62%, 12% 18%);
            transform: translate3d(0, 0, 0) rotate(0deg);
          }

          100% {
            clip-path: polygon(58% 3%, 100% 30%, 82% 82%, 48% 100%, 8% 76%, 0 29%, 25% 7%);
            transform: translate3d(-4%, 3%, 0) rotate(8deg);
          }
        }

        .product-hero-bg {
          position: absolute;
          inset: 0;
          z-index: -3;
          background: ${ui.heroBg};
        }

        .product-hero-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: ${ui.heroImageFilter};
          opacity: ${ui.heroImageOpacity};
        }

        .product-hero-overlay {
          position: absolute;
          inset: 0;
          background: ${ui.heroOverlay};
        }

        .product-hero-inner {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 138px 0 72px;
          color: #fff;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 34px;
          color: rgba(255,255,255,.68);
          font-size: 13px;
          font-weight: 650;
        }

        .breadcrumb a {
          color: rgba(255,255,255,.78);
          text-decoration: none;
          transition: color .18s ease;
        }

        .breadcrumb a:hover {
          color: ${ui.accent2};
        }

        .breadcrumb strong {
          max-width: 560px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(255,255,255,.94);
          font-weight: 800;
        }

        .product-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 34px;
          align-items: end;
        }

        .product-hero-copy {
          max-width: 840px;
        }

        .product-kicker-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .product-kicker,
        .product-chip {
          min-height: 34px;
          padding: 0 13px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .05em;
        }

        .product-kicker {
          background: ${ui.accentSoft};
          border: 1px solid ${ui.accentBorder};
          color: #fff;
          text-transform: uppercase;
          box-shadow: ${ui.accentGlow};
        }

        .product-chip {
          background:
            linear-gradient(135deg, rgba(255,255,255,.14), ${ui.accentSoft});
          border: 1px solid ${ui.accentBorder};
          color: rgba(255,255,255,.88);
        }

        .product-hero h1 {
          margin: 0;
          font-size: clamp(38px, 6vw, 78px);
          line-height: .96;
          letter-spacing: 0;
          font-weight: 950;
          color: #fff;
          text-shadow: 0 18px 42px rgba(0,0,0,.28);
        }

        .product-lead {
          margin: 24px 0 0;
          max-width: 760px;
          color: rgba(255,255,255,.78);
          font-size: clamp(16px, 2vw, 20px);
          line-height: 1.75;
          font-weight: 550;
        }

        .product-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 34px;
        }

        .primary-action,
        .secondary-action {
          min-height: 48px;
          padding: 0 20px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 14px;
          font-weight: 850;
          transition:
            transform .18s ease,
            box-shadow .18s ease,
            background .18s ease,
            border-color .18s ease;
        }

        .primary-action {
          border: none;
          background: ${ui.primaryBg};
          color: ${ui.primaryText};
          box-shadow:
            ${ui.accentGlowStrong},
            inset 0 1px 0 rgba(255,255,255,.28);
        }

        .secondary-action {
          border: 1px solid rgba(255,255,255,.18);
          background: rgba(255,255,255,.12);
          color: #fff;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .primary-action:hover,
        .secondary-action:hover {
          transform: translateY(-2px);
        }

        .primary-action:hover {
          box-shadow:
            ${ui.accentGlowStrong},
            inset 0 1px 0 rgba(255,255,255,.34);
        }

        .secondary-action:hover {
          background: rgba(255,255,255,.18);
          border-color: ${ui.accentBorder};
        }

        .product-summary-card {
          border-radius: 24px;
          padding: 22px;
          background:
            linear-gradient(135deg, rgba(255,255,255,.14), ${ui.accentSoft});
          border: 1px solid ${ui.accentBorder};
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 26px 90px rgba(0,0,0,.28);
          position: relative;
          overflow: hidden;
        }

        .product-summary-card::before {
          content: '';
          position: absolute;
          inset: -1px;
          pointer-events: none;
          opacity: .7;
          background:
            radial-gradient(circle at 18% 0%, ${ui.accentSoft}, transparent 32%),
            linear-gradient(135deg, rgba(255,255,255,.14), transparent 58%);
        }

        .product-summary-card > * {
          position: relative;
        }

        .summary-eyebrow {
          display: block;
          margin-bottom: 12px;
          color: ${ui.accent2};
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .summary-title {
          display: grid;
          gap: 4px;
          padding-bottom: 18px;
          margin-bottom: 18px;
          border-bottom: 1px solid rgba(255,255,255,.12);
        }

        .summary-title strong {
          font-size: 18px;
          line-height: 1.25;
          color: #fff;
        }

        .summary-title span {
          color: rgba(255,255,255,.62);
          font-size: 14px;
        }

        .summary-list {
          display: grid;
          gap: 12px;
        }

        .summary-item {
          display: grid;
          gap: 4px;
        }

        .summary-item span {
          color: rgba(255,255,255,.52);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .09em;
          text-transform: uppercase;
        }

        .summary-item strong {
          color: #fff;
          font-size: 14px;
          line-height: 1.4;
        }

        .product-body {
          width: 100%;
          margin: 0;
          padding: 0px 0 0;
        }

        .product-full-content {
          width: 100%;
        }

        .product-content-card {
          width: 100%;
          overflow: visible;
          background: transparent;
          border: 0;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }

        .product-content-head {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: clamp(24px, 4vw, 42px) 0;
        }

        .section-title {
          margin-bottom: 18px;
        }

        .section-title span {
          display: block;
          margin-bottom: 8px;
          color: ${ui.accent1};
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .section-title h2 {
          margin: 0;
          font-size: clamp(26px, 3vw, 40px);
          line-height: 1.05;
          letter-spacing: 0;
          font-weight: 950;
          color: ${ui.text};
        }

        .product-content-head p {
          max-width: 760px;
          margin: 0;
          color: ${ui.textSoft};
          font-size: 15px;
          line-height: 1.8;
        }

        .product-builder-shell {
          width: 100%;
          min-height: 720px;
          background: ${ui.builderBg};
          border-top: 1px solid ${ui.line};
          border-bottom: 1px solid ${ui.line};
        }

        .product-builder-canvas {
          width: 100%;
        }

        .product-no-builder {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: clamp(24px, 4vw, 42px) 0;
          display: grid;
          gap: 18px;
        }

        .product-gallery-section {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 38px 0 0;
        }

        .product-gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 14px;
        }

        .product-gallery-item {
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid ${ui.cardBorder};
          background: ${ui.galleryBg};
          box-shadow: ${ui.buttonShadow};
        }

        .product-gallery-item img {
          width: 100%;
          height: 160px;
          object-fit: cover;
          display: block;
        }

        .product-bottom-cta-wrap {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 34px 0 84px;
        }

        .product-bottom-cta {
          border-radius: 26px;
          padding: clamp(24px, 4vw, 34px);
          background: ${ui.ctaBg};
          border: 1px solid ${ui.ctaBorder};
          color: #fff;
          box-shadow: ${ui.buttonShadow};
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 20px;
          align-items: center;
        }

        .product-bottom-cta h3 {
          margin: 0 0 8px;
          font-size: clamp(22px, 3vw, 34px);
          line-height: 1.05;
          letter-spacing: 0;
          font-weight: 950;
        }

        .product-bottom-cta p {
          margin: 0;
          max-width: 760px;
          color: rgba(255,255,255,.70);
          line-height: 1.7;
          font-size: 15px;
        }

        .product-bottom-cta a {
          min-height: 48px;
          padding: 0 20px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: ${ui.primaryBg};
          color: ${ui.primaryText};
          text-decoration: none;
          font-size: 14px;
          font-weight: 900;
          white-space: nowrap;
          box-shadow: ${ui.accentGlowStrong};
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .product-bottom-cta a:hover {
          transform: translateY(-2px);
          box-shadow: ${ui.accentGlowStrong};
        }

        .product-state-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          font-family: Inter, Arial, Helvetica, sans-serif;
        }

        .product-state-card {
          width: min(460px, 100%);
          padding: 28px;
          border-radius: 24px;
          background: ${ui.cardBg};
          border: 1px solid ${ui.cardBorder};
          box-shadow: ${ui.buttonShadow};
          color: ${ui.textSoft};
          text-align: center;
          font-size: 14px;
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
        }

        .product-state-card p {
          margin: 0 0 18px;
        }

        .product-state-card button {
          height: 44px;
          padding: 0 18px;
          border-radius: 14px;
          border: none;
          background: ${ui.primaryBg};
          color: ${ui.primaryText};
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: ${ui.accentGlowStrong};
        }

        @media (max-width: 980px) {
          .product-hero {
            min-height: auto;
          }

          .product-hero-inner {
            padding: 128px 0 46px;
          }

          .product-hero-grid {
            grid-template-columns: 1fr;
          }

          .product-bottom-cta {
            grid-template-columns: 1fr;
          }

          .product-bottom-cta a {
            width: fit-content;
          }
        }

        @media (max-width: 640px) {
          .product-hero-inner,
          .product-content-head,
          .product-no-builder,
          .product-gallery-section,
          .product-bottom-cta-wrap {
            width: min(100% - 28px, 1180px);
          }

          .product-hero h1 {
            font-size: clamp(34px, 10vw, 40px);
            line-height: 1.04;
            overflow-wrap: anywhere;
          }

          .product-lead {
            font-size: 15px;
            line-height: 1.65;
          }

          .product-actions {
            flex-direction: column;
          }

          .primary-action,
          .secondary-action,
          .product-bottom-cta a {
            width: 100%;
          }

          .product-bottom-cta {
            border-radius: 22px;
          }

          .breadcrumb strong {
            max-width: 260px;
          }
        }
      `}</style>

      <main className="product-detail-page" data-theme={dark ? 'dark' : 'light'}>
        <section className="product-hero">
          <div className="product-hero-bg">
            <img src={heroImage} alt="" />
            <div className="product-hero-overlay" />
          </div>

          <div className="product-hero-inner">
            <nav className="breadcrumb" aria-label="Fil d’Ariane">
              <Link href="/">Accueil</Link>
              <span>/</span>
              <Link href="/produits">Produits</Link>
              <span>/</span>
              <strong>{product.name}</strong>
            </nav>

            <div className="product-hero-grid">
              <div className="product-hero-copy">
                <div className="product-kicker-row">
                  <span className="product-kicker">Produit MD2I</span>

                  {product.category?.name && (
                    <span className="product-chip">{product.category.name}</span>
                  )}

                  <span className="product-chip">
                    {formatPrice(product.price, locale)}
                  </span>
                </div>

                <h1>{product.name}</h1>

                <p className="product-lead">
                  {product.excerpt?.trim() || t('productsPage.card.noDescription')}
                </p>

                <div className="product-actions">
                  <Link href={leadHref} className="primary-action">
                    {t('productDetail.requestQuote')}
                  </Link>

                  <Link href="/produits" className="secondary-action">
                    {t('productDetail.viewAllProducts')}
                  </Link>
                </div>
              </div>

              <aside className="product-summary-card">
                <span className="summary-eyebrow">Fiche produit</span>

                <div className="summary-title">
                  <strong>{product.name}</strong>
                  <span>{product.category?.name || 'Catalogue MD2I'}</span>
                </div>

                <div className="summary-list">
                  <div className="summary-item">
                    <span>Prix</span>
                    <strong>{formatPrice(product.price, locale)}</strong>
                  </div>

                  <div className="summary-item">
                    <span>Publication</span>
                    <strong>
                      {formatDate(product.publishedAt || product.createdAt, locale)}
                    </strong>
                  </div>

                  <div className="summary-item">
                    <span>Référence</span>
                    <strong>{product.slug || product.id}</strong>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="product-body">
          <div className="product-full-content">
            <article className="product-content-card">
              {hasGjsContent ? (
                <div className="product-builder-shell" data-theme={dark ? 'dark' : 'light'}>
                  <div
                    className="product-builder-canvas"
                    style={{
                      height: `${canvasHeight}px`,
                      minHeight: '720px',
                    }}
                  >
                    <div
                      ref={mountRef}
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="product-no-builder">
                  <p style={{ color: ui.textSoft, lineHeight: 1.8 }}>
                    {product.excerpt?.trim() || t('productsPage.card.noDescription')}
                  </p>
                </div>
              )}
            </article>
          </div>
        </section>
      </main>
    </>
  )
}
