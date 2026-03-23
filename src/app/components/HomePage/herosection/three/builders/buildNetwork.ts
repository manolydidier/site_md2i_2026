import * as THREE from 'three'
import type { Mode } from '../../types'

type AddShadowFn = (
  group: THREE.Group,
  scaleX?: number,
  scaleZ?: number,
  offsetY?: number
) => void

export function buildNetwork(
  color: number,
  mode: Mode,
  addShadow: AddShadowFn
): THREE.Group {
  const g = new THREE.Group()
  const isDark = mode === 'dark'

  // ── Couleur secondaire thème ──────────────────────────────────────────────
  // Dark  : reflets argentés froids sur les bords
  // Light : touches champagne dorées
  const secondColor = isDark ? 0x8888aa : 0xc8b890

  // ── Matériaux ─────────────────────────────────────────────────────────────
  const aluminiumMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x26262a : 0xcdd2d8,
    metalness: 0.97,
    roughness: 0.07,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    reflectivity: 1,
  })

  const edgeMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x48484e : 0xe8ecf2,
    metalness: 1,
    roughness: 0.02,
    clearcoat: 1,
    clearcoatRoughness: 0,
    emissive: new THREE.Color(secondColor),
    emissiveIntensity: isDark ? 0.04 : 0.02,
  })

  const screenMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x040412 : 0xc8daf0,
    metalness: 0.04,
    roughness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0,
    emissive: new THREE.Color(color),
    emissiveIntensity: isDark ? 0.14 : 0.05,
    transmission: 0.06,
  })

  const bezelMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x0e0e12 : 0x141418,
    metalness: 0.1,
    roughness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0,
  })

  const keyMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x1a1a1e : 0xb2b8c4,
    metalness: 0.28,
    roughness: 0.48,
    clearcoat: 0.92,
    clearcoatRoughness: 0.07,
  })

  const keyEmissiveMat = (rnd: number) =>
    new THREE.MeshStandardMaterial({
      color: isDark ? 0x1a1a1e : 0xb2b8c4,
      emissive: new THREE.Color(isDark ? color : secondColor),
      emissiveIntensity: isDark ? rnd * 0.13 : rnd * 0.03,
      roughness: 0.48,
      metalness: 0.28,
    })

  const trackpadMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x18181c : 0xa2aaba,
    metalness: 0.78,
    roughness: 0.03,
    clearcoat: 1,
    clearcoatRoughness: 0,
  })

  const accentMat = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.92,
    roughness: 0.04,
    clearcoat: 1,
    emissive: new THREE.Color(color),
    emissiveIntensity: isDark ? 0.42 : 0.14,
  })

  const accent2Mat = new THREE.MeshPhysicalMaterial({
    color: secondColor,
    metalness: 0.88,
    roughness: 0.06,
    clearcoat: 1,
    emissive: new THREE.Color(secondColor),
    emissiveIntensity: isDark ? 0.18 : 0.06,
  })

  const rubberMat = new THREE.MeshPhysicalMaterial({
    color: 0x0c0c0c,
    metalness: 0,
    roughness: 0.96,
  })

  // ── BASE ──────────────────────────────────────────────────────────────────
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.12, 1.72), aluminiumMat)
  base.position.set(0, -0.62, 0)
  g.add(base)

  // Biseau supérieur (chamfer)
  const baseBevel = new THREE.Mesh(new THREE.BoxGeometry(2.54, 0.024, 1.74), edgeMat)
  baseBevel.position.set(0, -0.554, 0)
  g.add(baseBevel)

  // Bordure périmétrique latérale (reflet secondaire)
  const sideLeft = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.12, 1.72), accent2Mat)
  sideLeft.position.set(-1.263, -0.62, 0)
  g.add(sideLeft)

  const sideRight = sideLeft.clone()
  sideRight.position.set(1.263, -0.62, 0)
  g.add(sideRight)

  // Pieds caoutchouc (4 coins)
  ;[[-1.1, -0.68, -0.74], [1.1, -0.68, -0.74],
    [-1.1, -0.68, 0.74], [1.1, -0.68, 0.74]].forEach(([x, y, z]) => {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 14), rubberMat)
    foot.position.set(x, y, z)
    g.add(foot)
  })

  // ── PORTS USB-C (côtés) ──────────────────────────────────────────────────
  ;[0.12, 0.32].forEach((zOff) => {
    const portL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.056, 0.1), accentMat)
    portL.position.set(-1.268, -0.62, -0.38 + zOff)
    g.add(portL)

    const portR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.056, 0.1), accentMat)
    portR.position.set(1.268, -0.62, -0.38 + zOff)
    g.add(portR)
  })

  // Jack 3.5mm
  const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.022, 14), rubberMat)
  jack.rotation.z = Math.PI / 2
  jack.position.set(1.268, -0.62, 0.18)
  g.add(jack)

  // ── CLAVIER ───────────────────────────────────────────────────────────────
  const kbPlate = new THREE.Mesh(
    new THREE.BoxGeometry(2.12, 0.020, 1.25),
    new THREE.MeshPhysicalMaterial({
      color: isDark ? 0x121214 : 0x969ca8,
      metalness: 0.38,
      roughness: 0.58,
      clearcoat: 0.35,
    })
  )
  kbPlate.position.set(0, -0.552, 0.08)
  g.add(kbPlate)

  // Touches standard (4 rangées)
  const rows = [
    { z: 0.44, count: 13, x0: -0.86 },
    { z: 0.30, count: 14, x0: -0.86 },
    { z: 0.17, count: 13, x0: -0.78 },
    { z: 0.04, count: 11, x0: -0.72 },
  ]
  rows.forEach((row) => {
    for (let c = 0; c < row.count; c++) {
      const rnd = 0.5 + Math.random() * 1.0
      const key = new THREE.Mesh(
        new THREE.BoxGeometry(0.132, 0.024, 0.122),
        keyEmissiveMat(rnd)
      )
      key.position.set(row.x0 + c * 0.146, -0.54, -row.z + 0.5)
      g.add(key)
    }
  })

  // Touches spéciales
  const specialKeys = [
    { w: 0.72, z: 0.5, x: -0.04 },  // Espace
    { w: 0.26, z: 0.04, x: -0.82 }, // Shift gauche
    { w: 0.34, z: 0.04, x: 0.71 },  // Shift droit
    { w: 0.22, z: 0.17, x: 0.86 },  // Entrée
    { w: 0.22, z: 0.44, x: 0.86 },  // Backspace
  ]
  specialKeys.forEach(({ w, z, x }) => {
    const key = new THREE.Mesh(new THREE.BoxGeometry(w, 0.024, 0.122), keyMat)
    key.position.set(x, -0.54, -z + 0.5)
    g.add(key)
  })

  // Touch Bar (bande couleur primaire subtile)
  const touchBar = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.020, 0.082),
    new THREE.MeshPhysicalMaterial({
      color: isDark ? 0x06060e : 0x888898,
      metalness: 0.1,
      roughness: 0.1,
      clearcoat: 1,
      emissive: new THREE.Color(color),
      emissiveIntensity: isDark ? 0.07 : 0.02,
    })
  )
  touchBar.position.set(0, -0.538, -0.5 + 0.5 - 0.055)
  g.add(touchBar)

  // TouchID (couleur secondaire — se distingue)
  const touchID = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.020, 0.082), accent2Mat)
  touchID.position.set(0.96, -0.538, touchBar.position.z)
  g.add(touchID)

  // ── TRACKPAD ──────────────────────────────────────────────────────────────
  const trackpadBorder = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.018, 0.56), edgeMat)
  trackpadBorder.position.set(0, -0.546, 0.52)
  g.add(trackpadBorder)

  const trackpad = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.015, 0.54), trackpadMat)
  trackpad.position.set(0, -0.55, 0.52)
  g.add(trackpad)

  // ── CHARNIÈRE ─────────────────────────────────────────────────────────────
  const hingeBack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.054, 0.054, 2.14, 30),
    aluminiumMat
  )
  hingeBack.rotation.z = Math.PI / 2
  hingeBack.position.set(0, -0.558, -0.878)
  g.add(hingeBack)

  const hinge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.046, 0.046, 2.1, 30),
    edgeMat
  )
  hinge.rotation.z = Math.PI / 2
  hinge.position.set(0, -0.554, -0.862)
  g.add(hinge)

  // Anneaux déco charnière (couleur primaire + secondaire)
  ;[-0.62, 0.62].forEach((xOff, i) => {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.042, 22),
      i === 0 ? accentMat : accent2Mat
    )
    band.rotation.z = Math.PI / 2
    band.position.set(xOff, -0.554, -0.862)
    g.add(band)
  })

  // ── ÉCRAN ─────────────────────────────────────────────────────────────────
  const screenAngle = Math.PI * 0.13

  // Dos aluminium
  const lid = new THREE.Mesh(new THREE.BoxGeometry(2.52, 1.7, 0.062), aluminiumMat)
  lid.position.set(0, 0.38, -0.88)
  lid.rotation.x = screenAngle
  g.add(lid)

  // Chamfer bord écran (couleur secondaire subtile)
  const lidEdge = new THREE.Mesh(new THREE.BoxGeometry(2.54, 1.72, 0.022), edgeMat)
  lidEdge.position.set(0, 0.38, -0.865)
  lidEdge.rotation.x = screenAngle
  g.add(lidEdge)

  // Liseré bas du couvercle (couleur primaire)
  const lidAccent = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.012, 0.065), accentMat)
  lidAccent.position.set(0, -0.462, -0.88)
  lidAccent.rotation.x = screenAngle
  g.add(lidAccent)

  // Bezel (cadre noir intérieur)
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(2.42, 1.6, 0.036), bezelMat)
  bezel.position.set(0, 0.38, -0.846)
  bezel.rotation.x = screenAngle
  g.add(bezel)

  // Dalle active
  const screen = new THREE.Mesh(new THREE.BoxGeometry(2.28, 1.48, 0.011), screenMat)
  screen.position.set(0, 0.38, -0.833)
  screen.rotation.x = screenAngle
  g.add(screen)

  // Contenu écran (lignes UI — couleur primaire)
  ;[0.72, 0.58, 0.44, 0.30, 0.16, 0.02, -0.12].forEach((y, i) => {
    const lw = 0.55 + (i % 3) * 0.22
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(lw, 0.038, 0.013),
      new THREE.MeshStandardMaterial({
        color,
        emissive: new THREE.Color(color),
        emissiveIntensity: isDark ? 0.9 : 0.32,
        roughness: 0.2,
      })
    )
    line.position.set(-0.5 + lw / 2, y, -0.824)
    line.rotation.x = screenAngle
    g.add(line)
  })

  // Barres latérales UI (couleur secondaire — sidebar)
  ;[0.68, 0.5, 0.32, 0.14].forEach((y, i) => {
    const bw = 0.1 + i * 0.055
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(bw, 0.055, 0.013),
      new THREE.MeshStandardMaterial({
        color: secondColor,
        emissive: new THREE.Color(secondColor),
        emissiveIntensity: isDark ? 0.7 : 0.22,
        roughness: 0.2,
      })
    )
    bar.position.set(0.65 - bw / 2, y, -0.824)
    bar.rotation.x = screenAngle
    g.add(bar)
  })

  // ── NOTCH + CAMÉRA ────────────────────────────────────────────────────────
  const notch = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.060, 0.014), bezelMat)
  notch.position.set(0, 1.115, -0.826)
  notch.rotation.x = screenAngle
  g.add(notch)

  const cam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.023, 0.023, 0.013, 18),
    new THREE.MeshPhysicalMaterial({ color: 0x050505, metalness: 0.5, roughness: 0.3, clearcoat: 1 })
  )
  cam.rotation.x = Math.PI / 2 + screenAngle
  cam.position.set(0, 1.115, -0.824)
  g.add(cam)

  // LED caméra (couleur secondaire)
  const camLed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.009, 7),
    new THREE.MeshStandardMaterial({
      color: secondColor,
      emissive: new THREE.Color(secondColor),
      emissiveIntensity: isDark ? 1.2 : 0.4,
    })
  )
  camLed.rotation.x = Math.PI / 2 + screenAngle
  camLed.position.set(0.045, 1.115, -0.823)
  g.add(camLed)

  // ── LOGO (couleur primaire + secondaire) ──────────────────────────────────
  // Disque de base (couleur secondaire — texture aluminium brossé)
  const logoBase = new THREE.Mesh(new THREE.CircleGeometry(0.148, 32), accent2Mat)
  logoBase.position.set(0, 0.38, -0.884)
  logoBase.rotation.x = screenAngle
  g.add(logoBase)

  // Disque intérieur (couleur primaire — accent)
  const logoAccent = new THREE.Mesh(new THREE.CircleGeometry(0.118, 32), accentMat)
  logoAccent.position.set(0, 0.38, -0.883)
  logoAccent.rotation.x = screenAngle
  g.add(logoAccent)

  // ── OMBRE ─────────────────────────────────────────────────────────────────
  addShadow(g, 1.45, 0.62, -1.12)
  g.rotation.x = 0.16
  return g
}