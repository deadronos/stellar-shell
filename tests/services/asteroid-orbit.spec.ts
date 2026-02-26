import { describe, expect, it } from 'vitest';
import { getAsteroidOrbitOffset } from '../../src/services/AsteroidOrbit';

describe('AsteroidOrbit', () => {
  it('returns deterministic offsets for identical inputs', () => {
    const config = {
      enabled: true,
      radius: 20,
      speed: 0.1,
      verticalAmplitude: 2,
    };

    const first = getAsteroidOrbitOffset(12.5, config);
    const second = getAsteroidOrbitOffset(12.5, config);

    expect(first).toEqual(second);
  });

  it('returns zero offset when orbit motion is disabled', () => {
    const offset = getAsteroidOrbitOffset(12.5, {
      enabled: false,
      radius: 20,
      speed: 0.1,
      verticalAmplitude: 2,
    });

    expect(offset).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('calculates expected horizontal and vertical offsets', () => {
    const offset = getAsteroidOrbitOffset(Math.PI / 2, {
      enabled: true,
      radius: 10,
      speed: 1,
      verticalAmplitude: 2,
    });

    expect(offset.x).toBeCloseTo(0, 5);
    expect(offset.z).toBeCloseTo(10, 5);
    expect(offset.y).toBeCloseTo(Math.SQRT2, 5);
  });

  it('returns zero offset when radius is non-positive', () => {
    const offset = getAsteroidOrbitOffset(2, {
      enabled: true,
      radius: 0,
      speed: 1,
      verticalAmplitude: 2,
    });

    expect(offset).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('returns zero offset when speed is zero', () => {
    const offset = getAsteroidOrbitOffset(2, {
      enabled: true,
      radius: 10,
      speed: 0,
      verticalAmplitude: 2,
    });

    expect(offset).toEqual({ x: 0, y: 0, z: 0 });
  });
});
