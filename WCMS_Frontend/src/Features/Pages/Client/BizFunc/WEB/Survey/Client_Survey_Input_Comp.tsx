import { type ChangeEvent, type ReactNode, useId, useMemo } from "react";

import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";

export type SurveyInputValue = string | string[];
export type SurveyInputValueMap = Record<string, SurveyInputValue>;

export interface SurveyInputItem
{
    SurveyId?: string | null;
    RowId?: number | null;
    FieldId?: string | null;
    IsRequired?: boolean | null;
    InputType?: number | string | null;
    OptionJson?: string | null;
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

export interface ClientSurveyInputProps
{
    lang: Lang;
    items: SurveyInputItem[];
    itemLangs?: SurveyInputLangItem[];
    values: SurveyInputValueMap;
    onChange: (fieldId: string, value: SurveyInputValue) => void;
    errorMap?: Record<string, string>;
    disabled?: boolean;
    className?: string;
}

/** Survey 動態欄位類型，需與後端 LibInputType 對齊 */
export const SURVEY_INPUT_TYPE = { Text: 1, TextArea: 2, Email: 3, Phone: 4, Number: 5, Date: 6, Radio: 10, Select: 11, Checkbox: 20 } as const;

type JsonPrimitive = string | number | boolean | null;
type JsonObject = { [key: string]: JsonValue; };
type JsonArray = JsonValue[];
type JsonValue = JsonPrimitive | JsonObject | JsonArray;

type SurveyInputText = { required: string; selectPlaceholder: string; optionEmpty: string; };

interface SurveyFieldProps
{
    item: SurveyInputItem;
    itemLangs: SurveyInputLangItem[];
    lang: Lang;
    values: SurveyInputValueMap;
    errorMap: Record<string, string>;
    disabled: boolean;
    onChange: (fieldId: string, value: SurveyInputValue) => void;
}

interface RenderInputProps
{
    baseId: string;
    fieldId: string;
    label: string;
    value: SurveyInputValue;
    inputType: number;
    options: SurveyInputOption[];
    isRequired: boolean;
    isInvalid: boolean;
    describedBy?: string;
    disabled: boolean;
    text: SurveyInputText;
    onChange: (fieldId: string, value: SurveyInputValue) => void;
}

/** Survey 動態欄位主元件 */
const Client_Survey_Input_Comp = (props: ClientSurveyInputProps) =>
{
    const fields = useMemo(() => sortSurveyItems(props.items), [props.items]);
    const itemLangs = props.itemLangs ?? [];
    const errorMap = props.errorMap ?? {};

    return (
        <div className={props.className ?? "survey-input-list"}>
            {fields.map((item) => (
                <SurveyField_Comp
                    key={getFieldKey(item)}
                    item={item}
                    itemLangs={itemLangs}
                    lang={props.lang}
                    values={props.values}
                    errorMap={errorMap}
                    disabled={props.disabled ?? false}
                    onChange={props.onChange}
                />
            ))}
        </div>
    );
};

export default Client_Survey_Input_Comp;

/** 單一 Survey 欄位 */
const SurveyField_Comp = (props: SurveyFieldProps) =>
{
    const reactId = useId();
    const fieldId = getFieldKey(props.item);
    const inputType = normalizeInputType(props.item.InputType);
    const isRequired = props.item.IsRequired === true;
    const label = useMemo(() => getFieldLabel({ item: props.item, itemLangs: props.itemLangs, lang: props.lang }), [props.item, props.itemLangs, props.lang]);
    const options = useMemo(() => buildOptions(props.item.OptionJson), [props.item.OptionJson]);
    const value = props.values[fieldId] ?? "";
    const errorText = props.errorMap[fieldId] ?? "";
    const isInvalid = Boolean(errorText);
    const text = getSurveyInputText(props.lang);
    const baseId = `survey_${reactId.replaceAll(":", "")}_${fieldId}`;
    const requiredId = isRequired ? `${baseId}_required` : undefined;
    const errorId = isInvalid ? `${baseId}_error` : undefined;
    const describedBy = buildDescribedBy([requiredId, errorId]);

    return (
        <div className="mb-3 survey-input-field">
            {renderSurveyInput({
                baseId,
                fieldId,
                label,
                value,
                inputType,
                options,
                isRequired,
                isInvalid,
                describedBy,
                disabled: props.disabled,
                text,
                onChange: props.onChange,
            })}

            {isRequired && <div id={requiredId} className="form-text">{text.required}</div>}
            {isInvalid && <div id={errorId} className="invalid-feedback d-block">{errorText}</div>}
        </div>
    );
};

/** 依欄位類型決定輸入元件 */
const renderSurveyInput = (p: RenderInputProps): ReactNode =>
{
    if (p.inputType === SURVEY_INPUT_TYPE.TextArea) return <TextArea_Comp {...p} />;
    if (p.inputType === SURVEY_INPUT_TYPE.Radio) return <Radio_Comp {...p} />;
    if (p.inputType === SURVEY_INPUT_TYPE.Checkbox) return <Checkbox_Comp {...p} />;
    if (p.inputType === SURVEY_INPUT_TYPE.Select) return <Select_Comp {...p} />;
    return <TextInput_Comp {...p} />;
};

/** 文字類 input */
const TextInput_Comp = (p: RenderInputProps) =>
{
    const inputId = `${p.baseId}_input`;
    const nativeType = getNativeInputType(p.inputType);

    return (
        <>
            <SurveyLabel htmlFor={inputId} label={p.label} isRequired={p.isRequired} />
            <input
                id={inputId}
                name={p.fieldId}
                type={nativeType}
                className={`form-control${p.isInvalid ? " is-invalid" : ""}`}
                value={getInputValue(p.value, nativeType)}
                required={p.isRequired}
                aria-required={p.isRequired}
                aria-invalid={p.isInvalid}
                aria-describedby={p.describedBy}
                inputMode={getInputMode(p.inputType)}
                autoComplete={getAutoComplete(p.inputType)}
                disabled={p.disabled}
                onChange={(e) => p.onChange(p.fieldId, e.target.value)}
            />
        </>
    );
};

/** 多行文字 */
const TextArea_Comp = (p: RenderInputProps) =>
{
    const inputId = `${p.baseId}_textarea`;

    return (
        <>
            <SurveyLabel htmlFor={inputId} label={p.label} isRequired={p.isRequired} />
            <textarea
                id={inputId}
                name={p.fieldId}
                className={`form-control${p.isInvalid ? " is-invalid" : ""}`}
                value={getScalarValue(p.value)}
                required={p.isRequired}
                aria-required={p.isRequired}
                aria-invalid={p.isInvalid}
                aria-describedby={p.describedBy}
                disabled={p.disabled}
                rows={4}
                onChange={(e) => p.onChange(p.fieldId, e.target.value)}
            />
        </>
    );
};

/** 下拉選單 */
const Select_Comp = (p: RenderInputProps) =>
{
    const inputId = `${p.baseId}_select`;

    return (
        <>
            <SurveyLabel htmlFor={inputId} label={p.label} isRequired={p.isRequired} />
            <select
                id={inputId}
                name={p.fieldId}
                className={`form-select${p.isInvalid ? " is-invalid" : ""}`}
                value={getScalarValue(p.value)}
                required={p.isRequired}
                aria-required={p.isRequired}
                aria-invalid={p.isInvalid}
                aria-describedby={p.describedBy}
                disabled={p.disabled || p.options.length === 0}
                onChange={(e) => p.onChange(p.fieldId, e.target.value)}
            >
                <option value="">{p.options.length > 0 ? p.text.selectPlaceholder : p.text.optionEmpty}</option>
                {p.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
        </>
    );
};

/** Radio 單選群組 */
const Radio_Comp = (p: RenderInputProps) =>
{
    const currentValue = getScalarValue(p.value);

    return (
        <fieldset aria-required={p.isRequired} aria-invalid={p.isInvalid} aria-describedby={p.describedBy}>
            <legend className="form-label">
                {p.label}
                <RequiredMark isRequired={p.isRequired} />
            </legend>
            {renderOptionEmpty(p.options, p.text)}
            {p.options.map((option, index) => (
                <RadioOption_Comp key={option.value} p={p} option={option} index={index} checked={currentValue === option.value} />
            ))}
        </fieldset>
    );
};

/** Checkbox 複選群組 */
const Checkbox_Comp = (p: RenderInputProps) =>
{
    const currentValues = getArrayValue(p.value);

    return (
        <fieldset aria-required={p.isRequired} aria-invalid={p.isInvalid} aria-describedby={p.describedBy}>
            <legend className="form-label">
                {p.label}
                <RequiredMark isRequired={p.isRequired} />
            </legend>
            {renderOptionEmpty(p.options, p.text)}
            {p.options.map((option, index) => (
                <CheckboxOption_Comp key={option.value} p={p} option={option} index={index} checked={currentValues.includes(option.value)} />
            ))}
        </fieldset>
    );
};

/** Radio 選項 */
const RadioOption_Comp = (props: { p: RenderInputProps; option: SurveyInputOption; index: number; checked: boolean; }) =>
{
    const inputId = `${props.p.baseId}_radio_${props.index}`;

    return (
        <div className="form-check">
            <input
                id={inputId}
                name={props.p.fieldId}
                type="radio"
                className="form-check-input"
                value={props.option.value}
                checked={props.checked}
                required={props.p.isRequired}
                disabled={props.p.disabled}
                onChange={(e) => handleRadioChange(e, props.p)}
            />
            <label className="form-check-label" htmlFor={inputId}>{props.option.label}</label>
        </div>
    );
};

/** Checkbox 選項 */
const CheckboxOption_Comp = (props: { p: RenderInputProps; option: SurveyInputOption; index: number; checked: boolean; }) =>
{
    const inputId = `${props.p.baseId}_checkbox_${props.index}`;

    return (
        <div className="form-check">
            <input
                id={inputId}
                name={props.p.fieldId}
                type="checkbox"
                className="form-check-input"
                value={props.option.value}
                checked={props.checked}
                disabled={props.p.disabled}
                onChange={(e) => handleCheckboxChange(e, props.p)}
            />
            <label className="form-check-label" htmlFor={inputId}>{props.option.label}</label>
        </div>
    );
};

/** 一般 label */
const SurveyLabel = (props: { htmlFor: string; label: string; isRequired: boolean; }) => (
    <label className="form-label" htmlFor={props.htmlFor}>
        {props.label}
        <RequiredMark isRequired={props.isRequired} />
    </label>
);

/** 必填符號 */
const RequiredMark = (props: { isRequired: boolean; }) =>
{
    if (!props.isRequired) return null;
    return <span className="text-danger ms-1" aria-hidden="true">*</span>;
};

/** Radio change */
const handleRadioChange = (e: ChangeEvent<HTMLInputElement>, p: RenderInputProps) =>
{
    if (!e.target.checked) return;
    p.onChange(p.fieldId, e.target.value);
};

/** Checkbox change */
const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>, p: RenderInputProps) =>
{
    const currentValues = getArrayValue(p.value);
    const nextValues = e.target.checked ? [...currentValues, e.target.value] : currentValues.filter((value) => value !== e.target.value);
    p.onChange(p.fieldId, nextValues);
};

/** 排序欄位 */
const sortSurveyItems = (items: SurveyInputItem[]): SurveyInputItem[] =>
{
    return [...items].sort((a, b) =>
    {
        const rowCompare = (a.RowId ?? 0) - (b.RowId ?? 0);
        return rowCompare !== 0 ? rowCompare : getFieldKey(a).localeCompare(getFieldKey(b));
    });
};

/** 取得欄位 key */
const getFieldKey = (item: SurveyInputItem): string =>
{
    const fieldId = toSafeText(item.FieldId);
    if (fieldId) return fieldId;
    return `RowId_${item.RowId ?? 0}`;
};

/** 取得欄位顯示名稱 */
const getFieldLabel = (p: { item: SurveyInputItem; itemLangs: SurveyInputLangItem[]; lang: Lang; }): string =>
{
    const rows = p.itemLangs.filter((row) => row.ParentRowId === p.item.RowId);
    const current = rows.find((row) => isSameLang(row.Lang, p.lang));
    const fallback = rows.find((row) => isSameLang(row.Lang, DefaultLang)) ?? rows.find((row) => toSafeText(row.FieldName));
    return toSafeText(current?.FieldName) || toSafeText(fallback?.FieldName) || toSafeText(p.item.FieldId) || `欄位 ${p.item.RowId ?? ""}`;
};

/** 正規化欄位類型 */
const normalizeInputType = (value: number | string | null | undefined): number =>
{
    if (typeof value === "number") return value;

    const text = toSafeText(value);
    const numberValue = Number(text);
    if (text && Number.isFinite(numberValue)) return numberValue;

    return INPUT_TYPE_NAME_MAP[text.toLowerCase()] ?? SURVEY_INPUT_TYPE.Text;
};

const INPUT_TYPE_NAME_MAP: Record<string, number> = {
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

/** 取得原生 input type */
const getNativeInputType = (inputType: number): "text" | "email" | "tel" | "number" | "date" =>
{
    if (inputType === SURVEY_INPUT_TYPE.Email) return "email";
    if (inputType === SURVEY_INPUT_TYPE.Phone) return "tel";
    if (inputType === SURVEY_INPUT_TYPE.Number) return "number";
    if (inputType === SURVEY_INPUT_TYPE.Date) return "date";
    return "text";
};

/** 取得 inputMode */
const getInputMode = (inputType: number): "text" | "email" | "tel" | "decimal" | undefined =>
{
    if (inputType === SURVEY_INPUT_TYPE.Email) return "email";
    if (inputType === SURVEY_INPUT_TYPE.Phone) return "tel";
    if (inputType === SURVEY_INPUT_TYPE.Number) return "decimal";
    return undefined;
};

/** 取得 autocomplete */
const getAutoComplete = (inputType: number): string | undefined =>
{
    if (inputType === SURVEY_INPUT_TYPE.Email) return "email";
    if (inputType === SURVEY_INPUT_TYPE.Phone) return "tel";
    return undefined;
};

/** 取得 input value */
const getInputValue = (value: SurveyInputValue, nativeType: string): string =>
{
    const text = getScalarValue(value);
    if (nativeType !== "date") return text;
    return text.length >= 10 ? text.substring(0, 10) : text;
};

/** 取得單值 */
const getScalarValue = (value: SurveyInputValue): string =>
{
    if (Array.isArray(value)) return value[0] ?? "";
    return `${value ?? ""}`;
};

/** 取得陣列值 */
const getArrayValue = (value: SurveyInputValue): string[] =>
{
    if (Array.isArray(value)) return value;
    const text = `${value ?? ""}`;
    return text ? [text] : [];
};

/** 建立 describedBy */
const buildDescribedBy = (ids: Array<string | undefined>): string | undefined =>
{
    const text = ids.filter((id) => Boolean(id)).join(" ");
    return text || undefined;
};

/** 建立選項 */
const buildOptions = (optionJson: string | null | undefined): SurveyInputOption[] =>
{
    const text = toSafeText(optionJson);
    if (!text) return [];

    try
    {
        const json = JSON.parse(text) as JsonValue;
        return normalizeOptions(buildOptionsByJson(json));
    } catch
    {
        return [];
    }
};

/** 依 JSON 型別建立選項 */
const buildOptionsByJson = (json: JsonValue): SurveyInputOption[] =>
{
    if (Array.isArray(json)) return buildOptionsFromArray(json);
    if (isJsonObject(json))
    {
        const inner = getJsonArray(json, ["options", "Options", "items", "Items", "data", "Data"]);
        return inner ? buildOptionsFromArray(inner) : buildOptionsFromObject(json);
    }
    return [];
};

/** 由陣列建立選項 */
const buildOptionsFromArray = (rows: JsonArray): SurveyInputOption[] =>
{
    return rows.map((row, index) => toOption(row, index)).filter((row): row is SurveyInputOption => row !== null);
};

/** 由物件建立選項 */
const buildOptionsFromObject = (row: JsonObject): SurveyInputOption[] =>
{
    return Object.entries(row).map(([key, value]) => ({ value: key, label: toDisplayText(value) || key }));
};

/** 轉成單一選項 */
const toOption = (value: JsonValue, index: number): SurveyInputOption | null =>
{
    if (value === null) return null;
    if (!isJsonObject(value)) return { value: toDisplayText(value), label: toDisplayText(value) };

    const optionValue = getJsonText(value, ["value", "Value", "id", "Id", "key", "Key", "code", "Code"]);
    const optionLabel = getJsonText(value, ["label", "Label", "text", "Text", "name", "Name", "title", "Title"]);
    const safeValue = optionValue || optionLabel || `${index + 1}`;
    return { value: safeValue, label: optionLabel || optionValue || safeValue };
};

/** 選項去空與去重 */
const normalizeOptions = (options: SurveyInputOption[]): SurveyInputOption[] =>
{
    const used = new Set<string>();
    return options.filter((option) =>
    {
        if (!option.value || used.has(option.value)) return false;
        used.add(option.value);
        return true;
    });
};

/** 取得 JSON 文字 */
const getJsonText = (row: JsonObject, keys: string[]): string =>
{
    const key = keys.find((name) => Boolean(toDisplayText(row[name])));
    return key ? toDisplayText(row[key]) : "";
};

/** 取得 JSON 陣列 */
const getJsonArray = (row: JsonObject, keys: string[]): JsonArray | null =>
{
    const key = keys.find((name) => Array.isArray(row[name]));
    const value = key ? row[key] : null;
    return Array.isArray(value) ? value : null;
};

/** 判斷 JSON 物件 */
const isJsonObject = (value: JsonValue): value is JsonObject =>
{
    return value !== null && typeof value === "object" && !Array.isArray(value);
};

/** 轉顯示文字 */
const toDisplayText = (value: JsonValue | undefined): string =>
{
    if (value === undefined || value === null) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return `${value}`;
    return "";
};

/** 轉安全文字 */
const toSafeText = (value: string | number | boolean | null | undefined): string =>
{
    return `${value ?? ""}`.trim();
};

/** 判斷語系 */
const isSameLang = (source: string | null | undefined, target: string): boolean =>
{
    return toSafeText(source).toLowerCase() === target.toLowerCase();
};

/** 問卷輸入元件文案預設值 */
const SURVEY_INPUT_TEXT_FALLBACK: SurveyInputText = { required: "此欄位為必填", selectPlaceholder: "請選擇", optionEmpty: "尚未設定選項" };

/** 取得元件文案 */
const getSurveyInputText = (lang: Lang): SurveyInputText =>
{
    return SURVEY_INPUT_TEXT_MAP[lang] ?? SURVEY_INPUT_TEXT_MAP[DefaultLang] ?? SURVEY_INPUT_TEXT_FALLBACK;
};

const SURVEY_INPUT_TEXT_MAP: Partial<Record<Lang, SurveyInputText>> = {
    "zh-tw": SURVEY_INPUT_TEXT_FALLBACK,
    "en": { required: "This field is required.", selectPlaceholder: "Please select", optionEmpty: "No options available" },
};

/** 顯示無選項提示 */
const renderOptionEmpty = (options: SurveyInputOption[], text: SurveyInputText): ReactNode =>
{
    if (options.length > 0) return null;
    return <div className="text-muted">{text.optionEmpty}</div>;
};
