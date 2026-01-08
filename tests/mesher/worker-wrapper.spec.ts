import { describe, it, expect } from 'vitest';
import { MesherWorker } from '../../src/mesher/MesherWorker';

describe('MesherWorker', () => {
    it('should be instantiable', () => {
        // Mock Worker global
        global.Worker = class {
            postMessage() {}
            terminate() {}
            onmessage = null;
            addEventListener() {}
            removeEventListener() {}
            dispatchEvent() { return true; }
            onerror = null;
            onmessageerror = null;
        } as unknown as typeof Worker;

        const mesher = new MesherWorker();
        expect(mesher).toBeDefined();
    });
});
