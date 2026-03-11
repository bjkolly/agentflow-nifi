import * as THREE from 'three';

export default function SceneSetup() {
  return (
    <>
      <ambientLight intensity={0.3} color="#4060ff" />
      <directionalLight position={[10, 25, 15]} intensity={0.8} castShadow />
      <directionalLight position={[-10, 15, -10]} intensity={0.3} color="#6060ff" />
      <pointLight position={[0, 10, 0]} intensity={0.4} color="#7c3aed" distance={50} />
      <fog attach="fog" args={[new THREE.Color('#0a0a0f'), 40, 100]} />
    </>
  );
}
