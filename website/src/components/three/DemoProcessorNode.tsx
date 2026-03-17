'use client';
import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';

type DemoProcessorNodeProps = {
  position: [number, number, number];
  name: string;
  processorType: string;
  color: string;
  /** When true, the node animates in from above instead of appearing instantly */
  animateIn?: boolean;
  /** Seconds after scene start to begin the drop-in animation */
  startDelay?: number;
  /** Duration in seconds for the drop-in animation */
  duration?: number;
  /** Shared elapsed-time ref from the scene clock (required when animateIn=true) */
  elapsedRef?: React.RefObject<number>;
};

function shortType(processorType: string): string {
  return processorType
    .replace(/Processor$/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

const CARD_TILT = -Math.PI * 0.2;

export default function DemoProcessorNode({
  position,
  name,
  processorType,
  color,
  animateIn = false,
  startDelay = 0,
  duration = 1.5,
  elapsedRef,
}: DemoProcessorNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRefs = useRef<THREE.MeshPhysicalMaterial[]>([]);

  // Start position for animated nodes: above and behind
  const startPos: [number, number, number] = [position[0], position[1] + 12, position[2] - 8];

  useFrame(() => {
    if (!animateIn || !groupRef.current) return;

    // Read elapsed time from shared ref (updated every frame by parent)
    const elapsed = elapsedRef?.current ?? 0;
    const t = elapsed - startDelay;
    if (t < 0) {
      // Not started yet — hide
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;
    const progress = Math.min(1, t / duration);
    const eased = easeOutBack(progress);

    // Lerp position
    const x = startPos[0] + (position[0] - startPos[0]) * eased;
    const y = startPos[1] + (position[1] - startPos[1]) * eased;
    const z = startPos[2] + (position[2] - startPos[2]) * eased;
    groupRef.current.position.set(x, y, z);

    // Opacity fade in (0 → 1 over first 40% of animation)
    const opacityT = Math.min(1, progress / 0.4);
    materialRefs.current.forEach(mat => {
      if (mat) mat.opacity = opacityT * 0.92;
    });

    // Scale bounce at landing
    let scale = 1;
    if (progress > 0.7 && progress < 1.0) {
      const bounceT = (progress - 0.7) / 0.3;
      scale = 1 + 0.06 * Math.sin(bounceT * Math.PI);
    }
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group
      ref={animateIn ? groupRef : undefined}
      position={animateIn ? startPos : position}
      visible={!animateIn}
    >
      <group rotation={[CARD_TILT, 0, 0]}>
        {/* Main card */}
        <RoundedBox args={[3.6, 2.2, 0.4]} radius={0.08} smoothness={4}>
          <meshPhysicalMaterial
            ref={(el: THREE.MeshPhysicalMaterial | null) => { if (el) materialRefs.current[0] = el; }}
            color="#0d1117"
            roughness={0.15}
            metalness={0.2}
            transparent
            opacity={0.92}
            clearcoat={0.3}
            clearcoatRoughness={0.2}
          />
        </RoundedBox>

        {/* Top accent bar */}
        <mesh position={[0, 1.06, 0.21]}>
          <boxGeometry args={[3.6, 0.1, 0.41]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
        </mesh>

        {/* Side accent strips */}
        <mesh position={[-1.8, 0, 0.21]}>
          <boxGeometry args={[0.04, 2.2, 0.41]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.5} />
        </mesh>
        <mesh position={[1.8, 0, 0.21]}>
          <boxGeometry args={[0.04, 2.2, 0.41]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.5} />
        </mesh>

        {/* Name label */}
        <Text position={[0, 0.4, 0.22]} fontSize={0.24} color="#e5e7eb" anchorX="center" anchorY="middle">
          {name}
        </Text>

        {/* Type label */}
        <Text position={[0, 0.0, 0.22]} fontSize={0.14} color="#9ca3af" anchorX="center" anchorY="middle">
          {shortType(processorType)}
        </Text>

        {/* Status dot - always running green */}
        <mesh position={[1.5, 0.85, 0.22]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* Colored halo light */}
      <pointLight position={[0, 1, -1]} color={color} intensity={0.8} distance={8} decay={2} />
    </group>
  );
}
