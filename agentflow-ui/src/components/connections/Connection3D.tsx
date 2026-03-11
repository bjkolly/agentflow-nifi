import { useMemo } from 'react';
import * as THREE from 'three';
import type { FlowConnection } from '../../types/flow';
import { useFlowStore } from '../../store/flowStore';
import { RELATIONSHIP_COLORS } from '../../utils/colors';
import FlowFileParticle from './FlowFileParticle';
import ConnectionLabel from './ConnectionLabel';

type Connection3DProps = {
  connection: FlowConnection;
};

export default function Connection3D({ connection }: Connection3DProps) {
  const sourceNode = useFlowStore((s) => s.nodes[connection.sourceId]);
  const targetNode = useFlowStore((s) => s.nodes[connection.targetId]);

  const color = RELATIONSHIP_COLORS[connection.relationship] ?? RELATIONSHIP_COLORS.default;

  const { curve, midpoint, tubeGeometry } = useMemo(() => {
    if (!sourceNode || !targetNode) return { curve: null, midpoint: null, tubeGeometry: null };

    const start = new THREE.Vector3(...sourceNode.position);
    const end = new THREE.Vector3(...targetNode.position);
    const mid = new THREE.Vector3(
      (start.x + end.x) / 2,
      Math.min(start.y, end.y) - 0.6,
      (start.z + end.z) / 2,
    );

    const c = new THREE.QuadraticBezierCurve3(start, mid, end);
    const geo = new THREE.TubeGeometry(c, 48, 0.05, 8, false);
    const mp: [number, number, number] = [mid.x, mid.y, mid.z];

    return { curve: c, midpoint: mp, tubeGeometry: geo };
  }, [sourceNode, targetNode]);

  if (!curve || !tubeGeometry || !midpoint || !sourceNode || !targetNode) return null;

  const particleCount = Math.min(connection.queuedCount, 5);
  const targetPos = new THREE.Vector3(...targetNode.position);
  const dirToTarget = new THREE.Vector3(...sourceNode.position)
    .sub(targetPos)
    .normalize();
  const arrowPos = targetPos.clone().add(dirToTarget.multiplyScalar(0.5));

  return (
    <group>
      {/* Connection tube */}
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Arrowhead cone — bigger */}
      <mesh
        position={[arrowPos.x, arrowPos.y, arrowPos.z]}
        rotation={[
          0,
          Math.atan2(
            sourceNode.position[0] - targetNode.position[0],
            sourceNode.position[2] - targetNode.position[2],
          ),
          0,
        ]}
      >
        <coneGeometry args={[0.15, 0.35, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Flow file particles */}
      {particleCount > 0 &&
        Array.from({ length: particleCount }).map((_, i) => (
          <FlowFileParticle
            key={i}
            curve={curve}
            color={color}
            speed={0.15 + i * 0.04}
            offset={i / particleCount}
          />
        ))}

      {/* Queue count label */}
      <ConnectionLabel position={midpoint} count={connection.queuedCount} />
    </group>
  );
}
