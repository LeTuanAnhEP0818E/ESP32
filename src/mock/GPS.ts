/**
 * Mocking GPS reader:
 * Periodically request the GPS module to get the [longitude, latitude] 
 * .. and store that to the object.longitude, object.latitude public attributes
 * the defaults [lng = -1, lat = -1] mean there is no signal from GPS module
 */

import EventEmitter from 'events';

const PBC_Position = {
    "lat": 21.024446,
    "lng": 105.842895
}

const gpsResponses: string[] = [
    '+CGPSINFO: 2101.464014,N,10550.561508,E,250423,065718.0,23.1,0.0,',
    '+CGPSINFO: 2101.464012,N,10550.561506,E,250423,065719.0,23.1,0.0,',
    '+CGPSINFO: 2101.464010,N,10550.561503,E,250423,065720.0,23.1,0.0,',
    '+CGPSINFO: 2101.464009,N,10550.561504,E,250423,065721.0,23.1,0.0,',
    '+CGPSINFO: 2101.464003,N,10550.561505,E,250423,065722.0,23.1,0.0,',
    '+CGPSINFO: 2101.463996,N,10550.561505,E,250423,065723.0,23.1,0.0,',
    '+CGPSINFO: 2101.463987,N,10550.561510,E,250423,065726.0,23.1,0.0,',
    '+CGPSINFO: ,,,,,,,,',
    '+CGPSINFO: ,,,,,,,,'
]

class GPS extends EventEmitter {
    public longitude = "-1";
    public latitude = "-1";
    public changed = true;
    public status = 0; // 0 is normal; 1 is error (NaN - no data, no signal)
    private _interval = 1000;

    constructor(interval_ms: number = 1000) {
        super();
        this._interval = interval_ms;
        this.longitude = PBC_Position.lng.toFixed(6);
        this.latitude = PBC_Position.lat.toFixed(6);
        // console.log('AT+CGPSHOT'); // Hot Start GPS module
        this.updateGPS();
    }

    private updateGPS(): void {
        const previousLongitude = this.longitude;
        const previousLatitude = this.latitude;

        // console.log('AT+CGPSINFO'); // query GPS info --> gpsResponse

        const randomIndex = Math.floor(Math.random() * gpsResponses.length);
        const gpsResponse = gpsResponses[randomIndex];
        const data = this.extractGPS(gpsResponse);
        if (data) {
            this.latitude = data.latitude.toFixed(5);
            this.longitude = data.longitude.toFixed(5);
        }

        this.changed = (this.longitude !== previousLongitude || this.latitude !== previousLatitude);
        if (this.changed) {
            this.emit('changed');
        }

        setTimeout(() => {
            this.updateGPS();
        }, this._interval);
    }

    public changeInterval(interval_ms: number): void {
        this._interval = interval_ms;
    }

    private extractGPS(gpsResponse: string) {
        // const gpsResponse = "+CGPSINFO: 2101.463987,N,10550.561510,E,250423,065726.0,23.1,0.0,";
        // Note: <latitude> string format: ddmm.mmmmmm; <longitude> string format: dddmm.mmmmmm
        if (!gpsResponse.startsWith('+CGPSINFO: ')) return;

        const fields = gpsResponse.replace('+CGPSINFO: ', '').split(',');
        if (fields[0] === '') { // No signal from satellites
            this.status = 1; // No GPS signal
            return { latitude: 0, longitude: 0 };
        } else {
            this.status = 0; // GPS data OK
        }

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
        const latitude = (latHemisphere == "S") ? -latDecimal : latDecimal;
        const longitude = (longHemisphere == "W") ? -lngDecimal : lngDecimal;
        return { latitude, longitude };
    }
}

export default GPS;