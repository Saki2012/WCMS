import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { FileManageModelFields, SpecJournalAuthorFields, SpecJournalDocumentFields, SpecJournalIndexDetailFields, SpecJournalIndexModelFields, SpecJournalKeywordsFields, SpecJournalModelFields, SpecJournalTypesFields, TagDataFields, TagDetailFields, } from "@/types/SchemaFields";
import type { LoaderFunctionArgs } from "react-router-dom";
import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournal_Api";
type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];
type PublishStatus = components["schemas"]["PublishStatus"];
export const PublishStatusEnum = { Unpublished: 0, Published: 1, } as const satisfies Record<string, PublishStatus>;
export type PublishStatusValue = (typeof PublishStatusEnum)[keyof typeof PublishStatusEnum];
export interface SpecJournalListLoaderOptions
{
    pageSize?: number;
    publishStatus: PublishStatusValue;
    forceGlobal?: boolean;
    pageTitle?: string;
}
export interface SpecJournalListFilters
{
    q: string;
    articleLang: string;
    tagId: string;
    tagName: string;
    author: string;
    keyword: string;
    includeRef: string;
}
export interface SpecJournalListLoaderArgs
{
    indexId: string;
    rowId: string;
    pageSize: number;
    publishStatus: PublishStatusValue;
    forceGlobal: boolean;
    pageTitle: string;
    filters: SpecJournalListFilters;
    baseParam: QueryListParam;
}
export interface SpecJournalListLoaderRes
{
    countRes: number;
    listRes: SpecJournalSet[];
}
export interface SpecJournalListLoaderData
{
    args: SpecJournalListLoaderArgs;
    res: SpecJournalListLoaderRes;
}
interface BuildConditionArgs
{
    indexId: string;
    rowId: string;
    publishStatus: PublishStatusValue;
    forceGlobal: boolean;
    filters: SpecJournalListFilters;
}
interface BuildBaseParamArgs extends BuildConditionArgs
{
    pageSize: number;
}
/**
 * 解析網址查詢條件
 */
const parseFilters = (url: string): SpecJournalListFilters =>
{
    const sp = new URL(url).searchParams;
    return {
        q: (sp.get("q") ?? "").trim(),
        articleLang: (sp.get("articleLang") ?? "").trim(),
        tagId: (sp.get("tagId") ?? "").trim(),
        tagName: (sp.get("tagName") ?? "").trim(),
        author: (sp.get("author") ?? "").trim(),
        keyword: (sp.get("keyword") ?? "").trim(),
        includeRef: (sp.get("includeRef") ?? "").trim(),
    };
};
/**
 * 判斷是否為搜尋模式
 */
const isSearchMode = (filters: SpecJournalListFilters): boolean =>
{
    const hasSearch = !!filters.q || !!filters.articleLang || !!filters.tagId || !!filters.author || !!filters.keyword;  
    return hasSearch;
};
/**
 * 轉義單引號
 */
const escapeSqlValue = (value: string): string =>
{
    // return
    return value.replace(/'/g, "''");
};
/**
 * 建立查詢條件
 */
const buildCondition = (p: BuildConditionArgs): string =>
{
    let condition = "";
    const f = p.filters;
    const searchMode = isSearchMode(f);
    condition = LibMerge(" And ", false, condition, `${SpecJournalModelFields._JournalIndex}.${SpecJournalIndexModelFields.PublishStatus} = ${p.publishStatus}`,);
    if (!p.forceGlobal && !searchMode)
    {
        if (p.indexId) condition = LibMerge(" And ", false, condition, `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.IndexId} = ${p.indexId}`,);
        if (p.rowId) condition = LibMerge(" And ", false, condition, `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.RowId} = ${p.rowId}`,);
    }
    if (f.q)
    {
        const kw = escapeSqlValue(f.q);
        const baseCond = `(${SpecJournalModelFields.Title} like '${kw}' Or ${SpecJournalModelFields.Title_en} like '${kw}')`;
        const includeRef = f.includeRef === "1" || f.includeRef.toLowerCase() === "true";
        if (!includeRef) condition = LibMerge(" And ", false, condition, baseCond);
        else
        {
            const bibCond = `(${SpecJournalModelFields.Bibliography} like '${kw}')`;
            condition = LibMerge(" And ", false, condition, `(${baseCond} Or ${bibCond})`);
        }
    }
    if (f.articleLang) condition = LibMerge(" And ", false, condition, `${SpecJournalModelFields.ArticleLang} = '${escapeSqlValue(f.articleLang)}'`,);
    if (f.tagId) condition = LibMerge(" And ", false, condition, `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.TagId} = '${escapeSqlValue(f.tagId)}'`,);
    if (f.author) condition = LibMerge(" And ", false, condition,`(${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName} = '${escapeSqlValue(f.author)}' Or ${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en} = '${escapeSqlValue(f.author)}')`,);
    if (f.keyword) condition = LibMerge(" And ", false, condition, `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.Keyword} = '${escapeSqlValue(f.keyword)}'`,);
    return condition;
};

/**
 * 建立 QueryListParam
 */
const buildBaseParam = (p: BuildBaseParamArgs): QueryListParam =>
{
    const condition = buildCondition(p);
    return {
        Fields: [
            SpecJournalModelFields.InternalId, SpecJournalModelFields.JournalId, SpecJournalModelFields.Title, SpecJournalModelFields.Title_en, SpecJournalModelFields.ArticleLang,
            SpecJournalModelFields.PageStart,SpecJournalModelFields.PageEnd,
            `${SpecJournalModelFields._JournalIndex}.${SpecJournalIndexModelFields.PublishStatus}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.IndexId}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.RowId}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileId}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileName}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFile}.${FileManageModelFields.PublicDownloadCount}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFile}.${FileManageModelFields.FileExtension}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.TagId}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}.${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}.${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName}`,
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en}`,
            `${SpecJournalModelFields._SpecJournalDocument}.${SpecJournalDocumentFields.DocumentId}`,
            `${SpecJournalModelFields._SpecJournalDocument}.${SpecJournalDocumentFields.DocumentName}`,
            `${SpecJournalModelFields._SpecJournalDocument}.${SpecJournalDocumentFields.DocumentType}`,
        ],
        Condition: condition,
        OrderBy: [{ Col: SpecJournalModelFields.PageStart, Desc: false }],
        PageNumber: 1,
        PageSize: p.pageSize,
    };
};
/**
 * SpecJournal List Loader
 */
export const SpecJournalList_Loader = (opt: SpecJournalListLoaderOptions) => async ({ request, params }: LoaderFunctionArgs): Promise<SpecJournalListLoaderData> =>
{
    // 宣告變數
    const pageSize = opt.pageSize ?? 10;
    const indexId = `${params?.indexId ?? ""}`.trim();
    const rowId = `${params?.rowId ?? ""}`.trim();
    const publishStatus = opt.publishStatus;
    const forceGlobal = opt.forceGlobal ?? false;
    const pageTitle = opt.pageTitle ?? "";
    const filters = parseFilters(request.url);
    const baseParam = buildBaseParam({indexId, rowId, pageSize, publishStatus, forceGlobal, filters,});
    const ssrApi = getSsrApi(request);
    const adapter = SpecJournalAdapter(ssrApi);
    // 執行 function：count / list
    const countLoader = adapter.loader.createQueryCountLoader({getCondition: () => baseParam, getApiInstance: () => ssrApi, });
    const listLoader = adapter.loader.createQueryListLoader({getCondition: () => baseParam, getApiInstance: () => ssrApi,});
    const [countLD, listLD] = await Promise.all([countLoader({ request, params } as LoaderFunctionArgs), listLoader({ request, params } as LoaderFunctionArgs),]);

    // return
    return {
        args: {indexId, rowId, pageSize, publishStatus, forceGlobal, pageTitle, filters, baseParam, },
        res: { countRes: countLD.apiRes.Data ?? 0, listRes: listLD.apiRes.Data ?? [],},
    };
};