import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import {SpecJournalAuthorFields, SpecJournalIndexDetailFields, SpecJournalKeywordsFields, SpecJournalModelFields, SpecJournalTypesFields, TagDataFields, TagDetailFields, } from "@/types/SchemaFields";
import type { LoaderFunctionArgs } from "react-router-dom";

// ✅ 1819 SpecJournal Adapter（你說底層都有，先直接用 Adapter）
import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournal_Api";

type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

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

const parseFilters = (url: string): SpecJournalListFilters =>
{
    // 宣告變數
    const sp = new URL(url).searchParams;

    // return
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

const buildCondition = (p: {
    indexId: string;
    rowId: string;
    filters: SpecJournalListFilters;
}) =>
{
    // 變數宣告
    let condition = "";
    const f = p.filters;

    const isSearchMode = !!f.q || !!f.articleLang || !!f.tagId || !!f.author || !!f.keyword;

    // ✅ 非搜尋模式才套卷期；搜尋模式全站查
    if (!isSearchMode)
    {
        if (p.indexId)
        {
            condition = LibMerge(
                " And ",
                false,
                condition,
                `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.IndexId} = ${p.indexId}`,
            );
        }
        if (p.rowId)
        {
            condition = LibMerge(
                " And ",
                false,
                condition,
                `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.RowId} = ${p.rowId}`,
            );
        }
    }

    // ✅ q：Title/Title_en like；includeRef=true 時加 bibliography like
    if (f.q)
    {
        const kw = f.q.replace(/'/g, "''");
        const baseCond = `(${SpecJournalModelFields.Title} like '${kw}' Or ${SpecJournalModelFields.Title_en} like '${kw}')`;

        const includeRef = f.includeRef === "1" || f.includeRef.toLowerCase() === "true";
        if (!includeRef)
        {
            condition = LibMerge(" And ", false, condition, baseCond);
        }
        else
        {
            //參考文獻變成純Content，有可能會因此變慢，但需求上是必須要加上條件審查，暫時這樣
            const bibCond = `(${SpecJournalModelFields.Bibliography} like '${kw}')`;
            condition = LibMerge(" And ", false, condition, `(${baseCond} Or ${bibCond})`);
        }
    }

    // ✅ 語言（字串）
    if (f.articleLang)
    {
        const v = f.articleLang.replace(/'/g, "''");
        condition = LibMerge(" And ", false, condition, `${SpecJournalModelFields.ArticleLang} = '${v}'`);
    }

    // ✅ 類型 tagId（字串）
    if (f.tagId)
    {
        const v = f.tagId.replace(/'/g, "''");
        condition = LibMerge(
            " And ",
            false,
            condition,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.TagId} = '${v}'`,
        );
    }

    // ✅ 作者（精準比對）
    if (f.author)
    {
        const v = f.author.replace(/'/g, "''");
        condition = LibMerge(
            " And ",
            false,
            condition,
            `(${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName} = '${v}' Or ${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en} = '${v}')`,
        );
    }

    // ✅ 關鍵詞（明細 Keyword =）
    if (f.keyword)
    {
        const v = f.keyword.replace(/'/g, "''");
        condition = LibMerge(
            " And ",
            false,
            condition,
            `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.Keyword} = '${v}'`,
        );
    }

    // return
    return condition;
};

const buildBaseParam = (p: {
    indexId: string;
    rowId: string;
    pageSize: number;
    filters: SpecJournalListFilters;
}): QueryListParam =>
{
    // 宣告變數
    const condition = buildCondition(p);

    // return
    return {
        Fields: [
            SpecJournalModelFields.InternalId,
            SpecJournalModelFields.JournalId,
            SpecJournalModelFields.Title,
            SpecJournalModelFields.Title_en,
            SpecJournalModelFields.ArticleLang,

            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.IndexId}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.RowId}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileId}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileName}`,

            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.TagId}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}.${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}.${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,

            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName}`,
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en}`,
        ],
        Condition: condition,
        OrderBy: [{ Col: SpecJournalModelFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: p.pageSize,
    };
};

export const SpecJournalList_Loader =
    (p: { pageSize?: number; }) =>
    async ({ request, params }: LoaderFunctionArgs): Promise<SpecJournalListLoaderData> =>
    {
        // 宣告變數
        const pageSize = p.pageSize ?? 10;
        const indexId = `${params?.indexId ?? ""}`.trim();
        const rowId = `${params?.rowId ?? ""}`.trim();

        const filters = parseFilters(request.url);
        const baseParam = buildBaseParam({ indexId, rowId, pageSize, filters });

        const ssrApi = getSsrApi(request);
        const adapter = SpecJournalAdapter(ssrApi);

        // 執行 function：count/list
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
            args: { indexId, rowId, pageSize, filters, baseParam },
            res: {
                countRes: countLD.apiRes.Data ?? 0,
                listRes: listLD.apiRes.Data ?? [],
            },
        };
    };
