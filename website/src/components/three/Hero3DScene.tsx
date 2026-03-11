'use client';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import HeroSceneSetup from './HeroSceneSetup';
import HeroGridFloor from './HeroGridFloor';
import HeroBackgroundParticles from './HeroBackgroundParticles';
import DemoProcessorNode from './DemoProcessorNode';
import DemoConnection from './DemoConnection';

const PROCESSORS = [
  { id: 'demo-1', name: 'Plan Task', processorType: 'TaskPlannerProcessor', position: [-5, 1.2, 0] as [number, number, number], color: '#10b981' },
  { id: 'demo-2', name: 'Route Agent', processorType: 'AgentRouterProcessor', position: [1, 1.2, 0] as [number, number, number], color: '#3b82f6' },
  { id: 'demo-3', name: 'LLM Inference', processorType: 'LLMInferenceProcessor', position: [7, 1.2, -5] as [number, number, number], color: '#7c3aed' },
  { id: 'demo-4', name: 'Execute Tool', processorType: 'ToolExecutorProcessor', position: [7, 1.2, 5] as [number, number, number], color: '#f59e0b' },
  { id: 'demo-5', name: 'Manage Memory', processorType: 'MemoryManagerProcessor', position: [13, 1.2, 0] as [number, number, number], color: '#06b6d4' },
  { id: 'demo-6', name: 'Enforce Guardrails', processorType: 'GuardrailsEnforcerProcessor', position: [19, 1.2, 0] as [number, number, number], color: '#ef4444' },
];

const CONNECTIONS = [
  { sourceId: 'demo-1', targetId: 'demo-2', color: '#22c55e', particles: 3 },
  { sourceId: 'demo-2', targetId: 'demo-3', color: '#22c55e', particles: 1 },
  { sourceId: 'demo-2', targetId: 'demo-4', color: '#f59e0b', particles: 2 },
  { sourceId: 'demo-3', targetId: 'demo-5', color: '#22c55e', particles: 1 },
  { sourceId: 'demo-4', targetId: 'demo-5', color: '#22c55e', particles: 1 },
  { sourceId: 'demo-5', targetId: 'demo-6', color: '#22c55e', particles: 2 },
];

function getPosition(id: string): [number, number, number] {
  return PROCESSORS.find(p => p.id === id)?.position ?? [0, 0, 0];
}

export default function Hero3DScene() {
  return (
    <Canvas
      camera={{ position: [8, 14, 22], fov: 55 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Suspense fallback={null}>
        <HeroSceneSetup />
        <HeroGridFloor />
        <HeroBackgroundParticles />

        {PROCESSORS.map(p => (
          <DemoProcessorNode key={p.id} position={p.position} name={p.name} processorType={p.processorType} color={p.color} />
        ))}

        {CONNECTIONS.map((c, i) => (
          <DemoConnection
            key={i}
            start={getPosition(c.sourceId)}
            end={getPosition(c.targetId)}
            color={c.color}
            particleCount={c.particles}
          />
        ))}

        <OrbitControls
          target={[8, 0, 0]}
          autoRotate
          autoRotateSpeed={0.3}
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 4}
        />

        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.0} />
          <Vignette eskil={false} offset={0.1} darkness={0.8} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
