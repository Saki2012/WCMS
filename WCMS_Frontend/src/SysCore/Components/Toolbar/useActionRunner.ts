import { useToast } from "@/Features/Pages/Server/Scaffold/Toast/useToastCenter";
import * as React from "react";

export type ActionKey = "save" | "delete" | "back" | "preview";

export interface PrecheckResult
{
    ok: boolean;
    message?: string;
    code?: string;
    focusSelector?: string;
    level?: "warning" | "error";
    durationMs?: number;
}

export type PrecheckFn = () => Promise<PrecheckResult> | PrecheckResult;
export type RunFn = () => Promise<void> | void;

export interface MessageConfig
{
    success?: { title?: string; text?: string; code?: string; durationMs?: number; };
    error?: { title?: string; text?: string; code?: string; durationMs?: number; };
}

export interface ActionSpec
{
    key: ActionKey;
    precheck?: PrecheckFn;
    run?: RunFn;
    messages?: MessageConfig;
    busyLabel?: string; // ✅ 新增：執行時顯示在遮罩上的文字
}

export interface BuiltAction
{
    key: ActionKey;
    onInvoke: () => Promise<void>;
    isLoading: boolean;
}

export interface UseActionRunnerResult
{
    actions: Record<ActionKey, BuiltAction>;
    anyLoading: boolean;
    busyLabel?: string | null; // ✅ 目前執行中的文字（如「執行保存中…」）
}

export const useActionRunner = (specs: ReadonlyArray<ActionSpec>): UseActionRunnerResult =>
{
    const { publish, replaceLatest } = useToast();
    const [loadingMap, setLoadingMap] = React.useState<Record<ActionKey, boolean>>({});
    const [currentKey, setCurrentKey] = React.useState<ActionKey | null>(null);
    const [currentLabel, setCurrentLabel] = React.useState<string | null>(null);

    const setLoading = React.useCallback((key: ActionKey, v: boolean, label?: string) =>
    {
        setLoadingMap(prev => ({ ...prev, [key]: v }));
        if (v)
        {
            setCurrentKey(key);
            setCurrentLabel(label ?? null);
        } else
        {
            // 若關閉的是當前 key，清除 label
            setTimeout(() =>
            {
                setCurrentKey(prev => (prev === key ? null : prev));
                setCurrentLabel(prev => (currentKey === key ? null : prev));
            }, 0);
        }
    }, [currentKey]);

    const build = React.useMemo(() =>
    {
        const map: Record<ActionKey, BuiltAction> = {};
        specs.forEach(spec =>
        {
            const key = spec.key;
            const onInvoke = async () =>
            {
                if (loadingMap[key]) return;
                setLoading(key, true, spec.busyLabel);
                try
                {
                    if (spec.precheck)
                    {
                        const pre = await spec.precheck();
                        if (!pre.ok)
                        {
                            replaceLatest({
                                level: pre.level ?? "warning",
                                code: pre.code ?? "Code0002",
                                title: pre.level === "error" ? "錯誤訊息" : "欄位未填",
                                text: pre.message ?? "請先修正資料。",
                                focusSelector: pre.focusSelector,
                                durationMs: pre.durationMs ?? 8000,
                            });
                            return;
                        }
                    }

                    await spec.run?.();

                    if (spec.messages?.success)
                    {
                        const m = spec.messages.success;
                        publish({
                            level: "success",
                            code: m.code ?? "Code0000",
                            title: m.title ?? "操作成功",
                            text: m.text ?? "",
                            durationMs: m.durationMs ?? 2500,
                        });
                    }
                } catch (err: any)
                {
                    const m = spec.messages?.error;
                    replaceLatest({
                        level: "error",
                        code: m?.code ?? "Code0001",
                        title: m?.title ?? "操作失敗",
                        text: m?.text ?? err?.message ?? "伺服器發生錯誤。",
                    });
                } finally
                {
                    setLoading(key, false);
                }
            };

            map[key] = { key, onInvoke, isLoading: !!loadingMap[key] };
        });
        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [specs, loadingMap, setLoading, publish, replaceLatest]);

    const anyLoading = Object.values(loadingMap).some(Boolean);
    return { actions: build, anyLoading, busyLabel: anyLoading ? currentLabel : null };
};
