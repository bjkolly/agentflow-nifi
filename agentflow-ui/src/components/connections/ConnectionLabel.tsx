import { Text } from '@react-three/drei';

type ConnectionLabelProps = {
  position: [number, number, number];
  count: number;
};

export default function ConnectionLabel({ position, count }: ConnectionLabelProps) {
  if (count <= 0) return null;

  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[0.5, 0.2]} />
        <meshBasicMaterial color="#0d1117" transparent opacity={0.8} />
      </mesh>
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.1}
        color="#f59e0b"
        anchorX="center"
        anchorY="middle"
      >
        {String(count)}
      </Text>
    </group>
  );
}
