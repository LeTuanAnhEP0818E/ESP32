import { SerialPort } from 'serialport';
import WatchDogTimer from './WatchDogTimer';
import { PMDATA, extractRtuData } from './extractRtuData';
import { PMConfig } from './env';
import _ from 'lodash';
import { EventEmitter } from 'node:events'

import fs from 'fs';
import path from 'path';

const statusDir = path.join(__dirname, 'status');
const energy_path = path.join(statusDir, 'energy.log');

if (!fs.existsSync(statusDir)) {
    fs.mkdirSync(statusDir);
}

class PowerMeter extends EventEmitter {
    private readonly _rtuCommands: ReadonlyArray<string>;
    private _deviceIndex = 0;
    private _port: SerialPort;
    private _timer: WatchDogTimer;
    private _interval: number = 1000;
    // private _read = 0;
    // private _null = 0;
    private _path = energy_path;
    public energies = [0, 0, 0]; // in Watt*hours (Wh)
    public totalWh = 0;
    public changed = true;
    public phases = [
        { U: 220, I: 68, cosPhi: 0.99 },
        { U: 220, I: 68, cosPhi: 0.99 },
        { U: 220, I: 68, cosPhi: 0.99 }
    ];

    constructor() {
        super();
        this._interval = PMConfig.interval;
        const path: string = PMConfig.port;
        const baudRate: number = PMConfig.baudRate;
        this._port = new SerialPort({ path, baudRate });

        this.readEnergies(); // read file --> this.energies ...

        this._port.on("error", (err) => {
            console.error(err.message);
            // TODO: Reconnecting Serial Port || No need, serialport will do it automatically ?
        });

        this._timer = new WatchDogTimer;

        this._timer.on("timeout", () => {
            this.phases[this._deviceIndex].U = 0;
            this.phases[this._deviceIndex].I = 0;
            this.phases[this._deviceIndex].cosPhi = 0;
            // console.error(`No response from device ${this._deviceIndex} --> next device`);
            this.next();
        });

        this._rtuCommands = Object.freeze([
            "01040000000a700d", // PZEM@rtu address: 0x01
            "02040000000a703e", // PZEM@rtu address: 0x02
            "03040000000a71ef", // PZEM@rtu address: 0x03
        ]);

        this._port.on("readable", async (): Promise<void> => {
            try {
                const serialResponse = await this.readAfter(50);
                const pmData = extractRtuData(serialResponse);
                if (pmData.error) {
                    console.error(pmData.error.message);
                    return;
                }
                this._timer.stop(); // <-- valid rtuResponse
                this.updatePhaseEnergy(pmData); // <-- handle edge-cases

                const delay = this._deviceIndex === 2 ? this._interval : 10;
                this._deviceIndex = (this._deviceIndex + 1) % 3;

                await this.requestAfter(
                    delay,
                    this._rtuCommands[this._deviceIndex]
                );
            } catch (err) {
                console.error(`${err}`);
            }
        });

        this.sendRequest(this._rtuCommands[this._deviceIndex]); // Send the First request
    }

    private updatePhaseEnergy(pmData: PMDATA): void {
        const phaseEnergy = pmData.energy;
        this.energies[this._deviceIndex] = phaseEnergy;
        // if (phaseEnergy < this.energies[this._deviceIndex]) {
        //     // <-- after replacing a PZEM device ?
        //     this.energies[this._deviceIndex] += phaseEnergy;
        // } else {
        //     this.energies[this._deviceIndex] = phaseEnergy;
        // }

        const previousTotalWh = this.totalWh;
        this.totalWh = _.sum(this.energies);

        this.changed = (this.totalWh !== previousTotalWh);
        if (this._deviceIndex === 2 && this.changed) {
            // <-- PZEM 0x03 must be connected to AC line !
            this.persistEnergies();
            this.emit('changed');
        }

        this.phases[this._deviceIndex].U = pmData.voltage;
        this.phases[this._deviceIndex].I = pmData.current;
        this.phases[this._deviceIndex].cosPhi = pmData.power_factor;
    }

    private sendRequest(rtuCommand: string) {
        const txBuffer = Buffer.from(rtuCommand, "hex");
        this._port.write(txBuffer, (err) => {
            if (err) {
                console.error("UART write: ", err.message);
            } else {
                this._timer.start(1000);
            }
        });
    }

    private next() {
        this._deviceIndex = (this._deviceIndex + 1) % 3;
        this.sendRequest(this._rtuCommands[this._deviceIndex]); // Send a request to the next PZEM device
    }

    private requestAfter(milliseconds: number, rtuCommand: string) {
        const txBuffer = Buffer.from(rtuCommand, "hex");
        return new Promise<string>((resolve, reject) => {
            setTimeout(() => {
                this._port.write(txBuffer, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this._timer.start(1000);
                        resolve(rtuCommand);
                    }
                });
            }, milliseconds);
        });
    }

    private readAfter(milliseconds: number) {
        return new Promise<Buffer>((resolve, reject) => {
            setTimeout(() => {
                const data = this._port.read();
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

    private persistEnergies(): void {
        try {
            // const total = _.sum(this.energies);
            const values = `${this.energies[0]},${this.energies[1]},${this.energies[2]},${this.totalWh}\n`;
            fs.writeFileSync(this._path, values, { flag: 'w' });
        } catch (err) {
            console.error(`${err}`);
        }
    }

    private readEnergies() {
        try {
            const data = fs.readFileSync(this._path, 'utf8');
            const [ph1, ph2, ph3, tt] = data.split(',').map(Number);
            [this.energies[0], this.energies[1], this.energies[2], this.totalWh] = [ph1, ph2, ph3, tt].map(value => isNaN(value) ? 0 : value);
            if (this.totalWh === 0) {
                this.changed = false;
            }
        } catch (err) {
            console.error(`${err}`);
        }
    }

    public changeInterval(interval_ms: number): void {
        this._interval = interval_ms;
    }
}

// new PowerMeter(); // --> auto running and updating its energies
export default PowerMeter;
