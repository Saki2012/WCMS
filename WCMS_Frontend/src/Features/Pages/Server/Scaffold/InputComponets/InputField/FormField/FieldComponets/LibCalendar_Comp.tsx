// 使用套件 DatePicker
import { useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, isSameDay, isValid, parse, parseISO } from "date-fns";
import type { ILibCalendarProp } from "./LibCalendar_Data";

// #region Property
const OUTPUT_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

type DatePickerRawEvent = ReactKeyboardEvent<HTMLElement> | ReactMouseEvent<HTMLElement>;

const SUPPORTED_FORMATS = [
    // 顯示格式
    { pattern: "yyyy / MM / dd HH:mm:ss", hasTime: true },
    { pattern: "yyyy / M / d H:m:s", hasTime: true },
    { pattern: "yyyy / MM / dd HH:mm", hasTime: true },
    { pattern: "yyyy / M / d H:m", hasTime: true },
    { pattern: "yyyy / MM / dd", hasTime: false },
    { pattern: "yyyy / M / d", hasTime: false },

    // slash
    { pattern: "yyyy/MM/dd HH:mm:ss", hasTime: true },
    { pattern: "yyyy/M/d H:m:s", hasTime: true },
    { pattern: "yyyy/MM/dd HH:mm", hasTime: true },
    { pattern: "yyyy/M/d H:m", hasTime: true },
    { pattern: "yyyy/MM/dd", hasTime: false },
    { pattern: "yyyy/M/d", hasTime: false },

    // dash
    { pattern: "yyyy-MM-dd HH:mm:ss", hasTime: true },
    { pattern: "yyyy-M-d H:m:s", hasTime: true },
    { pattern: "yyyy-MM-dd HH:mm", hasTime: true },
    { pattern: "yyyy-M-d H:m", hasTime: true },
    { pattern: "yyyy-MM-dd", hasTime: false },
    { pattern: "yyyy-M-d", hasTime: false },

    // ISO-like
    { pattern: "yyyy-MM-dd'T'HH:mm:ss", hasTime: true },
    { pattern: "yyyy-M-d'T'H:m:s", hasTime: true },

    // dot
    { pattern: "yyyy.MM.dd HH:mm:ss", hasTime: true },
    { pattern: "yyyy.M.d H:m:s", hasTime: true },
    { pattern: "yyyy.MM.dd HH:mm", hasTime: true },
    { pattern: "yyyy.M.d H:m", hasTime: true },
    { pattern: "yyyy.MM.dd", hasTime: false },
    { pattern: "yyyy.M.d", hasTime: false },

    // compact
    { pattern: "yyyyMMddHHmmss", hasTime: true },
    { pattern: "yyyyMMdd HH:mm:ss", hasTime: true },
    { pattern: "yyyyMMdd", hasTime: false },
] as const;
// #endregion

// #region Public
export const LibCalendar = (prop: ILibCalendarProp) =>
{
    const inputId = useId();

    const [text, setText] = useState<string>(""); // 使用者正在輸入的日期文字
    const [invalid, setInvalid] = useState<boolean>(false);
    const lastCommittedRef = useRef<string>(""); // 上一次已提交的字串，避免反覆覆寫

    const selectedDate = useMemo(() =>
    {
        return parseDateValue(prop.InputValue);
    }, [prop.InputValue]);

    /** 同步 DatePicker 原始輸入文字並清除舊的格式錯誤。 */
    const handleChangeRaw = (event?: DatePickerRawEvent) =>
    {
        const target = event?.target;
        const inputValue = target instanceof HTMLInputElement ? target.value : "";

        setText(inputValue);
        if (invalid) setInvalid(false);
    };

    const commitDateTime = (date: Date | null, committedRaw = "") =>
    {
        const dateStr = date ? format(date, OUTPUT_FORMAT) : "";

        lastCommittedRef.current = committedRaw;
        setText("");
        setInvalid(false);
        prop.onChange?.(dateStr);
    };

    const handlePickDate = (date: Date | null) =>
    {
        if (!date)
        {
            commitDateTime(null);
            return;
        }

        // 選日期時保留目前時間；如果沒有時間就給 00:00:00
        const next = mergeDateAndTime(date, selectedDate);
        commitDateTime(next);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const timeValue = e.target.value;

        if (!selectedDate)
        {
            setInvalid(true);
            return;
        }

        if (!timeValue)
        {
            const next = mergeDateAndTime(selectedDate, null);
            commitDateTime(next);
            return;
        }

        const time = parseTimeValue(timeValue);

        if (!time)
        {
            setInvalid(true);
            return;
        }

        const next = new Date(selectedDate);
        next.setHours(time.hour, time.minute, time.second, 0);

        commitDateTime(next);
    };

    const commitTextIfPossible = () =>
    {
        const raw = (text || "").trim();

        // 空字串就什麼都不做，保留目前 selected 的值
        if (raw === "")
        {
            setInvalid(false);
            return;
        }

        if (raw === lastCommittedRef.current) return;

        const parsed = parseUserDate(raw);

        if (parsed)
        {
            const next = parsed.hasTime
                ? parsed.date
                : mergeDateAndTime(parsed.date, selectedDate);

            commitDateTime(next, raw);
        } else
        {
            setInvalid(true);
        }
    };

    const timeValue = selectedDate ? format(selectedDate, "HH:mm:ss") : "";

    return (
        <>
            <label
                htmlFor={inputId}
                className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label"
            >
                {prop.ColumnDisplayName}
            </label>

            <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                <div className="Date input-daterange input-group">
                    <span className="input-group-text">
                        <i className="fal fa-calendar-alt"></i>
                    </span>

                    <DatePicker
                        id={inputId}
                        selected={selectedDate}
                        onChange={handlePickDate}
                        onBlur={commitTextIfPossible}
                        onKeyDown={(e) =>
                        {
                            if (e.key === "Enter")
                            {
                                e.preventDefault();
                                commitTextIfPossible();
                            }
                        }}
                        onChangeRaw={handleChangeRaw}
                        value={text !== "" ? text : undefined}
                        dateFormat="yyyy / MM / dd"
                        placeholderText="YYYY / MM / DD"
                        autoComplete="off"
                        className={`start-date form-control dateicon ${invalid ? "is-invalid" : ""}`}
                        calendarClassName="wcms-datepicker"
                        dayClassName={(date) =>
                        {
                            let className = "";

                            if (isSameDay(date, new Date()))
                            {
                                className += " wcms-datepicker__day--today";
                            }

                            return className.trim();
                        }}
                        isClearable
                        popperClassName="wcms-datepicker-popper"
                        ariaInvalid={invalid ? "true" : undefined}
                        ariaDescribedBy={invalid ? `${inputId}-err` : undefined}
                    />

                    <input
                        id={`${inputId}-time`}
                        type="time"
                        step="1"
                        value={timeValue}
                        onChange={handleTimeChange}
                        className="form-control wcms-time-input"
                        disabled={!selectedDate}
                        aria-label="時間"
                    />

                    {invalid && (
                        <span id={`${inputId}-err`} className="invalid-feedback d-block">
                            日期或時間格式不正確。
                        </span>
                    )}
                </div>
            </div>

            <style>
                {`
  /* 讓浮層蓋過 TinyMCE */
  .react-datepicker-popper.wcms-datepicker-popper {
    z-index: 9999;
  }

  /* 時間欄位 */
  .wcms-time-input {
    max-width: 150px;
    width: 100% !important;
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

  /* 今天的樣式 */
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

  /* 週末的日期數字 */
  .wcms-datepicker .react-datepicker__week .react-datepicker__day:nth-child(1),
  .wcms-datepicker .react-datepicker__week .react-datepicker__day:nth-child(7) {
    color: #e11d48;
  }

  /* 之後要從萬年曆標記的假日，可以在 dayClassName 加這個 class */
  .wcms-datepicker .react-datepicker__day.wcms-datepicker__day--holiday {
    color: #e11d48;
  }

  /* 非本月日期：灰字 */
  .wcms-datepicker .react-datepicker__day--outside-month {
    color: #cbd5e1 !important;
  }

  /* 選中的日期 */
  .wcms-datepicker .react-datepicker__day--selected,
  .wcms-datepicker .react-datepicker__day--keyboard-selected {
    background-color: #0d6efd;
    color: #fff !important;
  }
`}
            </style>
        </>
    );
};
// #endregion

// #region Private
const parseDateValue = (value?: string | null): Date | null =>
{
    const raw = (value || "").trim();
    if (!raw) return null;

    const parsed = parseUserDate(raw);
    if (parsed) return parsed.date;

    // 最後才吃 ISO，避免 yyyy-MM-dd HH:mm:ss 這種本地格式被瀏覽器 Date 解析差異影響
    const iso = parseISO(raw);
    return isReasonableDate(iso) ? iso : null;
};

const parseUserDate = (raw: string): { date: Date; hasTime: boolean; } | null =>
{
    const v = (raw || "").trim();
    if (!v) return null;

    const referenceDate = new Date(2000, 0, 1, 0, 0, 0, 0);

    for (const item of SUPPORTED_FORMATS)
    {
        const d = parse(v, item.pattern, referenceDate);

        if (isReasonableDate(d))
        {
            return {
                date: d,
                hasTime: item.hasTime,
            };
        }
    }

    return null;
};

const isReasonableDate = (date: Date): boolean =>
{
    if (!isValid(date)) return false;

    const y = date.getFullYear();
    return y >= 1900 && y <= 2100;
};

const mergeDateAndTime = (datePart: Date, timeSource: Date | null | undefined): Date =>
{
    const next = new Date(datePart);

    next.setHours(
        timeSource?.getHours() ?? 0,
        timeSource?.getMinutes() ?? 0,
        timeSource?.getSeconds() ?? 0,
        0,
    );

    return next;
};

const parseTimeValue = (value: string): { hour: number; minute: number; second: number; } | null =>
{
    const parts = value.split(":");

    if (parts.length < 2 || parts.length > 3) return null;

    const hour = Number(parts[0]);
    const minute = Number(parts[1]);
    const second = parts.length === 3 ? Number(parts[2]) : 0;

    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
    if (!Number.isInteger(second) || second < 0 || second > 59) return null;

    return { hour, minute, second };
};
// #endregion
