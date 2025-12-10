"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, MeshDistortMaterial } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

/**
 * Animated bubble/sphere component
 */
function Bubble({
  position = [0, 0, 0],
  color = "#6366f1",
  emissive = "#4f46e5",
  scale = 1,
  speed = 1,
}: {
  position?: [number, number, number];
  color?: string;
  emissive?: string;
  scale?: number;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2 * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.8}
          distort={0.3}
          speed={2}
        />
      </mesh>
    </Float>
  );
}

/**
 * Floating particles in the background
 */
function Particles({ count = 100 }: { count?: number }) {
  const points = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#6366f1"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * Main Hero Scene for the landing page
 */
export function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 2]}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#8b5cf6" />

      <Bubble position={[0, 0, 0]} scale={1.5} />
      <Bubble position={[-2, 1, -2]} color="#8b5cf6" emissive="#7c3aed" scale={0.5} speed={0.8} />
      <Bubble position={[2, -1, -1]} color="#06b6d4" emissive="#0891b2" scale={0.3} speed={1.2} />
      
      <Particles count={50} />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
}

/**
 * Knowledge Graph Scene (placeholder for future feature)
 * Will display documents as connected nodes
 */
export function KnowledgeGraphScene({
  nodes = [],
}: {
  nodes?: { id: string; label: string; x: number; y: number; z: number }[];
}) {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      {nodes.map((node) => (
        <mesh key={node.id} position={[node.x, node.y, node.z]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#6366f1" />
        </mesh>
      ))}

      <OrbitControls />
    </Canvas>
  );
}

/**
 * Loading animation scene
 */
export function LoadingScene() {
  return (
    <Canvas camera={{ position: [0, 0, 3] }}>
      <ambientLight intensity={0.5} />
      <Float speed={4} rotationIntensity={2} floatIntensity={2}>
        <mesh>
          <torusGeometry args={[1, 0.3, 16, 100]} />
          <meshStandardMaterial
            color="#6366f1"
            emissive="#4f46e5"
            emissiveIntensity={0.5}
          />
        </mesh>
      </Float>
    </Canvas>
  );
}

export default HeroScene;
