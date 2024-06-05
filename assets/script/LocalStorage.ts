export const STORAGE_NAMES = ["maxFloor", "maxScore", "maxDoulbeHit"] as const
type STORAGE_NAMES<S extends string> = S

export class LocalStorage {

    public static setItem(key: STORAGE_NAMES<typeof STORAGE_NAMES[number]>, value: string) {
        localStorage.setItem(key, value)
    }
    public static getItem(key: STORAGE_NAMES<typeof STORAGE_NAMES[number]>) {
        return localStorage.getItem(key)
    }
    public static clear() {
        localStorage.clear()
    }

}