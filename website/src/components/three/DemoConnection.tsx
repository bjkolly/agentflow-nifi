'use client';
import { useMemo } from 'react';
import * as THREE from 'three';
import DemoParticle from './DemoParticle';

type DemoConnectionProps = {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  particleCount?: number;
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  success: '#22c55e',
  tool_call: '#f59e0b',
  default: '#6366f1',
};

export default function DemoConnection({ start, end, color, particleCount = 2 }: DemoConnectionProps) {
  const { curve, tubeGeometry, arrowPos, arrowRotY } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = new THREE.Vector3(
      (s.x + e.x) / 2,
      Math.min(s.y, e.y) - 0.6,
      (s.z + e.z) / 2,
    );

    const c = new THREE.QuadraticBezierCurve3(s, mid, e);
    const geo = new THREE.TubeGeometry(c, 48, 0.05, 8, false);

    const dirToTarget = s.clone().sub(e).normalize();
    const ap = e.clone().add(dirToTarget.multiplyScalar(0.5));
    const rotY = Math.atan2(s.x - e.x, s.z - e.z);

    return { curve: c, tubeGeometry: geo, arrowPos: ap, arrowRotY: rotY };
  }, [start, end]);

  return (
    <group>
      {/* Tube */}
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.7} />
      </mesh>

      {/* Arrowhead */}
      <mesh position={[arrowPos.x, arrowPos.y, arrowPos.z]} rotation={[0, arrowRotY, 0]}>
        <coneGeometry args={[0.15, 0.35, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.9} />
      </mesh>

      {/* Flow particles */}
      {Array.from({ length: particleCount }).map((_, i) => (
        <DemoParticle
          key={i}
          curve={curve}
          color={color}
          speed={0.15 + i * 0.04}
          offset={i / particleCount}
        />
      ))}
    </group>
  );
}
