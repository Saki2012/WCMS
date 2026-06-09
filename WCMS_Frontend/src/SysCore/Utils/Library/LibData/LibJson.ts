import { isRecord } from "./LibType";
// #region Property
/** JSON 型別檢查函式 */
export type JsonGuard<T> = (value: unknown) => value is T;
/** JSON parse 選項 */
export interface ParseJsonOptions<T>
{
    /** 解析後的型別檢查 */
    guard?: JsonGuard<T>;

    /** 解析失敗時的錯誤處理 */
    onError?: (error: unknown) => void;
}
// #endregion

// #region Public
/** 安全解析 JSON，失敗或型別不符時回傳 fallback。 */
export const parseJson = <T>(raw: unknown, fallback: T, options: ParseJsonOptions<T> = {}): T =>
{
    const text = normalizeJsonText(raw);
    if (!text) return fallback;

    try
    {
        const value = JSON.parse(text) as unknown;
        return isValidParsedValue(value, fallback, options);
    } catch (error)
    {
        options.onError?.(error);
        return fallback;
    }
};

/** 安全解析 JSON object。 */
export const parseJsonRecord = <T extends Record<string, unknown> = Record<string, unknown>>(raw: unknown, fallback: T = {} as T): T =>
{
    return parseJson<T>(raw, fallback, { guard: isRecord as JsonGuard<T> });
};

/** 安全解析 JSON array。 */
export const parseJsonArray = <T>(raw: unknown, fallback: T[] = []): T[] =>
{
    return parseJson<T[]>(raw, fallback, { guard: Array.isArray as JsonGuard<T[]> });
};

/** 安全解析 JSON object，並與 fallback 合併。 */
export const parseJsonRecordWithFallback = <T extends Record<string, unknown>>(raw: unknown, fallback: T): T =>
{
    const parsed = parseJsonRecord<Partial<T>>(raw, {});
    return { ...fallback, ...parsed };
};

/** 安全轉成 JSON 字串，失敗時回傳 fallback。 */
export const stringifyJson = (value: unknown, fallback = ""): string =>
{
    try
    {
        const json = JSON.stringify(value);
        return typeof json === "string" ? json : fallback;
    } catch
    {
        return fallback;
    }
};
/** 從 localStorage 安全讀取 JSON。 */
export const readLocalStorageJson = <T>(key: string, fallback: T, options: ParseJsonOptions<T> = {}): T =>
{
    const storage = getBrowserLocalStorage();
    if (!storage) return fallback;

    try
    {
        const raw = storage.getItem(key);
        return parseJson<T>(raw, fallback, options);
    } catch (error)
    {
        options.onError?.(error);
        return fallback;
    }
};
/** 將資料安全寫入 localStorage JSON。 */
export const writeLocalStorageJson = (key: string, value: unknown): boolean =>
{
    const storage = getBrowserLocalStorage();
    if (!storage) return false;
    const json = stringifyJson(value);
    if (!json) return false;
    try
    {
        storage.setItem(key, json);
        return true;
    } catch
    {
        return false;
    }
};

/** 判斷是否為 number record。 */
export const isNumberRecord = (value: unknown): value is Record<string, number> =>
{
    if (!isRecord(value)) return false;
    return Object.values(value).every(item => typeof item === "number" && Number.isFinite(item));
};
// #endregion

// #region Private
/** 將輸入資料轉成可解析 JSON 文字。 */
const normalizeJsonText = (raw: unknown): string =>
{
    return typeof raw === "string" ? raw.trim() : "";
};

/** 依 guard 檢查解析後資料是否可用。 */
const isValidParsedValue = <T>(value: unknown, fallback: T, options: ParseJsonOptions<T>): T =>
{
    if (options.guard && !options.guard(value)) return fallback;
    return value as T;
};

/** 取得瀏覽器 localStorage，SSR 時回傳 null。 */
const getBrowserLocalStorage = (): Storage | null =>
{
    if (typeof window === "undefined") return null;
    return window.localStorage;
};
// #endregion
