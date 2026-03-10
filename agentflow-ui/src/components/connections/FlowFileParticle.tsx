import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

type FlowFileParticleProps = {
  curve: THREE.Curve<THREE.Vector3>;
  color: string;
  speed?: number;
  offset?: number;
};

export default function FlowFileParticle({ curve, color, speed = 0.3, offset = 0 }: FlowFileParticleProps) {
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
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
