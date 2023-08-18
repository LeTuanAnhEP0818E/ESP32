declare class GPS {
    longitude: string;
    latitude: string;
    private _interval;
    constructor(interval_ms?: number);
    private updateGPS;
    changeInterval(interval_ms: number): void;
}
export default GPS;
