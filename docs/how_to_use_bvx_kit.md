bvx-kit (BitVoxel Engine) is a specialized tool because it focuses purely on the data and geometry generation of voxels, rather than being a full game engine. Its main "superpower" is separating the shape of the world (1-bit on/off) from the material data (colors/textures), which allows for massive, high-resolution worlds that use very little memory.

Here is a guide on the best way to use it, followed by idle/incremental game concepts tailored to its specific features.

1. How to Use This Engine (The "Stack")
Since bvx-kit is renderer-agnostic, you cannot use it alone. You need to build a "Visualization Stack."

The Backend (Data): bvx-kit

Use this to store the world state.

Use its MortonKey system to handle infinite coordinate scrolling (essential for idle games where numbers get huge).

Use the Metadata Layer to store game logic (e.g., "This voxel has 100 HP" or "This voxel is Level 5").

The Frontend (Visuals): Three.js (Recommended) or Babylon.js

bvx-kit will output raw geometry data (vertices/indices). You need to feed this into a Three.js BufferGeometry.

Tip: Don't regenerate the mesh every frame. Only regenerate a chunk's mesh when a voxel inside it changes.

The Input: Raycasting

Since bvx-kit knows where voxels are, you can use a raycaster from your renderer (like Three.js Raycaster) to find the impact point, then ask bvx-kit "Which voxel is at XYZ?" to modify it.