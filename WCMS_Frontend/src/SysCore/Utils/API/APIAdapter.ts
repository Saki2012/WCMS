import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { type ApiResponse, MessageStatus, type SysMessageModel } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { AxiosInstance } from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

export type EffectDeps = ReadonlyArray<string | number | boolean | object | null | undefined>;

export type ServerFormActions = { Save: () => Promise<void>; Delete: () => Promise<void>; Back: () => void; Preview?: () => void; IsSaving?: boolean; };

export type ApiLoaderData<TArgs, TData> = { args: TArgs; apiRes: ApiResponse<TData>; };

export type ApiGridLoaderData<TModel> = {
    model: ApiLoaderData<null, ModelDisplaySchema[]>;
    count: ApiLoaderData<QueryListParam, number>;
    list: ApiLoaderData<QueryListParam, TModel[]>;
};

export type ApiAdapterError = { messageText: string; sysMessages: SysMessageModel[]; httpStatus?: number; action?: string; };

export type ApiActionOptions<TService, TArgs, TData> = {
    action: string;
    fallbackError: string;
    call: (svc: TService, args: TArgs) => Promise<ApiResponse<TData>>;
    apiInstance?: AxiosInstance;
    onSuccess?: (res: ApiResponse<TData>) => void | Promise<void>;
    onError?: (err: ApiAdapterError) => void;
};

export type ApiActionResult<TArgs, TData> = { execute: (args: TArgs) => Promise<ApiResponse<TData>>; isLoading: boolean; apiRes: ApiResponse<TData> | null; };

/** 後台標準動作：用來區分成功後是哪個 action */
export type ServerActionMode = "create" | "update" | "delete" | "invalid";

export type UseServerActionsResult<TModel> = {
    isSaving: boolean;
    createAsync: (data: TModel) => Promise<ApiResponse<TModel>>;
    updateAsync: (internalId: string, data: TModel) => Promise<ApiResponse<TModel>>;
    deleteAsync: (internalId: string) => Promise<ApiResponse<TModel>>;
    invalidAsync: (internalId: string, isInvalid: boolean) => Promise<ApiResponse<TModel>>;
};

/** useServerActions 的可選參數：完全不傳也可（只做 toast） */
export type UseServerActionsOptions = {
    apiInstance?: AxiosInstance;
    onError?: (err: ApiAdapterError) => void;
    onSuccessByMode?: Partial<Record<ServerActionMode, () => void | Promise<void>>>;
    confirmDelete?: (internalId: string) => Promise<boolean> | boolean;
};

type MaybeArray<T> = T | ReadonlyArray<T>;

// ============================================================================
// 2) ApiDataAdapter（資料型共用：Query/Count/Data + CUD hooks）
// ============================================================================

export interface ApiDataService<TModel>
{
    getModelDisplayName: () => Promise<ApiResponse<ModelDisplaySchema[]>>;
    queryData: (internalId: string) => Promise<ApiResponse<TModel>>;
    queryList: (condition: QueryListParam) => Promise<ApiResponse<TModel[]>>;
    queryCount: (condition: QueryListParam) => Promise<ApiResponse<number>>;

    create?: (data: TModel) => Promise<ApiResponse<TModel>>;
    update?: (internalId: string, data: TModel) => Promise<ApiResponse<TModel>>;
    delete?: (internalId: string) => Promise<ApiResponse<TModel>>;
    invalid?: (internalId: string, isInvalid: boolean) => Promise<ApiResponse<TModel>>;
}

export type ApiDataLoaderGroup<TModel> = {
    createModelDisplayNameLoader: (
        opt?: { getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; },
    ) => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<null, ModelDisplaySchema[]>>;

    createQueryListLoader: (
        opt: { getCondition: (args: LoaderFunctionArgs) => QueryListParam; getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; },
    ) => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<QueryListParam, TModel[]>>;

    createQueryCountLoader: (
        opt: { getCondition: (args: LoaderFunctionArgs) => QueryListParam; getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; },
    ) => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<QueryListParam, number>>;

    createQueryDataLoader: (
        opt: { getInternalId: (args: LoaderFunctionArgs) => string; getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; },
    ) => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<string, TModel>>;
    createQueryGridDataLoader: (
        opt: { getCondition: (args: LoaderFunctionArgs) => QueryListParam; getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; },
    ) => (args: LoaderFunctionArgs) => Promise<ApiGridLoaderData<TModel>>;
};

export type ApiGridInitial<TModel> = {
    model?: ApiLoaderData<null, ModelDisplaySchema[]> | null;
    count?: ApiLoaderData<QueryListParam, number> | null;
    list?: ApiLoaderData<QueryListParam, TModel[]> | null;
};

export type ApiFormInitial<TModel> = { model?: ApiLoaderData<null, ModelDisplaySchema[]> | null; data?: ApiLoaderData<string, TModel> | null; };

export type ApiFormMode = "new" | "edit";

export type ApiDataHookGroup<TModel> = {
    useModelDisplayName: (
        opt?: {
            initial?: ApiLoaderData<null, ModelDisplaySchema[]> | null;
            deps?: EffectDeps;
            onError?: (err: ApiAdapterError) => void;
            apiInstance?: AxiosInstance;
        },
    ) => {
        data: ModelDisplaySchema | null;
        apiRes: ApiResponse<ModelDisplaySchema[]> | null;
        isLoading: boolean;
        errorText: string | null;
        refetch: () => Promise<void>;
    };

    useQueryList: (
        opt: {
            condition: QueryListParam;
            initial?: ApiLoaderData<QueryListParam, TModel[]> | null;
            deps: EffectDeps;
            onError?: (err: ApiAdapterError) => void;
            apiInstance?: AxiosInstance;
        },
    ) => { data: TModel[]; apiRes: ApiResponse<TModel[]> | null; isLoading: boolean; errorText: string | null; refetch: () => Promise<void>; };

    useQueryCount: (
        opt: {
            condition: QueryListParam;
            initial?: ApiLoaderData<QueryListParam, number> | null;
            deps: EffectDeps;
            onError?: (err: ApiAdapterError) => void;
            apiInstance?: AxiosInstance;
        },
    ) => { data: number; apiRes: ApiResponse<number> | null; isLoading: boolean; errorText: string | null; refetch: () => Promise<void>; };

    usePagedQueryList: (
        opt: {
            baseParam: QueryListParam;
            count: number;
            initial?: ApiLoaderData<QueryListParam, TModel[]> | null;
            deps: EffectDeps;
            onError?: (err: ApiAdapterError) => void;
            apiInstance?: AxiosInstance;
        },
    ) => {
        data: TModel[];
        apiRes: ApiResponse<TModel[]> | null;
        isLoading: boolean;
        errorText: string | null;
        refetch: () => Promise<void>;

        pageNumber: number;
        totalPages: number;
        onPageChange: (page: number) => void;
        // 方便外部 debug/取用
        param: QueryListParam;
    };

    useQueryData: (
        opt: {
            internalId: string;
            initial?: ApiLoaderData<string, TModel> | null;
            deps: EffectDeps;
            onError?: (err: ApiAdapterError) => void;
            apiInstance?: AxiosInstance;
        },
    ) => { data: TModel | null; apiRes: ApiResponse<TModel> | null; isLoading: boolean; errorText: string | null; refetch: () => Promise<void>; };

    useCudActions: (
        opt?: { onError?: (err: ApiAdapterError) => void; apiInstance?: AxiosInstance; },
    ) => {
        isSaving: boolean;
        createAsync: (data: TModel) => Promise<ApiResponse<TModel>>;
        updateAsync: (internalId: string, data: TModel) => Promise<ApiResponse<TModel>>;
        deleteAsync: (internalId: string) => Promise<ApiResponse<TModel>>;
        invalidAsync: (internalId: string, isInvalid: boolean) => Promise<ApiResponse<TModel>>;
    };
    useQueryGridData: (
        opt: {
            baseParam: QueryListParam;
            deps: EffectDeps;
            modelDeps?: EffectDeps;
            initial?: ApiGridInitial<TModel>;
            onError?: (err: ApiAdapterError) => void;
            apiInstance?: AxiosInstance;
        },
    ) => {
        modelDisplayName: ModelDisplaySchema | null;
        count: number;
        list: TModel[];
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
            empty?: TModel;
            deps: EffectDeps;
            modelDeps?: EffectDeps;
            initial?: ApiFormInitial<TModel>;
            onError?: (err: ApiAdapterError) => void;
            apiInstance?: AxiosInstance;
        },
    ) => {
        modelDisplayName: ModelDisplaySchema | null;
        data: TModel | null;
        isLoading: boolean;
        errors: string[];
        errorText: string | null;
        refetchData: () => Promise<void>;
    };
};
// #endregion

// #region Public
// ============================================================================
// 1) ApiBaseAdapter（只有共用底，不綁定「資料型共用 API」）
// ============================================================================
export class ApiBaseAdapter<TService>
{
    // #region Property
    protected readonly createService: (apiInstance?: AxiosInstance) => TService;
    // #endregion

    // #region Public
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
    protected createApiLoader<TArgs, TData>(
        opt: {
            action: string;
            getArgs: (args: LoaderFunctionArgs) => TArgs;
            call: (svc: TService, a: TArgs) => Promise<ApiResponse<TData>>;
            getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;
        },
    )
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
        const initial = opt.initial ?? null;
        const initApiRes = initial?.apiRes ?? null;
        const initOk = initApiRes ? isOk(initApiRes) : false;
        const initialSnapshotText = useMemo(() => buildApiLoaderDataSnapshotText(initial), [initial]);
        const initErrText = useMemo(() =>
        {
            if (!initApiRes) return null;
            if (initOk) return null;
            return buildError(initApiRes, opt.fallbackError, opt.action).messageText;
        }, [initialSnapshotText, initApiRes, initOk, opt.fallbackError, opt.action]);

        const [data, setData] = useState<TData | null>(() => (initOk ? (initApiRes!.Data ?? null) : null));
        const [apiRes, setApiRes] = useState<ApiResponse<TData> | null>(() => initApiRes);
        const [isLoading, setIsLoading] = useState(false);
        const [errorText, setErrorText] = useState<string | null>(() => initErrText);
        const svc = useMemo(() => this.getService(opt.apiInstance), [opt.apiInstance]);
        const lastInitialSnapshotRef = useRef<string>(initialSnapshotText);
        const applyError = useCallback((e: ApiResponse<TData>, fallback: string) =>
        {
            const err = buildError(e, fallback, opt.action);
            setErrorText(prev => prev === err.messageText ? prev : err.messageText);
            opt.onError?.(err);
        }, [opt.action, opt.onError]);

        /** 套用 SSR / 新增模式 initial；內容相同時不 setState，避免 Maximum update depth。 */
        const applyInitialIfChanged = (): boolean =>
        {
            const init = opt.initial ?? null;
            const nextInitialSnapshotText = buildApiLoaderDataSnapshotText(init);
            if (!init)
            {
                lastInitialSnapshotRef.current = "";
                return false;
            }
            if (lastInitialSnapshotRef.current === nextInitialSnapshotText) return false;
            lastInitialSnapshotRef.current = nextInitialSnapshotText;
            setApiRes(prev => buildApiResponseSnapshotText(prev) === buildApiResponseSnapshotText(init.apiRes) ? prev : init.apiRes);
            if (isOk(init.apiRes))
            {
                setData(prev => toStableSnapshotText(prev) === toStableSnapshotText(init.apiRes.Data) ? prev : init.apiRes.Data);
                setErrorText(prev => prev === null ? prev : null);
                return true;
            }
            applyError(init.apiRes, opt.fallbackError);
            return true;
        };

        const fetchAsync = useCallback(async () =>
        {
            setIsLoading(true);
            setErrorText(null);
            try
            {
                const e = await opt.call(svc, opt.args);
                setApiRes(prev => buildApiResponseSnapshotText(prev) === buildApiResponseSnapshotText(e) ? prev : e);
                if (isOk(e)) setData(prev => toStableSnapshotText(prev) === toStableSnapshotText(e.Data) ? prev : e.Data);
                else applyError(e, opt.fallbackError);
            } finally
            {
                setIsLoading(false);
            }
        }, [svc, opt.args, opt.call, applyError, opt.fallbackError]);
        useEffect(() =>
        {
            // 執行 function：CSR mount 時若已有 initial 就不再 fetch；initial 只看內容快照，不看物件 reference。
            const applied = applyInitialIfChanged();
            if (!applied && !initApiRes) void fetchAsync();
        }, [...opt.deps, initialSnapshotText]);
        return { data, apiRes: apiRes, isLoading, errorText, refetch: fetchAsync };
    }

    /** 封裝手動觸發的 API action，例如修改密碼、重置密碼。 */
    protected useApiAction<TArgs, TData>(opt: ApiActionOptions<TService, TArgs, TData>): ApiActionResult<TArgs, TData>
    {
        // 宣告變數
        const [isLoading, setIsLoading] = useState<boolean>(false);
        const [apiRes, setApiRes] = useState<ApiResponse<TData> | null>(null);
        const svc = useMemo(() => this.getService(opt.apiInstance), [opt.apiInstance]);
        const execute = useCallback(async (args: TArgs): Promise<ApiResponse<TData>> =>
        {
            // 執行 function：呼叫 API action 並統一處理 loading / callback。
            setIsLoading(true);
            try
            {
                const res = await opt.call(svc, args);
                setApiRes(res);
                if (!res.IsSuccess)
                {
                    opt.onError?.(buildError(res, opt.fallbackError, opt.action));
                } else
                {
                    await opt.onSuccess?.(res);
                }
                return res;
            } finally
            {
                setIsLoading(false);
            }
        }, [svc, opt.call, opt.action, opt.fallbackError, opt.onError, opt.onSuccess]);
        return { execute, isLoading, apiRes };
    }
    // #endregion
}

export class ApiDataAdapter<TModel, TSvc extends ApiDataService<TModel>> extends ApiBaseAdapter<TSvc>
{
    // #region Property
    public loader: ApiDataLoaderGroup<TModel>;

    public hooks: ApiDataHookGroup<TModel>;
    // #endregion

    // #region Public
    constructor(createService: (apiInstance?: AxiosInstance) => TSvc)
    {
        super(createService);
        this.loader = this.buildLoaderGroup();
        this.hooks = this.buildHookGroup();
    }

    protected buildExtendedLoader(base: ApiDataLoaderGroup<TModel>): ApiDataLoaderGroup<TModel>
    {
        return base;
    }

    protected buildExtendedHooks(base: ApiDataHookGroup<TModel>): ApiDataHookGroup<TModel>
    {
        return base;
    }

    /** 後台標準行為：CUD + Toast + Success / Error callback */
    public useServerActions(opt?: UseServerActionsOptions): UseServerActionsResult<TModel>
    {
        const { publish } = useToast();
        const cud = this.hooks.useCudActions({ apiInstance: opt?.apiInstance, onError: opt?.onError });

        const emitMessages = (env: ApiResponse<unknown>) =>
        {
            (env.SysMessage ?? []).forEach(m =>
            {
                publish({ level: m.Status ?? MessageStatus.Info, code: m.MessageCode, title: m.Message ?? "", text: m.Message });
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
            createAsync: async (data: TModel) =>
            {
                const env = await cud.createAsync(data);
                emitMessages(env);
                if (env.IsSuccess) await runSuccess("create");
                return env;
            },
            updateAsync: async (internalId: string, data: TModel) =>
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
    private buildLoaderGroup(): ApiDataLoaderGroup<TModel>
    {
        const createModelDisplayNameLoader: ApiDataLoaderGroup<TModel>["createModelDisplayNameLoader"] = (opt) =>
        {
            return this.createApiLoader<null, ModelDisplaySchema[]>({
                action: "Query.ModelDisplayName",
                getArgs: () => null,
                call: (svc) => svc.getModelDisplayName(),
                getApiInstance: opt?.getApiInstance,
            });
        };
        const createQueryListLoader: ApiDataLoaderGroup<TModel>["createQueryListLoader"] = (opt) =>
        {
            return this.createApiLoader<QueryListParam, TModel[]>({
                action: "Query.QueryList",
                getArgs: opt.getCondition,
                call: (svc, c) => svc.queryList(c),
                getApiInstance: opt.getApiInstance,
            });
        };
        const createQueryCountLoader: ApiDataLoaderGroup<TModel>["createQueryCountLoader"] = (opt) =>
        {
            return this.createApiLoader<QueryListParam, number>({
                action: "Query.QueryCount",
                getArgs: opt.getCondition,
                call: (svc, c) => svc.queryCount(c),
                getApiInstance: opt.getApiInstance,
            });
        };
        const createQueryDataLoader: ApiDataLoaderGroup<TModel>["createQueryDataLoader"] = (opt) =>
        {
            return this.createApiLoader<string, TModel>({
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

        const createQueryGridDataLoader: ApiDataLoaderGroup<TModel>["createQueryGridDataLoader"] = (opt) =>
        {
            const loadModel = createModelDisplayNameLoader({ getApiInstance: opt.getApiInstance });
            const loadList = createQueryListLoader({ getCondition: opt.getCondition, getApiInstance: opt.getApiInstance });
            const loadCount = createQueryCountLoader({ getCondition: opt.getCondition, getApiInstance: opt.getApiInstance });
            return async (args: LoaderFunctionArgs): Promise<ApiGridLoaderData<TModel>> =>
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

        return this.buildExtendedLoader({
            createModelDisplayNameLoader,
            createQueryListLoader,
            createQueryCountLoader,
            createQueryDataLoader,
            createQueryGridDataLoader,
        });
    }

    private buildHookGroup(): ApiDataHookGroup<TModel>
    {
        const useModelDisplayName: ApiDataHookGroup<TModel>["useModelDisplayName"] = (opt) =>
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
        const useQueryList: ApiDataHookGroup<TModel>["useQueryList"] = (opt) =>
        {
            const r = this.useApiQuery<QueryListParam, TModel[]>({
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
        const useQueryCount: ApiDataHookGroup<TModel>["useQueryCount"] = (opt) =>
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
        const usePagedQueryList: ApiDataHookGroup<TModel>["usePagedQueryList"] = (opt) =>
        {
            const defaultPageNumber = opt.baseParam.PageNumber ?? 1;
            const resetKey = useMemo(() => buildPagedQueryResetKey(opt.baseParam, opt.deps), [opt.baseParam, opt.deps]);
            const prevResetKeyRef = useRef<string>(resetKey);
            const prevDefaultPageRef = useRef<number>(defaultPageNumber);
            const [pageNumber, setPageNumber] = useState<number>(defaultPageNumber);

            const shouldResetPage = prevResetKeyRef.current !== resetKey;
            const shouldSyncDefaultPage = prevDefaultPageRef.current !== defaultPageNumber;
            const effectivePageNumber = shouldResetPage || shouldSyncDefaultPage ? defaultPageNumber : pageNumber;

            useEffect(() =>
            {
                if (!shouldResetPage && !shouldSyncDefaultPage) return;

                prevResetKeyRef.current = resetKey;
                prevDefaultPageRef.current = defaultPageNumber;
                setPageNumber(defaultPageNumber);
            }, [resetKey, defaultPageNumber, shouldResetPage, shouldSyncDefaultPage]);

            const param = useMemo(() => ({ ...opt.baseParam, PageNumber: effectivePageNumber }), [opt.baseParam, effectivePageNumber]);

            const deps = useMemo<EffectDeps>(() => [buildPagedQueryResetKey(param, opt.deps), param.PageNumber], [param, opt.deps]);

            const currentParamKey = useMemo(() => JSON.stringify(param ?? null), [param]);
            const initialParamKey = useMemo(() => JSON.stringify(opt.initial?.args ?? null), [opt.initial]);

            const matchedInitial = useMemo(() =>
            {
                return currentParamKey === initialParamKey;
            }, [currentParamKey, initialParamKey]);

            const effectiveInitial = useMemo(() =>
            {
                return matchedInitial ? (opt.initial ?? null) : null;
            }, [matchedInitial, opt.initial]);

            const r = this.useApiQuery<QueryListParam, TModel[]>({
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

            const onPageChange = useCallback((p: number): void =>
            {
                setPageNumber(p);
            }, []);

            return { ...r, data: r.data ?? [], pageNumber: effectivePageNumber, totalPages, onPageChange, param };
        };
        const useQueryData: ApiDataHookGroup<TModel>["useQueryData"] = (opt) =>
        {
            return this.useApiQuery<string, TModel>({
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
        const useCudActions: ApiDataHookGroup<TModel>["useCudActions"] = (opt) =>
        {
            const createAction = this.useApiAction<TModel, TModel>({
                action: "CUD.Create",
                fallbackError: "新增失敗",
                apiInstance: opt?.apiInstance,
                onError: opt?.onError,
                call: (svc, data) =>
                {
                    if (!svc.create) throw new Error("[ApiDataAdapter] service.create not implemented");
                    return svc.create(data);
                },
            });
            const updateAction = this.useApiAction<{ internalId: string; data: TModel; }, TModel>({
                action: "CUD.Update",
                fallbackError: "更新失敗",
                apiInstance: opt?.apiInstance,
                onError: opt?.onError,
                call: (svc, args) =>
                {
                    if (!svc.update) throw new Error("[ApiDataAdapter] service.update not implemented");
                    return svc.update(args.internalId, args.data);
                },
            });
            const deleteAction = this.useApiAction<string, TModel>({
                action: "CUD.Delete",
                fallbackError: "刪除失敗",
                apiInstance: opt?.apiInstance,
                onError: opt?.onError,
                call: (svc, internalId) =>
                {
                    if (!svc.delete) throw new Error("[ApiDataAdapter] service.delete not implemented");
                    return svc.delete(internalId);
                },
            });
            const invalidAction = this.useApiAction<{ internalId: string; isInvalid: boolean; }, TModel>({
                action: "CUD.Invalid",
                fallbackError: "失效操作失敗",
                apiInstance: opt?.apiInstance,
                onError: opt?.onError,
                call: (svc, args) =>
                {
                    if (!svc.invalid) throw new Error("[ApiDataAdapter] service.invalid not implemented");
                    return svc.invalid(args.internalId, args.isInvalid);
                },
            });

            const createAsync = useCallback(async (data: TModel) =>
            {
                return await createAction.execute(data);
            }, [createAction.execute]);
            const updateAsync = useCallback(async (internalId: string, data: TModel) =>
            {
                return await updateAction.execute({ internalId, data });
            }, [updateAction.execute]);
            const deleteAsync = useCallback(async (internalId: string) =>
            {
                return await deleteAction.execute(internalId);
            }, [deleteAction.execute]);
            const invalidAsync = useCallback(async (internalId: string, isInvalid: boolean) =>
            {
                return await invalidAction.execute({ internalId, isInvalid });
            }, [invalidAction.execute]);

            const isSaving = Boolean(createAction.isLoading || updateAction.isLoading || deleteAction.isLoading || invalidAction.isLoading);

            return { isSaving, createAsync, updateAsync, deleteAsync, invalidAsync };
        };

        const useQueryGridData: ApiDataHookGroup<TModel>["useQueryGridData"] = (opt) =>
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
                return [model.errorText, isNoPaging ? null : count.errorText, paged.errorText].filter((x): x is string => Boolean(x));
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
        const useQueryFormData: ApiDataHookGroup<TModel>["useQueryFormData"] = (opt) =>
        {
            const model = useModelDisplayName({
                initial: opt.initial?.model ?? null,
                deps: opt.modelDeps ?? [],
                onError: opt.onError,
                apiInstance: opt.apiInstance,
            });
            const internalKey = opt.mode === "edit" ? (opt.internalId ?? "") : "__new__";
            const initData = useMemo<ApiLoaderData<string, TModel> | null>(() =>
            {
                if (opt.initial?.data) return opt.initial.data;
                if (opt.mode !== "new") return null;
                if (opt.empty === undefined) return null;
                const apiRes: ApiResponse<TModel> = { IsSuccess: true, Data: opt.empty, SysMessage: [] };
                return { args: internalKey, apiRes };
            }, [opt.initial?.data, opt.mode, opt.empty, internalKey]);
            const data = useQueryData({ internalId: internalKey, initial: initData, deps: opt.deps, onError: opt.onError, apiInstance: opt.apiInstance });
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
export const emitApiMessages = (publish: ReturnType<typeof useToast>["publish"], env: ApiResponse<unknown>, fallbackSuccess: string, fallbackError: string) =>
{
    const messages = env.SysMessage ?? [];
    const title = env.IsSuccess ? fallbackSuccess : fallbackError;
    messages.forEach(m =>
    {
        publish({ level: m.Status ?? (env.IsSuccess ? MessageStatus.Green : MessageStatus.Error), code: m.MessageCode, title, text: m.Message });
    });
};
// #endregion

// #region Private
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
    return { messageText: toMessageText(sysMessages, fallback), sysMessages, httpStatus: parseHttpStatus(sysMessages), action };
};

const isOk = <T>(apiRes: ApiResponse<T>): apiRes is ApiResponse<T> & { IsSuccess: true; Data: T; } =>
{
    return Boolean(apiRes?.IsSuccess) && apiRes.Data !== null && apiRes.Data !== undefined;
};

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

/** 將 API 初始資料轉成穩定快照，避免每次 render 產生新物件時重複 setState。 */
const toStableSnapshotText = (value: unknown): string =>
{
    const seen = new WeakSet<object>();

    /** 遞迴整理快照資料，物件 key 排序後再 stringify。 */
    const normalize = (input: unknown): unknown =>
    {
        if (input === null || input === undefined) return input;
        if (typeof input !== "object") return input;
        if (input instanceof Date) return input.toISOString();
        if (isBrowserFile(input)) return buildBrowserFileSnapshot(input);
        if (seen.has(input)) return "[Circular]";

        seen.add(input);

        if (Array.isArray(input)) return input.map(normalize);

        return Object.keys(input as Record<string, unknown>).sort().reduce<Record<string, unknown>>((snapshot, key) =>
        {
            const item = (input as Record<string, unknown>)[key];
            if (typeof item === "function") return snapshot;

            snapshot[key] = normalize(item);
            return snapshot;
        }, {});
    };

    try
    {
        return JSON.stringify(normalize(value));
    } catch
    {
        return String(value);
    }
};
/** 建立分頁查詢重置 key，排除 PageNumber，避免單純換頁時又被重設回第一頁。 */
const buildPagedQueryResetKey = (param: QueryListParam, deps: EffectDeps): string =>
{
    const { PageNumber: _pageNumber, ...resetParam } = param;

    return toStableSnapshotText({ param: resetParam, deps });
};

/** 判斷是否為瀏覽器 File，SSR 環境不直接取用 File 避免錯誤。 */
const isBrowserFile = (value: unknown): value is File =>
{
    return typeof File !== "undefined" && value instanceof File;
};

/** 建立 File 快照，避免把整個 File 物件放進 JSON.stringify。 */
const buildBrowserFileSnapshot = (file: File): Record<string, string | number> =>
{
    return { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified };
};

/** 建立 ApiResponse 快照，供 setState 前判斷資料是否真的變更。 */
const buildApiResponseSnapshotText = <T>(apiRes: ApiResponse<T> | null | undefined): string =>
{
    if (!apiRes) return "";

    return toStableSnapshotText({ IsSuccess: apiRes.IsSuccess, Data: apiRes.Data, SysMessage: apiRes.SysMessage });
};

/** 建立 Loader initial 快照，避免 initial object 每次重建造成 useEffect 循環。 */
const buildApiLoaderDataSnapshotText = <TArgs, TData>(initial: ApiLoaderData<TArgs, TData> | null | undefined): string =>
{
    if (!initial) return "";

    return toStableSnapshotText({ args: initial.args, apiRes: initial.apiRes });
};
// #endregion
