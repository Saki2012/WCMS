import { useId, useMemo, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { ILibCalendarProp } from './LibCalendar_Data';
import { format, isSameDay, parse, isValid } from "date-fns";




const SUPPORTED_FORMATS = ["yyyy/MM/dd", "yyyy/M/d", "yyyy-MM-dd", "yyyy-M-d", "yyyy.MM.dd", "yyyy.M.d", "yyyyMMdd",] as const;
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
                        calendarClassName="wcms-datepicker"

                        dayClassName={(date) => {
                            let className = "";
                            if (isSameDay(date, new Date())) {
                                className += " bg-blue-100 text-blue-800 rounded-full";
                            }
                            return className.trim();
                        }}
                        isClearable
                        popperClassName="wcms-datepicker-popper"
                    />
                    {invalid && (<span id={`${inputId}-err`} className="invalid-feedback d-block"> 日期格式不正確。 </span>)}
                </div>
            </div>
            <style>{`
  /* 讓浮層蓋過 TinyMCE */
  .react-datepicker-popper.wcms-datepicker-popper {
    z-index: 9999;
  }

  /* 整個日曆的卡片外觀 */
  .react-datepicker.wcms-datepicker {
    border-radius: 10px;
    border: 1px solid #d0e7ff;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.15);
    padding: 4px 8px 8px;
    font-size: 14px;
  }

  /* 上方的月份 + 星期列區塊：用淡色區分 */
  .wcms-datepicker .react-datepicker__header {
    background-color: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    padding-top: 8px;
    padding-bottom: 4px;
  }

  .wcms-datepicker .react-datepicker__current-month {
    font-weight: 600;
  }

  .wcms-datepicker .react-datepicker__day-names {
    margin-top: 4px;
  }

  /* 星期列 / 日期格子的尺寸 */
  .wcms-datepicker .react-datepicker__day-name,
  .wcms-datepicker .react-datepicker__day {
    width: 32px;
    line-height: 32px;
    margin: 2px;
  }

  .wcms-datepicker .react-datepicker__day {
    border-radius: 999px;
  }

  /* 今天的樣式（藍色圓點） */
  .wcms-datepicker .wcms-datepicker__day--today {
    background-color: #0d6efd;
    color: #fff;
  }

  /* 滑過去時的 hover 效果 */
  .wcms-datepicker
    .react-datepicker__day:not(.react-datepicker__day--disabled):hover {
    background-color: #e0f2fe;
  }

  /* header 的 Su / Sa 變紅字 */
  .wcms-datepicker .react-datepicker__day-name:nth-child(1),
  .wcms-datepicker .react-datepicker__day-name:nth-child(7) {
    color: #e11d48;
  }

  /* 週末的日期數字（每一週的第 1、7 欄）預設紅字 */
  .wcms-datepicker .react-datepicker__week .react-datepicker__day:nth-child(1),
  .wcms-datepicker .react-datepicker__week .react-datepicker__day:nth-child(7) {
    color: #e11d48;
  }

  /* 之後要從萬年曆標記的假日，可以在 dayClassName 加這個 class */
  .wcms-datepicker .react-datepicker__day.wcms-datepicker__day--holiday {
    color: #e11d48;
  }

  /* 非本月日期：灰字（優先，覆蓋週末 / 假日設定） */
  .wcms-datepicker .react-datepicker__day--outside-month {
    color: #cbd5e1 !important;
  }

  /* 選中的日期（覆蓋週末 / 灰字），保持藍底白字 */
  .wcms-datepicker .react-datepicker__day--selected,
  .wcms-datepicker .react-datepicker__day--keyboard-selected {
    background-color: #0d6efd;
    color: #fff !important;
  }
`}</style>
        </>
    );
};

export default LibCalendar;