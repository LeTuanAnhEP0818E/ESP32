import { MWH_TO_TON_C02 } from "./config/dCarbon_factor";

/**
 * Users can change the following Configurations:
 */

// Device Configuration
export const IoTConfig: IOTCONFIG = {
    interval: 15000, // the app's interval in milliseconds
    baseURL: 'https://dev.dcarbon.org/api/v1',
    jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDMxNDQ3OTksImlkIjoxLCJyb2xlIjoic3VwZXItYWRtaW4iLCJldGgiOiIweDU3ZDdENzJmNTRCOERiZDg2NjA2MGIwQ0YyNjVhMmE0NWU4ZWY3MmIifQ.BCxw-AWCgOBoZRRCdgCm8EP5IE3jO0G3zDOvaNcM1G8',
    project: 0,
    MWH_TO_TON_CO2: MWH_TO_TON_C02,
}

// SmartContract Configuration
export const SMConfig = {
    ProviderURL: "https://dev.dcarbon.org/ganache",
    name: 'CARBON',
    version: '1',
    chainId: 1,
    verifyingContract: '0x7BDDCb9699a3823b8B27158BEBaBDE6431152a85'
}

// Power Meters Configuration
export const PMConfig: PMCONFIG = {
    port: "/dev/ttyAMA0",
    baudRate: 9600,
    interval: 15000
}

// Telegram Bot Configuration
export const BotConfig = {
    enable: true,
    ownerID: 5534010874,
    defaultAuth: 1713817017, // Mr. Minh
}

// GPS module configuration
export const GpsConfig = {
    port: "/dev/ttyUSB2",
    baudRate: 115200,
    interval: 5000
}

/**
 * Users: DO NOT CHANGE THE FOLLOWING
*/
export interface IOTCONFIG {
    interval: number;
    baseURL: string;
    jwtToken: string;
    project: number;
    MWH_TO_TON_CO2: number;
}

export interface PMCONFIG {
    port: string;
    baudRate: number;
    interval: number;
}
