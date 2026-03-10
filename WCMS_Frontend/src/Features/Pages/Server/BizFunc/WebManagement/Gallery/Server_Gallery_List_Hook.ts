import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tag_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { components } from "@/types/api";
import {AccountFields,GalleryFields,GalleryInfoFields,PGID,} from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Gallery_Api";
type QueryListParam = components["schemas"]["QueryListParam"];
type GallerySet = components["schemas"]["GallerySet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];

//#region Public
export type GalleryListRawData = {
    modelDisplayName: ModelDisplaySchema|null;count: number;list: GallerySet[];
    pageNumber: number;totalPages: number;onPageChange: (page: number) => void;
    param: QueryListParam;categoryData: CategorySet[];categoryMap: Record<string, string>;
    tagData: TagSet[];tagMap: Record<string, string>;
};
export type GalleryListAdapter = {
  Gallery: ReturnType<typeof GalleryAdapter>;
  Category: ReturnType<typeof CategoryAdapter>;
  Tag: ReturnType<typeof TagAdapter>;
};
export const useGalleryListFetchData = (opt: {lang: Lang;kw: string;}): UseFetchDataResult<GalleryListRawData,GalleryListAdapter> =>
{
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) =>{publish({ level: MessageStatus.Error, title: e.messageText });}, [publish]);
    const adapter = useMemo(() =>{return { Gallery: GalleryAdapter(),Category: CategoryAdapter(),Tag: TagAdapter() };}, []);
    // 執行 function：Query param（穩定 reference，避免 deps 無限觸發）
    const baseParam = useGalleryListQueryParam({ lang: opt.lang, kw: opt.kw });
    // 執行 function：主資料（公告 Grid）
    const grid = adapter.Gallery.hooks.useQueryGridData({baseParam,deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],modelDeps: [opt.lang],onError,});
    // 執行 function：關聯資料（Category / Tag）
    const category = adapter.Category.hooks.useMapByProgId({progId: PGID.Gallery,lang: opt.lang,});
    const tag = adapter.Tag.hooks.useMapByProgId({progId: PGID.Gallery,lang: opt.lang,});
    // 宣告變數：loading / errors 統一出口
    const isLoading = Boolean(grid.isLoading || category.isLoading || tag.isLoading);
    const errors = useMemo(() =>
    {
        const list = [...(grid.errors ?? []),category.errorText,tag.errorText,];
        return list.filter((x): x is string => Boolean(x));
    }, [grid.errors, category.errorText, tag.errorText]);
    // 宣告變數：rawData（你要的自定義出口）
    const rawData = useMemo<GalleryListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,count: grid.count ?? 0,list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,totalPages: grid.totalPages ?? 1,onPageChange: grid.onPageChange,
            param: grid.param,categoryData: category.data ?? [],categoryMap: category.map ?? {},
            tagData: tag.data ?? [],tagMap: tag.map ?? {}};
    }, [grid.modelDisplayName,grid.count,grid.list,grid.pageNumber,grid.totalPages,grid.onPageChange,grid.param,category.data,category.map,tag.data,tag.map,]);
    const refetchData = useCallback(async () =>{await grid.refetchData();}, [grid]);
    const refetchRefData = useCallback(async () =>{await Promise.all([category.refetch(), tag.refetch()]);}, [category, tag]);
    return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
//#endregion

//#region Private
const useGalleryListQueryParam = (p: { lang: Lang; kw: string; }): QueryListParam =>
{
    const fields = useMemo<string[]>(() =>
    {
        return [GalleryFields.InternalId,GalleryFields.GalleryId,GalleryFields.Categories,GalleryFields.ModifyUserId,
                GalleryFields.CoverPicSrcId,GalleryFields.ContentStatus,GalleryFields.CreateTime,GalleryFields.ModifyTime,
                `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang}`,
                `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title}`,
                `${GalleryFields.ModifyUser}.${AccountFields.AccountName}`,];
    }, []);
    const condition = useMemo(() =>
    {
        let cdt = `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang} = ${p.lang}`;
        if (!!p.kw) cdt = LibMerge(" And ",false,cdt, `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title} Like ${p.kw}`,);
        return cdt;
    }, [p.lang, p.kw]);
    return useMemo(() =>
    {
        return {
            Fields: fields, Condition: condition,
            RankGroups: [{ Condition: `${GalleryFields.ContentStatus} & 1` }],
            OrderBy: [{ Col: GalleryFields.CreateTime, Desc: true }],
            PageNumber: 1, PageSize: 10,
        };
    }, [fields, condition]);
};
//#endregion