import { useCallback } from 'react';
import { RoundedBox } from '@react-three/drei';
import type { FlowGroup } from '../../types/flow';
import { useUiStore } from '../../store/uiStore';
import NodeLabel from './NodeLabel';
import type { ThreeEvent } from '@react-three/fiber';

type ProcessGroupNode3DProps = {
  group: FlowGroup;
};

export default function ProcessGroupNode3D({ group }: ProcessGroupNode3DProps) {
  const selectNode = useUiStore((s) => s.selectNode);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      selectNode(group.id);
    },
    [selectNode, group.id],
  );

  const handlePointerOver = useCallback(() => {
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'auto';
  }, []);

  const statusText = `Running: ${group.runningCount}  Stopped: ${group.stoppedCount}`;

  return (
    <group position={group.position}>
      <RoundedBox
        args={[4.5, 2.5, 0.15]}
        radius={0.08}
        smoothness={4}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          color="#0d1117"
          roughness={0.3}
          metalness={0.1}
          transparent
          opacity={0.75}
        />
      </RoundedBox>

      {/* Left accent bar */}
      <mesh position={[-2.17, 0, 0.08]}>
        <boxGeometry args={[0.08, 2.3, 0.16]} />
        <meshStandardMaterial
          color={group.color}
          emissive={group.color}
          emissiveIntensity={0.3}
        />
      </mesh>

      <NodeLabel text={group.name} position={[0, 0.4, 0.1]} fontSize={0.2} />
      <NodeLabel text={statusText} position={[0, -0.2, 0.1]} fontSize={0.1} color="#9ca3af" />
    </group>
  );
}
