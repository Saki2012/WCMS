import { useId, useState, useEffect } from "react";
import { parse, isValid, format } from "date-fns";
import type { ILibTextBoxStyle } from "./LibTextBox_Data";

export type LibDatetimeValueType = "DateTime" | "DateOnly" | "TimeOnly";

export interface ILibDatetimeRangeProp {
    Style: ILibTextBoxStyle;
    ColumnDisplayName: string;
    /** 起始值（會用標準格式回傳） */
    StartValue?: string | null;
    /** 結束值（會用標準格式回傳） */
    EndValue?: string | null;
    /** 決定這組欄位是 DateTime / DateOnly / TimeOnly（預設 DateOnly） */
    valueType?: LibDatetimeValueType;
    disabled?: boolean;
    /** 起始值變更時 */
    onChangeStart?: (value: string | null) => void;
    /** 結束值變更時 */
    onChangeEnd?: (value: string | null) => void;
}

// ---- parse / format 工具 ----
const DATE_FORMATS = ["yyyy/MM/dd", "yyyy/M/d", "yyyy-MM-dd", "yyyy-M-d", "yyyy.MM.dd", "yyyy.M.d", "yyyyMMdd",] as const;
const TIME_FORMATS = ["HH:mm", "H:mm", "HHmm", "HH:mm:ss",] as const;
const DATETIME_FORMATS = ["yyyy/MM/dd HH:mm", "yyyy/MM/dd HH:mm:ss", "yyyy-MM-dd HH:mm", "yyyy-MM-dd HH:mm:ss", "yyyy.MM.dd HH:mm", "yyyy.MM.dd HH:mm:ss",] as const;
const parseByType = (raw: string, kind: LibDatetimeValueType): Date | null => {
    const v = (raw || "").trim();
    if (!v) return null;
    const base = new Date();
    let fmts: readonly string[];
    switch (kind) {
        case "TimeOnly":
            fmts = TIME_FORMATS;
            break;
        case "DateTime":
            fmts = DATETIME_FORMATS;
            break;
        case "DateOnly":
        default:
            fmts = DATE_FORMATS;
            break;
    }
    for (const fmt of fmts) {
        const d = parse(v, fmt, base);
        if (isValid(d)) {
            if (kind === "DateOnly" || kind === "DateTime") {
                const y = d.getFullYear();
                if (y < 1900 || y > 2100) continue;
            }
            return d;
        }
    }
    return null;
};
const formatByType = (d: Date, kind: LibDatetimeValueType): string => {
    switch (kind) {
        case "TimeOnly": return format(d, "HH:mm");
        case "DateTime": return format(d, "yyyy-MM-dd HH:mm");
        case "DateOnly":
        default: return format(d, "yyyy-MM-dd");
    }
};

const buildPlaceholder = (kind: LibDatetimeValueType): string => {
    switch (kind) {
        case "TimeOnly":
            return "HH:mm";
        case "DateTime":
            return "YYYY/MM/DD HH:mm";
        case "DateOnly":
        default:
            return "YYYY/MM/DD";
    }
};

const LibDatetimeRange = (prop: ILibDatetimeRangeProp) => {
    const { Style, ColumnDisplayName, StartValue, EndValue, valueType = "DateOnly", disabled, onChangeStart, onChangeEnd, } = prop;
    const startId = useId();
    const endId = useId();
    // 使用者正在輸入中的文字（尚未 commit）
    const [startText, setStartText] = useState<string>("");
    const [endText, setEndText] = useState<string>("");
    // 單欄位格式錯誤
    const [startInvalid, setStartInvalid] = useState<boolean>(false);
    const [endInvalid, setEndInvalid] = useState<boolean>(false);
    // 區間錯誤（起 > 訖）
    const [rangeError, setRangeError] = useState<string | null>(null);
    const placeholder = buildPlaceholder(valueType);
    // 只要外部 StartValue / EndValue / kind 改變，就重新檢查區間
    useEffect(() => {
        const s = StartValue ? parseByType(StartValue, valueType) : null;
        const e = EndValue ? parseByType(EndValue, valueType) : null;
        if (s && e && s.getTime() > e.getTime()) setRangeError("起始時間不可大於結束時間");
        else setRangeError(null);
    }, [StartValue, EndValue, valueType]);
    // ---- commit / blur 時檢查與回傳 ----
    const commitStart = () => {
        const raw = (startText || "").trim();
        if (raw === "") {
            // 清空
            setStartInvalid(false);
            setStartText("");      // 保持空字串即可
            onChangeStart?.(null);
            return;
        }
        const parsed = parseByType(raw, valueType);
        if (!parsed) {
            setStartInvalid(true);
            return;
        }
        const canonical = formatByType(parsed, valueType);
        setStartInvalid(false);
        // ✅ 改成保留標準格式在輸入框裡
        setStartText(canonical);
        onChangeStart?.(canonical);
    };
    const commitEnd = () => {
        const raw = (endText || "").trim();
        if (raw === "") {
            setEndInvalid(false);
            setEndText("");
            onChangeEnd?.(null);
            return;
        }
        const parsed = parseByType(raw, valueType);
        if (!parsed) {
            setEndInvalid(true);
            return;
        }
        const canonical = formatByType(parsed, valueType);
        setEndInvalid(false);
        // ✅ 同樣保留標準格式
        setEndText(canonical);
        onChangeEnd?.(canonical);
    };
    // 顯示值：優先顯示正在輸入中的文字，沒有才顯示外部傳進來的值
    const displayStart = startText !== "" ? startText : (StartValue ?? "");
    const displayEnd = endText !== "" ? endText : (EndValue ?? "");
    return (
        <>
            <label htmlFor={startId} className={Style.Labelstyle}>
                {ColumnDisplayName}
            </label>
            <div className={Style.SelectStyle}>
                <div className="input-group">
                    <input id={startId} type="text"
                        className={`${Style.InputStyle} ${startInvalid ? "is-invalid" : ""}`}
                        disabled={disabled} placeholder={placeholder}
                        autoComplete="off" inputMode="numeric"
                        aria-invalid={startInvalid} aria-describedby={startInvalid ? `${startId}-err` : undefined}
                        value={displayStart} onChange={(e) => { setStartText(e.target.value); if (startInvalid) setStartInvalid(false); }}
                        onBlur={commitStart} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitStart(); } }}
                    />
                    <span className="input-group-text" aria-hidden="true">
                        ~
                    </span>
                    <input id={endId} type="text"
                        className={`${Style.InputStyle} ${endInvalid ? "is-invalid" : ""}`}
                        disabled={disabled} placeholder={placeholder}
                        autoComplete="off" inputMode="numeric"
                        aria-invalid={endInvalid} aria-describedby={endInvalid ? `${endId}-err` : undefined}
                        value={displayEnd} onChange={(e) => { setEndText(e.target.value); if (endInvalid) setEndInvalid(false); }}
                        onBlur={commitEnd} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitEnd(); } }}
                    />
                </div>
                {/* 單欄位錯誤訊息 */}
                {startInvalid && (<div id={`${startId}-err`} className="invalid-feedback d-block">起始時間格式不正確</div>)}
                {endInvalid && (<div id={`${endId}-err`} className="invalid-feedback d-block">結束時間格式不正確</div>)}
                {/* 區間錯誤（兩邊都合法但起 > 訖） */}
                {rangeError && !startInvalid && !endInvalid && (<div className="invalid-feedback d-block">{rangeError}</div>)}
            </div>
        </>
    );
};

export default LibDatetimeRange;
