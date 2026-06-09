import type { ReactNode } from "react";

// #region Property
/** 搜尋欄位類型 */
export type SearchFieldType = "text" | "select" | "checkbox" | "checkboxGroup" | "radio" | "date" | "dateRange" | "custom";


/** 搜尋欄位 Key，可對應 fieldId，也可使用自定義 key */
export type SearchFieldKey = string;


/** 日期區間搜尋值 */
export interface SearchDateRangeValue
{
    from?: string;
    to?: string;
}


/** 搜尋欄位值 */
export type SearchValue = string | string[] | boolean | SearchDateRangeValue | undefined;


/** 搜尋送出後的值集合 */
export type SearchValues = Record<SearchFieldKey, SearchValue>;


/** 搜尋欄位選項 */
export interface SearchOption
{
    value: string;
    title: string;
    disabled?: boolean;
}


/** 搜尋欄位設定 */
export interface SearchFieldConfig
{
    key: SearchFieldKey;
    title: string;
    type: SearchFieldType;
    fieldId?: string;
    placeholder?: string;
    options?: SearchOption[];
    defaultValue?: SearchValue;
    required?: boolean;
    disabled?: boolean;
    helpText?: string;
    slotName?: string;
}


/** 搜尋送出資料 */
export interface SearchSubmitPayload
{
    values: SearchValues;
    fields: SearchFieldConfig[];
}


/** 客製搜尋欄位渲染參數 */
export interface SearchCustomSlotProps
{
    field: SearchFieldConfig;
    value: SearchValue;
    onChange: (value: SearchValue) => void;
}


/** 客製搜尋欄位渲染集合 */
export type SearchCustomSlots = Record<string, (props: SearchCustomSlotProps) => ReactNode>;


/** 搜尋欄位擴充設定 */
export interface SearchFieldExtender
{
    fields?: SearchFieldConfig[];
}


/** 搜尋條件擴充設定 */
export interface SearchConditionExtender<TCondition = string>
{
    buildConditions?: (values: SearchValues) => TCondition[];
}


/** 搜尋功能擴充設定 */
export interface SearchExtender<TCondition = string> extends SearchFieldExtender, SearchConditionExtender<TCondition>
{
}
// #endregion
