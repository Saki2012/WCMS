import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import type { LoaderFunctionArgs } from "react-router-dom";
import {SpecJournalAuthorFields, SpecJournalDocumentFields, SpecJournalIndexDetailFields, SpecJournalKeywordsFields, SpecJournalModelFields, SpecJournalOpenPointFilesFields, 
    SpecJournalRefFilesFields, SpecJournalRefFormatFields, SpecJournalTypesFields, TagDataFields, TagDetailFields, } from "@/types/SchemaFields";
import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournal_Api";

type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

export interface SpecJournalFormLoaderArgs
{
    indexId: string;
    rowId: string;
    journalId: string;
    baseParam: QueryListParam;
}

export interface SpecJournalFormLoaderRes
{
    countRes: number;
    listRes: SpecJournalSet[];
}

export interface SpecJournalFormLoaderData
{
    args: SpecJournalFormLoaderArgs;
    res: SpecJournalFormLoaderRes;
}

const buildBaseParam = (journalId: string): QueryListParam =>
{
    const condition = `${SpecJournalModelFields.JournalId} = ${journalId}`;
    // return
    return {
        Fields: [
            // Header
            SpecJournalModelFields.InternalId,SpecJournalModelFields.Title,SpecJournalModelFields.Title_en,SpecJournalModelFields.PageStart,
            SpecJournalModelFields.PageEnd,SpecJournalModelFields.DOIUrl,SpecJournalModelFields.JournalFileId,SpecJournalModelFields.JournalFileName,
            SpecJournalModelFields.InsightPointFileId,SpecJournalModelFields.InsightPointFileName,SpecJournalModelFields.ArticleLang,SpecJournalModelFields.Memo,
            SpecJournalModelFields.Memo_en,SpecJournalModelFields.Bibliography,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileId}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileName}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.PublishDate}`,
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
            // RefFiles
            `${SpecJournalModelFields._SpecJournalRefFiles}.${SpecJournalRefFilesFields.RowId}`,
            `${SpecJournalModelFields._SpecJournalRefFiles}.${SpecJournalRefFilesFields.RefFileId}`,
            `${SpecJournalModelFields._SpecJournalRefFiles}.${SpecJournalRefFilesFields.RefFileName}`,
            // Types
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.RowId}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.TagId}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}.${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}.${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,
            // Keywords
            `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.RowId}`,
            `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.LangCode}`,
            `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.Keyword}`,
            //Documents
            `${SpecJournalModelFields._SpecJournalDocument}.${SpecJournalDocumentFields.RowId}`,
            `${SpecJournalModelFields._SpecJournalDocument}.${SpecJournalDocumentFields.DocumentId}`,
            `${SpecJournalModelFields._SpecJournalDocument}.${SpecJournalDocumentFields.DocumentName}`,
            `${SpecJournalModelFields._SpecJournalDocument}.${SpecJournalDocumentFields.DocumentType}`,
        ],
        Condition: condition, PageNumber: 1, PageSize: 1,
    };
};

/** ✅ SSR loader：文章 detail 首屏預載（1 筆） */
export const SpecJournalForm_Loader = () => async ({ request, params }: LoaderFunctionArgs): Promise<SpecJournalFormLoaderData> =>
    {
        const indexId = `${params?.indexId ?? ""}`.trim();
        const rowId = `${params?.rowId ?? ""}`.trim();
        const journalId = `${params?.journalId ?? ""}`.trim();
        const baseParam = buildBaseParam(journalId);
        const ssrApi = getSsrApi(request);
        const adapter = SpecJournalAdapter(ssrApi);
        const countLoader = adapter.loader.createQueryCountLoader({getCondition: () => baseParam, getApiInstance: () => ssrApi,});
        const listLoader = adapter.loader.createQueryListLoader({getCondition: () => baseParam, getApiInstance: () => ssrApi,});
        const [countLD, listLD] = await Promise.all([countLoader({ request, params } as LoaderFunctionArgs),listLoader({ request, params } as LoaderFunctionArgs),]);
        return {
            args: { indexId, rowId, journalId, baseParam },
            res: {countRes: countLD.apiRes.Data ?? 0, listRes: listLD.apiRes.Data ?? [],},
        };
    };
