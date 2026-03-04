import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { components } from "@/types/api";
import {AccountFields,PageManagementDetailFields,PageManagementFields,PGID,} from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Pagemanagement/PageManagement_Api";
type QueryListParam = components["schemas"]["QueryListParam"];
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];

//#region Public
export type PageManagementListRawData = {
    modelDisplayName: ModelDisplaySchema|null;count: number;list: PageManagementSet[];
    pageNumber: number;totalPages: number;onPageChange: (page: number) => void;
    param: QueryListParam;categoryData: CategorySet[];categoryMap: Record<string, string>;
};
export type PageManagementListAdapter = {
  PageManagement: ReturnType<typeof PageManagementAdapter>;
  Category: ReturnType<typeof CategoryAdapter>;
};
export const usePageManagementListFetchData = (opt: {lang: Lang;kw: string;}): UseFetchDataResult<PageManagementListRawData,PageManagementListAdapter> =>
{
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) =>{publish({ level: MessageStatus.Error, title: e.messageText });}, [publish]);
    const adapter = useMemo(() =>{return { PageManagement: PageManagementAdapter(),Category: CategoryAdapter(),Tag: TagAdapter() };}, []);
    const baseParam = usePageManagementListQueryParam({ lang: opt.lang, kw: opt.kw });
    const grid = adapter.PageManagement.hooks.useQueryGridData({baseParam,deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],modelDeps: [opt.lang],onError,});
    const category = adapter.Category.hooks.useMapByProgId({progId: PGID.PageManagement,lang: opt.lang,});
    // 宣告變數：loading / errors 統一出口
    const isLoading = Boolean(grid.isLoading || category.isLoading);
    const errors = useMemo(() =>
    {
        const list = [...(grid.errors ?? []),category.errorText];
        return list.filter((x): x is string => Boolean(x));
    }, [grid.errors, category.errorText]);
    // 宣告變數：rawData（你要的自定義出口）
    const rawData = useMemo<PageManagementListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,count: grid.count ?? 0,list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,totalPages: grid.totalPages ?? 1,onPageChange: grid.onPageChange,
            param: grid.param,categoryData: category.data ?? [],categoryMap: category.map ?? {},
           };
    }, [grid.modelDisplayName,grid.count,grid.list,grid.pageNumber,grid.totalPages,grid.onPageChange,grid.param,category.data,category.map]);
    const refetchData = useCallback(async () =>{await grid.refetchData();}, [grid]);
    const refetchRefData = useCallback(async () =>{await Promise.all([category.refetch()]);}, [category]);
    return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
//#endregion

//#region Private
const usePageManagementListQueryParam = (p: { lang: Lang; kw: string; }): QueryListParam =>
{
    const fields = useMemo<string[]>(() =>
    {
        return [PageManagementFields.InternalId,PageManagementFields.PageId,PageManagementFields.CategoryId,
                PageManagementFields.ModifyUserId,PageManagementFields.ModifyTime,
                `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Lang}`,
                `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Title}`,
                `${PageManagementFields.ModifyUser}.${AccountFields.AccountName}`,];
    }, []);
    const condition = useMemo(() =>
    {
        let cdt = `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Lang} = ${p.lang}`;
        if (!!p.kw) cdt = LibMerge(" And ",false,cdt, `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Title} Like ${p.kw}`,);
        return cdt;
    }, [p.lang, p.kw]);
    return useMemo(() =>
    {
        return {
            Fields: fields, Condition: condition,
            OrderBy: [{ Col: PageManagementFields.CreateTime, Desc: true }],
            PageNumber: 1, PageSize: 10,
        };
    }, [fields, condition]);
};
//#endregion