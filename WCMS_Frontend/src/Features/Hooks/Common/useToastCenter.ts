// src/hooks/useToastCenter.ts
import type { MessageStatusCode } from "@/SysCore/Interface/IApiProvider";
import * as React from "react";

/** 類型：錯誤 / 警告 / 提示 */
// export type ToastLevel = "error" | "warning" | "info" | "success";

export interface ToastMessage
{
    id: string; // 唯一鍵（預設自動產生）
    level: MessageStatusCode; // "error" | "warning" | "info"
    code?: string; // 例如 "Code0001"
    title?: string; // 顯示在第一行（例如「錯誤訊息」）
    text?: string; // 詳細內容
    createdAt: number; // 排序／去重用
    durationMs?: number; // ✅ 可選：針對單筆覆寫自動關閉時間
    focusSelector?: string;
}

/** 內部可訂閱的 store —— 用 useSyncExternalStore 做 SSR/CSR 皆安全 */
type Store = {
    getSnapshot: () => ToastMessage[];
    subscribe: (listener: () => void) => () => void;
    publish: (
        msg: Omit<Partial<ToastMessage>, "id" | "createdAt"> & {
            level: MessageStatusCode;
            text?: string;
            code?: string;
            title?: string;
            id?: string;
            durationMs?: number;
            focusSelector?: string;
        },
    ) => string;
    dismiss: (id: string) => void;
    clear: () => void;
    replaceLatest: (
        msg: Omit<Partial<ToastMessage>, "id" | "createdAt"> & {
            level: MessageStatusCode;
            text?: string;
            code?: string;
            title?: string;
            id?: string;
            durationMs?: number;
            focusSelector?: string;
        },
    ) => string;
};

const listeners = new Set<() => void>();
let state: ToastMessage[] = [];

const notifyAll = () => listeners.forEach(l => l());

const genId = () => crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);

const getSnapshot = () => state;

const subscribe = (listener: () => void) =>
{
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const upsert = (msg: ToastMessage, replaceLatest = false) =>
{
    if (replaceLatest && state.length > 0)
    {
        state = [...state.slice(0, -1), msg];
    } else
    {
        state = [...state, msg];
    }
    notifyAll();
};

const publish: Store["publish"] = (msg) =>
{
    const id = msg.id ?? genId();
    const createdAt = Date.now();
    const next: ToastMessage = {
        id,
        level: msg.level,
        code: msg.code,
        title: msg.title,
        text: msg.text,
        createdAt,
        durationMs: (msg as any).durationMs, // ✅ 帶入
        focusSelector: (msg as any).focusSelector, // ✅ 帶入
    };
    upsert(next, false);
    return id;
};

const replaceLatest: Store["replaceLatest"] = (msg) =>
{
    const id = msg.id ?? genId();
    const createdAt = Date.now();
    const next: ToastMessage = {
        id,
        level: msg.level,
        code: msg.code,
        title: msg.title,
        text: msg.text,
        createdAt,
        durationMs: (msg as any).durationMs, // ✅ 帶入
        focusSelector: (msg as any).focusSelector, // ✅ 帶入
    };
    upsert(next, true);
    return id;
};

const dismiss: Store["dismiss"] = (id) =>
{
    const before = state.length;
    state = state.filter(t => t.id !== id);
    if (state.length !== before) notifyAll();
};

const clear: Store["clear"] = () =>
{
    if (state.length === 0) return;
    state = [];
    notifyAll();
};

const store: Store = { getSnapshot, subscribe, publish, dismiss, clear, replaceLatest };

/** 供 Node 使用：讀取目前所有訊息 */
export const useToastState = (): ToastMessage[] =>
{
    // 第三個參數為 SSR 快照，和 CSR 相同即可
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
};

/** 供任何元件送出／關閉提示 */
export const useToast = () =>
{
    const publish = React.useCallback(store.publish, []);
    const dismiss = React.useCallback(store.dismiss, []);
    const clear = React.useCallback(store.clear, []);
    const replaceLatest = React.useCallback(store.replaceLatest, []);
    return { publish, dismiss, clear, replaceLatest };
};
