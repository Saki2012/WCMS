import type { Lang } from "@/SysCore/i18n/lang";
import { ApiDataAdapter,type ApiDataHookGroup,type ApiDataLoaderGroup, type ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
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
    async getShowColumnItems(): Promise<ApiResponse<Record<string, string>[]>>
    {
        return await this.CallApi<Record<string, string>[]>(() =>
            this.Api.get<ApiResponse<Record<string, string>[]>>(`${this.Module}/GetShowColumnItems`)
        );
    }
    //#endregion
}


type SpecExtraLoaders = {
  createQueryByProgIdLoader: (opt: {
    getProgId: (args: LoaderFunctionArgs) => string;
    getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;
  }) => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<string, []>>;
};

type SpecExtraHooks ={
        useMapByProgId: (opt: { progId: PGID; lang: Lang; apiInstance?: AxiosInstance; }) => {
        map: Record<string, string>;
        data: SpecCategorySet[];
        apiRes: ApiResponse<SpecCategorySet> | null;
        isLoading: boolean;
        errorText: string | null;
        refetch: () => Promise<void>;
    };
}


class SpecCategoryAdapterImpl extends ApiDataAdapter<SpecCategorySet, SpecCategoryService>
{
    //#region Property
    public declare loader: ApiDataLoaderGroup<SpecCategorySet> & SpecExtraLoaders;
    public declare hooks: ApiDataHookGroup<SpecCategorySet> & SpecExtraHooks;
    //#endregion

    //#region Protect Virtual Func
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<SpecCategorySet>)
    {
        return { ...base, 
            createShowColumnItemsLoader:this.createShowColumnItemsLoader 
        };
    }
    protected override buildExtendedHooks(base: ApiDataHookGroup<SpecCategorySet>) {
        
        return {...base,
            useMapByProgId:this.useMapByProgId,
        }
    }
    //#endregion

    //#region Private

    //#region Loader Func
    /** 獲取要顯示的欄位資料
     * @param opt 
     * @returns 
     */
    private createShowColumnItemsLoader(opt?: {getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;})
    {
        return this.createApiLoader<null, Record<string, string>[]>({
                action: "Query.GetShowColumnItems",
                getArgs: () => null,
                call: (svc) => svc.getShowColumnItems(),
                getApiInstance: opt?.getApiInstance,
            });
    }
    //#endregion
    /** 取得類別清單
     * @param opt 
     * @returns 
     */
    private useMapByProgId(opt: { progId: string; lang: Lang; apiInstance?: AxiosInstance })
    {
        const deps = [opt.progId, opt.lang];
        const fields: string[] = [SpecCategoryModelFields.CategoryId,
            `${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.Lang}`,
            `${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.CategoryName}`,
        ];
        const condition = LibMerge(" And ", false, 
            `${SpecCategoryModelFields.ProgId} = "${opt.progId}"`,
            `${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.Lang} = "${opt.lang}"`
        )
        const query = this.hooks.useQueryList({condition: {Fields: fields, Condition:condition, OrderBy: [{ Col: SpecCategoryModelFields.ModifyTime, Desc: true }], PageNumber: 0, PageSize: 0,},deps,apiInstance: opt.apiInstance,});
        const map = useMemo<Record<string, string>>(() =>
        {
            const rows = query.data ?? [];
            return rows.reduce((acc, p) =>
            {
                const id = p.SpecCategory?.CategoryId;
                if (!id) return acc;
                const matched = (p.SpecCategoryDetail ?? []).find((d: SpecCategoryDetail) => d.Lang === opt.lang);
                acc[String(id)] = matched?.CategoryName ?? "";
                return acc;
            }, {} as Record<string, string>);
        }, [query.data, opt.lang]);
        return { ...query, map };
    }
    //#endregion

}

export const SpecCategoryAdapter = (apiInstance?: AxiosInstance) => new SpecCategoryAdapterImpl((api?: AxiosInstance) => new SpecCategoryService(api ?? apiInstance),);

