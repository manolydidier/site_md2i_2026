'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { SLIDES, STATS } from '../herosection/data/slides'
import { animateCounter, easeInOutCubic, easeOutBack } from '../herosection/utils/animations'
import { getFeatureContent } from '../herosection/utils/featureContent'
import { makeObject } from '../herosection/three/builders'
import { buildHaloMesh, buildParticleSystem } from '../herosection/scene/createParticles'
import type { HeroTheme, Mode } from '../herosection/types'

type Refs = {
  rootRef: React.RefObject<HTMLDivElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  eyebrowRef: React.RefObject<HTMLDivElement | null>
  titleRef: React.RefObject<HTMLHeadingElement | null>
  descRef: React.RefObject<HTMLParagraphElement | null>
  btnsRef: React.RefObject<HTMLDivElement | null>
  stepsRef: React.RefObject<HTMLDivElement | null>
  progressRef: React.RefObject<HTMLDivElement | null>
  statsRef: React.RefObject<HTMLDivElement | null>
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

export function useHero3DScene(mode: Mode, theme: HeroTheme, refs: Refs,showParticles = true) {
  const currentSlideRef = useRef(0)
  const transitioningRef = useRef(false)
  const currentObjRef = useRef<THREE.Group | null>(null)
  const autoRotateYRef = useRef(0)
  const mouseRef = useRef({ x: 0, y: 0 })

  const touchStartYRef = useRef(0)
  const touchStartXRef = useRef(0)
  const touchStartTimeRef = useRef(0)
  const scrollLockRef = useRef(false)

  const particlesRef = useRef<THREE.Points | null>(null)
  const haloRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    const root = refs.rootRef.current
    const canvas = refs.canvasRef.current
    const eyebrowEl = refs.eyebrowRef.current
    const titleEl = refs.titleRef.current
    const descEl = refs.descRef.current
    const btnsEl = refs.btnsRef.current
    const stepsEl = refs.stepsRef.current
    const progressEl = refs.progressRef.current
    const statsEl = refs.statsRef.current

    if (!root || !canvas || !eyebrowEl || !titleEl || !descEl || !btnsEl || !stepsEl || !progressEl) {
      return
    }

    root.style.setProperty('--hero-bg', theme.bg)
    root.style.setProperty('--hero-title', theme.title)
    root.style.setProperty('--hero-desc', theme.desc)
    root.style.setProperty('--hero-eyebrow', theme.eyebrow)
    root.style.setProperty('--hero-secondary-bg', theme.secondaryBg)
    root.style.setProperty('--hero-secondary-text', theme.secondaryText)
    root.style.setProperty('--hero-secondary-border', theme.secondaryBorder)
    root.style.setProperty('--hero-dot', theme.dot)
    root.style.setProperty('--hero-scroll-text', theme.scrollText)
    root.style.setProperty('--hero-scroll-line', theme.scrollLine)
    root.style.setProperty('--hero-secondary-hover', theme.secondaryHover)
    root.style.setProperty('--hero-overlay-top-strong', theme.overlayTopStrong)
    root.style.setProperty('--hero-overlay-top-soft', theme.overlayTopSoft)
    root.style.setProperty('--hero-overlay-bottom-soft', theme.overlayBottomSoft)

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(theme.rendererClear, 0)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(theme.fogColor, theme.sceneFogNear, theme.sceneFogFar)

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
    camera.position.set(0, 0, 5.8)

    const ambient = new THREE.AmbientLight(0xffffff, theme.ambientIntensity)
    scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xffffff, theme.dirIntensity)
    dirLight.position.set(3, 5, 3)
    scene.add(dirLight)

    const pointLight = new THREE.PointLight(0xef9f27, theme.pointIntensity, 12)
    pointLight.position.set(-3, 2, 2)
    scene.add(pointLight)

    let animationId = 0
    let clock = 0
    const timers: ReturnType<typeof setTimeout>[] = []
    const intervals: ReturnType<typeof setInterval>[] = []

    function addShadow(g: THREE.Group, scaleX = 1.4, scaleZ = 0.55, offsetY = -1.7) {
      const size = 128
      const cvs = document.createElement('canvas')
      cvs.width = size
      cvs.height = size
      const ctx = cvs.getContext('2d')!
      const cx = size / 2
      const cy = size / 2
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2)

      grad.addColorStop(0, mode === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.2)')
      grad.addColorStop(0.4, mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)')
      grad.addColorStop(0.75, 'rgba(0,0,0,0.06)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')

      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.ellipse(cx, cy, size / 2, size / 2, 0, 0, Math.PI * 2)
      ctx.fill()

      const tex = new THREE.CanvasTexture(cvs)
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      )

      shadow.rotation.x = -Math.PI / 2
      shadow.scale.set(scaleX * 2, scaleZ * 2, 1)
      shadow.position.y = offsetY
      g.add(shadow)
    }

    function renderButtons(slideIndex: number) {
      btnsEl.innerHTML = ''
      const slide = SLIDES[slideIndex]

      slide.btns.forEach((btn) => {
        const button = document.createElement('button')
        button.className = `${refs.styles.heroBtn} ${
          btn.cls === 'primary' ? refs.styles.primary : refs.styles.secondary
        }`
        button.textContent = btn.label
        btnsEl.appendChild(button)
      })
    }

    function setFeatureContent(slideIndex: number) {
      const slide = SLIDES[slideIndex]
      const features = getFeatureContent(slide)

      if (refs.topLeftTitleRef.current) refs.topLeftTitleRef.current.textContent = features.tl.title
      if (refs.topLeftTextRef.current) refs.topLeftTextRef.current.textContent = features.tl.text
      if (refs.topRightTitleRef.current) refs.topRightTitleRef.current.textContent = features.tr.title
      if (refs.topRightTextRef.current) refs.topRightTextRef.current.textContent = features.tr.text
      if (refs.bottomLeftTitleRef.current) refs.bottomLeftTitleRef.current.textContent = features.bl.title
      if (refs.bottomLeftTextRef.current) refs.bottomLeftTextRef.current.textContent = features.bl.text
      if (refs.bottomRightTitleRef.current) refs.bottomRightTitleRef.current.textContent = features.br.title
      if (refs.bottomRightTextRef.current) refs.bottomRightTextRef.current.textContent = features.br.text
    }

    function animateTextOut() {
      ;[
        eyebrowEl,
        titleEl,
        descEl,
        btnsEl,
        refs.topLeftTitleRef.current,
        refs.topLeftTextRef.current,
        refs.topRightTitleRef.current,
        refs.topRightTextRef.current,
        refs.bottomLeftTitleRef.current,
        refs.bottomLeftTextRef.current,
        refs.bottomRightTitleRef.current,
        refs.bottomRightTextRef.current,
      ].forEach((el) => {
        if (!el) return
        el.style.opacity = '0'
        el.style.transform = 'translateY(16px)'
      })
    }

    function animateTextIn() {
      ;[
        eyebrowEl,
        titleEl,
        descEl,
        btnsEl,
        refs.topLeftTitleRef.current,
        refs.topLeftTextRef.current,
        refs.topRightTitleRef.current,
        refs.topRightTextRef.current,
        refs.bottomLeftTitleRef.current,
        refs.bottomLeftTextRef.current,
        refs.bottomRightTitleRef.current,
        refs.bottomRightTextRef.current,
      ].forEach((el, i) => {
        if (!el) return
        timers.push(
          setTimeout(() => {
            el.style.opacity = '1'
            el.style.transform = 'translateY(0)'
          }, i * 60)
        )
      })
    }

    function setContent(idx: number, instant: boolean) {
      const s = SLIDES[idx]

      if (!instant) animateTextOut()

      timers.push(
        setTimeout(() => {
          eyebrowEl.textContent = s.eyebrow
          titleEl.innerHTML = s.title
          descEl.textContent = s.desc

          renderButtons(idx)
          setFeatureContent(idx)

          if (!instant) animateTextIn()
          else {
            ;[
              eyebrowEl,
              titleEl,
              descEl,
              btnsEl,
              refs.topLeftTitleRef.current,
              refs.topLeftTextRef.current,
              refs.topRightTitleRef.current,
              refs.topRightTextRef.current,
              refs.bottomLeftTitleRef.current,
              refs.bottomLeftTextRef.current,
              refs.bottomRightTitleRef.current,
              refs.bottomRightTextRef.current,
            ].forEach((el) => {
              if (!el) return
              el.style.opacity = '1'
              el.style.transform = 'translateY(0)'
            })
          }

          progressEl.style.width = `${(idx / (SLIDES.length - 1)) * 100}%`
          Array.from(stepsEl.children).forEach((child, i) => {
            child.classList.toggle(refs.styles.active, i === idx)
          })
        }, instant ? 0 : 300)
      )
    }



function updateParticleSystem(color: number) {
  if (particlesRef.current) {
    ;(particlesRef.current.material as THREE.PointsMaterial).color.setHex(color)
    particlesRef.current.visible = showParticles
  }

  if (haloRef.current) {
    haloRef.current.visible = showParticles

    haloRef.current.traverse((child) => {
      if (child instanceof THREE.Sprite) {
        const mat = child.material as THREE.SpriteMaterial
        mat.color.setHex(color)
      }
    })
  }
}

    function transitionTo(idx: number) {
      if (transitioningRef.current || idx === currentSlideRef.current) return

      transitioningRef.current = true

      const s = SLIDES[idx]
      setContent(idx, false)
      updateParticleSystem(s.color)

      const newObj = makeObject(s.object, s.color, mode, addShadow)
      newObj.scale.set(0, 0, 0)
      newObj.position.set(0, 0, 0)
      scene.add(newObj)

      const previousObj = currentObjRef.current
      const exitDir = idx > currentSlideRef.current ? 1 : -1

      if (previousObj) {
        let t = 0
        const exitAngleTarget = exitDir * Math.PI * 0.6
        const initialRotY = previousObj.rotation.y

        const fade = setInterval(() => {
          t += 0.04
          const ease = easeInOutCubic(Math.min(t, 1))
          const scaleVal = Math.max(0, 1 - ease * 1.15)

          previousObj.rotation.y = initialRotY + exitAngleTarget * ease
          previousObj.scale.setScalar(0.56 * scaleVal)
          previousObj.position.z = -ease * 1.2

          if (t >= 1) {
            scene.remove(previousObj)
            clearInterval(fade)
          }
        }, 16)

        intervals.push(fade)
      }

      let tin = 0
      const finalScale = 0.56
      const enter = setInterval(() => {
        tin += 0.032
        const ease = easeOutBack(Math.min(tin, 1))

        newObj.scale.setScalar(Math.max(0, ease * finalScale))
        newObj.rotation.y = (1 - Math.min(tin, 1)) * -exitDir * Math.PI * 0.35
        newObj.position.z = (1 - Math.min(tin, 1)) * 0.8

        if (tin >= 1) {
          newObj.scale.setScalar(finalScale)
          newObj.rotation.y = 0
          newObj.position.z = 0
          clearInterval(enter)
          transitioningRef.current = false
        }
      }, 16)

      intervals.push(enter)

      currentObjRef.current = newObj
      currentSlideRef.current = idx

      pointLight.color.setHex(s.color)
      pointLight.intensity = theme.pointIntensity * 2.2
      dirLight.color.setHex(s.color)
      dirLight.intensity = mode === 'dark' ? 0.55 : 0.72

      timers.push(
        setTimeout(() => {
          dirLight.color.setHex(0xffffff)
          dirLight.intensity = theme.dirIntensity
          pointLight.intensity = theme.pointIntensity
        }, 900)
      )
    }

    function resize() {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    stepsEl.innerHTML = ''
    SLIDES.forEach((_, i) => {
      const dot = document.createElement('div')
      dot.className = `${refs.styles.heroDot}${i === 0 ? ` ${refs.styles.active}` : ''}`
      dot.onclick = () => transitionTo(i)
      stepsEl.appendChild(dot)
    })

    if (statsEl) {
      statsEl.innerHTML = ''
      STATS.forEach((stat, idx) => {
        const item = document.createElement('div')
        item.className = refs.styles.statItem

        const valueWrap = document.createElement('div')
        valueWrap.className = refs.styles.statValue

        const num = document.createElement('span')
        num.className = refs.styles.statNumber
        num.textContent = '0'

        const suf = document.createElement('span')
        suf.className = refs.styles.statSuffix
        suf.textContent = stat.suffix

        const label = document.createElement('div')
        label.className = refs.styles.statLabel
        label.textContent = stat.label

        valueWrap.appendChild(num)
        valueWrap.appendChild(suf)
        item.appendChild(valueWrap)
        item.appendChild(label)
        statsEl.appendChild(item)

        timers.push(setTimeout(() => animateCounter(num, stat.value, 1400), 400 + idx * 120))
      })
    }

    const particles = buildParticleSystem(SLIDES[0].color, mode)
    const halo = buildHaloMesh(SLIDES[0].color, mode)

    particles.visible = showParticles
halo.visible = showParticles

scene.add(particles)
scene.add(halo)

particlesRef.current = particles
haloRef.current = halo

    scene.add(particles)
    scene.add(halo)
    particlesRef.current = particles
    haloRef.current = halo

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 20) return

      const current = currentSlideRef.current
      const atLast = current === SLIDES.length - 1
      const atFirst = current === 0

      if (e.deltaY > 0 && atLast) return
      if (e.deltaY < 0 && atFirst) return

      e.preventDefault()

      if (scrollLockRef.current || transitioningRef.current) return

      scrollLockRef.current = true
      timers.push(
        setTimeout(() => {
          scrollLockRef.current = false
        }, 900)
      )

      const nextIndex = e.deltaY > 0 ? current + 1 : current - 1

      if (nextIndex < 0 || nextIndex >= SLIDES.length) return

      transitionTo(nextIndex)
    }

    const onTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY
      touchStartXRef.current = e.touches[0].clientX
      touchStartTimeRef.current = Date.now()
    }

    const onTouchMove = (e: TouchEvent) => {
      const dy = touchStartYRef.current - e.touches[0].clientY
      const dx = Math.abs(touchStartXRef.current - e.touches[0].clientX)

      if (dx > Math.abs(dy) * 1.5) return

      const atLast = currentSlideRef.current === SLIDES.length - 1
      const atFirst = currentSlideRef.current === 0

      if (dy > 0 && atLast) return
      if (dy < 0 && atFirst) return

      e.preventDefault()
    }

    const onTouchEnd = (e: TouchEvent) => {
      const dy = touchStartYRef.current - e.changedTouches[0].clientY
      const dx = Math.abs(touchStartXRef.current - e.changedTouches[0].clientX)
      const dt = Date.now() - touchStartTimeRef.current
      const velocity = Math.abs(dy) / dt

      if (dx > Math.abs(dy) * 1.5) return

      const atLast = currentSlideRef.current === SLIDES.length - 1
      const atFirst = currentSlideRef.current === 0

      if (dy > 0 && atLast) return
      if (dy < 0 && atFirst) return

      const threshold = velocity > 0.4 ? 30 : 60
      if (Math.abs(dy) < threshold) return

      if (dy > 0) transitionTo(currentSlideRef.current + 1)
      else transitionTo(currentSlideRef.current - 1)
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('wheel', onWheel, { passive: false })
    root.addEventListener('touchstart', onTouchStart, { passive: true })
    root.addEventListener('touchmove', onTouchMove, { passive: false })
    root.addEventListener('touchend', onTouchEnd, { passive: true })

    resize()

    currentObjRef.current = makeObject(SLIDES[0].object, SLIDES[0].color, mode, addShadow)
    currentObjRef.current.position.set(0, 0, 0)
    currentObjRef.current.scale.setScalar(0.56)
    scene.add(currentObjRef.current)

    setContent(0, true)

    const animate = () => {
        if (particlesRef.current && showParticles) {
  particlesRef.current.rotation.y += 0.0015
  particlesRef.current.rotation.x = Math.sin(clock * 0.3) * 0.08

  const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 1] += Math.sin(clock * 1.2 + i) * 0.0004
  }
  particlesRef.current.geometry.attributes.position.needsUpdate = true
}

if (haloRef.current) {
  haloRef.current.visible = showParticles

  if (showParticles) {
    haloRef.current.scale.setScalar(1 + Math.sin(clock * 0.8) * 0.03)

    let spriteIndex = 0
    haloRef.current.traverse((child) => {
      if (child instanceof THREE.Sprite) {
        const mat = child.material as THREE.SpriteMaterial

        const baseOpacity =
          spriteIndex === 0
            ? mode === 'dark' ? 0.22 : 0.12
            : spriteIndex === 1
              ? mode === 'dark' ? 0.12 : 0.07
              : mode === 'dark' ? 0.08 : 0.05

        mat.opacity = baseOpacity + Math.sin(clock * 1.1 + spriteIndex * 0.8) * 0.015
        spriteIndex++
      }
    })
  }
} 
      animationId = requestAnimationFrame(animate)
      clock += 0.008

      const obj = currentObjRef.current

      if (obj && !transitioningRef.current) {
        autoRotateYRef.current *= 0.94
        obj.rotation.y += autoRotateYRef.current + mouseRef.current.x * 0.003
        obj.rotation.x += (mouseRef.current.y * 0.025 - obj.rotation.x) * 0.04

        const pulseScale = 0.56 + Math.sin(clock * 1.1) * 0.012
        obj.scale.setScalar(pulseScale)

        obj.position.y = Math.sin(clock * 0.7) * 0.07
        obj.position.x = Math.sin(clock * 0.45) * 0.02
        obj.position.z = Math.max(obj.position.z, 0)
      } else if (obj) {
        obj.position.y = Math.sin(clock * 0.7) * 0.07
      }

      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.0015
        particlesRef.current.rotation.x = Math.sin(clock * 0.3) * 0.08

        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += Math.sin(clock * 1.2 + i) * 0.0004
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true
      }

      if (haloRef.current) {
        haloRef.current.scale.setScalar(1 + Math.sin(clock * 0.8) * 0.03)

        let spriteIndex = 0
        haloRef.current.traverse((child) => {
          if (child instanceof THREE.Sprite) {
            const mat = child.material as THREE.SpriteMaterial

            const baseOpacity =
              spriteIndex === 0
                ? mode === 'dark' ? 0.22 : 0.12
                : spriteIndex === 1
                  ? mode === 'dark' ? 0.12 : 0.07
                  : mode === 'dark' ? 0.08 : 0.05

            mat.opacity = baseOpacity + Math.sin(clock * 1.1 + spriteIndex * 0.8) * 0.015
            spriteIndex++
          }
        })
      }

      pointLight.position.x = Math.sin(clock * 0.5) * 3
      pointLight.position.y = Math.cos(clock * 0.4) * 2

      renderer.render(scene, camera)
      autoRotateYRef.current *= 0.98
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      timers.forEach(clearTimeout)
      intervals.forEach(clearInterval)

      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('wheel', onWheel)
      root.removeEventListener('touchstart', onTouchStart)
      root.removeEventListener('touchmove', onTouchMove)
      root.removeEventListener('touchend', onTouchEnd)

      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        mesh.geometry?.dispose()
        if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose())
        else if (mesh.material) (mesh.material as THREE.Material).dispose()
      })

      renderer.dispose()
    }
  }, [ mode, theme, refs, showParticles  ])
}