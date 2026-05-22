import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { ChangeEvent, FormEvent, HTMLAttributes } from "react";
import { useEffect, useMemo, useState } from "react";

/** 搜尋欄位類型 */
export type ClientSearchFieldType = "text" | "search" | "select" | "date" | "month" | "number";

/** 搜尋按鈕位置 */
export type ClientSearchActionAlign = "left" | "right";

/** 下拉選單項目 */
export interface ClientSearchFieldOption
{
    label: string;
    value: string;
    disabled?: boolean;
}

/** 前台搜尋欄位標準化結果 */
export interface ClientSearchFieldViewModel
{
    key: string;
    label: string;
    type: ClientSearchFieldType;
    placeholder?: string;
    options?: ClientSearchFieldOption[];
    disabled?: boolean;
    hidden?: boolean;
    maxLength?: number;
    inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}

/** Hook 傳入參數 */
export interface UseClientSearchBarProps
{
    fields: SearchFieldConfig[];
    values?: SearchValues;
    columnCount?: 1 | 2 | 3;
    onSearch?: (values: SearchValues) => void;
    onReset?: () => void;
}

/** Hook 回傳資料 */
export interface UseClientSearchBarReturn
{
    values: SearchValues;
    visibleFields: ClientSearchFieldViewModel[];
    fieldRows: ClientSearchFieldViewModel[][];
    columnCount: 1 | 2 | 3;
    getFieldId: (fieldKey: string) => string;
    handleFieldChange: (fieldKey: string, event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSearch: (event?: FormEvent<HTMLFormElement>) => void;
    handleReset: () => void;
}

/** 轉成可安全存取的物件 */
const toRecord = (value: unknown): Record<string, unknown> =>
{
    return value && typeof value === "object" ? value as Record<string, unknown> : {};
};

/** 讀取字串欄位 */
const getStringValue = (source: Record<string, unknown>, keys: string[]): string | undefined =>
{
    const value = keys.map(key => source[key]).find(item => typeof item === "string" && item.trim().length > 0);
    return typeof value === "string" ? value : undefined;
};

/** 讀取布林欄位 */
const getBooleanValue = (source: Record<string, unknown>, keys: string[]): boolean | undefined =>
{
    const value = keys.map(key => source[key]).find(item => typeof item === "boolean");
    return typeof value === "boolean" ? value : undefined;
};

/** 讀取數字欄位 */
const getNumberValue = (source: Record<string, unknown>, keys: string[]): number | undefined =>
{
    const value = keys.map(key => source[key]).find(item => typeof item === "number");
    return typeof value === "number" ? value : undefined;
};

/** 將外部欄位類型轉為前台可渲染類型 */
const normalizeFieldType = (type?: string): ClientSearchFieldType =>
{
    if (type === "select" || type === "date" || type === "month" || type === "number" || type === "search") return type;
    return "text";
};

/** 將下拉選項轉為前台格式 */
const normalizeOptions = (value: unknown): ClientSearchFieldOption[] | undefined =>
{
    if (!Array.isArray(value)) return undefined;

    return value.map((item) =>
    {
        const option = toRecord(item);
        const label = getStringValue(option, ["label", "title", "text", "name"]) ?? `${option.value ?? ""}`;
        const optionValue = getStringValue(option, ["value", "key", "id"]) ?? `${option.value ?? ""}`;
        const disabled = getBooleanValue(option, ["disabled"]);

        return { label, value: optionValue, disabled };
    });
};

/** 將 SearchBar_Data 的欄位設定轉為前台 ViewModel */
const normalizeField = (field: SearchFieldConfig): ClientSearchFieldViewModel =>
{
    const raw = toRecord(field);
    const key = getStringValue(raw, ["key", "name", "field", "fieldKey"]) ?? "";
    const label = getStringValue(raw, ["label", "title", "text", "name"]) ?? key;
    const options = normalizeOptions(raw.options ?? raw.optionList ?? raw.items);

    return {
        key,
        label,
        type: normalizeFieldType(getStringValue(raw, ["type", "inputType"])),
        placeholder: getStringValue(raw, ["placeholder"]),
        options,
        disabled: getBooleanValue(raw, ["disabled"]),
        hidden: getBooleanValue(raw, ["hidden"]),
        maxLength: getNumberValue(raw, ["maxLength"]),
        inputMode: getStringValue(raw, ["inputMode"]) as HTMLAttributes<HTMLInputElement>["inputMode"],
    };
};

/** 讀取搜尋值 */
const getSearchValue = (values: SearchValues | undefined, key: string): string =>
{
    const source = toRecord(values);
    const value = source[key];

    return typeof value === "string" ? value : value == null ? "" : `${value}`;
};

/** 建立搜尋條件初始值 */
const createDraftValues = (fields: ClientSearchFieldViewModel[], values?: SearchValues): SearchValues =>
{
    const nextValues: Record<string, string> = {};

    fields.forEach((field) =>
    {
        if (!field.key) return;
        nextValues[field.key] = getSearchValue(values, field.key);
    });

    return nextValues as SearchValues;
};

/** 整理送出前的搜尋值 */
const trimDraftValues = (values: SearchValues): SearchValues =>
{
    const source = toRecord(values);
    const result: Record<string, string> = {};

    Object.keys(source).forEach((key) =>
    {
        const value = source[key];
        result[key] = typeof value === "string" ? value.trim() : value == null ? "" : `${value}`.trim();
    });

    return result as SearchValues;
};

/** 將欄位切成指定欄數 */
const buildFieldRows = (fields: ClientSearchFieldViewModel[], columnCount: 1 | 2 | 3): ClientSearchFieldViewModel[][] =>
{
    const rows: ClientSearchFieldViewModel[][] = [];

    fields.forEach((field, index) =>
    {
        const rowIndex = Math.floor(index / columnCount);

        if (!rows[rowIndex]) rows[rowIndex] = [];
        rows[rowIndex].push(field);
    });

    return rows;
};

/** 前台搜尋列共用 Hook，不自行操作 URL，資料狀態交由 DataQueryTemplate 管理 */
export const useClientSearchBar = (
    { fields, values, columnCount = 3, onSearch, onReset }: UseClientSearchBarProps,
): UseClientSearchBarReturn =>
{
    const normalizedFields = useMemo(() =>
    {
        return fields.map(normalizeField).filter(field => Boolean(field.key));
    }, [fields]);

    const visibleFields = useMemo(() =>
    {
        return normalizedFields.filter((field) => !field.hidden);
    }, [normalizedFields]);

    const [draftValues, setDraftValues] = useState<SearchValues>(() => createDraftValues(normalizedFields, values));

    useEffect(() =>
    {
        setDraftValues(createDraftValues(normalizedFields, values));
    }, [normalizedFields, values]);

    const fieldRows = useMemo(() =>
    {
        return buildFieldRows(visibleFields, columnCount);
    }, [visibleFields, columnCount]);

    /** 建立欄位 id，供 label 與 input 對應 */
    const getFieldId = (fieldKey: string): string =>
    {
        return `client-search-${fieldKey}`;
    };

    /** 更新單一搜尋欄位 */
    const handleFieldChange = (fieldKey: string, event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void =>
    {
        const nextValue = event.target.value;
        setDraftValues((prev) => ({ ...toRecord(prev), [fieldKey]: nextValue } as SearchValues));
    };

    /** 送出搜尋 */
    const handleSearch = (event?: FormEvent<HTMLFormElement>): void =>
    {
        event?.preventDefault();
        onSearch?.(trimDraftValues(draftValues));
    };

    /** 重置搜尋條件 */
    const handleReset = (): void =>
    {
        const resetValues = createDraftValues(normalizedFields, {} as SearchValues);
        setDraftValues(resetValues);
        onReset?.();
    };

    return { values: draftValues, visibleFields, fieldRows, columnCount, getFieldId, handleFieldChange, handleSearch, handleReset };
};
