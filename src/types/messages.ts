
export type InputEventMessage =
  | { type: 'KEYDOWN'; code: string }
  | { type: 'KEYUP'; code: string }
  | { type: 'MOUSEDOWN'; button: number }
  | { type: 'MOUSEUP'; button: number }
  | { type: 'MOUSEMOVE'; movementX: number; movementY: number };

export type StateUpdateMessage = {
  type: 'STATE_UPDATE';
  payload: Partial<{
    matter: number;
    energy: number;
    droneCount: number;
    droneCost: number;
  }>;
};

export type WorkerMessage = InputEventMessage | { type: 'RESIZE'; width: number; height: number };
export type MainMessage = StateUpdateMessage;
