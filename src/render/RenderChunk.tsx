import React, { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { Entity } from '../ecs/world';
import { MeshUpdater } from '../mesher/MeshUpdater';

interface RenderChunkProps {
    entity: Entity;
}

export const RenderChunk: React.FC<RenderChunkProps> = ({ entity }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const geometryRef = useRef<THREE.BufferGeometry>(new THREE.BufferGeometry());

    useLayoutEffect(() => {
        // Subscribe to geometry updates from the entity?
        // Or does the entity hold the raw mesh data now?
        // The plan says "Subscribe to engine/events, request meshes from mesher".
        // In the current ECS architecture, `ChunkSystem` pushes data to `entity.geometry`.
        // We want to change that.

        // New flow:
        // Entity has `meshData` component (Raw buffers) instead of `geometry` (THREE object).
        // OR `ChunkSystem` uses `MeshUpdater` to update `entity.geometry`.

        // Let's assume we are moving towards `entity.meshData`.

        if (entity.meshData && meshRef.current) {
             MeshUpdater.updateGeometry(geometryRef.current, entity.meshData);
        }
    }, [entity.meshData]); // Reactivity depends on how we update this.

    // If we are sticking to the migration plan:
    // "Update one chunk rendering flow to use MeshUpdater."

    // If the entity still has `geometry` (THREE object), we just use it.
    // But we want to separate logic (System) from View (Three Objects).
    // System should produce Data. View should consume Data.

    // So RenderChunk should hold the THREE.Geometry.

    return (
        <mesh
            ref={meshRef}
            position={entity.position}
            geometry={geometryRef.current}
        >
            <meshStandardMaterial
                vertexColors
                roughness={0.7}
                metalness={0.1}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};
