// 原 input 改以使用 "AAInputFieldItem" 20260701
import { format, isValid, parse } from "date-fns";
import { useEffect, useId, useState } from "react";
import type { KeyboardEvent } from "react";
import type { ILibTextBoxStyle } from "./LibTextBox_Data";
import {
    AAInputFieldItem,
    buildAdapterBaseId,
    buildFieldId,
    type AAInputValue,
} from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms";

// #region Property
export type LibDatetimeValueType = "DateTime" | "DateOnly" | "TimeOnly";

export interface ILibDatetimeRangeProp
{
    Style: ILibTextBoxStyle;
    ColumnDisplayName: string;
    /** 起始值，會用標準格式回傳。 */
    StartValue?: string | null;
    /** 結束值，會用標準格式回傳。 */
    EndValue?: string | null;
    /** 決定這組欄位是 DateTime / DateOnly / TimeOnly，預設 DateOnly。 */
    valueType?: LibDatetimeValueType;
    disabled?: boolean;
    /** 起始值變更時。 */
    onChangeStart?: (value: string | null) => void;
    /** 結束值變更時。 */
    onChangeEnd?: (value: string | null) => void;
}

const DATE_FORMATS = ["yyyy/MM/dd", "yyyy/M/d", "yyyy-MM-dd", "yyyy-M-d", "yyyy.MM.dd", "yyyy.M.d", "yyyyMMdd"] as const;

const TIME_FORMATS = ["HH:mm", "H:mm", "HHmm", "HH:mm:ss"] as const;

const DATETIME_FORMATS = [
    "yyyy/MM/dd HH:mm",
    "yyyy/MM/dd HH:mm:ss",
    "yyyy-MM-dd HH:mm",
    "yyyy-MM-dd HH:mm:ss",
    "yyyy.MM.dd HH:mm",
    "yyyy.MM.dd HH:mm:ss",
] as const;
// #endregion

// #region Public
/** 日期時間區間欄位，使用 AAInputFieldItem 輸出起訖文字輸入。 */
export const LibDatetimeRange = (prop: ILibDatetimeRangeProp) =>
{
    const { Style, ColumnDisplayName, StartValue, EndValue, valueType = "DateOnly", disabled, onChangeStart, onChangeEnd } = prop;
    const reactId = useId();
    const baseId = buildAdapterBaseId(reactId);
    const startKey = "start";
    const endKey = "end";
    const startId = buildFieldId(baseId, startKey);
    const [startText, setStartText] = useState<string>("");
    const [endText, setEndText] = useState<string>("");
    const [startInvalid, setStartInvalid] = useState<boolean>(false);
    const [endInvalid, setEndInvalid] = useState<boolean>(false);
    const [rangeError, setRangeError] = useState<string | null>(null);
    const placeholder = buildPlaceholder(valueType);
    const displayStart = startText !== "" ? startText : (StartValue ?? "");
    const displayEnd = endText !== "" ? endText : (EndValue ?? "");

    useEffect(() =>
    {
        const startDate = StartValue ? parseByType(StartValue, valueType) : null;
        const endDate = EndValue ? parseByType(EndValue, valueType) : null;

        if (startDate && endDate && startDate.getTime() > endDate.getTime())
        {
            setRangeError("起始時間不可大於結束時間");
            return;
        }

        setRangeError(null);
    }, [StartValue, EndValue, valueType]);

    /** 處理起始值輸入。 */
    const handleStartChange = (_fieldKey: string, value: AAInputValue) =>
    {
        setStartText(String(value ?? ""));
        if (startInvalid) setStartInvalid(false);
    };

    /** 處理結束值輸入。 */
    const handleEndChange = (_fieldKey: string, value: AAInputValue) =>
    {
        setEndText(String(value ?? ""));
        if (endInvalid) setEndInvalid(false);
    };

    /** 處理起始欄位離開焦點。 */
    const handleStartBlur = (_fieldKey: string, value: AAInputValue) =>
    {
        commitStart(String(value ?? ""), valueType, setStartText, setStartInvalid, onChangeStart);
    };

    /** 處理結束欄位離開焦點。 */
    const handleEndBlur = (_fieldKey: string, value: AAInputValue) =>
    {
        commitEnd(String(value ?? ""), valueType, setEndText, setEndInvalid, onChangeEnd);
    };

    /** 處理起始欄位 Enter commit。 */
    const handleStartKeyDown = (_fieldKey: string, event: KeyboardEvent<HTMLInputElement>) =>
    {
        if (event.key !== "Enter") return;

        event.preventDefault();
        commitStart(event.currentTarget.value, valueType, setStartText, setStartInvalid, onChangeStart);
    };

    /** 處理結束欄位 Enter commit。 */
    const handleEndKeyDown = (_fieldKey: string, event: KeyboardEvent<HTMLInputElement>) =>
    {
        if (event.key !== "Enter") return;

        event.preventDefault();
        commitEnd(event.currentTarget.value, valueType, setEndText, setEndInvalid, onChangeEnd);
    };

    return (
        <>
            <label htmlFor={startId} className={Style.Labelstyle}>{ColumnDisplayName}</label>
            <div className={Style.SelectStyle}>
                <div className="input-group">
                    <AAInputFieldItem
                        baseId={baseId}
                        variant="gridCell"
                        className="flex-grow-1"
                        field={{
                            key: startKey,
                            type: "text",
                            label: `${ColumnDisplayName}起始時間`,
                            aaLabel: `請輸入${ColumnDisplayName}起始時間`,
                            value: displayStart,
                            placeholder,
                            disabled,
                            autoComplete: "off",
                            inputMode: "numeric",
                            errorText: startInvalid ? "起始時間格式不正確" : undefined,
                            helpText: `${ColumnDisplayName}起始時間欄位`,
                        }}
                        onChange={handleStartChange}
                        onBlur={handleStartBlur}
                        onKeyDown={handleStartKeyDown}
                    />
                    <span className="input-group-text" aria-hidden="true">~</span>
                    <AAInputFieldItem
                        baseId={baseId}
                        variant="gridCell"
                        className="flex-grow-1"
                        field={{
                            key: endKey,
                            type: "text",
                            label: `${ColumnDisplayName}結束時間`,
                            aaLabel: `請輸入${ColumnDisplayName}結束時間`,
                            value: displayEnd,
                            placeholder,
                            disabled,
                            autoComplete: "off",
                            inputMode: "numeric",
                            errorText: endInvalid ? "結束時間格式不正確" : undefined,
                            helpText: `${ColumnDisplayName}結束時間欄位`,
                        }}
                        onChange={handleEndChange}
                        onBlur={handleEndBlur}
                        onKeyDown={handleEndKeyDown}
                    />
                </div>
                {rangeError && !startInvalid && !endInvalid && <div className="invalid-feedback d-block">{rangeError}</div>}
            </div>
        </>
    );
};
// #endregion

// #region Protected
/** 依欄位類型建立 placeholder。 */
const buildPlaceholder = (kind: LibDatetimeValueType): string =>
{
    switch (kind)
    {
        case "TimeOnly":
            return "HH:mm";
        case "DateTime":
            return "YYYY/MM/DD HH:mm";
        case "DateOnly":
        default:
            return "YYYY/MM/DD";
    }
};
// #endregion

// #region Private
/** 依欄位類型解析使用者輸入的日期時間。 */
const parseByType = (raw: string, kind: LibDatetimeValueType): Date | null =>
{
    const value = (raw || "").trim();
    if (!value) return null;

    const formats = getFormatsByType(kind);
    const baseDate = new Date();

    for (const currentFormat of formats)
    {
        const parsedDate = parse(value, currentFormat, baseDate);

        if (!isValid(parsedDate)) continue;
        if (!isDateYearValid(parsedDate, kind)) continue;

        return parsedDate;
    }

    return null;
};

/** 依欄位類型取得可解析格式。 */
const getFormatsByType = (kind: LibDatetimeValueType): readonly string[] =>
{
    switch (kind)
    {
        case "TimeOnly":
            return TIME_FORMATS;
        case "DateTime":
            return DATETIME_FORMATS;
        case "DateOnly":
        default:
            return DATE_FORMATS;
    }
};

/** 檢查日期年份是否在合理範圍。 */
const isDateYearValid = (date: Date, kind: LibDatetimeValueType) =>
{
    if (kind === "TimeOnly") return true;

    const year = date.getFullYear();
    return year >= 1900 && year <= 2100;
};

/** 依欄位類型格式化成標準回傳值。 */
const formatByType = (date: Date, kind: LibDatetimeValueType): string =>
{
    switch (kind)
    {
        case "TimeOnly":
            return format(date, "HH:mm");
        case "DateTime":
            return format(date, "yyyy-MM-dd HH:mm");
        case "DateOnly":
        default:
            return format(date, "yyyy-MM-dd");
    }
};

/** 提交起始欄位文字並回寫標準格式。 */
const commitStart = (
    rawValue: string,
    valueType: LibDatetimeValueType,
    setText: (value: string) => void,
    setInvalid: (value: boolean) => void,
    onChange?: (value: string | null) => void,
) =>
{
    commitDatetimeText(rawValue, valueType, setText, setInvalid, onChange);
};

/** 提交結束欄位文字並回寫標準格式。 */
const commitEnd = (
    rawValue: string,
    valueType: LibDatetimeValueType,
    setText: (value: string) => void,
    setInvalid: (value: boolean) => void,
    onChange?: (value: string | null) => void,
) =>
{
    commitDatetimeText(rawValue, valueType, setText, setInvalid, onChange);
};

/** 提交日期時間文字，合法則標準化，不合法則標記錯誤。 */
const commitDatetimeText = (
    rawValue: string,
    valueType: LibDatetimeValueType,
    setText: (value: string) => void,
    setInvalid: (value: boolean) => void,
    onChange?: (value: string | null) => void,
) =>
{
    const raw = (rawValue || "").trim();

    if (raw === "")
    {
        setInvalid(false);
        setText("");
        onChange?.(null);
        return;
    }

    const parsed = parseByType(raw, valueType);

    if (!parsed)
    {
        setInvalid(true);
        return;
    }

    const canonical = formatByType(parsed, valueType);

    setInvalid(false);
    setText(canonical);
    onChange?.(canonical);
};
// #endregion