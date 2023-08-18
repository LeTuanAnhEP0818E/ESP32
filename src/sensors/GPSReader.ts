import { SerialPort } from "serialport";
import { ReadlineParser } from "serialport";

export interface GPSLoc {
    longitude: number;
    latitude: number;
}

const command = {
    hotStart: "AT+CGPSHOT\r\n",
    getGPSFixed: "AT+CGPSINFO\r\n",
};

export interface IGPSReader {
    getGPS(): GPSLoc;
}

export class GPSMockReader implements IGPSReader {
    private location: GPSLoc;

    constructor() {
        this.location = { longitude: 0, latitude: 0 };
    }

    getGPS(): GPSLoc {
        return { ...this.location };
    }
}

// SIM7500_SIM7600
export class GPSReader implements IGPSReader {
    // public longitude = "0"; // Initial (and No Signal)
    // public latitude = "0"; // Initial (and No Signal)
    // public changed = true;
    public status = 0; // 0 is normal; 1 is error (NaN - no data, no signal)
    private _port: SerialPort;
    private _parser: ReadlineParser;
    private _autoload: any;
    private _location: GPSLoc;
    private _interval = 1000;

    constructor(config: SerialPort) {
        this._port = new SerialPort({ path: config.path, baudRate: config.baudRate });
        this._parser = this._port.pipe(new ReadlineParser({ delimiter: "\r\n" }));
        this._location = { longitude: 0, latitude: 0 };

        this._port.on("error", (err) => {
            console.error("GPS port:", err.message);
            // TODO: Reconnecting Serial Port || No need, serialport will do it automatically ?
        });
        this._port.open;

        this._parser.on("data", (response) => {
            // console.log(`GPS response data: ${gpsResponse}`);
            if (!response) {
                return;
            }

            // var prevLoc = { ...this._location };
            const data = this.extractGPS(response);
            if (data) {
                // this.changed = this.longitude !== previousLongitude || this.latitude !== previousLatitude;
                this._location = data;
            }
        });

        this.hotStartGPS();
    }

    getGPS(): GPSLoc {
        this._port.read();
        return { ...this._location };
    }

    private hotStartGPS(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            var success = false;
            while (!success) {
                try {
                    await this.sendCommand(command.hotStart);
                    success = true;
                } catch (error) {
                    console.log("Send command error: ", error);
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                }
            }
            this._autoload = setTimeout(() => this.updateGPS(), this._interval);
            resolve();
        });
    }

    private updateGPS() {
        this.sendCommand(command.getGPSFixed);
        setTimeout(() => {
            this.updateGPS();
        }, this._interval);
    }

    private sendCommand(command: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            console.log("GPS reader send command: ", command);

            this._port.write(command, (err) => {
                if (err) {
                    if (err) console.error(`Write command:${command} error: `, err.message);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    private extractGPS(gpsResponse: string): GPSLoc | null {
        // const gpsResponse = "+CGPSINFO: 2101.463987,N,10550.561510,E,250423,065726.0,23.1,0.0,";
        // Note: <latitude> string format: ddmm.mmmmmm; <longitude> string format: dddmm.mmmmmm
        if (!gpsResponse.startsWith("+CGPSINFO: ")) {
            return null;
        }

        const fields = gpsResponse.replace("+CGPSINFO: ", "").split(",");
        if (fields[0] === "") {
            // No signal from satellites
            this.status = 1; // No GPS signal
            return null;
        }

        this.status = 0; // GPS data OK

        // Extract the latitude and longitude values
        const latDegrees = fields[0].substring(0, 2); // <latitude> format: ddmm.mmmmmm
        const latMinutes = fields[0].substring(2);
        const lngDegrees = fields[2].substring(0, 3); // <longitude> format: dddmm.mmmmmm
        const lngMinutes = fields[2].substring(3);

        const latDecimal = parseInt(latDegrees) + parseFloat(latMinutes) / 60;
        const lngDecimal = parseInt(lngDegrees) + parseFloat(lngMinutes) / 60;

        // Determine the hemisphere of the latitude and longitude values
        const latHemisphere = fields[1];
        const longHemisphere = fields[3];

        // Convert the latitude and longitude values to positive or negative values based on hemisphere
        const latitude = latHemisphere == "S" ? -latDecimal : latDecimal;
        const longitude = longHemisphere == "W" ? -lngDecimal : lngDecimal;

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            return null;
        }
        return { latitude, longitude };
    }
}
