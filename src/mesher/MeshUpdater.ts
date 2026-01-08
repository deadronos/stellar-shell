import * as THREE from 'three';

export class MeshUpdater {
    static updateGeometry(geometry: THREE.BufferGeometry, meshData: {
        positions: Float32Array;
        normals: Float32Array;
        colors: Float32Array;
        indices: number[];
    }) {
        if (meshData.positions.length === 0) {
            geometry.setDrawRange(0, 0);
            return;
        }

        // Helper to update or create attribute
        const updateAttribute = (name: string, data: Float32Array, itemSize: number) => {
            const attr = geometry.getAttribute(name) as THREE.BufferAttribute;
            if (attr && attr.count >= data.length / itemSize) {
                // We can update in place if the buffer is large enough?
                // Actually, THREE.BufferAttribute needs to match size or be re-allocated if we want to be safe.
                // But usually we just replace the attribute if size changes significantly or isn't a stream.
                // For simplicity in this refactor, we replace the attribute.
                // Using `set` is faster if size matches, but here size changes per chunk update.
                // So recreating the attribute is safer and standard for "new mesh".
                // But we want to reuse the geometry object.
                geometry.setAttribute(name, new THREE.BufferAttribute(data, itemSize));
            } else {
                geometry.setAttribute(name, new THREE.BufferAttribute(data, itemSize));
            }
        };

        updateAttribute('position', meshData.positions, 3);
        updateAttribute('normal', meshData.normals, 3);
        updateAttribute('color', meshData.colors, 3);
        geometry.setIndex(meshData.indices);

        geometry.computeBoundingSphere();
        geometry.setDrawRange(0, meshData.indices.length);
    }
}
