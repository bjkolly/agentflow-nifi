'use client';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export type CursorSegment = {
  startTime: number;
  endTime: number;
  startPos: [number, number, number];
  endPos: [number, number, number];
};

type DemoCursorProps = {
  segments: CursorSegment[];
  elapsedRef: React.RefObject<number>;
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function DemoCursor({ segments, elapsedRef }: DemoCursorProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Build the cursor shape: a classic pointer arrow
  const cursorShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Pointer arrow (pointing up-left, scaled to 3D scene)
    shape.moveTo(0, 0);
    shape.lineTo(-0.15, -0.5);
    shape.lineTo(-0.05, -0.4);
    shape.lineTo(-0.05, -0.75);
    shape.lineTo(0.05, -0.75);
    shape.lineTo(0.05, -0.4);
    shape.lineTo(0.15, -0.5);
    shape.closePath();
    return shape;
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;

    // Read elapsed from shared ref (updated every frame by parent)
    const elapsed = elapsedRef.current ?? 0;

    // Find the active segment
    let active: CursorSegment | null = null;
    for (const seg of segments) {
      if (elapsed >= seg.startTime && elapsed <= seg.endTime) {
        active = seg;
        break;
      }
    }

    if (!active) {
      // Check if we're in a fade-out window (0.3s after any segment ends)
      let fading = false;
      for (const seg of segments) {
        if (elapsed > seg.endTime && elapsed < seg.endTime + 0.3) {
          fading = true;
          const fadeT = (elapsed - seg.endTime) / 0.3;
          groupRef.current.visible = true;
          groupRef.current.position.set(seg.endPos[0], seg.endPos[1] + fadeT * 3, seg.endPos[2] - fadeT * 2);
          groupRef.current.scale.setScalar(1 - fadeT);
          break;
        }
      }
      if (!fading) {
        groupRef.current.visible = false;
      }
      return;
    }

    // Interpolate position along the segment
    const duration = active.endTime - active.startTime;
    const segT = Math.min(1, Math.max(0, (elapsed - active.startTime) / duration));
    const easedT = easeOutCubic(segT);

    const x = active.startPos[0] + (active.endPos[0] - active.startPos[0]) * easedT;
    const y = active.startPos[1] + (active.endPos[1] - active.startPos[1]) * easedT;
    const z = active.startPos[2] + (active.endPos[2] - active.startPos[2]) * easedT;

    groupRef.current.visible = true;
    groupRef.current.position.set(x, y, z);

    // Fade in during first 20% of segment
    const fadeIn = Math.min(1, segT / 0.2);
    groupRef.current.scale.setScalar(fadeIn);
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Rotate to face camera roughly — tilt toward viewer */}
      <group rotation={[-0.3, 0, 0.1]}>
        {/* Arrow pointer shape */}
        <mesh>
          <shapeGeometry args={[cursorShape]} />
          <meshBasicMaterial
            color="#ffffff"
            side={THREE.DoubleSide}
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* Subtle border/outline via slightly larger dark shape behind */}
        <mesh position={[0, 0, -0.01]}>
          <shapeGeometry args={[cursorShape]} />
          <meshBasicMaterial
            color="#000000"
            side={THREE.DoubleSide}
            transparent
            opacity={0.5}
          />
        </mesh>
      </group>

      {/* Glow light */}
      <pointLight color="#ffffff" intensity={0.5} distance={4} decay={2} />
    </group>
  );
}
