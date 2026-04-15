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
export type ApiGridLoaderData<TSet> = {
    model: ApiLoaderData<null, ModelDisplaySchema[]>;
    count: ApiLoaderData<QueryListParam, number>;
    list: ApiLoaderData<QueryListParam, TSet[]>;
};
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
type MaybeArray<T> = T | ReadonlyArray<T>;

/** 兼容舊版：QueryData 可能回傳 Data 為陣列（只取第一筆） */
const normalizeOneData = <T>(apiRes: ApiResponse<T>): ApiResponse<T> =>
{
    // 宣告變數
    const raw = apiRes?.Data as MaybeArray<T> | null | undefined;
    const isArray = Array.isArray(raw);

    // return
    if (!isArray) return apiRes;
    return { ...apiRes, Data: (raw as ReadonlyArray<T>)[0] ?? null };
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
    protected useApiQuery<TArgs, TData>(
        opt: {
            action: string;
            args: TArgs;
            initial?: ApiLoaderData<TArgs, TData> | null;
            call: (svc: TService, a: TArgs) => Promise<ApiResponse<TData>>;
            fallbackError: string;
            deps: EffectDeps;
            onError?: (err: ApiAdapterError) => void;
            apiInstance?: AxiosInstance;
        },
    )
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
                const err = buildError(e, fallback, opt.action);
                setErrorText(err.messageText);
                opt.onError?.(err);
            },
            [opt.action, opt.onError],
        );
        const applyInitialIfChanged = useCallback((): boolean =>
        {
            const init = opt.initial;
            if (!init) return false;
            if (lastInitialApiResRef.current === init.apiRes && apiRes === init.apiRes) return false;
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
            return true;
        }, [opt.initial, opt.fallbackError, applyError, apiRes]);
        const fetchAsync = useCallback(async () =>
        {
            setIsLoading(true);
            setErrorText(null);
            try
            {
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
        return { data, apiRes: apiRes, isLoading, errorText, refetch: fetchAsync };
    }
}

// ============================================================================
// 2) ApiDataAdapter（資料型共用：Query/Count/Data + CUD hooks）
// ============================================================================

export interface ApiDataService<TSet>
{
    getModelDisplayName: () => Promise<ApiResponse<ModelDisplaySchema[]>>;
    queryData: (internalId: string) => Promise<ApiResponse<TSet>>;
    queryList: (condition: QueryListParam) => Promise<ApiResponse<TSet[]>>;
    queryCount: (condition: QueryListParam) => Promise<ApiResponse<number>>;

    create?: (data: TSet) => Promise<ApiResponse<TSet>>;
    update?: (internalId: string, data: TSet) => Promise<ApiResponse<TSet>>;
    delete?: (internalId: string) => Promise<ApiResponse<TSet>>;
    invalid?: (internalId: string, isInvalid: boolean) => Promise<ApiResponse<TSet>>;
}

export type ApiDataLoaderGroup<TSet> = {
    // #region Basic Loader Func
    createModelDisplayNameLoader: (opt?: {
        getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;
    }) => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<null, ModelDisplaySchema[]>>;

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
    // #endregion
    // #region Advance Loader Func
    createQueryGridDataLoader: (opt: {
        getCondition: (args: LoaderFunctionArgs) => QueryListParam;
        getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;
    }) => (args: LoaderFunctionArgs) => Promise<ApiGridLoaderData<TSet>>;
    // #endregion
};
export type ApiGridInitial<TSet> = {
    model?: ApiLoaderData<null, ModelDisplaySchema[]> | null;
    count?: ApiLoaderData<QueryListParam, number> | null;
    list?: ApiLoaderData<QueryListParam, TSet[]> | null;
};

export type ApiFormInitial<TSet> = {
    model?: ApiLoaderData<null, ModelDisplaySchema[]> | null;
    data?: ApiLoaderData<string, TSet> | null;
};

export type ApiFormMode = "new" | "edit";
export type ApiDataHookGroup<TSet> = {
    // #region Basic API Hooks
    useModelDisplayName: (opt?: {
        initial?: ApiLoaderData<null, ModelDisplaySchema[]> | null;
        deps?: EffectDeps;
        onError?: (err: ApiAdapterError) => void;
        apiInstance?: AxiosInstance;
    }) => {
        data: ModelDisplaySchema | null;
        apiRes: ApiResponse<ModelDisplaySchema[]> | null;
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
    // #endregion
    // #region Advance API Hooks
    useQueryGridData: (
        opt: {
            baseParam: QueryListParam;
            deps: EffectDeps;
            modelDeps?: EffectDeps;
            initial?: ApiGridInitial<TSet>;
            onError?: (err: ApiAdapterError) => void;
            apiInstance?: AxiosInstance;
        },
    ) => {
        modelDisplayName: ModelDisplaySchema | null;
        count: number;
        list: TSet[];
        isLoading: boolean;
        errors: string[];
        errorText: string | null;
        refetchData: () => Promise<void>;
        pageNumber: number;
        totalPages: number;
        onPageChange: (page: number) => void;
        param: QueryListParam;
    };

    useQueryFormData: (
        opt: {
            mode: ApiFormMode;
            internalId?: string;
            empty?: TSet;
            deps: EffectDeps;
            modelDeps?: EffectDeps;
            initial?: ApiFormInitial<TSet>;
            onError?: (err: ApiAdapterError) => void;
            apiInstance?: AxiosInstance;
        },
    ) => {
        modelDisplayName: ModelDisplaySchema | null;
        data: TSet | null;
        isLoading: boolean;
        errors: string[];
        errorText: string | null;
        refetchData: () => Promise<void>;
    };
    // #endregion
};

export class ApiDataAdapter<TSet, TSvc extends ApiDataService<TSet>> extends ApiBaseAdapter<TSvc>
{
    // #region Property
    public loader: ApiDataLoaderGroup<TSet>;
    public hooks: ApiDataHookGroup<TSet>;
    // #endregion

    // #region Construct
    constructor(createService: (apiInstance?: AxiosInstance) => TSvc)
    {
        super(createService);
        this.loader = this.buildLoaderGroup();
        this.hooks = this.buildHookGroup();
    }
    // #endregion
    // #region Protect Virtual Func
    protected buildExtendedLoader(base: ApiDataLoaderGroup<TSet>): ApiDataLoaderGroup<TSet>
    {
        return base;
    }
    protected buildExtendedHooks(base: ApiDataHookGroup<TSet>): ApiDataHookGroup<TSet>
    {
        return base;
    }
    // #endregion

    // #region Public
    /** 後台標準行為：CUD + Toast + Success / Error callback */
    public useServerActions(opt?: UseServerActionsOptions): UseServerActionsResult<TSet>
    {
        const { publish } = useToast();
        const cud = this.hooks.useCudActions({ apiInstance: opt?.apiInstance, onError: opt?.onError });

        const emitMessages = (env: ApiResponse<unknown>) =>
        {
            (env.SysMessage ?? []).forEach(m =>
            {
                publish({
                    level: m.Status ?? MessageStatus.Info,
                    code: m.MessageCode,
                    title: m.Message ?? "",
                    text: m.Message,
                });
            });
        };
        const runSuccess = async (mode: ServerActionMode) =>
        {
            const fn = opt?.onSuccessByMode?.[mode];
            if (!fn) return;
            await fn();
        };
        // return
        return {
            isSaving: cud.isSaving,
            createAsync: async (data: TSet) =>
            {
                const env = await cud.createAsync(data);
                emitMessages(env);
                if (env.IsSuccess) await runSuccess("create");
                return env;
            },
            updateAsync: async (internalId: string, data: TSet) =>
            {
                const env = await cud.updateAsync(internalId, data);
                emitMessages(env);
                if (env.IsSuccess) await runSuccess("update");
                return env;
            },
            deleteAsync: async (internalId: string) =>
            {
                const ok = opt?.confirmDelete ? await opt.confirmDelete(internalId) : window.confirm("確定要刪除嗎？");
                if (!ok) return { IsSuccess: false, Data: null as any, SysMessage: [] };
                const env = await cud.deleteAsync(internalId);
                emitMessages(env);
                if (env.IsSuccess) await runSuccess("delete");
                return env;
            },
            invalidAsync: async (internalId: string, isInvalid: boolean) =>
            {
                const env = await cud.invalidAsync(internalId, isInvalid);
                emitMessages(env);
                if (env.IsSuccess) await runSuccess("invalid");
                return env;
            },
        };
    }
    // #endregion

    // #region Private
    private buildLoaderGroup(): ApiDataLoaderGroup<TSet>
    {
        // #region Basic Loader Func
        const createModelDisplayNameLoader: ApiDataLoaderGroup<TSet>["createModelDisplayNameLoader"] = (opt) =>
        {
            return this.createApiLoader<null, ModelDisplaySchema[]>({
                action: "Query.ModelDisplayName",
                getArgs: () => null,
                call: (svc) => svc.getModelDisplayName(),
                getApiInstance: opt?.getApiInstance,
            });
        };
        const createQueryListLoader: ApiDataLoaderGroup<TSet>["createQueryListLoader"] = (opt) =>
        {
            return this.createApiLoader<QueryListParam, TSet[]>({
                action: "Query.QueryList",
                getArgs: opt.getCondition,
                call: (svc, c) => svc.queryList(c),
                getApiInstance: opt.getApiInstance,
            });
        };
        const createQueryCountLoader: ApiDataLoaderGroup<TSet>["createQueryCountLoader"] = (opt) =>
        {
            return this.createApiLoader<QueryListParam, number>({
                action: "Query.QueryCount",
                getArgs: opt.getCondition,
                call: (svc, c) => svc.queryCount(c),
                getApiInstance: opt.getApiInstance,
            });
        };
        const createQueryDataLoader: ApiDataLoaderGroup<TSet>["createQueryDataLoader"] = (opt) =>
        {
            return this.createApiLoader<string, TSet>({
                action: "Query.QueryData",
                getArgs: opt.getInternalId,
                call: async (svc, id) =>
                {
                    const env = await svc.queryData(id);
                    return normalizeOneData(env);
                },
                getApiInstance: opt.getApiInstance,
            });
        };
        // #endregion

        // #region Advance Loader Func
        const createQueryGridDataLoader: ApiDataLoaderGroup<TSet>["createQueryGridDataLoader"] = (opt) =>
        {
            const loadModel = createModelDisplayNameLoader({ getApiInstance: opt.getApiInstance });
            const loadList = createQueryListLoader({
                getCondition: opt.getCondition,
                getApiInstance: opt.getApiInstance,
            });
            const loadCount = createQueryCountLoader({
                getCondition: opt.getCondition,
                getApiInstance: opt.getApiInstance,
            });
            return async (args: LoaderFunctionArgs): Promise<ApiGridLoaderData<TSet>> =>
            {
                const cdt = opt.getCondition(args);
                const pageSize = cdt.PageSize ?? 0;
                const [model, list] = await Promise.all([loadModel(args), loadList(args)]);
                if (pageSize <= 0)
                {
                    const countRes: ApiResponse<number> = isOk(list.apiRes)
                        ? { IsSuccess: true, Data: list.apiRes.Data.length, SysMessage: [] }
                        : { IsSuccess: false, Data: null, SysMessage: list.apiRes.SysMessage ?? [] };
                    return { model, list, count: { args: cdt, apiRes: countRes } };
                }
                const count = await loadCount(args);
                return { model, list, count };
            };
        };
        // #endregion

        return this.buildExtendedLoader({
            createModelDisplayNameLoader,
            createQueryListLoader,
            createQueryCountLoader,
            createQueryDataLoader,
            createQueryGridDataLoader,
        });
    }
    private buildHookGroup(): ApiDataHookGroup<TSet>
    {
        // #region Basic Api Hooks
        const useModelDisplayName: ApiDataHookGroup<TSet>["useModelDisplayName"] = (opt) =>
        {
            const r = this.useApiQuery<null, ModelDisplaySchema[]>({
                action: "Query.ModelDisplayName",
                args: null,
                initial: opt?.initial ?? null,
                call: (svc) => svc.getModelDisplayName(),
                fallbackError: "讀取欄位顯示名稱失敗",
                deps: opt?.deps ?? [],
                onError: opt?.onError,
                apiInstance: opt?.apiInstance,
            });
            const data = useMemo<ModelDisplaySchema | null>(() =>
            {
                return r.apiRes?.Data?.[0] ?? null;
            }, [r.apiRes]);
            return { ...r, data };
        };
        const useQueryList: ApiDataHookGroup<TSet>["useQueryList"] = (opt) =>
        {
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
            return { ...r, data: r.data ?? [] };
        };
        const useQueryCount: ApiDataHookGroup<TSet>["useQueryCount"] = (opt) =>
        {
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
            return { ...r, data: r.data ?? 0 };
        };
        const usePagedQueryList: ApiDataHookGroup<TSet>["usePagedQueryList"] = (opt) =>
        {
            const [pageNumber, setPageNumber] = useState<number>(opt.baseParam.PageNumber ?? 1);

            useEffect(() =>
            {
                setPageNumber(opt.baseParam.PageNumber ?? 1);
            }, [opt.baseParam.PageNumber]);

            const param = useMemo(
                () => ({
                    ...opt.baseParam,
                    PageNumber: pageNumber,
                }),
                [opt.baseParam, pageNumber],
            );

            const deps = useMemo<EffectDeps>(
                () => [param.Condition, param.PageNumber, param.PageSize, ...opt.deps],
                [param.Condition, param.PageNumber, param.PageSize, opt.deps],
            );

            const currentParamKey = useMemo(() => JSON.stringify(param ?? null), [param]);
            const initialParamKey = useMemo(() => JSON.stringify(opt.initial?.args ?? null), [opt.initial]);

            // 宣告變數：只有目前查詢參數與 SSR initial 完全相同時，才沿用 initial
            const matchedInitial = useMemo(() =>
            {
                return currentParamKey === initialParamKey;
            }, [currentParamKey, initialParamKey]);

            const effectiveInitial = useMemo(() =>
            {
                return matchedInitial ? (opt.initial ?? null) : null;
            }, [matchedInitial, opt.initial]);

            const r = this.useApiQuery<QueryListParam, TSet[]>({
                action: "Query.QueryList",
                args: param,
                initial: effectiveInitial,
                call: (svc, c) => svc.queryList(c),
                fallbackError: "查詢清單失敗",
                deps,
                onError: opt.onError,
                apiInstance: opt.apiInstance,
            });

            const totalPages = useMemo(() =>
            {
                const size = param.PageSize ?? 10;
                const count = opt.count ?? 0;
                if (size <= 0) return 1;
                return Math.max(1, Math.ceil(count / size));
            }, [opt.count, param.PageSize]);

            return {
                ...r,
                data: r.data ?? [],
                pageNumber,
                totalPages,
                onPageChange: (p: number) => setPageNumber(p),
                param,
            };
        };
        const useQueryData: ApiDataHookGroup<TSet>["useQueryData"] = (opt) =>
        {
            return this.useApiQuery<string, TSet>({
                action: "Query.QueryData",
                args: opt.internalId,
                initial: opt.initial ?? null,
                call: async (svc, id) =>
                {
                    const env = await svc.queryData(id);
                    return normalizeOneData(env);
                },
                fallbackError: "查詢資料失敗",
                deps: opt.deps,
                onError: opt.onError,
                apiInstance: opt.apiInstance,
            });
        };
        const useCudActions: ApiDataHookGroup<TSet>["useCudActions"] = (opt) =>
        {
            const [isSaving, setIsSaving] = useState(false);
            const svc = useMemo(() => this.getService(opt?.apiInstance), [opt?.apiInstance]);
            const exec = useCallback(
                async <U>(fn: () => Promise<ApiResponse<U>>, fallback: string, action: string) =>
                {
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
        };
        // #endregion

        // #region Advance Api Hooks (compose Basic)
        const useQueryGridData: ApiDataHookGroup<TSet>["useQueryGridData"] = (opt) =>
        {
            const pageSize = opt.baseParam.PageSize ?? 0;
            const isNoPaging = pageSize <= 0;
            const model = useModelDisplayName({
                initial: opt.initial?.model ?? null,
                deps: opt.modelDeps ?? [],
                onError: opt.onError,
                apiInstance: opt.apiInstance,
            });
            const skipCountInitial = useMemo<ApiLoaderData<QueryListParam, number>>(() =>
            {
                const apiRes: ApiResponse<number> = { IsSuccess: true, Data: 0, SysMessage: [] };
                return { args: opt.baseParam, apiRes };
            }, [opt.baseParam]);
            const count = useQueryCount({
                condition: opt.baseParam,
                initial: isNoPaging ? (opt.initial?.count ?? skipCountInitial) : (opt.initial?.count ?? null),
                deps: isNoPaging ? [] : opt.deps,
                onError: opt.onError,
                apiInstance: opt.apiInstance,
            });
            const paged = usePagedQueryList({
                baseParam: opt.baseParam,
                count: isNoPaging ? 0 : (count.data ?? 0),
                initial: opt.initial?.list ?? null,
                deps: opt.deps,
                onError: opt.onError,
                apiInstance: opt.apiInstance,
            });
            const list = paged.data ?? [];
            const finalCount = isNoPaging ? list.length : (count.data ?? 0);
            const errors = useMemo(() =>
            {
                return [model.errorText, isNoPaging ? null : count.errorText, paged.errorText].filter((
                    x,
                ): x is string => Boolean(x));
            }, [model.errorText, count.errorText, paged.errorText, isNoPaging]);
            const errorText = useMemo(() =>
            {
                return errors.length > 0 ? errors.join("；") : null;
            }, [errors]);
            const isLoading = Boolean(model.isLoading || (!isNoPaging && count.isLoading) || paged.isLoading);
            const refetchData = useCallback(async () =>
            {
                if (isNoPaging)
                {
                    await paged.refetch();
                    return;
                }
                await count.refetch();
                await paged.refetch();
            }, [isNoPaging, count, paged]);
            return {
                modelDisplayName: model.data,
                count: finalCount,
                list,
                isLoading,
                errors,
                errorText,
                refetchData,
                pageNumber: paged.pageNumber,
                totalPages: paged.totalPages,
                onPageChange: paged.onPageChange,
                param: paged.param,
            };
        };
        const useQueryFormData: ApiDataHookGroup<TSet>["useQueryFormData"] = (opt) =>
        {
            const model = useModelDisplayName({
                initial: opt.initial?.model ?? null,
                deps: opt.modelDeps ?? [],
                onError: opt.onError,
                apiInstance: opt.apiInstance,
            });
            const internalKey = opt.mode === "edit" ? (opt.internalId ?? "") : "__new__";
            const initData = useMemo<ApiLoaderData<string, TSet> | null>(() =>
            {
                if (opt.initial?.data) return opt.initial.data;
                if (opt.mode !== "new") return null;
                if (opt.empty === undefined) return null;
                const apiRes: ApiResponse<TSet> = { IsSuccess: true, Data: opt.empty, SysMessage: [] };
                return { args: internalKey, apiRes };
            }, [opt.initial?.data, opt.mode, opt.empty, internalKey]);
            const data = useQueryData({
                internalId: internalKey,
                initial: initData,
                deps: opt.deps,
                onError: opt.onError,
                apiInstance: opt.apiInstance,
            });
            const errors = useMemo(() =>
            {
                return [model.errorText, data.errorText].filter((x): x is string => Boolean(x));
            }, [model.errorText, data.errorText]);
            const errorText = useMemo(() =>
            {
                return errors.length > 0 ? errors.join("；") : null;
            }, [errors]);
            const isLoading = Boolean(model.isLoading || data.isLoading);
            const refetchData = useCallback(async () =>
            {
                if (opt.mode === "new") return;
                await data.refetch();
            }, [opt.mode, data]);
            return { modelDisplayName: model.data, data: data.data, isLoading, errors, errorText, refetchData };
        };
        // #endregion

        return this.buildExtendedHooks({
            useModelDisplayName,
            useQueryList,
            useQueryCount,
            usePagedQueryList,
            useQueryData,
            useCudActions,
            useQueryGridData,
            useQueryFormData,
        });
    }
    // #endregion
}

/// 2026-04-15 要用來給api吃訊息專用的，暫時還沒繼續往下開發
export const emitApiMessages = (
    publish: ReturnType<typeof useToast>["publish"],
    env: ApiResponse<unknown>,
    fallbackSuccess: string,
    fallbackError: string,
) =>
{
    const messages = env.SysMessage ?? [];
    const title = env.IsSuccess ? fallbackSuccess : fallbackError;
    messages.forEach(m =>
    {
        publish({
            level: m.Status ?? (env.IsSuccess ? MessageStatus.Green : MessageStatus.Error),
            code: m.MessageCode,
            title,
            text: m.Message,
        });
    });
};
