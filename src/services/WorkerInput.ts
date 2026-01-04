import { WorkerMessage } from '../types/messages';

class WorkerInputManager {
  keys: Record<string, boolean> = {};
  mouseButtons: Record<number, boolean> = {};
  mouseMovement: { x: number; y: number } = { x: 0, y: 0 };

  constructor() {
    self.addEventListener('message', (e: MessageEvent) => {
      const msg = e.data as WorkerMessage;
      this.handleMessage(msg);
    });
  }

  handleMessage(msg: WorkerMessage) {
    switch (msg.type) {
      case 'KEYDOWN':
        this.keys[msg.code] = true;
        break;
      case 'KEYUP':
        this.keys[msg.code] = false;
        break;
      case 'MOUSEDOWN':
        this.mouseButtons[msg.button] = true;
        break;
      case 'MOUSEUP':
        this.mouseButtons[msg.button] = false;
        break;
      case 'MOUSEMOVE':
        this.mouseMovement.x += msg.movementX;
        this.mouseMovement.y += msg.movementY;
        break;
    }
  }

  // To be called every frame to consume the accumulated delta
  getAndResetMouseDelta() {
    const delta = { ...this.mouseMovement };
    this.mouseMovement = { x: 0, y: 0 };
    return delta;
  }
}

export const workerInput = new WorkerInputManager();
