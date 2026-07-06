import type { ChangeEvent } from "react";
import type { AAFileValue, AAInputField, AAInputType, AAInputValue } from "./AAInputField_Types";

// #region Public
/** 組合 aria-describedby。 */
export const buildDescribedBy = (...ids: string[]) => ids.filter(Boolean).join(" ");


/** 建立欄位 id，避免 key 內特殊字元影響 DOM id。 */
export const buildFieldId = (baseId: string, key: string) => `${baseId}-${key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;


/** 建立一般輸入樣式。 */
export const buildControlClass = (field: AAInputField) => `form-control${field.errorText ? " is-invalid" : ""}`;


/** 建立 select 樣式。 */
export const buildSelectClass = (field: AAInputField) => `form-select${field.errorText ? " is-invalid" : ""}`;


/** 建立 checkbox 樣式。 */
export const buildCheckClass = (field: AAInputField) => `form-check-input${field.errorText ? " is-invalid" : ""}`;


/** 取得 visually-hidden label 文字，可由 aaLabel 自訂；未設定時依欄位型別提供預設 AA 文字。 */
export const getFieldAaLabel = (field: AAInputField) => field.aaLabel || getDefaultFieldAaLabel(field.type);


/** 依欄位型別取得預設 visually-hidden label 文字。 */
export const getDefaultFieldAaLabel = (type: AAInputType) =>
{
    const labelMap: Record<AAInputType, string> = {
        text: "請輸入文字內容",
        email: "請輸入有效電子郵件",
        tel: "請輸入聯絡電話",
        password: "請輸入密碼",
        number: "請輸入數字",
        date: "請選擇日期",
        "date-time": "請選擇日期與時間",
        textarea: "請輸入文字內容(可多行)",
        selectSingle: "請選擇項目",
        selectMultiple: "請選擇項目(可複選)",
        dateRange: "請選擇日期區間",
        dateTimeRange: "請選擇日期與時間區間",
        file: "請上傳檔案",
        radio: "請選擇項目(擇一)",
        checkboxSingle: "請勾選項目",
        checkboxMultiple: "請勾選項目(可複選)",
        readonly: "僅供檢視",
    };

    return labelMap[type] ?? "請輸入文字內容";
};


/** 取得欄位提示文字，畫面可見文字由 hint 負責。 */
export const getHintText = (field: AAInputField) => `${field.helpText || field.label}${field.required ? "(必填)" : ""}`;


/** 只有可編輯欄位才輸出 native required。 */
export const getNativeRequired = (field: AAInputField) => field.required && !field.disabled && !field.readOnly ? true : undefined;


/** 有設定必填時輸出 aria-required，提供輔助科技讀取。 */
export const getAriaRequired = (field: AAInputField) => getNativeRequired(field) ? true : undefined;


/** 有錯誤時才輸出 aria-invalid。 */
export const getAriaInvalid = (field: AAInputField) => field.errorText ? true : undefined;


/** 將欄位值轉成 input 可接受的字串。 */
export const stringifyValue = (value: AAInputValue) => typeof value === "string" || typeof value === "number" ? String(value) : "";


/** 將欄位值轉成字串陣列。 */
export const toStringArray = (value: AAInputValue) => Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];


/** 將欄位值轉成安全檔案陣列。 */
export const toFileArray = (value: AAInputValue) => Array.isArray(value) && value.every(isFileValue) ? value : [];


/** 判斷是否為安全檔案值。 */
export const isFileValue = (value: string | AAFileValue): value is AAFileValue => typeof value !== "string";


/** 限制文字長度並移除 null byte。 */
export const normalizeTextValue = (value: string, maxLength?: number) => value.replace(/\u0000/g, "").slice(0, maxLength ?? value.length);


/** 移除控制字元，保留中文與一般標點。 */
export const normalizeAdapterText = (value: string | undefined, fallback: string) => (value ?? fallback).replace(/[\u0000-\u001F\u007F]/g, "").trim();


/** 處理可省略的顯示文字。 */
export const normalizeAdapterOptionalText = (value?: string) => value === undefined ? undefined : normalizeAdapterText(value, "");


/** 正規化 accept 白名單字串。 */
export const normalizeAcceptText = (value: string) => value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean).join(",");


/** 清理檔名中不適合顯示的控制字元。 */
export const sanitizeFileName = (value: string) => value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 180) || "未命名檔案";


/** 格式化檔案大小。 */
export const formatFileSize = (size: number) => size < 1024 * 1024 ? `${Math.ceil(size / 1024)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;


/** 正規化 adapter base id，避免 React useId 的特殊字元影響 query 與 activedescendant。 */
export const buildAdapterBaseId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "aa-field";



/** 預設允許上傳格式。 */
// export const defaultAccept = ".jpg,.jpeg,.png,.svg,.gif,.pdf,.odf,.odt,.doc,.docx,.xls,.ods,.xlsx,.odp,.txt,.csv,.mp4";
export const defaultAccept = "無限制";


/** 取得 select multiple 的值。 */
export const getSelectedValues = (event: ChangeEvent<HTMLSelectElement>) => Array.from(event.target.selectedOptions).map((option: HTMLOptionElement) => option.value);
// #endregion
