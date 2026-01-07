import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Entity } from '../ecs/world';
import { MeshUpdater } from '../mesher/MeshUpdater';

interface RenderChunkProps {
    entity: Entity;
}

export const RenderChunk: React.FC<RenderChunkProps> = ({ entity }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const geometryRef = useRef<THREE.BufferGeometry>(new THREE.BufferGeometry());
    const lastMeshDataRef = useRef<any>(null); // Track last mesh data version

    useFrame(() => {
        // Poll for mesh data changes
        // This is necessary because VoxelWorld doesn't re-render on entity component changes
        if (entity.meshData && entity.meshData !== lastMeshDataRef.current) {
            lastMeshDataRef.current = entity.meshData;
            MeshUpdater.updateGeometry(geometryRef.current, entity.meshData);
        }
    });

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
