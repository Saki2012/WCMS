import { getModelColumnDisplayName } from "@/SysCore/Components/Grid/Grid_ModelDisplay";
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

/** 依 ItemRowId 從整份 FormModel 取得正確關聯的標題資料。 */
export const getSiteMenuItemTitleRows = (data: SiteMenuFormModel, itemRowId: number): SiteMenuItemTitle[] =>
{
    return collectItemTitleRows(data._SiteMenu_Item ?? [])
        .filter(title => Number(title.ItemRowId ?? 0) === Number(itemRowId));
};

/** 依 ItemRowId 從整份 FormModel 取得正確關聯的超連結設定。 */
export const getSiteMenuItemUrlRow = (data: SiteMenuFormModel, itemRowId: number): SiteMenuItemUrl | undefined =>
{
    return buildItemUrlMap(data._SiteMenu_Item ?? []).get(Number(itemRowId));
};

/** 依 Url.ItemRowId 將超連結設定重新掛回正確的 SiteMenu Item。 */
export const normalizeSiteMenuUrlGraph = (data: SiteMenuFormModel): SiteMenuFormModel =>
{
    const current = data._SiteMenu_Item ?? [];
    const items = normalizeItemUrlGraph(current);
    return items === current ? data : { ...data, _SiteMenu_Item: items };
};

/** 依 ItemRowId 從整份 FormModel 取得正確關聯的模組設定。 */
export const getSiteMenuItemModuleRow = (data: SiteMenuFormModel, itemRowId: number): SiteMenuItemModule | undefined =>
{
    return buildItemModuleMap(data._SiteMenu_Item ?? []).get(Number(itemRowId));
};

/** 依 Module.ItemRowId 將模組設定重新掛回正確的 SiteMenu Item。 */
export const normalizeSiteMenuModuleGraph = (data: SiteMenuFormModel): SiteMenuFormModel =>
{
    const current = data._SiteMenu_Item ?? [];
    const items = normalizeItemModuleGraph(current);
    return items === current ? data : { ...data, _SiteMenu_Item: items };
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
    if (tableName === SiteMenu_ItemFields._SiteMenu_Item_Title)
    {
        return (findItemTitleRow(data, rowKeys) as Record<string, unknown> | undefined)?.[fieldName];
    }
    if (tableName === SiteMenu_ItemFields._SiteMenu_Item_Url)
    {
        return (findItemUrlRow(data, rowKeys) as Record<string, unknown> | undefined)?.[fieldName];
    }
    if (tableName === SiteMenu_ItemFields._SiteMenu_Item_Module)
    {
        return (findItemModuleRow(data, rowKeys) as Record<string, unknown> | undefined)?.[fieldName];
    }
    const item = findItemByKeys(data, rowKeys);
    if (!item) return undefined;
    if (tableName === SiteMenu_IndexFields._SiteMenu_Item) return item[fieldName as keyof SiteMenuItemModel];
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
    if (tableName === SiteMenu_ItemFields._SiteMenu_Item_Title)
    {
        return updateItemTitleGraph(data, fieldName, value, rowKeys);
    }
    if (tableName === SiteMenu_ItemFields._SiteMenu_Item_Url)
    {
        return updateItemUrlGraph(data, fieldName, value, rowKeys);
    }
    if (tableName === SiteMenu_ItemFields._SiteMenu_Item_Module)
    {
        return updateItemModuleGraph(data, fieldName, value, rowKeys);
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
    return item;
};

/** 更新 SiteMenu 專用的 Item Title 關聯資料。 */
const updateItemTitleGraph = (
    data: SiteMenuFormModel,
    fieldName: string,
    value: unknown,
    rowKeys?: RowKeys | null,
): SiteMenuFormModel =>
{
    const normalizedItems = normalizeItemTitleGraph(data._SiteMenu_Item ?? []);
    const items = updateItemCollection(normalizedItems, rowKeys, item => updateItemTitle(item, fieldName, value, rowKeys));
    return { ...data, _SiteMenu_Item: items };
};

/** 更新單一選單的標題資料列。 */
const updateItemTitle = (item: SiteMenuItemModel, fieldName: string, value: unknown, rowKeys?: RowKeys | null): SiteMenuItemModel =>
{
    const titles = upsertItemTitleRow(item, fieldName, value, rowKeys);
    return { ...item, _SiteMenu_Item_Title: titles };
};

/** 更新 SiteMenu 專用的 Item Url 關聯資料。 */
const updateItemUrlGraph = (
    data: SiteMenuFormModel,
    fieldName: string,
    value: unknown,
    rowKeys?: RowKeys | null,
): SiteMenuFormModel =>
{
    const normalized = normalizeSiteMenuUrlGraph(data);
    const items = updateItemCollection(normalized._SiteMenu_Item ?? [], rowKeys, item => updateItemUrl(item, fieldName, value, rowKeys));
    return { ...normalized, _SiteMenu_Item: items };
};

/** 更新單一選單的超連結設定。 */
const updateItemUrl = (item: SiteMenuItemModel, fieldName: string, value: unknown, rowKeys?: RowKeys | null): SiteMenuItemModel =>
{
    const current = item._SiteMenu_Item_Url ?? buildItemUrl(item, rowKeys);
    return { ...item, _SiteMenu_Item_Url: { ...current, [fieldName]: value } };
};

/** 更新 SiteMenu 專用的 Item Module 關聯資料。 */
const updateItemModuleGraph = (
    data: SiteMenuFormModel,
    fieldName: string,
    value: unknown,
    rowKeys?: RowKeys | null,
): SiteMenuFormModel =>
{
    const normalized = normalizeSiteMenuModuleGraph(data);
    const items = updateItemCollection(normalized._SiteMenu_Item ?? [], rowKeys, item => updateItemModule(item, fieldName, value, rowKeys));
    return { ...normalized, _SiteMenu_Item: items };
};

/** 更新單一選單的模組設定。 */
const updateItemModule = (item: SiteMenuItemModel, fieldName: string, value: unknown, rowKeys?: RowKeys | null): SiteMenuItemModel =>
{
    const current = item._SiteMenu_Item_Module ?? buildItemModule(item, rowKeys);
    return { ...item, _SiteMenu_Item_Module: { ...current, [fieldName]: value } };
};

/** 依 Parent RowId 重新收斂標題到正確的 SiteMenu Item。 */
const normalizeItemTitleGraph = (items: SiteMenuItemModel[]): SiteMenuItemModel[] =>
{
    const titleRows = collectItemTitleRows(items);
    return items.map(item =>
    {
        const related = titleRows.filter(title => Number(title.ItemRowId ?? 0) === Number(item.RowId ?? 0));
        return isSameItemTitleRows(item._SiteMenu_Item_Title ?? [], related) ? item : { ...item, _SiteMenu_Item_Title: related };
    });
};

/** 依 ItemRowId 將所有超連結設定收斂回正確的選單項目。 */
const normalizeItemUrlGraph = (items: SiteMenuItemModel[]): SiteMenuItemModel[] =>
{
    const urlMap = buildItemUrlMap(items);
    let changed = false;
    const nextItems = items.map(item =>
    {
        const url = urlMap.get(Number(item.RowId ?? 0));
        if (item._SiteMenu_Item_Url === url) return item;
        changed = true;
        return { ...item, _SiteMenu_Item_Url: url };
    });
    return changed ? nextItems : items;
};

/** 依 Url.ItemRowId 建立選單超連結設定索引。 */
const buildItemUrlMap = (items: SiteMenuItemModel[]): Map<number, SiteMenuItemUrl> =>
{
    return items.reduce<Map<number, SiteMenuItemUrl>>((map, parent) =>
    {
        const url = normalizeItemUrlOwner(parent, parent._SiteMenu_Item_Url);
        const itemRowId = Number(url?.ItemRowId ?? 0);
        if (!url || !itemRowId) return map;
        map.set(itemRowId, selectPreferredItemUrl(map.get(itemRowId), url));
        return map;
    }, new Map<number, SiteMenuItemUrl>());
};

/** 補齊超連結設定的 SiteIndex 與 ItemRowId 關聯鍵。 */
const normalizeItemUrlOwner = (parent: SiteMenuItemModel, url?: SiteMenuItemUrl): SiteMenuItemUrl | undefined =>
{
    if (!url) return undefined;
    const siteIndex = url.SiteIndex ?? parent.SiteIndex;
    const itemRowId = Number(url.ItemRowId ?? parent.RowId ?? 0);
    if (siteIndex === url.SiteIndex && itemRowId === url.ItemRowId) return url;
    return { ...url, SiteIndex: siteIndex, ItemRowId: itemRowId } as SiteMenuItemUrl;
};

/** 同一 ItemRowId 重複時優先保留具備實際網址的資料。 */
const selectPreferredItemUrl = (current: SiteMenuItemUrl | undefined, candidate: SiteMenuItemUrl): SiteMenuItemUrl =>
{
    if (!current) return candidate;
    return getItemUrlContentScore(candidate) > getItemUrlContentScore(current) ? candidate : current;
};

/** 計算超連結設定有效內容數量。 */
const getItemUrlContentScore = (url: SiteMenuItemUrl): number =>
{
    const hasUrl = Boolean(String(url.RedirectUrl ?? "").trim());
    const hasType = [1, 2].includes(Number(url.RedirectType ?? 0));
    return Number(hasUrl) + Number(hasType);
};

/** 依 ItemRowId 將所有模組設定收斂回正確的選單項目。 */
const normalizeItemModuleGraph = (items: SiteMenuItemModel[]): SiteMenuItemModel[] =>
{
    const moduleMap = buildItemModuleMap(items);
    let changed = false;
    const nextItems = items.map(item =>
    {
        const module = moduleMap.get(Number(item.RowId ?? 0));
        if (item._SiteMenu_Item_Module === module) return item;
        changed = true;
        return { ...item, _SiteMenu_Item_Module: module };
    });
    return changed ? nextItems : items;
};

/** 依 Module.ItemRowId 建立選單模組設定索引。 */
const buildItemModuleMap = (items: SiteMenuItemModel[]): Map<number, SiteMenuItemModule> =>
{
    return items.reduce<Map<number, SiteMenuItemModule>>((map, parent) =>
    {
        const module = normalizeItemModuleOwner(parent, parent._SiteMenu_Item_Module);
        const itemRowId = Number(module?.ItemRowId ?? 0);
        if (!module || !itemRowId) return map;
        map.set(itemRowId, selectPreferredItemModule(map.get(itemRowId), module));
        return map;
    }, new Map<number, SiteMenuItemModule>());
};

/** 補齊模組設定的 SiteIndex 與 ItemRowId 關聯鍵。 */
const normalizeItemModuleOwner = (parent: SiteMenuItemModel, module?: SiteMenuItemModule): SiteMenuItemModule | undefined =>
{
    if (!module) return undefined;
    const siteIndex = module.SiteIndex ?? parent.SiteIndex;
    const itemRowId = Number(module.ItemRowId ?? parent.RowId ?? 0);
    if (siteIndex === module.SiteIndex && itemRowId === module.ItemRowId) return module;
    return { ...module, SiteIndex: siteIndex, ItemRowId: itemRowId } as SiteMenuItemModule;
};

/** 同一 ItemRowId 重複時優先保留具備實際設定內容的資料。 */
const selectPreferredItemModule = (current: SiteMenuItemModule | undefined, candidate: SiteMenuItemModule): SiteMenuItemModule =>
{
    if (!current) return candidate;
    return getItemModuleContentScore(candidate) > getItemModuleContentScore(current) ? candidate : current;
};

/** 計算模組設定有效內容數量。 */
const getItemModuleContentScore = (module: SiteMenuItemModule): number =>
{
    return [module.BannerId, module.ModuleProgId, module.ModuleOptions].filter(value => String(value ?? "").trim()).length
        + (Number(module.PageType ?? 0) !== 0 ? 1 : 0);
};

/** 收集全部標題，缺少唯讀關聯鍵時由實際 Parent 補齊。 */
const collectItemTitleRows = (items: SiteMenuItemModel[]): SiteMenuItemTitle[] =>
{
    return items.flatMap(parent => (parent._SiteMenu_Item_Title ?? []).map(title => normalizeItemTitleOwner(parent, title)));
};

/** 補齊標題資料的 SiteIndex 與 ItemRowId 關聯鍵。 */
const normalizeItemTitleOwner = (parent: SiteMenuItemModel, title: SiteMenuItemTitle): SiteMenuItemTitle =>
{
    const siteIndex = title.SiteIndex ?? parent.SiteIndex;
    const itemRowId = title.ItemRowId ?? parent.RowId;
    if (siteIndex === title.SiteIndex && itemRowId === title.ItemRowId) return title;
    return { ...title, SiteIndex: siteIndex, ItemRowId: itemRowId } as SiteMenuItemTitle;
};

/** 比較標題集合是否已是相同資料列與順序。 */
const isSameItemTitleRows = (current: SiteMenuItemTitle[], next: SiteMenuItemTitle[]): boolean =>
{
    return current.length === next.length && current.every((title, index) => title === next[index]);
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

/** 依 Parent ItemRowId 與 Detail Key 尋找標題資料列。 */
const findItemTitleRow = (data: SiteMenuFormModel, rowKeys?: RowKeys | null): SiteMenuItemTitle | undefined =>
{
    const itemRowId = resolveItemRowId(rowKeys);
    return getSiteMenuItemTitleRows(data, itemRowId).find(title => matchesItemTitleKeys(title, rowKeys));
};

/** 依 Parent ItemRowId 尋找超連結設定，巢狀位置錯誤時改由完整 Graph 回查。 */
const findItemUrlRow = (data: SiteMenuFormModel, rowKeys?: RowKeys | null): SiteMenuItemUrl | undefined =>
{
    const itemRowId = resolveItemRowId(rowKeys);
    const nested = findSiteMenuItem(data, itemRowId)?._SiteMenu_Item_Url;
    if (nested && Number(nested.ItemRowId ?? itemRowId) === itemRowId) return nested;
    return getSiteMenuItemUrlRow(data, itemRowId);
};

/** 依 Parent ItemRowId 尋找模組設定，巢狀位置錯誤時改由完整 Graph 回查。 */
const findItemModuleRow = (data: SiteMenuFormModel, rowKeys?: RowKeys | null): SiteMenuItemModule | undefined =>
{
    const itemRowId = resolveItemRowId(rowKeys);
    const nested = findSiteMenuItem(data, itemRowId)?._SiteMenu_Item_Module;
    if (nested && Number(nested.ItemRowId ?? itemRowId) === itemRowId) return nested;
    return getSiteMenuItemModuleRow(data, itemRowId);
};

/** 新增或更新單一標題資料列。 */
const upsertItemTitleRow = (
    item: SiteMenuItemModel,
    fieldName: string,
    value: unknown,
    rowKeys?: RowKeys | null,
): SiteMenuItemTitle[] =>
{
    const rows = item._SiteMenu_Item_Title ?? [];
    const index = rows.findIndex(row => matchesItemTitleKeys(row, rowKeys));
    const nextRow = buildItemTitleRow(item, rows[index], rowKeys, fieldName, value);
    if (index < 0) return [...rows, nextRow];
    return rows.map((row, rowIndex) => rowIndex === index ? nextRow : row);
};

/** 建立具備正確 Parent 關聯鍵的標題資料列。 */
const buildItemTitleRow = (
    item: SiteMenuItemModel,
    current: SiteMenuItemTitle | undefined,
    rowKeys: RowKeys | null | undefined,
    fieldName: string,
    value: unknown,
): SiteMenuItemTitle =>
{
    return {
        ...(rowKeys ?? {}),
        ...(current ?? {}),
        SiteIndex: current?.SiteIndex ?? item.SiteIndex,
        ItemRowId: item.RowId,
        [fieldName]: value,
    } as SiteMenuItemTitle;
};

/** 標題 Detail 只用自己的 RowId 與 Lang 辨識資料列。 */
const matchesItemTitleKeys = (row: SiteMenuItemTitle, rowKeys?: RowKeys | null): boolean =>
{
    if (!rowKeys) return true;
    const rowId = rowKeys[SiteMenu_Item_TitleFields.RowId];
    const lang = rowKeys[SiteMenu_Item_TitleFields.Lang];
    return matchesOptionalValue(row.RowId, rowId) && matchesOptionalValue(row.Lang, lang);
};

/** 比對可省略的資料鍵。 */
const matchesOptionalValue = (current: unknown, expected: unknown): boolean =>
{
    return expected == null || String(current ?? "") === String(expected);
};

/** 依 RowKeys 找出 Item。 */
const findItemByKeys = (data: SiteMenuFormModel, rowKeys?: RowKeys | null): SiteMenuItemModel | undefined =>
{
    const rowId = resolveItemRowId(rowKeys);
    return findSiteMenuItem(data, rowId);
};

/** 解析 Parent Item RowId；巢狀 Detail 的 ItemRowId 必須優先於自身 RowId。 */
const resolveItemRowId = (rowKeys?: RowKeys | null): number =>
{
    const detailItemRowId = rowKeys?.[SiteMenu_Item_TitleFields.ItemRowId]
        ?? rowKeys?.[SiteMenu_Item_UrlFields.ItemRowId]
        ?? rowKeys?.[SiteMenu_Item_ModuleFields.ItemRowId];
    return Number(detailItemRowId ?? rowKeys?.[SiteMenu_ItemFields.RowId] ?? 0);
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
const buildItemUrl = (item: SiteMenuItemModel, rowKeys?: RowKeys | null): SiteMenuItemUrl =>
{
    return {
        SiteIndex: item.SiteIndex,
        ItemRowId: resolveItemRowId(rowKeys),
        RedirectType: 1,
        RedirectUrl: "",
    } as SiteMenuItemUrl;
};

/** 建立尚未存在的 Module SubDetail。 */
const buildItemModule = (item: SiteMenuItemModel, rowKeys?: RowKeys | null): SiteMenuItemModule =>
{
    return {
        SiteIndex: item.SiteIndex,
        ItemRowId: resolveItemRowId(rowKeys),
        PageType: 0,
        ModuleProgId: "",
        ModuleOptions: "",
    } as SiteMenuItemModule;
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
    return getModelColumnDisplayName(schema, tableName, fieldName, `【${fieldName}】`);
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
