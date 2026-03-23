import * as THREE from 'three'
import type { Mode } from '../types'

export function buildParticleSystem(color: number, mode: Mode): THREE.Points {
  const count = 60
  const positions = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const r = 2 + Math.random() * 1.2
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const mat = new THREE.PointsMaterial({
    color: new THREE.Color(color),
    size: 0.08,
    transparent: true,
    opacity: mode === 'dark' ? 0.75 : 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  })

  return new THREE.Points(geo, mat)
}

function makeCloudTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Unable to get 2D context for cloud texture')
  }

  const cx = size / 2
  const cy = size / 2

  ctx.clearRect(0, 0, size, size)

  const grad1 = ctx.createRadialGradient(cx, cy, 10, cx, cy, 90)
  grad1.addColorStop(0, 'rgba(255,255,255,0.22)')
  grad1.addColorStop(0.35, 'rgba(255,255,255,0.12)')
  grad1.addColorStop(0.7, 'rgba(255,255,255,0.04)')
  grad1.addColorStop(1, 'rgba(255,255,255,0)')

  ctx.fillStyle = grad1
  ctx.beginPath()
  ctx.arc(cx, cy, 92, 0, Math.PI * 2)
  ctx.fill()

  const spots: Array<[number, number, number]> = [
    [cx - 45, cy - 10, 48],
    [cx + 35, cy - 20, 42],
    [cx - 20, cy + 38, 44],
    [cx + 18, cy + 22, 52],
    [cx - 5, cy - 42, 36],
  ]

  for (const [x, y, r] of spots) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(255,255,255,0.14)')
    g.addColorStop(0.45, 'rgba(255,255,255,0.07)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export function buildHaloMesh(color: number, mode: Mode): THREE.Group {
  const group = new THREE.Group()
  const texture = makeCloudTexture()

  const material = new THREE.SpriteMaterial({
    map: texture,
    color: new THREE.Color(color),
    transparent: true,
    opacity: mode === 'dark' ? 0.22 : 0.12,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const sprite1 = new THREE.Sprite(material)
  sprite1.scale.set(4.6, 4.6, 1)
  sprite1.position.set(0, 0, -0.8)
  group.add(sprite1)

  const sprite2 = new THREE.Sprite(material.clone())
  ;(sprite2.material as THREE.SpriteMaterial).opacity = mode === 'dark' ? 0.12 : 0.07
  sprite2.scale.set(5.6, 5.2, 1)
  sprite2.position.set(0.25, -0.1, -1.1)
  group.add(sprite2)

  const sprite3 = new THREE.Sprite(material.clone())
  ;(sprite3.material as THREE.SpriteMaterial).opacity = mode === 'dark' ? 0.08 : 0.05
  sprite3.scale.set(3.8, 3.6, 1)
  sprite3.position.set(-0.35, 0.2, -0.6)
  group.add(sprite3)

  return group
}