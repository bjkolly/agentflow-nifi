'use client';
import { RoundedBox, Text } from '@react-three/drei';

type DemoProcessorNodeProps = {
  position: [number, number, number];
  name: string;
  processorType: string;
  color: string;
};

function shortType(processorType: string): string {
  return processorType
    .replace(/Processor$/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

const CARD_TILT = -Math.PI * 0.2;

export default function DemoProcessorNode({ position, name, processorType, color }: DemoProcessorNodeProps) {
  return (
    <group position={position}>
      <group rotation={[CARD_TILT, 0, 0]}>
        {/* Main card */}
        <RoundedBox args={[3.6, 2.2, 0.4]} radius={0.08} smoothness={4}>
          <meshPhysicalMaterial
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
