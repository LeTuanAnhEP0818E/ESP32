// import { SerialPort } from "serialport";
import { extractRtuData, PMDATA } from "../extractRtuData";
import WatchDogTimer from "../WatchDogTimer";
import _ from "lodash";
import { SerialConfig } from "./SensorTypes";
import { SerialPort } from "serialport";

export abstract class IPowerMeterReader {
    abstract getTotalWH(): number;
    phases: {
        U: number;
        I: number;
        cosPhi: number;
    }[] = [];
}

interface PowermeterConfig extends SerialConfig {
    isMock?: boolean;
}

export function createPowerMeterReader(config: PowermeterConfig): IPowerMeterReader {
    if (config.isMock) {
        return new MockPowerMeterReader();
    }
    // if (config.connect instanceof serialcon)
    throw new Error("");
}

export class PowerMeterReader extends IPowerMeterReader {
    private readonly _rtuCommands: ReadonlyArray<string>;
    private _port: SerialPort;
    private _deviceIndex = 0;
    private _timer: WatchDogTimer;
    private _interval: number = 1000;

    public energies = [0, 0, 0]; // in Watt*hours (Wh)
    public phases = [
        { U: 220, I: 68, cosPhi: 0.99 },
        { U: 220, I: 68, cosPhi: 0.99 },
        { U: 220, I: 68, cosPhi: 0.99 },
    ];
    public totalWh = 0;
    public changed = true;

    constructor(config: SerialConfig) {
        console.log(`Create power reader serial : ${JSON.stringify(config)}`);
        
        super();
        this._rtuCommands = Object.freeze([
            "01040000000a700d", // PZEM@rtu address: 0x01
            "02040000000a703e", // PZEM@rtu address: 0x02
            "03040000000a71ef", // PZEM@rtu address: 0x03
        ]);
        this._timer = new WatchDogTimer();

        this._timer.on("timeout", () => {
            this.phases[this._deviceIndex].U = 0;
            this.phases[this._deviceIndex].I = 0;
            this.phases[this._deviceIndex].cosPhi = 0;
            // console.error(`No response from device ${this._deviceIndex} --> next device`);
            this.next();
        });

        this._port = new SerialPort({ path: config.path, baudRate: config.baudRate });

        this._port.on("error", (err) => {
            console.error(err.message);
        });

        this._port.on("readable", async (): Promise<void> => {
            try {
                const serialResponse = await this.readAfter(50);
                console.log(`Data read`);
                const pmData = extractRtuData(serialResponse);
                if (pmData.error) {
                    console.error(pmData.error.message);
                    return;
                }
                this._timer.stop(); // <-- valid rtuResponse
                this.updatePhaseEnergy(pmData); // <-- handle edge-cases

                const delay = this._deviceIndex === 2 ? this._interval : 10;
                this._deviceIndex = (this._deviceIndex + 1) % 3;

                await this.requestAfter(delay, this._rtuCommands[this._deviceIndex]);
            } catch (err) {
                console.error(`${err}`);
            }
        });

        this.sendRequest(this._rtuCommands[this._deviceIndex]); // Send the First request
    }

    getTotalWH(): number {
        return this.totalWh;
    }

    private sendRequest(rtuCommand: string) {
        const txBuffer = Buffer.from(rtuCommand, "hex");
        this._port.write(txBuffer);
    }

    private updatePhaseEnergy(pmData: PMDATA): void {
        const phaseEnergy = pmData.energy;
        this.energies[this._deviceIndex] = phaseEnergy;

        const previousTotalWh = this.totalWh;
        this.totalWh = _.sum(this.energies);

        this.changed = this.totalWh !== previousTotalWh;
        if (this._deviceIndex === 2 && this.changed) {
            // <-- PZEM 0x03 must be connected to AC line !
        }

        this.phases[this._deviceIndex].U = pmData.voltage;
        this.phases[this._deviceIndex].I = pmData.current;
        this.phases[this._deviceIndex].cosPhi = pmData.power_factor;
    }

    private next() {
        this._deviceIndex = (this._deviceIndex + 1) % 3;
        this.sendRequest(this._rtuCommands[this._deviceIndex]); // Send a request to the next PZEM device
    }

    private readAfter(milliseconds: number) {
        return new Promise<Buffer>((resolve, reject) => {
            setTimeout(async () => {
                const data = await this._port.read();
                // this._read++;
                if (!data) {
                    // reject(new Error(`Received data: ${data}`));
                    // <--- silence the "null" received errors
                    // this._null++;
                    // console.log(`${this._null} / ${this._read}`);
                } else {
                    resolve(data);
                }
            }, milliseconds);
        });
    }

    private requestAfter(milliseconds: number, rtuCommand: string) {
        const txBuffer = Buffer.from(rtuCommand, "hex");
        return new Promise<void>((resolve, reject) => {
            setTimeout(() => {
                try {
                    this._port.write(txBuffer);
                    resolve();
                } catch (error) {
                    reject(error);
                    }
            }, milliseconds);
        });
    }
}

export class MockPowerMeterReader implements IPowerMeterReader {
    public totalWh: number;
    phases: { U: number; I: number; cosPhi: number; }[] = [];
    
    data = [
        {
          U: 220,       
          I: 10,        
          cosPhi: 0.95, 
        },
        {
          U: 230,       
          I: 12,        
          cosPhi: 0.98, 
        },
        {
          U: 240,       
          I: 15,        
          cosPhi: 0.92, 
        },
    ];
    constructor() {
        this.totalWh = 100000;
        this.phases = this.data;
    }

    getTotalWH(): number {
        return this.totalWh;
    }
}
