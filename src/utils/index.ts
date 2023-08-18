export function getUnixSecond(): number {
    return Math.floor(Date.now() / 1000);
}

export function sleepPromise(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
}

export { createPersistent, IPersistent, PersistentWithSign, PersistentConfig } from "./persistent";
