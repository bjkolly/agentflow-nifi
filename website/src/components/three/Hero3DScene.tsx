'use client';
import { Suspense, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import HeroSceneSetup from './HeroSceneSetup';
import HeroGridFloor from './HeroGridFloor';
import HeroBackgroundParticles from './HeroBackgroundParticles';
import DemoProcessorNode from './DemoProcessorNode';
import DemoConnection from './DemoConnection';
import DemoCursor, { type CursorSegment } from './DemoCursor';

/* ── Processor definitions ──────────────────────────────────────── */

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

/* ── Animation timing constants ─────────────────────────────────── */

const DRAG1_START = 1.5;   // cursor + node 5 begin
const DRAG1_END = 3.0;     // node 5 lands
const DRAG2_START = 3.5;   // cursor + node 6 begin
const DRAG2_END = 5.0;     // node 6 lands
const FLOW_START = 5.5;    // connections + particles appear
const ROTATE_START = 7.5;  // oscillation begins after everything settles

/* ── Oscillation parameters ──────────────────────────────────────── */

const OSCILLATION_SPEED = 0.3;   // radians per second (full cycle ≈ 21s)
const OSCILLATION_RANGE = 0.5;   // ±0.5 radians ≈ ±29° from center
const OSCILLATION_EASE = 2.0;    // seconds to ease into full swing

/* ── Cursor drag paths ──────────────────────────────────────────── */

const CURSOR_SEGMENTS: CursorSegment[] = [
  { startTime: DRAG1_START, endTime: DRAG1_END, startPos: [13, 13, -8], endPos: [13, 1.2, 0] },
  { startTime: DRAG2_START, endTime: DRAG2_END, startPos: [19, 13, -8], endPos: [19, 1.2, 0] },
];

/* ── Pivot center — scene rotates around this point ──────────────── */

const PIVOT: [number, number, number] = [8, 0, 0];

/* ── Helper ─────────────────────────────────────────────────────── */

function getPosition(id: string): [number, number, number] {
  return PROCESSORS.find(p => p.id === id)?.position ?? [0, 0, 0];
}

/* ── Inner scene (runs inside Canvas for useFrame access) ────────── */

function HeroSceneContent() {
  // Shared elapsed ref — updated every frame, children read .current in their useFrame
  const elapsedRef = useRef(0);

  // Phase state drives React re-renders at key milestones only (not every frame)
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);

  // Pivot group ref for oscillation
  const pivotRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    elapsedRef.current += delta;

    // Determine the current phase
    const elapsed = elapsedRef.current;
    let newPhase = 0;
    if (elapsed >= ROTATE_START) newPhase = 4;
    else if (elapsed >= FLOW_START) newPhase = 3;
    else if (elapsed >= DRAG2_START) newPhase = 2;
    else if (elapsed >= DRAG1_START) newPhase = 1;

    // Trigger a re-render only when phase changes
    if (newPhase !== phaseRef.current) {
      phaseRef.current = newPhase;
      setPhase(newPhase);
    }

    // Oscillate the scene back and forth after animation completes
    if (pivotRef.current && elapsed >= ROTATE_START) {
      const t = elapsed - ROTATE_START;
      const easeIn = Math.min(1, t / OSCILLATION_EASE);
      const angle = Math.sin(t * OSCILLATION_SPEED) * OSCILLATION_RANGE * easeIn;
      pivotRef.current.rotation.y = angle;
    }
  });

  const connectionsActive = phase >= 3;

  return (
    <>
      {/* Lights & fog — stay in world space */}
      <HeroSceneSetup />

      {/* Everything else pivots around [8, 0, 0] for back-and-forth oscillation */}
      <group position={PIVOT}>
        <group ref={pivotRef}>
          <group position={[-PIVOT[0], -PIVOT[1], -PIVOT[2]]}>
            <HeroGridFloor />
            <HeroBackgroundParticles />

            {/* Static nodes (1–4): always visible */}
            {PROCESSORS.slice(0, 4).map(p => (
              <DemoProcessorNode
                key={p.id}
                position={p.position}
                name={p.name}
                processorType={p.processorType}
                color={p.color}
              />
            ))}

            {/* Animated node 5: Manage Memory — drops in at DRAG1_START */}
            <DemoProcessorNode
              key="demo-5"
              position={PROCESSORS[4].position}
              name={PROCESSORS[4].name}
              processorType={PROCESSORS[4].processorType}
              color={PROCESSORS[4].color}
              animateIn
              startDelay={DRAG1_START}
              duration={DRAG1_END - DRAG1_START}
              elapsedRef={elapsedRef}
            />

            {/* Animated node 6: Enforce Guardrails — drops in at DRAG2_START */}
            <DemoProcessorNode
              key="demo-6"
              position={PROCESSORS[5].position}
              name={PROCESSORS[5].name}
              processorType={PROCESSORS[5].processorType}
              color={PROCESSORS[5].color}
              animateIn
              startDelay={DRAG2_START}
              duration={DRAG2_END - DRAG2_START}
              elapsedRef={elapsedRef}
            />

            {/* Cursor — visible during drag phases */}
            <DemoCursor segments={CURSOR_SEGMENTS} elapsedRef={elapsedRef} />

            {/* Connections — activate after all nodes are placed */}
            {CONNECTIONS.map((c, i) => (
              <DemoConnection
                key={i}
                start={getPosition(c.sourceId)}
                end={getPosition(c.targetId)}
                color={c.color}
                particleCount={c.particles}
                active={connectionsActive}
              />
            ))}
          </group>
        </group>
      </group>

      <OrbitControls
        target={[8, 0, 0]}
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
      />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.0} />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
      </EffectComposer>
    </>
  );
}

/* ── Exported canvas wrapper ────────────────────────────────────── */

export default function Hero3DScene() {
  return (
    <Canvas
      camera={{ position: [8, 14, 22], fov: 55 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Suspense fallback={null}>
        <HeroSceneContent />
      </Suspense>
    </Canvas>
  );
}
