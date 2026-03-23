import * as THREE from 'three'
import type { Mode } from '../../types'

type AddShadowFn = (
  group: THREE.Group,
  scaleX?: number,
  scaleZ?: number,
  offsetY?: number
) => void

export function buildCube(
  color: number,
  mode: Mode,
  addShadow: AddShadowFn
): THREE.Group {
  const g = new THREE.Group()
  const isDark = mode === 'dark'

  // ── Couleurs thème ────────────────────────────────────────────────────────
  // Dark  : acier anthracite profond + accent couleur slide
  // Light : aluminium brossé clair + accent couleur slide
  const secondColor = isDark ? 0x00ccff : 0x0066cc   // couleur secondaire (bleu cyber)

  // ── Matériaux ─────────────────────────────────────────────────────────────
  const steelMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x18191c : 0xbec4ce,
    metalness: 0.96,
    roughness: 0.10,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    reflectivity: 1,
  })

  const steelEdgeMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x35383d : 0xdce2ec,
    metalness: 1,
    roughness: 0.03,
    clearcoat: 1,
    clearcoatRoughness: 0,
  })

  const panelMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x0e1016 : 0x8a9098,
    metalness: 0.65,
    roughness: 0.30,
    clearcoat: 0.7,
  })

  const blackMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x040405 : 0x2e3138,
    metalness: 0.55,
    roughness: 0.28,
    clearcoat: 0.9,
    clearcoatRoughness: 0.04,
  })

  const accentMat = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.92,
    roughness: 0.04,
    clearcoat: 1,
    emissive: new THREE.Color(color),
    emissiveIntensity: isDark ? 0.55 : 0.18,
  })

  const accent2Mat = new THREE.MeshPhysicalMaterial({
    color: secondColor,
    metalness: 0.88,
    roughness: 0.05,
    clearcoat: 1,
    emissive: new THREE.Color(secondColor),
    emissiveIntensity: isDark ? 0.45 : 0.15,
  })

  const screwMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x555860 : 0xb0b6c2,
    metalness: 1,
    roughness: 0.10,
    clearcoat: 1,
  })

  const rubberMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a0a0a,
    metalness: 0,
    roughness: 0.95,
  })

  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0b840,
    metalness: 1,
    roughness: 0.02,
    clearcoat: 1,
  })

  function ledMat(c: number, intensity: number) {
    return new THREE.MeshStandardMaterial({
      color: c,
      emissive: new THREE.Color(c),
      emissiveIntensity: isDark ? intensity : intensity * 0.38,
      roughness: 0,
      metalness: 0.08,
    })
  }

  // ── CHÂSSIS RACK ──────────────────────────────────────────────────────────
  // Corps principal
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.28, 2.95, 0.98), steelMat)
  g.add(chassis)

  // Bordure avant (liseré brillant)
  const frontBorder = new THREE.Mesh(
    new THREE.BoxGeometry(2.38, 3.02, 0.072),
    steelEdgeMat
  )
  frontBorder.position.z = 0.468
  g.add(frontBorder)

  // Panneau arrière
  const backPanel = new THREE.Mesh(new THREE.BoxGeometry(2.22, 2.88, 0.022), panelMat)
  backPanel.position.z = -0.496
  g.add(backPanel)

  // Liseré couleur primaire en haut du rack
  const topAccentBar = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.018, 0.98), accentMat)
  topAccentBar.position.set(0, 1.484, 0)
  g.add(topAccentBar)

  // Liseré couleur secondaire en bas du rack
  const botAccentBar = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.018, 0.98), accent2Mat)
  botAccentBar.position.set(0, -1.484, 0)
  g.add(botAccentBar)

  // ── RAILS LATÉRAUX AVEC TROUS DE VIS ─────────────────────────────────────
  ;[-1.1, 1.1].forEach((xSide) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.95, 0.17), steelEdgeMat)
    rail.position.set(xSide, 0, 0.37)
    g.add(rail)

    // Oreille de rack
    const flange = new THREE.Mesh(new THREE.BoxGeometry(0.075, 2.95, 0.036), panelMat)
    flange.position.set(xSide, 0, 0.508)
    g.add(flange)

    // Trous de vis (cylindres)
    for (let v = 0; v < 14; v++) {
      const screw = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.18, 10),
        screwMat
      )
      screw.rotation.z = Math.PI / 2
      screw.position.set(xSide, -1.3 + v * 0.2, 0.37)
      g.add(screw)
    }
  })

  // Grilles ventilation latérales droite
  for (let row = 0; row < 11; row++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.038, 0.55), blackMat)
    vent.position.set(1.13, -1.0 + row * 0.22, 0.08)
    g.add(vent)
  }

  // ── PIEDS RÉGLABLES ──────────────────────────────────────────────────────
  ;[[-0.85, -1.5], [0.85, -1.5]].forEach(([px, py]) => {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.07, 12), steelEdgeMat)
    foot.position.set(px, py, 0)
    g.add(foot)
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.018, 12), rubberMat)
    pad.position.set(px, py - 0.044, 0)
    g.add(pad)
  })

  // ── UNITÉS DE RACK ────────────────────────────────────────────────────────
  type UnitType = 'server-blade' | 'server-storage' | 'switch' | 'nas' | 'kvm' | 'blank'

  const units: { y: number; type: UnitType }[] = [
    { y: 1.18, type: 'server-blade' },
    { y: 0.78, type: 'server-blade' },
    { y: 0.38, type: 'nas' },
    { y: -0.02, type: 'switch' },
    { y: -0.42, type: 'switch' },
    { y: -0.82, type: 'kvm' },
    { y: -1.22, type: 'blank' },
  ]

  units.forEach(({ y, type }, idx) => {
    const UH = 0.365
    const unitW = 2.08

    // Corps unité
    const body = new THREE.Mesh(new THREE.BoxGeometry(unitW, UH - 0.012, 0.86), blackMat)
    body.position.set(0, y, 0.022)
    g.add(body)

    // Façade
    const facade = new THREE.Mesh(new THREE.BoxGeometry(unitW - 0.035, UH - 0.032, 0.032), panelMat)
    facade.position.set(0, y, 0.506)
    g.add(facade)

    // Séparateur inter-unités
    const sep = new THREE.Mesh(new THREE.BoxGeometry(unitW, 0.01, 0.97), steelEdgeMat)
    sep.position.set(0, y + UH / 2 + 0.005, 0.02)
    g.add(sep)

    if (type === 'blank') {
      // Grille ajourée blanking panel
      for (let f = 0; f < 14; f++) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.06, UH - 0.07, 0.01), blackMat)
        slot.position.set(-0.88 + f * 0.135, y, 0.516)
        g.add(slot)
      }
      return
    }

    // ── LED Power ────────────────────────────────────────────────────────
    const pLedColor = type === 'switch' ? secondColor : color
    const powerLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 10, 10),
      ledMat(pLedColor, 2.0)
    )
    powerLed.position.set(-0.88, y, 0.532)
    g.add(powerLed)

    // Halo LED power
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.038, 8, 8),
      new THREE.MeshBasicMaterial({
        color: pLedColor, transparent: true, opacity: isDark ? 0.22 : 0.08, depthWrite: false,
      })
    )
    halo.position.set(-0.88, y, 0.532)
    g.add(halo)

    // LED activité (clignotement simulé)
    const actLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 8, 8),
      ledMat(0xffaa00, 0.85 + Math.random() * 1.1)
    )
    actLed.position.set(-0.76, y, 0.532)
    g.add(actLed)

    // LED réseau
    const netLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 8, 8),
      ledMat(secondColor, 1.0 + Math.random() * 0.6)
    )
    netLed.position.set(-0.64, y, 0.532)
    g.add(netLed)

    if (type === 'server-blade') {
      // Poignée d'extraction
      const handleBase = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.085, 0.020), panelMat)
      handleBase.position.set(0.82, y, 0.522)
      g.add(handleBase)
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.048, 0.032), steelEdgeMat)
      handle.position.set(0.82, y, 0.540)
      g.add(handle)

      // Barre CPU couleur primaire
      const barW = 0.18 + Math.random() * 0.52
      const cpuBar = new THREE.Mesh(new THREE.BoxGeometry(barW, 0.038, 0.016), accentMat)
      cpuBar.position.set(-0.52 + barW / 2, y - 0.055, 0.532)
      g.add(cpuBar)

      // Barre RAM couleur secondaire
      const bar2W = 0.12 + Math.random() * 0.3
      const ramBar = new THREE.Mesh(new THREE.BoxGeometry(bar2W, 0.028, 0.014), accent2Mat)
      ramBar.position.set(-0.52 + bar2W / 2, y + 0.055, 0.532)
      g.add(ramBar)

      // Ports USB-A (x2)
      ;[-0.44, -0.32].forEach((xOff) => {
        const usb = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.038, 0.022), blackMat)
        usb.position.set(xOff, y + 0.04, 0.533)
        g.add(usb)
      })

      // Grille ventilation (fentes)
      for (let f = 0; f < 7; f++) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.032, UH - 0.08, 0.01), blackMat)
        slot.position.set(0.1 + f * 0.055, y, 0.522)
        g.add(slot)
      }

      // Câbles fibre arrière
      ;[0.28, 0.48].forEach((xOff, ci) => {
        const cable = new THREE.Mesh(
          new THREE.CylinderGeometry(0.013, 0.013, 0.52, 7),
          new THREE.MeshPhysicalMaterial({
            color: ci === 0 ? 0xff6600 : 0xffee00, roughness: 0.88, metalness: 0,
          })
        )
        cable.rotation.x = Math.PI / 2
        cable.position.set(xOff, y, -0.76)
        g.add(cable)
      })
    }

    if (type === 'switch') {
      const portCount = idx === 3 ? 12 : 6
      for (let p = 0; p < portCount; p++) {
        // RJ45
        const rj45 = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.055, 0.020), blackMat)
        rj45.position.set(-0.52 + p * 0.095, y, 0.532)
        g.add(rj45)
        // LED port RJ45 (vert = actif, orange = erreur)
        const portLed = new THREE.Mesh(
          new THREE.SphereGeometry(0.011, 6, 6),
          ledMat(Math.random() > 0.25 ? 0x00ee44 : 0xff8800, 1.6)
        )
        portLed.position.set(-0.52 + p * 0.095, y + 0.042, 0.534)
        g.add(portLed)
      }

      // Ports SFP+ uplink (couleur primaire)
      ;[0.72, 0.82].forEach((xOff) => {
        const sfp = new THREE.Mesh(
          new THREE.BoxGeometry(0.052, 0.04, 0.022),
          accentMat
        )
        sfp.position.set(xOff, y, 0.532)
        g.add(sfp)
        // Câble fibre SFP
        const fibre = new THREE.Mesh(
          new THREE.CylinderGeometry(0.009, 0.009, 0.44, 6),
          new THREE.MeshPhysicalMaterial({ color, roughness: 0.85, metalness: 0 })
        )
        fibre.rotation.x = Math.PI / 2
        fibre.position.set(xOff, y, -0.73)
        g.add(fibre)
      })
    }

    if (type === 'nas') {
      // 6 baies disque
      for (let d = 0; d < 6; d++) {
        const bay = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, UH - 0.06, 0.026),
          new THREE.MeshPhysicalMaterial({
            color: isDark ? 0x18181c : 0xa8aeb8, metalness: 0.72, roughness: 0.14, clearcoat: 0.9,
          })
        )
        bay.position.set(-0.68 + d * 0.25, y, 0.532)
        g.add(bay)

        // Poignée baie (petite anse)
        const bayHandle = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.025, 0.012),
          steelEdgeMat
        )
        bayHandle.position.set(-0.68 + d * 0.25, y - UH / 2 + 0.04, 0.548)
        g.add(bayHandle)

        // LED disque (bleu actif, rouge erreur)
        const diskLed = new THREE.Mesh(
          new THREE.SphereGeometry(0.014, 6, 6),
          ledMat(Math.random() > 0.12 ? secondColor : 0xff2200, 1.4)
        )
        diskLed.position.set(-0.68 + d * 0.25, y - 0.065, 0.544)
        g.add(diskLed)
      }

      // Bar capacité couleur secondaire
      const capW = 0.22 + Math.random() * 0.35
      const capBar = new THREE.Mesh(new THREE.BoxGeometry(capW, 0.028, 0.016), accent2Mat)
      capBar.position.set(0.82 - capW / 2, y + 0.06, 0.532)
      g.add(capBar)

      // Ports USB arrière
      const usbBack = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.04, 0.022), goldMat)
      usbBack.position.set(0.82, y - 0.06, 0.532)
      g.add(usbBack)
    }

    if (type === 'kvm') {
      // Port HDMI
      const hdmi = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.050, 0.023), blackMat)
      hdmi.position.set(-0.5, y, 0.533)
      g.add(hdmi)
      // Port VGA
      const vga = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.058, 0.023), blackMat)
      vga.position.set(-0.32, y, 0.533)
      g.add(vga)
      // 3 boutons ronds
      ;[0.5, 0.62, 0.74].forEach((bx, bi) => {
        const btn = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 0.018, 12),
          bi === 0 ? accentMat : panelMat
        )
        btn.rotation.x = Math.PI / 2
        btn.position.set(bx, y, 0.532)
        g.add(btn)
      })
    }
  })

  // ── PDU VERTICAL ──────────────────────────────────────────────────────────
  const pduBody = new THREE.Mesh(new THREE.BoxGeometry(0.092, 2.55, 0.098), panelMat)
  pduBody.position.set(-1.19, 0, 0.022)
  g.add(pduBody)

  // Liseré PDU couleur secondaire
  const pduAccent = new THREE.Mesh(new THREE.BoxGeometry(0.010, 2.55, 0.1), accent2Mat)
  pduAccent.position.set(-1.19 + 0.051, 0, 0.022)
  g.add(pduAccent)

  // Prises PDU (x8)
  for (let s = 0; s < 8; s++) {
    const socket = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.058, 0.020), blackMat)
    socket.position.set(-1.192, -1.0 + s * 0.28, 0.068)
    g.add(socket)
    const sockLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.009, 6, 6),
      ledMat(0x00cc44, 0.85)
    )
    sockLed.position.set(-1.192, -1.0 + s * 0.28 + 0.038, 0.072)
    g.add(sockLed)
  }

  // ── LOGO / BADGE RACK (façade haut) ──────────────────────────────────────
  // Plaquette métal gravée
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.055, 0.014), steelEdgeMat)
  badge.position.set(0, 1.38, 0.518)
  g.add(badge)

  // Tiret déco couleur primaire sur la plaquette
  const badgeLine = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.010, 0.015), accentMat)
  badgeLine.position.set(0, 1.38, 0.526)
  g.add(badgeLine)

  // ── CÂBLE MANAGEMENT ARRIÈRE (faisceau de câbles visible) ─────────────────
  ;[0.0, 0.2, -0.2].forEach((cx) => {
    const bundle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 2.4, 7),
      new THREE.MeshPhysicalMaterial({ color: 0x111111, roughness: 0.92, metalness: 0 })
    )
    bundle.rotation.x = Math.PI / 2
    bundle.position.set(cx, 0.2, -0.82)
    g.add(bundle)
  })

  // ── OMBRE ─────────────────────────────────────────────────────────────────
  addShadow(g, 1.25, 0.58, -1.6)
  g.scale.set(0.8, 0.8, 0.8)
  return g
}