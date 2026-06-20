"use client"

import * as THREE from 'three'
import { useRef, useMemo, type MutableRefObject } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { Environment, Lightformer, Line } from '@react-three/drei'
import { Effects } from '../effects/effects'
import type { Group, Mesh } from 'three'
import type { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'

// [TWEAKABLE] Set to true for hand-authored edges, false for auto MST
const USE_HAND_AUTHORED_EDGES = false

// [TWEAKABLE] Camera orbit — radians per second
const ORBIT_SPEED = 0
const ORBIT_RADIUS = 25

// [TWEAKABLE] Environment lightformer layout — start angle is derived from the key light
const LIGHT_GROUP_ROTATION: [number, number, number] = [-Math.PI / 3, 0, 1]
const KEY_LIGHT_POSITION: [number, number, number] = [0, 5, -11]

const keyLightWorld = new THREE.Vector3(...KEY_LIGHT_POSITION).applyEuler(
  new THREE.Euler(...LIGHT_GROUP_ROTATION, 'XYZ')
)
// Camera starts on the key-light side so the lit faces are visible on load
const ORBIT_START_ANGLE = Math.atan2(keyLightWorld.x, keyLightWorld.z)
const INITIAL_CAMERA_POSITION: [number, number, number] = [
  ORBIT_RADIUS * Math.sin(ORBIT_START_ANGLE),
  0,
  ORBIT_RADIUS * Math.cos(ORBIT_START_ANGLE),
]

// [TWEAKABLE] Float animation per sphere
const FLOAT_AMPLITUDE = 0.25 // world units
const FLOAT_SPEED = 0.5 // frequency multiplier

// [TWEAKABLE] Hover push — sphere displacement when pointer is over it
const HOVER_PUSH_STRENGTH = 0.1 // world units
const HOVER_LERP_SPEED = 2
const HOVER_RETURN_SPEED = 2

// [TWEAKABLE] Connection lines
const LINE_COLOR = '#111111'
const LINE_WIDTH = 4 // visual width (works cross-platform via LineSegments2)

// [TWEAKABLE] Brand colours — 3 spheres of each
const BRAND_COLORS = {
  orange: '#EA5B18', // orange-600
  violet: '#C4B5FC', // violet-300
  amber: '#FBD452', // amber-300
  sky: '#0085C8', // sky-600
  emerald: '#009869', // emerald-600
}

// [TWEAKABLE] Sphere material — roughness/metalness per colour group
const MATERIAL = {
  roughness: 0.75, // 0 = mirror, 1 = fully matte
  metalness: 0.5, // 0 = plastic, 1 = metal
}


type SphereData = {
  color: string
  position: [number, number, number]
  floatOffset: number
}

const SPHERES: SphereData[] = [
  // [TWEAKABLE] Positions — adjust x/y/z to reshape the cluster
  { color: BRAND_COLORS.orange, position: [0.0, 1.5, 0.0], floatOffset: 9.0 },
  { color: BRAND_COLORS.orange, position: [-2.5, 0.0, 1.0], floatOffset: 9.1 },
  { color: BRAND_COLORS.orange, position: [2.5, 0.5, -1.0], floatOffset: 9.3 },
  { color: BRAND_COLORS.violet, position: [1.0, 3.5, 0.5], floatOffset: 9.7 },
  { color: BRAND_COLORS.violet, position: [-1.0, 2.0, -0.5], floatOffset: 9.9 },
  { color: BRAND_COLORS.violet, position: [3.5, 2.5, 0.0], floatOffset: 9.1 },
  { color: BRAND_COLORS.amber, position: [-3.0, 2.5, 0.5], floatOffset: 9.4 },
  { color: BRAND_COLORS.amber, position: [0.5, -1.5, 1.0], floatOffset: 2.0 },
  { color: BRAND_COLORS.amber, position: [-0.5, 0.5, -1.5], floatOffset: 3.5 },
  { color: BRAND_COLORS.sky, position: [2.0, -1.0, -0.5], floatOffset: 1.3 },
  { color: BRAND_COLORS.sky, position: [-2.0, -2.0, 0.0], floatOffset: 2.6 },
  { color: BRAND_COLORS.sky, position: [4.0, 0.0, 1.0], floatOffset: .9 },
  { color: BRAND_COLORS.emerald, position: [-1.5, -3.0, -0.5], floatOffset: 1.6 },
  { color: BRAND_COLORS.emerald, position: [1.5, 1.0, 2.0], floatOffset: 3.2 },
  { color: BRAND_COLORS.emerald, position: [-4.0, 1.0, -1.0], floatOffset: 2.8 },
]

// [TWEAKABLE] Hand-authored edges — [fromIndex, toIndex]
// Edit these pairs to change the connection topology
const HAND_AUTHORED_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [3, 4],
  [3, 5],
  [1, 6],
  [1, 8],
  [2, 9],
  [2, 13],
  [7, 8],
  [7, 10],
  [9, 11],
  [10, 12],
  [12, 14],
]

function computeMST(positions: THREE.Vector3[]): [number, number][] {
  const n = positions.length
  if (n === 0) return []

  const inMST = new Array<boolean>(n).fill(false)
  const minDist = new Array<number>(n).fill(Infinity)
  const parent = new Array<number>(n).fill(-1)
  const edges: [number, number][] = []

  minDist[0] = 0

  for (let count = 0; count < n; count++) {
    let u = -1
    let min = Infinity

    for (let i = 0; i < n; i++) {
      if (!inMST[i] && minDist[i] < min) {
        min = minDist[i]
        u = i
      }
    }

    if (u === -1) break

    inMST[u] = true
    if (parent[u] !== -1) {
      edges.push([parent[u], u])
    }

    for (let v = 0; v < n; v++) {
      if (!inMST[v]) {
        const dist = positions[u].distanceTo(positions[v])
        if (dist < minDist[v]) {
          minDist[v] = dist
          parent[v] = u
        }
      }
    }
  }

  return edges
}

const EDGES = USE_HAND_AUTHORED_EDGES
  ? HAND_AUTHORED_EDGES
  : computeMST(SPHERES.map((sphere) => new THREE.Vector3(...sphere.position)))

type SphereProps = SphereData & {
  onMeshRef: (mesh: Mesh | null) => void
}

function Sphere({ color, position, floatOffset, onMeshRef }: SphereProps) {
  const groupRef = useRef<Group>(null)
  const pushOffset = useRef(new THREE.Vector3())
  const targetPush = useRef(new THREE.Vector3())
  const worldPos = useRef(new THREE.Vector3())
  const isHovered = useRef(false)

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return

    const lerpSpeed = (isHovered.current ? HOVER_LERP_SPEED : HOVER_RETURN_SPEED) * delta
    pushOffset.current.lerp(targetPush.current, Math.min(1, lerpSpeed))

    const floatY = Math.sin(clock.elapsedTime * FLOAT_SPEED + floatOffset) * FLOAT_AMPLITUDE
    groupRef.current.position.set(
      position[0] + pushOffset.current.x,
      position[1] + floatY + pushOffset.current.y,
      position[2] + pushOffset.current.z
    )
  })

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    isHovered.current = true
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    isHovered.current = false
    targetPush.current.set(0, 0, 0)
    document.body.style.cursor = ''
  }

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    isHovered.current = true

    groupRef.current?.getWorldPosition(worldPos.current)
    targetPush.current.copy(event.point).sub(worldPos.current)

    if (targetPush.current.lengthSq() > 0) {
      targetPush.current.normalize().multiplyScalar(HOVER_PUSH_STRENGTH)
    }
  }

  return (
    <group ref={groupRef} position={position}>
      <mesh
        ref={onMeshRef}
        castShadow
        receiveShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerMove={handlePointerMove}
      >
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color={color} roughness={MATERIAL.roughness} metalness={MATERIAL.metalness} />
      </mesh>
    </group>
  )
}

type ConnectionLineProps = {
  fromIndex: number
  toIndex: number
  meshRefs: MutableRefObject<(Mesh | null)[]>
}

function ConnectionLine({ fromIndex, toIndex, meshRefs }: ConnectionLineProps) {
  const lineRef = useRef<LineSegments2>(null)
  const posA = useMemo(() => new THREE.Vector3(), [])
  const posB = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const meshA = meshRefs.current[fromIndex]
    const meshB = meshRefs.current[toIndex]
    const line = lineRef.current

    if (!meshA || !meshB || !line) return

    meshA.getWorldPosition(posA)
    meshB.getWorldPosition(posB)

    line.geometry.setPositions([posA.x, posA.y, posA.z, posB.x, posB.y, posB.z])
    line.geometry.attributes.instanceStart.needsUpdate = true
    line.geometry.attributes.instanceEnd.needsUpdate = true
    line.computeLineDistances()
  })

  return (
    <Line
      ref={lineRef}
      points={[
        [0, 0, 0],
        [0, 0, 0],
      ]}
      color={LINE_COLOR}
      lineWidth={LINE_WIDTH}
      segments
    />
  )
}

type ConnectionsProps = {
  edges: [number, number][]
  meshRefs: MutableRefObject<(Mesh | null)[]>
}

function Connections({ edges, meshRefs }: ConnectionsProps) {
  return (
    <>
      {edges.map(([fromIndex, toIndex], index) => (
        <ConnectionLine key={index} fromIndex={fromIndex} toIndex={toIndex} meshRefs={meshRefs} />
      ))}
    </>
  )
}

function CameraOrbit() {
  useFrame(({ camera, clock }) => {
    const angle = ORBIT_START_ANGLE + clock.elapsedTime * ORBIT_SPEED
    camera.position.x = ORBIT_RADIUS * Math.sin(angle)
    camera.position.z = ORBIT_RADIUS * Math.cos(angle)
    camera.lookAt(0, 0.25, 0)
  })

  return null
}

export const ThreeScene = () => {
  const meshRefs = useRef<(Mesh | null)[]>(Array.from({ length: SPHERES.length }, () => null))

  return (
    <Canvas
      flat
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true }}
      camera={{ position: INITIAL_CAMERA_POSITION, fov: 17.5, near: 10, far: 40 }}
      className="h-full w-full"
      style={{ opacity: 0.7 }}
    >
      <color attach="background" args={['#ffffff']} />
      <CameraOrbit />
      {SPHERES.map((sphere, index) => (
        <Sphere
          key={index}
          {...sphere}
          onMeshRef={(mesh) => {
            meshRefs.current[index] = mesh
          }}
        />
      ))}
      <Connections edges={EDGES} meshRefs={meshRefs} />
      <Environment resolution={256}>
        <group rotation={LIGHT_GROUP_ROTATION}>
          <Lightformer form="circle" intensity={100} rotation-x={Math.PI / 2} position={KEY_LIGHT_POSITION} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
          <Lightformer
            form="ring"
            color="#4060ff"
            intensity={1}
            onUpdate={(self) => self.lookAt(0, 0, 0)}
            position={[10, 10, 0]}
            scale={12}
          />
        </group>
      </Environment>
      <Effects />
    </Canvas>
  )
}
