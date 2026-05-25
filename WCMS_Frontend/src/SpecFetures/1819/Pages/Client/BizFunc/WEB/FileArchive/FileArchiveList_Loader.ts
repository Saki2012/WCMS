import type { FileArchiveListDataQuerySpecSlot } from "@/Features/Pages/Client/BizFunc/WEB/FileArchive/FileArchiveList_Loader";
import { FileArchiveFields } from "@/types/SchemaFields";

const appendUnique = (source: string[], items: string[]): string[] =>
{
    // return
    return [...source, ...items.filter(item => !source.includes(item))];
};

/** 1819：補抓更新時間欄位 */
const appendModifyTimeField = (fields?: string[]): string[] =>
{
    // return
    return appendUnique(fields ?? [], [FileArchiveFields.ModifyTime]);
};

/** 1819：改用更新時間排序 */
const buildModifyTimeOrderBy = () =>
{
    // return
    return [{ Col: FileArchiveFields.ModifyTime, Desc: true }];
};

/** 1819：透過 Client_DataQueryTemplate 的 spec timing 追加查詢欄位與排序 */
export const extendFileArchiveListDataQuerySpec: FileArchiveListDataQuerySpecSlot = {
    buildQueryParam: (_ctx, featureQueryParam) =>
    {
        // 宣告變數
        const listParam = {
            ...featureQueryParam.listParam,
            Fields: appendModifyTimeField(featureQueryParam.listParam.Fields ?? []),
            OrderBy: buildModifyTimeOrderBy(),
        };

        // return
        return { ...featureQueryParam, listParam };
    },
};
