import "./CalendarPageComp.css";
import type { components } from "@/types/api";
import { type ChangeEvent, type FormEvent, type MouseEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import {
    type CalendarYearMap,
    type DialogAnchorRect,
    formatDateString,
    formatHHmm,
    getWeekdayNameZh,
    parseHHmm,
    to12hParts,
    to24hHour,
    useCalendarPage,
} from "./Server_Calendar_Hook";

type CalendarDetail = components["schemas"]["CalendarDetail_DTO"];

export interface CalendarPageCompProps
{
    defaultYear?: number;
}

type YearSetterPage = { setYear?: (year: number) => void; };

/** 取得 hook 是否有暴露 setYear */
const getYearSetter = (page: object): ((year: number) => void) | null =>
{
    const typedPage = page as YearSetterPage;
    return typeof typedPage.setYear === "function" ? typedPage.setYear : null;
};

/** 將時間安全轉成 HH:mm */
const toSafeHHmm = (value?: string | null): string =>
{
    const parsed = parseHHmm(value);
    if (!parsed) return "";

    return formatHHmm(parsed.hh, parsed.mm);
};

/** 組出開閉館顯示文字 */
const renderOpenCloseText = (day?: CalendarDetail | null): string =>
{
    if (!day) return "";

    const open = toSafeHHmm(day.Spec_OpenTime);
    const close = toSafeHHmm(day.Spec_CloseTime);

    if (!open && !close) return "閉館";
    return `開館時間：${open || "--"} ~ ${close || "--"}`;
};

/** 取得假日顯示文字 */
const getHolidayText = (day?: CalendarDetail | null): string =>
{
    if (!day) return "";
    return (day.HolidayName ?? "").trim() || (day.IsHoliday ? "假日" : "");
};

/** 建立格子 className */
const buildCellClassName = (isWeekend: boolean, isHoliday: boolean, isToday: boolean): string =>
{
    const classNames = ["calendar-cell", isWeekend ? "is-weekend" : "", isHoliday ? "is-holiday" : "", isToday ? "is-today" : ""];

    return classNames.filter(Boolean).join(" ");
};

/** 建立格子 aria-label */
const buildCellAriaLabel = (dateStr: string, weekDay: number, day?: CalendarDetail | null): string =>
{
    const parts = [`編輯 ${dateStr}（星期${getWeekdayNameZh(weekDay)}）`];
    const holidayText = getHolidayText(day);
    const openCloseText = renderOpenCloseText(day);

    if (holidayText) parts.push(`假日：${holidayText}`);
    if (openCloseText) parts.push(openCloseText);

    return parts.join("，");
};

/** 產生月曆 6x7 週資料 */
const buildMonthWeeks = (year: number, month: number): Array<Array<string | null>> =>
{
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = 42;

    const cells: Array<string | null> = [];
    let currentDay = 1;

    for (let i = 0; i < totalCells; i += 1)
    {
        if (i < firstWeekday || currentDay > daysInMonth)
        {
            cells.push(null);
            continue;
        }

        cells.push(formatDateString(year, month, currentDay));
        currentDay += 1;
    }

    return Array.from({ length: 6 }, (_, rowIndex) => cells.slice(rowIndex * 7, rowIndex * 7 + 7));
};

/** Page 主元件：用現在 hook 的資料，但 DOM 改回舊版 */
export const CalendarPageComp: React.FC<CalendarPageCompProps> = ({ defaultYear }) =>
{
    const page = useCalendarPage({ defaultYear });
    const yearSetter = getYearSetter(page);
    const canEditYear = yearSetter !== null;

    /** 年份輸入 */
    const handleYearChange = (e: ChangeEvent<HTMLInputElement>): void =>
    {
        const nextYear = Number(e.target.value);
        if (!Number.isFinite(nextYear)) return;
        if (!yearSetter) return;

        yearSetter(nextYear);
    };

    return (
        <main className="wcms-calendar-page" aria-labelledby="calendar-page-title">
            <header className="wcms-calendar-header">
                <div className="wcms-calendar-header-left">
                    <h1 id="calendar-page-title" className="page-title">萬年曆管理</h1>
                    <span aria-live="polite" className="wcms-calendar-year-label">{page.year} 年</span>
                </div>

                <div className="wcms-calendar-header-right">
                    <label className="year-input-label">
                        <span className="sr-only">選擇年份</span>
                        <input
                            type="number"
                            aria-label="選擇年份"
                            className="year-input"
                            value={page.year}
                            onChange={handleYearChange}
                            readOnly={!canEditYear}
                        />
                    </label>
                </div>
            </header>

            <section className="wcms-calendar-toolbar" aria-label="月份切換與工具列">
                <div className="wcms-calendar-month-nav">
                    <button type="button" className="btn btn-ghost" onClick={page.handlePrevMonth} aria-label="上一個月">◀</button>

                    <div className="wcms-calendar-month-label" aria-live="polite" aria-atomic="true">{page.year} 年 {page.month + 1} 月</div>

                    <button type="button" className="btn btn-ghost" onClick={page.handleNextMonth} aria-label="下一個月">▶</button>

                    <button type="button" className="btn btn-outline" onClick={page.handleGoToday}>今天</button>
                </div>
            </section>

            <section className="wcms-calendar-month-grid-section" aria-label="月曆檢視">
                {page.isLoading
                    ? <div className="wcms-calendar-loading" aria-live="polite">讀取中…</div>
                    : <CalendarMonthGrid year={page.year} month={page.month} daysByDate={page.daysByDate} onDayClick={page.handleDayClick} />}
            </section>

            {page.isDialogOpen && page.selectedDay && page.dialogAnchor && (
                <CalendarDayDialog
                    key={page.selectedDay.Date ?? `${page.year}-${page.month}`}
                    day={page.selectedDay}
                    anchor={page.dialogAnchor}
                    onCancel={page.handleDialogCancel}
                    onSave={page.handleDialogSave}
                />
            )}
        </main>
    );
};

interface CalendarMonthGridProps
{
    year: number;
    month: number;
    daysByDate: CalendarYearMap;
    onDayClick: (dateStr: string, anchor: DialogAnchorRect) => void;
}

/** 月曆表格：舊版 table DOM */
const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = (props) =>
{
    const todayKey = useMemo(() =>
    {
        const now = new Date();
        return formatDateString(now.getFullYear(), now.getMonth(), now.getDate());
    }, []);

    const weeks = useMemo(() =>
    {
        return buildMonthWeeks(props.year, props.month);
    }, [props.year, props.month]);

    const weekDayHeader = ["日", "一", "二", "三", "四", "五", "六"];

    /** 點擊單日 */
    const handleCellClick = (e: MouseEvent<HTMLButtonElement>, dateStr: string): void =>
    {
        const rect = e.currentTarget.getBoundingClientRect();
        const anchor: DialogAnchorRect = {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            viewportWidth: typeof window !== "undefined" ? window.innerWidth : rect.right + 16,
            viewportHeight: typeof window !== "undefined" ? window.innerHeight : rect.bottom + 16,
        };

        props.onDayClick(dateStr, anchor);
    };

    return (
        <table className="wcms-calendar-month-grid">
            <thead>
                <tr>{weekDayHeader.map((label) => <th key={label} scope="col">{label}</th>)}</tr>
            </thead>

            <tbody>
                {weeks.map((row, rowIndex) => (
                    <tr key={`week-${rowIndex}`}>
                        {row.map((dateStr, colIndex) =>
                        {
                            if (!dateStr)
                            {
                                return <td key={`empty-${rowIndex}-${colIndex}`} className="empty-cell" />;
                            }

                            const day = props.daysByDate[dateStr] ?? null;
                            const jsDate = new Date(dateStr);
                            const weekDay = jsDate.getDay();
                            const dayNumber = jsDate.getDate();

                            const isWeekend = weekDay === 0 || weekDay === 6;
                            const isHoliday = Boolean(day?.IsHoliday);
                            const isToday = dateStr === todayKey;

                            const cellClassName = buildCellClassName(isWeekend, isHoliday, isToday);

                            const holidayText = getHolidayText(day);
                            const openCloseText = renderOpenCloseText(day);
                            const ariaLabel = buildCellAriaLabel(dateStr, weekDay, day);

                            return (
                                <td key={`day-${rowIndex}-${colIndex}`}>
                                    <button
                                        type="button"
                                        className={cellClassName}
                                        aria-label={ariaLabel}
                                        onClick={(e) => handleCellClick(e, dateStr)}
                                    >
                                        <span className="calendar-day-number">{dayNumber}</span>
                                        <span className="calendar-day-tag">{holidayText}</span>
                                        <span className="calendar-day-tag">{openCloseText}</span>
                                    </button>
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

interface CalendarDayDialogProps
{
    day: CalendarDetail;
    anchor: DialogAnchorRect;
    onCancel: () => void;
    onSave: (updated: CalendarDetail) => Promise<void> | void;
}

/** 編輯 Dialog：保留現在資料結構 */
const CalendarDayDialog: React.FC<CalendarDayDialogProps> = ({ day, anchor, onCancel, onSave }) =>
{
    const [local, setLocal] = useState<CalendarDetail>(day);

    const isHolidayId = useId();
    const holidayNameId = useId();
    const descId = useId();
    const openTimeId = useId();
    const closeTimeId = useId();
    const memoId = useId();
    const dialogTitleId = useId();

    useEffect(() =>
    {
        setLocal(day);
    }, [day]);

    /** 更新欄位值 */
    const setField = <K extends keyof CalendarDetail>(key: K, value: CalendarDetail[K]): void =>
    {
        setLocal((prev) => ({ ...prev, [key]: value }));
    };

    /** 提交表單 */
    const handleSubmit = (e: FormEvent<HTMLFormElement>): void =>
    {
        e.preventDefault();
        void onSave(local);
    };

    /** 點背景關閉 */
    const handleBackdropClick = (): void =>
    {
        onCancel();
    };

    /** 避免點 dialog 內部時冒泡 */
    const handleDialogClick = (e: MouseEvent<HTMLDivElement>): void =>
    {
        e.stopPropagation();
    };

    // 目前先保留 anchor 型別，之後若要改回貼齊格子可直接用
    void anchor;

    return (
        <div className="wcms-dialog-backdrop" role="presentation" onClick={handleBackdropClick}>
            <div className="wcms-dialog" role="dialog" aria-modal="true" aria-labelledby={dialogTitleId} onClick={handleDialogClick}>
                <header className="wcms-dialog-header">
                    <h2 id={dialogTitleId}>編輯 {local.Date ?? ""}（星期 {getWeekdayNameZh(Number(local.DayOfWeek ?? 0))}）</h2>

                    <button type="button" className="btn-icon" onClick={onCancel} aria-label="關閉編輯視窗">✕</button>
                </header>

                <form className="wcms-dialog-body" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <div className="form-check">
                            <input
                                id={isHolidayId}
                                className="form-check-input"
                                type="checkbox"
                                checked={Boolean(local.IsHoliday)}
                                onChange={(e) => setField("IsHoliday", e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor={isHolidayId}>是否為假日</label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor={holidayNameId}>假日名稱</label>
                        <input
                            id={holidayNameId}
                            type="text"
                            className="form-control"
                            value={local.HolidayName ?? ""}
                            onChange={(e) => setField("HolidayName", e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor={descId}>說明</label>
                        <textarea
                            id={descId}
                            className="form-control"
                            rows={3}
                            value={local.Description ?? ""}
                            onChange={(e) => setField("Description", e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <TimePicker12hWithConfirm
                            inputId={openTimeId}
                            label="開館時間"
                            value24={local.Spec_OpenTime ?? null}
                            onConfirm={(value24) => setField("Spec_OpenTime", value24)}
                        />
                    </div>

                    <div className="form-group">
                        <TimePicker12hWithConfirm
                            inputId={closeTimeId}
                            label="閉館時間"
                            value24={local.Spec_CloseTime ?? null}
                            onConfirm={(value24) => setField("Spec_CloseTime", value24)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor={memoId}>修改備註</label>
                        <textarea
                            id={memoId}
                            className="form-control"
                            rows={3}
                            value={local.Spec_ModifyMemo ?? ""}
                            onChange={(e) => setField("Spec_ModifyMemo", e.target.value)}
                        />
                    </div>

                    <footer className="wcms-dialog-footer">
                        <button type="button" className="btn btn-outline" onClick={onCancel}>取消</button>
                        <button type="submit" className="btn btn-primary">保存</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

interface TimePicker12hWithConfirmProps
{
    inputId: string;
    label: string;
    value24: string | null;
    onConfirm: (value24: string | null) => void;
}

/** 24h 轉 12h 顯示文字 */
const format12hDisplay = (value24?: string | null): string =>
{
    const parsed = parseHHmm(value24);
    if (!parsed) return "";

    const { meridiem, hh12 } = to12hParts(parsed.hh);
    const meridiemText = meridiem === "AM" ? "上午" : "下午";
    const hourText = String(hh12).padStart(2, "0");
    const minuteText = String(parsed.mm).padStart(2, "0");

    return `${meridiemText} ${hourText}:${minuteText}`;
};

/** 12h 面板組回 24h */
const build24HourValue = (meridiem: "AM" | "PM", hour12: number, minute: number): string =>
{
    const hour24 = to24hHour(meridiem, hour12);
    return formatHHmm(hour24, minute);
};

/** 12 小時制時間選擇器 */
const TimePicker12hWithConfirm: React.FC<TimePicker12hWithConfirmProps> = (props) =>
{
    const hostRef = useRef<HTMLDivElement | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [meridiem, setMeridiem] = useState<"AM" | "PM">("AM");
    const [hour12, setHour12] = useState<number>(9);
    const [minute, setMinute] = useState<number>(0);

    useEffect(() =>
    {
        const parsed = parseHHmm(props.value24);
        if (!parsed)
        {
            setMeridiem("AM");
            setHour12(9);
            setMinute(0);
            return;
        }

        const next12h = to12hParts(parsed.hh);
        setMeridiem(next12h.meridiem);
        setHour12(next12h.hh12);
        setMinute(parsed.mm);
    }, [props.value24]);

    /** 點外面關閉 */
    useEffect(() =>
    {
        if (!isOpen) return;

        const handleDocumentClick = (e: globalThis.MouseEvent): void =>
        {
            const host = hostRef.current;
            if (!host) return;
            if (host.contains(e.target as Node)) return;

            setIsOpen(false);
        };

        document.addEventListener("mousedown", handleDocumentClick);
        return () => document.removeEventListener("mousedown", handleDocumentClick);
    }, [isOpen]);

    /** 開啟 */
    const handleOpen = (): void =>
    {
        setIsOpen(true);
    };

    /** 取消 */
    const handleCancel = (): void =>
    {
        setIsOpen(false);
    };

    /** 清空 */
    const handleClear = (): void =>
    {
        props.onConfirm(null);
        setIsOpen(false);
    };

    /** 確認 */
    const handleConfirm = (): void =>
    {
        const value24 = build24HourValue(meridiem, hour12, minute);
        props.onConfirm(value24);
        setIsOpen(false);
    };

    return (
        <div ref={hostRef} style={{ position: "relative" }}>
            <label htmlFor={props.inputId}>{props.label}</label>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                    id={props.inputId}
                    type="text"
                    className="form-control"
                    value={format12hDisplay(props.value24)}
                    readOnly
                    onClick={handleOpen}
                    aria-label={`${props.label}（點擊選擇時間）`}
                    placeholder="請選擇時間"
                />

                <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleOpen}
                    aria-label={`開啟${props.label}時間選擇器`}
                    style={{ whiteSpace: "nowrap" }}
                >
                    選擇
                </button>
            </div>

            {isOpen && (
                <div
                    role="dialog"
                    aria-modal="false"
                    aria-label={`${props.label}時間選擇器`}
                    style={{
                        position: "absolute",
                        zIndex: 2000,
                        top: "calc(100% + 6px)",
                        left: 0,
                        width: "100%",
                        background: "#fff",
                        border: "1px solid rgba(0,0,0,.15)",
                        borderRadius: 8,
                        boxShadow: "0 10px 30px rgba(0,0,0,.2)",
                        padding: 10,
                    }}
                >
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ flex: 1 }}>
                            <label className="sr-only">上午下午</label>
                            <select
                                className="form-control"
                                value={meridiem}
                                onChange={(e) => setMeridiem((e.target.value as "AM" | "PM") ?? "AM")}
                                aria-label="上午下午"
                            >
                                <option value="AM">上午</option>
                                <option value="PM">下午</option>
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label className="sr-only">小時</label>
                            <select className="form-control" value={hour12} onChange={(e) => setHour12(Number(e.target.value) || 1)} aria-label="小時">
                                {Array.from({ length: 12 }, (_, index) =>
                                {
                                    const value = index + 1;
                                    return <option key={value} value={value}>{String(value).padStart(2, "0")}</option>;
                                })}
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label className="sr-only">分鐘</label>
                            <select className="form-control" value={minute} onChange={(e) => setMinute(Number(e.target.value) || 0)} aria-label="分鐘">
                                {Array.from({ length: 60 }, (_, index) => <option key={index} value={index}>{String(index).padStart(2, "0")}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                        <button type="button" className="btn btn-outline" onClick={handleClear}>清空</button>
                        <button type="button" className="btn btn-outline" onClick={handleCancel}>取消</button>
                        <button type="button" className="btn btn-primary" onClick={handleConfirm}>確認</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarPageComp;
