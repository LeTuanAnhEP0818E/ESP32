import { EventEmitter } from 'events';
declare class WatchDogTimer extends EventEmitter {
    private timer;
    private timeout;
    constructor();
    start(timeout: number): void;
    stop(): void;
    reset(): void;
}
export default WatchDogTimer;
