import { FileArchiveAdapter } from "@/Features/Hooks/BizFunc/WebManagement/FileArchive_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tag_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import {FileArchiveDetailFields, FileArchiveFields, FileArchiveInfoFields, FileArchiveUrlDetailFields, FileManageModelFields, PGID, TagDataFields, TagDetailFields, TagSetFields, } from "@/types/SchemaFields";
import type { LoaderFunctionArgs } from "react-router-dom";
import type { IFileArchiveOptions } from "./FileArchiveList";

type QueryListParam = components["schemas"]["QueryListParam"];
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];

export interface FileArchiveListLoaderArgs
{
    baseParam: QueryListParam;
    tagParam: QueryListParam;
}

export interface FileArchiveListLoaderRes
{
    countRes: number;
    listRes: FileArchiveSet[];
    tagRes: TagSet[];
}

export interface FileArchiveListLoaderData
{
    args: FileArchiveListLoaderArgs;
    res: FileArchiveListLoaderRes;
}
const buildCondition = (p: { lang: Lang; opts: IFileArchiveOptions; }) =>
{
    let condition = LibMerge(" And ", false, 
        `${FileArchiveFields.ContentStatus} !& 4`, // 不包含隱藏資料
        `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Lang} = ${p.lang}`,
        `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title} != ''`
    );
    if (p.opts.Category) condition = LibMerge(" And ", false, condition, `${FileArchiveFields.CategoriesId} HasAny [${p.opts.Category}]`,);
    if (p.opts.Tag) condition = LibMerge(" And ", false, condition, `${FileArchiveFields.TagsId} HasAny [${p.opts.Tag}]`);
    return condition;
};

const buildBaseParam = (p: { lang: Lang; opts: IFileArchiveOptions; }) =>
{
    const condition = buildCondition(p);
    return {
        Fields: [FileArchiveFields.InternalId, FileArchiveFields.FileArchiveId, FileArchiveFields.TagsId,FileArchiveFields.ContentStatus,
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
        Condition: condition,
        RankGroups: [{ Condition: `${FileArchiveFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: FileArchiveFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: 10,
    } as QueryListParam;
};

const buildTagParam = (lang: Lang) =>
{
    let condition = LibMerge(" And ", false, `${TagDataFields.ProgId} = ${PGID.FileArchive}`,
        `${TagDataFields._TagDetail}.${TagDetailFields.Lang} = ${lang}`,
        `${TagDataFields._TagDetail}.${TagDetailFields.TagName} != ''`
    )
    return {
        Fields: [
            `${TagSetFields.TagData}.${TagDataFields.TagId}`,
            `${TagSetFields.TagData}.${TagDataFields.ProgId}`,
            `${TagSetFields.TagDetail}.${TagDetailFields.Lang}`,
            `${TagSetFields.TagDetail}.${TagDetailFields.TagName}`,
        ],
        Condition: condition,
        PageNumber: 0,
        PageSize: 0,
    } as QueryListParam;
};

/** ✅ loader factory */
export const FileArchiveList_Loader = (p: { lang: Lang; opts: IFileArchiveOptions; }) => async ({ request }: LoaderFunctionArgs): Promise<FileArchiveListLoaderData> =>
{
    const ssrApi = getSsrApi(request);
    const fileArchive = FileArchiveAdapter(ssrApi);
    const tag = TagAdapter(ssrApi);
    const baseParam = buildBaseParam(p);
    const tagParam = buildTagParam(p.lang);
    const countLoader = fileArchive.loader.createQueryCountLoader({getCondition: () => baseParam, getApiInstance: () => ssrApi,});
    const listLoader = fileArchive.loader.createQueryListLoader({getCondition: () => baseParam, getApiInstance: () => ssrApi,});
    const tagLoader = tag.loader.createQueryListLoader({getCondition: () => tagParam, getApiInstance: () => ssrApi,});
    const [countLD, listLD, tagLD] = await Promise.all([countLoader({ request } as LoaderFunctionArgs), listLoader({ request } as LoaderFunctionArgs), tagLoader({ request } as LoaderFunctionArgs),]);
    return { args: { baseParam, tagParam }, res: { countRes: countLD.apiRes.Data ?? 0, listRes: listLD.apiRes.Data ?? [], tagRes: tagLD.apiRes.Data ?? [],},};
};
