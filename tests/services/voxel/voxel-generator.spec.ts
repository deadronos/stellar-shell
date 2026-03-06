import { describe, it, expect, vi, type Mock } from 'vitest';
import { VoxelGenerator } from '../../../src/services/voxel/VoxelGenerator';
import { BlockType } from '../../../src/types';
import { IVoxelModifier } from '../../../src/services/voxel/types';

const collectGeneratedBlocks = async (seed: number) => {
  vi.resetModules();
  const { VoxelGenerator: FreshVoxelGenerator } = await import('../../../src/services/voxel/VoxelGenerator');
  const placements: [number, number, number, BlockType][] = [];
  const modifierMock: IVoxelModifier = {
    setBlock: (x, y, z, type) => {
      placements.push([x, y, z, type]);
    },
  };

  FreshVoxelGenerator.generateAsteroid(0, 0, 0, 5, modifierMock, seed);
  return placements;
};

describe('VoxelGenerator', () => {
  it('generateAsteroid calls setBlock with correct block types', () => {
    const modifierMock: IVoxelModifier = {
      setBlock: vi.fn(),
    };

    // Generate a small asteroid
    VoxelGenerator.generateAsteroid(0, 0, 0, 5, modifierMock);

    expect(modifierMock.setBlock).toHaveBeenCalled();
    // Verify that at least some calls used core or surface types
    const calls = (modifierMock.setBlock as Mock).mock.calls as unknown[][];
    const hasCore = calls.some((args) => (args[3] as unknown) === BlockType.ASTEROID_CORE);
    const hasSurface = calls.some((args) => (args[3] as unknown) === BlockType.ASTEROID_SURFACE);
    
    expect(hasCore || hasSurface).toBe(true);
  });

  it('generateAsteroid with a non-zero seed completes and places blocks', () => {
    const modifierMock: IVoxelModifier = { setBlock: vi.fn() };
    VoxelGenerator.generateAsteroid(0, 0, 0, 5, modifierMock, 42);
    expect(modifierMock.setBlock).toHaveBeenCalled();
  });

  it('rare ore placement is noise-driven and not strictly core-gated', async () => {
    vi.resetModules();
    vi.doMock('simplex-noise', () => ({
      createNoise3D: () => () => 1,
    }));

    try {
      const { VoxelGenerator: MockedVoxelGenerator } = await import('../../../src/services/voxel/VoxelGenerator');
      const modifierMock: IVoxelModifier = { setBlock: vi.fn() };
      const radius = 5;
      MockedVoxelGenerator.generateAsteroid(0, 0, 0, radius, modifierMock, 0);

      const calls = (modifierMock.setBlock as Mock).mock.calls as [number, number, number, BlockType][];
      const center = { x: 8, y: 8, z: 8 };
      const hasRareOutsideCore = calls.some(([x, y, z, type]) => {
        if (type !== BlockType.RARE_ORE) return false;
        const dx = x - center.x;
        const dy = y - center.y;
        const dz = z - center.z;
        const dist = Math.hypot(dx, dy, dz);
        return dist >= radius * 0.5;
      });

      expect(hasRareOutsideCore).toBe(true);
    } finally {
      vi.doUnmock('simplex-noise');
      vi.resetModules();
    }
  });

  describe('deriveSystemParams', () => {
    // Seeds kept ≤ 0x7fffffff so JS signed-shift stays in-range (matches LCG mask).
    const SAFE_SEEDS = [0, 1, 256, 65535, 0x7fffffff];

    it('returns radius in [16, 24], noiseScale in [0.08, 0.12], rareThreshold in [0.55, 0.70] for all seeds', () => {
      for (const seed of SAFE_SEEDS) {
        const { radius, noiseScale, rareThreshold } = VoxelGenerator.deriveSystemParams(seed);
        expect(radius).toBeGreaterThanOrEqual(16);
        expect(radius).toBeLessThanOrEqual(24);
        expect(noiseScale).toBeCloseTo(noiseScale, 10); // sanity that it's a number
        expect(noiseScale).toBeGreaterThanOrEqual(0.08);
        expect(noiseScale).toBeLessThanOrEqual(0.12);
        expect(rareThreshold).toBeGreaterThanOrEqual(0.55);
        // Allow for floating-point imprecision (e.g. 0.55 + 3*0.05 = 0.7000000000000001)
        expect(rareThreshold).toBeLessThanOrEqual(0.70 + 1e-9);
      }
    });

    it('is deterministic – the same seed always returns the same params', () => {
      const seed = 123456789;
      const first = VoxelGenerator.deriveSystemParams(seed);
      const second = VoxelGenerator.deriveSystemParams(seed);
      expect(first).toEqual(second);
    });

    it('produces different params for different seeds', () => {
      // seeds 0, 256, 65535, and 0x7fffffff span multiple radius buckets.
      const results = [0, 256, 65535, 0x7fffffff].map((s) => VoxelGenerator.deriveSystemParams(s));
      const radii = results.map((r) => r.radius);
      expect(new Set(radii).size).toBeGreaterThan(1);
    });
  });

  describe('seeded topology determinism', () => {
    it('produces identical block placements for the same seed across fresh module loads', async () => {
      const first = await collectGeneratedBlocks(42);
      const second = await collectGeneratedBlocks(42);

      expect(first).toEqual(second);
    });

    it('produces different block placements for at least one different seed', async () => {
      const first = await collectGeneratedBlocks(42);
      const second = await collectGeneratedBlocks(43);

      expect(first).not.toEqual(second);
    });
  });
});
