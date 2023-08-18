import { Gpio } from "onoff";

export interface ThermocoupleConfig {
    cs: number;
    sck: number;
    so: number | number[];
    //unit?: number;
}
export interface Thermocouple {
    temp: number | number[];
    // unit: string;
    //error_tc?: number | number[];
}

export interface IThermocoupleReader {
    readTemp(): Promise<Thermocouple>;
    //readTemp(): number;
}

export class ThermocoupleReader implements IThermocoupleReader {
    //private unit: number;
    private CS: Gpio | undefined;
    private SCK: Gpio | undefined;
    private SO: Gpio[] = [];

    constructor(config: ThermocoupleConfig) {
        //this.unit = config.unit || 1;
        config.so = this.makeSoArray(config.so);

        if (config.cs && config.sck && config.so.length && this.verifyGpio(config.cs, config.sck, config.so)) {
            //this.setPin(config.cs, config.sck, config.so, this.unit);
            this.setPin(config.cs, config.sck, config.so);
        }

        process.on("SIGINT", this.stop.bind(this));
    }

    async stop() {
        if (this.CS) {
            await this.CS.write(0);
            this.CS.unexport();
        }

        if (this.SCK) {
            await this.SCK.write(0);
            this.SCK.unexport();
        }

        for (const item of this.SO) {
            await item.write(0);
            item.unexport();
        }

        process.exit();
    }

    private async getValue(): Promise<number[]> {
        if (!this.SCK) {
            throw new Error("SCK pin not initialized.");
        }

        await this.SCK.write(1);
        const value: number[] = this.SO.map(item => item.readSync());
        await this.SCK.write(0);
        return value;
    }

    private async bin2dec(): Promise<number[]> {
        let arr: number[] = [];
        const value: number[] = [];
        for (let i = 11; i >= 0; i--) {
            arr = (await this.getValue()).map((item: number, index: number) => {
                value[index] = (value[index] || 0) + item * Math.pow(2, i);
                return value[index];
            });
        }
        return arr;
    }

    setPin(cs: number, sck: number, so: number | number[], unit = 1) {
        //this.unit = unit;
        const soArray = this.makeSoArray(so);

        if (!(soArray.length !== 0 && this.verifyGpio(cs, sck, soArray))) {
            this.stop();
            throw new Error("You must assign a value to so!");
        } else {
            this.CS = new Gpio(cs, "out");
            this.SCK = new Gpio(sck, "out");
            this.SO = soArray.map((item: number) => new Gpio(item, "in"));
        }
    }

    private makeSoArray(so: any): number[] {
        return this.isArray(so) ? so : typeof so === "number" ? [so] : [];
    }

    private async format(): Promise<Thermocouple> {
        // switch (this.unit) {
        //     case 1:
        //         return {
        //             temp: (await this.bin2dec()).map((v: number) =>
        //                 parseFloat((v * 0.25).toFixed(2))
        //             ),
        //             unit: "°C",
        //         };
        //     case 2:
        //         return {
        //             temp: (await this.bin2dec()).map((v: number) =>
        //                 parseFloat(((v * 0.25 * 9) / 5 + 32).toFixed(2))
        //             ),
        //             unit: "°F",
        //         };
        //     default:
        //         return {
        //             temp: await this.bin2dec(),
        //             unit: "",
        //         };
        // }
        return {
            temp: (await this.bin2dec()).map((v: number) =>
                parseFloat((v * 0.25).toFixed(2))
            ),
        };
    }

    // async readTemp(): Promise<Thermocouple> {
    //     if (!(this.CS && this.SCK && this.SO.length)) {
    //         //return { temp: [], unit: "°C" };
    //         return { temp: []};
    //     }

    //     await this.CS.write(0);
    //     await this.CS.write(1);
    //     await this.CS.write(0);

    //     await this.getValue();
    //     const results = await this.format();
    //     const ErrorTc = await this.getValue();
    //     await this.CS.write(1);

    //     let error = 0;

    //     ErrorTc.forEach((element: number) => {
    //         if (element !== 0) error += 1;
    //     });

    //     if (error !== 0) {
    //         return { temp: [], error_tc: ErrorTc };
    //     }

    //     return { ...results, error_tc: ErrorTc };
    // }
    async readTemp() :   Promise<Thermocouple>{
        if (!(this.CS && this.SCK && this.SO.length)) {
            return {temp : []};
        }
    
        await this.CS.write(0);
        await this.CS.write(1);
        await this.CS.write(0);
    
        await this.getValue();
        const results = await this.format();
        await this.CS.write(1);
    
        return results;
    }
    
    private verifyGpio(sck: number, cs: number, so: number[]): boolean {
        const set = new Set(so);
        set.add(sck);
        set.add(cs);
        return set.size === so.length + 2;
    }

    private isArray(obj: number | number[]): boolean {
        return Array.isArray(obj);
    }
}
export class ThermocoupleMockReader implements IThermocoupleReader {
    public temp: Thermocouple;

    constructor() {
        this.temp = {
            temp: Math.floor(Math.random() * 101), 
        };
    }

    async readTemp(): Promise<Thermocouple> {
        this.temp = {
            temp: Math.floor(Math.random() * 101), 
        };
        return this.temp;
    }
}
