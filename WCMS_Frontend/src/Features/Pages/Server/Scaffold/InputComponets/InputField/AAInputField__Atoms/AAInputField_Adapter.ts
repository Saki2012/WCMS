import type { AAFileValue, AAInputField, AAInputFieldAdapterOptions, AAInputFieldAdapterResult, AAInputOption, AAInputValue } from "./AAInputField_Types";
import { getDateRangeValue, normalizeDateRangeBaseDate, normalizeDateRangeValue } from "./Fields/DateRangeField";
import { normalizeDateTimeRangeBaseDate, normalizeDateTimeRangeValue } from "./Fields/DateTimeRangeField";
import { buildAdapterBaseId, defaultAccept, normalizeAcceptText, normalizeAdapterOptionalText, normalizeAdapterText, sanitizeFileName, stringifyValue, toFileArray, toStringArray } from "./AAInputField_Utils";

/**
 * 將 SSR loader 與 CSR 狀態傳進來的欄位資料集中正規化。
 * 後續若要接 WCMS Feature Adapter，可直接在該層先呼叫此方法，確保兩端輸出一致。
 */
export const buildAAInputFieldAdapter = (options: AAInputFieldAdapterOptions): AAInputFieldAdapterResult =>
{
    const baseId = buildAdapterBaseId(options.baseId);
    const fields = options.fields.map((field) => adaptAAInputField(field));
    return { baseId, fields };
};

/** 正規化單一欄位，避免 SSR 與 CSR 對 null、undefined、選項、檔案值解讀不同。 */
export const adaptAAInputField = (field: AAInputField): AAInputField =>
{
    const type = field.type;
    const options = adaptInputOptions(field.options);
    const value = adaptInputValue({ ...field, type, options });

    return {
        ...field,
        type,
        value,
        options,
        label: normalizeAdapterText(field.label, "未命名欄位"),
        aaLabel: normalizeAdapterOptionalText(field.aaLabel),
        helpText: normalizeAdapterOptionalText(field.helpText),
        errorText: normalizeAdapterOptionalText(field.errorText),
        placeholder: normalizeAdapterOptionalText(field.placeholder),
        searchPlaceholder: normalizeAdapterOptionalText(field.searchPlaceholder),
        emptyText: normalizeAdapterOptionalText(field.emptyText),
        accept: field.type === "file" ? normalizeAcceptText(field.accept ?? defaultAccept) : field.accept,
        maxFileCount: field.type === "file" ? Math.max(1, field.maxFileCount ?? 1) : field.maxFileCount,
        maxFileSizeMB: field.type === "file" ? Math.max(1, field.maxFileSizeMB ?? 10) : field.maxFileSizeMB,
        maxSearchLength: Math.max(1, field.maxSearchLength ?? 80),
        calendarBaseDate: type === "dateRange" ? normalizeDateRangeBaseDate(field.calendarBaseDate, value) : type === "dateTimeRange" ? normalizeDateTimeRangeBaseDate(field.calendarBaseDate, value) : field.calendarBaseDate,
    };
};

/** 正規化選項，讓搜尋、朗讀與 render 都只處理純文字。 */
const adaptInputOptions = (options?: AAInputOption[]): AAInputOption[] =>
{
    return (options ?? []).map((item) => ({ value: normalizeAdapterText(item.value, ""), label: normalizeAdapterText(item.label, item.value), disabled: item.disabled }));
};

/** 正規化欄位值，讓 SSR/CSR hydrated 後不會因型別差異造成不同畫面。 */
const adaptInputValue = (field: AAInputField): AAInputValue =>
{
    if (field.type === "checkboxSingle") return Boolean(field.value);
    if (field.type === "dateRange") return normalizeDateRangeValue(field.value);
    if (field.type === "dateTimeRange") return normalizeDateTimeRangeValue(field.value);
    if (field.type === "selectMultiple" || field.type === "checkboxMultiple") return normalizeSelectedStringArray(field.value, field.options ?? []);
    if (field.type === "file") return toFileArray(field.value).map((item) => ({ ...item, name: sanitizeFileName(item.name), url: sanitizePreviewUrl(item.url ?? "") }));
    if (field.type === "number") return field.value === null || field.value === undefined ? "" : stringifyValue(field.value);
    return typeof field.value === "boolean" ? String(field.value) : stringifyValue(field.value);
};

/** 多選值只保留字串，並去除重複。 */
const normalizeSelectedStringArray = (value: AAInputValue, options: AAInputOption[]) =>
{
    const valueList = toStringArray(value).map((item) => normalizeAdapterText(item, "")).filter(Boolean);
    const optionSet = new Set(options.map((item) => item.value));
    const filteredList = optionSet.size === 0 ? valueList : valueList.filter((item) => optionSet.has(item));
    return Array.from(new Set(filteredList));
};

/** 避免預覽網址使用 javascript 等不安全協定。 */
const sanitizePreviewUrl = (value: string) =>
{
    const url = value.trim();
    if (!url) return "";
    if (url.startsWith("/") || url.startsWith("blob:") || url.startsWith("https://") || url.startsWith("http://")) return url;
    return "";
};
