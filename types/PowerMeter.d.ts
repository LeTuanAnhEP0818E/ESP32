declare class PowerMeter {
    private readonly _rtuCommands;
    private _deviceIndex;
    private _port;
    private _timer;
    private _interval;
    private _path;
    energies: number[];
    totalWh: number;
    constructor();
    private updatePhaseEnergy;
    private sendRequest;
    private next;
    private requestAfter;
    private readAfter;
    private persistEnergies;
    private readEnergies;
    changeInterval(interval_ms: number): void;
}
export default PowerMeter;
