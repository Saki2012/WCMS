import { type CSSProperties, type Dispatch, type FocusEvent, type KeyboardEvent, type RefObject, type SetStateAction, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AAInputField, AAInputValue, FieldRenderContext } from "../AAInputField_Types";
import { FieldControlShell } from "../AAInputField_Shell";
import { applyAAFocusStyle, clearAAFocusStyle, handleCalendarDayKeyDown } from "../AAInputField_Focus";
import { buildControlClass, buildDescribedBy, getAriaInvalid, getAriaRequired, getNativeRequired, toStringArray } from "../AAInputField_Utils";
import { getPortalFocusableElements, isBrowserDocumentReady } from "../AAInputField_Dom";

// #region Property
export interface DateRangeValue { startDate: string; endDate: string; }
// #endregion

// #region Public
/**
 * 使用範例：
 * <AAInputFieldList fields={[{ key: "dateRange", type: "dateRange", label: "日期區間", aaLabel: "請選擇日期區間", value: state.dateRange }]} onChange={handleChange} />
 */

/** dateRange 欄位。 */
export const DateRangeField = (props: { field: AAInputField; context: FieldRenderContext; }) =>
{
    const wrapperRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [popupStyle, setPopupStyle] = useState<CSSProperties>({});
    const [announceText, setAnnounceText] = useState("");
    const range = getDateRangeValue(props.field.value);
    const [viewMonth, setViewMonth] = useState(() => getInitialDateRangeViewMonth(range, props.field.calendarBaseDate));
    const displayText = buildDateRangeDisplayText(range);
    const dialogId = `${props.context.fieldId}-calendar`;
    const titleId = `${dialogId}-title`;
    const statusId = `${props.context.fieldId}-date-range-status`;
    const describedBy = buildDescribedBy(props.context.describedBy, statusId);

    useEffect(() => bindDatePickerPortalOutsideClick(isOpen, wrapperRef, popupRef, closeDateRange), [isOpen]);
    useEffect(() => bindDatePickerPortalPosition(isOpen, wrapperRef, popupRef, setPopupStyle), [isOpen]);

    /** 開啟日期區間選單。 */
    const openDateRange = () =>
    {
        if (props.field.disabled || props.field.readOnly) return;
        setViewMonth(getOpenDateRangeViewMonth(range, props.field.calendarBaseDate));
        setIsOpen(true);
    };

    /** 關閉日期區間選單。 */
    const closeDateRange = () =>
    {
        setIsOpen(false);
    };

    /** 選取日期並回填 [startDate, endDate]，選完後由完成按鈕關閉。 */
    const selectDate = (date: string) =>
    {
        const nextRange = getNextDateRangeValue(range, date);
        props.context.onChange(props.field.key, [nextRange.startDate, nextRange.endDate]);
        setAnnounceText(buildDateRangeAnnounceText(nextRange));
    };

    /** 清除已選日期區間。 */
    const clearDateRange = () =>
    {
        props.context.onChange(props.field.key, []);
        setAnnounceText("已清除日期區間");
    };

    return (
        <FieldControlShell field={props.field} fieldId={props.context.fieldId} hintId={props.context.hintId} errorId={props.context.errorId}>
            <div ref={wrapperRef} className="position-relative">
                <input type="hidden" name={`${props.field.key}Start`} value={range.startDate} />
                <input type="hidden" name={`${props.field.key}End`} value={range.endDate} />
                <div className="position-relative">
                    <input
                        id={props.context.fieldId}
                        name={props.field.key}
                        type="text"
                        className={buildControlClass(props.field)}
                        style={{ paddingRight: "2.5rem", cursor: "default" }}
                        value={displayText}
                        placeholder={props.field.placeholder ?? "請選擇日期區間"}
                        disabled={props.field.disabled}
                        inputMode="none"
                        required={getNativeRequired(props.field)}
                        aria-required={getAriaRequired(props.field)}
                        aria-invalid={getAriaInvalid(props.field)}
                        aria-describedby={describedBy}
                        aria-haspopup="dialog"
                        aria-expanded={isOpen}
                        aria-controls={dialogId}
                        onFocus={applyAAFocusStyle}
                        onBlur={clearAAFocusStyle}
                        onClick={openDateRange}
                        onBeforeInput={(event) => event.preventDefault()}
                        onPaste={(event) => event.preventDefault()}
                        onChange={() => undefined}
                        onKeyDown={(event) => handleDatePortalTriggerKeyDown(event, isOpen, wrapperRef, popupRef, openDateRange, closeDateRange)}
                    />
                    <span className="position-absolute top-50 end-0 translate-middle-y pe-3" aria-hidden="true" style={{ pointerEvents: "none" }}>
                        <i className="far fa-calendar" aria-hidden="true"></i>
                    </span>
                </div>
                <div id={statusId} className="visually-hidden" aria-live="polite" aria-atomic="true">{announceText || getDateRangeStatusText(range)}</div>
                {isOpen && isBrowserDocumentReady() && createPortal(renderDateRangeDropdown(props.field, range, viewMonth, dialogId, titleId, wrapperRef, popupRef, popupStyle, selectDate, clearDateRange, closeDateRange, setViewMonth), document.body)}
            </div>
        </FieldControlShell>
    );
};


/** 渲染日期區間下拉日曆。 */
export const renderDateRangeDropdown = (
    field: AAInputField,
    range: DateRangeValue,
    viewMonth: string,
    dialogId: string,
    titleId: string,
    wrapperRef: RefObject<HTMLDivElement>,
    popupRef: RefObject<HTMLDivElement>,
    popupStyle: CSSProperties,
    selectDate: (date: string) => void,
    clearDateRange: () => void,
    closeDateRange: () => void,
    setViewMonth: Dispatch<SetStateAction<string>>,
) =>
{
    const nextMonth = addDateRangeMonths(viewMonth, 1);
    const closeDateRangeAndFocus = () =>
    {
        closeDateRange();
        focusPortalAnchor(wrapperRef.current);
    };

    return (
        <div ref={popupRef} id={dialogId} className="bg-white border rounded shadow-sm p-3" style={popupStyle} role="dialog" aria-modal="false" aria-labelledby={titleId} onKeyDown={(event) => handleDatePortalPopupKeyDown(event, wrapperRef, popupRef, closeDateRange)}>
            <div id={titleId} className="visually-hidden">{field.aaLabel ?? "請選擇日期區間"}</div>
            <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
                <button type="button" className="btn btn-link text-decoration-none px-2" aria-label="顯示上一個月" onFocus={applyAAFocusStyle} onBlur={clearAAFocusStyle} onClick={() => setViewMonth(addDateRangeMonths(viewMonth, -1))}>‹</button>
                <span className="fw-semibold text-primary">日曆</span>
                <button type="button" className="btn btn-link text-decoration-none px-2" aria-label="顯示下一個月" onFocus={applyAAFocusStyle} onBlur={clearAAFocusStyle} onClick={() => setViewMonth(addDateRangeMonths(viewMonth, 1))}>›</button>
            </div>
            <div className="row g-3">
                <div className="col-12 col-md-6">{renderDateRangeMonth(viewMonth, range, selectDate)}</div>
                <div className="col-12 col-md-6">{renderDateRangeMonth(nextMonth, range, selectDate)}</div>
            </div>
            <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-3">
                <button type="button" className="btn btn-outline-primary btn-sm" onFocus={applyAAFocusStyle} onBlur={clearAAFocusStyle} onClick={clearDateRange}>清除日期</button>
                <button type="button" className="btn btn-primary btn-sm" onFocus={applyAAFocusStyle} onBlur={clearAAFocusStyle} onClick={closeDateRangeAndFocus}>完成</button>
            </div>
        </div>
    );
};


/** 渲染單一月份日曆。 */
export const renderDateRangeMonth = (monthStart: string, range: DateRangeValue, selectDate: (date: string) => void) =>
{
    const rows = buildDateRangeCalendarRows(monthStart);

    return (
        <table className="table table-sm text-center align-middle mb-0" style={{ tableLayout: "fixed", width: "100%" }}>
            <caption className="fw-semibold text-dark caption-top text-center">{formatDateRangeMonthTitle(monthStart)}</caption>
            <thead>
                <tr>{["週日", "週一", "週二", "週三", "週四", "週五", "週六"].map((item) => <th key={item} scope="col" className="fw-normal text-muted text-nowrap" style={{ width: "14.285%", fontSize: "0.75rem", padding: "0.5rem 0", textAlign: "center" }}>{item}</th>)}</tr>
            </thead>
            <tbody>
                {rows.map((row, rowIndex) => (
                    <tr key={`${monthStart}-${rowIndex}`}>
                        {row.map((date, colIndex) => renderDateRangeDayCell(date, `${monthStart}-${rowIndex}-${colIndex}`, range, selectDate))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};


/** 取得日期區間值，固定回傳 startDate/endDate 兩個欄位。 */
export const getDateRangeValue = (value: AAInputValue): DateRangeValue =>
{
    const valueList = toStringArray(value);
    return { startDate: isValidIsoDate(valueList[0] ?? "") ? valueList[0] : "", endDate: isValidIsoDate(valueList[1] ?? "") ? valueList[1] : "" };
};


/** 正規化 dateRange 值，讓 SSR/CSR 都收到固定陣列格式。 */
export const normalizeDateRangeValue = (value: AAInputValue): string[] =>
{
    const range = getDateRangeValue(value);
    return range.startDate || range.endDate ? [range.startDate, range.endDate] : [];
};


/** 正規化日期區間初始月份，可由 loader/adapter 傳入避免 SSR/CSR 對今日日期判讀不同。 */
export const normalizeDateRangeBaseDate = (value: string | undefined, fieldValue: AAInputValue) =>
{
    if (isValidIsoDate(value ?? "")) return toDateRangeMonthStart(value ?? "");
    const range = getDateRangeValue(fieldValue);
    if (range.startDate) return toDateRangeMonthStart(range.startDate);
    if (range.endDate) return toDateRangeMonthStart(range.endDate);
    return undefined;
};


/** 取得初始渲染月份。 */
export const getInitialDateRangeViewMonth = (range: DateRangeValue, calendarBaseDate?: string) =>
{
    if (range.startDate) return toDateRangeMonthStart(range.startDate);
    if (range.endDate) return toDateRangeMonthStart(range.endDate);
    if (isValidIsoDate(calendarBaseDate ?? "")) return toDateRangeMonthStart(calendarBaseDate ?? "");
    return "2000-01-01";
};


/** 開啟時取得顯示月份。 */
export const getOpenDateRangeViewMonth = (range: DateRangeValue, calendarBaseDate?: string) =>
{
    if (range.startDate) return toDateRangeMonthStart(range.startDate);
    if (range.endDate) return toDateRangeMonthStart(range.endDate);
    if (isValidIsoDate(calendarBaseDate ?? "")) return toDateRangeMonthStart(calendarBaseDate ?? "");
    return toDateRangeMonthStart(getLocalTodayIsoDate());
};


/** 鍵盤開關日期區間選單。 */
export const handleDateRangeInputKeyDown = (event: KeyboardEvent<HTMLInputElement>, openDateRange: () => void, closeDateRange: () => void) =>
{
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") { event.preventDefault(); openDateRange(); return; }
    if (event.key === "Escape") { event.preventDefault(); closeDateRange(); return; }
    if (isDateRangeEditKey(event.key)) event.preventDefault();
};


/** 依目前日期區間與點選日期決定下一組區間值。 */
export const getNextDateRangeValue = (range: DateRangeValue, date: string): DateRangeValue =>
{
    if (!range.startDate || range.endDate) return { startDate: date, endDate: "" };
    if (date < range.startDate) return { startDate: date, endDate: range.startDate };
    return { startDate: range.startDate, endDate: date };
};


/** 短日期顯示文字。 */
export const formatShortIsoDateText = (date: string) =>
{
    const parts = getIsoDateParts(date);
    return parts ? `${parts.year}/${String(parts.month).padStart(2, "0")}/${String(parts.day).padStart(2, "0")} (${getWeekdayText(date)})` : "";
};


/** 完整日期朗讀文字。 */
export const formatFullIsoDateText = (date: string) =>
{
    const parts = getIsoDateParts(date);
    return parts ? `${parts.year} 年 ${parts.month} 月 ${parts.day} 日 星期${getWeekdayText(date)}` : "";
};


/** 取得星期文字。 */
export const getWeekdayText = (date: string) =>
{
    const parts = getIsoDateParts(date);
    if (!parts) return "";
    return ["日", "一", "二", "三", "四", "五", "六"][new Date(parts.year, parts.month - 1, parts.day).getDay()];
};


/** 增減月份。 */
export const addDateRangeMonths = (monthStart: string, count: number) =>
{
    const parts = getIsoDateParts(monthStart) ?? { year: 2000, month: 1, day: 1 };
    const date = new Date(parts.year, parts.month - 1 + count, 1);
    return buildIsoDate(date.getFullYear(), date.getMonth() + 1, 1);
};


/** 轉成月份第一天。 */
export const toDateRangeMonthStart = (date: string) =>
{
    const parts = getIsoDateParts(date);
    return parts ? buildIsoDate(parts.year, parts.month, 1) : "2000-01-01";
};


/** 檢查 ISO 日期是否有效。 */
export const isValidIsoDate = (value: string) =>
{
    const parts = getIsoDateParts(value);
    if (!parts) return false;
    return parts.day >= 1 && parts.day <= getDateRangeDaysInMonth(parts.year, parts.month);
};


/** 解析 yyyy-MM-dd。 */
export const getIsoDateParts = (value: string) =>
{
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12) return null;
    return { year, month, day };
};


/** 建立 yyyy-MM-dd。 */
export const buildIsoDate = (year: number, month: number, day: number) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
// #endregion

// #region Protected
/** 渲染日期格。 */
const renderDateRangeDayCell = (date: string, key: string, range: DateRangeValue, selectDate: (date: string) => void) =>
{
    if (!date) return <td key={key} className="border-0 py-1 px-0" style={{ width: "14.285%" }}></td>;

    return (
        <td key={key} className="border-0 py-1 px-0 text-center" style={{ width: "14.285%" }}>
            <button
                type="button"
                className={buildDateRangeDayClass(date, range)}
                style={{ width: "2rem", minWidth: "2rem", height: "2rem", fontSize: "0.875rem", lineHeight: 1, whiteSpace: "nowrap" }}
                data-calendar-date={date}
                aria-label={buildDateRangeDayAriaLabel(date, range)}
                aria-pressed={isDateRangeEndpoint(date, range)}
                onFocus={applyAAFocusStyle}
                onBlur={clearAAFocusStyle}
                onKeyDown={(event) => handleCalendarDayKeyDown(event, date)}
                onClick={() => selectDate(date)}
            >
                {getIsoDateParts(date)?.day}
            </button>
        </td>
    );
};


/** 產生 fixed 浮層位置，避免被 table/td/overflow 裁切。 */
const buildDatePickerPortalStyle = (anchor: HTMLDivElement | null, popup: HTMLDivElement | null): CSSProperties =>
{
    if (!anchor || !isBrowserDocumentReady()) return { display: "none" };

    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 12;
    const gap = 4;
    const width = Math.min(Math.max(rect.width, 640), Math.max(280, viewportWidth - margin * 2));
    const left = Math.min(Math.max(rect.left, margin), Math.max(margin, viewportWidth - width - margin));
    const bottomSpace = Math.max(120, viewportHeight - rect.bottom - margin - gap);
    const topSpace = Math.max(120, rect.top - margin - gap);
    const estimatedHeight = Math.min(popup?.offsetHeight || 420, viewportHeight - margin * 2);
    const shouldOpenAbove = bottomSpace < estimatedHeight && topSpace > bottomSpace;
    const maxHeight = Math.max(120, shouldOpenAbove ? topSpace : bottomSpace);
    const top = shouldOpenAbove ? Math.max(margin, rect.top - Math.min(estimatedHeight, maxHeight) - gap) : Math.min(rect.bottom + gap, viewportHeight - margin - 120);

    return {
        position: "fixed",
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        maxWidth: `calc(100vw - ${margin * 2}px)`,
        maxHeight: `${maxHeight}px`,
        overflowX: "hidden",
        overflowY: "auto",
        boxSizing: "border-box",
        zIndex: 99999,
    };
};


/** 建立月份日曆列。 */
const buildDateRangeCalendarRows = (monthStart: string) =>
{
    const parts = getIsoDateParts(monthStart);
    if (!parts) return [["", "", "", "", "", "", ""]];
    const firstWeekday = new Date(parts.year, parts.month - 1, 1).getDay();
    const daysInMonth = getDateRangeDaysInMonth(parts.year, parts.month);
    const rows: string[][] = [];
    let day = 1;

    for (let rowIndex = 0; rowIndex < 6; rowIndex++)
    {
        const row: string[] = [];
        for (let colIndex = 0; colIndex < 7; colIndex++)
        {
            const showDay = !(rowIndex === 0 && colIndex < firstWeekday) && day <= daysInMonth;
            row.push(showDay ? buildIsoDate(parts.year, parts.month, day++) : "");
        }
        rows.push(row);
        if (day > daysInMonth) break;
    }

    return rows;
};


/** 建立日期按鈕樣式。 */
const buildDateRangeDayClass = (date: string, range: DateRangeValue) =>
{
    const classList = ["btn", "btn-sm", "rounded-3", "d-inline-flex", "align-items-center", "justify-content-center"];
    if (isDateRangeEndpoint(date, range)) classList.push("btn-primary", "border", "border-primary");
    else if (isDateInSelectedRange(date, range)) classList.push("bg-primary-subtle", "text-primary", "border", "border-primary");
    else classList.push("btn-light", "border-0");
    return classList.join(" ");
};


/** 建立日期按鈕朗讀文字。 */
const buildDateRangeDayAriaLabel = (date: string, range: DateRangeValue) =>
{
    const text = formatFullIsoDateText(date);
    if (date === range.startDate && date === range.endDate) return `${text}，已選為開始與結束日期`;
    if (date === range.startDate) return `${text}，已選為開始日期`;
    if (date === range.endDate) return `${text}，已選為結束日期`;
    if (isDateInSelectedRange(date, range)) return `${text}，位於已選日期區間內`;
    return `選擇 ${text}`;
};


/** 日期區間操作回饋文字。 */
const buildDateRangeAnnounceText = (range: DateRangeValue) => range.endDate ? `已選取日期區間：${formatFullIsoDateText(range.startDate)} 至 ${formatFullIsoDateText(range.endDate)}` : `已選取開始日期：${formatFullIsoDateText(range.startDate)}`;


/** 建立輸入框顯示文字。 */
const buildDateRangeDisplayText = (range: DateRangeValue) =>
{
    if (range.startDate && range.endDate) return `${formatShortIsoDateText(range.startDate)} ~ ${formatShortIsoDateText(range.endDate)}`;
    if (range.startDate) return `${formatShortIsoDateText(range.startDate)} ~ 請選擇結束日`;
    return "";
};
// #endregion

// #region Private
/** 讓 trigger 的 Tab 進入 Portal 浮層內容，避免因 Portal DOM 順序跳過日曆。 */
const handleDatePortalTriggerKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    isOpen: boolean,
    wrapperRef: RefObject<HTMLDivElement>,
    popupRef: RefObject<HTMLDivElement>,
    openPicker: () => void,
    closePicker: () => void,
) =>
{
    if (event.key === "Escape" && isOpen)
    {
        event.preventDefault();
        closePicker();
        focusPortalAnchor(wrapperRef.current);
        return;
    }

    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown")
    {
        event.preventDefault();
        openPicker();
        focusFirstPortalElement(popupRef);
        return;
    }

    if (event.key === "Tab" && isOpen && !event.shiftKey)
    {
        event.preventDefault();
        focusFirstPortalElement(popupRef);
    }
};


/** 控制 Portal 浮層內 Tab 離開時回到原表單流程，而不是跳到 body 結尾。 */
const handleDatePortalPopupKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    wrapperRef: RefObject<HTMLDivElement> | undefined,
    popupRef: RefObject<HTMLDivElement>,
    closePicker: () => void,
) =>
{
    if (event.key === "Escape")
    {
        event.preventDefault();
        closePicker();
        focusPortalAnchor(wrapperRef?.current);
        return;
    }

    if (event.key !== "Tab" || !isBrowserDocumentReady()) return;

    const focusableList = getPortalFocusableElements(popupRef.current);
    if (focusableList.length === 0) return;

    const activeElement = document.activeElement as HTMLElement | null;
    const firstElement = focusableList[0];
    const lastElement = focusableList[focusableList.length - 1];

    if (event.shiftKey && activeElement === firstElement)
    {
        event.preventDefault();
        closePicker();
        focusLastBeforeElement(wrapperRef?.current);
        return;
    }

    if (!event.shiftKey && activeElement === lastElement)
    {
        event.preventDefault();
        closePicker();
        focusFirstAfterElement(wrapperRef?.current);
    }
};


/** ESC 關閉 Portal 後，將 focus 回到原本開啟 popup 的欄位。 */
const focusPortalAnchor = (anchor: HTMLElement | null | undefined) =>
{
    if (!anchor || !isBrowserDocumentReady()) return;

    const focusableList = getPortalFocusableElements(anchor);
    focusElementWithoutScroll(focusableList[0] ?? anchor);
};


/** 將 focus 移到 Portal 內第一個可操作元素。 */
const focusFirstPortalElement = (popupRef: RefObject<HTMLDivElement>) =>
{
    if (!isBrowserDocumentReady()) return;

    focusFirstPortalElementWithRetry(popupRef, 0);
};


/** Portal render 需要等待 React commit，最多重試數次以確保 Enter 後能進入 popup。 */
const focusFirstPortalElementWithRetry = (popupRef: RefObject<HTMLDivElement>, retryCount: number) =>
{
    window.requestAnimationFrame(() =>
    {
        const firstElement = getPortalFocusableElements(popupRef.current)[0];
        if (firstElement) { focusElementWithoutScroll(firstElement); return; }
        if (retryCount < 5) focusFirstPortalElementWithRetry(popupRef, retryCount + 1);
    });
};


/** focus 元素但避免瀏覽器自動捲動頁面。 */
const focusElementWithoutScroll = (element: HTMLElement | null | undefined) =>
{
    if (!element) return;
    element.focus({ preventScroll: true });
};


/** focus 到指定元素後方的下一個可操作元素。 */
const focusFirstAfterElement = (anchor: HTMLElement | null | undefined) =>
{
    if (!anchor || !isBrowserDocumentReady()) return;

    const focusableList = getPortalFocusableElements(document.body);
    const anchorIndex = focusableList.findIndex((element) => element === anchor || anchor.contains(element));
    focusElementWithoutScroll(focusableList.slice(anchorIndex + 1).find((element) => !anchor.contains(element)));
};


/** focus 到指定元素前方的上一個可操作元素。 */
const focusLastBeforeElement = (anchor: HTMLElement | null | undefined) =>
{
    if (!anchor || !isBrowserDocumentReady()) return;

    const focusableList = getPortalFocusableElements(document.body);
    const anchorIndex = focusableList.findIndex((element) => element === anchor || anchor.contains(element));
    const previousList = anchorIndex <= 0 ? [] : focusableList.slice(0, anchorIndex).reverse();
    focusElementWithoutScroll(previousList.find((element) => !anchor.contains(element)));
};


/** 綁定自製日期選擇器的外部點擊，Portal 面板與原 input 都視為內部。 */
const bindDatePickerPortalOutsideClick = (
    isOpen: boolean,
    wrapperRef: RefObject<HTMLDivElement>,
    popupRef: RefObject<HTMLDivElement>,
    closePicker: () => void,
) =>
{
    if (!isOpen || !isBrowserDocumentReady()) return;

    const handleMouseDown = (event: MouseEvent) =>
    {
        const target = event.target as Node | null;
        if (!target) return;
        if (wrapperRef.current?.contains(target) || popupRef.current?.contains(target)) return;
        closePicker();
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    return () => document.removeEventListener("mousedown", handleMouseDown, true);
};


/** 綁定 Portal 面板定位，讓日期區間可浮在表格與 overflow 容器上方。 */
const bindDatePickerPortalPosition = (
    isOpen: boolean,
    wrapperRef: RefObject<HTMLDivElement>,
    popupRef: RefObject<HTMLDivElement>,
    setPopupStyle: (style: CSSProperties) => void,
) =>
{
    if (!isOpen || !isBrowserDocumentReady()) return;

    const updatePosition = () => setPopupStyle(buildDatePickerPortalStyle(wrapperRef.current, popupRef.current));
    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () =>
    {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
    };
};


/** focus 離開 input 與 Portal 面板後關閉日期選擇器。 */
const closeDatePickerWhenPortalFocusLeaves = (
    event: FocusEvent<HTMLDivElement>,
    wrapperRef: RefObject<HTMLDivElement> | undefined,
    popupRef: RefObject<HTMLDivElement>,
    closePicker: () => void,
) =>
{
    if (!isBrowserDocumentReady()) return;

    window.requestAnimationFrame(() =>
    {
        const activeElement = document.activeElement;
        if (!activeElement) { closePicker(); return; }
        if (wrapperRef?.current?.contains(activeElement) || popupRef.current?.contains(activeElement)) return;
        closePicker();
    });
};



/** 阻擋使用者直接修改顯示框內容，只允許透過日期選擇器更新值。 */
const isDateRangeEditKey = (key: string) => key.length === 1 || key === "Backspace" || key === "Delete";


/** 日期是否為起訖端點。 */
const isDateRangeEndpoint = (date: string, range: DateRangeValue) => date === range.startDate || date === range.endDate;


/** 日期是否在已選區間內。 */
const isDateInSelectedRange = (date: string, range: DateRangeValue) => Boolean(range.startDate && range.endDate && date > range.startDate && date < range.endDate);


/** 日期區間目前狀態文字。 */
const getDateRangeStatusText = (range: DateRangeValue) =>
{
    if (range.startDate && range.endDate) return `目前已選取日期區間：${formatFullIsoDateText(range.startDate)} 至 ${formatFullIsoDateText(range.endDate)}`;
    if (range.startDate) return `目前已選取開始日期：${formatFullIsoDateText(range.startDate)}，請選擇結束日期`;
    return "目前尚未選取日期區間";
};


/** 月份標題。 */
const formatDateRangeMonthTitle = (monthStart: string) =>
{
    const parts = getIsoDateParts(monthStart);
    return parts ? `${parts.month} 月 ${parts.year}` : "";
};


/** 取得本地今日日期，僅於 CSR 使用者操作事件後呼叫。 */
const getLocalTodayIsoDate = () =>
{
    const date = new Date();
    return buildIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
};


/** 取得月份天數。 */
const getDateRangeDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
// #endregion
