import React, { useEffect } from 'react';
import { WorkerMessage } from '../types/messages';

interface InputCaptureProps {
  worker: Worker;
}

export const InputCapture: React.FC<InputCaptureProps> = ({ worker }) => {
  useEffect(() => {
    const post = (msg: WorkerMessage) => worker.postMessage(msg);

    const onKeyDown = (e: KeyboardEvent) => post({ type: 'KEYDOWN', code: e.code });
    const onKeyUp = (e: KeyboardEvent) => post({ type: 'KEYUP', code: e.code });
    const onMouseDown = (e: MouseEvent) => post({ type: 'MOUSEDOWN', button: e.button });
    const onMouseUp = (e: MouseEvent) => post({ type: 'MOUSEUP', button: e.button });

    // We only care about movement for camera rotation, so we throttle or just send it.
    // For high performance, maybe use SharedArrayBuffer, but postMessage is fine for now.
    const onMouseMove = (e: MouseEvent) => {
        if (e.movementX !== 0 || e.movementY !== 0) {
            post({ type: 'MOUSEMOVE', movementX: e.movementX, movementY: e.movementY });
        }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [worker]);

  return null;
};
