import * as THREE from 'three'
import type { Mode } from '../../types'

type AddShadowFn = (
  group: THREE.Group,
  scaleX?: number,
  scaleZ?: number,
  offsetY?: number
) => void

export function buildShield(
  color: number,
  mode: Mode,
  addShadow: AddShadowFn
): THREE.Group {
  const g = new THREE.Group()
  const isDark = mode === 'dark'

  // ── Couleur secondaire thème ──────────────────────────────────────────────
  // Dark  : blanc froid / argent pour le cadenas et globe
  // Light : bleu ardoise profond pour contraste
  const secondColor = isDark ? 0xaabbdd : 0x1a3a6a

  // ── Matériaux ─────────────────────────────────────────────────────────────
  const shieldMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x091422 : 0xbcceea,
    metalness: 0.88,
    roughness: 0.07,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    reflectivity: 1,
    emissive: new THREE.Color(color),
    emissiveIntensity: isDark ? 0.07 : 0.025,
  })

  const edgeMat = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.96,
    roughness: 0.03,
    clearcoat: 1,
    emissive: new THREE.Color(color),
    emissiveIntensity: isDark ? 0.62 : 0.20,
  })

  const edge2Mat = new THREE.MeshPhysicalMaterial({
    color: secondColor,
    metalness: 0.92,
    roughness: 0.04,
    clearcoat: 1,
    emissive: new THREE.Color(secondColor),
    emissiveIntensity: isDark ? 0.22 : 0.10,
  })

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x091422 : 0xd4e8ff,
    transparent: true,
    opacity: isDark ? 0.11 : 0.17,
    transmission: 0.92,
    roughness: 0,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0,
  })

  const lockMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0xddeeff : 0x1e3058,
    metalness: 0.92,
    roughness: 0.05,
    clearcoat: 1,
    emissive: new THREE.Color(secondColor),
    emissiveIntensity: isDark ? 0.22 : 0.08,
  })

  const wireMat = new THREE.LineBasicMaterial({
    color: secondColor,
    opacity: isDark ? 0.30 : 0.16,
    transparent: true,
  })

  const wireStrongMat = new THREE.LineBasicMaterial({
    color,
    opacity: isDark ? 0.55 : 0.30,
    transparent: true,
  })

  function nodeMat(c: number, emI = 0.45) {
    return new THREE.MeshPhysicalMaterial({
      color: c,
      metalness: 0.86,
      roughness: 0.09,
      clearcoat: 1,
      emissive: new THREE.Color(c),
      emissiveIntensity: isDark ? emI : emI * 0.38,
    })
  }

  // ── BOUCLIER HEXAGONAL ────────────────────────────────────────────────────
  // Corps
  const shieldBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.82, 0.82, 1.55, 6, 1),
    shieldMat
  )
  shieldBody.scale.set(1, 1, 0.21)
  shieldBody.position.set(0, 0.1, 0)
  g.add(shieldBody)

  // Pointe basse
  const shieldTip = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.72, 6, 1), shieldMat)
  shieldTip.scale.set(1, 1, 0.21)
  shieldTip.position.set(0, -1.02, 0)
  g.add(shieldTip)

  // Contour wireframe couleur primaire
  const shieldOutline = new THREE.Mesh(
    new THREE.CylinderGeometry(0.86, 0.86, 1.57, 6, 1),
    new THREE.MeshPhysicalMaterial({
      color,
      metalness: 1,
      roughness: 0,
      wireframe: true,
      emissive: new THREE.Color(color),
      emissiveIntensity: isDark ? 0.72 : 0.22,
    })
  )
  shieldOutline.scale.set(1, 1, 0.21)
  shieldOutline.position.set(0, 0.1, 0)
  g.add(shieldOutline)

  const tipOutline = new THREE.Mesh(
    new THREE.ConeGeometry(0.52, 0.74, 6, 1),
    new THREE.MeshPhysicalMaterial({
      color,
      metalness: 1,
      roughness: 0,
      wireframe: true,
      emissive: new THREE.Color(color),
      emissiveIntensity: isDark ? 0.72 : 0.22,
    })
  )
  tipOutline.scale.set(1, 1, 0.21)
  tipOutline.position.set(0, -1.02, 0)
  g.add(tipOutline)

  // Plaque de verre (reflet)
  const shieldGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.79, 0.79, 1.5, 6, 1),
    glassMat
  )
  shieldGlass.scale.set(1, 1, 0.18)
  shieldGlass.position.set(0, 0.1, 0.01)
  g.add(shieldGlass)

  // ── MOTIF HEXA INTERNE ─────────────────────────────────────────────────────
  // Alternance couleur primaire / secondaire
  ;[[-0.35, 0.1, 0], [0.35, 0.1, 0], [0, 0.4, 0],
    [0, -0.2, 0], [-0.35, -0.2, 0], [0.35, -0.2, 0],
    [0, 0.7, 0], [0, -0.5, 0]].forEach(([hx, hy], idx) => {
    const hex = new THREE.Mesh(
      new THREE.CylinderGeometry(0.175, 0.175, 0.038, 6, 1),
      new THREE.MeshPhysicalMaterial({
        color: idx % 2 === 0 ? color : secondColor,
        metalness: 0.9,
        roughness: 0.05,
        clearcoat: 1,
        transparent: true,
        opacity: isDark ? 0.16 : 0.10,
        emissive: new THREE.Color(idx % 2 === 0 ? color : secondColor),
        emissiveIntensity: isDark ? 0.12 : 0.04,
        wireframe: true,
      })
    )
    hex.scale.set(1, 1, 0.28)
    hex.position.set(hx, hy, 0.09)
    g.add(hex)
  })

  // ── VERROU CADENAS ────────────────────────────────────────────────────────
  const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.058), lockMat)
  lockBody.position.set(0, 0.12, 0.132)
  g.add(lockBody)

  const lockArch = new THREE.Mesh(
    new THREE.TorusGeometry(0.084, 0.021, 12, 22, Math.PI),
    lockMat
  )
  lockArch.position.set(0, 0.255, 0.132)
  lockArch.rotation.z = Math.PI
  g.add(lockArch)

  const keyhole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.027, 0.027, 0.062, 14),
    new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 1 })
  )
  keyhole.rotation.x = Math.PI / 2
  keyhole.position.set(0, 0.12, 0.164)
  g.add(keyhole)

  // ── GLOBE FIL-DE-FER ──────────────────────────────────────────────────────
  // Latitudes : couleur secondaire (sauf équateur = primaire)
  for (let i = 0; i < 7; i++) {
    const lat = -Math.PI / 2 + (i / 6) * Math.PI
    const r = Math.cos(lat) * 1.18
    const y = Math.sin(lat) * 1.18
    if (r < 0.05) continue

    const points: THREE.Vector3[] = []
    for (let a = 0; a <= 64; a++) {
      const angle = (a / 64) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r))
    }
    const isEquator = i === 3
    g.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      isEquator ? wireStrongMat : wireMat
    ))
  }

  // Longitudes : alternance primaire / secondaire
  for (let j = 0; j < 10; j++) {
    const lon = (j / 10) * Math.PI * 2
    const points: THREE.Vector3[] = []
    for (let a = 0; a <= 48; a++) {
      const angle = (a / 48) * Math.PI * 2
      points.push(new THREE.Vector3(
        Math.cos(lon) * Math.cos(angle) * 1.18,
        Math.sin(angle) * 1.18,
        Math.sin(lon) * Math.cos(angle) * 1.18
      ))
    }
    g.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      j % 3 === 0 ? wireStrongMat : wireMat
    ))
  }

  // ── ANNEAUX DE PROTECTION ─────────────────────────────────────────────────
  // Anneau 1 : couleur primaire
  // Anneaux 2-3 : couleur secondaire (alterner)
  const ringDefs = [
    { r: 1.32, tube: 0.012, rx: Math.PI * 0.22, rz: 0,           c: color },
    { r: 1.55, tube: 0.009, rx: Math.PI * 0.55, rz: Math.PI * 0.18, c: secondColor },
    { r: 1.72, tube: 0.007, rx: Math.PI * 0.08, rz: Math.PI * 0.4,  c: color },
  ]

  ringDefs.forEach(({ r, tube, rx, rz, c }) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, tube, 12, 120),
      new THREE.MeshPhysicalMaterial({
        color: c,
        metalness: 0.92,
        roughness: 0.04,
        clearcoat: 1,
        transparent: true,
        opacity: isDark ? 0.62 : 0.32,
        emissive: new THREE.Color(c),
        emissiveIntensity: isDark ? 0.32 : 0.10,
      })
    )
    ring.rotation.x = rx
    ring.rotation.z = rz
    g.add(ring)

    // Pastilles d'ancrage sur chaque anneau
    for (let d = 0; d < 4; d++) {
      const a = (d / 4) * Math.PI * 2
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.036, 10, 10),
        new THREE.MeshPhysicalMaterial({
          color: c, metalness: 0.9, roughness: 0.05,
          emissive: new THREE.Color(c),
          emissiveIntensity: isDark ? 0.8 : 0.28,
        })
      )
      dot.position
        .set(Math.cos(a) * r, Math.sin(a) * r, 0)
        .applyEuler(new THREE.Euler(rx, 0, rz))
      g.add(dot)
    }
  })

  // ── NŒUDS RÉSEAU TYPÉS ───────────────────────────────────────────────────
  // Couleurs : primaire pour types actifs, secondaire pour types passifs
  const typeColors: Record<string, number> = {
    firewall: color,
    server:   secondColor,
    endpoint: color,
    mobile:   secondColor,
    cloud:    color,
  }

  const nodeDefs = [
    { pos: [1.48, 0.6, 0.22] as const,   type: 'firewall', size: 0.115 },
    { pos: [-1.38, 0.72, -0.2] as const, type: 'server',   size: 0.1 },
    { pos: [0.8, 1.42, 0.45] as const,   type: 'endpoint', size: 0.088 },
    { pos: [-0.7, 1.52, -0.55] as const, type: 'cloud',    size: 0.105 },
    { pos: [1.55, -0.45, -0.3] as const, type: 'mobile',   size: 0.08 },
    { pos: [-1.45, -0.5, 0.4] as const,  type: 'endpoint', size: 0.08 },
  ]

  nodeDefs.forEach(({ pos, type, size }, idx) => {
    const [x, y, z] = pos
    const nc = typeColors[type] ?? color

    // Forme selon type
    const geo = type === 'mobile'
      ? new THREE.BoxGeometry(size * 0.7, size * 1.35, size * 0.48)
      : type === 'server'
        ? new THREE.BoxGeometry(size * 1.55, size, size * 0.65)
        : new THREE.SphereGeometry(size, 18, 18)

    const node = new THREE.Mesh(geo, nodeMat(nc))
    node.position.set(x, y, z)
    g.add(node)

    // Halo
    const haloNode = new THREE.Mesh(
      new THREE.SphereGeometry(size * 1.55, 10, 10),
      new THREE.MeshBasicMaterial({
        color: nc, transparent: true,
        opacity: isDark ? 0.09 : 0.04, depthWrite: false,
      })
    )
    haloNode.position.set(x, y, z)
    g.add(haloNode)

    // Ligne de connexion (couleur selon type)
    const t = 0.38 + Math.random() * 0.42
    g.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x * 0.38, y * 0.38, z * 0.38),
      ]),
      new THREE.LineBasicMaterial({ color: nc, transparent: true, opacity: isDark ? 0.44 : 0.24 })
    ))

    // Particule de donnée en transit
    const packet = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.038, 0.038),
      new THREE.MeshStandardMaterial({
        color: nc,
        emissive: new THREE.Color(nc),
        emissiveIntensity: isDark ? 1.2 : 0.38,
      })
    )
    packet.position.set(x * t, y * t, z * t)
    g.add(packet)

    // Satellites (premiers 4)
    if (idx < 4) {
      for (let j = 0; j < 2; j++) {
        const sat = new THREE.Mesh(
          new THREE.SphereGeometry(0.036, 8, 8),
          nodeMat(nc, 0.28)
        )
        sat.position.set(
          x + (Math.random() - 0.5) * 0.36,
          y + (Math.random() - 0.5) * 0.36,
          z + (Math.random() - 0.5) * 0.36
        )
        g.add(sat)
      }
    }
  })

  // ── RADAR SCAN ────────────────────────────────────────────────────────────
  const radar = new THREE.Mesh(
    new THREE.ConeGeometry(1.62, 0.02, 3, 1, true),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: isDark ? 0.11 : 0.055,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  )
  radar.rotation.x = Math.PI * 0.5
  radar.name = 'shieldRadar'
  g.add(radar)

  const radarLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.62, 0, 0),
    ]),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: isDark ? 0.52 : 0.26,
    })
  )
  radarLine.name = 'shieldRadarLine'
  g.add(radarLine)

  // ── HALO EXTERNE (couleur secondaire — couche extérieure) ─────────────────
  const outerHalo = new THREE.Mesh(
    new THREE.SphereGeometry(1.88, 28, 28),
    new THREE.MeshPhysicalMaterial({
      color: secondColor,
      transparent: true,
      opacity: isDark ? 0.035 : 0.018,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  g.add(outerHalo)

  // Halo interne (couleur primaire)
  const innerHalo = new THREE.Mesh(
    new THREE.SphereGeometry(1.3, 22, 22),
    new THREE.MeshPhysicalMaterial({
      color,
      transparent: true,
      opacity: isDark ? 0.055 : 0.025,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  g.add(innerHalo)

  // ── OMBRE ─────────────────────────────────────────────────────────────────
  addShadow(g, 1.05, 0.48, -1.8)
  return g
}

// ── Intégration animate() ────────────────────────────────────────────────────
// Dans la boucle animate(), ajouter :
//   obj.traverse((child) => {
//     if (child.name === 'shieldRadar' || child.name === 'shieldRadarLine') {
//       child.rotation.z += 0.018
//     }
//   })