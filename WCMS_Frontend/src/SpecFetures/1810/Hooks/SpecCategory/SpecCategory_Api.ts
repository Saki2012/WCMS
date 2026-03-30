import type { Lang } from "@/SysCore/i18n/lang";
import {
    type ApiAdapterError,
    ApiDataAdapter,
    type ApiDataHookGroup,
    type ApiDataLoaderGroup,
    type ApiLoaderData,
    type EffectDeps,
} from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { PGID, SpecCategoryDetailModelFields, SpecCategoryModelFields } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router";

type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];
type SpecCategoryDetail = components["schemas"]["SpecCategoryDetailModel_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];
type ShowColumnMap = Record<string, string>;
type ShowColumnMapList = ShowColumnMap[];
type CateMapArgs = { progId: PGID; lang: Lang; };
type CateMapData = { list: SpecCategorySet[]; map: Record<string, string>; };

class SpecCategoryService extends ApiDataService<SpecCategorySet>
{
    // #region Construct
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecCategory, apiInstance);
    }
    // #endregion

    // #region Public
    /** 依 ProgId 取得顯示欄位原始資料 */
    async getShowColumnItems(progId: PGID): Promise<ApiResponse<ShowColumnMapList>>
    {
        return await this.CallApi<ShowColumnMapList>(() =>
            this.Api.get<ApiResponse<ShowColumnMapList>>(`${this.Module}/GetShowColumnItems`, { params: { progId } })
        );
    }
    // #endregion
}

type SpecExtraLoaders = {
    /** 取得顯示欄位 map */
    getShowColItemsLoader: (
        opt: { progId: PGID; getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; },
    ) => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<PGID, ShowColumnMap>>;

    /** 取得 Category map */
    getCateMapByProgIdLoader: (
        opt: {
            getArgs: (args: LoaderFunctionArgs) => CateMapArgs;
            getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;
        },
    ) => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<CateMapArgs, CateMapData>>;
};

type SpecExtraHooks = {
    /** 取得顯示欄位 map */
    useGetShowColItems: (
        opt: {
            progId: PGID;
            initial?: ApiLoaderData<PGID, ShowColumnMap> | null;
            deps?: EffectDeps;
            onError?: (err: ApiAdapterError) => void;
            apiInstance?: AxiosInstance;
        },
    ) => {
        data: ShowColumnMap;
        apiRes: ApiResponse<ShowColumnMap> | null;
        isLoading: boolean;
        errorText: string | null;
        refetch: () => Promise<void>;
    };

    /** 取得 Category map */
    useMapByProgId: (
        opt: {
            progId: PGID;
            lang: Lang;
            initial?: ApiLoaderData<CateMapArgs, CateMapData> | null;
            apiInstance?: AxiosInstance;
        },
    ) => {
        map: Record<string, string>;
        data: SpecCategorySet[];
        apiRes: ApiResponse<CateMapData> | null;
        isLoading: boolean;
        errorText: string | null;
        refetch: () => Promise<void>;
    };
};

class SpecCategoryAdapterImpl extends ApiDataAdapter<SpecCategorySet, SpecCategoryService>
{
    // #region Property
    declare public loader: ApiDataLoaderGroup<SpecCategorySet> & SpecExtraLoaders;
    declare public hooks: ApiDataHookGroup<SpecCategorySet> & SpecExtraHooks;
    // #endregion

    // #region Protect Virtual Func
    protected override buildExtendedLoader(
        base: ApiDataLoaderGroup<SpecCategorySet>,
    ): ApiDataLoaderGroup<SpecCategorySet> & SpecExtraLoaders
    {
        return {
            ...base,
            getShowColItemsLoader: (opt: Parameters<SpecExtraLoaders["getShowColItemsLoader"]>[0]) =>
                this.getShowColItemsLoader(opt),
            getCateMapByProgIdLoader: (opt: Parameters<SpecExtraLoaders["getCateMapByProgIdLoader"]>[0]) =>
                this.getCateMapByProgIdLoader(opt),
        };
    }

    protected override buildExtendedHooks(
        base: ApiDataHookGroup<SpecCategorySet>,
    ): ApiDataHookGroup<SpecCategorySet> & SpecExtraHooks
    {
        return {
            ...base,
            useGetShowColItems: (opt: Parameters<SpecExtraHooks["useGetShowColItems"]>[0]) =>
                this.useGetShowColItems(opt),
            useMapByProgId: (opt: Parameters<SpecExtraHooks["useMapByProgId"]>[0]) => this.useMapByProgId(opt),
        };
    }
    // #endregion

    // #region Private

    // #region Loader Func
    /** 載入顯示欄位 map */
    private getShowColItemsLoader: SpecExtraLoaders["getShowColItemsLoader"] = (opt) =>
    {
        return this.createApiLoader<PGID, ShowColumnMap>({
            action: "Spec.Query.GetShowColumnItems",
            getArgs: () => opt.progId,
            call: (svc, progId) => this.queryShowColItemsAsync(svc, progId),
            getApiInstance: opt.getApiInstance,
        });
    };

    /** 載入 Category map */
    private getCateMapByProgIdLoader: SpecExtraLoaders["getCateMapByProgIdLoader"] = (opt) =>
    {
        return this.createApiLoader<CateMapArgs, CateMapData>({
            action: "Spec.Query.CategoryMapByProgId",
            getArgs: opt.getArgs,
            call: (svc, a) => this.queryCateMapByProgIdAsync(svc, a),
            getApiInstance: opt.getApiInstance,
        });
    };
    // #endregion

    // #region Hook Func
    /** 取得 Category map */
    private useMapByProgId: SpecExtraHooks["useMapByProgId"] = (opt) =>
    {
        const deps = [opt.progId, opt.lang];
        const args = useMemo<CateMapArgs>(() => ({ progId: opt.progId, lang: opt.lang }), deps);

        const r = this.useApiQuery<CateMapArgs, CateMapData>({
            action: "Spec.Query.CategoryMapByProgId",
            args,
            initial: opt.initial ?? null,
            call: (svc, a) => this.queryCateMapByProgIdAsync(svc, a),
            fallbackError: "查詢類別清單失敗",
            deps,
            apiInstance: opt.apiInstance,
        });

        const data = useMemo(() => r.data?.list ?? [], [r.data]);
        const map = useMemo(() => r.data?.map ?? {}, [r.data]);

        return { ...r, data, map };
    };

    /** 取得顯示欄位 map */
    private useGetShowColItems: SpecExtraHooks["useGetShowColItems"] = (opt) =>
    {
        const deps = opt.deps ?? [opt.progId];
        const args = useMemo(() => opt.progId, [opt.progId]);

        const r = this.useApiQuery<PGID, ShowColumnMap>({
            action: "Spec.Query.GetShowColumnItems",
            args,
            initial: opt.initial ?? null,
            call: (svc, progId) => this.queryShowColItemsAsync(svc, progId),
            fallbackError: "查詢顯示欄位失敗",
            deps,
            onError: opt.onError,
            apiInstance: opt.apiInstance,
        });

        const data = useMemo(() => r.data ?? {}, [r.data]);

        return { ...r, data };
    };
    // #endregion

    /** 建立 Category map 查詢條件 */
    private buildCateMapQuery(a: CateMapArgs): QueryListParam
    {
        const fields: string[] = [
            SpecCategoryModelFields.CategoryId,
            `${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.Lang}`,
            `${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.CategoryName}`,
        ];

        const condition = LibMerge(
            " And ",
            false,
            `${SpecCategoryModelFields.ProgId} = "${a.progId}"`,
            `${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.Lang} = "${a.lang}"`,
        );

        return {
            Fields: fields,
            Condition: condition,
            OrderBy: [{ Col: SpecCategoryModelFields.ModifyTime, Desc: true }],
            PageNumber: 0,
            PageSize: 0,
        };
    }

    /** 把 Category list 轉成 map */
    private buildCateMap(rows: SpecCategorySet[], lang: Lang): Record<string, string>
    {
        const map: Record<string, string> = {};

        for (const p of rows)
        {
            const id = p.SpecCategory?.CategoryId;
            if (!id) continue;

            const matched = (p.SpecCategoryDetail ?? []).find((d: SpecCategoryDetail) => d.Lang === lang);
            map[String(id)] = matched?.CategoryName ?? "";
        }

        return map;
    }

    /** 取後端 Data 第一筆 dictionary */
    private pickShowColumnMap(rows?: ShowColumnMapList | null): ShowColumnMap
    {
        if (!rows || rows.length <= 0) return {};
        return rows[0] ?? {};
    }

    /** 查詢顯示欄位 map */
    private async queryShowColItemsAsync(svc: SpecCategoryService, progId: PGID): Promise<ApiResponse<ShowColumnMap>>
    {
        const env = await svc.getShowColumnItems(progId);
        if (!env.IsSuccess) return { IsSuccess: false, Data: null, SysMessage: env.SysMessage ?? [] };

        const map = this.pickShowColumnMap(env.Data);
        return { IsSuccess: true, Data: map, SysMessage: env.SysMessage ?? [] };
    }

    /** 查詢 Category map */
    private async queryCateMapByProgIdAsync(svc: SpecCategoryService, a: CateMapArgs): Promise<ApiResponse<CateMapData>>
    {
        const cdt = this.buildCateMapQuery(a);
        const env = await svc.queryList(cdt);
        const ok = Boolean(env.IsSuccess) && env.Data !== null && env.Data !== undefined;
        if (!ok) return { IsSuccess: false, Data: null, SysMessage: env.SysMessage ?? [] };

        const list = env.Data ?? [];
        const map = this.buildCateMap(list, a.lang);

        return { IsSuccess: true, Data: { list, map }, SysMessage: env.SysMessage ?? [] };
    }
    // #endregion
}

export const SpecCategoryAdapter = (apiInstance?: AxiosInstance) =>
    new SpecCategoryAdapterImpl((api?: AxiosInstance) => new SpecCategoryService(api ?? apiInstance));
