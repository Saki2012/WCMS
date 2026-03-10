import type { Lang } from "@/SysCore/i18n/lang";
import { ApiDataAdapter,type ApiAdapterError,type ApiDataHookGroup,type ApiDataLoaderGroup, type ApiLoaderData, type EffectDeps } from "@/SysCore/Utils/API/APIAdapter";
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

class SpecCategoryService extends ApiDataService<SpecCategorySet>
{
    //#region Construct
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecCategory, apiInstance);
    }
    //#endregion

    //#region Public
    async getShowColumnItems(progId:PGID): Promise<ApiResponse<Record<string, string>[]>>
    {
        return await this.CallApi<Record<string, string>[]>(() =>
            this.Api.get<ApiResponse<Record<string, string>[]>>(`${this.Module}/GetShowColumnItems`,{ params: { progId } })
        );
    }
    //#endregion
}
type CateMapArgs = {progId: PGID; lang: Lang;};
type CateMapData = {list: SpecCategorySet[]; map: Record<string, string>;};

type SpecExtraLoaders = {
    /** 獲取要顯示的欄位 */
    getShowColItemsLoader: (opt: {progId: PGID; getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;}) 
        => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<PGID, Record<string, string>[]>>;
    /** 取得 Category map */
    getCateMapByProgIdLoader: (opt: {getArgs: (args: LoaderFunctionArgs) => CateMapArgs; getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;}) 
        => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<CateMapArgs, CateMapData>>;
};

type SpecExtraHooks ={
    useGetShowColItems: (opt: {progId: PGID; initial?: ApiLoaderData<PGID, Record<string, string>[]> | null; deps?: EffectDeps; onError?: (err: ApiAdapterError) => void; apiInstance?: AxiosInstance; }) 
        => { data: Record<string, string>[]; apiRes: ApiResponse<Record<string, string>[]> | null; isLoading: boolean; errorText: string | null; refetch: () => Promise<void>; };
    useMapByProgId: (opt: { progId: PGID; lang: Lang; initial?: ApiLoaderData<CateMapArgs, CateMapData> | null; apiInstance?: AxiosInstance; }) 
        => { map: Record<string, string>; data: SpecCategorySet[]; apiRes: ApiResponse<CateMapData> | null; isLoading: boolean; errorText: string | null; refetch: () => Promise<void>; };
}


class SpecCategoryAdapterImpl extends ApiDataAdapter<SpecCategorySet, SpecCategoryService>
{
    //#region Property
    public declare loader: ApiDataLoaderGroup<SpecCategorySet> & SpecExtraLoaders;
    public declare hooks: ApiDataHookGroup<SpecCategorySet> & SpecExtraHooks;
    //#endregion

    //#region Protect Virtual Func
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<SpecCategorySet>,): ApiDataLoaderGroup<SpecCategorySet> & SpecExtraLoaders
    {
        return {...base,
            getShowColItemsLoader: (opt: Parameters<SpecExtraLoaders["getShowColItemsLoader"]>[0],) => this.getShowColItemsLoader(opt),
            getCateMapByProgIdLoader: (opt: Parameters<SpecExtraLoaders["getCateMapByProgIdLoader"]>[0],) => this.getCateMapByProgIdLoader(opt),
        };
    }
    protected override buildExtendedHooks(base: ApiDataHookGroup<SpecCategorySet>,): ApiDataHookGroup<SpecCategorySet> & SpecExtraHooks
    {
        return {...base,
        useMapByProgId: (opt: Parameters<SpecExtraHooks["useMapByProgId"]>[0],) => this.useMapByProgId(opt),
        useGetShowColItems: (opt: Parameters<SpecExtraHooks["useGetShowColItems"]>[0],) => this.useGetShowColItems(opt),
    };
}
    //#endregion

    //#region Private

    //#region Loader Func
    /** 獲取要顯示的欄位資料
     * @param opt 
     * @returns 
     */
    private getShowColItemsLoader: SpecExtraLoaders["getShowColItemsLoader"] = (opt) =>
    {
        return this.createApiLoader<PGID, Record<string, string>[]>({
            action: "Spec.Query.GetShowColumnItems",
            getArgs: () => opt.progId,
            call: (svc, progId) => svc.getShowColumnItems(progId),
            getApiInstance: opt.getApiInstance,
    });
    };
    private getCateMapByProgIdLoader: SpecExtraLoaders["getCateMapByProgIdLoader"] = (opt) =>
    {
        return this.createApiLoader<CateMapArgs, CateMapData>({
            action: "Spec.Query.CategoryMapByProgId",
            getArgs: opt.getArgs,
            call: (svc, a) => this.queryCateMapByProgIdAsync(svc, a),
            getApiInstance: opt.getApiInstance,
        });
    };
    //#endregion
    //#region Hook Func
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
    private useGetShowColItems: SpecExtraHooks["useGetShowColItems"] = (opt) =>
    {
        const deps = opt.deps ?? [opt.progId];
        const args = useMemo(() => opt.progId, [opt.progId]);
        const r = this.useApiQuery<PGID, Record<string, string>[]>({
            action: "Spec.Query.GetShowColumnItems",
            args,
            initial: opt.initial ?? null,
            call: (svc, progId) => svc.getShowColumnItems(progId),
            fallbackError: "查詢顯示欄位失敗",
            deps,
            onError: opt.onError,
            apiInstance: opt.apiInstance,
        });
        const data = useMemo(() => r.data ?? [], [r.data]);
        return { ...r, data };
    };
    //#endregion
    private buildCateMapQuery(a: CateMapArgs): QueryListParam
    {
        const fields: string[] = [SpecCategoryModelFields.CategoryId,
            `${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.Lang}`,
            `${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.CategoryName}`,
        ];
        const condition = LibMerge(" And ", false,
            `${SpecCategoryModelFields.ProgId} = "${a.progId}"`,
            `${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.Lang} = "${a.lang}"`,
        );
        return {Fields: fields, Condition: condition, OrderBy: [{ Col: SpecCategoryModelFields.ModifyTime, Desc: true }], PageNumber: 0, PageSize: 0,};
    }
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
    private async queryCateMapByProgIdAsync(svc: SpecCategoryService, a: CateMapArgs): Promise<ApiResponse<CateMapData>>
    {
        const cdt = this.buildCateMapQuery(a);
        const env = await svc.queryList(cdt);
        const ok = Boolean(env.IsSuccess) && env.Data !== null && env.Data !== undefined;
        if (!ok) return { IsSuccess: false, Data: null, SysMessage: env.SysMessage ?? [] };
        const map = this.buildCateMap(env.Data!, a.lang);
        return { IsSuccess: true, Data: { list: env.Data!, map }, SysMessage: env.SysMessage ?? [] };
    }
    //#endregion
}

export const SpecCategoryAdapter = (apiInstance?: AxiosInstance) => new SpecCategoryAdapterImpl((api?: AxiosInstance) => new SpecCategoryService(api ?? apiInstance),);

