import * as THREE from 'three'
import type { HeroObjectType, Mode } from '../../types'
import { buildNetwork } from './buildNetwork'
import { buildCube } from './buildCube'
import { buildShield } from './buildShield'
import { buildDNA } from './buildDNA'

type AddShadowFn = (
  group: THREE.Group,
  scaleX?: number,
  scaleZ?: number,
  offsetY?: number
) => void

export function makeObject(
  type: HeroObjectType,
  color: number,
  mode: Mode,
  addShadow: AddShadowFn
): THREE.Group {
  switch (type) {
    case 'network':
      return buildNetwork(color, mode, addShadow)
    case 'cube':
      return buildCube(color, mode, addShadow)
    case 'shield':
      return buildShield(color, mode, addShadow)
    case 'dna':
      return buildDNA(color, mode, addShadow)
    default:
      return buildNetwork(color, mode, addShadow)
  }
}