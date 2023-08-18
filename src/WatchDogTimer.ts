import { EventEmitter } from 'events';

class WatchDogTimer extends EventEmitter {
    private timer: NodeJS.Timeout | undefined;
    private timeout: number;

    constructor() {
        super();
        this.timeout = 0;
    }

    /**
     * Starts the timer with a given timeout.
     * @param timeout The timeout in milliseconds.
     */
    public start(timeout: number): void {
        this.timeout = timeout;
        this.timer = setTimeout(() => {
            this.emit('timeout'); // woof woof
        }, this.timeout);
    }

    /**
     * Stops the timer if it's running.
     */
    public stop(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }

    /**
     * Clear current running timer and start a new one
     */
    public reset(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                this.emit('timeout'); // woof woof
            }, this.timeout);
        }
    }
}

export default WatchDogTimer;