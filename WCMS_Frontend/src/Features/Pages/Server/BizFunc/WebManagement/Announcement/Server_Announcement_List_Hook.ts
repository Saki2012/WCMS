import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Announcement_Api";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tag_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { components } from "@/types/api";
import {AccountFields,AnnouncementDetailFields,AnnouncementFields,PGID,} from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
type QueryListParam = components["schemas"]["QueryListParam"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];

//#region Public
export type AnnouncementListRawData = {
    modelDisplayName: ModelDisplaySchema|null;count: number;list: AnnouncementSet[];
    pageNumber: number;totalPages: number;onPageChange: (page: number) => void;
    param: QueryListParam;categoryData: CategorySet[];categoryMap: Record<string, string>;
    tagData: TagSet[];tagMap: Record<string, string>;
};
export type AnnouncementListAdapter = {
  Announcement: ReturnType<typeof AnnouncementAdapter>;
  Category: ReturnType<typeof CategoryAdapter>;
  Tag: ReturnType<typeof TagAdapter>;
};
/** ✅ 主入口：Server Announcement List 的所有 fetch 都集中在這裡 */
export const useAnnouncementListFetchData = (opt: {lang: Lang;kw: string;}): UseFetchDataResult<AnnouncementListRawData,AnnouncementListAdapter> =>
{
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) =>{publish({ level: MessageStatus.Error, title: e.messageText });}, [publish]);
    const adapter = useMemo(() =>{return {Announcement: AnnouncementAdapter(),Category: CategoryAdapter(),Tag: TagAdapter(),};}, []);
    // 執行 function：Query param（穩定 reference，避免 deps 無限觸發）
    const baseParam = useAnnouncementListQueryParam({ lang: opt.lang, kw: opt.kw });
    // 執行 function：主資料（公告 Grid）
    const grid = adapter.Announcement.hooks.useQueryGridData({baseParam,deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],modelDeps: [opt.lang],onError,});
    // 執行 function：關聯資料（Category / Tag）
    const category = adapter.Category.hooks.useMapByProgId({progId: PGID.Announcement,lang: opt.lang,});
    const tag = adapter.Tag.hooks.useMapByProgId({progId: PGID.Announcement,lang: opt.lang,});
    // 宣告變數：loading / errors 統一出口
    const isLoading = Boolean(grid.isLoading || category.isLoading || tag.isLoading);
    const errors = useMemo(() =>
    {
        const list = [...(grid.errors ?? []),category.errorText,tag.errorText,];
        return list.filter((x): x is string => Boolean(x));
    }, [grid.errors, category.errorText, tag.errorText]);
    // 宣告變數：rawData（你要的自定義出口）
    const rawData = useMemo<AnnouncementListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,count: grid.count ?? 0,list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,totalPages: grid.totalPages ?? 1,onPageChange: grid.onPageChange,
            param: grid.param,categoryData: category.data ?? [],categoryMap: category.map ?? {},
            tagData: tag.data ?? [],tagMap: tag.map ?? {},
        };
    }, [grid.modelDisplayName,grid.count,grid.list,grid.pageNumber,grid.totalPages,grid.onPageChange,grid.param,category.data,category.map,tag.data,tag.map,]);
    const refetchData = useCallback(async () =>{await grid.refetchData();}, [grid]);
    const refetchRefData = useCallback(async () =>{await Promise.all([category.refetch(), tag.refetch()]);}, [category, tag]);
    return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
//#endregion

//#region Private
const useAnnouncementListQueryParam = (p: { lang: Lang; kw: string; }): QueryListParam =>
{
    const fields = useMemo<string[]>(() =>
    {
        return [AnnouncementFields.AnnouncementId,AnnouncementFields.Categories,AnnouncementFields.Tags,
            AnnouncementFields.ContentStatus,AnnouncementFields.Validate_Start,AnnouncementFields.Validate_End,AnnouncementFields.ModifyUserId,
            AnnouncementFields.CreateTime,AnnouncementFields.ModifyTime,AnnouncementFields.InternalId,
            `${AnnouncementFields.ModifyUser}.${AccountFields.AccountName}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,];
    }, []);
    const condition = useMemo(() =>
    {
        let cdt = `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang} = ${p.lang}`;
        if (p.kw) cdt = LibMerge(" And ",false,cdt,`${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} Like ${p.kw}`,);
        return cdt;
    }, [p.lang, p.kw]);
    return useMemo(() =>
    {
        return {
            Fields: fields, Condition: condition,
            RankGroups: [{ Condition: `${AnnouncementFields.ContentStatus} & 1` }],
            OrderBy: [{ Col: AnnouncementFields.CreateTime, Desc: true }],
            PageNumber: 1, PageSize: 10,
        };
    }, [fields, condition]);
};
//#endregion