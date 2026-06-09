import { SiteViewCountAdapter } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import {
    buildClientDataQueryKey,
    buildClientDataQueryState,
    useClientDataQueryTemplate,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/WEB/SpecJournal_Api";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import {
    FileManageModelFields,
    PGID,
    SiteViewCountDetailModelFields,
    SiteViewCountHeaderModelFields,
    SpecJournalAuthorFields,
    SpecJournalDocumentFields,
    SpecJournalIndexDetailFields,
    SpecJournalKeywordsFields,
    SpecJournalModelFields,
    SpecJournalOpenPointFilesFields,
    SpecJournalRefFilesFields,
    SpecJournalRefFormatFields,
    SpecJournalTypesFields,
    TagDataFields,
    TagDetailFields,
} from "@/types/SchemaFields";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { useLoaderData } from "react-router-dom";

// #region Property
type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];

type QueryListParam = components["schemas"]["QueryListParam"];

type SiteViewCountSet = components["schemas"]["SiteViewCountSet_DTO"];


type SiteViewCountDetailRow = {
    ProgId?: string | null;
    TargetInternalId?: string | null;
    PageViewCount?: number | null;
    FilePreviewCount?: number | null;
    FileDownloadCount?: number | null;
    LinkClickCount?: number | null;
};


type SiteViewCountSetLike = SiteViewCountSet & { SiteViewCountDetail?: SiteViewCountDetailRow[] | null; };


export interface SpecJournalFormLoaderArgs
{
    indexId: string;
    rowId: string;
    journalId: string;
    baseParam: QueryListParam;
    viewCountParam: QueryListParam;
}


export interface SpecJournalFormLoaderRes
{
    countRes: number;
    listRes: SpecJournalSet[];
    viewCountRes: SiteViewCountSet[];
}


export interface SpecJournalFormLoaderData
{
    args: SpecJournalFormLoaderArgs;
    res: SpecJournalFormLoaderRes;
}


export interface SpecJournalViewCountData
{
    pageViewCount: number;
    filePreviewCount: number;
    fileDownloadCount: number;
    linkClickCount: number;
}


export interface UseSpecJournalFormDataResult
{
    rawData: SpecJournalSet[];
    data?: SpecJournalSet;
    pageViewCount: number;
    filePreviewCount: number;
    fileDownloadCount: number;
    linkClickCount: number;
    isLoading: boolean;
    errorList: string[];
}




type SpecJournalFormAdapter = { Journal: ReturnType<typeof SpecJournalAdapter>; ViewCount: ReturnType<typeof SiteViewCountAdapter>; };

type SpecJournalFormTemplate = ClientDataQueryTemplate<
    SpecJournalFormLoaderArgs,
    UseSpecJournalFormDataResult,
    UseSpecJournalFormDataResult,
    SpecJournalFormAdapter,
    QueryListParam,
    SpecJournalFormLoaderData
>;

type SpecJournalFormDataSourceContext = Parameters<NonNullable<NonNullable<SpecJournalFormTemplate["spec"]>["useDataSource"]>>[0];
// #endregion

// #region Public
/** ✅ SSR loader：文章 detail 首屏預載（1 筆 + viewCount） */

export const SpecJournalForm_Loader = () => async ({ request, params }: LoaderFunctionArgs): Promise<SpecJournalFormLoaderData> =>
{
    const indexId = `${params?.indexId ?? ""}`.trim();
    const rowId = `${params?.rowId ?? ""}`.trim();
    const journalId = `${params?.journalId ?? ""}`.trim();
    const baseParam = buildBaseParam(journalId);

    const ssrApi = getSsrApi(request);
    const adapter = SpecJournalAdapter(ssrApi);
    const siteViewAdapter = SiteViewCountAdapter(ssrApi);

    const countLoader = adapter.loader.createQueryCountLoader({ getCondition: () => baseParam, getApiInstance: () => ssrApi });

    const listLoader = adapter.loader.createQueryListLoader({ getCondition: () => baseParam, getApiInstance: () => ssrApi });

    const [countLD, listLD] = await Promise.all([
        countLoader({ request, params } as LoaderFunctionArgs),
        listLoader({ request, params } as LoaderFunctionArgs),
    ]);

    const listRes = listLD.apiRes.Data ?? [];
    const currentInternalId = getSpecJournalInternalId(listRes);
    const viewCountParam = buildViewCountQuery(currentInternalId);

    const viewCountLoader = siteViewAdapter.loader.createQueryListLoader({ getCondition: () => viewCountParam, getApiInstance: () => ssrApi });

    const viewCountLD = await viewCountLoader({ request, params } as LoaderFunctionArgs);

    // return
    return {
        args: { indexId, rowId, journalId, baseParam, viewCountParam },
        res: { countRes: countLD.apiRes.Data ?? 0, listRes, viewCountRes: viewCountLD.apiRes.Data ?? [] },
    };
};


/** CSR Hook：Component 最後一行直接取 detail + viewCount */

export const useSpecJournalFormData = (): UseSpecJournalFormDataResult =>
{
    // 宣告變數
    const initial = useLoaderData() as SpecJournalFormLoaderData;
    const template = useMemo(() =>
    {
        const queryState = buildSpecJournalFormQueryState(initial.args);
        return createSpecJournalFormDataQueryTemplate({ ...initial.args, baseParam: queryState.queryParam });
    }, [initial.args]);

    const templateVm = useClientDataQueryTemplate(template);

    // return
    return { ...templateVm.viewModel, isLoading: templateVm.isLoading, errorList: templateVm.errorList };
};
// #endregion

// #region Private
/** 建立文章 detail 查詢參數 */

const buildBaseParam = (journalId: string): QueryListParam =>
{
    const condition = `${SpecJournalModelFields.JournalId} = ${journalId}`;

    // return
    return {
        Fields: [
            // Header
            SpecJournalModelFields.InternalId,
            SpecJournalModelFields.Title,
            SpecJournalModelFields.Title_en,
            SpecJournalModelFields.PageStart,
            SpecJournalModelFields.PageEnd,
            SpecJournalModelFields.DOIUrl,
            SpecJournalModelFields.ArticleLang,
            SpecJournalModelFields.Memo,
            SpecJournalModelFields.Memo_en,
            SpecJournalModelFields.Bibliography,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileId}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileName}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFile}.${FileManageModelFields.PublicDownloadCount}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFile}.${FileManageModelFields.FileExtension}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.PublishDate}`,

            // Header File
            SpecJournalModelFields.JournalFileId,
            SpecJournalModelFields.JournalFileName,
            `${SpecJournalModelFields.JournalFile}.${FileManageModelFields.PublicDownloadCount}`,
            `${SpecJournalModelFields.JournalFile}.${FileManageModelFields.FileExtension}`,
            SpecJournalModelFields.InsightPointFileId,
            SpecJournalModelFields.InsightPointFileName,
            `${SpecJournalModelFields.InsightPointFile}.${FileManageModelFields.PublicDownloadCount}`,
            `${SpecJournalModelFields.InsightPointFile}.${FileManageModelFields.FileExtension}`,

            // Author
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.RowId}`,
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorType}`,
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName}`,
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en}`,
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.JobTitle}`,
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.Unit}`,
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.Unit_en}`,
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.Email}`,
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.Country}`,
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.ORCID}`,

            // RefFormat
            `${SpecJournalModelFields._SpecJournalRefFormat}.${SpecJournalRefFormatFields.RowId}`,
            `${SpecJournalModelFields._SpecJournalRefFormat}.${SpecJournalRefFormatFields.Title}`,
            `${SpecJournalModelFields._SpecJournalRefFormat}.${SpecJournalRefFormatFields.Content}`,

            // OpenPoint
            `${SpecJournalModelFields._SpecJournalOpenPointFiles}.${SpecJournalOpenPointFilesFields.RowId}`,
            `${SpecJournalModelFields._SpecJournalOpenPointFiles}.${SpecJournalOpenPointFilesFields.OpenPointFileId}`,
            `${SpecJournalModelFields._SpecJournalOpenPointFiles}.${SpecJournalOpenPointFilesFields.OpenPointFileName}`,
            `${SpecJournalModelFields._SpecJournalOpenPointFiles}.${SpecJournalOpenPointFilesFields.OpenPointFile}.${FileManageModelFields.PublicDownloadCount}`,
            `${SpecJournalModelFields._SpecJournalOpenPointFiles}.${SpecJournalOpenPointFilesFields.OpenPointFile}.${FileManageModelFields.FileExtension}`,

            // RefFiles
            `${SpecJournalModelFields._SpecJournalRefFiles}.${SpecJournalRefFilesFields.RowId}`,
            `${SpecJournalModelFields._SpecJournalRefFiles}.${SpecJournalRefFilesFields.RefFileId}`,
            `${SpecJournalModelFields._SpecJournalRefFiles}.${SpecJournalRefFilesFields.RefFileName}`,
            `${SpecJournalModelFields._SpecJournalRefFiles}.${SpecJournalRefFilesFields.RefFile}.${FileManageModelFields.PublicDownloadCount}`,
            `${SpecJournalModelFields._SpecJournalRefFiles}.${SpecJournalRefFilesFields.RefFile}.${FileManageModelFields.FileExtension}`,

            // Types
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.RowId}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.TagId}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}.${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}.${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,

            // Keywords
            `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.RowId}`,
            `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.LangCode}`,
            `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.Keyword}`,

            // Documents
            `${SpecJournalModelFields._SpecJournalDocument}.${SpecJournalDocumentFields.RowId}`,
            `${SpecJournalModelFields._SpecJournalDocument}.${SpecJournalDocumentFields.DocumentId}`,
            `${SpecJournalModelFields._SpecJournalDocument}.${SpecJournalDocumentFields.DocumentName}`,
            `${SpecJournalModelFields._SpecJournalDocument}.${SpecJournalDocumentFields.Document}.${FileManageModelFields.PublicDownloadCount}`,
            `${SpecJournalModelFields._SpecJournalDocument}.${SpecJournalDocumentFields.Document}.${FileManageModelFields.FileExtension}`,
            `${SpecJournalModelFields._SpecJournalDocument}.${SpecJournalDocumentFields.DocumentType}`,
        ],
        Condition: condition,
        RankGroups: [{ Condition: `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorType} = 0` }],
        PageNumber: 1,
        PageSize: 1,
    };
};


/** 取得 detail 頁文章 internalId */
const getSpecJournalInternalId = (rows: SpecJournalSet[]): string =>
{
    // return
    return rows[0]?.SpecJournal?.InternalId ?? "";
};


/** 建立 site view count 查詢條件 */
const buildViewCountCondition = (internalId: string): string =>
{
    const value = `${internalId ?? ""}`.trim();
    if (!value) return "1=0";
    // return
    return `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.ProgId} = ${PGID.SpecJournal} And ${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.TargetInternalId} = ${value}`;
};


/** 建立 site view count 查詢參數 */
const buildViewCountQuery = (internalId: string): QueryListParam =>
{
    // return
    return {
        Fields: [
            `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.ProgId}`,
            `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.TargetInternalId}`,
            `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.PageViewCount}`,
            `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.FilePreviewCount}`,
            `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.FileDownloadCount}`,
            `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.LinkClickCount}`,
        ],
        Condition: buildViewCountCondition(internalId),
        PageNumber: 0,
        PageSize: 0,
    };
};


/** 建立 loader initial 資料 */
const buildLoaderInitial = <TArgs, TData>(args: TArgs, data: TData): ApiLoaderData<TArgs, TData> =>
{
    const apiRes: ApiResponse<TData> = { IsSuccess: true, Data: data, SysMessage: [] };

    // return
    return { args, apiRes };
};


/** 比對目前參數是否可沿用 loader 初始值 */
const matchInitialArgs = <TArgs, TData>(currentArgs: TArgs, initialArgs: TArgs, initialData: TData): ApiLoaderData<TArgs, TData> | null =>
{
    const currentKey = JSON.stringify(currentArgs ?? null);
    const initialKey = JSON.stringify(initialArgs ?? null);

    if (currentKey !== initialKey) return null;

    // return
    return buildLoaderInitial(initialArgs, initialData);
};


/** 取得 site view detail rows */
const getSiteViewCountDetails = (item: SiteViewCountSet): SiteViewCountDetailRow[] =>
{
    const detailRows = (item as SiteViewCountSetLike).SiteViewCountDetail;

    if (!Array.isArray(detailRows)) return [];

    // return
    return detailRows;
};


/** 彙整瀏覽相關統計 */
const buildViewCountData = (rows: SiteViewCountSet[]): SpecJournalViewCountData =>
{
    const result: SpecJournalViewCountData = { pageViewCount: 0, filePreviewCount: 0, fileDownloadCount: 0, linkClickCount: 0 };

    rows.forEach((item) =>
    {
        const detailRows = getSiteViewCountDetails(item);

        detailRows.forEach((detail) =>
        {
            result.pageViewCount += Number(detail.PageViewCount ?? 0);
            result.filePreviewCount += Number(detail.FilePreviewCount ?? 0);
            result.fileDownloadCount += Number(detail.FileDownloadCount ?? 0);
            result.linkClickCount += Number(detail.LinkClickCount ?? 0);
        });
    });

    // return
    return result;
};


/** 建立 detail loader / hook 共用查詢狀態 */
const buildSpecJournalFormQueryState = (args: SpecJournalFormLoaderArgs) =>
{
    // 宣告變數
    const template = createSpecJournalFormDataQueryTemplate(args);
    const searchValues: SearchValues = {};
    const viewState: IListViewState = { pageNumber: 1, pageSize: 1 };

    // return
    return buildClientDataQueryState(template, searchValues, viewState);
};


/** 建立 SpecJournal Form DataQuery Template */
const createSpecJournalFormDataQueryTemplate = (args: SpecJournalFormLoaderArgs): SpecJournalFormTemplate =>
{
    // return
    return {
        featureKey: "Spec1819.SpecJournal.Form",
        dataMode: "single",
        initialViewState: { pageNumber: 1, pageSize: 1 },
        pagination: null,
        searchBar: null,
        spec: {
            toSearchParams: () => args,
            buildQueryParam: ({ searchParams }) => buildBaseParam(searchParams.journalId),
            useDataSource: (ctx) => useSpecJournalFormDataSource(ctx),
            buildViewModel: ({ rawData }) => rawData,
        },
    };
};


/** DataSource：用 Template 統一接文章 detail 與 viewCount */
const useSpecJournalFormDataSource = (
    ctx: SpecJournalFormDataSourceContext,
): ClientDataQueryDataSourceResult<UseSpecJournalFormDataResult, SpecJournalFormAdapter> =>
{
    // 宣告變數
    const loaderData = ctx.loaderData as SpecJournalFormLoaderData;
    const adapter = useMemo<SpecJournalFormAdapter>(() => ({ Journal: SpecJournalAdapter(), ViewCount: SiteViewCountAdapter() }), []);
    const queryKey = useMemo(() => buildClientDataQueryKey(ctx.queryParam), [ctx.queryParam]);

    const countInitial = useMemo(() =>
    {
        return matchInitialArgs(ctx.queryParam, loaderData.args.baseParam, loaderData.res.countRes);
    }, [ctx.queryParam, loaderData.args.baseParam, loaderData.res.countRes]);

    const listInitial = useMemo(() =>
    {
        return matchInitialArgs(ctx.queryParam, loaderData.args.baseParam, loaderData.res.listRes);
    }, [ctx.queryParam, loaderData.args.baseParam, loaderData.res.listRes]);

    // 執行 function：主文章資料
    const useCount = adapter.Journal.hooks.useQueryCount({ condition: ctx.queryParam, initial: countInitial, deps: [queryKey] });
    const useList = adapter.Journal.hooks.usePagedQueryList({ baseParam: ctx.queryParam, count: useCount.data ?? 0, initial: listInitial, deps: [queryKey] });

    const currentInternalId = useMemo(() => getSpecJournalInternalId(useList.data ?? []), [useList.data]);
    const viewCountParam = useMemo(() => buildViewCountQuery(currentInternalId), [currentInternalId]);
    const viewCountParamKey = useMemo(() => buildClientDataQueryKey(viewCountParam), [viewCountParam]);
    const viewCountInitial = useMemo(() =>
    {
        return matchInitialArgs(viewCountParam, loaderData.args.viewCountParam, loaderData.res.viewCountRes);
    }, [viewCountParam, loaderData.args.viewCountParam, loaderData.res.viewCountRes]);

    const useViewCount = adapter.ViewCount.hooks.useQueryList({ condition: viewCountParam, initial: viewCountInitial, deps: [viewCountParamKey] });
    const viewCountData = useMemo(() => buildViewCountData(useViewCount.data ?? []), [useViewCount.data]);

    const rawData = useMemo<UseSpecJournalFormDataResult>(() =>
    {
        return {
            rawData: useList.data ?? [],
            data: (useList.data ?? [])[0],
            pageViewCount: viewCountData.pageViewCount,
            filePreviewCount: viewCountData.filePreviewCount,
            fileDownloadCount: viewCountData.fileDownloadCount,
            linkClickCount: viewCountData.linkClickCount,
            isLoading: Boolean(useCount.isLoading || useList.isLoading || useViewCount.isLoading),
            errorList: [],
        };
    }, [useList.data, viewCountData, useCount.isLoading, useList.isLoading, useViewCount.isLoading]);

    // return
    return {
        adapter,
        rawData,
        isLoading: rawData.isLoading,
        errors: [useCount.errorText, useList.errorText, useViewCount.errorText],
        paginator: null,
    };
};
// #endregion
