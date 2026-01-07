export class MesherWorker {
    private worker: Worker;

    constructor() {
        this.worker = new Worker(new URL('./worker.ts', import.meta.url), {
            type: 'module'
        });
    }

    public terminate() {
        this.worker.terminate();
    }
}
