import { parseJson, stringifyJson, type JsonGuard } from "@/SysCore/Utils/Library/LibData/LibJson";
import type { PageStateMemoryScopeValue } from "./PageStateMemory_Data";

// #region Property
/** PageStateMemory 在 sessionStorage 使用的命名空間。 */
const PAGE_STATE_MEMORY_PREFIX = "wcms:page-state-memory";
// #endregion

// #region Public
/** 建立 Module 與 Scope 專用的 sessionStorage Key。 */
export const buildPageStateMemoryKey = (stateKey: string, scopeKeys: readonly PageStateMemoryScopeValue[] = []): string =>
{
    const normalizedStateKey = normalizeKeyPart(stateKey);
    const normalizedScope = scopeKeys.map(normalizeKeyPart).join(":");
    return [PAGE_STATE_MEMORY_PREFIX, normalizedStateKey, normalizedScope].filter(Boolean).join(":");
};
/** 讀取目前頁面的記憶狀態。 */
export const readPageStateMemory = <TState>(key: string, fallback: TState, guard?: JsonGuard<TState>): TState =>
{
    const storage = getSessionStorage();
    if (!storage) return fallback;
    return parseJson(storage.getItem(key), fallback, { guard });
};
/** 寫入目前頁面的記憶狀態。 */
export const writePageStateMemory = (key: string, state: unknown): boolean =>
{
    const storage = getSessionStorage();
    const json = stringifyJson(state);
    if (!storage || !json) return false;
    return setStorageItem(storage, key, json);
};
/** 判斷目前頁面是否已有記憶資料。 */
export const hasPageStateMemory = (key: string): boolean =>
{
    const storage = getSessionStorage();
    if (!storage) return false;
    try { return storage.getItem(key) !== null; } catch { return false; }
};
/** 移除指定頁面的記憶資料。 */
export const removePageStateMemory = (key: string): void =>
{
    const storage = getSessionStorage();
    if (!storage) return;
    try { storage.removeItem(key); } catch { return; }
};
/** 清除目前分頁內所有 PageStateMemory，供登出流程集中調用。 */
export const clearAllPageStateMemory = (): void =>
{
    const storage = getSessionStorage();
    if (!storage) return;
    getPageStateMemoryKeys(storage).forEach((key) => removeStorageItem(storage, key));
};
// #endregion

// #region Private
/** 正規化 Storage Key 片段，避免特殊字元造成 Scope 衝突。 */
const normalizeKeyPart = (value: PageStateMemoryScopeValue): string =>
{
    return encodeURIComponent(String(value ?? "").trim());
};
/** SSR 或瀏覽器禁止存取時回傳 null。 */
const getSessionStorage = (): Storage | null =>
{
    if (typeof window === "undefined") return null;
    try { return window.sessionStorage; } catch { return null; }
};
/** 安全寫入 sessionStorage。 */
const setStorageItem = (storage: Storage, key: string, json: string): boolean =>
{
    try { storage.setItem(key, json); return true; } catch { return false; }
};
/** 安全移除 sessionStorage 資料。 */
const removeStorageItem = (storage: Storage, key: string): void =>
{
    try { storage.removeItem(key); } catch { return; }
};
/** 取得目前命名空間下的全部 Storage Key。 */
const getPageStateMemoryKeys = (storage: Storage): string[] =>
{
    return Array.from({ length: storage.length }, (_, index) => storage.key(index))
        .filter((key): key is string => key?.startsWith(`${PAGE_STATE_MEMORY_PREFIX}:`) === true);
};
// #endregion
