import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const Sun = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create a glow texture programmatically
  const glowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
        const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 200, 100, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 150, 50, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 50, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  useFrame((state, delta) => {
      if (meshRef.current) {
          meshRef.current.rotation.y += delta * 0.05;
      }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Core Sun */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshStandardMaterial 
            color="#ffaa00" 
            emissive="#ffdd00" 
            emissiveIntensity={2}
            toneMapped={false}
        />
      </mesh>
      
      {/* Glow Sprite */}
      <sprite scale={[45, 45, 1]}>
         <spriteMaterial map={glowTexture} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>

      {/* Main Light Source - Increased intensity for better illumination */}
      <pointLight intensity={10} distance={2000} decay={1} color="#ffddaa" />
      
      {/* Stronger Ambient Fill Light to illuminate shadow sides */}
      <ambientLight intensity={1.2} color="#665588" />
    </group>
  );
};