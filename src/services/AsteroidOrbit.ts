export interface AsteroidOrbitConfig {
  enabled: boolean;
  radius: number;
  speed: number;
  verticalAmplitude: number;
}

export interface OrbitOffset {
  x: number;
  y: number;
  z: number;
}

const ZERO_OFFSET: OrbitOffset = { x: 0, y: 0, z: 0 };

export const getAsteroidOrbitOffset = (
  elapsedTime: number,
  config: AsteroidOrbitConfig,
): OrbitOffset => {
  if (!config.enabled || config.radius <= 0 || config.speed === 0) {
    return ZERO_OFFSET;
  }

  const angle = elapsedTime * config.speed;
  return {
    x: Math.cos(angle) * config.radius,
    y: Math.sin(angle * 0.5) * config.verticalAmplitude,
    z: Math.sin(angle) * config.radius,
  };
};
