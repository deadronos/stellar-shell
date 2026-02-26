import { CHUNK_SIZE } from '../../constants';
import { useStore } from '../../state/store';
import { getAsteroidOrbitOffset } from '../../services/AsteroidOrbit';
import { ECS } from '../world';

export const AsteroidOrbitSystem = (elapsedTime: number) => {
  const orbitConfig = useStore.getState();
  const offset = getAsteroidOrbitOffset(elapsedTime, {
    enabled: orbitConfig.asteroidOrbitEnabled,
    radius: orbitConfig.asteroidOrbitRadius,
    speed: orbitConfig.asteroidOrbitSpeed,
    verticalAmplitude: orbitConfig.asteroidOrbitVerticalAmplitude,
  });

  const chunks = ECS.with('isChunk', 'chunkPosition', 'position');
  for (const chunk of chunks) {
    const { x, y, z } = chunk.chunkPosition;
    chunk.position.set(
      x * CHUNK_SIZE + offset.x,
      y * CHUNK_SIZE + offset.y,
      z * CHUNK_SIZE + offset.z,
    );
  }
};
