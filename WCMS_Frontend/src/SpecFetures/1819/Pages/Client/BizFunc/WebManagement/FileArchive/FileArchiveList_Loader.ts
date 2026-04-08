import type { FileArchiveListBaseParamSlot } from "@/Features/Pages/Client/BizFunc/WebManagement/FileArchive/FileArchiveList_Loader";
import { FileArchiveFields } from "@/types/SchemaFields";

const appendUnique = (source: string[], items: string[]): string[] =>
{
    return [...source, ...items.filter(item => !source.includes(item))];
};

/** 1819：追加查詢欄位與排序 */
export const extendFileArchiveListBaseParam: FileArchiveListBaseParamSlot = (ctx) =>
{
    // 宣告變數
    const result = { ...ctx.result };

    // 執行 function：補抓更新時間欄位
    result.Fields = appendUnique(result.Fields ?? [], [FileArchiveFields.ModifyTime]);

    // 執行 function：改用更新時間排序
    result.OrderBy = [{ Col: FileArchiveFields.ModifyTime, Desc: true }];

    // return
    return result;
};
