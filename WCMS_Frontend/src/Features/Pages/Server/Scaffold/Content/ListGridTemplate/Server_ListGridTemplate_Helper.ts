import type { ColumnConfig } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { findTextByKey } from "@/SysCore/Utils/Library/LibData";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { createElement, type ReactNode } from "react";

// #region Property
export interface ServerListVisibleColumn
{
    /** Grid 欄位 key */
    key: string;

    /** ModelDisplayName 對應表格代號 */
    tableId?: string;

    /** ModelDisplayName 對應欄位代號 */
    columnId?: string;

    /** 找不到 ModelDisplayName 時的預設標題 */
    fallback?: string;
}

export interface ServerListColumnBuildOptions
{
    /** 依欄位 key 建立 fallback 標題 */
    buildFallback?: (key: string) => string;
}

type ServerListColumnSource = string | ServerListVisibleColumn;

type ServerListCategoryTextValue =
    | string
    | {
        _CategoryDetail?: ({ Lang?: Lang | string | null; CategoryName?: string | null; } | null)[] | null;
    }
    | null
    | undefined;

type ServerListTagTextValue =
    | string
    | {
        _TagDetail?: ({ Lang?: Lang | string | null; TagName?: string | null; } | null)[] | null;
    }
    | null
    | undefined;
// #endregion

// #region Public
/** 取得 SearchValue 的文字值，空字串統一轉為 undefined */
export const getServerSearchStringValue = (value: unknown): string | undefined =>
{
    if (typeof value !== "string") return undefined;

    const text = value.trim();
    return text.length > 0 ? text : undefined;
};
/** 依欄位代碼取得 ModelDisplayName 顯示文字 */
export const getServerColumnTitle = (modelDisplayName: ModelDisplaySchema | null, columnId: string, fallback: string): string =>
{
    const tables = modelDisplayName?.Tables ?? [];
    const hit = tables.flatMap((table) => table.Columns ?? []).find((column) => column.ColumnId === columnId);
    return hit?.ColumnDisplayName ?? fallback;
};
/** 依表格與欄位代碼取得 ModelDisplayName 顯示文字 */
export const getServerTableColumnTitle = (modelDisplayName: ModelDisplaySchema | null, tableId: string, columnId: string, fallback: string): string =>
{
    const table = modelDisplayName?.Tables?.find((item) => item.TableId === tableId);
    const hit = table?.Columns?.find((item) => item.ColumnId === columnId);
    return hit?.ColumnDisplayName ?? fallback;
};
/** 建立 ListGrid 欄位定義 */
export const buildServerListColumns = (
    source: ServerListColumnSource[],
    modelDisplayName: ModelDisplaySchema | null,
    opt: ServerListColumnBuildOptions = {},
): ColumnConfig[] =>
{
    return source.map((item) => buildServerListColumn(item, modelDisplayName, opt));
};
/** 建立 SearchBar 下拉選項 */
export const buildServerListSelectOptions = (map: Record<string, string>): SearchFieldConfig["options"] =>
{
    return Object.entries(map).filter(([key]) => Boolean(key)).map(([value, title]) => ({ value, title: title || value }));
};
/** 將逗號分隔代碼轉為清單節點 */
export const buildServerListIdListNode = (ids: string | null | undefined, map: Record<string, string>): ReactNode =>
{
    const names = (ids ?? "").split(",").map((item) => item.trim()).filter(Boolean).map((id) => map[id] ?? id);

    return createElement(
        "ul",
        { className: "m-0 p-0", style: { listStylePosition: "inside" } },
        buildServerListIdNodes(names),
    );
};
/** 將單一代碼轉成顯示文字 */
export const mapServerListIdToText = (id: string | number | null | undefined, map: Record<string, string>): string =>
{
    const key = id == null ? "" : String(id);
    return key ? (map[key] ?? key) : "";
};
/** 將分類 Hook 回傳值轉成文字 map */
export const buildServerCategoryTextMap = (source: Record<string, ServerListCategoryTextValue>, lang: Lang): Record<string, string> =>
{
    return Object.entries(source).reduce<Record<string, string>>((acc, [key, value]) =>
    {
        acc[key] = getServerCategoryText(value, lang);
        return acc;
    }, {});
};
/** 將標籤 Hook 回傳值轉成文字 map */
export const buildServerTagTextMap = (source: Record<string, ServerListTagTextValue>, lang: Lang): Record<string, string> =>
{
    return Object.entries(source).reduce<Record<string, string>>((acc, [key, value]) =>
    {
        acc[key] = getServerTagText(value, lang);
        return acc;
    }, {});
};
// #endregion

// #region Private
/** 建立單一 ListGrid 欄位定義 */
const buildServerListColumn = (source: ServerListColumnSource, modelDisplayName: ModelDisplaySchema | null, opt: ServerListColumnBuildOptions): ColumnConfig =>
{
    const key = typeof source === "string" ? source : source.key;
    const columnId = typeof source === "string" ? source : source.columnId;
    const fallback = getServerListColumnFallback(source, key, opt);
    const title = getServerListColumnTitle(source, modelDisplayName, columnId, fallback);

    return { key, title };
};

/** 建立欄位 fallback 標題 */
const getServerListColumnFallback = (source: ServerListColumnSource, key: string, opt: ServerListColumnBuildOptions): string =>
{
    if (typeof source !== "string" && source.fallback) return source.fallback;
    return opt.buildFallback?.(key) ?? `【${key}】`;
};

/** 取得欄位顯示標題 */
const getServerListColumnTitle = (source: ServerListColumnSource, modelDisplayName: ModelDisplaySchema | null, columnId: string | undefined, fallback: string): string =>
{
    if (!columnId) return fallback;
    if (typeof source !== "string" && source.tableId) return getServerTableColumnTitle(modelDisplayName, source.tableId, columnId, fallback);
    return getServerColumnTitle(modelDisplayName, columnId, fallback);
};

/** 建立代碼清單節點內容 */
const buildServerListIdNodes = (names: string[]): ReactNode[] =>
{
    return names.map((line, index) => createElement("li", { key: `${line}-${index}`, className: "m-0 p-0" }, line));
};

/** 取得分類顯示文字 */
const getServerCategoryText = (value: ServerListCategoryTextValue, lang: Lang): string =>
{
    if (!value) return "";
    if (typeof value === "string") return value;
    return findTextByKey(value._CategoryDetail, (detail) => detail?.Lang, lang, (detail) => detail?.CategoryName);
};

/** 取得標籤顯示文字 */
const getServerTagText = (value: ServerListTagTextValue, lang: Lang): string =>
{
    if (!value) return "";
    if (typeof value === "string") return value;
    return findTextByKey(value._TagDetail, (detail) => detail?.Lang, lang, (detail) => detail?.TagName);
};
// #endregion
