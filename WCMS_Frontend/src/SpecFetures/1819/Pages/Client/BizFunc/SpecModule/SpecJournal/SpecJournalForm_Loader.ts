import { SiteViewCountAdapter } from "@/Features/Hooks/BizFunc/SystemSetting/SiteInfo/SiteViewCount/SiteViewCount_Api";
import { getSsrApi, type ApiResponse } from "@/SysCore/Utils/API/APIBase";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { components } from "@/types/api";
import type { LoaderFunctionArgs } from "react-router-dom";
import { useLoaderData } from "react-router-dom";
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
import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournal_Api";
import { useMemo } from "react";

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

type SiteViewCountSetLike = SiteViewCountSet & {
    SiteViewCountDetail?: SiteViewCountDetailRow[] | null;
};

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
        PageNumber: 1,
        PageSize: 1,
    };
};

/** 轉義 query 內容 */
const escapeQueryValue = (value: string): string =>
{
    // return
    return value.replace(/"/g, `""`);
};

/** 組合 In 查詢字串 */
const buildQuotedValues = (values: string[]): string =>
{
    const quoted = values
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => `"${escapeQueryValue(p)}"`);

    // return
    return quoted.join(",");
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
    const apiRes: ApiResponse<TData> = {
        IsSuccess: true,
        Data: data,
        SysMessage: [],
    };

    // return
    return { args, apiRes };
};

/** 比對目前參數是否可沿用 loader 初始值 */
const matchInitialArgs = <TArgs, TData>(
    currentArgs: TArgs,
    initialArgs: TArgs,
    initialData: TData,
): ApiLoaderData<TArgs, TData> | null =>
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
    const result: SpecJournalViewCountData = {
        pageViewCount: 0,
        filePreviewCount: 0,
        fileDownloadCount: 0,
        linkClickCount: 0,
    };

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

/** ✅ SSR loader：文章 detail 首屏預載（1 筆 + viewCount） */
export const SpecJournalForm_Loader = () =>
    async ({ request, params }: LoaderFunctionArgs): Promise<SpecJournalFormLoaderData> =>
    {
        const indexId = `${params?.indexId ?? ""}`.trim();
        const rowId = `${params?.rowId ?? ""}`.trim();
        const journalId = `${params?.journalId ?? ""}`.trim();
        const baseParam = buildBaseParam(journalId);

        const ssrApi = getSsrApi(request);
        const adapter = SpecJournalAdapter(ssrApi);
        const siteViewAdapter = SiteViewCountAdapter(ssrApi);

        const countLoader = adapter.loader.createQueryCountLoader({
            getCondition: () => baseParam,
            getApiInstance: () => ssrApi,
        });

        const listLoader = adapter.loader.createQueryListLoader({
            getCondition: () => baseParam,
            getApiInstance: () => ssrApi,
        });

        const [countLD, listLD] = await Promise.all([
            countLoader({ request, params } as LoaderFunctionArgs),
            listLoader({ request, params } as LoaderFunctionArgs),
        ]);

        const listRes = listLD.apiRes.Data ?? [];
        const currentInternalId = getSpecJournalInternalId(listRes);
        const viewCountParam = buildViewCountQuery(currentInternalId);

        const viewCountLoader = siteViewAdapter.loader.createQueryListLoader({
            getCondition: () => viewCountParam,
            getApiInstance: () => ssrApi,
        });

        const viewCountLD = await viewCountLoader({ request, params } as LoaderFunctionArgs);

        // return
        return {
            args: {
                indexId,
                rowId,
                journalId,
                baseParam,
                viewCountParam,
            },
            res: {
                countRes: countLD.apiRes.Data ?? 0,
                listRes,
                viewCountRes: viewCountLD.apiRes.Data ?? [],
            },
        };
    };

/** CSR Hook：Component 最後一行直接取 detail + viewCount */
export const useSpecJournalFormData = (): UseSpecJournalFormDataResult =>
{
    const initial = useLoaderData() as SpecJournalFormLoaderData;
    const adapter = useMemo(() => SpecJournalAdapter(), []);
    const siteViewAdapter = useMemo(() => SiteViewCountAdapter(), []);

    const countInitial = useMemo(() =>
    {
        return buildLoaderInitial(initial.args.baseParam, initial.res.countRes);
    }, [initial.args.baseParam, initial.res.countRes]);

    const listInitial = useMemo(() =>
    {
        return buildLoaderInitial(initial.args.baseParam, initial.res.listRes);
    }, [initial.args.baseParam, initial.res.listRes]);

    const useCount = adapter.hooks.useQueryCount({
        condition: initial.args.baseParam,
        initial: countInitial,
        deps: [initial.args.journalId],
    });

    const useList = adapter.hooks.usePagedQueryList({
        baseParam: initial.args.baseParam,
        count: useCount.data ?? 0,
        initial: listInitial,
        deps: [initial.args.journalId],
    });

    const currentInternalId = useMemo(() =>
    {
        return getSpecJournalInternalId(useList.data ?? []);
    }, [useList.data]);

    const viewCountParam = useMemo(() =>
    {
        return buildViewCountQuery(currentInternalId);
    }, [currentInternalId]);

    const viewCountInitial = useMemo(() =>
    {
        return matchInitialArgs(
            viewCountParam,
            initial.args.viewCountParam,
            initial.res.viewCountRes,
        );
    }, [viewCountParam, initial.args.viewCountParam, initial.res.viewCountRes]);

    const viewCountParamKey = useMemo(() =>
    {
        return JSON.stringify(viewCountParam ?? null);
    }, [viewCountParam]);

    const useViewCount = siteViewAdapter.hooks.useQueryList({
        condition: viewCountParam,
        initial: viewCountInitial,
        deps: [viewCountParamKey],
    });

    const viewCountData = useMemo(() =>
    {
        return buildViewCountData(useViewCount.data ?? []);
    }, [useViewCount.data]);

    const errorList = useMemo(() =>
    {
        return [
            useCount.errorText,
            useList.errorText,
            useViewCount.errorText,
        ].filter((x): x is string => Boolean(x));
    }, [useCount.errorText, useList.errorText, useViewCount.errorText]);

    // return
    return {
        rawData: useList.data ?? [],
        data: (useList.data ?? [])[0],
        pageViewCount: viewCountData.pageViewCount,
        filePreviewCount: viewCountData.filePreviewCount,
        fileDownloadCount: viewCountData.fileDownloadCount,
        linkClickCount: viewCountData.linkClickCount,
        isLoading: Boolean(useCount.isLoading || useList.isLoading || useViewCount.isLoading),
        errorList,
    };
};