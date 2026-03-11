import { useMemo } from 'react';
import * as THREE from 'three';

const vertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uLineWidth;
  varying vec3 vWorldPosition;

  void main() {
    float gridX = abs(fract(vWorldPosition.x - 0.5) - 0.5);
    float gridZ = abs(fract(vWorldPosition.z - 0.5) - 0.5);

    float lineX = smoothstep(uLineWidth, uLineWidth + 0.01, gridX);
    float lineZ = smoothstep(uLineWidth, uLineWidth + 0.01, gridZ);

    float line = 1.0 - min(lineX, lineZ);

    // Major grid lines every 5 units
    float majorX = abs(fract(vWorldPosition.x / 5.0 - 0.5) - 0.5) * 5.0;
    float majorZ = abs(fract(vWorldPosition.z / 5.0 - 0.5) - 0.5) * 5.0;
    float majorLineX = smoothstep(uLineWidth * 2.0, uLineWidth * 2.0 + 0.02, majorX);
    float majorLineZ = smoothstep(uLineWidth * 2.0, uLineWidth * 2.0 + 0.02, majorZ);
    float majorLine = 1.0 - min(majorLineX, majorLineZ);

    float distFromCenter = length(vWorldPosition.xz) / 80.0;
    float fade = 1.0 - smoothstep(0.3, 1.0, distFromCenter);

    vec3 color = mix(uColor, uAccent, majorLine * 0.5);
    float alpha = max(line * 0.35, majorLine * 0.5) * fade;

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function GridFloor() {
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color('#1e4a6e') },
        uAccent: { value: new THREE.Color('#2a6fa8') },
        uLineWidth: { value: 0.02 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={shaderMaterial}>
      <planeGeometry args={[200, 200, 1, 1]} />
    </mesh>
  );
}
