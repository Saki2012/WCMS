import type { FileArchiveListDataQuerySpecSlot } from "@/Features/Pages/Client/BizFunc/WEB/FileArchive/Client_FileArchive_List_Loader";
import { FileArchiveFields } from "@/types/SchemaFields";

// #region Public
/** 1819：透過 Client_DataQueryTemplate 的 spec timing 追加查詢欄位與排序 */
export const extendFileArchiveListDataQuerySpec: FileArchiveListDataQuerySpecSlot = {
    buildQueryParam: (_ctx, featureQueryParam) =>
    {
        const queryParam = featureQueryParam!;
        const listParam = { ...queryParam.listParam, Fields: appendModifyTimeField(queryParam.listParam.Fields ?? []), OrderBy: buildModifyTimeOrderBy() };
        return { ...queryParam, listParam };
    },
};
// #endregion

// #region Private
const appendUnique = (source: string[], items: string[]): string[] =>
{
    return [...source, ...items.filter(item => !source.includes(item))];
};
/** 1819：補抓更新時間欄位 */
const appendModifyTimeField = (fields?: string[]): string[] =>
{
    return appendUnique(fields ?? [], [FileArchiveFields.ModifyTime]);
};
/** 1819：改用更新時間排序 */
const buildModifyTimeOrderBy = () =>
{
    return [{ Col: FileArchiveFields.ModifyTime, Desc: true }];
};
// #endregion
