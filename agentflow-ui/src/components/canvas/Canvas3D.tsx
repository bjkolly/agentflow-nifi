import { MOUSE } from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import SceneSetup from './SceneSetup';
import GridFloor from './GridFloor';
import FlowRenderer from './FlowRenderer';
import { useUiStore } from '../../store/uiStore';

function SceneControls() {
  const isDraggingNode = useUiStore((s) => s.isDraggingNode);

  return (
    <OrbitControls
      target={[8, 0, 0]}
      enabled={!isDraggingNode}
      enableDamping
      dampingFactor={0.05}
      minDistance={8}
      maxDistance={80}
      maxPolarAngle={Math.PI / 2.1}
      mouseButtons={{
        LEFT: MOUSE.PAN,
        MIDDLE: MOUSE.DOLLY,
        RIGHT: MOUSE.ROTATE,
      }}
      panSpeed={1.2}
    />
  );
}

export default function Canvas3D() {
  return (
    <Canvas
      camera={{ position: [8, 11, 15], fov: 55 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <SceneSetup />
      <GridFloor />
      <FlowRenderer />
      <SceneControls />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.0}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
      </EffectComposer>
    </Canvas>
  );
}
