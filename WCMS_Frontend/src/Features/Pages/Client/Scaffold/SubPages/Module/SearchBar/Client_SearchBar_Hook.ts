import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

/** 搜尋欄位類型 */
export type ClientSearchFieldType = "text" | "select" | "date" | "month";

/** 搜尋按鈕位置 */
export type ClientSearchActionAlign = "left" | "right";

/** 下拉選單項目 */
export interface ClientSearchFieldOption
{
    label: string;
    value: string;
    disabled?: boolean;
}

/** 搜尋欄位設定 */
export interface ClientSearchField
{
    key: string;
    label: string;
    type: ClientSearchFieldType;
    placeholder?: string;
    options?: ClientSearchFieldOption[];
    disabled?: boolean;
    hidden?: boolean;
    maxLength?: number;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}

/** 搜尋條件值 */
export interface ClientSearchValues
{
    [key: string]: string;
}

/** Hook 傳入參數 */
export interface UseClientSearchBarProps
{
    fields: ClientSearchField[];
    defaultValues?: ClientSearchValues;
    resetPageKey?: string;
    onSearch?: (values: ClientSearchValues) => void;
    onReset?: () => void;
}

/** Hook 回傳資料 */
export interface UseClientSearchBarReturn
{
    values: ClientSearchValues;
    visibleFields: ClientSearchField[];
    fieldRows: ClientSearchField[][];
    getFieldId: (fieldKey: string) => string;
    handleFieldChange: (fieldKey: string, event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSearch: (event?: FormEvent<HTMLFormElement>) => void;
    handleReset: () => void;
}

/** 前台搜尋列共用 Hook */
export const useClientSearchBar = (
    { fields, defaultValues = {}, resetPageKey = "page", onSearch, onReset }: UseClientSearchBarProps,
): UseClientSearchBarReturn =>
{
    const [searchParams, setSearchParams] = useSearchParams();

    /** 取得目前 URL query 字串 */
    const searchText = useMemo(() =>
    {
        return searchParams.toString();
    }, [searchParams]);

    /** 過濾不顯示的欄位 */
    const visibleFields = useMemo(() =>
    {
        return fields.filter((field) => !field.hidden);
    }, [fields]);

    /** 建立搜尋條件初始值 */
    const createInitialValues = (): ClientSearchValues =>
    {
        const nextValues: ClientSearchValues = {};

        fields.forEach((field) =>
        {
            nextValues[field.key] = searchParams.get(field.key) ?? defaultValues[field.key] ?? "";
        });

        return nextValues;
    };

    const [values, setValues] = useState<ClientSearchValues>(() => createInitialValues());

    /** URL query 改變時，同步回搜尋條件 */
    useEffect(() =>
    {
        setValues(createInitialValues());
    }, [searchText, fields]);

    /** 將欄位切成兩欄一列 */
    const fieldRows = useMemo(() =>
    {
        const rows: ClientSearchField[][] = [];

        visibleFields.forEach((field, index) =>
        {
            const rowIndex = Math.floor(index / 2);

            if (!rows[rowIndex])
            {
                rows[rowIndex] = [];
            }

            rows[rowIndex].push(field);
        });

        return rows;
    }, [visibleFields]);

    /** 建立欄位 id，供 label 與 input 對應 */
    const getFieldId = (fieldKey: string): string =>
    {
        return `client-search-${fieldKey}`;
    };

    /** 更新單一搜尋欄位 */
    const handleFieldChange = (fieldKey: string, event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void =>
    {
        const nextValue = event.target.value;

        setValues((prev) => ({ ...prev, [fieldKey]: nextValue }));
    };

    /** 將搜尋條件寫入 URL query */
    const updateSearchParams = (nextValues: ClientSearchValues): void =>
    {
        const nextParams = new URLSearchParams(searchParams);

        fields.forEach((field) =>
        {
            const value = nextValues[field.key]?.trim() ?? "";

            if (value)
            {
                nextParams.set(field.key, value);
                return;
            }

            nextParams.delete(field.key);
        });

        nextParams.set(resetPageKey, "1");
        setSearchParams(nextParams);
    };

    /** 送出搜尋 */
    const handleSearch = (event?: FormEvent<HTMLFormElement>): void =>
    {
        event?.preventDefault();

        updateSearchParams(values);
        onSearch?.(values);
    };

    /** 重置搜尋條件 */
    const handleReset = (): void =>
    {
        const nextParams = new URLSearchParams(searchParams);
        const resetValues: ClientSearchValues = {};

        fields.forEach((field) =>
        {
            resetValues[field.key] = "";
            nextParams.delete(field.key);
        });

        nextParams.delete(resetPageKey);
        setValues(resetValues);
        setSearchParams(nextParams);
        onReset?.();
    };

    return { values, visibleFields, fieldRows, getFieldId, handleFieldChange, handleSearch, handleReset };
};
