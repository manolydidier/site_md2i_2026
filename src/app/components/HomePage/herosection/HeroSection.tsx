'use client'

import { useMemo, useRef, useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import { useHero3DScene } from '../hooks/useHero3DScene'
import type { HeroTheme, Mode } from './types'
import styles from './Hero3D.module.css'

export default function Hero3D() {
  const [showParticles, setShowParticles] = useState(true)
  const { dark } = useTheme()
  const mode: Mode = dark ? 'dark' : 'light'

  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const eyebrowRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const btnsRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  const topLeftTitleRef = useRef<HTMLHeadingElement>(null)
  const topLeftTextRef = useRef<HTMLParagraphElement>(null)
  const topRightTitleRef = useRef<HTMLHeadingElement>(null)
  const topRightTextRef = useRef<HTMLParagraphElement>(null)
  const bottomLeftTitleRef = useRef<HTMLHeadingElement>(null)
  const bottomLeftTextRef = useRef<HTMLParagraphElement>(null)
  const bottomRightTitleRef = useRef<HTMLHeadingElement>(null)
  const bottomRightTextRef = useRef<HTMLParagraphElement>(null)

  const theme: HeroTheme = useMemo(() => {
    const isDark = mode === 'dark'

    return {
      bg: isDark ? '#060608' : '#f7f8fc',
      title: isDark ? '#e8e6f0' : '#101114',
      desc: isDark ? 'rgba(232,230,240,.58)' : 'rgba(16,17,20,.66)',
      eyebrow: isDark ? 'rgba(239,159,39,.78)' : 'rgba(190,120,20,.95)',
      secondaryBg: isDark ? 'rgba(255,255,255,.06)' : 'rgba(16,17,20,.04)',
      secondaryText: isDark ? 'rgba(232,230,240,.78)' : 'rgba(16,17,20,.78)',
      secondaryBorder: isDark ? 'rgba(255,255,255,.12)' : 'rgba(16,17,20,.10)',
      dot: isDark ? 'rgba(255,255,255,.2)' : 'rgba(16,17,20,.16)',
      scrollText: isDark ? 'rgba(232,230,240,.25)' : 'rgba(16,17,20,.35)',
      scrollLine: isDark ? 'rgba(255,255,255,.15)' : 'rgba(16,17,20,.14)',
      rendererClear: isDark ? 0x000000 : 0xffffff,
      ambientIntensity: isDark ? 0.42 : 0.8,
      dirIntensity: isDark ? 0.85 : 1.05,
      pointIntensity: isDark ? 1.45 : 1.0,
      sceneFogNear: 8,
      sceneFogFar: 16,
      fogColor: isDark ? 0x060608 : 0xf7f8fc,
      overlayTopStrong: isDark ? 'rgba(6,6,8,.90)' : 'rgba(247,248,252,.92)',
      overlayTopSoft: isDark ? 'rgba(6,6,8,.60)' : 'rgba(247,248,252,.62)',
      overlayBottomSoft: isDark ? 'rgba(6,6,8,.28)' : 'rgba(247,248,252,.32)',
      secondaryHover: isDark ? 'rgba(255,255,255,.10)' : 'rgba(16,17,20,.07)',
    }
  }, [mode])

  const heroRefs = useMemo(
    () => ({
      rootRef,
      canvasRef,
      eyebrowRef,
      titleRef,
      descRef,
      btnsRef,
      stepsRef,
      progressRef,
      statsRef,
      topLeftTitleRef,
      topLeftTextRef,
      topRightTitleRef,
      topRightTextRef,
      bottomLeftTitleRef,
      bottomLeftTextRef,
      bottomRightTitleRef,
      bottomRightTextRef,
      styles,
    }),
    []
  )

  useHero3DScene(mode, theme, heroRefs,showParticles)

  return (
    <div
      ref={rootRef}
      className={styles.hero3d}
      style={{ background: theme.bg }}
      data-mode={mode}
    >
      <canvas ref={canvasRef} className={styles.hero3dCanvas} />

      <div className={styles.hero3dOverlay}>
        <div className={styles.hero3dHeader}>
          <div ref={eyebrowRef} className={styles.hero3dEyebrow} />
          <h1 ref={titleRef} className={styles.hero3dTitle} />
        </div>

        <div className={styles.hero3dFeatures}>
          <div className={`${styles.feature} ${styles.topLeft}`}>
            <h3 ref={topLeftTitleRef} className={styles.featureTitle} />
            <p ref={topLeftTextRef} className={styles.featureText} />
          </div>

          <div className={`${styles.feature} ${styles.topRight}`}>
            <h3 ref={topRightTitleRef} className={styles.featureTitle} />
            <p ref={topRightTextRef} className={styles.featureText} />
          </div>

          <div className={`${styles.feature} ${styles.bottomLeft}`}>
            <h3 ref={bottomLeftTitleRef} className={styles.featureTitle} />
            <p ref={bottomLeftTextRef} className={styles.featureText} />
          </div>

          <div className={`${styles.feature} ${styles.bottomRight}`}>
            <h3 ref={bottomRightTitleRef} className={styles.featureTitle} />
            <p ref={bottomRightTextRef} className={styles.featureText} />
          </div>
        </div>

        <div className={styles.hero3dBottom}>
          <p ref={descRef} className={styles.hero3dDesc} />
          <div ref={btnsRef} className={styles.hero3dBtns} />
        </div>
      </div>

      <div ref={statsRef} className={styles.hero3dStats} />
      <div ref={stepsRef} className={styles.hero3dSteps} />
      <div ref={progressRef} className={styles.hero3dProgress} />

      <div className={styles.hero3dScrollHint}>
        <span>Scroll</span>
        <div className={styles.hero3dScrollLine} />
      </div>
      <button
  onClick={() => setShowParticles((prev) => !prev)}
  style={{
    position: 'absolute',
    top: 100,
    right: 20,
    zIndex: 20,
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,.15)',
    background: 'rgba(0,0,0,.35)',
    color: '#fff',
    cursor: 'pointer',
  }}
>
  {showParticles ? 'Masquer particules' : 'Afficher particules'}
</button>
    </div>
  )
}