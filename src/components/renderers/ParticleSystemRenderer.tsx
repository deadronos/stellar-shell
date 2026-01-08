import React, { useRef, useMemo, useEffect } from 'react';
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

  // Use useMemo to initialize the pool once, instead of pushing to ref.current in render
  const particles = useMemo(() => {
    const pool: Particle[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      pool.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        life: 0,
        active: false,
      });
    }
    return pool;
  }, []);

  useEffect(() => {
    // Subscribe
    return ParticleEvents.subscribe((pos, color, count = 1, options) => {
      let spawned = 0;
      for (const p of particles) {
        if (!p.active) {
            p.active = true;
            p.position.copy(pos);

            if (options?.velocity) {
                p.velocity.copy(options.velocity);
            } else {
                // Random velocity spray
                const rx = Math.random() - 0.5;
                const ry = Math.random() - 0.5;
                const rz = Math.random() - 0.5;
                p.velocity.set(rx * 5, ry * 5, rz * 5);
            }

            p.color.copy(color);

            if (options?.life) {
                p.life = options.life;
            } else {
                const rLife = Math.random();
                p.life = 0.5 + rLife * 0.5;
            }

            spawned++;
            if (spawned >= count) break;
        }
      }
    });
  }, [particles]);

  useFrame((state, delta) => {
    if (!particleMeshRef.current) return;

    particles.forEach((p, idx) => {
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
