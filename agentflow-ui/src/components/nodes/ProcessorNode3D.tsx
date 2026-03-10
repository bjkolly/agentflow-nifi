import { useCallback } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import type { FlowNode } from '../../types/flow';
import { STATE_COLORS } from '../../utils/colors';
import { useUiStore } from '../../store/uiStore';
import NodeLabel from './NodeLabel';
import NodeGlow from './NodeGlow';
import type { ThreeEvent } from '@react-three/fiber';

type ProcessorNode3DProps = {
  node: FlowNode;
};

function shortType(processorType: string): string {
  const className = processorType.includes('.')
    ? processorType.split('.').pop()!
    : processorType;
  return className
    .replace(/Processor$/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

export default function ProcessorNode3D({ node }: ProcessorNode3DProps) {
  const selectedNodeId = useUiStore((s) => s.selectedNodeId);
  const selectNode = useUiStore((s) => s.selectNode);
  const showContextMenu = useUiStore((s) => s.showContextMenu);

  const isSelected = selectedNodeId === node.id;
  const stateColor = STATE_COLORS[node.state] ?? STATE_COLORS.STOPPED;
  const statsLine = `In: ${node.stats.flowFilesIn}  Out: ${node.stats.flowFilesOut}`;

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      selectNode(node.id);
    },
    [selectNode, node.id],
  );

  const handleContextMenu = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      const domEvent = e.nativeEvent;
      domEvent.preventDefault();
      showContextMenu(domEvent.clientX, domEvent.clientY, node.id);
    },
    [showContextMenu, node.id],
  );

  const handlePointerOver = useCallback(() => {
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'auto';
  }, []);

  return (
    <group position={node.position}>
      {/* Main card */}
      <RoundedBox
        args={[3.2, 2, 0.12]}
        radius={0.06}
        smoothness={4}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          color="#0d1117"
          roughness={0.3}
          metalness={0.1}
          transparent
          opacity={0.9}
        />
      </RoundedBox>

      {/* Top accent bar */}
      <mesh position={[0, 0.96, 0.065]}>
        <boxGeometry args={[3.2, 0.08, 0.13]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Labels */}
      <NodeLabel text={node.name} position={[0, 0.4, 0.08]} fontSize={0.17} />
      <NodeLabel text={shortType(node.processorType)} position={[0, 0.05, 0.08]} fontSize={0.11} color="#9ca3af" />
      <NodeLabel text={statsLine} position={[0, -0.35, 0.08]} fontSize={0.09} color="#6b7280" />

      {/* Status dot */}
      <mesh position={[1.4, 0.8, 0.08]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color={stateColor}
          emissive={stateColor}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Glow ring */}
      <NodeGlow color={node.color} active={node.state === 'RUNNING'} />

      {/* Selection outline */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[3.4, 2.2, 0.2]} />
          <meshBasicMaterial
            color="#3b82f6"
            wireframe
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
}
