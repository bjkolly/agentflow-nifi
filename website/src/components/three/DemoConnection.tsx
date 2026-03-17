'use client';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import DemoParticle from './DemoParticle';

type DemoConnectionProps = {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  particleCount?: number;
  /** When false, the connection is hidden. Fades in when set to true. */
  active?: boolean;
};

export default function DemoConnection({ start, end, color, particleCount = 2, active = true }: DemoConnectionProps) {
  const tubeMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const arrowMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  // Always start at 0 so we get a smooth fade-in when `active` becomes true
  const fadeRef = useRef(0);
  const [showParticles, setShowParticles] = useState(false);

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

  useFrame((_state, delta) => {
    const target = active ? 1 : 0;
    fadeRef.current += (target - fadeRef.current) * Math.min(1, delta * 3);

    // Enable particles once the tube is mostly visible (trigger state once)
    if (!showParticles && fadeRef.current > 0.6) {
      setShowParticles(true);
    }

    if (tubeMaterialRef.current) {
      tubeMaterialRef.current.opacity = fadeRef.current * 0.7;
    }
    if (arrowMaterialRef.current) {
      arrowMaterialRef.current.opacity = fadeRef.current * 0.9;
    }
  });

  return (
    <group>
      {/* Tube */}
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial
          ref={tubeMaterialRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Arrowhead */}
      <mesh position={[arrowPos.x, arrowPos.y, arrowPos.z]} rotation={[0, arrowRotY, 0]}>
        <coneGeometry args={[0.15, 0.35, 8]} />
        <meshStandardMaterial
          ref={arrowMaterialRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Flow particles — only render after tubes are mostly faded in */}
      {showParticles && Array.from({ length: particleCount }).map((_, i) => (
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
