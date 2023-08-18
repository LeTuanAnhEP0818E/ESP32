/**
 * Description: 
 * - To mock the PowerMeter class behavior
 * - Main purpose: periodically update its `powermeter.energy` value with interval of `interval_ms`
 * Constructor:
 * - const powermeter = PowerMeter(interval_ms: number)
 * - description: create a powermeter object with `interval_ms` in milliseconds
 * - behavior: 
 *      + open the `energy.log` file, if it exists --> read the stored value number in this file --> initialize `this.energy` with the value.
 *      
 * Properties:
 * - `powermeter.energy`:
 *      + stores the current updated energy value in Wh (to be an integer)
 *      + this value will increase overtime, and be updated periodically inside the object itself
 *      + each time of updating this value will increase by an `amount` that is randomly picked up from an give array, such as `const amounts = [1100, 2100, 3200, 4100, 5300]`
 * Methods:
 * - `private updateEnergy()`
 *      + description: this method will be invoked periodically by using a `setTimeout(() => {...}, interval_ms)`
 *      + the callback inside the `setTimeout` will invoke the `updateEnergy()` recursively at the end of the callback.
 *      + this method will perform the updating of `powermeter.energy` as described in the `powermeter.energy` section
 *      + this method will also persist the current `powermeter.energy` to a file using the `fs` file system
 * 
 */
import _ from 'lodash';
import { EventEmitter } from 'node:events'

import fs from 'fs';
import path from 'path';

const energy_path = path.join(__dirname, 'status/energy.log');
const statusDir = path.join(__dirname, 'status');
const amounts = [1100, 2100, 3200, 4100, 5300]; // in Watt*hours (Wh)

class PowerMeter extends EventEmitter {
    private _interval: number;
    public energies = [0, 0, 0];
    public totalWh = 0;
    public changed = true;
    public phases = [
        { U: 220, I: 68, cosPhi: 0.99 },
        { U: 220, I: 68, cosPhi: 0.99 },
        { U: 220, I: 68, cosPhi: 0.99 }
    ];
    private _path = energy_path;

    constructor(interval_ms: number = 1000) {
        super();
        if (!fs.existsSync(statusDir)) {
            fs.mkdirSync(statusDir);
        }
        this._interval = interval_ms;
        this.readEnergies();
        this.updateEnergy();
    }

    private updateEnergy(): void {
        const previousTotalWh = this.totalWh;

        this.energies[0] += amounts[Math.floor(Math.random() * amounts.length)];
        this.energies[1] += amounts[Math.floor(Math.random() * amounts.length)];
        this.energies[2] += amounts[Math.floor(Math.random() * amounts.length)];
        this.totalWh = _.sum(this.energies);

        this.changed = (this.totalWh !== previousTotalWh);
        if (this.changed) {
            this.persistEnergies();
            this.emit('changed');
        }

        for (let i = 0; i < 3; i++) {
            const randomSign = Math.random() < 0 / 5 ? -1 : 1;
            this.phases[i].U += randomSign * Math.random(); // +-(0..2)
            this.phases[i].I -= randomSign * Math.random();
            this.phases[i].cosPhi += randomSign * Math.random() / 10;
        }

        setTimeout(() => {
            this.updateEnergy();
        }, this._interval);
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
            [this.energies[0], this.energies[1], this.energies[2], this.totalWh] = data.split(',').map(Number);
        } catch (err) {
            console.error(`${err}`);
        }
    }

    public changeInterval(interval_ms: number): void {
        this._interval = interval_ms;
    }
}

export default PowerMeter;
