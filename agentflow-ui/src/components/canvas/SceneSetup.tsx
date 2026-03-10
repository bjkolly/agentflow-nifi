import * as THREE from 'three';

export default function SceneSetup() {
  return (
    <>
      <ambientLight intensity={0.15} color="#4060ff" />
      <directionalLight position={[10, 20, 10]} intensity={0.6} castShadow />
      <directionalLight position={[-10, 10, -10]} intensity={0.2} color="#6060ff" />
      <fog attach="fog" args={[new THREE.Color('#0a0a0f'), 30, 80]} />
    </>
  );
}
