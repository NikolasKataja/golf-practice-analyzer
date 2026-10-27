import { Component, Suspense, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import type { Group } from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bounds, Center, useGLTF } from '@react-three/drei'

function BallModel() {
  const { scene } = useGLTF('/models/golfball.glb')
  const model = useMemo(() => scene.clone(true), [scene])

  // Store a reference to the group without causing React renders.
  const rotationGroup = useRef<Group>(null)

  // Run before each rendered frame.
  useFrame((_, delta) => {
    // Respect the user's operating system motion preference.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    if (rotationGroup.current) {
      // Delta is the time since the previous frame in seconds.
      // This keeps rotation speed consistent across different frame rates.
      rotationGroup.current.rotation.y += delta * 0.3
    }
  })

  return (
    <Bounds fit clip margin={1.2}>
      <group ref={rotationGroup}>
        {/* Center the model so it rotates around its own center. */}
        <Center>
          <primitive object={model} />
        </Center>
      </group>
    </Bounds>
  )
}

// Keep a model-loading error from breaking the authentication page.
class ModelErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    return this.state.hasError ? null : this.props.children
  }
}

export default function GolfBall() {
  return (
    <ModelErrorBoundary>
      <Canvas
        // Render when something changes instead of continuously.
        frameloop="always"
        // Limit resolution on screens with a high pixel density.
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4], fov: 35 }}
        // Leave the decoration empty if WebGL is unavailable.
        fallback={null}
        style={{ pointerEvents: 'none' }}
      >
        {/* Soft overall lighting and two lights that reveal the dimples. */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 4, 5]} intensity={2.5} />
        <directionalLight position={[-3, 1, -2]} intensity={1} />

        {/* Keep the form visible while the model is loading. */}
        <Suspense fallback={null}>
          <BallModel />
        </Suspense>
      </Canvas>
    </ModelErrorBoundary>
  )
}
