import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter, type TagMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { FileArchiveAdapter } from "@/Features/Hooks/BizFunc/WEB/FileArchive_Api";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import {
    buildClientDataQueryState,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryPaginatorModel,
    type ClientDataQuerySearchBarModel,
    type ClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { Lang } from "@/SysCore/i18n/lang";
import { type ApiAdapterError, type ApiGridInitial, type ApiGridLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi, MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import {
    FileArchiveDetailFields,
    FileArchiveFields,
    FileArchiveInfoFields,
    FileArchiveUrlDetailFields,
    FileManageModelFields,
    PGID,
} from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import type { IFileArchiveOptions } from "./FileArchiveList";

type QueryListParam = components["schemas"]["QueryListParam"];
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];

const SEARCH_TITLE_KEY = "title";
const SEARCH_TAG_KEY = "tag";

export interface FileArchiveTagOption
{
    id: string;
    name: string;
}

export interface FileArchiveListLoaderArgs
{
    lang: Lang;
    pageSize: number;
    pageNumber: number;
    title?: string;
    categoryIds: string;
    tagIds: string;
    condition: string;
    listParam: QueryListParam;
}

export interface FileArchiveListLoaderInitial
{
    grid: ApiGridLoaderData<FileArchiveSet>;
    category: CategoryMapLoaderData;
    tag: TagMapLoaderData;
}

export interface FileArchiveListLoaderData
{
    args: FileArchiveListLoaderArgs;
    initial: FileArchiveListLoaderInitial;
}

export type FileArchiveListRawData = {
    modelDisplayName: ModelDisplaySchema | null;
    count: number;
    list: FileArchiveSet[];
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    param: QueryListParam;
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    tagOptions: FileArchiveTagOption[];
};

export type FileArchiveListAdapter = {
    FileArchive: ReturnType<typeof FileArchiveAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
};

export interface UseFileArchiveListDataResult extends FileArchiveListRawData
{
    paginatorProps: PaginatorProps | null;
    searchBar: ClientDataQuerySearchBarModel | null;
    isLoading: boolean;
    errorList: string[];
    refetchData: () => Promise<void>;
}

type FileArchiveSearchParams = {
    lang: Lang;
    opts: IFileArchiveOptions;
    pageSize: number;
    pageNumber: number;
    title?: string;
    categoryIds: string;
    tagIds: string;
};

type FileArchiveQueryParam = FileArchiveListLoaderArgs;
export type FileArchiveDataQueryTemplate = ClientDataQueryTemplate<FileArchiveSearchParams, FileArchiveListRawData, FileArchiveListRawData, FileArchiveListAdapter, FileArchiveQueryParam, FileArchiveListLoaderData>;
export type FileArchiveListDataQuerySpecSlot = NonNullable<FileArchiveDataQueryTemplate["spec"]>;

/** 正規化 SearchBar 文字條件 */
const normalizeSearchText = (value?: string): string | undefined =>
{
    // 宣告變數
    const text = `${value ?? ""}`.trim();

    // return
    return text ? text : undefined;
};

/** 讀取 SearchValues 的字串值 */
const getSearchStringValue = (values: SearchValues, key: string): string | undefined =>
{
    // 宣告變數
    const value = (values as Record<string, unknown>)[key];

    // return
    return typeof value === "string" ? value : value == null ? undefined : `${value}`;
};

/** 建立 FileArchive 前台搜尋欄位，標籤選單由 tag map 動態提供 */
const buildFileArchiveSearchFields = (tagOptions: FileArchiveTagOption[] = []): SearchFieldConfig[] =>
{
    // 宣告變數
    const options = tagOptions.map(item => ({ value: item.id, title: item.name }));

    // return
    return [
        {
            key: SEARCH_TITLE_KEY,
            title: "標題",
            label: "標題",
            type: "text",
            placeholder: "請輸入標題",
            maxLength: 100,
        },
        {
            key: SEARCH_TAG_KEY,
            title: "標籤",
            label: "標籤",
            type: "select",
            options: [{ value: "", title: "請選擇" }, ...options],
        },
    ] as unknown as SearchFieldConfig[];
};

/** 建立 FileArchive 搜尋初始值 */
const buildFileArchiveSearchValues = (p?: { title?: string; tagIds?: string; }): SearchValues =>
{
    // return
    return { [SEARCH_TITLE_KEY]: normalizeSearchText(p?.title) ?? "", [SEARCH_TAG_KEY]: normalizeSearchText(p?.tagIds) ?? "" } as SearchValues;
};

/** 建立 FileArchive 初始 ViewState */
const buildFileArchiveInitialViewState = (overrides?: Partial<{ pageNumber: number; pageSize: number; }>): IListViewState =>
{
    // 宣告變數
    const pageNumber = overrides?.pageNumber ?? 1;
    const pageSize = overrides?.pageSize ?? 10;

    // return
    return { pageNumber, pageSize } as IListViewState;
};

/** 建立固定條件，包含語系、狀態、分類與標籤 */
const buildFileArchiveBaseCondition = (p: { lang: Lang; categoryIds: string; tagIds: string; }): string =>
{
    // 宣告變數
    let condition = LibMerge(
        " And ",
        false,
        `${FileArchiveFields.ContentStatus} !& 4`,
        `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Lang} = ${p.lang}`,
        `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title} != ''`,
    );

    // 執行 function：套用節點固定篩選條件
    if (p.categoryIds) condition = LibMerge(" And ", false, condition, `${FileArchiveFields.CategoriesId} HasAny [${p.categoryIds}]`);
    if (p.tagIds) condition = LibMerge(" And ", false, condition, `${FileArchiveFields.TagsId} HasAny [${p.tagIds}]`);

    // return
    return condition;
};

/** 建立完整搜尋條件，Title 是唯一 SearchBar 條件 */
const buildFileArchiveCondition = (p: FileArchiveSearchParams): string =>
{
    // 宣告變數
    let condition = buildFileArchiveBaseCondition({ lang: p.lang, categoryIds: p.categoryIds, tagIds: p.tagIds });

    // 執行 function：使用者搜尋條件只查標題
    if (p.title)
    {
        condition = LibMerge(" And ", false, condition, `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title} Like ${p.title}`);
    }

    // return
    return condition;
};

/** 建立 FileArchive QueryListParam */
const buildFileArchiveQuery = (p: { condition: string; pageNumber: number; pageSize: number; }): QueryListParam =>
{
    // return
    return {
        Fields: [
            FileArchiveFields.InternalId,
            FileArchiveFields.FileArchiveId,
            FileArchiveFields.CategoriesId,
            FileArchiveFields.TagsId,
            FileArchiveFields.ContentStatus,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.FileArchiveId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.RowId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Lang}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileArchiveId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.ParentRowId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileSrcId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileName}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileSrc}.${FileManageModelFields.InternalId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileSrc}.${FileManageModelFields.FileExtension}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileSrc}.${FileManageModelFields.PublicDownloadCount}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.FileArchiveId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.ParentRowId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.Url}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.UrlDescription}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.WindowTarget}`,
        ],
        Condition: p.condition,
        RankGroups: [{ Condition: `${FileArchiveFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: FileArchiveFields.CreateTime, Desc: true }],
        PageNumber: p.pageNumber,
        PageSize: p.pageSize,
    };
};

/** 建立 FileArchive 查詢參數 */
const buildFileArchiveSearchParams = (
    p: {
        lang: Lang;
        opts: IFileArchiveOptions;
        overrides?: Partial<{ title: string; categoryIds: string; tagIds: string; }>;
        values: SearchValues;
        viewState: IListViewState;
    },
): FileArchiveSearchParams =>
{
    // 宣告變數
    const title = normalizeSearchText(getSearchStringValue(p.values, SEARCH_TITLE_KEY) ?? p.overrides?.title);
    const categoryIds = p.overrides?.categoryIds ?? (p.opts.Category ?? "");
    const searchTagIds = normalizeSearchText(getSearchStringValue(p.values, SEARCH_TAG_KEY));
    const tagIds = searchTagIds ?? p.overrides?.tagIds ?? (p.opts.Tag ?? "");

    // return
    return { lang: p.lang, opts: p.opts, pageNumber: p.viewState.pageNumber, pageSize: p.viewState.pageSize, title, categoryIds, tagIds };
};

/** 建立 FileArchive QueryParam，Loader / Hook 都統一走這裡 */
const buildFileArchiveQueryArgs = (p: FileArchiveSearchParams & { condition: string; }): FileArchiveQueryParam =>
{
    // 宣告變數
    const listParam = buildFileArchiveQuery({ condition: p.condition, pageNumber: p.pageNumber, pageSize: p.pageSize });

    // return
    return { lang: p.lang, pageSize: p.pageSize, pageNumber: p.pageNumber, title: p.title, categoryIds: p.categoryIds, tagIds: p.tagIds, condition: p.condition, listParam };
};

/** 預設：Feature 不追加 Spec 查詢流程 */
export const extendFileArchiveListDataQuerySpec: FileArchiveListDataQuerySpecSlot = {};

let _resolvedFileArchiveListDataQuerySpec: FileArchiveListDataQuerySpecSlot | null = null;

/** 延後解析 spec data query slot，避免 SSR import 期循環引用 */
const getResolvedFileArchiveListDataQuerySpec = (): FileArchiveListDataQuerySpecSlot =>
{
    // return：已解析過就直接重用
    if (_resolvedFileArchiveListDataQuerySpec) return _resolvedFileArchiveListDataQuerySpec;

    // 執行 function：第一次真的用到時才去 resolve
    _resolvedFileArchiveListDataQuerySpec = resolveSpecFunc<FileArchiveListDataQuerySpecSlot>(
        getClientSlotPath("FileArchiveListLoader"),
        extendFileArchiveListDataQuerySpec,
        ["extendFileArchiveListDataQuerySpec"],
    );

    // return
    return _resolvedFileArchiveListDataQuerySpec;
};

/** 建立 FileArchive DataQueryTemplate */
const createFileArchiveDataQueryTemplate = (
    p: {
        lang: Lang;
        opts: IFileArchiveOptions;
        overrides?: Partial<{ pageNumber: number; pageSize: number; title: string; categoryIds: string; tagIds: string; }>;
    },
): FileArchiveDataQueryTemplate =>
{
    // 宣告變數
    const initialViewState = buildFileArchiveInitialViewState(p.overrides);
    const initialSearchValues = buildFileArchiveSearchValues({ title: p.overrides?.title, tagIds: p.overrides?.tagIds });

    // return
    return {
        featureKey: "FileArchiveList",
        dataMode: "multiple",
        initialSearchValues,
        initialViewState,
        pagination: { defaultPageNumber: initialViewState.pageNumber, defaultPageSize: initialViewState.pageSize, resetPageOnSearch: true },
        searchBar: { title: "搜尋條件", actionAlign: "left", columnCount: 3 },
        spec: getResolvedFileArchiveListDataQuerySpec(),
        feature: {
            buildSearchFields: (ctx) => buildFileArchiveSearchFields(ctx.rawData.tagOptions),
            toSearchParams: (values, viewState) => buildFileArchiveSearchParams({ ...p, values, viewState }),
            buildSearchConditions: (ctx) => [buildFileArchiveCondition(ctx.searchParams)],
            buildQueryParam: (ctx) => buildFileArchiveQueryArgs({ ...ctx.searchParams, condition: ctx.searchCondition }),
            useDataSource: (ctx) => useFileArchiveDataSource({ queryParam: ctx.queryParam, loaderData: ctx.loaderData }),
            buildViewModel: (ctx) => ctx.rawData,
        },
    };
};

/** 組 loader / hook 共用參數 */
const buildLoaderArgs = (
    p: {
        lang: Lang;
        opts: IFileArchiveOptions;
        overrides?: Partial<{ pageNumber: number; pageSize: number; title: string; categoryIds: string; tagIds: string; }>;
    },
): FileArchiveQueryParam =>
{
    // 宣告變數
    const template = createFileArchiveDataQueryTemplate(p);
    const viewState = buildFileArchiveInitialViewState(p.overrides);
    const searchValues = buildFileArchiveSearchValues({ title: p.overrides?.title, tagIds: p.overrides?.tagIds });

    // return
    return buildClientDataQueryState(template, searchValues, viewState).queryParam;
};

/** 將 tag data 轉成舊版 SearchBar 可直接使用的選單 */
const buildTagOptions = (tagMap: Record<string, string>): FileArchiveTagOption[] =>
{
    // return
    return Object.entries(tagMap ?? {}).map(([id, name]) => ({ id, name: name ?? "" })).filter(item => Boolean(item.id) && Boolean(item.name));
};

/** SSR loader：主清單走 QueryList，分類/標籤保留 map loader 供顯示與 Spec 擴充使用 */
export const FileArchiveList_Loader = (p: { lang: Lang; opts: IFileArchiveOptions; }) => async (args: LoaderFunctionArgs): Promise<FileArchiveListLoaderData> =>
{
    // 宣告變數
    const ssrApi = getSsrApi(args.request);
    const fileArchive = FileArchiveAdapter(ssrApi);
    const category = CategoryAdapter(ssrApi);
    const tag = TagAdapter(ssrApi);
    const queryParam = buildLoaderArgs({ lang: p.lang, opts: p.opts });

    // 執行 function：SSR 首屏資料
    const gridLoader = fileArchive.loader.createQueryGridDataLoader({ getCondition: () => queryParam.listParam, getApiInstance: () => ssrApi });
    const categoryLoader = category.loader.createMapByProgIdLoader({ progId: PGID.FileArchive, lang: p.lang, getApiInstance: () => ssrApi });
    const tagLoader = tag.loader.createMapByProgIdLoader({ progId: PGID.FileArchive, lang: p.lang, getApiInstance: () => ssrApi });
    const [grid, categoryData, tagData] = await Promise.all([gridLoader(args), categoryLoader(args), tagLoader(args)]);

    // return
    return { args: queryParam, initial: { grid, category: categoryData, tag: tagData } };
};

/** 取得 SSR initial grid，條件一致才沿用 count/list */
const buildGridInitial = (p: { queryParam: FileArchiveQueryParam; loaderData: FileArchiveListLoaderData | null; }): ApiGridInitial<FileArchiveSet> | undefined =>
{
    // 宣告變數
    const initial = p.loaderData?.initial?.grid;
    const matched = isSameClientDataQueryParam(p.loaderData?.args?.listParam, p.queryParam.listParam);
    if (!initial) return undefined;

    // return
    return { model: initial.model ?? null, count: matched ? (initial.count ?? null) : null, list: matched ? (initial.list ?? null) : null };
};

/** 建立資料重置 key，搜尋條件或每頁筆數改變時回到第一頁 */
const buildResetKey = (args: Pick<FileArchiveQueryParam, "lang" | "pageSize" | "title" | "categoryIds" | "tagIds">): string =>
{
    // return
    return JSON.stringify({ lang: args.lang, pageSize: args.pageSize, title: args.title ?? "", categoryIds: args.categoryIds, tagIds: args.tagIds });
};

/** FileArchive DataSource：統一處理 CSR 查詢與 SSR initial 沿用 */
const useFileArchiveDataSource = (
    p: { queryParam: FileArchiveQueryParam; loaderData: FileArchiveListLoaderData | null; },
): ClientDataQueryDataSourceResult<FileArchiveListRawData, FileArchiveListAdapter> =>
{
    // 宣告變數
    const { publish } = useToast();
    const adapter = useMemo(() => ({ FileArchive: FileArchiveAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() }), []);
    const currentArgs = p.queryParam;
    const gridInitial = useMemo(() => buildGridInitial(p), [p]);

    const onError = useCallback((e: ApiAdapterError) =>
    {
        // 執行 function：統一錯誤出口
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const grid = adapter.FileArchive.hooks.useQueryGridData({
        baseParam: currentArgs.listParam,
        deps: [currentArgs.condition, currentArgs.pageSize],
        modelDeps: [currentArgs.lang],
        initial: gridInitial,
        onError,
    });

    const categoryInitial = useMemo(() =>
    {
        // return：語系一致才沿用 SSR initial
        if (p.loaderData?.args?.lang !== currentArgs.lang) return null;
        return p.loaderData?.initial?.category ?? null;
    }, [p.loaderData, currentArgs.lang]);

    const tagInitial = useMemo(() =>
    {
        // return：語系一致才沿用 SSR initial
        if (p.loaderData?.args?.lang !== currentArgs.lang) return null;
        return p.loaderData?.initial?.tag ?? null;
    }, [p.loaderData, currentArgs.lang]);

    const category = adapter.Category.hooks.useMapByProgId({ progId: PGID.FileArchive, lang: currentArgs.lang, deps: [currentArgs.lang], initial: categoryInitial });
    const tag = adapter.Tag.hooks.useMapByProgId({ progId: PGID.FileArchive, lang: currentArgs.lang, deps: [currentArgs.lang], initial: tagInitial });
    const resetKey = useMemo(() => buildResetKey(currentArgs), [currentArgs]);
    const prevResetKeyRef = useRef<string>(resetKey);

    useEffect(() =>
    {
        // 執行 function：搜尋條件變更後清單回第一頁
        if (prevResetKeyRef.current === resetKey) return;
        prevResetKeyRef.current = resetKey;
        grid.onPageChange(1);
    }, [resetKey, grid.onPageChange]);

    const paginator = useMemo<ClientDataQueryPaginatorModel>(() =>
    {
        // return
        return { currentPage: grid.pageNumber ?? 1, pageSize: currentArgs.pageSize, totalPages: grid.totalPages ?? 1, totalCount: grid.count ?? 0, onPageChange: grid.onPageChange };
    }, [grid.pageNumber, grid.totalPages, grid.count, grid.onPageChange, currentArgs.pageSize]);

    const rawData = useMemo<FileArchiveListRawData>(() =>
    {
        // return
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count ?? 0,
            list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            param: grid.param ?? currentArgs.listParam,
            categoryMap: category.map ?? {},
            tagMap: tag.map ?? {},
            tagOptions: buildTagOptions(tag.map ?? {}),
        };
    }, [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param, currentArgs.listParam, category.map, tag.map]);

    const errors = useMemo(() =>
    {
        // return
        return [...(grid.errors ?? []), category.errorText, tag.errorText].filter((item): item is string => Boolean(item));
    }, [grid.errors, category.errorText, tag.errorText]);

    const refetchData = useCallback(async () =>
    {
        // 執行 function：只重抓主清單資料
        await grid.refetchData();
    }, [grid]);

    const refetchRefData = useCallback(async () =>
    {
        // 執行 function：重抓分類 / 標籤參考資料
        await Promise.all([category.refetch(), tag.refetch()]);
    }, [category, tag]);

    // return
    return { adapter, rawData, isLoading: Boolean(grid.isLoading || category.isLoading || tag.isLoading), errors, paginator, refetchData, refetchRefData };
};

/** CSR Hook：Feature 版 FileArchiveList 走 Client_DataQueryTemplate */
export const useFileArchiveListData = (p: { lang: Lang; opts: IFileArchiveOptions; title?: string; }): UseFileArchiveListDataResult =>
{
    // 宣告變數
    const initial = useLoaderData() as FileArchiveListLoaderData;

    const template = useMemo(() =>
    {
        // return
        return createFileArchiveDataQueryTemplate({
            lang: p.lang,
            opts: p.opts,
            overrides: {
                pageNumber: initial.args.pageNumber,
                pageSize: initial.args.pageSize,
                title: p.title,
                categoryIds: initial.args.categoryIds,
                tagIds: initial.args.tagIds,
            },
        });
    }, [p.lang, p.opts, p.title, initial.args.pageNumber, initial.args.pageSize, initial.args.categoryIds, initial.args.tagIds]);

    const templateVm = useClientDataQueryTemplate(template);

    // return
    return { ...templateVm.viewModel, paginatorProps: templateVm.paginatorProps, searchBar: templateVm.searchBar, isLoading: templateVm.isLoading, errorList: templateVm.errorList, refetchData: templateVm.refetchData };
};
