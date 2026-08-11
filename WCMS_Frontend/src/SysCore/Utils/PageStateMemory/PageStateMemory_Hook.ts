import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import { useCallback, useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import type { PageStateMemoryController, PageStateMemoryOptions } from "./PageStateMemory_Data";
import { consumePageStateMemoryEntry, type PageStateMemoryEntryMode } from "./PageStateMemory_Navigation";
import {
    buildPageStateMemoryKey,
    hasPageStateMemory,
    readPageStateMemory,
    removePageStateMemory,
    writePageStateMemory,
} from "./PageStateMemory_Storage";

// #region Public
/** 管理 Module 需要跨導頁與重新整理保留的頁面狀態。 */
export const usePageStateMemory = <TState>(options: PageStateMemoryOptions<TState>): PageStateMemoryController<TState> =>
{
    const location = useLocation();
    const navigationType = useNavigationType();
    const enabled = options.enabled ?? true;
    const routeScope = buildPageStateRouteScope(location.pathname);
    const storageKey = buildPageStateMemoryKey(options.stateKey, [...(options.scopeKeys ?? []), routeScope]);
    const [state, setState] = useState<TState>(options.defaultState);
    const [isReady, setIsReady] = useState(false);
    const [hasMemory, setHasMemory] = useState(false);
    const [entryMode, setEntryMode] = useState<PageStateMemoryEntryMode>("restore");
    const skipNextWriteRef = useRef(true);
    useRestorePageStateMemory(storageKey, options, enabled, location.pathname, location.key, navigationType, skipNextWriteRef, setState, setIsReady, setHasMemory, setEntryMode);
    usePersistPageStateMemory(storageKey, state, enabled, isReady, skipNextWriteRef, setHasMemory);
    const resetState = useCallback(() => resetCurrentState(storageKey, options.defaultState, setState, setHasMemory), [storageKey, options.defaultState]);
    const clearMemory = useCallback(() => clearCurrentMemory(storageKey, setHasMemory), [storageKey]);
    return { state, setState, resetState, clearMemory, isReady, hasMemory, entryMode };
};
// #endregion

// #region Private
/** 建立 PageStateMemory 使用的穩定 Route Scope。 */
const buildPageStateRouteScope = (pathname: string): string =>
{
    const path = LibRoutePath.normalizeInternalPath(pathname);
    if (path === "/") return path;
    return `/${LibRoutePath.trimRouteSlash(path)}`;
};

/** Scope 或頁面初始化時，依導頁來源重設或還原狀態。 */
const useRestorePageStateMemory = <TState>(
    storageKey: string,
    options: PageStateMemoryOptions<TState>,
    enabled: boolean,
    pathname: string,
    locationKey: string,
    navigationType: string,
    skipNextWriteRef: MutableRefObject<boolean>,
    setState: Dispatch<SetStateAction<TState>>,
    setIsReady: Dispatch<SetStateAction<boolean>>,
    setHasMemory: Dispatch<SetStateAction<boolean>>,
    setEntryMode: Dispatch<SetStateAction<PageStateMemoryEntryMode>>,
): void =>
{
    useEffect(() =>
    {
        skipNextWriteRef.current = true;
        const mode = resolveEntryMode(pathname, locationKey, navigationType);
        const memoryExists = enabled && mode !== "reset" && hasPageStateMemory(storageKey);
        const restoredState = memoryExists ? readPageStateMemory(storageKey, options.defaultState, options.guard) : options.defaultState;
        if (mode === "reset") removePageStateMemory(storageKey);
        setEntryMode(mode);
        setState(restoredState);
        setHasMemory(memoryExists);
        setIsReady(true);
    }, [storageKey, enabled, options.defaultState, options.guard, pathname, locationKey, navigationType]);
};
/** 狀態異動且初始化完成後，同步寫入 sessionStorage。 */
const usePersistPageStateMemory = <TState>(storageKey: string, state: TState, enabled: boolean, isReady: boolean, skipNextWriteRef: MutableRefObject<boolean>, setHasMemory: Dispatch<SetStateAction<boolean>>): void =>
{
    useEffect(() =>
    {
        if (!enabled || !isReady) return;
        if (skipNextWriteRef.current) { skipNextWriteRef.current = false; return; }
        const isWritten = writePageStateMemory(storageKey, state);
        if (isWritten) setHasMemory(true);
    }, [storageKey, state, enabled, isReady]);
};
/** 解析本次進頁面的 PageStateMemory 處理模式。 */
const resolveEntryMode = (pathname: string, locationKey: string, navigationType: string): PageStateMemoryEntryMode =>
{
    const markedMode = consumePageStateMemoryEntry(pathname);
    if (markedMode) return markedMode;
    if (navigationType === "POP" && locationKey !== "default") return "normalize";
    return isInitialDirectNavigation(locationKey) ? "reset" : "restore";
};
/** 判斷是否為直接輸入網址或外部進站。 */
const isInitialDirectNavigation = (locationKey: string): boolean =>
{
    if (locationKey !== "default" || typeof performance === "undefined") return false;
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return entry?.type === "navigate";
};
/** 將目前狀態與記憶資料重設為 Module 預設值。 */
const resetCurrentState = <TState>(storageKey: string, defaultState: TState, setState: Dispatch<SetStateAction<TState>>, setHasMemory: Dispatch<SetStateAction<boolean>>): void =>
{
    const isWritten = writePageStateMemory(storageKey, defaultState);
    setState(defaultState);
    setHasMemory(isWritten);
};
/** 移除目前 Scope 的記憶資料。 */
const clearCurrentMemory = (storageKey: string, setHasMemory: Dispatch<SetStateAction<boolean>>): void =>
{
    removePageStateMemory(storageKey);
    setHasMemory(false);
};
// #endregion
