# Stellar Shell

Stellar Shell is a sci-fi voxel automation game where you command a swarm of autonomous drones to strip-mine asteroids and build a megastructure in space.

![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-0.0.0-orange)

## 🎮 Gameplay

You play as an overseer of a drone swarm. Your goal is to gather resources ("Matter") and use them to expand your fleet and build structures.

- **Explore**: A procedurally generated voxel asteroid field.
- **Mine**: Use your laser or command drones to harvest **Matter** from asteroids.
- **Build**: Place blueprints for structures. Your drones will automatically find tasks and build them using collected matter.
- **Expand**: Construct more drones to increase your harvesting and building power.

## 🕹️ Controls

- **W, A, S, D**: Move Camera
- **Space / Shift**: Move Up / Down
- **Mouse Drag**: Look around
- **Left Click**: Interact (Mine or Build)

## 🛠️ Features

- **Voxel Engine**: Built on `@astrumforge/bvx-kit` for performant, destructible voxel worlds.
- **ECS Architecture**: Powered by `miniplex` for managing thousands of entities.
- **Drone "Brains"**: Autonomous behavior for mining and building tasks.
- **Reactive UI**: Built with React and Zustand.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## 🏗️ Tech Stack

- **Framework**: [React 19](https://react.dev) + [Vite](https://vitejs.dev)
- **3D Engine**: [Three.js](https://threejs.org) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- **ECS**: [Miniplex](https://github.com/hmans/miniplex)
- **State**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)

## 📄 License

MIT
