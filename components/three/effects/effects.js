import { useThree, useFrame } from '@react-three/fiber'
import { EffectComposer, RenderPass, EffectPass, BloomEffect, ToneMappingEffect, FXAAEffect } from 'postprocessing'
import { useEffect, useState } from 'react'

export function Effects() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const [composer] = useState(() => new EffectComposer(gl, { multisampling: 0 }))

  useEffect(() => {
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)
    composer.addPass(
      new EffectPass(
        camera,
        new BloomEffect({
          mipmapBlur: true,
          luminanceThreshold: 10,
          intensity: 0.5,
          levels: 1,
        })
      )
    )
    composer.addPass(new EffectPass(camera, new FXAAEffect(), new ToneMappingEffect()))
    composer.setSize(size.width, size.height)

    return () => {
      composer.removeAllPasses()
    }
  }, [composer, camera, scene, size.width, size.height])

  useFrame((_state, delta) => {
    composer.render(delta)
  }, 1)

  return null
}
