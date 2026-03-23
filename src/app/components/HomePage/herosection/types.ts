export type Mode = 'dark' | 'light'

export type HeroButton = {
  label: string
  cls: 'primary' | 'secondary'
}

export type HeroObjectType = 'network' | 'cube' | 'shield' | 'dna'

export type Slide = {
  eyebrow: string
  title: string
  desc: string
  btns: HeroButton[]
  object: HeroObjectType
  color: number
}

export type Stat = {
  value: number
  suffix: string
  label: string
}

export type FeatureContent = {
  tl: { title: string; text: string }
  tr: { title: string; text: string }
  bl: { title: string; text: string }
  br: { title: string; text: string }
}

export type HeroTheme = {
  bg: string
  title: string
  desc: string
  eyebrow: string
  secondaryBg: string
  secondaryText: string
  secondaryBorder: string
  dot: string
  scrollText: string
  scrollLine: string
  rendererClear: number
  ambientIntensity: number
  dirIntensity: number
  pointIntensity: number
  sceneFogNear: number
  sceneFogFar: number
  fogColor: number
  overlayTopStrong: string
  overlayTopSoft: string
  overlayBottomSoft: string
  secondaryHover: string
}