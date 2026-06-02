import { useCallback, useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter, type TagMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";
import {
    buildClientDataQueryKey,
    buildClientDataQueryState,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryTemplate,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { AnnouncementDetailFields, AnnouncementDetailFileFields, AnnouncementFields, PGID } from "@/types/SchemaFields";

type QueryListParam = components["schemas"]["QueryListParam"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

// #region Public Types
export interface AnnouncementFormLoaderArgs
{
    internalId: string;
    progId: PGID;
    lang: Lang;
    queryParam: QueryListParam;
}

export interface AnnouncementFormLoaderRes
{
    listRes: AnnouncementSet[];
    dataRes: AnnouncementSet | null;
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
}

export interface AnnouncementFormLoaderData
{
    args: AnnouncementFormLoaderArgs;
    res: AnnouncementFormLoaderRes;
}

export type AnnouncementFormRawData = {
    formData: AnnouncementSet;
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    categoryNameText: string;
    tagNameText: string;
    args: AnnouncementFormLoaderArgs;
};

export type AnnouncementFormAdapter = {
    Announcement: ReturnType<typeof AnnouncementAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
};

export interface UseAnnouncementFormDataResult extends AnnouncementFormRawData
{
    isLoading: boolean;
    errorList: string[];
    refetchData: () => Promise<void>;
    refetchRefData: () => Promise<void>;
}
// #endregion

type AnnouncementFormSearchParams = { internalId: string; progId: PGID; lang: Lang; };

type AnnouncementFormDataQueryTemplate = ClientDataQueryTemplate<
    AnnouncementFormSearchParams,
    AnnouncementFormRawData,
    AnnouncementFormRawData,
    AnnouncementFormAdapter,
    QueryListParam,
    AnnouncementFormLoaderData
>;

// #region Shared Builder
/** 統一整理安全 internalId */
const getSafeInternalId = (value?: string): string =>
{
    // return
    return `${value ?? ""}`.trim();
};

/** 轉義 QueryList 條件中的雙引號 */
const escapeQueryValue = (value: string): string =>
{
    // return
    return value.replace(/"/g, `""`);
};

/** 共用：依目前 feature 組出 loader / hook 共用參數 */
export const buildAnnouncementFormLoaderArgs = (p: { lang: Lang; internalId: string; queryParam?: QueryListParam; }): AnnouncementFormLoaderArgs =>
{
    // 宣告變數
    const safeInternalId = getSafeInternalId(p.internalId);
    const queryParam = p.queryParam ?? buildAnnouncementFormQueryParam({ internalId: safeInternalId });

    // return
    return { internalId: safeInternalId, progId: PGID.Announcement, lang: p.lang, queryParam };
};

/** 組出給 hydration 用的 initial 格式 */
const buildLoaderInitial = <TArgs, TData>(args: TArgs, data: TData): ApiLoaderData<TArgs, TData> =>
{
    // 宣告變數
    const apiRes: ApiResponse<TData> = { IsSuccess: true, Data: data, SysMessage: [] };

    // return
    return { args, apiRes };
};

/** 比對目前參數與 loader 參數是否一致 */
const matchInitialArgs = <TArgs, TData>(currentArgs: TArgs, initialArgs: TArgs, initialData: TData): ApiLoaderData<TArgs, TData> | null =>
{
    // 宣告變數
    const currentKey = JSON.stringify(currentArgs ?? null);
    const initialKey = JSON.stringify(initialArgs ?? null);

    // return
    if (currentKey !== initialKey) return null;
    return buildLoaderInitial(initialArgs, initialData);
};

/** 建立主資料 list initial，避免 hydration 首次重抓 */
const buildListInitial = (
    p: { loaderData: AnnouncementFormLoaderData | null; queryParam: QueryListParam; fallbackData: AnnouncementSet; },
): ApiLoaderData<QueryListParam, AnnouncementSet[]> | null =>
{
    // 宣告變數
    const loaderParam = p.loaderData?.args?.queryParam;
    if (!loaderParam) return null;
    if (!isSameClientDataQueryParam(p.queryParam, loaderParam)) return null;

    // return
    return buildLoaderInitial(loaderParam, p.loaderData?.res.listRes ?? [p.fallbackData]);
};

/** 建立 Category map initial，避免 hydration 首次重抓 */
const buildCategoryInitial = (p: { loaderData: AnnouncementFormLoaderData | null; args: AnnouncementFormLoaderArgs; }): CategoryMapLoaderData | null =>
{
    // 執行 function
    if (!p.loaderData) return null;

    // return
    return matchInitialArgs(
        { progId: p.args.progId, lang: p.args.lang },
        { progId: p.loaderData.args.progId, lang: p.loaderData.args.lang },
        p.loaderData.res.categoryMap ?? {},
    );
};

/** 建立 Tag map initial，避免 hydration 首次重抓 */
const buildTagInitial = (p: { loaderData: AnnouncementFormLoaderData | null; args: AnnouncementFormLoaderArgs; }): TagMapLoaderData | null =>
{
    // 執行 function
    if (!p.loaderData) return null;

    // return
    return matchInitialArgs(
        { progId: p.args.progId, lang: p.args.lang },
        { progId: p.loaderData.args.progId, lang: p.loaderData.args.lang },
        p.loaderData.res.tagMap ?? {},
    );
};

/** 將逗號字串依 map 轉成顯示文字 */
export const buildNameTextByMap = (csv: string | null | undefined, map: Record<string, string>): string =>
{
    // 宣告變數
    const raw = `${csv ?? ""}`.trim();
    if (!raw) return "";

    // return
    return raw.split(",").map(p => p.trim()).filter(Boolean).map(id => map[id] ?? "").filter(Boolean).join("、");
};

/** 建立 Announcement Form 查詢條件 */
const buildAnnouncementFormCondition = (internalId: string): string =>
{
    // 宣告變數
    const safeInternalId = escapeQueryValue(getSafeInternalId(internalId));
    if (!safeInternalId) return "1=0";

    // return
    return LibMerge(" And ", false, `${AnnouncementFields.InternalId} = "${safeInternalId}"`);
};

/** 建立 Announcement Form QueryListParam，Form 固定只查單筆 */
const buildAnnouncementFormQueryParam = (p: { internalId: string; }): QueryListParam =>
{
    // 宣告變數
    const condition = buildAnnouncementFormCondition(p.internalId);
    const detailFilePrefix = `${AnnouncementFields._AnnouncementDetail}._AnnouncementDetailFile`;

    // return
    return {
        Fields: [
            AnnouncementFields.InternalId,
            AnnouncementFields.AnnouncementId,
            AnnouncementFields.Categories,
            AnnouncementFields.Tags,
            AnnouncementFields.Validate_Start,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.AnnouncementId}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.RowId}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.SubTitle}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Content}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Url}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.UrlDescription}`,
            `${detailFilePrefix}.${AnnouncementDetailFileFields.AnnouncementId}`,
            `${detailFilePrefix}.${AnnouncementDetailFileFields.ParentRowId}`,
            `${detailFilePrefix}.${AnnouncementDetailFileFields.RowId}`,
            `${detailFilePrefix}.${AnnouncementDetailFileFields.FileId}`,
            `${detailFilePrefix}.${AnnouncementDetailFileFields.FileName}`,
        ],
        Condition: condition,
        PageNumber: 1,
        PageSize: 1,
    };
};

/** 建立 Announcement Form 初始 ViewState */
const buildAnnouncementFormInitialViewState = (): IListViewState =>
{
    // return
    return { pageNumber: 1, pageSize: 1 } as IListViewState;
};

/** 建立 Announcement Form Template 查詢參數 */
const buildAnnouncementFormSearchParams = (p: { lang: Lang; internalId: string; }): AnnouncementFormSearchParams =>
{
    // return
    return { internalId: getSafeInternalId(p.internalId), progId: PGID.Announcement, lang: p.lang };
};

/** 建立 Announcement Form DataQueryTemplate */
const createAnnouncementFormDataQueryTemplate = (p: { lang: Lang; internalId: string; emptyData: AnnouncementSet; }): AnnouncementFormDataQueryTemplate =>
{
    // 宣告變數
    const initialViewState = buildAnnouncementFormInitialViewState();

    // return
    return {
        featureKey: "AnnouncementForm",
        dataMode: "single",
        initialSearchValues: {},
        initialViewState,
        pagination: null,
        searchBar: null,
        feature: {
            toSearchParams: () => buildAnnouncementFormSearchParams({ lang: p.lang, internalId: p.internalId }),
            buildSearchConditions: (ctx) => [buildAnnouncementFormCondition(ctx.searchParams.internalId)],
            buildQueryParam: (ctx) => buildAnnouncementFormQueryParam({ internalId: ctx.searchParams.internalId }),
            useDataSource: (ctx) =>
                useAnnouncementFormDataSource({
                    queryParam: ctx.queryParam,
                    loaderData: ctx.loaderData,
                    lang: p.lang,
                    internalId: ctx.searchParams.internalId,
                    emptyData: p.emptyData,
                }),
            buildViewModel: (ctx) => ctx.rawData,
        },
    };
};

/** 建立 Loader 與 Hook 共用的 Query 狀態 */
const buildAnnouncementFormQueryState = (p: { lang: Lang; internalId: string; emptyData: AnnouncementSet; }) =>
{
    // 宣告變數
    const template = createAnnouncementFormDataQueryTemplate(p);

    // return
    return buildClientDataQueryState(template, {} as SearchValues, buildAnnouncementFormInitialViewState());
};
// #endregion

// #region SSR Loader
/** SSR Loader：改以 QueryList 預載 Announcement Form 單筆資料 */
export const AnnouncementFormLoader = (p: { lang: Lang; }) => async ({ request, params }: LoaderFunctionArgs): Promise<AnnouncementFormLoaderData> =>
{
    // 宣告變數
    const internalId = getSafeInternalId(params?.internalId);
    const ssrApi = getSsrApi(request);
    const adapter = { Announcement: AnnouncementAdapter(ssrApi), Category: CategoryAdapter(ssrApi), Tag: TagAdapter(ssrApi) };
    const emptyData: AnnouncementSet = { Announcement: {}, AnnouncementDetail: [], AnnouncementDetailFile: [] };
    const queryState = buildAnnouncementFormQueryState({ lang: p.lang, internalId, emptyData });
    const args = buildAnnouncementFormLoaderArgs({ lang: p.lang, internalId, queryParam: queryState.queryParam });

    // 執行 function
    if (!internalId)
    {
        return { args, res: { listRes: [], dataRes: null, categoryMap: {}, tagMap: {} } };
    }

    const listLoader = adapter.Announcement.loader.createQueryListLoader({ getCondition: () => args.queryParam, getApiInstance: () => ssrApi });
    const cateLoader = adapter.Category.loader.createMapByProgIdLoader({ progId: args.progId, lang: args.lang, getApiInstance: () => ssrApi });
    const tagLoader = adapter.Tag.loader.createMapByProgIdLoader({ progId: args.progId, lang: args.lang, getApiInstance: () => ssrApi });

    const [listLD, cateLD, tagLD] = await Promise.all([
        listLoader({ request, params } as LoaderFunctionArgs),
        cateLoader({ request, params } as LoaderFunctionArgs),
        tagLoader({ request, params } as LoaderFunctionArgs),
    ]);

    const listRes = listLD.apiRes.Data ?? [];

    // return
    return { args, res: { listRes, dataRes: listRes[0] ?? null, categoryMap: cateLD.apiRes.Data ?? {}, tagMap: tagLD.apiRes.Data ?? {} } };
};
// #endregion

// #region CSR Hook
/** Announcement Form DataSource：統一處理 QueryList 單筆資料、分類與標籤 map */
const useAnnouncementFormDataSource = (
    p: { queryParam: QueryListParam; loaderData: AnnouncementFormLoaderData | null; lang: Lang; internalId: string; emptyData: AnnouncementSet; },
): ClientDataQueryDataSourceResult<AnnouncementFormRawData, AnnouncementFormAdapter> =>
{
    // 宣告變數
    const adapter = useMemo<AnnouncementFormAdapter>(() =>
    {
        return { Announcement: AnnouncementAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() };
    }, []);

    const currentArgs = useMemo(() =>
    {
        return buildAnnouncementFormLoaderArgs({ lang: p.lang, internalId: p.internalId, queryParam: p.queryParam });
    }, [p.lang, p.internalId, p.queryParam]);

    const listInitial = useMemo(() =>
    {
        return buildListInitial({ loaderData: p.loaderData, queryParam: p.queryParam, fallbackData: p.emptyData });
    }, [p.loaderData, p.queryParam, p.emptyData]);

    const cateInitial = useMemo(() =>
    {
        return buildCategoryInitial({ loaderData: p.loaderData, args: currentArgs });
    }, [p.loaderData, currentArgs]);

    const tagInitial = useMemo(() =>
    {
        return buildTagInitial({ loaderData: p.loaderData, args: currentArgs });
    }, [p.loaderData, currentArgs]);

    const queryKey = useMemo(() => buildClientDataQueryKey(p.queryParam), [p.queryParam]);

    /** 主資料：前台 Form 統一改用 QueryList 查單筆 */
    const useData = adapter.Announcement.hooks.useQueryList({ condition: p.queryParam, initial: listInitial, deps: [queryKey] });

    /** 分類 map */
    const useCategory = adapter.Category.hooks.useMapByProgId({
        progId: currentArgs.progId,
        lang: currentArgs.lang,
        initial: cateInitial,
        deps: [currentArgs.progId, currentArgs.lang],
    });

    /** 標籤 map */
    const useTag = adapter.Tag.hooks.useMapByProgId({
        progId: currentArgs.progId,
        lang: currentArgs.lang,
        initial: tagInitial,
        deps: [currentArgs.progId, currentArgs.lang],
    });

    const formData = useMemo<AnnouncementSet>(() =>
    {
        return useData.data?.[0] ?? p.emptyData;
    }, [useData.data, p.emptyData]);

    const categoryNameText = useMemo(() =>
    {
        return buildNameTextByMap(formData.Announcement?.Categories, useCategory.map ?? {});
    }, [formData.Announcement?.Categories, useCategory.map]);

    const tagNameText = useMemo(() =>
    {
        return buildNameTextByMap(formData.Announcement?.Tags, useTag.map ?? {});
    }, [formData.Announcement?.Tags, useTag.map]);

    const errors = useMemo(() =>
    {
        return [useData.errorText, useCategory.errorText, useTag.errorText];
    }, [useData.errorText, useCategory.errorText, useTag.errorText]);

    const rawData = useMemo<AnnouncementFormRawData>(() =>
    {
        return { formData, categoryMap: useCategory.map ?? {}, tagMap: useTag.map ?? {}, categoryNameText, tagNameText, args: currentArgs };
    }, [formData, useCategory.map, useTag.map, categoryNameText, tagNameText, currentArgs]);

    const refetchData = useCallback(async () =>
    {
        await Promise.resolve(useData.refetch());
    }, [useData]);

    const refetchRefData = useCallback(async () =>
    {
        await Promise.all([Promise.resolve(useCategory.refetch()), Promise.resolve(useTag.refetch())]);
    }, [useCategory, useTag]);

    // return
    return {
        adapter,
        rawData,
        isLoading: Boolean(useData.isLoading || useCategory.isLoading || useTag.isLoading),
        errors,
        paginator: null,
        refetchData,
        refetchRefData,
    };
};

/** 內部共用：建立 Announcement Form Template VM */
const useAnnouncementFormTemplate = (opt: { lang: Lang; internalId: string; emptyData: AnnouncementSet; }) =>
{
    // 宣告變數
    const template = useMemo(() =>
    {
        return createAnnouncementFormDataQueryTemplate({ lang: opt.lang, internalId: opt.internalId, emptyData: opt.emptyData });
    }, [opt.lang, opt.internalId, opt.emptyData]);

    // return
    return useClientDataQueryTemplate(template);
};

/** CSR Hook：新版 Form 入口，資料查詢流程交給 Client_DataQueryTemplate */
export const useAnnouncementFormData = (opt: { lang: Lang; internalId: string; emptyData: AnnouncementSet; }): UseAnnouncementFormDataResult =>
{
    // 宣告變數
    const templateVm = useAnnouncementFormTemplate(opt);

    // return
    return {
        ...templateVm.viewModel,
        isLoading: templateVm.isLoading,
        errorList: templateVm.errorList,
        refetchData: templateVm.refetchData,
        refetchRefData: templateVm.refetchRefData,
    };
};

/** CSR Hook：保留舊入口相容尚未調整的客製覆寫 */
export const useAnnouncementFormFetchData = (
    opt: { lang: Lang; internalId: string; emptyData: AnnouncementSet; },
): UseFetchDataResult<AnnouncementFormRawData, AnnouncementFormAdapter> =>
{
    // 宣告變數
    const templateVm = useAnnouncementFormTemplate(opt);

    // return
    return {
        adapter: templateVm.adapter!,
        rawData: templateVm.rawData,
        isLoading: templateVm.isLoading,
        errors: templateVm.errorList,
        refetchData: templateVm.refetchData,
        refetchRefData: templateVm.refetchRefData,
    };
};
// #endregion
