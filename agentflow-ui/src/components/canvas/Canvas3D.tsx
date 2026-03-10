import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import SceneSetup from './SceneSetup';
import GridFloor from './GridFloor';
import BackgroundParticles from './BackgroundParticles';
import FlowRenderer from './FlowRenderer';

export default function Canvas3D() {
  return (
    <Canvas
      camera={{ position: [0, 12, 20], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <SceneSetup />
      <GridFloor />
      <BackgroundParticles />
      <FlowRenderer />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.1}
      />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          intensity={0.7}
        />
      </EffectComposer>
    </Canvas>
  );
}
