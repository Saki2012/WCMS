import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { type ApiResponse, MessageStatus, type SysMessageModel } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { AxiosInstance } from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
export type EffectDeps = ReadonlyArray<string | number | boolean | object | null | undefined>;
export type ServerFormActions = {
    Save: () => Promise<void>;
    Delete: () => Promise<void>;
    Back: () => void;
    Preview?: () => void;
    IsSaving?: boolean;
};
export type ApiLoaderData<TArgs, TData> = { args: TArgs; apiRes: ApiResponse<TData>; };
export type ApiAdapterError = {
    messageText: string;
    sysMessages: SysMessageModel[];
    httpStatus?: number;
    action?: string;
};

/** 後台標準動作：用來區分成功後是哪個 action */
export type ServerActionMode = "create" | "update" | "delete" | "invalid";
export type UseServerActionsResult<TSet> = {
    isSaving: boolean;
    createAsync: (data: TSet) => Promise<ApiResponse<TSet>>;
    updateAsync: (internalId: string, data: TSet) => Promise<ApiResponse<TSet>>;
    deleteAsync: (internalId: string) => Promise<ApiResponse<TSet>>;
    invalidAsync: (internalId: string, isInvalid: boolean) => Promise<ApiResponse<TSet>>;
};
/** useServerActions 的可選參數：完全不傳也可（只做 toast） */
export type UseServerActionsOptions = {
    apiInstance?: AxiosInstance;
    onError?: (err: ApiAdapterError) => void;
    onSuccessByMode?: Partial<Record<ServerActionMode, () => void | Promise<void>>>;
    confirmDelete?: (internalId: string) => Promise<boolean> | boolean;
};

// -------------------------
// 共用小工具（不依賴 class 狀態）
// -------------------------
const parseHttpStatus = (sysMessages: SysMessageModel[]): number | undefined =>
{
    const code = sysMessages.find(m => (m?.MessageCode ?? "").startsWith("Http Error "))?.MessageCode ?? "";
    const match = /Http Error\s+(\d+)/i.exec(code);
    if (!match) return undefined;
    const n = Number(match[1]);
    return Number.isFinite(n) ? n : undefined;
};
const toMessageText = (sysMessages: SysMessageModel[], fallback: string): string =>
{
    const texts = sysMessages.map(m => `${m?.MessageCode ?? ""}:${m?.Message ?? ""}`.trim()).filter(s => s.length > 0);
    return texts.length > 0 ? texts.join("；") : fallback;
};
const buildError = (apiRes: ApiResponse<unknown>, fallback: string, action?: string): ApiAdapterError =>
{
    const sysMessages = apiRes?.SysMessage ?? [];
    return {
        messageText: toMessageText(sysMessages, fallback),
        sysMessages,
        httpStatus: parseHttpStatus(sysMessages),
        action,
    };
};
const isOk = <T>(apiRes: ApiResponse<T>): apiRes is ApiResponse<T> & { IsSuccess: true; Data: T; } =>
{
    return Boolean(apiRes?.IsSuccess) && apiRes.Data !== null && apiRes.Data !== undefined;
};

// ============================================================================
// 1) ApiBaseAdapter（只有共用底，不綁定「資料型共用 API」）
// ============================================================================
export class ApiBaseAdapter<TService>
{
    protected readonly createService: (apiInstance?: AxiosInstance) => TService;

    constructor(createService: (apiInstance?: AxiosInstance) => TService)
    {
        // 宣告變數
        this.createService = createService;
    }
    protected getService(apiInstance?: AxiosInstance): TService
    {
        // return
        return this.createService(apiInstance);
    }

    /** 一個 API 封裝成一個 loader（SSR 用） */
    protected createApiLoader<TArgs, TData>(opt: {
        action: string;
        getArgs: (args: LoaderFunctionArgs) => TArgs;
        call: (svc: TService, a: TArgs) => Promise<ApiResponse<TData>>;
        getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;
    })
    {
        return async (args: LoaderFunctionArgs): Promise<ApiLoaderData<TArgs, TData>> =>
        {
            const apiInstance = opt.getApiInstance?.(args);
            const svc = this.getService(apiInstance);
            const a = opt.getArgs(args);
            // 執行 function
            const apiRes = await opt.call(svc, a);
            return { args: a, apiRes: apiRes };
        };
    }

    /** 一個 API 封裝成一個 hook（CSR 用；initial 可為 null） */
    protected useApiQuery<TArgs, TData>(opt: {
        action: string;
        args: TArgs;
        initial?: ApiLoaderData<TArgs, TData> | null;
        call: (svc: TService, a: TArgs) => Promise<ApiResponse<TData>>;
        fallbackError: string;
        deps: EffectDeps;
        onError?: (err: ApiAdapterError) => void;
        apiInstance?: AxiosInstance;
    })
    {
        // 宣告變數：SSR 必須在 render 當下就把 initial 套進 state（不能靠 useEffect）
        const initApiRes = opt.initial?.apiRes ?? null;
        const initOk = initApiRes ? isOk(initApiRes) : false;
        const initErrText = useMemo(() =>
        {
            if (!initApiRes) return null;
            if (initOk) return null;
            return buildError(initApiRes, opt.fallbackError, opt.action).messageText;
        }, [initApiRes, initOk, opt.fallbackError, opt.action]);

        const [data, setData] = useState<TData | null>(() => (initOk ? (initApiRes!.Data ?? null) : null));
        const [apiRes, setApiRes] = useState<ApiResponse<TData> | null>(() => initApiRes);
        const [isLoading, setIsLoading] = useState(false);
        const [errorText, setErrorText] = useState<string | null>(() => initErrText);

        const svc = useMemo(() => this.getService(opt.apiInstance), [opt.apiInstance]);
        const lastInitialApiResRef = useRef<ApiResponse<TData> | null>(initApiRes);

        const applyError = useCallback(
            (e: ApiResponse<TData>, fallback: string) =>
            {
                // 宣告變數
                const err = buildError(e, fallback, opt.action);

                // 執行 function
                setErrorText(err.messageText);
                opt.onError?.(err);
            },
            [opt.action, opt.onError],
        );

        const applyInitialIfChanged = useCallback((): boolean =>
        {
            // 宣告變數
            const init = opt.initial;
            if (!init) return false;
            if (lastInitialApiResRef.current === init.apiRes) return false;

            // 執行 function：initial 變更時同步更新
            lastInitialApiResRef.current = init.apiRes;
            setApiRes(init.apiRes);

            if (isOk(init.apiRes))
            {
                setData(init.apiRes.Data);
                setErrorText(null);
            } else
            {
                applyError(init.apiRes, opt.fallbackError);
            }

            // return
            return true;
        }, [opt.initial, opt.fallbackError, applyError]);

        const fetchAsync = useCallback(async () =>
        {
            // 宣告變數
            setIsLoading(true);
            setErrorText(null);

            try
            {
                // 執行 function
                const e = await opt.call(svc, opt.args);
                setApiRes(e);

                if (isOk(e)) setData(e.Data);
                else applyError(e, opt.fallbackError);
            } finally
            {
                setIsLoading(false);
            }
        }, [svc, opt.args, opt.call, applyError, opt.fallbackError]);

        useEffect(() =>
        {
            // 執行 function：CSR mount 時若已有 initial 就不再 fetch
            const applied = applyInitialIfChanged();
            if (!applied && !initApiRes) void fetchAsync();
        }, [...opt.deps, opt.initial]);

        // return
        return { data, apiRes: apiRes, isLoading, errorText, refetch: fetchAsync };
    }
}

// ============================================================================
// 2) ApiDataAdapter（資料型共用：Query/Count/Data + CUD hooks）
// ============================================================================

export interface ApiDataService<TSet>
{
    getModelDisplayName: () => Promise<ApiResponse<ModelDisplaySchema>>;
    queryData: (internalId: string) => Promise<ApiResponse<TSet>>;
    queryList: (condition: QueryListParam) => Promise<ApiResponse<TSet[]>>;
    queryCount: (condition: QueryListParam) => Promise<ApiResponse<number>>;

    create?: (data: TSet) => Promise<ApiResponse<TSet>>;
    update?: (internalId: string, data: TSet) => Promise<ApiResponse<TSet>>;
    delete?: (internalId: string) => Promise<ApiResponse<TSet>>;
    invalid?: (internalId: string, isInvalid: boolean) => Promise<ApiResponse<TSet>>;
}

export type ApiDataLoaderGroup<TSet> = {
    createModelDisplayNameLoader: (opt?: {
        getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;
    }) => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<null, ModelDisplaySchema>>;

    createQueryListLoader: (opt: {
        getCondition: (args: LoaderFunctionArgs) => QueryListParam;
        getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;
    }) => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<QueryListParam, TSet[]>>;

    createQueryCountLoader: (opt: {
        getCondition: (args: LoaderFunctionArgs) => QueryListParam;
        getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;
    }) => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<QueryListParam, number>>;

    createQueryDataLoader: (opt: {
        getInternalId: (args: LoaderFunctionArgs) => string;
        getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;
    }) => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<string, TSet>>;
};

export type ApiDataHookGroup<TSet> = {
    useModelDisplayName: (opt?: {
        initial?: ApiLoaderData<null, ModelDisplaySchema> | null;
        deps?: EffectDeps;
        onError?: (err: ApiAdapterError) => void;
        apiInstance?: AxiosInstance;
    }) => {
        data: ModelDisplaySchema | null;
        apiRes: ApiResponse<ModelDisplaySchema> | null;
        isLoading: boolean;
        errorText: string | null;
        refetch: () => Promise<void>;
    };

    useQueryList: (opt: {
        condition: QueryListParam;
        initial?: ApiLoaderData<QueryListParam, TSet[]> | null;
        deps: EffectDeps;
        onError?: (err: ApiAdapterError) => void;
        apiInstance?: AxiosInstance;
    }) => {
        data: TSet[];
        apiRes: ApiResponse<TSet[]> | null;
        isLoading: boolean;
        errorText: string | null;
        refetch: () => Promise<void>;
    };

    useQueryCount: (opt: {
        condition: QueryListParam;
        initial?: ApiLoaderData<QueryListParam, number> | null;
        deps: EffectDeps;
        onError?: (err: ApiAdapterError) => void;
        apiInstance?: AxiosInstance;
    }) => {
        data: number;
        apiRes: ApiResponse<number> | null;
        isLoading: boolean;
        errorText: string | null;
        refetch: () => Promise<void>;
    };

    usePagedQueryList: (opt: {
        baseParam: QueryListParam;
        count: number;
        initial?: ApiLoaderData<QueryListParam, TSet[]> | null;
        deps: EffectDeps;
        onError?: (err: ApiAdapterError) => void;
        apiInstance?: AxiosInstance;
    }) => {
        data: TSet[];
        apiRes: ApiResponse<TSet[]> | null;
        isLoading: boolean;
        errorText: string | null;
        refetch: () => Promise<void>;

        pageNumber: number;
        totalPages: number;
        onPageChange: (page: number) => void;

        // 方便外部 debug/取用
        param: QueryListParam;
    };

    useQueryData: (opt: {
        internalId: string;
        initial?: ApiLoaderData<string, TSet> | null;
        deps: EffectDeps;
        onError?: (err: ApiAdapterError) => void;
        apiInstance?: AxiosInstance;
    }) => {
        data: TSet | null;
        apiRes: ApiResponse<TSet> | null;
        isLoading: boolean;
        errorText: string | null;
        refetch: () => Promise<void>;
    };

    useCudActions: (opt?: {
        onError?: (err: ApiAdapterError) => void;
        apiInstance?: AxiosInstance;
    }) => {
        isSaving: boolean;
        createAsync: (data: TSet) => Promise<ApiResponse<TSet>>;
        updateAsync: (internalId: string, data: TSet) => Promise<ApiResponse<TSet>>;
        deleteAsync: (internalId: string) => Promise<ApiResponse<TSet>>;
        invalidAsync: (internalId: string, isInvalid: boolean) => Promise<ApiResponse<TSet>>;
    };
};

export class ApiDataAdapter<TSet, TSvc extends ApiDataService<TSet>> extends ApiBaseAdapter<TSvc>
{
    /** 固定入口：adapter.loader.xxx */
    public loader: ApiDataLoaderGroup<TSet>;

    /** 固定入口：adapter.hooks.useXxx */
    public hooks: ApiDataHookGroup<TSet>;

    constructor(createService: (apiInstance?: AxiosInstance) => TSvc)
    {
        // 宣告變數 + 執行 super
        super(createService);
        // 執行 function
        this.loader = this.buildLoaderGroup();
        this.hooks = this.buildHookGroup();
    }

    // 子類可用：用 spread 方式組出「擴充後」的 loader/hook（無需 any/unknown）
    protected buildExtendedLoader<TExtra extends object>(extra: TExtra): ApiDataLoaderGroup<TSet> & TExtra
    {
        // return
        return { ...this.loader, ...extra };
    }

    protected buildExtendedHooks<TExtra extends object>(extra: TExtra): ApiDataHookGroup<TSet> & TExtra
    {
        // return
        return { ...this.hooks, ...extra };
    }

    /** 後台標準行為：CUD + Toast + Success / Error callback */
    public useServerActions(opt?: UseServerActionsOptions): UseServerActionsResult<TSet>
    {
        // 宣告變數
        const { publish } = useToast();
        const cud = this.hooks.useCudActions({ apiInstance: opt?.apiInstance, onError: opt?.onError });

        const emitMessages = (env: ApiResponse<unknown>) =>
        {
            // 執行 function：後端訊息統一丟 toast（成功/失敗都丟，和舊 useActions 行為一致）
            (env.SysMessage ?? []).forEach(m =>
            {
                publish({
                    level: m.Status ?? MessageStatus.Info,
                    code: m.MessageCode,
                    title: m.Message ?? "",
                });
            });
        };

        const runSuccess = async (mode: ServerActionMode) =>
        {
            // 執行 function
            const fn = opt?.onSuccessByMode?.[mode];
            if (!fn) return;
            await fn();
        };

        // return
        return {
            isSaving: cud.isSaving,

            createAsync: async (data: TSet) =>
            {
                // 執行 function
                const env = await cud.createAsync(data);
                emitMessages(env);
                if (env.IsSuccess) await runSuccess("create");
                return env;
            },

            updateAsync: async (internalId: string, data: TSet) =>
            {
                // 執行 function
                const env = await cud.updateAsync(internalId, data);
                emitMessages(env);
                if (env.IsSuccess) await runSuccess("update");
                return env;
            },

            deleteAsync: async (internalId: string) =>
            {
                // 宣告變數
                const ok = opt?.confirmDelete ? await opt.confirmDelete(internalId) : window.confirm("確定要刪除嗎？");
                if (!ok)
                {
                    // return（被取消時回一個「不成功但不中斷」的 env）
                    return { IsSuccess: false, Data: null as any, SysMessage: [] };
                }

                // 執行 function
                const env = await cud.deleteAsync(internalId);
                emitMessages(env);
                if (env.IsSuccess) await runSuccess("delete");
                return env;
            },

            invalidAsync: async (internalId: string, isInvalid: boolean) =>
            {
                // 執行 function
                const env = await cud.invalidAsync(internalId, isInvalid);
                emitMessages(env);
                if (env.IsSuccess) await runSuccess("invalid");
                return env;
            },
        };
    }

    private buildLoaderGroup(): ApiDataLoaderGroup<TSet>
    {
        return {
            createModelDisplayNameLoader: (opt) =>
            {
                return this.createApiLoader<null, ModelDisplaySchema>({
                    action: "Query.ModelDisplayName",
                    getArgs: () => null,
                    call: (svc) => svc.getModelDisplayName(),
                    getApiInstance: opt?.getApiInstance,
                });
            },

            createQueryListLoader: (opt) =>
            {
                return this.createApiLoader<QueryListParam, TSet[]>({
                    action: "Query.QueryList",
                    getArgs: opt.getCondition,
                    call: (svc, c) => svc.queryList(c),
                    getApiInstance: opt.getApiInstance,
                });
            },

            createQueryCountLoader: (opt) =>
            {
                return this.createApiLoader<QueryListParam, number>({
                    action: "Query.QueryCount",
                    getArgs: opt.getCondition,
                    call: (svc, c) => svc.queryCount(c),
                    getApiInstance: opt.getApiInstance,
                });
            },

            createQueryDataLoader: (opt) =>
            {
                return this.createApiLoader<string, TSet>({
                    action: "Query.QueryData",
                    getArgs: opt.getInternalId,
                    call: (svc, id) => svc.queryData(id),
                    getApiInstance: opt.getApiInstance,
                });
            },
        };
    }

    private buildHookGroup(): ApiDataHookGroup<TSet>
    {
        return {
            useModelDisplayName: (opt) =>
            {
                return this.useApiQuery<null, ModelDisplaySchema>({
                    action: "Query.ModelDisplayName",
                    args: null,
                    initial: opt?.initial ?? null,
                    call: (svc) => svc.getModelDisplayName(),
                    fallbackError: "讀取欄位顯示名稱失敗",
                    deps: opt?.deps ?? [],
                    onError: opt?.onError,
                    apiInstance: opt?.apiInstance,
                });
            },

            useQueryList: (opt) =>
            {
                // 執行 function：底層 useApiQuery 已支援 SSR initial
                const r = this.useApiQuery<QueryListParam, TSet[]>({
                    action: "Query.QueryList",
                    args: opt.condition,
                    initial: opt.initial ?? null,
                    call: (svc, c) => svc.queryList(c),
                    fallbackError: "查詢清單失敗",
                    deps: opt.deps,
                    onError: opt.onError,
                    apiInstance: opt.apiInstance,
                });

                // return：確保 list 不會是 null
                return { ...r, data: r.data ?? [] };
            },

            useQueryCount: (opt) =>
            {
                // 執行 function：底層 useApiQuery 已支援 SSR initial
                const r = this.useApiQuery<QueryListParam, number>({
                    action: "Query.QueryCount",
                    args: opt.condition,
                    initial: opt.initial ?? null,
                    call: (svc, c) => svc.queryCount(c),
                    fallbackError: "查詢筆數失敗",
                    deps: opt.deps,
                    onError: opt.onError,
                    apiInstance: opt.apiInstance,
                });

                // return：確保 count 不會是 null
                return { ...r, data: r.data ?? 0 };
            },
            usePagedQueryList: (opt) =>
            {
                // 宣告變數：目前頁（CSR 狀態），首屏以 baseParam 為準
                const [pageNumber, setPageNumber] = useState<number>(opt.baseParam.PageNumber ?? 1);

                useEffect(() =>
                {
                    // 執行 function：CSR 同步 baseParam 的 pageNumber（SSR 不跑 useEffect，無影響）
                    setPageNumber(opt.baseParam.PageNumber ?? 1);
                }, [opt.baseParam.PageNumber]);

                // 宣告變數：下一次要查的參數（只覆蓋頁碼）
                const param = useMemo(() => ({
                    ...opt.baseParam,
                    PageNumber: pageNumber,
                }), [opt.baseParam, pageNumber]);

                const deps = useMemo<EffectDeps>(() => [
                    param.Condition,
                    param.PageNumber,
                    param.PageSize,
                    ...opt.deps,
                ], [param.Condition, param.PageNumber, param.PageSize, opt.deps]);

                // 執行 function：SSR initial 會直接進到 r.data
                const r = this.useApiQuery<QueryListParam, TSet[]>({
                    action: "Query.QueryList",
                    args: param,
                    initial: opt.initial ?? null,
                    call: (svc, c) => svc.queryList(c),
                    fallbackError: "查詢清單失敗",
                    deps,
                    onError: opt.onError,
                    apiInstance: opt.apiInstance,
                });

                const totalPages = useMemo(() =>
                {
                    // 宣告變數
                    const size = param.PageSize ?? 10;
                    const count = opt.count ?? 0;

                    // 執行 function
                    if (size <= 0) return 1;

                    // return
                    return Math.max(1, Math.ceil(count / size));
                }, [opt.count, param.PageSize]);

                // return
                return {
                    ...r,
                    data: r.data ?? [],
                    pageNumber,
                    totalPages,
                    onPageChange: (p: number) => setPageNumber(p),
                    param,
                };
            },

            useQueryData: (opt) =>
            {
                return this.useApiQuery<string, TSet>({
                    action: "Query.QueryData",
                    args: opt.internalId,
                    initial: opt.initial ?? null,
                    call: (svc, id) => svc.queryData(id),
                    fallbackError: "查詢資料失敗",
                    deps: opt.deps,
                    onError: opt.onError,
                    apiInstance: opt.apiInstance,
                });
            },

            useCudActions: (opt) =>
            {
                const [isSaving, setIsSaving] = useState(false);
                const svc = useMemo(() => this.getService(opt?.apiInstance), [opt?.apiInstance]);

                const exec = useCallback(
                    async <U>(fn: () => Promise<ApiResponse<U>>, fallback: string, action: string) =>
                    {
                        // 宣告變數
                        setIsSaving(true);

                        try
                        {
                            const env = await fn();
                            if (!env.IsSuccess) opt?.onError?.(buildError(env, fallback, action));
                            return env;
                        } finally
                        {
                            setIsSaving(false);
                        }
                    },
                    [opt?.onError],
                );

                const createAsync = useCallback(
                    async (data: TSet) =>
                    {
                        if (!svc.create) throw new Error("[ApiDataAdapter] service.create not implemented");
                        return await exec(() => svc.create!(data), "新增失敗", "CUD.Create");
                    },
                    [svc, exec],
                );

                const updateAsync = useCallback(
                    async (internalId: string, data: TSet) =>
                    {
                        if (!svc.update) throw new Error("[ApiDataAdapter] service.update not implemented");
                        return await exec(() => svc.update!(internalId, data), "更新失敗", "CUD.Update");
                    },
                    [svc, exec],
                );

                const deleteAsync = useCallback(
                    async (internalId: string) =>
                    {
                        if (!svc.delete) throw new Error("[ApiDataAdapter] service.delete not implemented");
                        return await exec(() => svc.delete!(internalId), "刪除失敗", "CUD.Delete");
                    },
                    [svc, exec],
                );

                const invalidAsync = useCallback(
                    async (internalId: string, isInvalid: boolean) =>
                    {
                        if (!svc.invalid) throw new Error("[ApiDataAdapter] service.invalid not implemented");
                        return await exec(() => svc.invalid!(internalId, isInvalid), "失效操作失敗", "CUD.Invalid");
                    },
                    [svc, exec],
                );

                return { isSaving, createAsync, updateAsync, deleteAsync, invalidAsync };
            },
        };
    }
}
