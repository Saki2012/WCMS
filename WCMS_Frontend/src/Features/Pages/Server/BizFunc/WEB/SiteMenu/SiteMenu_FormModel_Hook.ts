import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibJson } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import {
    SiteMenu_IndexFields,
    SiteMenu_ItemFields,
    SiteMenu_Item_ModuleFields,
    SiteMenu_Item_TitleFields,
    SiteMenu_Item_UrlFields,
} from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";

// #region Property
export type SiteMenuFormModel = components["schemas"]["SiteMenu_Index"];
export type SiteMenuIndexInfo = components["schemas"]["SiteMenu_IndexInfo"];
export type SiteMenuItemModel = components["schemas"]["SiteMenu_Item"];
export type SiteMenuItemTitle = components["schemas"]["SiteMenu_Item_Title"];
export type SiteMenuItemUrl = components["schemas"]["SiteMenu_Item_Url"];
export type SiteMenuItemModule = components["schemas"]["SiteMenu_Item_Module"];

type FieldMode = "string" | "number" | "boolean" | "datetime" | ((value: unknown) => unknown);
type RowKeys = Record<string, string | number | boolean | null | undefined>;
type FieldBind = {
    ColumnDisplayName: string;
    InputValue: any;
    OnChange: (value: any) => void;
    Input: any;
    onChange: (value: any) => void;
};

export type SiteMenuGraphField = (
    tableName: string,
    fieldName: string,
    mode?: FieldMode,
    rowKeys?: RowKeys | null,
) => FieldBind;

export interface SiteMenuJsonFieldBinder<TJson extends object>
{
    get: () => TJson;
    set: (next: TJson) => void;
    bind: <K extends keyof TJson>(key: K, mode?: "string" | "number" | "csv" | "boolean") => {
        value: any;
        onChange: (value: any) => void;
    };
}
// #endregion

// #region Public
/** 建立 SiteMenu FormModel 的 Root、Detail 與巢狀 SubDetail 欄位綁定器。 */
export const useSiteMenuGraphField = (formData: UseFetchFormDataResult<SiteMenuFormModel>): SiteMenuGraphField =>
{
    return useCallback((tableName, fieldName, mode: FieldMode = "string", rowKeys?: RowKeys | null): FieldBind =>
    {
        const rawValue = readGraphField(formData.data, tableName, fieldName, rowKeys);
        const inputValue = coerceForInput(rawValue, mode);
        const onChange = (value: unknown): void =>
        {
            const nextValue = coerceForModel(value, mode);
            formData.setFormData(prev => updateGraphField(prev, tableName, fieldName, nextValue, rowKeys));
        };
        const label = resolveColumnDisplayName(formData.displayName, tableName, fieldName);
        return { ColumnDisplayName: label, InputValue: inputValue, OnChange: onChange, Input: inputValue, onChange };
    }, [formData.data, formData.displayName, formData.setFormData]);
};

/** 建立 SiteMenu 模組設定 JSON 欄位綁定器。 */
export const useSiteMenuModuleJsonField = <TJson extends object>(
    formData: UseFetchFormDataResult<SiteMenuFormModel>,
    itemRowId: number,
    defaults: TJson,
): SiteMenuJsonFieldBinder<TJson> =>
{
    const setField = useSiteMenuGraphField(formData);
    const rowKeys = useMemo(() => ({ [SiteMenu_Item_ModuleFields.ItemRowId]: itemRowId }), [itemRowId]);
    const base = useMemo(() =>
    {
        return setField(SiteMenu_ItemFields._SiteMenu_Item_Module, SiteMenu_Item_ModuleFields.ModuleOptions, "string", rowKeys);
    }, [rowKeys, setField]);
    const get = useCallback((): TJson =>
    {
        return LibJson.parseJsonRecordWithFallback(String(base.InputValue ?? ""), defaults as Record<string, unknown>) as TJson;
    }, [base.InputValue, defaults]);
    const set = useCallback((next: TJson): void =>
    {
        base.onChange(LibJson.stringifyJson(next));
    }, [base]);
    const bind = useCallback(<K extends keyof TJson>(key: K, mode: "string" | "number" | "csv" | "boolean" = "string") =>
    {
        const json = get();
        const value = resolveJsonInputValue(json[key], mode);
        const onChange = (input: unknown): void =>
        {
            set({ ...json, [key]: resolveJsonModelValue(input, mode) });
        };
        return { value, onChange };
    }, [get, set]);
    return { get, set, bind };
};

/** 依 RowId 取得目前最新的 SiteMenu Item。 */
export const findSiteMenuItem = (data: SiteMenuFormModel, rowId: number): SiteMenuItemModel | undefined =>
{
    return (data._SiteMenu_Item ?? []).find(item => Number(item.RowId) === Number(rowId));
};

/** 取得指定 SiteMenu Item 的語系標題。 */
export const getSiteMenuItemTitles = (item?: SiteMenuItemModel | null): SiteMenuItemTitle[] =>
{
    return item?._SiteMenu_Item_Title ?? [];
};
// #endregion

// #region Private
/** 讀取 FormModel 指定 Graph 欄位。 */
const readGraphField = (
    data: SiteMenuFormModel,
    tableName: string,
    fieldName: string,
    rowKeys?: RowKeys | null,
): unknown =>
{
    if (tableName === "" || tableName === "SiteMenu_Index") return data?.[fieldName as keyof SiteMenuFormModel];
    if (tableName === SiteMenu_IndexFields._SiteMenu_IndexInfo)
    {
        return (findRow(data._SiteMenu_IndexInfo ?? [], rowKeys) as Record<string, unknown> | undefined)?.[fieldName];
    }
    const item = findItemByKeys(data, rowKeys);
    if (!item) return undefined;
    if (tableName === SiteMenu_IndexFields._SiteMenu_Item) return item[fieldName as keyof SiteMenuItemModel];
    if (tableName === SiteMenu_ItemFields._SiteMenu_Item_Title)
    {
        return (findRow(item._SiteMenu_Item_Title ?? [], rowKeys) as Record<string, unknown> | undefined)?.[fieldName];
    }
    if (tableName === SiteMenu_ItemFields._SiteMenu_Item_Url) return item._SiteMenu_Item_Url?.[fieldName as keyof SiteMenuItemUrl];
    if (tableName === SiteMenu_ItemFields._SiteMenu_Item_Module) return item._SiteMenu_Item_Module?.[fieldName as keyof SiteMenuItemModule];
    return undefined;
};

/** 寫回 FormModel 指定 Graph 欄位。 */
const updateGraphField = (
    data: SiteMenuFormModel,
    tableName: string,
    fieldName: string,
    value: unknown,
    rowKeys?: RowKeys | null,
): SiteMenuFormModel =>
{
    if (tableName === "" || tableName === "SiteMenu_Index") return { ...data, [fieldName]: value };
    if (tableName === SiteMenu_IndexFields._SiteMenu_IndexInfo)
    {
        const details = upsertRow(data._SiteMenu_IndexInfo ?? [], rowKeys, fieldName, value);
        return { ...data, _SiteMenu_IndexInfo: details };
    }
    const items = updateItemCollection(data._SiteMenu_Item ?? [], rowKeys, item => updateItemGraph(item, tableName, fieldName, value, rowKeys));
    return { ...data, _SiteMenu_Item: items };
};

/** 更新單筆 SiteMenu Item 的 Root 或巢狀欄位。 */
const updateItemGraph = (
    item: SiteMenuItemModel,
    tableName: string,
    fieldName: string,
    value: unknown,
    rowKeys?: RowKeys | null,
): SiteMenuItemModel =>
{
    if (tableName === SiteMenu_IndexFields._SiteMenu_Item) return { ...item, [fieldName]: value };
    if (tableName === SiteMenu_ItemFields._SiteMenu_Item_Title)
    {
        const titles = upsertRow(item._SiteMenu_Item_Title ?? [], rowKeys, fieldName, value);
        return { ...item, _SiteMenu_Item_Title: titles };
    }
    if (tableName === SiteMenu_ItemFields._SiteMenu_Item_Url)
    {
        const current = item._SiteMenu_Item_Url ?? buildItemUrl(rowKeys);
        return { ...item, _SiteMenu_Item_Url: { ...current, [fieldName]: value } };
    }
    if (tableName === SiteMenu_ItemFields._SiteMenu_Item_Module)
    {
        const current = item._SiteMenu_Item_Module ?? buildItemModule(rowKeys);
        return { ...item, _SiteMenu_Item_Module: { ...current, [fieldName]: value } };
    }
    return item;
};

/** 依 Item RowId 更新集合；不存在時不建立幽靈選單。 */
const updateItemCollection = (
    items: SiteMenuItemModel[],
    rowKeys: RowKeys | null | undefined,
    updater: (item: SiteMenuItemModel) => SiteMenuItemModel,
): SiteMenuItemModel[] =>
{
    const rowId = resolveItemRowId(rowKeys);
    let changed = false;
    const nextItems = items.map(item =>
    {
        if (Number(item.RowId) !== rowId) return item;
        const nextItem = updater(item);
        changed = nextItem !== item;
        return nextItem;
    });
    return changed ? nextItems : items;
};

/** 依 RowKeys 找出 Item。 */
const findItemByKeys = (data: SiteMenuFormModel, rowKeys?: RowKeys | null): SiteMenuItemModel | undefined =>
{
    const rowId = resolveItemRowId(rowKeys);
    return findSiteMenuItem(data, rowId);
};

/** 從不同 Detail Key 中解析 ItemRowId。 */
const resolveItemRowId = (rowKeys?: RowKeys | null): number =>
{
    return Number(rowKeys?.[SiteMenu_ItemFields.RowId] ?? rowKeys?.[SiteMenu_Item_TitleFields.ItemRowId]
        ?? rowKeys?.[SiteMenu_Item_UrlFields.ItemRowId] ?? rowKeys?.[SiteMenu_Item_ModuleFields.ItemRowId] ?? 0);
};

/** 依 RowKeys 取得集合資料列。 */
const findRow = <TRow extends object>(rows: TRow[], rowKeys?: RowKeys | null): TRow | undefined =>
{
    if (!rowKeys) return rows[0];
    return rows.find(row => matchesRowKeys(row as Record<string, unknown>, rowKeys));
};

/** 寫回集合欄位，找不到資料列時以 RowKeys 建立。 */
const upsertRow = <TRow extends object>(
    rows: TRow[],
    rowKeys: RowKeys | null | undefined,
    fieldName: string,
    value: unknown,
): TRow[] =>
{
    const index = rows.findIndex(row => matchesRowKeys(row as Record<string, unknown>, rowKeys));
    if (index < 0) return [...rows, { ...(rowKeys ?? {}), [fieldName]: value } as TRow];
    return rows.map((row, rowIndex) => rowIndex === index ? { ...row, [fieldName]: value } : row);
};

/** 判斷資料列是否符合指定 Keys。 */
const matchesRowKeys = (row: Record<string, unknown>, rowKeys?: RowKeys | null): boolean =>
{
    if (!rowKeys) return true;
    return Object.entries(rowKeys).every(([key, value]) => value == null || String(row[key] ?? "") === String(value));
};

/** 建立尚未存在的 URL SubDetail。 */
const buildItemUrl = (rowKeys?: RowKeys | null): SiteMenuItemUrl =>
{
    return { ItemRowId: resolveItemRowId(rowKeys), RedirectType: 1, RedirectUrl: "" } as SiteMenuItemUrl;
};

/** 建立尚未存在的 Module SubDetail。 */
const buildItemModule = (rowKeys?: RowKeys | null): SiteMenuItemModule =>
{
    return { ItemRowId: resolveItemRowId(rowKeys), PageType: 0, ModuleProgId: "", ModuleOptions: "" } as SiteMenuItemModule;
};

/** 轉換畫面顯示值。 */
const coerceForInput = (value: unknown, mode: FieldMode): unknown =>
{
    if (typeof mode === "function") return mode(value);
    if (mode === "boolean") return normalizeBoolean(value);
    if (mode === "number") return Number.isFinite(Number(value)) ? Number(value) : 0;
    return String(value ?? "");
};

/** 轉換寫回 Model 的值。 */
const coerceForModel = (value: unknown, mode: FieldMode): unknown =>
{
    if (typeof mode === "function") return mode(value);
    if (mode === "boolean") return normalizeBoolean(value);
    if (mode === "number") return Number.isFinite(Number(value)) ? Number(value) : 0;
    return value == null ? "" : String(value);
};

/** 取得欄位顯示名稱。 */
const resolveColumnDisplayName = (schema: ModelDisplaySchema | null | undefined, tableName: string, fieldName: string): string =>
{
    const normalizedTable = tableName.replace(/^_/, "");
    const table = schema?.Tables?.find(item => item.TableId === tableName || item.TableId === normalizedTable);
    const column = table?.Columns?.find(item => item.ColumnId === fieldName);
    return column?.ColumnDisplayName || `【${fieldName}】`;
};

/** 轉換 JSON Binder 畫面值。 */
const resolveJsonInputValue = (value: unknown, mode: "string" | "number" | "csv" | "boolean"): unknown =>
{
    if (mode === "csv") return String(value ?? "").split(",").map(item => item.trim()).filter(Boolean);
    if (mode === "number") return Number.isFinite(Number(value)) ? Number(value) : 0;
    if (mode === "boolean") return normalizeBoolean(value);
    return String(value ?? "");
};

/** 轉換 JSON Binder 寫回值。 */
const resolveJsonModelValue = (value: unknown, mode: "string" | "number" | "csv" | "boolean"): unknown =>
{
    if (mode === "csv") return Array.isArray(value) ? value.join(",") : String(value ?? "");
    if (mode === "number") return Number.isFinite(Number(value)) ? Number(value) : 0;
    if (mode === "boolean") return normalizeBoolean(value);
    return String(value ?? "");
};

/** 正規化 API、JSON 與 UI 可能提供的 boolean 值。 */
const normalizeBoolean = (value: unknown): boolean =>
{
    if (value === true || value === false) return value;
    const raw = String(value ?? "").trim().toLowerCase();
    return raw === "true" || raw === "1";
};
// #endregion
