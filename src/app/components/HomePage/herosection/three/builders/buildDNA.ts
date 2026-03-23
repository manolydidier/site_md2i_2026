import * as THREE from 'three'
import type { Mode } from '../../types'

type AddShadowFn = (
  group: THREE.Group,
  scaleX?: number,
  scaleZ?: number,
  offsetY?: number
) => void

export function buildDNA(
  color: number,
  mode: Mode,
  addShadow: AddShadowFn
): THREE.Group {
  const g = new THREE.Group()
  const isDark = mode === 'dark'

  // ── Couleur secondaire thème ──────────────────────────────────────────────
  // Dark  : cuivre chaud pour les pistes + accent froid pour RAM
  // Light : or plus clair + bleu ardoise pour RAM
  const secondColor = isDark ? 0x00ddaa : 0x0055cc

  // ── Matériaux ─────────────────────────────────────────────────────────────
  const pcbMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x092010 : 0x1a4d2c,
    metalness: 0.06,
    roughness: 0.74,
    clearcoat: 0.32,
    clearcoatRoughness: 0.42,
  })

  const epoxyMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x0c2a18 : 0x1e5c38,
    transparent: true,
    opacity: 0.52,
    metalness: 0,
    roughness: 0.04,
    clearcoat: 1,
    clearcoatRoughness: 0,
    transmission: 0.12,
  })

  const copperMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0xd4860a : 0xb07000,
    metalness: 1,
    roughness: 0.03,
    clearcoat: 1,
    clearcoatRoughness: 0,
    emissive: new THREE.Color(isDark ? 0xd4860a : 0xb07000),
    emissiveIntensity: isDark ? 0.07 : 0.025,
  })

  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xdeb040,
    metalness: 1,
    roughness: 0.02,
    clearcoat: 1,
  })

  const ihsMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0xb0a898 : 0xc8beb0,
    metalness: 0.96,
    roughness: 0.13,
    clearcoat: 1,
    clearcoatRoughness: 0.07,
  })

  const chipMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x070707 : 0x181818,
    metalness: 0.78,
    roughness: 0.11,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
  })

  const accentMat = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.92,
    roughness: 0.04,
    clearcoat: 1,
    emissive: new THREE.Color(color),
    emissiveIntensity: isDark ? 0.5 : 0.16,
  })

  const accent2Mat = new THREE.MeshPhysicalMaterial({
    color: secondColor,
    metalness: 0.88,
    roughness: 0.05,
    clearcoat: 1,
    emissive: new THREE.Color(secondColor),
    emissiveIntensity: isDark ? 0.4 : 0.13,
  })

  const slotMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x18182e : 0x28284a,
    metalness: 0.28,
    roughness: 0.58,
    clearcoat: 0.5,
  })

  const heatsinkMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x282828 : 0x404040,
    metalness: 0.92,
    roughness: 0.20,
    clearcoat: 0.7,
  })

  function ledMat(c: number, intensity: number) {
    return new THREE.MeshStandardMaterial({
      color: c,
      emissive: new THREE.Color(c),
      emissiveIntensity: isDark ? intensity : intensity * 0.36,
      roughness: 0,
      metalness: 0.08,
    })
  }

  // ── PCB ───────────────────────────────────────────────────────────────────
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.9, 0.085), pcbMat)
  g.add(pcb)

  const epoxy = new THREE.Mesh(new THREE.BoxGeometry(2.91, 2.91, 0.011), epoxyMat)
  epoxy.position.z = 0.048
  g.add(epoxy)

  // Backplate
  const backplate = new THREE.Mesh(
    new THREE.BoxGeometry(2.9, 2.9, 0.022),
    new THREE.MeshPhysicalMaterial({ color: isDark ? 0x050508 : 0x202028, metalness: 0.6, roughness: 0.4 })
  )
  backplate.position.z = -0.054
  g.add(backplate)

  // Bordure PCB (liseré couleur primaire côté haut, secondaire côté bas)
  const edgeTop = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.016, 0.088), accentMat)
  edgeTop.position.set(0, 1.458, 0)
  g.add(edgeTop)

  const edgeBot = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.016, 0.088), accent2Mat)
  edgeBot.position.set(0, -1.458, 0)
  g.add(edgeBot)

  const edgeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.016, 2.9, 0.088), accent2Mat)
  edgeLeft.position.set(-1.458, 0, 0)
  g.add(edgeLeft)

  const edgeRight = new THREE.Mesh(new THREE.BoxGeometry(0.016, 2.9, 0.088), accentMat)
  edgeRight.position.set(1.458, 0, 0)
  g.add(edgeRight)

  // ── TROUS DE MONTAGE ──────────────────────────────────────────────────────
  ;[[-1.28, 1.28], [1.28, 1.28], [-1.28, -1.28], [1.28, -1.28],
    [0, 1.28], [0, -1.28]].forEach(([mx, my]) => {
    const eyelet = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.095, 16), goldMat)
    eyelet.rotation.x = Math.PI / 2
    eyelet.position.set(mx, my, 0)
    g.add(eyelet)

    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.1, 10),
      new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 1 })
    )
    hole.rotation.x = Math.PI / 2
    hole.position.set(mx, my, 0)
    g.add(hole)
  })

  // ── PISTES CUIVRE ─────────────────────────────────────────────────────────
  ;[-1.1, -0.72, -0.38, -0.04, 0.3, 0.64, 1.0].forEach((yPos) => {
    const w = 1.6 + Math.random() * 1.0
    const t = new THREE.Mesh(new THREE.BoxGeometry(w, 0.021, 0.017), copperMat)
    t.position.set(-1.4 + w / 2 + Math.random() * 0.1, yPos, 0.052)
    g.add(t)
  })

  ;[-1.05, -0.65, -0.25, 0.15, 0.55, 0.95].forEach((xPos) => {
    const h = 1.5 + Math.random() * 0.9
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.021, h, 0.017), copperMat)
    t.position.set(xPos, -0.6 + h / 2, 0.052)
    g.add(t)
  })

  // Pistes diagonales (bus haute vitesse — couleur primaire subtile)
  ;[
    { x1: -0.55, y1: 0.55, x2: 0.15, y2: -0.15 },
    { x1: 0.55, y1: 0.78, x2: 1.1, y2: 0.18 },
  ].forEach(({ x1, y1, x2, y2 }) => {
    const dx = x2 - x1, dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)
    const diag = new THREE.Mesh(new THREE.BoxGeometry(len, 0.021, 0.017), copperMat)
    diag.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0.052)
    diag.rotation.z = Math.atan2(dy, dx)
    g.add(diag)
  })

  // Vias avec pad doré
  for (let i = 0; i < 26; i++) {
    const vx = (Math.random() - 0.5) * 2.5
    const vy = (Math.random() - 0.5) * 2.5
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.011, 13), goldMat)
    pad.rotation.x = Math.PI / 2
    pad.position.set(vx, vy, 0.054)
    g.add(pad)
    const via = new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.029, 0.1, 9), goldMat)
    via.rotation.x = Math.PI / 2
    via.position.set(vx, vy, 0)
    g.add(via)
  }

  // ── SOCKET + IHS CPU ──────────────────────────────────────────────────────
  const socketBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.88, 0.024),
    new THREE.MeshPhysicalMaterial({ color: isDark ? 0x1a1a00 : 0x2a2a00, metalness: 0.4, roughness: 0.6 })
  )
  socketBase.position.set(-0.28, 0.38, 0.052)
  g.add(socketBase)

  // Grille de pins
  for (let px = 0; px < 7; px++) {
    for (let py = 0; py < 7; py++) {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.044, 5), goldMat)
      pin.rotation.x = Math.PI / 2
      pin.position.set(-0.28 - 0.27 + px * 0.09, 0.38 - 0.27 + py * 0.09, 0.077)
      g.add(pin)
    }
  }

  // Levier socket (couleur secondaire — visible)
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.62, 0.016), accent2Mat)
  lever.position.set(-0.28 + 0.46, 0.38, 0.064)
  g.add(lever)

  // IHS (plaque brossée)
  const ihs = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.062), ihsMat)
  ihs.position.set(-0.28, 0.38, 0.114)
  g.add(ihs)

  // Marquage laser IHS
  const mark1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.042, 0.005),
    new THREE.MeshStandardMaterial({ color: isDark ? 0x808080 : 0x555555, roughness: 0.9, metalness: 0 })
  )
  mark1.position.set(-0.28, 0.42, 0.146)
  g.add(mark1)

  const mark2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.30, 0.036, 0.005),
    new THREE.MeshStandardMaterial({ color: isDark ? 0x606060 : 0x404040, roughness: 0.9, metalness: 0 })
  )
  mark2.position.set(-0.28, 0.36, 0.146)
  g.add(mark2)

  // Liseré IHS couleur primaire (haut) + secondaire (côté)
  const ihsAccentTop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.011, 0.065), accentMat)
  ihsAccentTop.position.set(-0.28, 0.361, 0.118)
  g.add(ihsAccentTop)

  const ihsAccentSide = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.72, 0.065), accent2Mat)
  ihsAccentSide.position.set(-0.28 + 0.361, 0.38, 0.118)
  g.add(ihsAccentSide)

  // ── SLOTS RAM DDR5 (x4) ──────────────────────────────────────────────────
  ;[0, 1, 2, 3].forEach((i) => {
    const rx = 0.62 + i * 0.30

    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.064, 1.45, 0.054), slotMat)
    slot.position.set(rx, -0.08, 0.078)
    g.add(slot)

    // Contacts
    for (let c = 0; c < 10; c++) {
      const contact = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.052, 0.009), goldMat)
      contact.position.set(rx, -0.6 + c * 0.13, 0.058)
      g.add(contact)
    }

    // Clips rétention
    ;[-0.73, 0.73].forEach((cy) => {
      const clip = new THREE.Mesh(
        new THREE.BoxGeometry(0.048, 0.062, 0.108),
        new THREE.MeshPhysicalMaterial({ color: isDark ? 0xddddcc : 0xccccbb, metalness: 0.05, roughness: 0.7 })
      )
      clip.position.set(rx, -0.08 + cy, 0.104)
      g.add(clip)
    })

    // Barrette RAM insérée (slots 0 et 2)
    if (i === 0 || i === 2) {
      const ramColor = isDark ? 0x10102a : 0x1a1a3e
      const ram = new THREE.Mesh(
        new THREE.BoxGeometry(0.050, 1.32, 0.31),
        new THREE.MeshPhysicalMaterial({ color: ramColor, metalness: 0.04, roughness: 0.72 })
      )
      ram.position.set(rx, -0.08, 0.238)
      g.add(ram)

      // Chips NAND
      for (let rc = 0; rc < 5; rc++) {
        const rchip = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.17, 0.052), chipMat)
        rchip.position.set(rx, -0.44 + rc * 0.21, 0.375)
        g.add(rchip)
      }

      // Bande LED RGB (couleur primaire pour slot 0, secondaire pour slot 2)
      const ledColor = i === 0 ? color : secondColor
      const ramLed = new THREE.Mesh(
        new THREE.BoxGeometry(0.052, 1.0, 0.016),
        new THREE.MeshStandardMaterial({
          color: ledColor,
          emissive: new THREE.Color(ledColor),
          emissiveIntensity: isDark ? 0.62 : 0.18,
          roughness: 0.1,
        })
      )
      ramLed.position.set(rx, -0.08, 0.406)
      g.add(ramLed)
    }
  })

  // ── PCIe x16 ──────────────────────────────────────────────────────────────
  const pcie = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.064, 0.056), slotMat)
  pcie.position.set(-0.12, -0.38, 0.075)
  g.add(pcie)

  // Liseré PCIe couleur primaire
  const pcieAcc = new THREE.Mesh(new THREE.BoxGeometry(1.57, 0.068, 0.013), accentMat)
  pcieAcc.position.set(-0.12, -0.313, 0.082)
  g.add(pcieAcc)

  // Contacts dorés
  for (let c = 0; c < 18; c++) {
    const cont = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.011, 0.011), goldMat)
    cont.position.set(-0.76 + c * 0.088, -0.38, 0.065)
    g.add(cont)
  }

  // PCIe x4 (couleur secondaire)
  const pcieX4 = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.064, 0.054), slotMat)
  pcieX4.position.set(-0.6, -0.68, 0.075)
  g.add(pcieX4)

  const pcieX4Acc = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.068, 0.013), accent2Mat)
  pcieX4Acc.position.set(-0.6, -0.613, 0.082)
  g.add(pcieX4Acc)

  // ── SLOT M.2 + SSD ────────────────────────────────────────────────────────
  const m2Slot = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.048, 0.040),
    new THREE.MeshPhysicalMaterial({ color: isDark ? 0x111111 : 0x222222, metalness: 0.5, roughness: 0.3 })
  )
  m2Slot.position.set(0.45, -1.0, 0.065)
  g.add(m2Slot)

  const ssd = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.21, 0.021), pcbMat)
  ssd.position.set(0.45, -0.88, 0.075)
  g.add(ssd)

  ;[-0.14, 0.14].forEach((mx) => {
    const nand = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.13, 0.024), chipMat)
    nand.position.set(0.45 + mx, -0.88, 0.088)
    g.add(nand)
  })

  // ── CHIPSET + DISSIPATEUR ─────────────────────────────────────────────────
  const chipset = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.054), chipMat)
  chipset.position.set(0.55, 0.22, 0.095)
  g.add(chipset)

  const csHs = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.042), heatsinkMat)
  csHs.position.set(0.55, 0.22, 0.166)
  g.add(csHs)

  ;[-0.16, -0.08, 0, 0.08, 0.16].forEach((fx) => {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.44, 0.060), heatsinkMat)
    fin.position.set(0.55 + fx, 0.22, 0.198)
    g.add(fin)
  })

  // Liseré chipset (couleur secondaire)
  const csAcc = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.011, 0.044), accent2Mat)
  csAcc.position.set(0.55, 0.22 - 0.245, 0.188)
  g.add(csAcc)

  // ── VRM — INDUCTANCES ─────────────────────────────────────────────────────
  ;[[-0.88, 1.02], [-0.62, 1.02], [-0.36, 1.02], [-0.88, 0.78], [-0.62, 0.78]].forEach(([ix, iy]) => {
    const toroid = new THREE.Mesh(
      new THREE.TorusGeometry(0.082, 0.036, 10, 18),
      new THREE.MeshPhysicalMaterial({ color: isDark ? 0x1e1e44 : 0x2e2e66, metalness: 0.3, roughness: 0.7 })
    )
    toroid.rotation.x = Math.PI / 2
    toroid.position.set(ix, iy, 0.104)
    g.add(toroid)

    const coil = new THREE.Mesh(
      new THREE.TorusGeometry(0.082, 0.015, 6, 18),
      copperMat
    )
    coil.rotation.x = Math.PI / 2
    coil.position.set(ix, iy, 0.113)
    g.add(coil)
  })

  // MOSFETs
  ;[-0.88, -0.62, -0.36].forEach((mx) => {
    const mosfet = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.13, 0.040), chipMat)
    mosfet.position.set(mx, 1.18, 0.076)
    g.add(mosfet)
  })

  // Dissipateur VRM
  const vrmHs = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.11, 0.058), heatsinkMat)
  vrmHs.position.set(-0.62, 1.25, 0.146)
  g.add(vrmHs)

  ;[-0.28, -0.16, -0.04, 0.08, 0.2, 0.32].forEach((fx) => {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.11, 0.098), heatsinkMat)
    fin.position.set(-0.62 + fx, 1.25, 0.196)
    g.add(fin)
  })

  // Liseré VRM couleur primaire
  const vrmAcc = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.010, 0.060), accentMat)
  vrmAcc.position.set(-0.62, 1.194, 0.176)
  g.add(vrmAcc)

  // ── CONDENSATEURS POLYMÈRES ───────────────────────────────────────────────
  const capDefs = [
    { x: -1.15, y: 0.85, col: isDark ? 0x1a3a6a : 0x2a55a0, h: 0.25 },
    { x: -1.05, y: 0.85, col: isDark ? 0x1a3a6a : 0x2a55a0, h: 0.23 },
    { x: -1.15, y: 0.62, col: isDark ? 0x3a1a1a : 0x8a2020, h: 0.21 },
    { x: -1.05, y: 0.62, col: isDark ? 0x1a3a1a : 0x205520, h: 0.21 },
    { x: 1.1,  y: 0.5,  col: isDark ? 0x1a3a6a : 0x2a55a0, h: 0.19 },
    { x: 1.1,  y: 0.3,  col: isDark ? 0x3a1a1a : 0x8a2020, h: 0.19 },
    { x: 1.1,  y: 0.1,  col: isDark ? 0x1a3a6a : 0x2a55a0, h: 0.23 },
    { x: 1.1,  y: -0.1, col: isDark ? 0x1a3a1a : 0x205520, h: 0.21 },
  ]

  capDefs.forEach(({ x, y, col, h }) => {
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.056, h, 13),
      new THREE.MeshPhysicalMaterial({ color: col, metalness: 0.38, roughness: 0.38, clearcoat: 0.7 })
    )
    cap.rotation.x = Math.PI / 2
    cap.position.set(x, y, 0.052 + h / 2)
    g.add(cap)

    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.059, 0.059, 0.038, 13), goldMat)
    band.rotation.x = Math.PI / 2
    band.position.set(x, y, 0.052 + h - 0.018)
    g.add(band)

    // Croix sécurité
    ;[true, false].forEach((horiz) => {
      const cross = new THREE.Mesh(
        new THREE.BoxGeometry(horiz ? 0.088 : 0.007, horiz ? 0.007 : 0.088, 0.005),
        new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, metalness: 0 })
      )
      cross.position.set(x, y, 0.052 + h + 0.006)
      g.add(cross)
    })
  })

  // ── CONNECTEUR ATX 24-PIN ─────────────────────────────────────────────────
  const atx = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.62, 0.135),
    new THREE.MeshPhysicalMaterial({ color: isDark ? 0x111111 : 0x222222, metalness: 0.05, roughness: 0.72 })
  )
  atx.position.set(1.22, -0.55, 0.124)
  g.add(atx)

  // Clip ATX (couleur secondaire)
  const atxClip = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.042, 0.058), accent2Mat)
  atxClip.position.set(1.22 + 0.148, -0.55, 0.138)
  g.add(atxClip)

  // ── PORTS SATA (x4) ──────────────────────────────────────────────────────
  ;[0, 1, 2, 3].forEach((i) => {
    const sata = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, 0.116, 0.072),
      new THREE.MeshPhysicalMaterial({ color: isDark ? 0x2a2200 : 0x443300, metalness: 0.05, roughness: 0.72 })
    )
    sata.position.set(1.22, -1.04 + i * 0.18, 0.088)
    g.add(sata)

    const tab = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.048, 0.034),
      new THREE.MeshPhysicalMaterial({ color: 0xcc4400, metalness: 0.05, roughness: 0.7 })
    )
    tab.position.set(1.22 + 0.034, -1.04 + i * 0.18, 0.118)
    g.add(tab)
  })

  // ── USB3 HEADER (bleu) ────────────────────────────────────────────────────
  const usb3 = new THREE.Mesh(
    new THREE.BoxGeometry(0.31, 0.115, 0.082),
    new THREE.MeshPhysicalMaterial({ color: isDark ? 0x001a55 : 0x0033aa, metalness: 0.05, roughness: 0.7 })
  )
  usb3.position.set(-0.55, -1.22, 0.088)
  g.add(usb3)

  // ── LEDs RGB BORD PCB ─────────────────────────────────────────────────────
  // Bas : alternance primaire / secondaire
  for (let l = 0; l < 8; l++) {
    const ledColor = l % 2 === 0 ? color : secondColor
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.021, 8, 8),
      ledMat(ledColor, 1.1 + Math.random() * 0.6)
    )
    led.position.set(-1.35 + l * 0.38, -1.42, 0.055)
    g.add(led)
  }

  // Gauche : couleur secondaire
  for (let l = 0; l < 6; l++) {
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.021, 8, 8),
      ledMat(secondColor, 0.9 + Math.random() * 0.7)
    )
    led.position.set(-1.42, -1.08 + l * 0.42, 0.055)
    g.add(led)
  }

  // ── OMBRE ─────────────────────────────────────────────────────────────────
  addShadow(g, 1.55, 1.55, -1.62)
  g.rotation.x = 0.26
  g.scale.set(0.8, 0.8, 0.8)
  return g
}