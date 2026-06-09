import { LibText } from "@/SysCore/Utils/Library/LibData";

// #region Property
export type SurveyInputValue = string | string[];
export type SurveyInputValueMap = Record<string, SurveyInputValue>;

// #region Property
export interface SurveyInputItem
{
    SurveyId?: string | null;
    RowId?: number | null;
    FieldId?: string | null;
    IsRequired?: boolean | null;
    InputType?: number | string | null;
    Options?: string | null;
}
export interface SurveyInputLangItem
{
    SurveyId?: string | null;
    ParentRowId?: number | null;
    RowId?: number | null;
    Lang?: string | null;
    FieldName?: string | null;
}
export interface SurveyInputOption
{
    value: string;
    label: string;
}
/** Survey 動態欄位類型，需與後端 LibInputType 對齊 */
export const SURVEY_INPUT_TYPE = {
    Text: 1,
    TextArea: 2,
    Email: 3,
    Phone: 4,
    Number: 5,
    Date: 6,
    Radio: 10,
    Select: 11,
    Checkbox: 20,
} as const;
/** 問卷輸入類型文字對照 */
const SURVEY_INPUT_TYPE_NAME_MAP: Record<string, number> = {
    text: SURVEY_INPUT_TYPE.Text,
    textarea: SURVEY_INPUT_TYPE.TextArea,
    email: SURVEY_INPUT_TYPE.Email,
    phone: SURVEY_INPUT_TYPE.Phone,
    tel: SURVEY_INPUT_TYPE.Phone,
    number: SURVEY_INPUT_TYPE.Number,
    date: SURVEY_INPUT_TYPE.Date,
    radio: SURVEY_INPUT_TYPE.Radio,
    select: SURVEY_INPUT_TYPE.Select,
    dropbox: SURVEY_INPUT_TYPE.Select,
    dropdown: SURVEY_INPUT_TYPE.Select,
    checkbox: SURVEY_INPUT_TYPE.Checkbox,
};
// #endregion

// #region Public
/** 取得問卷欄位 key */
export const getSurveyFieldKey = (item: SurveyInputItem): string =>
{
    const fieldId = LibText.safeTrim(item.FieldId);
    return fieldId || `RowId_${item.RowId ?? 0}`;
};
/** 正規化問卷欄位類型 */
export const normalizeSurveyInputType = (value: number | string | null | undefined): number =>
{
    if (typeof value === "number") return value;
    const text = LibText.safeTrim(value);
    const numberValue = Number(text);
    if (text && Number.isFinite(numberValue)) return numberValue;
    return SURVEY_INPUT_TYPE_NAME_MAP[text.toLowerCase()] ?? SURVEY_INPUT_TYPE.Text;
};
/** 取得問卷欄位單值 */
export const getSurveyScalarValue = (value: SurveyInputValue): string =>
{
    if (Array.isArray(value)) return value[0] ?? "";
    return LibText.safeTrim(value);
};
/** 取得問卷欄位陣列值 */
export const getSurveyArrayValue = (value: SurveyInputValue): string[] =>
{
    if (Array.isArray(value)) return value;
    const text = LibText.safeTrim(value);
    return text ? [text] : [];
};
/** 判斷問卷語系是否相同 */
export const isSameSurveyLang = (source: string | null | undefined, target: string): boolean =>
{
    return LibText.safeTrim(source).toLowerCase() === LibText.safeTrim(target).toLowerCase();
};
// #endregion
