'use client'

import { useEffect, useRef } from 'react'
import type { TFunction } from 'i18next'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { easeInOutCubic } from '../herosection/utils/animations'
import { getFeatureContent } from '../herosection/utils/featureContent'
import { makeObject } from '../herosection/three/builders'
import { buildHaloMesh, buildParticleSystem } from '../herosection/scene/createParticles'
import type { HeroTheme, Mode, Slide } from '../herosection/types'

type Refs = {
  rootRef: React.RefObject<HTMLDivElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  eyebrowRef: React.RefObject<HTMLDivElement | null>
  titleRef: React.RefObject<HTMLHeadingElement | null>
  descRef: React.RefObject<HTMLParagraphElement | null>
  btnsRef: React.RefObject<HTMLDivElement | null>
  stepsRef: React.RefObject<HTMLDivElement | null>
  progressRef: React.RefObject<HTMLDivElement | null>
  // statsRef: React.RefObject<HTMLDivElement | null>
  topLeftTitleRef: React.RefObject<HTMLHeadingElement | null>
  topLeftTextRef: React.RefObject<HTMLParagraphElement | null>
  topRightTitleRef: React.RefObject<HTMLHeadingElement | null>
  topRightTextRef: React.RefObject<HTMLParagraphElement | null>
  bottomLeftTitleRef: React.RefObject<HTMLHeadingElement | null>
  bottomLeftTextRef: React.RefObject<HTMLParagraphElement | null>
  bottomRightTitleRef: React.RefObject<HTMLHeadingElement | null>
  bottomRightTextRef: React.RefObject<HTMLParagraphElement | null>
  styles: Record<string, string>
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function getColorParts(color: number) {
  const c = new THREE.Color(color)
  return {
    r: Math.round(c.r * 255),
    g: Math.round(c.g * 255),
    b: Math.round(c.b * 255),
  }
}

function paintFloorCanvas(canvas: HTMLCanvasElement, color: number, mode: Mode) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { r, g, b } = getColorParts(color)
  const isDark = mode === 'dark'
  const size = canvas.width
  const center = size / 2

  ctx.clearRect(0, 0, size, size)

  const glow = ctx.createRadialGradient(center, center, 0, center, center, center)
  glow.addColorStop(0, `rgba(${r},${g},${b},${isDark ? 0.28 : 0.16})`)
  glow.addColorStop(0.34, `rgba(${r},${g},${b},${isDark ? 0.14 : 0.08})`)
  glow.addColorStop(0.72, isDark ? 'rgba(255,255,255,0.035)' : 'rgba(15,23,42,0.045)')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)

  ctx.save()
  ctx.translate(center, center)
  ctx.strokeStyle = `rgba(${r},${g},${b},${isDark ? 0.16 : 0.12})`
  ctx.lineWidth = 1
  for (let i = -7; i <= 7; i += 1) {
    const offset = i * 26
    ctx.beginPath()
    ctx.moveTo(-center, offset)
    ctx.lineTo(center, offset)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(offset, -center)
    ctx.lineTo(offset, center)
    ctx.stroke()
  }

  ctx.strokeStyle = `rgba(${r},${g},${b},${isDark ? 0.34 : 0.24})`
  ;[120, 190, 260].forEach((radius) => {
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.stroke()
  })
  ctx.restore()
}

function prepareHeroObject(object: THREE.Group) {
  object.userData.baseRotationX = object.rotation.x
  object.userData.baseRotationY = object.rotation.y

  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    child.castShadow = true
    child.receiveShadow = true

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material]

    materials.forEach((material) => {
      if ('envMapIntensity' in material) {
        ;(material as THREE.MeshStandardMaterial).envMapIntensity = 0.85
      }
    })
  })

  return object
}

export function useHero3DScene(
  mode: Mode,
  theme: HeroTheme,
  refs: Refs,
  slides: Slide[],
  t: TFunction,
  showParticles = true
) {
  const currentSlideRef    = useRef(0)
  const transitioningRef   = useRef(false)
  const currentObjRef      = useRef<THREE.Group | null>(null)
  const autoRotateYRef     = useRef(0)
  const mouseRef           = useRef({ x: 0, y: 0 })
  const touchStartYRef     = useRef(0)
  const touchStartXRef     = useRef(0)
  const touchStartTimeRef  = useRef(0)
  const particlesRef       = useRef<THREE.Points | null>(null)
  const haloRef            = useRef<THREE.Group | null>(null)
  const baseRotationYRef   = useRef(0)
  const pointerDownRef     = useRef(false)
  const pointerIdRef       = useRef<number | null>(null)
  const dragDeltaRef       = useRef({ x: 0, y: 0 })
  const userPausedUntilRef = useRef(0)

  useEffect(() => {
    const root       = refs.rootRef.current
    const canvas     = refs.canvasRef.current
    const eyebrowEl  = refs.eyebrowRef.current
    const titleEl    = refs.titleRef.current
    const descEl     = refs.descRef.current
    const btnsEl     = refs.btnsRef.current
    const stepsEl    = refs.stepsRef.current
    const progressEl = refs.progressRef.current
    // const statsEl    = refs.statsRef.current

    if (!root || !canvas || !eyebrowEl || !titleEl || !descEl || !btnsEl || !stepsEl || !progressEl) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Échelle de l'objet 3D héro — volontairement plus grande que l'ancienne
    // valeur (0.56) pour que le modèle occupe davantage la scène et que ses
    // détails (LEDs, accents) restent lisibles à la taille du canvas.
    const HERO_OBJECT_SCALE = 0.74

    // ── CSS variables ─────────────────────────────────────────────────────
    root.style.setProperty('--hero-bg',                  theme.bg)
    root.style.setProperty('--hero-title',               theme.title)
    root.style.setProperty('--hero-desc',                theme.desc)
    root.style.setProperty('--hero-eyebrow',             theme.eyebrow)
    root.style.setProperty('--hero-secondary-bg',        theme.secondaryBg)
    root.style.setProperty('--hero-secondary-text',      theme.secondaryText)
    root.style.setProperty('--hero-secondary-border',    theme.secondaryBorder)
    root.style.setProperty('--hero-dot',                 theme.dot)
    root.style.setProperty('--hero-scroll-text',         theme.scrollText)
    root.style.setProperty('--hero-scroll-line',         theme.scrollLine)
    root.style.setProperty('--hero-secondary-hover',     theme.secondaryHover)
    root.style.setProperty('--hero-overlay-top-strong',  theme.overlayTopStrong)
    root.style.setProperty('--hero-overlay-top-soft',    theme.overlayTopSoft)
    root.style.setProperty('--hero-overlay-bottom-soft', theme.overlayBottomSoft)

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(theme.rendererClear, 0)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    // Activer tone mapping pour un rendu plus réaliste
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = mode === 'dark' ? 1.08 : 1.16

    // ── Scène ─────────────────────────────────────────────────────────────
    const scene  = new THREE.Scene()
    scene.fog    = new THREE.Fog(theme.fogColor, theme.sceneFogNear, theme.sceneFogFar)

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
    camera.position.set(0, 0.06, 6.05)
    const cameraLookAt = new THREE.Vector3(0, -0.04, 0)

    // ── Post-processing — bloom subtil sur les surfaces émissives (LEDs,
    // accents) pour donner un rendu "premium" à l'objet 3D héro.
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(canvas.clientWidth || 1, canvas.clientHeight || 1),
      mode === 'dark' ? 0.62 : 0.34,
      0.55,
      mode === 'dark' ? 0.74 : 0.86
    )
    composer.addPass(bloomPass)
    composer.addPass(new OutputPass())

    // ── Éclairage amélioré ────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, theme.ambientIntensity)
    scene.add(ambient)

    const hemisphereLight = new THREE.HemisphereLight(
      mode === 'dark' ? 0x8098ff : 0xffffff,
      mode === 'dark' ? 0x070708 : 0xdde6f2,
      mode === 'dark' ? 0.42 : 0.7
    )
    scene.add(hemisphereLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, theme.dirIntensity)
    dirLight.position.set(3, 5, 3)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(512, 512)
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far  = 20
    scene.add(dirLight)

    // Lumière principale couleur slide
    const pointLight = new THREE.PointLight(0xef9f27, theme.pointIntensity, 12)
    pointLight.position.set(-3, 2, 2)
    scene.add(pointLight)

    // Lumière de remplissage froide (contre-jour) — améliore le volume 3D
    const fillLight = new THREE.PointLight(
      mode === 'dark' ? 0x2244aa : 0xaabbff,
      mode === 'dark' ? 0.35 : 0.2,
      18
    )
    fillLight.position.set(4, -2, -3)
    scene.add(fillLight)

    // Lumière de bord (rim light) — donne de la profondeur
    const rimLight = new THREE.DirectionalLight(
      mode === 'dark' ? 0x4466cc : 0xffeedd,
      mode === 'dark' ? 0.28 : 0.15
    )
    rimLight.position.set(-4, 1, -4)
    scene.add(rimLight)

    const studioLight = new THREE.RectAreaLight(
      mode === 'dark' ? 0xffffff : 0xf8fbff,
      mode === 'dark' ? 1.4 : 2.0,
      4.5,
      2.8
    )
    studioLight.position.set(0, 3.4, 3.6)
    studioLight.lookAt(0, 0, 0)
    scene.add(studioLight)

    const floorCanvas = document.createElement('canvas')
    floorCanvas.width = 512
    floorCanvas.height = 512
    paintFloorCanvas(floorCanvas, slides[0].color, mode)
    const floorTexture = new THREE.CanvasTexture(floorCanvas)
    floorTexture.colorSpace = THREE.SRGBColorSpace

    const floorMaterial = new THREE.MeshBasicMaterial({
      map: floorTexture,
      transparent: true,
      opacity: mode === 'dark' ? 0.72 : 0.58,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const floorMesh = new THREE.Mesh(new THREE.CircleGeometry(3.2, 96), floorMaterial)
    floorMesh.rotation.x = -Math.PI / 2
    floorMesh.position.set(0, -1.72, -0.22)
    scene.add(floorMesh)

    const horizonMaterial = new THREE.MeshBasicMaterial({
      color: slides[0].color,
      transparent: true,
      opacity: mode === 'dark' ? 0.16 : 0.09,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const horizonRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.42, 0.006, 8, 160),
      horizonMaterial
    )
    horizonRing.rotation.x = Math.PI * 0.55
    horizonRing.position.set(0, -0.06, -1.28)
    scene.add(horizonRing)

    let animationId = 0
    let clock       = 0
    const timers:    ReturnType<typeof setTimeout>[]  = []
    const intervals: ReturnType<typeof setInterval>[] = []

    let autoSlideInterval: ReturnType<typeof setInterval> | null = null

    // ── Shadow helper ─────────────────────────────────────────────────────
    function addShadow(g: THREE.Group, scaleX = 1.4, scaleZ = 0.55, offsetY = -1.7) {
      const size = 128
      const cvs  = document.createElement('canvas')
      cvs.width  = size
      cvs.height = size
      const ctx  = cvs.getContext('2d')!
      const cx   = size / 2
      const cy   = size / 2
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2)
      grad.addColorStop(0,    mode === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.2)')
      grad.addColorStop(0.4,  mode === 'dark' ? 'rgba(0,0,0,0.3)'  : 'rgba(0,0,0,0.1)')
      grad.addColorStop(0.75, 'rgba(0,0,0,0.06)')
      grad.addColorStop(1,    'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.ellipse(cx, cy, size / 2, size / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      const tex    = new THREE.CanvasTexture(cvs)
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
      )
      shadow.rotation.x = -Math.PI / 2
      shadow.scale.set(scaleX * 2, scaleZ * 2, 1)
      shadow.position.y = offsetY
      g.add(shadow)
    }

    // ── Rendu UI ──────────────────────────────────────────────────────────
    function renderButtons(slideIndex: number) {
      btnsEl!.innerHTML = ''
      slides[slideIndex].btns.forEach((btn) => {
        const link = document.createElement('a')
        link.className = `${refs.styles.heroBtn} ${btn.cls === 'primary' ? refs.styles.primary : refs.styles.secondary}`
        link.href = btn.href
        link.textContent = btn.label
        btnsEl!.appendChild(link)
      })
    }

    function setFeatureContent(slideIndex: number) {
      const features = getFeatureContent(slides[slideIndex], t)
      const set = (ref: React.RefObject<HTMLElement | null>, val: string) => {
        if (ref.current) ref.current.textContent = val
      }
      set(refs.topLeftTitleRef,    features.tl.title)
      set(refs.topLeftTextRef,     features.tl.text)
      set(refs.topRightTitleRef,   features.tr.title)
      set(refs.topRightTextRef,    features.tr.text)
      set(refs.bottomLeftTitleRef, features.bl.title)
      set(refs.bottomLeftTextRef,  features.bl.text)
      set(refs.bottomRightTitleRef, features.br.title)
      set(refs.bottomRightTextRef,  features.br.text)
    }

    const textEls = () => [
      eyebrowEl, titleEl, descEl, btnsEl,
      refs.topLeftTitleRef.current, refs.topLeftTextRef.current,
      refs.topRightTitleRef.current, refs.topRightTextRef.current,
      refs.bottomLeftTitleRef.current, refs.bottomLeftTextRef.current,
      refs.bottomRightTitleRef.current, refs.bottomRightTextRef.current,
    ].filter(Boolean) as HTMLElement[]

    function animateTextOut() {
      textEls().forEach((el) => {
        el.style.opacity   = '0'
        el.style.transform = 'translateY(16px)'
      })
    }

    function animateTextIn() {
      textEls().forEach((el, i) => {
        timers.push(setTimeout(() => {
          el.style.opacity   = '1'
          el.style.transform = 'translateY(0)'
        }, i * 60))
      })
    }

    function setContent(idx: number, instant: boolean) {
      const s = slides[idx]
      if (!instant) animateTextOut()

      const applyContent = () => {
        eyebrowEl!.textContent = s.eyebrow
        titleEl!.innerHTML     = s.title
        descEl!.textContent    = s.desc
        renderButtons(idx)
        setFeatureContent(idx)

        if (!instant) {
          animateTextIn()
        } else {
          textEls().forEach((el) => { el.style.opacity = '1'; el.style.transform = 'translateY(0)' })
        }

        progressEl!.style.width = `${(idx / (slides.length - 1)) * 100}%`
        Array.from(stepsEl!.children).forEach((child, i) => {
          child.classList.toggle(refs.styles.active, i === idx)
        })
      }

      if (instant) {
        applyContent()
      } else {
        timers.push(setTimeout(applyContent, 300))
      }
    }

    // ── Particules ────────────────────────────────────────────────────────
    function updateParticleSystem(color: number) {
      if (particlesRef.current) {
        ;(particlesRef.current.material as THREE.PointsMaterial).color.setHex(color)
        particlesRef.current.visible = showParticles
      }
      if (haloRef.current) {
        haloRef.current.visible = showParticles
        haloRef.current.traverse((child) => {
          if (child instanceof THREE.Sprite) {
            ;(child.material as THREE.SpriteMaterial).color.setHex(color)
          }
        })
      }
    }

    function updateSceneAccent(color: number) {
      updateParticleSystem(color)
      paintFloorCanvas(floorCanvas, color, mode)
      floorTexture.needsUpdate = true
      horizonMaterial.color.setHex(color)
    }

    // ── Transition slide — améliorée ──────────────────────────────────────
    function transitionTo(idx: number) {
      if (transitioningRef.current || idx === currentSlideRef.current) return
      transitioningRef.current = true

      const s = slides[idx]
      setContent(idx, false)
      updateSceneAccent(s.color)

      const newObj = prepareHeroObject(makeObject(s.object, s.color, mode, addShadow))
      newObj.scale.set(0, 0, 0)
      newObj.position.set(0, 0, 0)
      scene.add(newObj)

      const previousObj = currentObjRef.current
      const exitDir     = idx > currentSlideRef.current ? 1 : -1

      // Sortie objet précédent
      if (previousObj) {
        let t = 0
        const exitAngleTarget = exitDir * Math.PI * 0.6
        const initialRotY     = previousObj.rotation.y

        const fade = setInterval(() => {
          t += 0.04
          const ease    = easeInOutCubic(Math.min(t, 1))
          const scaleVal = Math.max(0, 1 - ease * 1.15)
          previousObj.rotation.y = initialRotY + exitAngleTarget * ease
          previousObj.scale.setScalar(HERO_OBJECT_SCALE * scaleVal)
          previousObj.position.z = -ease * 1.2
          if (t >= 1) { scene.remove(previousObj); clearInterval(fade) }
        }, 16)
        intervals.push(fade)
      }

      // Entrée nouvel objet avec easeOutBack
      let tin = 0
      const finalScale = HERO_OBJECT_SCALE
      const enter = setInterval(() => {
        tin += 0.032
        const clamped = Math.min(tin, 1)
        const ease = easeOutCubic(clamped)
        newObj.scale.setScalar(Math.max(0, ease * finalScale))
        newObj.rotation.y  = (newObj.userData.baseRotationY || 0) + (1 - clamped) * -exitDir * Math.PI * 0.18
        newObj.position.z  = (1 - clamped) * 0.52
        newObj.position.y  = (1 - clamped) * -0.08
        if (tin >= 1) {
          newObj.scale.setScalar(finalScale)
          newObj.rotation.y = newObj.userData.baseRotationY || 0
          newObj.position.z = 0
          newObj.position.y = 0
          clearInterval(enter)
          transitioningRef.current = false
        }
      }, 16)
      intervals.push(enter)

      currentObjRef.current   = newObj
      currentSlideRef.current = idx

      // Flash couleur slide sur les lumières
      pointLight.color.setHex(s.color)
      pointLight.intensity = theme.pointIntensity * 2.2
      dirLight.color.setHex(s.color)
      dirLight.intensity = mode === 'dark' ? 0.55 : 0.72
      fillLight.color.setHex(s.color)
      fillLight.intensity = mode === 'dark' ? 0.5 : 0.25

      timers.push(setTimeout(() => {
        dirLight.color.setHex(0xffffff)
        dirLight.intensity  = theme.dirIntensity
        pointLight.intensity = theme.pointIntensity
        fillLight.color.setHex(mode === 'dark' ? 0x2244aa : 0xaabbff)
        fillLight.intensity  = mode === 'dark' ? 0.35 : 0.2
      }, 900))
    }

    // ── Resize ────────────────────────────────────────────────────────────
    function resize() {
      const w = canvas!.clientWidth
      const h = canvas!.clientHeight
      renderer.setSize(w, h, false)
      composer.setSize(w, h)
      bloomPass.resolution.set(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    // ── Navigation dots ───────────────────────────────────────────────────
    stepsEl!.innerHTML = ''
    slides.forEach((_, i) => {
      const dot    = document.createElement('button')
      dot.type = 'button'
      dot.className = `${refs.styles.heroDot}${i === 0 ? ` ${refs.styles.active}` : ''}`
      dot.setAttribute(
        'aria-label',
        String(t('homeHero.controls.slide', {
          index: i + 1,
          defaultValue: `Aller au visuel ${i + 1}`,
        }))
      )
      dot.onclick   = () => transitionTo(i)
      stepsEl!.appendChild(dot)
    })

    // ── Stats counters ────────────────────────────────────────────────────
    // if (statsEl) {
    //   statsEl.innerHTML = ''
    //   STATS.forEach((stat, idx) => {
    //     const item      = document.createElement('div')
    //     item.className  = refs.styles.statItem
    //     const valueWrap = document.createElement('div')
    //     valueWrap.className = refs.styles.statValue
    //     const num = document.createElement('span')
    //     num.className = refs.styles.statNumber
    //     num.textContent = '0'
    //     const suf = document.createElement('span')
    //     suf.className   = refs.styles.statSuffix
    //     suf.textContent = stat.suffix
    //     const label = document.createElement('div')
    //     label.className  = refs.styles.statLabel
    //     label.textContent = stat.label
    //     valueWrap.appendChild(num)
    //     valueWrap.appendChild(suf)
    //     item.appendChild(valueWrap)
    //     item.appendChild(label)
    //     statsEl.appendChild(item)
    //     timers.push(setTimeout(() => animateCounter(num, stat.value, 1400), 400 + idx * 120))
    //   })
    // }

    // ── Particules — ajout unique ─────────────────────────────────────────
    const particles = buildParticleSystem(slides[0].color, mode)
    const halo      = buildHaloMesh(slides[0].color, mode)
    particles.visible = showParticles
    halo.visible      = showParticles
    scene.add(particles)
    scene.add(halo)
    particlesRef.current = particles
    haloRef.current      = halo

    // ── Events ────────────────────────────────────────────────────────────
    // const onWheel = (e: WheelEvent) => {
    //   if (Math.abs(e.deltaY) < 20) return
    //   const current = currentSlideRef.current
    //   if (e.deltaY > 0 && current === SLIDES.length - 1) return
    //   if (e.deltaY < 0 && current === 0) return
    //   e.preventDefault()
    //   if (scrollLockRef.current || transitioningRef.current) return
    //   scrollLockRef.current = true
    //   timers.push(setTimeout(() => { scrollLockRef.current = false }, 900))
    //   const nextIndex = e.deltaY > 0 ? current + 1 : current - 1
    //   if (nextIndex < 0 || nextIndex >= SLIDES.length) return
    //   transitionTo(nextIndex)
    // }

    // const onTouchStart = (e: TouchEvent) => {
    //   touchStartYRef.current    = e.touches[0].clientY
    //   touchStartXRef.current    = e.touches[0].clientX
    //   touchStartTimeRef.current = Date.now()
    // }

    // const onTouchMove = (e: TouchEvent) => {
    //   const dy = touchStartYRef.current - e.touches[0].clientY
    //   const dx = Math.abs(touchStartXRef.current - e.touches[0].clientX)
    //   if (dx > Math.abs(dy) * 1.5) return
    //   const current = currentSlideRef.current
    //   if (dy > 0 && current === SLIDES.length - 1) return
    //   if (dy < 0 && current === 0) return
    //   e.preventDefault()
    // }

    // const onTouchEnd = (e: TouchEvent) => {
    //   const dy       = touchStartYRef.current - e.changedTouches[0].clientY
    //   const dx       = Math.abs(touchStartXRef.current - e.changedTouches[0].clientX)
    //   const dt       = Date.now() - touchStartTimeRef.current
    //   const velocity = Math.abs(dy) / dt
    //   if (dx > Math.abs(dy) * 1.5) return
    //   const current = currentSlideRef.current
    //   if (dy > 0 && current === SLIDES.length - 1) return
    //   if (dy < 0 && current === 0) return
    //   const threshold = velocity > 0.4 ? 30 : 60
    //   if (Math.abs(dy) < threshold) return
    //   if (dy > 0) transitionTo(current + 1)
    //   else        transitionTo(current - 1)
    // }

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x =  (e.clientX / window.innerWidth  - 0.5) * 2
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }

    const pauseAutoSlide = (duration = 7000) => {
      userPausedUntilRef.current = Date.now() + duration
    }

    const updatePointerParallax = (clientX: number, clientY: number) => {
      mouseRef.current.x =  (clientX / window.innerWidth  - 0.5) * 2
      mouseRef.current.y = -(clientY / window.innerHeight - 0.5) * 2
    }

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('a,button')) return
      if (e.pointerType === 'mouse' && e.button !== 0) return

      pointerDownRef.current = true
      pointerIdRef.current = e.pointerId
      touchStartXRef.current = e.clientX
      touchStartYRef.current = e.clientY
      touchStartTimeRef.current = Date.now()
      dragDeltaRef.current = { x: 0, y: 0 }
      root.dataset.dragging = 'true'
      root.setPointerCapture?.(e.pointerId)
      pauseAutoSlide()
    }

    const onPointerMove = (e: PointerEvent) => {
      updatePointerParallax(e.clientX, e.clientY)
      if (!pointerDownRef.current || pointerIdRef.current !== e.pointerId) return

      const dx = e.clientX - touchStartXRef.current
      const dy = e.clientY - touchStartYRef.current
      const lastX = dragDeltaRef.current.x
      dragDeltaRef.current = { x: dx, y: dy }
      autoRotateYRef.current += (dx - lastX) * 0.0009
    }

    const finishPointerGesture = (e: PointerEvent) => {
      if (!pointerDownRef.current || pointerIdRef.current !== e.pointerId) return

      pointerDownRef.current = false
      pointerIdRef.current = null
      root.dataset.dragging = 'false'
      root.releasePointerCapture?.(e.pointerId)

      const { x, y } = dragDeltaRef.current
      const elapsed = Math.max(1, Date.now() - touchStartTimeRef.current)
      const velocity = Math.abs(x) / elapsed
      const threshold = velocity > 0.45 ? 34 : 78
      const isHorizontal = Math.abs(x) > Math.abs(y) * 1.25

      if (!isHorizontal || Math.abs(x) < threshold) return

      const current = currentSlideRef.current
      const next = x < 0
        ? Math.min(slides.length - 1, current + 1)
        : Math.max(0, current - 1)

      if (next !== current) transitionTo(next)
    }

    window.addEventListener('resize',     resize)
    window.addEventListener('mousemove',  onMouseMove)
    root.addEventListener('pointerdown',  onPointerDown)
    root.addEventListener('pointermove',  onPointerMove)
    root.addEventListener('pointerup',    finishPointerGesture)
    root.addEventListener('pointercancel', finishPointerGesture)
    // window.addEventListener('wheel',      onWheel, { passive: false })
    // root.addEventListener('touchstart',   onTouchStart, { passive: true })
    // root.addEventListener('touchmove',    onTouchMove,  { passive: false })
    // root.addEventListener('touchend',     onTouchEnd,   { passive: true })

    resize()

    // ── Objet initial ─────────────────────────────────────────────────────
    currentObjRef.current = prepareHeroObject(makeObject(slides[0].object, slides[0].color, mode, addShadow))
    currentObjRef.current.position.set(0, 0, 0)
    currentObjRef.current.scale.setScalar(HERO_OBJECT_SCALE)
    scene.add(currentObjRef.current)
    setContent(0, true)
    if (!prefersReducedMotion) {
      autoSlideInterval = setInterval(() => {
        if (transitioningRef.current) return
        if (Date.now() < userPausedUntilRef.current) return

        const current = currentSlideRef.current
        const next = current >= slides.length - 1 ? 0 : current + 1

        transitionTo(next)
      }, 5000)
    }
    // ── Boucle d'animation — sans doublons ────────────────────────────────
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      clock += 0.008

      const obj = currentObjRef.current

      // Rotation et flottement de l'objet principal
      if (obj && !transitioningRef.current && !prefersReducedMotion) {
        const baseX = obj.userData.baseRotationX || 0
        const baseY = obj.userData.baseRotationY || 0
        baseRotationYRef.current += pointerDownRef.current ? 0.001 : 0.0022
        const targetRotY = baseY + baseRotationYRef.current + mouseRef.current.x * 0.16
        const targetRotX = baseX + mouseRef.current.y * 0.075 + Math.sin(clock * 0.35) * 0.015

        obj.rotation.y += (targetRotY - obj.rotation.y) * 0.045 + autoRotateYRef.current
        obj.rotation.x += (targetRotX - obj.rotation.x) * 0.055
        obj.scale.setScalar(HERO_OBJECT_SCALE + Math.sin(clock * 1.1) * 0.009)
        obj.position.y   = Math.sin(clock * 0.7) * 0.055
        obj.position.x   = mouseRef.current.x * 0.035 + Math.sin(clock * 0.45) * 0.014
        obj.position.z   = Math.max(obj.position.z, 0)
        autoRotateYRef.current *= 0.9
      } else if (obj && !prefersReducedMotion) {
        obj.position.y = Math.sin(clock * 0.7) * 0.055
      }

      camera.position.x += (mouseRef.current.x * 0.12 - camera.position.x) * 0.035
      camera.position.y += (0.06 + mouseRef.current.y * 0.055 - camera.position.y) * 0.035
      camera.lookAt(cameraLookAt)

      // Particules — un seul bloc, avec garde showParticles
      if (particlesRef.current) {
        particlesRef.current.visible = showParticles
        if (showParticles && !prefersReducedMotion) {
          particlesRef.current.rotation.y += 0.0015
          particlesRef.current.rotation.x  = Math.sin(clock * 0.3) * 0.08
          const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
          for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] += Math.sin(clock * 1.2 + i) * 0.0004
          }
          particlesRef.current.geometry.attributes.position.needsUpdate = true
        }
      }

      // Halo — un seul bloc
      if (haloRef.current) {
        haloRef.current.visible = showParticles
        if (showParticles && !prefersReducedMotion) {
          haloRef.current.scale.setScalar(1 + Math.sin(clock * 0.8) * 0.03)
          let spriteIndex = 0
          haloRef.current.traverse((child) => {
            if (child instanceof THREE.Sprite) {
              const mat         = child.material as THREE.SpriteMaterial
              const baseOpacity = spriteIndex === 0
                ? (mode === 'dark' ? 0.22 : 0.12)
                : spriteIndex === 1
                  ? (mode === 'dark' ? 0.12 : 0.07)
                  : (mode === 'dark' ? 0.08 : 0.05)
              mat.opacity = baseOpacity + Math.sin(clock * 1.1 + spriteIndex * 0.8) * 0.015
              spriteIndex++
            }
          })
        }
      }

      // Lumière orbitale
      if (!prefersReducedMotion) {
        floorMesh.rotation.z += 0.00045
        horizonRing.rotation.z -= 0.0008
        horizonRing.scale.setScalar(1 + Math.sin(clock * 0.55) * 0.018)

        obj?.traverse((child) => {
          if (child.name === 'shieldRadar' || child.name === 'shieldRadarLine') {
            child.rotation.z += 0.018
          }
        })

        pointLight.position.x = Math.sin(clock * 0.5) * 3
        pointLight.position.y = Math.cos(clock * 0.4) * 2
        fillLight.position.x  = Math.sin(clock * 0.3 + Math.PI) * 4
        fillLight.position.y  = Math.cos(clock * 0.25) * 2
      }

      composer.render()
    }

    animate()

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationId)
      timers.forEach(clearTimeout)
      intervals.forEach(clearInterval)

      window.removeEventListener('resize',    resize)
      window.removeEventListener('mousemove', onMouseMove)
      root.removeEventListener('pointerdown', onPointerDown)
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerup', finishPointerGesture)
      root.removeEventListener('pointercancel', finishPointerGesture)
      delete root.dataset.dragging
      // window.removeEventListener('wheel',     onWheel)
      // root.removeEventListener('touchstart',  onTouchStart)
      // root.removeEventListener('touchmove',   onTouchMove)
      // root.removeEventListener('touchend',    onTouchEnd)
      if (autoSlideInterval) clearInterval(autoSlideInterval)
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        mesh.geometry?.dispose()
        if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose())
        else if (mesh.material) (mesh.material as THREE.Material).dispose()
      })

      floorTexture.dispose()
      composer.dispose()
      renderer.dispose()
    }
  }, [mode, theme, refs, slides, t, showParticles])
}
