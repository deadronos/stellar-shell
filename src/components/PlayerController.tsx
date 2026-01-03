import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BvxEngine } from '../services/BvxEngine';
import { BlockType } from '../types';
import { useStore } from '../state/store';
import { FRAME_COST } from '../constants';

const ENGINE = BvxEngine.getInstance();
const SPEED = 15;

export const PlayerController = () => {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const addMatter = useStore((state) => state.addMatter);
  const consumeMatter = useStore((state) => state.consumeMatter);
  const selectedTool = useStore((state) => state.selectedTool);
  const selectedBlueprint = useStore((state) => state.selectedBlueprint);

  // Drag state
  const isDragging = useRef(false);
  const dragDistance = useRef(0);

  // Initial Position near the asteroid
  useEffect(() => {
    camera.position.set(20, 10, 20);
    camera.lookAt(50, 0, 50);
  }, [camera]);

  // Input Handling
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const onKeyUp = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Interaction (Mine/Build)
    const performInteraction = () => {
      // Raycast from center of camera
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      raycaster.far = 10;

      let hitBlock = null;
      let hitPos = new THREE.Vector3();
      let lastAirPos = new THREE.Vector3();

      // DDA-like Raycast
      const maxDist = 8;
      const step = 0.1;
      const rayPos = camera.position.clone();
      const rayDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

      for (let d = 0; d < maxDist; d += step) {
        const testPos = rayPos.clone().add(rayDir.clone().multiplyScalar(d));
        const bx = Math.floor(testPos.x);
        const by = Math.floor(testPos.y);
        const bz = Math.floor(testPos.z);

        const block = ENGINE.getBlock(bx, by, bz);
        if (block !== BlockType.AIR && !(selectedTool === 'BUILD' && block === BlockType.FRAME)) {
          hitBlock = block;
          hitPos.set(bx, by, bz);
          break;
        }
        lastAirPos.set(bx, by, bz);
      }

      if (selectedTool === 'LASER') {
        // MINE
        if (hitBlock) {
          ENGINE.setBlock(hitPos.x, hitPos.y, hitPos.z, BlockType.AIR);
          // Determine resource
          if (hitBlock === BlockType.ASTEROID_CORE) addMatter(2);
          else if (hitBlock === BlockType.ASTEROID_SURFACE) addMatter(1);
          else if (hitBlock === BlockType.FRAME) addMatter(FRAME_COST); // Recycle
        }
      } else if (selectedTool === 'BUILD') {
        // BUILD
        // Place blueprint at last air pos
        if (consumeMatter(FRAME_COST)) {
          ENGINE.setBlock(lastAirPos.x, lastAirPos.y, lastAirPos.z, selectedBlueprint);
        }
      }
    };

    // Mouse Event Handlers
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        // Left Click
        isDragging.current = true;
        dragDistance.current = 0;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const dx = e.movementX;
        const dy = e.movementY;
        dragDistance.current += Math.abs(dx) + Math.abs(dy);

        camera.rotation.y -= dx * 0.002;
        camera.rotation.x -= dy * 0.002;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging.current = false;
        // If dragging was minimal, treat as a click to interact
        if (dragDistance.current < 5) {
          performInteraction();
        }
      }
    };

    gl.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      gl.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [gl, camera, addMatter, consumeMatter, selectedTool, selectedBlueprint]);

  // Movement Physics
  useFrame((state, delta) => {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

    const moveVec = new THREE.Vector3();
    if (keys.current['KeyW']) moveVec.add(forward);
    if (keys.current['KeyS']) moveVec.sub(forward);
    if (keys.current['KeyD']) moveVec.add(right);
    if (keys.current['KeyA']) moveVec.sub(right);
    if (keys.current['Space']) moveVec.add(up);
    if (keys.current['ShiftLeft']) moveVec.sub(up);

    if (moveVec.length() > 0) {
      moveVec.normalize().multiplyScalar(SPEED * delta);
      camera.position.add(moveVec);
    }
  });

  return null;
};
