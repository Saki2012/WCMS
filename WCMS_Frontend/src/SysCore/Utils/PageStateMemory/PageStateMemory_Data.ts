import type { Dispatch, SetStateAction } from "react";
import type { JsonGuard } from "@/SysCore/Utils/Library/LibData/LibJson";
import type { PageStateMemoryEntryMode } from "./PageStateMemory_Navigation";

// #region Property
/** PageStateMemory 可接受的 Scope Key 值。 */
export type PageStateMemoryScopeValue = string | number | boolean | null | undefined;
/** Module 使用頁面狀態記憶時提供的設定。 */
export interface PageStateMemoryOptions<TState>
{
    /** Module 內唯一且穩定的頁面狀態識別。 */
    stateKey: string;
    /** 無記憶資料或重設時使用的預設狀態。 */
    defaultState: TState;
    /** 語系、使用者、站台等需要彼此隔離的 Scope Key。 */
    scopeKeys?: readonly PageStateMemoryScopeValue[];
    /** 驗證 sessionStorage 還原資料是否符合 Module State。 */
    guard?: JsonGuard<TState>;
    /** 是否啟用狀態記憶，預設啟用。 */
    enabled?: boolean;
}
/** Module 調用 PageStateMemory Hook 後取得的控制器。 */
export interface PageStateMemoryController<TState>
{
    /** Module 目前使用的頁面狀態。 */
    state: TState;
    /** 更新狀態並同步記憶。 */
    setState: Dispatch<SetStateAction<TState>>;
    /** 重設為 Module 提供的預設狀態。 */
    resetState: () => void;
    /** 只移除目前頁面的記憶資料，不改變畫面狀態。 */
    clearMemory: () => void;
    /** CSR 記憶資料初始化是否完成。 */
    isReady: boolean;
    /** 目前 Scope 是否已有記憶資料。 */
    hasMemory: boolean;
    /** 本次進入頁面的狀態處理模式。 */
    entryMode: PageStateMemoryEntryMode;
}
// #endregion
