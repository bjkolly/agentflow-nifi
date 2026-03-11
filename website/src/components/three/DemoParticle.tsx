'use client';
import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

type DemoParticleProps = {
  curve: THREE.Curve<THREE.Vector3>;
  color: string;
  speed?: number;
  offset?: number;
};

export default function DemoParticle({ curve, color, speed = 0.3, offset = 0 }: DemoParticleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(offset);

  useFrame((_state, delta) => {
    tRef.current = (tRef.current + delta * speed) % 1;
    if (meshRef.current) {
      const point = curve.getPointAt(tRef.current);
      meshRef.current.position.copy(point);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.12, 12, 12]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}
