// #region Public

import { LibText } from "../LibData";

/** 驗證必填資料是否有值 */
export const isRequiredValid = (value: unknown): boolean =>
{
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;

    return true;
};
/** 驗證文字最大長度 */
export const isMaxLengthValid = (value: string | null | undefined, maxLength: number): boolean =>
{
    return (value ?? "").length <= maxLength;
};
/** 驗證文字最小長度 */
export const isMinLengthValid = (value: string | null | undefined, minLength: number): boolean =>
{
    return (value ?? "").length >= minLength;
};
/** 驗證檔案大小是否在限制內 */
export const isFileSizeValid = (file: File | null | undefined, maxBytes: number): boolean =>
{
    if (!file) return true;
    return file.size <= maxBytes;
};

/** 驗證 Email 格式 */
export const isEmailValid = (value: string | null | undefined): boolean =>
{
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(LibText.safeTrim(value));
};
/** 驗證電話格式 */
export const isPhoneValid = (value: string | null | undefined): boolean =>
{
    return /^[0-9+\-#()\s]{6,30}$/.test(LibText.safeTrim(value));
};
/** 驗證數值格式 */
export const isNumberValid = (value: string | number | null | undefined): boolean =>
{
    const text = LibText.safeTrim(value);
    if (!text) return false;
    return Number.isFinite(Number(text));
};
/** 驗證 yyyy-MM-dd 日期格式 */
export const isDateValid = (value: string | null | undefined): boolean =>
{
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(LibText.safeTrim(value));
    if (!match) return false;
    return isValidDateParts({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) });
};
// #endregion

// #region Private
/** 驗證日期拆分值是否為真實日期 */
const isValidDateParts = (p: { year: number; month: number; day: number; }): boolean =>
{
    const date = new Date(p.year, p.month - 1, p.day);
    return date.getFullYear() === p.year && date.getMonth() === p.month - 1 && date.getDate() === p.day;
};
// #endregion
