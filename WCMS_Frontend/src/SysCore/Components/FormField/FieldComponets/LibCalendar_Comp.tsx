import { useId, useMemo, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { ILibCalendarProp } from './LibCalendar_Data';
import { format, isSameDay, parse, isValid } from "date-fns";

const SUPPORTED_FORMATS = [
    "yyyy/MM/dd",
    "yyyy/M/d",
    "yyyy-MM-dd",
    "yyyy-M-d",
    "yyyy.MM.dd",
    "yyyy.M.d",
    "yyyyMMdd",
] as const;
const parseUserDate = (raw: string): Date | null => {
    const v = (raw || "").trim();
    if (!v) return null;
    for (const fmt of SUPPORTED_FORMATS) {
        const d = parse(v, fmt, new Date());
        if (isValid(d)) {
            // 安全帶：限制合理年份（可依需求調整）
            const y = d.getFullYear();
            if (y >= 1900 && y <= 2100) return d;
        }
    }
    return null;
};
const LibCalendar = (prop: ILibCalendarProp) => {
    const inputId = useId();
    const [text, setText] = useState<string>("");       // 使用者正在輸入的文字
    const [invalid, setInvalid] = useState<boolean>(false);
    const lastCommittedRef = useRef<string>("");        // 上一次已提交的字串，避免反覆覆寫
    const selectedDate = useMemo(() => {
        if (!prop.InputValue) return null;
        const d = new Date(prop.InputValue);
        return isValid(d) ? d : null;
    }, [prop.InputValue]);
    const handleChangeRaw = (e: React.SyntheticEvent<any>) => {
        const input = e.target as HTMLInputElement;
        setText(input.value ?? "");
        if (invalid) setInvalid(false);
    };
    const handlePick = (date: Date | null) => {
        const dateStr = date ? format(date, "yyyy-MM-dd") : "";
        lastCommittedRef.current = "";
        setText("");
        setInvalid(false);
        prop.onChange?.(dateStr);
    };
    const commitTextIfPossible = () => {
        const raw = (text || "").trim();
        // 空字串就什麼都不做（保留目前 selected 的值）
        if (raw === "") {
            setInvalid(false);
            return;
        }
        if (raw === lastCommittedRef.current) return;
        const parsed = parseUserDate(raw);
        if (parsed) {
            lastCommittedRef.current = raw;
            setInvalid(false);
            prop.onChange?.(format(parsed, "yyyy-MM-dd"));
            setText(""); // 交回給 DatePicker 用 selected + dateFormat 顯示
        } else {
            setInvalid(true);
        }
    };
    return (
        <>
            <label htmlFor={inputId} className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">
                {prop.ColumnDisplayName}
            </label>
            <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                <div className="Date input-group input-daterange">
                    <span className="input-group-text">
                        <i className="fal fa-calendar-alt"></i>
                    </span>
                    <DatePicker
                        id={inputId}
                        selected={selectedDate}
                        onChange={handlePick}
                        onBlur={commitTextIfPossible}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                commitTextIfPossible();
                            }
                        }}
                        onChangeRaw={(e) => handleChangeRaw(e as any)}
                        value={text !== "" ? text : undefined}
                        dateFormat="yyyy / MM / dd"
                        placeholderText="YYYY / MM / DD"
                        autoComplete="off"
                        className="start-date form-control dateicon"
                        calendarClassName="shadow-lg rounded-md border border-gray-300 p-2"
                        dayClassName={(date) => {
                            let className = "";
                            if (isSameDay(date, new Date())) {
                                className += " bg-blue-100 text-blue-800 rounded-full";
                            }
                            return className.trim();
                        }}
                        isClearable
                    />
                    {invalid && (<span id={`${inputId}-err`} className="invalid-feedback d-block"> 日期格式不正確。 </span>)}
                </div>
            </div>
        </>
    );
};

export default LibCalendar;