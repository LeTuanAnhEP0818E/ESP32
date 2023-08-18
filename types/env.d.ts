export declare const env: {
    config_file: string;
    telegramBotToken: string;
    telegramBotEnable: boolean;
};
export declare const PMConfig: any, IoTConfig: any;
export interface PMCONFIG {
    port: string;
    baudRate: number;
    interval: number;
}
export interface IOTCONFIG {
    interval: number;
    baseURL: string;
    jwtToken: string;
    project: number;
    MWH_TO_TON_CO2: number;
}
export declare function MWh_To_dCarbon_mth1(): number;
export declare function MWh_To_dCarbon_mth2(): number;
