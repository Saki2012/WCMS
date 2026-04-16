import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/WEB/SpecJournal_Api";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import {
    FileManageModelFields,
    SpecJournalAuthorFields,
    SpecJournalDocumentFields,
    SpecJournalIndexDetailFields,
    SpecJournalKeywordsFields,
    SpecJournalModelFields,
    SpecJournalTypesFields,
    TagDataFields,
    TagDetailFields,
} from "@/types/SchemaFields";
import type { LoaderFunctionArgs } from "react-router-dom";
type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];
export interface SpecJournalListLoaderOptions
{
    pageSize?: number;
    pageTitle?: string;
    isPreprint?: boolean;
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
    isPreprint: boolean;
    pageSize: number;
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
    isPreprint: boolean;
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
    // 宣告變數
    let condition = "";
    const f = p.filters;
    const isGlobalSearch = hasSearchFilters(f);

    // 執行 function：只有非搜尋模式才套 route 範圍
    if (!isGlobalSearch)
    {
        const scopeCondition = buildScopeCondition(p);
        condition = LibMerge(" And ", false, condition, scopeCondition);
    }

    if (f.q)
    {
        const kw = escapeSqlValue(f.q);
        const baseCond = `(${
            LibMerge(
                " Or ",
                false,
                `${SpecJournalModelFields.Title} like '${kw}'`,
                `${SpecJournalModelFields.Title_en} like '${kw}'`,
                `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName} like '${kw}'`,
                `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en} like '${kw}'`,
            )
        })`;
        const includeRef = f.includeRef === "1" || f.includeRef.toLowerCase() === "true";
        if (!includeRef) condition = LibMerge(" And ", false, condition, baseCond);
        else
        {
            const bibCond = `(${SpecJournalModelFields.Bibliography} like '${kw}')`;
            condition = LibMerge(" And ", false, condition, `(${baseCond} Or ${bibCond})`);
        }
    }

    if (f.articleLang)
    {
        condition = LibMerge(
            " And ",
            false,
            condition,
            `${SpecJournalModelFields.ArticleLang} = '${escapeSqlValue(f.articleLang)}'`,
        );
    }

    if (f.tagId)
    {
        condition = LibMerge(
            " And ",
            false,
            condition,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.TagId} = '${
                escapeSqlValue(f.tagId)
            }'`,
        );
    }

    if (f.author)
    {
        condition = LibMerge(
            " And ",
            false,
            condition,
            `(${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName} = '${
                escapeSqlValue(f.author)
            }' Or ${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en} = '${
                escapeSqlValue(f.author)
            }')`,
        );
    }

    if (f.keyword)
    {
        condition = LibMerge(
            " And ",
            false,
            condition,
            `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.Keyword} = '${
                escapeSqlValue(f.keyword)
            }'`,
        );
    }

    // return
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
            SpecJournalModelFields.InternalId,
            SpecJournalModelFields.JournalId,
            SpecJournalModelFields.Title,
            SpecJournalModelFields.Title_en,
            SpecJournalModelFields.ArticleLang,
            SpecJournalModelFields.PageStart,
            SpecJournalModelFields.PageEnd,
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
        RankGroups: [{
            Condition: `${SpecJournalModelFields.PageStart} != 0`,
            OrderBy: [{ Col: SpecJournalModelFields.PageStart, Desc: false }],
        }],
        PageNumber: 1,
        PageSize: p.pageSize,
    };
};
/**
 * SpecJournal List Loader
 */
export const SpecJournalList_Loader =
    (opt: SpecJournalListLoaderOptions) =>
    async ({ request, params }: LoaderFunctionArgs): Promise<SpecJournalListLoaderData> =>
    {
        // 宣告變數
        const pageSize = opt.pageSize ?? 10;
        const indexId = `${params?.indexId ?? ""}`.trim();
        const rowId = `${params?.rowId ?? ""}`.trim();
        const pageTitle = opt.pageTitle ?? "";
        const filters = parseFilters(request.url);
        const isPreprint = opt.isPreprint ?? false;
        const baseParam = buildBaseParam({ indexId, rowId, isPreprint, pageSize, filters });
        const ssrApi = getSsrApi(request);
        const adapter = SpecJournalAdapter(ssrApi);
        // 執行 function：count / list
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

        // return
        return {
            args: { indexId, rowId, isPreprint, pageSize, pageTitle, filters, baseParam },
            res: { countRes: countLD.apiRes.Data ?? 0, listRes: listLD.apiRes.Data ?? [] },
        };
    };

/**
 * 建立資料範圍條件
 */
const buildScopeCondition = (p: BuildConditionArgs): string =>
{
    // 宣告變數
    const indexId = escapeSqlValue((p.indexId ?? "").trim());
    const rowId = escapeSqlValue((p.rowId ?? "").trim());

    // 執行 function：預刊本
    if (p.isPreprint)
    {
        return LibMerge(
            " And ",
            false,
            `${SpecJournalModelFields.JournalIndexId} is null`,
            `${SpecJournalModelFields.JournalIndexRowId} is null`,
        );
    }

    // 執行 function：正式卷期
    if (!indexId || !rowId) return "";

    // return
    return LibMerge(
        " And ",
        false,
        `${SpecJournalModelFields.JournalIndexId} = '${indexId}'`,
        `${SpecJournalModelFields.JournalIndexRowId} = '${rowId}'`,
    );
};
const hasSearchFilters = (f: SpecJournalListFilters): boolean =>
{
    // return
    return !!f.q || !!f.articleLang || !!f.tagId || !!f.author || !!f.keyword;
};
