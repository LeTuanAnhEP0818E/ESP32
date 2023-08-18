import { AxiosError } from "axios";

export function handleAxiosError(error: any, label?: string): Error {
    if (error instanceof AxiosError) {
        var err = error as AxiosError;
        console.log(`${JSON.stringify(err.config)}`);
        return new Error(`${label ?? err.config?.url}:${err.message}`, { cause: err.response?.data || null });
    }
    return error;
}
