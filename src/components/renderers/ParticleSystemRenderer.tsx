import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleEvents } from '../../services/ParticleEvents';

const MAX_PARTICLES = 1000;

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  active: boolean;
}

export const ParticleSystemRenderer = () => {
  const particleMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummyParticle = useMemo(() => new THREE.Object3D(), []);
  const particles = useRef<Particle[]>([]);

  // Initialize particles & subscribe to events
  useMemo(() => {
    // Fill pool
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particles.current.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        life: 0,
        active: false,
      });
    }
  }, []);

  React.useEffect(() => {
    // Subscribe
    return ParticleEvents.subscribe((pos, color, count = 1) => {
      let spawned = 0;
      for (const p of particles.current) {
        if (!p.active) {
            p.active = true;
            p.position.copy(pos);
            // Random velocity spray
            const rx = Math.random() - 0.5;
            const ry = Math.random() - 0.5;
            const rz = Math.random() - 0.5;
            p.velocity.set(rx * 5, ry * 5, rz * 5);
            
            p.color.copy(color);
            const rLife = Math.random();
            p.life = 0.5 + rLife * 0.5;
            spawned++;
            if (spawned >= count) break;
        }
      }
    });
  }, []);

  useFrame((state, delta) => {
    if (!particleMeshRef.current) return;

    particles.current.forEach((p, idx) => {
      if (p.active) {
        p.life -= delta;
        p.velocity.multiplyScalar(0.95);
        p.position.addScaledVector(p.velocity, delta);

        if (p.life <= 0) {
          p.active = false;
          dummyParticle.scale.set(0, 0, 0);
        } else {
          const s = p.life * 0.15;
          dummyParticle.position.copy(p.position);
          dummyParticle.scale.set(s, s, s);
          dummyParticle.rotation.x += delta * 5;
          dummyParticle.rotation.y += delta * 5;
        }
        dummyParticle.updateMatrix();
        particleMeshRef.current!.setMatrixAt(idx, dummyParticle.matrix);
        particleMeshRef.current!.setColorAt(idx, p.color);
      } else {
        dummyParticle.scale.set(0, 0, 0);
        dummyParticle.updateMatrix();
        particleMeshRef.current!.setMatrixAt(idx, dummyParticle.matrix);
      }
    });

    particleMeshRef.current.instanceMatrix.needsUpdate = true;
    if (particleMeshRef.current.instanceColor)
      particleMeshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={particleMeshRef}
      args={[undefined, undefined, MAX_PARTICLES]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};
