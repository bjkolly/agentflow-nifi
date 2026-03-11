import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { FlowNode } from '../../types/flow';
import { STATE_COLORS } from '../../utils/colors';
import { useUiStore } from '../../store/uiStore';
import { useFlowStore } from '../../store/flowStore';
import NodeLabel from './NodeLabel';
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

// Tilt cards ~35° backward so they face the overhead camera
const CARD_TILT = -Math.PI * 0.2;

export default function ProcessorNode3D({ node }: ProcessorNode3DProps) {
  const selectedNodeId = useUiStore((s) => s.selectedNodeId);
  const selectNode = useUiStore((s) => s.selectNode);
  const showContextMenu = useUiStore((s) => s.showContextMenu);
  const setIsDraggingNode = useUiStore((s) => s.setIsDraggingNode);
  const setNodePosition = useFlowStore((s) => s.setNodePosition);

  const { camera, gl } = useThree();

  const isSelected = selectedNodeId === node.id;
  const stateColor = STATE_COLORS[node.state] ?? STATE_COLORS.STOPPED;
  const statsLine = `In: ${node.stats.flowFilesIn}  Out: ${node.stats.flowFilesOut}`;

  const isDragging = useRef(false);
  const dragStarted = useRef(false);
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragOffset = useRef(new THREE.Vector3());

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      isDragging.current = true;
      dragStarted.current = false;
      pointerDownPos.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };

      // Set up drag plane at node's Y height
      dragPlane.current.set(new THREE.Vector3(0, 1, 0), -node.position[1]);

      // Calculate offset between click point and node center
      const raycaster = new THREE.Raycaster();
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.nativeEvent.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.nativeEvent.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      const hitPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragPlane.current, hitPoint);
      dragOffset.current.set(
        node.position[0] - hitPoint.x,
        0,
        node.position[2] - hitPoint.z,
      );

      // Attach DOM-level listeners for reliable tracking outside mesh
      const onPointerMove = (domEvent: PointerEvent) => {
        if (!isDragging.current) return;

        // Only start drag after 4px movement (prevents accidental drags on click)
        if (!dragStarted.current) {
          const dx = domEvent.clientX - pointerDownPos.current.x;
          const dy = domEvent.clientY - pointerDownPos.current.y;
          if (Math.sqrt(dx * dx + dy * dy) < 4) return;
          dragStarted.current = true;
          setIsDraggingNode(true);
          gl.domElement.style.cursor = 'grabbing';
        }

        const r = gl.domElement.getBoundingClientRect();
        const mx = ((domEvent.clientX - r.left) / r.width) * 2 - 1;
        const my = -((domEvent.clientY - r.top) / r.height) * 2 + 1;

        const rc = new THREE.Raycaster();
        rc.setFromCamera(new THREE.Vector2(mx, my), camera);
        const intersection = new THREE.Vector3();
        rc.ray.intersectPlane(dragPlane.current, intersection);

        if (intersection) {
          setNodePosition(node.id, [
            intersection.x + dragOffset.current.x,
            node.position[1],
            intersection.z + dragOffset.current.z,
          ]);
        }
      };

      const onPointerUp = () => {
        isDragging.current = false;
        if (dragStarted.current) {
          setIsDraggingNode(false);
          gl.domElement.style.cursor = 'auto';
        } else {
          // It was just a click, not a drag — select the node
          selectNode(node.id);
        }
        dragStarted.current = false;
        gl.domElement.removeEventListener('pointermove', onPointerMove);
        gl.domElement.removeEventListener('pointerup', onPointerUp);
      };

      gl.domElement.addEventListener('pointermove', onPointerMove);
      gl.domElement.addEventListener('pointerup', onPointerUp);
    },
    [camera, gl, node.id, node.position, setNodePosition, setIsDraggingNode, selectNode],
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
    if (!isDragging.current) {
      gl.domElement.style.cursor = 'grab';
    }
  }, [gl]);

  const handlePointerOut = useCallback(() => {
    if (!isDragging.current) {
      gl.domElement.style.cursor = 'auto';
    }
  }, [gl]);

  return (
    <group position={node.position}>
      {/* Tilt the whole card group toward the camera */}
      <group rotation={[CARD_TILT, 0, 0]}>
        {/* Main card — compact with more depth */}
        <RoundedBox
          args={[3.6, 2.2, 0.4]}
          radius={0.08}
          smoothness={4}
          onPointerDown={handlePointerDown}
          onContextMenu={handleContextMenu}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
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
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={0.6}
          />
        </mesh>

        {/* Side accent strips */}
        <mesh position={[-1.8, 0, 0.21]}>
          <boxGeometry args={[0.04, 2.2, 0.41]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={0.3}
            transparent
            opacity={0.5}
          />
        </mesh>
        <mesh position={[1.8, 0, 0.21]}>
          <boxGeometry args={[0.04, 2.2, 0.41]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={0.3}
            transparent
            opacity={0.5}
          />
        </mesh>

        {/* Labels */}
        <NodeLabel text={node.name} position={[0, 0.4, 0.22]} fontSize={0.24} />
        <NodeLabel text={shortType(node.processorType)} position={[0, 0.0, 0.22]} fontSize={0.14} color="#9ca3af" />
        <NodeLabel text={statsLine} position={[0, -0.4, 0.22]} fontSize={0.12} color="#6b7280" />

        {/* Status dot */}
        <mesh position={[1.5, 0.85, 0.22]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color={stateColor}
            emissive={stateColor}
            emissiveIntensity={1.2}
          />
        </mesh>

        {/* Selection outline */}
        {isSelected && (
          <mesh>
            <boxGeometry args={[3.9, 2.5, 0.55]} />
            <meshBasicMaterial
              color="#3b82f6"
              wireframe
              transparent
              opacity={0.6}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )}
      </group>

      {/* Point light behind the card for colored halo */}
      <pointLight
        position={[0, 1, -1]}
        color={node.color}
        intensity={0.8}
        distance={8}
        decay={2}
      />

    </group>
  );
}
