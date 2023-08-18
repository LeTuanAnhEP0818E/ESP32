declare class PowerMeter {
    private _interval;
    energies: number[];
    totalWh: number;
    private _path;
    constructor(interval_ms?: number);
    private updateEnergy;
    private persistEnergies;
    private readEnergies;
    changeInterval(interval_ms: number): void;
}
export default PowerMeter;
