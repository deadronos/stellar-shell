import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ECS } from '../../ecs/world';

export const LaserRenderer = () => {
    // Archetypes
    const dronesArchetype = useMemo(() => ECS.with('isDrone', 'position', 'targetBlock', 'state'), []);

    // Laser Lines Geometry
    const laserGeo = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(1000 * 2 * 3); // 2 points per line
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geo;
    }, []);
    
    const laserRef = useRef<THREE.LineSegments>(null);
    const laserPositions = laserGeo.attributes.position.array as Float32Array;

    useFrame(() => {
        if (!laserRef.current) return;
        
        let laserIdx = 0;

        for (const drone of dronesArchetype) {
             // Update Laser
            if ((drone.state === 'MOVING_TO_MINE' || drone.state === 'MOVING_TO_BUILD') && drone.targetBlock) {
                const dist = drone.position.distanceTo(new THREE.Vector3(drone.targetBlock.x, drone.targetBlock.y, drone.targetBlock.z));
                // Show laser if close enough
                if (dist < 3) {
                    const idx = laserIdx * 6; // 2 points * 3 coords
                    laserPositions[idx] = drone.position.x;
                    laserPositions[idx+1] = drone.position.y;
                    laserPositions[idx+2] = drone.position.z;
                    
                    laserPositions[idx+3] = drone.targetBlock.x;
                    laserPositions[idx+4] = drone.targetBlock.y;
                    laserPositions[idx+5] = drone.targetBlock.z;
                    
                    laserIdx++;
                }
            }
        }
        
        // Update Lasers
        laserGeo.setDrawRange(0, laserIdx * 2);
        laserGeo.attributes.position.needsUpdate = true;
    });

    return (
        <lineSegments ref={laserRef} geometry={laserGeo} frustumCulled={false}>
            <lineBasicMaterial color="#00ffff" opacity={0.5} transparent />
        </lineSegments>
    );
};
