import { render } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { RenderChunk } from '../../src/render/RenderChunk';
import { CompletedSectionRenderer } from '../../src/render/CompletedSectionRenderer';
import { Entity } from '../../src/ecs/world';

const createChunkEntity = (): Entity => ({
  isChunk: true,
  chunkKey: '0,0,0',
  chunkPosition: { x: 0, y: 0, z: 0 },
  position: new THREE.Vector3(0, 0, 0),
});

describe('chunk renderers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('disposes RenderChunk geometry on unmount', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const disposeSpy = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose');
    const { unmount } = render(<RenderChunk entity={createChunkEntity()} />);

    unmount();

    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });

  it('disposes CompletedSectionRenderer geometry on unmount', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const disposeSpy = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose');
    const { unmount } = render(<CompletedSectionRenderer entity={createChunkEntity()} />);

    unmount();

    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });
});
