import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

type NodeGlowProps = {
  color: string;
  intensity?: number;
  active: boolean;
};

export default function NodeGlow({ color, active }: NodeGlowProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      if (active) {
        const t = clock.getElapsedTime();
        materialRef.current.opacity = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2));
      } else {
        materialRef.current.opacity = 0;
      }
    }
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <torusGeometry args={[1.8, 0.03, 8, 64]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
