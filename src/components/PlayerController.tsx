import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ECS } from '../ecs/world';

export const PlayerController = () => {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  
  // Create Player Entity on Mount
  useEffect(() => {
    // Check if player exists
    let player = ECS.with('isPlayer').first;
    if (!player) {
       player = ECS.add({
           isPlayer: true,
           position: new THREE.Vector3(20, 10, 20),
           input: {
               forward: false,
               backward: false,
               left: false,
               right: false,
               up: false,
               down: false,
               mine: false,
               build: false,
           },
           cameraQuaternion: { x: 0, y: 0, z: 0, w: 1 }
       });
    }

    // Set initial camera pos
    camera.position.copy(player.position);
    camera.lookAt(50, 0, 50);

    return () => {
        // Optional: Cleanup player? Or persist?
        // ECS.remove(player!);
    };
  }, [camera]);

  // Input Handling
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const onKeyUp = (e: KeyboardEvent) => (keys.current[e.code] = false);
    
    // Mouse State
    const mouseState = {
        isDragging: false,
        dragDistance: 0,
    };
    
    // Mouse Event Handlers
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseState.isDragging = true;
        mouseState.dragDistance = 0;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (mouseState.isDragging) {
        const dx = e.movementX;
        const dy = e.movementY;
        mouseState.dragDistance += Math.abs(dx) + Math.abs(dy);

        // Update Camera Rotation (Euler is fine for local manipulation, but calculation is clearer)
        // Default ThreeJS Camera is XYZ.
        // We generally want "Yaw around World Y" and "Pitch around Local X".
        // Modifying rotation.y and rotation.x directly works if we are careful,
        // but explicit Euler order YXZ is often better for FPS.
        camera.rotation.order = 'YXZ'; 
        camera.rotation.y -= dx * 0.002;
        camera.rotation.x -= dy * 0.002;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseState.isDragging = false;
        // If dragging was minimal, treat as a click to interact
        if (mouseState.dragDistance < 5) {
           // Signal click to ECS
           const player = ECS.with('isPlayer').first;
           if (player && player.input) {
               player.input.mine = true; // Signals "Mine/Interact"
               // Note: System consumes this flag
           }
        }
      }
    };

    const onAltClick = (e: MouseEvent) => {
        if (e.button === 2) { // Right Click
             const player = ECS.with('isPlayer').first;
             if (player && player.input) {
                 player.input.build = true;
             }
        }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    gl.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    gl.domElement.addEventListener('contextmenu', (e) => e.preventDefault()); // Disable context menu
    gl.domElement.addEventListener('mousedown', onAltClick);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      gl.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      gl.domElement.removeEventListener('mousedown', onAltClick);
    };
  }, [gl, camera]);

  // Sync Loop
  useFrame(() => {
      const player = ECS.with('isPlayer').first;
      if (!player || !player.input || !player.cameraQuaternion) return;

      // 1. Sync Input to ECS
      player.input.forward = !!keys.current['KeyW'];
      player.input.backward = !!keys.current['KeyS'];
      player.input.right = !!keys.current['KeyD'];
      player.input.left = !!keys.current['KeyA'];
      player.input.up = !!keys.current['Space'];
      player.input.down = !!keys.current['ShiftLeft'];

      // 2. Sync Camera Rotation to ECS (So system knows direction)
      // Use Quaternion to be checking-math safe
      player.cameraQuaternion.x = camera.quaternion.x;
      player.cameraQuaternion.y = camera.quaternion.y;
      player.cameraQuaternion.z = camera.quaternion.z;
      player.cameraQuaternion.w = camera.quaternion.w;

      // 3. Sync ECS Position to Camera (So view follows physics)
      // Lerp for smoothness? For now, hard sync.
      camera.position.copy(player.position);
  });

  return null;
};
