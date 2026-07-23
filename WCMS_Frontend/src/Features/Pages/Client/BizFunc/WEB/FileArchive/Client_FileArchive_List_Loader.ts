import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter, type TagMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { FileArchiveAdapter } from "@/Features/Hooks/BizFunc/WEB/FileArchive_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import {
    buildClientDataQueryState,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryMemoryState,
    type ClientDataQueryPaginatorModel,
    type ClientDataQuerySearchBarModel,
    type ClientDataQueryTemplate,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import { getClientSearchBarText } from "@/Features/Pages/Client/Scaffold/SubPages/Module/SearchBar/Client_SearchBar_I18n";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import { type ApiAdapterError, type ApiGridInitial, type ApiGridLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi, MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import { resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";
import { usePageStateMemory } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Hook";
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
import { useCallback, useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import type { IFileArchiveOptions } from "./Client_FileArchive_List_Comp";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
const SEARCH_TITLE_KEY = "title";
const SEARCH_TAG_KEY = "tag";
interface FileArchiveTagOption
{
    id: string;
    name: string;
}
interface FileArchiveListLoaderArgs
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
interface FileArchiveListLoaderInitial
{
    grid: ApiGridLoaderData<FileArchiveSet>;
    category: CategoryMapLoaderData;
    tag: TagMapLoaderData;
}
interface FileArchiveListLoaderData
{
    args: FileArchiveListLoaderArgs;
    initial: FileArchiveListLoaderInitial;
}
type FileArchiveListRawData = {
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
type FileArchiveListAdapter = { FileArchive: ReturnType<typeof FileArchiveAdapter>; Category: ReturnType<typeof CategoryAdapter>; Tag: ReturnType<typeof TagAdapter>; };
interface UseFileArchiveListDataResult extends FileArchiveListRawData
{
    paginatorProps: PaginatorProps | null;
    searchBar: ClientDataQuerySearchBarModel | null;
    isLoading: boolean;
    errorList: string[];
    refetchData: () => Promise<void>;
}
type FileArchiveSearchParams = { lang: Lang; opts: IFileArchiveOptions; pageSize: number; pageNumber: number; title?: string; categoryIds: string; tagIds: string; };
type FileArchiveQueryParam = FileArchiveListLoaderArgs;
type FileArchiveDataQueryTemplate = ClientDataQueryTemplate<FileArchiveSearchParams, FileArchiveListRawData, FileArchiveListRawData, FileArchiveListAdapter, FileArchiveQueryParam, FileArchiveListLoaderData, ClientDataQueryMemoryState>;
export type FileArchiveListDataQuerySpecSlot = NonNullable<FileArchiveDataQueryTemplate["spec"]>;
let _resolvedFileArchiveListDataQuerySpec: FileArchiveListDataQuerySpecSlot | null = null;
// #endregion

// #region Public
/** 預設：Feature 不追加 Spec 查詢流程 */
export const extendFileArchiveListDataQuerySpec: FileArchiveListDataQuerySpecSlot = {};
/** SSR loader：主清單走 QueryList，分類/標籤保留 map loader 供顯示與 Spec 擴充使用 */
export const Client_FileArchiveList_Loader = (p: { lang: Lang; opts: IFileArchiveOptions; }) => async (args: LoaderFunctionArgs): Promise<FileArchiveListLoaderData> =>
{
    const ssrApi = getSsrApi(args.request);
    const fileArchive = FileArchiveAdapter(ssrApi);
    const category = CategoryAdapter(ssrApi);
    const tag = TagAdapter(ssrApi);
    const queryParam = buildLoaderArgs({ lang: p.lang, opts: p.opts });
    const gridLoader = fileArchive.loader.createQueryGridDataLoader({ getCondition: () => queryParam.listParam, getApiInstance: () => ssrApi });
    const categoryLoader = category.loader.createMapByProgIdLoader({ progId: PGID.FileArchive, lang: p.lang, getApiInstance: () => ssrApi });
    const tagLoader = tag.loader.createMapByProgIdLoader({ progId: PGID.FileArchive, lang: p.lang, getApiInstance: () => ssrApi });
    const [grid, categoryData, tagData] = await Promise.all([gridLoader(args), categoryLoader(args), tagLoader(args)]);
    return { args: queryParam, initial: { grid, category: categoryData, tag: tagData } };
};
/** CSR Hook：Feature 版 FileArchiveList 走 Client_DataQueryTemplate */
export const useFileArchiveListData = (p: { lang: Lang; opts: IFileArchiveOptions; title?: string; }): UseFileArchiveListDataResult =>
{
    const initial = useLoaderData() as FileArchiveListLoaderData;
    const defaultPageState = useMemo<ClientDataQueryMemoryState>(
        () => ({ searchValues: buildFileArchiveSearchValues({ title: p.title, tagIds: initial.args.tagIds }), viewState: buildFileArchiveInitialViewState({ pageNumber: initial.args.pageNumber, pageSize: initial.args.pageSize }) }),
        [p.lang, initial.args.pageNumber, initial.args.pageSize],
    );
    const pageState = usePageStateMemory<ClientDataQueryMemoryState>({ stateKey: "Client.FileArchiveList", scopeKeys: [p.lang], defaultState: defaultPageState });
    const template = useMemo(() =>
        createFileArchiveDataQueryTemplate({
            pageState,
            lang: p.lang,
            opts: p.opts,
            overrides: { pageNumber: initial.args.pageNumber, pageSize: initial.args.pageSize, title: p.title, categoryIds: initial.args.categoryIds, tagIds: initial.args.tagIds },
        }), [p.lang, p.opts, p.title, initial.args.pageNumber, initial.args.pageSize, initial.args.categoryIds, initial.args.tagIds, pageState]);
    const templateVm = useClientDataQueryTemplate(template);
    return { ...templateVm.viewModel, paginatorProps: templateVm.paginatorProps, searchBar: templateVm.searchBar, isLoading: templateVm.isLoading, errorList: templateVm.errorList, refetchData: templateVm.refetchData };
};
// #endregion

// #region Protected
/** 延後解析 spec data query slot，避免 SSR import 期循環引用 */
const getResolvedFileArchiveListDataQuerySpec = (): FileArchiveListDataQuerySpecSlot =>
{
    if (_resolvedFileArchiveListDataQuerySpec) return _resolvedFileArchiveListDataQuerySpec;
    _resolvedFileArchiveListDataQuerySpec = resolveSpecFunc<FileArchiveListDataQuerySpecSlot>(getClientSlotPath("Slot_FileArchive_List_Loader"), extendFileArchiveListDataQuerySpec, ["extendFileArchiveListDataQuerySpec"]);
    return _resolvedFileArchiveListDataQuerySpec;
};
// #endregion

// #region Private
/** 建立 FileArchive 前台搜尋欄位，標籤選單由 tag map 動態提供 */
const buildFileArchiveSearchFields = (lang: Lang, tagOptions: FileArchiveTagOption[] = []): SearchFieldConfig[] =>
{
    const isEnglish = lang === "en";
    const options = tagOptions.map(item => ({ value: item.id, title: item.name }));
    return [
        { key: SEARCH_TITLE_KEY, title: isEnglish ? "Title" : "標題", type: "text", placeholder: isEnglish ? "Enter a title" : "請輸入標題", maxLength: 100 },
        { key: SEARCH_TAG_KEY, title: isEnglish ? "Tag" : "標籤", type: "select", options },
    ] as SearchFieldConfig[];
};
/** 建立 FileArchive 搜尋初始值 */
const buildFileArchiveSearchValues = (p?: { title?: string; tagIds?: string; }): SearchValues =>
{
    return { [SEARCH_TITLE_KEY]: LibText.safeTrim(p?.title), [SEARCH_TAG_KEY]: LibText.safeTrim(p?.tagIds) } as SearchValues;
};
/** 建立 FileArchive 初始 ViewState */
const buildFileArchiveInitialViewState = (overrides?: Partial<{ pageNumber: number; pageSize: number; }>): IListViewState =>
{
    const pageNumber = overrides?.pageNumber ?? 1;
    const pageSize = overrides?.pageSize ?? 10;
    return { pageNumber, pageSize } as IListViewState;
};
/** 建立固定條件，包含語系、狀態、分類與標籤 */
const buildFileArchiveBaseCondition = (p: { lang: Lang; categoryIds: string; tagIds: string; }): string =>
{
    return LibCondition.joinConditions([
        LibCondition.createCondition(FileArchiveFields.ContentStatus, Operator.BitwiseHasNone, 4),
        LibCondition.createCondition(`${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Lang}`, Operator.Equal, p.lang),
        LibCondition.createCondition(`${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title}`, Operator.NotEqual, "", true),
        p.categoryIds ? LibCondition.createCondition(FileArchiveFields.CategoriesId, Operator.HasAny, p.categoryIds) : null,
        p.tagIds ? LibCondition.createCondition(FileArchiveFields.TagsId, Operator.HasAny, p.tagIds) : null,
    ]);
};
/** 建立完整搜尋條件，Title 是唯一 SearchBar 條件 */
const buildFileArchiveCondition = (p: FileArchiveSearchParams): string =>
{
    return LibCondition.joinConditions([
        buildFileArchiveBaseCondition({ lang: p.lang, categoryIds: p.categoryIds, tagIds: p.tagIds }),
        p.title ? LibCondition.createCondition(`${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title}`, Operator.Like, p.title) : null,
    ]);
};
/** 建立 FileArchive QueryListParam */
const buildFileArchiveQuery = (p: { condition: string; pageNumber: number; pageSize: number; }): QueryListParam =>
{
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
        RankGroups: [{ Condition: LibCondition.joinConditions([LibCondition.createCondition(FileArchiveFields.ContentStatus, Operator.BitwiseHasAny, 1)]) }],
        OrderBy: [{ Col: FileArchiveFields.Validate_Start, Desc: true }, { Col: FileArchiveFields.CreateTime, Desc: true }],
        PageNumber: p.pageNumber,
        PageSize: p.pageSize,
    };
};
/** 建立 FileArchive 查詢參數 */
const buildFileArchiveSearchParams = (p: { lang: Lang; opts: IFileArchiveOptions; overrides?: Partial<{ title: string; categoryIds: string; tagIds: string; }>; values: SearchValues; viewState: IListViewState; }): FileArchiveSearchParams =>
{
    const values = p.values as Record<string, unknown>;
    const title = LibText.safeTrim(values[SEARCH_TITLE_KEY] ?? p.overrides?.title);
    const categoryIds = LibText.safeTrim(p.overrides?.categoryIds ?? p.opts.Category);
    const searchTagIds = LibText.safeTrim(values[SEARCH_TAG_KEY]);
    const tagIds = searchTagIds || LibText.safeTrim(p.overrides?.tagIds ?? p.opts.Tag);
    return { lang: p.lang, opts: p.opts, pageNumber: p.viewState.pageNumber, pageSize: p.viewState.pageSize, title, categoryIds, tagIds };
};
/** 建立 FileArchive QueryParam，Loader / Hook 都統一走這裡 */
const buildFileArchiveQueryArgs = (p: FileArchiveSearchParams & { condition: string; }): FileArchiveQueryParam =>
{
    const listParam = buildFileArchiveQuery({ condition: p.condition, pageNumber: p.pageNumber, pageSize: p.pageSize });
    return { lang: p.lang, pageSize: p.pageSize, pageNumber: p.pageNumber, title: p.title, categoryIds: p.categoryIds, tagIds: p.tagIds, condition: p.condition, listParam };
};

/** 建立 FileArchive DataQueryTemplate */
const createFileArchiveDataQueryTemplate = (
    p: { pageState?: ReturnType<typeof usePageStateMemory<ClientDataQueryMemoryState>>; lang: Lang; opts: IFileArchiveOptions; overrides?: Partial<{ pageNumber: number; pageSize: number; title: string; categoryIds: string; tagIds: string; }>; },
): FileArchiveDataQueryTemplate =>
{
    const initialViewState = buildFileArchiveInitialViewState(p.overrides);
    const initialSearchValues = buildFileArchiveSearchValues({ title: p.overrides?.title, tagIds: p.overrides?.tagIds });
    const searchBarText = getClientSearchBarText(p.lang);
    return {
        featureKey: "FileArchiveList",
        dataMode: "multiple",
        ...(p.pageState
            ? {
                pageStateMemory: {
                    controller: p.pageState,
                    getSearchValues: state => state.searchValues,
                    getViewState: state => state.viewState,
                    updateSearchValues: (state, values, pageNumber) => ({ ...state, searchValues: values, viewState: { ...state.viewState, pageNumber } }),
                    updateViewState: (state, nextViewState) => ({ ...state, viewState: nextViewState }),
                    getPagination: raw => ({ count: raw.count, totalPages: raw.totalPages }),
                },
            }
            : {}),
        initialSearchValues,
        initialViewState,
        pagination: { defaultPageNumber: initialViewState.pageNumber, defaultPageSize: initialViewState.pageSize, resetPageOnSearch: true },
        searchBar: { ...searchBarText, actionAlign: "right", columnCount: 3 },
        spec: getResolvedFileArchiveListDataQuerySpec(),
        feature: {
            buildSearchFields: (ctx) => buildFileArchiveSearchFields(p.lang, ctx.rawData.tagOptions),
            toSearchParams: (values, viewState) => buildFileArchiveSearchParams({ ...p, values, viewState }),
            buildSearchConditions: (ctx) => [buildFileArchiveCondition(ctx.searchParams)],
            buildQueryParam: (ctx) => buildFileArchiveQueryArgs({ ...ctx.searchParams, condition: ctx.searchCondition }),
            useDataSource: (ctx) => useFileArchiveDataSource({ queryParam: ctx.queryParam, loaderData: ctx.loaderData }),
            buildViewModel: (ctx) => ctx.rawData,
        },
    } as FileArchiveDataQueryTemplate;
};
/** 組 loader / hook 共用參數 */
const buildLoaderArgs = (p: { lang: Lang; opts: IFileArchiveOptions; overrides?: Partial<{ pageNumber: number; pageSize: number; title: string; categoryIds: string; tagIds: string; }>; }): FileArchiveQueryParam =>
{
    const template = createFileArchiveDataQueryTemplate(p);
    const viewState = buildFileArchiveInitialViewState(p.overrides);
    const searchValues = buildFileArchiveSearchValues({ title: p.overrides?.title, tagIds: p.overrides?.tagIds });
    return buildClientDataQueryState(template, searchValues, viewState).queryParam;
};
/** 將 tag data 轉成 SearchBar 可直接使用的選單 */
const buildTagOptions = (tagMap: Record<string, string>): FileArchiveTagOption[] =>
{
    return Object.entries(tagMap ?? {}).map(([id, name]) => buildTagOption(id, name)).filter(isValidTagOption);
};
/** 建立乾淨的標籤選項 */
const buildTagOption = (id: string, name: string): FileArchiveTagOption =>
{
    const safeId = LibText.safeTrim(id);
    const safeName = LibText.safeTrim(name);
    return { id: safeId, name: safeName };
};
/** 判斷標籤選項是否可顯示 */
const isValidTagOption = (item: FileArchiveTagOption): boolean =>
{
    return Boolean(item.id && item.name);
};
/** 取得 SSR initial grid，條件一致才沿用 count/list */
const buildGridInitial = (p: { queryParam: FileArchiveQueryParam; loaderData: FileArchiveListLoaderData | null; }): ApiGridInitial<FileArchiveSet> | undefined =>
{
    const initial = p.loaderData?.initial?.grid;
    const matched = isSameClientDataQueryParam(p.loaderData?.args?.listParam, p.queryParam.listParam);
    if (!initial) return undefined;
    return { model: initial.model ?? null, count: matched ? (initial.count ?? null) : null, list: matched ? (initial.list ?? null) : null };
};
/** FileArchive DataSource：統一處理 CSR 查詢與 SSR initial 沿用 */
const useFileArchiveDataSource = (p: { queryParam: FileArchiveQueryParam; loaderData: FileArchiveListLoaderData | null; }): ClientDataQueryDataSourceResult<FileArchiveListRawData, FileArchiveListAdapter> =>
{
    const { publish } = useToast();
    const adapter = useMemo(() => ({ FileArchive: FileArchiveAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() }), []);
    const currentArgs = p.queryParam;
    const gridInitial = useMemo(() => buildGridInitial(p), [p]);
    const onError = useCallback((e: ApiAdapterError) =>
    {
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
        if (p.loaderData?.args?.lang !== currentArgs.lang) return null;
        return p.loaderData?.initial?.category ?? null;
    }, [p.loaderData, currentArgs.lang]);
    const tagInitial = useMemo(() =>
    {
        if (p.loaderData?.args?.lang !== currentArgs.lang) return null;
        return p.loaderData?.initial?.tag ?? null;
    }, [p.loaderData, currentArgs.lang]);
    const category = adapter.Category.hooks.useMapByProgId({
        progId: PGID.FileArchive,
        lang: currentArgs.lang,
        deps: [currentArgs.lang],
        initial: categoryInitial,
    });
    const tag = adapter.Tag.hooks.useMapByProgId({ progId: PGID.FileArchive, lang: currentArgs.lang, deps: [currentArgs.lang], initial: tagInitial });
    const paginator = useMemo<ClientDataQueryPaginatorModel>(() => ({
        currentPage: grid.pageNumber ?? 1,
        pageSize: currentArgs.pageSize,
        totalPages: grid.totalPages ?? 1,
        totalCount: grid.count ?? 0,
        onPageChange: grid.onPageChange,
    }), [grid.pageNumber, grid.totalPages, grid.count, grid.onPageChange, currentArgs.pageSize]);
    const rawData = useMemo<FileArchiveListRawData>(() => (
        {
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
        }
    ), [
        grid.modelDisplayName,
        grid.count,
        grid.list,
        grid.pageNumber,
        grid.totalPages,
        grid.onPageChange,
        grid.param,
        currentArgs.listParam,
        category.map,
        tag.map,
    ]);
    const errors = useMemo(() => [...(grid.errors ?? []), category.errorText, tag.errorText].filter((item): item is string => Boolean(item)), [grid.errors, category.errorText, tag.errorText]);
    const refetchData = useCallback(async () =>
    {
        await grid.refetchData();
    }, [grid]);
    const refetchRefData = useCallback(async () =>
    {
        await Promise.all([category.refetch(), tag.refetch()]);
    }, [category, tag]);
    return { adapter, rawData, isLoading: Boolean(grid.isLoading || category.isLoading || tag.isLoading), errors, paginator, refetchData, refetchRefData };
};
// #endregion
