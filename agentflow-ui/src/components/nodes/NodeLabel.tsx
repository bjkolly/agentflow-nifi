import { Text } from '@react-three/drei';

type NodeLabelProps = {
  text: string;
  position: [number, number, number];
  fontSize?: number;
  color?: string;
};

export default function NodeLabel({ text, position, fontSize = 0.18, color = '#ffffff' }: NodeLabelProps) {
  return (
    <Text
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX="center"
      anchorY="middle"
      maxWidth={3.2}
    >
      {text}
    </Text>
  );
}
