// #region Property
/** PageStateMemory 頁面進入時的狀態處理模式。 */
export type PageStateMemoryEntryMode = "reset" | "restore" | "normalize";
const ENTRY_KEY_PREFIX = "wcms:page-state-memory-entry:";
// #endregion

// #region Public
/** 標記指定路徑下一次進入時的 PageStateMemory 處理模式。 */
export const markPageStateMemoryEntry = (pathname: string, mode: PageStateMemoryEntryMode): void =>
{
    const storage = getSessionStorage();
    if (!storage) return;
    storage.setItem(buildEntryKey(pathname), mode);
};
/** 取得並移除指定路徑的一次性 PageStateMemory 處理模式。 */
export const consumePageStateMemoryEntry = (pathname: string): PageStateMemoryEntryMode | null =>
{
    const storage = getSessionStorage();
    if (!storage) return null;
    const key = buildEntryKey(pathname);
    const mode = storage.getItem(key);
    storage.removeItem(key);
    return isEntryMode(mode) ? mode : null;
};
// #endregion

// #region Private
/** 建立路徑對應的一次性進入模式 Key。 */
const buildEntryKey = (pathname: string): string => `${ENTRY_KEY_PREFIX}${pathname.toLowerCase()}`;
/** 判斷文字是否為合法進入模式。 */
const isEntryMode = (value: string | null): value is PageStateMemoryEntryMode =>
{
    return value === "reset" || value === "restore" || value === "normalize";
};
/** 取得 CSR sessionStorage。 */
const getSessionStorage = (): Storage | null =>
{
    return typeof window === "undefined" ? null : window.sessionStorage;
};
// #endregion
