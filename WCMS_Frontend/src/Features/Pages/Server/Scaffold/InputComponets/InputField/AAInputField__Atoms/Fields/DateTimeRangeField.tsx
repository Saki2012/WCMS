import { type CSSProperties, type Dispatch, type FocusEvent, type KeyboardEvent, type RefObject, type SetStateAction, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AAInputField, AAInputValue, FieldRenderContext } from "../AAInputField_Types";
import { FieldControlShell } from "../AAInputField_Shell";
import { applyAAFocusStyle, clearAAFocusStyle } from "../AAInputField_Focus";
import { buildControlClass, buildDescribedBy, getAriaInvalid, getAriaRequired, getNativeRequired, toStringArray } from "../AAInputField_Utils";
import { type DateRangeValue, addDateRangeMonths, formatFullIsoDateText, getDateRangeValue, getInitialDateRangeViewMonth, getNextDateRangeValue, getOpenDateRangeViewMonth, getWeekdayText, handleDateRangeInputKeyDown, isValidIsoDate, renderDateRangeMonth, toDateRangeMonthStart } from "./DateRangeField";

// #region Property
interface DateTimeRangeValue { startDate: string; startTime: string; endDate: string; endTime: string; }
// #endregion

// #region Public
/**
 * 使用範例：
 * <AAInputFieldList fields={[{ key: "dateTimeRange", type: "dateTimeRange", label: "日期時間區間", aaLabel: "請選擇日期與時間區間", value: ["2026-10-11T05:08", "2026-11-01T20:11"] }]} onChange={handleChange} />
 */

/** dateTimeRange 欄位。 */
export const DateTimeRangeField = (props: { field: AAInputField; context: FieldRenderContext; }) =>
{
    const wrapperRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [popupStyle, setPopupStyle] = useState<CSSProperties>({});
    const [announceText, setAnnounceText] = useState("");
    const range = getDateTimeRangeValue(props.field.value);
    const dateRange = getDateTimeRangeDateRange(range);
    const [viewMonth, setViewMonth] = useState(() => getInitialDateRangeViewMonth(dateRange, props.field.calendarBaseDate));
    const displayText = buildDateTimeRangeDisplayText(range);
    const dialogId = `${props.context.fieldId}-calendar`;
    const titleId = `${dialogId}-title`;
    const statusId = `${props.context.fieldId}-date-time-range-status`;
    const startTimeId = `${props.context.fieldId}-start-time`;
    const endTimeId = `${props.context.fieldId}-end-time`;
    const describedBy = buildDescribedBy(props.context.describedBy, statusId);

    useEffect(() => bindDatePickerPortalOutsideClick(isOpen, wrapperRef, popupRef, closeDateTimeRange), [isOpen]);
    useEffect(() => bindDatePickerPortalPosition(isOpen, wrapperRef, popupRef, setPopupStyle), [isOpen]);

    /** 開啟日期時間區間選單，優先顯示已選區間位置。 */
    const openDateTimeRange = () =>
    {
        if (props.field.disabled || props.field.readOnly) return;
        setViewMonth(getOpenDateRangeViewMonth(dateRange, props.field.calendarBaseDate));
        setIsOpen(true);
    };

    /** 關閉日期時間區間選單。 */
    function closeDateTimeRange()
    {
        setIsOpen(false);
    }

    /** 選取日期後同步保留目前時間設定。 */
    const selectDate = (date: string) =>
    {
        const nextDateRange = getNextDateRangeValue(dateRange, date);
        const nextRange = buildNextDateTimeRange(range, nextDateRange);
        commitDateTimeRangeValue(props.field, nextRange, props.context.onChange);
        setAnnounceText(buildDateTimeRangeAnnounceText(nextRange));
    };

    /** 更新開始時間。 */
    const changeStartTime = (value: string) =>
    {
        const nextRange = { ...range, startTime: normalizeTimeText(value, "00:00") };
        commitDateTimeRangeValue(props.field, nextRange, props.context.onChange);
        setAnnounceText(buildDateTimeRangeAnnounceText(nextRange));
    };

    /** 更新結束時間。 */
    const changeEndTime = (value: string) =>
    {
        const nextRange = { ...range, endTime: normalizeTimeText(value, "23:59") };
        commitDateTimeRangeValue(props.field, nextRange, props.context.onChange);
        setAnnounceText(buildDateTimeRangeAnnounceText(nextRange));
    };

    /** 清除已選日期時間區間。 */
    const clearDateTimeRange = () =>
    {
        props.context.onChange(props.field.key, []);
        setAnnounceText("已清除日期時間區間");
    };

    return (
        <FieldControlShell field={props.field} fieldId={props.context.fieldId} hintId={props.context.hintId} errorId={props.context.errorId}>
            <div ref={wrapperRef} className="position-relative">
                <input type="hidden" name={`${props.field.key}Start`} value={buildDateTimeRangeHiddenValue(range.startDate, range.startTime)} />
                <input type="hidden" name={`${props.field.key}End`} value={buildDateTimeRangeHiddenValue(range.endDate, range.endTime)} />
                <div className="position-relative">
                    <input
                        id={props.context.fieldId}
                        name={props.field.key}
                        type="text"
                        className={buildControlClass(props.field)}
                        style={{ paddingRight: "2.5rem", cursor: "default" }}
                        value={displayText}
                        placeholder={props.field.placeholder ?? "請選擇日期時間區間"}
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
                        onClick={openDateTimeRange}
                        onBeforeInput={(event) => event.preventDefault()}
                        onPaste={(event) => event.preventDefault()}
                        onChange={() => undefined}
                        onKeyDown={(event) => handleDatePortalTriggerKeyDown(event, isOpen, wrapperRef, popupRef, openDateTimeRange, closeDateTimeRange)}
                    />
                    <span className="position-absolute top-50 end-0 translate-middle-y pe-3" aria-hidden="true" style={{ pointerEvents: "none" }}>
                        <i className="far fa-calendar" aria-hidden="true"></i>
                    </span>
                </div>
                <div id={statusId} className="visually-hidden" aria-live="polite" aria-atomic="true">{announceText || getDateTimeRangeStatusText(range)}</div>
                {isOpen && isBrowserDocumentReady() && createPortal(renderDateTimeRangeDropdown(props.field, range, viewMonth, dialogId, titleId, wrapperRef, popupRef, popupStyle, startTimeId, endTimeId, selectDate, changeStartTime, changeEndTime, clearDateTimeRange, closeDateTimeRange, setViewMonth), document.body)}
            </div>
        </FieldControlShell>
    );
};


/** 正規化 dateTimeRange 值，讓 SSR/CSR 都收到固定陣列格式。 */
export const normalizeDateTimeRangeValue = (value: AAInputValue): string[] =>
{
    return buildDateTimeRangeOutputList(getDateTimeRangeValue(value));
};


/** 正規化日期時間區間初始月份。 */
export const normalizeDateTimeRangeBaseDate = (value: string | undefined, fieldValue: AAInputValue) =>
{
    if (isValidIsoDate(value ?? "")) return toDateRangeMonthStart(value ?? "");
    const range = getDateTimeRangeValue(fieldValue);
    if (range.startDate) return toDateRangeMonthStart(range.startDate);
    if (range.endDate) return toDateRangeMonthStart(range.endDate);
    return undefined;
};
// #endregion

// #region EntityComp
/** 渲染日期時間區間下拉日曆與時間選擇。 */
const renderDateTimeRangeDropdown = (
    field: AAInputField,
    range: DateTimeRangeValue,
    viewMonth: string,
    dialogId: string,
    titleId: string,
    wrapperRef: RefObject<HTMLDivElement>,
    popupRef: RefObject<HTMLDivElement>,
    popupStyle: CSSProperties,
    startTimeId: string,
    endTimeId: string,
    selectDate: (date: string) => void,
    changeStartTime: (value: string) => void,
    changeEndTime: (value: string) => void,
    clearDateTimeRange: () => void,
    closeDateTimeRange: () => void,
    setViewMonth: Dispatch<SetStateAction<string>>,
) =>
{
    const nextMonth = addDateRangeMonths(viewMonth, 1);
    const dateRange = getDateTimeRangeDateRange(range);
    const closeDateTimeRangeAndFocus = () =>
    {
        closeDateTimeRange();
        focusPortalAnchor(wrapperRef.current);
    };

    return (
        <div ref={popupRef} id={dialogId} className="bg-white border rounded shadow-sm p-3" style={popupStyle} role="dialog" aria-modal="false" aria-labelledby={titleId} onKeyDown={(event) => handleDatePortalPopupKeyDown(event, wrapperRef, popupRef, closeDateTimeRange)}>
            <div id={titleId} className="visually-hidden">{field.aaLabel ?? "請選擇日期與時間區間"}</div>
            <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
                <button type="button" className="btn btn-link text-decoration-none px-2" aria-label="顯示上一個月" onFocus={applyAAFocusStyle} onBlur={clearAAFocusStyle} onClick={() => setViewMonth(addDateRangeMonths(viewMonth, -1))}>‹</button>
                <span className="fw-semibold text-primary">日曆</span>
                <button type="button" className="btn btn-link text-decoration-none px-2" aria-label="顯示下一個月" onFocus={applyAAFocusStyle} onBlur={clearAAFocusStyle} onClick={() => setViewMonth(addDateRangeMonths(viewMonth, 1))}>›</button>
            </div>
            <div className="row g-3">
                <div className="col-12 col-md-6">{renderDateRangeMonth(viewMonth, dateRange, selectDate)}</div>
                <div className="col-12 col-md-6">{renderDateRangeMonth(nextMonth, dateRange, selectDate)}</div>
            </div>
            <div className="row g-2 border-top mt-4 mb-2">
                <div className="col-12 col-md-6">
                    <label htmlFor={startTimeId} className="form-label small mb-1">開始時間</label>
                    <input id={startTimeId} type="time" className="form-control form-control-sm" value={range.startTime} disabled={field.disabled || !range.startDate} aria-label={`${field.label}開始時間`} onFocus={applyAAFocusStyle} onBlur={clearAAFocusStyle} onChange={(event) => changeStartTime(event.target.value)} />
                </div>
                <div className="col-12 col-md-6">
                    <label htmlFor={endTimeId} className="form-label small mb-1">結束時間</label>
                    <input id={endTimeId} type="time" className="form-control form-control-sm" value={range.endTime} disabled={field.disabled || !range.endDate} aria-label={`${field.label}結束時間`} onFocus={applyAAFocusStyle} onBlur={clearAAFocusStyle} onChange={(event) => changeEndTime(event.target.value)} />
                </div>
            </div>
            <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-3">
                <button type="button" className="btn btn-outline-primary btn-sm" onFocus={applyAAFocusStyle} onBlur={clearAAFocusStyle} onClick={clearDateTimeRange}>清除日期時間</button>
                <button type="button" className="btn btn-primary btn-sm" onFocus={applyAAFocusStyle} onBlur={clearAAFocusStyle} onClick={closeDateTimeRangeAndFocus}>完成</button>
            </div>
        </div>
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


/** 依下一組日期區間建立日期時間區間。 */
const buildNextDateTimeRange = (range: DateTimeRangeValue, dateRange: DateRangeValue): DateTimeRangeValue =>
{
    return { startDate: dateRange.startDate, startTime: normalizeTimeText(range.startTime, "00:00"), endDate: dateRange.endDate, endTime: normalizeTimeText(range.endTime, "23:59") };
};


/** 建立 dateTimeRange 輸出陣列。 */
const buildDateTimeRangeOutputList = (range: DateTimeRangeValue): string[] =>
{
    const startValue = buildDateTimeRangeHiddenValue(range.startDate, range.startTime);
    const endValue = buildDateTimeRangeHiddenValue(range.endDate, range.endTime);
    return startValue || endValue ? [startValue, endValue] : [];
};


/** 建立日期時間儲存字串。 */
const buildDateTimeRangeHiddenValue = (date: string, time: string) => date && isValidIsoDate(date) ? `${date}T${normalizeTimeText(time, "00:00")}` : "";


/** 建立日期時間區間顯示文字。 */
const buildDateTimeRangeDisplayText = (range: DateTimeRangeValue) =>
{
    if (range.startDate && range.endDate) return `${formatDateTimeRangeDisplayItem(range.startDate, range.startTime)} ~ ${formatDateTimeRangeDisplayItem(range.endDate, range.endTime)}`;
    if (range.startDate) return `${formatDateTimeRangeDisplayItem(range.startDate, range.startTime)} ~ 請選擇結束日`;
    return "";
};


/** 日期時間區間操作回饋文字。 */
const buildDateTimeRangeAnnounceText = (range: DateTimeRangeValue) =>
{
    if (range.startDate && range.endDate) return `已選取日期時間區間：${formatDateTimeRangeDisplayItem(range.startDate, range.startTime)} 至 ${formatDateTimeRangeDisplayItem(range.endDate, range.endTime)}`;
    if (range.startDate) return `已選取開始日期時間：${formatDateTimeRangeDisplayItem(range.startDate, range.startTime)}`;
    return "目前尚未選取日期時間區間";
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


/** 取得可被鍵盤 focus 的元素。 */
const getPortalFocusableElements = (root: ParentNode | null) =>
{
    if (!root) return [] as HTMLElement[];

    return Array.from(root.querySelectorAll<HTMLElement>(getPortalFocusableSelector()))
        .filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true" && element.tabIndex !== -1 && !isHiddenInputElement(element) && isElementVisible(element));
};


/** 取得可被鍵盤 focus 的 selector。 */
const getPortalFocusableSelector = () => [
    "a[href]",
    "button",
    "input",
    "select",
    "textarea",
    "[tabindex]",
    "[role='button']",
    "[role='option']",
    "[role='combobox']",
].join(", ");


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


/** 排除 hidden input，避免 Tab 離開 Portal 後回到錯誤位置。 */
const isHiddenInputElement = (element: HTMLElement) =>
{
    return element instanceof HTMLInputElement && element.type === "hidden";
};


/** 判斷元素目前是否可視。 */
const isElementVisible = (element: HTMLElement) =>
{
    const style = window.getComputedStyle(element);
    return style.visibility !== "hidden" && style.display !== "none";
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


/** 確認目前可使用 document，避免 SSR render 階段碰到 browser API。 */
const isBrowserDocumentReady = () => typeof document !== "undefined" && typeof window !== "undefined";


/** 取得日期時間區間值，固定回傳日期與時間欄位。 */
const getDateTimeRangeValue = (value: AAInputValue): DateTimeRangeValue =>
{
    const valueList = toStringArray(value);
    const start = parseDateTimeRangeItem(valueList[0] ?? "", "00:00");
    const end = parseDateTimeRangeItem(valueList[1] ?? "", "23:59");
    return { startDate: start.date, startTime: start.time, endDate: end.date, endTime: end.time };
};


/** 解析日期時間字串，支援 yyyy-MM-ddTHH:mm 與 yyyy-MM-dd HH:mm。 */
const parseDateTimeRangeItem = (value: string, fallbackTime: string) =>
{
    const match = /^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}))?$/.exec(value);
    const date = match && isValidIsoDate(match[1]) ? match[1] : "";
    const time = normalizeTimeText(match?.[2] ?? fallbackTime, fallbackTime);
    return { date, time };
};


/** 由日期時間區間取得日期區間。 */
const getDateTimeRangeDateRange = (range: DateTimeRangeValue): DateRangeValue => ({ startDate: range.startDate, endDate: range.endDate });


/** 回填日期時間區間值。 */
const commitDateTimeRangeValue = (field: AAInputField, range: DateTimeRangeValue, onChange: (fieldKey: string, value: AAInputValue) => void) =>
{
    onChange(field.key, buildDateTimeRangeOutputList(range));
};


/** 建立單一日期時間顯示文字。 */
const formatDateTimeRangeDisplayItem = (date: string, time: string) =>
{
    const [year, month, day] = date.split("-");
    return year && month && day ? `${year}/${month}/${day} (${getWeekdayText(date)}) ${formatTimeDisplayText(time)}` : "";
};


/** 建立時間顯示文字。 */
const formatTimeDisplayText = (time: string) =>
{
    const parts = getTimeParts(time);
    if (!parts) return "";
    const period = parts.hour < 12 ? "上午" : "下午";
    const hour = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
    return `${period} ${String(hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
};


/** 日期時間區間目前狀態文字。 */
const getDateTimeRangeStatusText = (range: DateTimeRangeValue) =>
{
    if (range.startDate && range.endDate) return `目前已選取日期時間區間：${formatDateTimeRangeDisplayItem(range.startDate, range.startTime)} 至 ${formatDateTimeRangeDisplayItem(range.endDate, range.endTime)}`;
    if (range.startDate) return `目前已選取開始日期時間：${formatDateTimeRangeDisplayItem(range.startDate, range.startTime)}，請選擇結束日期`;
    return "目前尚未選取日期時間區間";
};


/** 正規化時間文字。 */
const normalizeTimeText = (value: string, fallback: string) => isValidTimeText(value) ? value : fallback;


/** 檢查 HH:mm 是否有效。 */
const isValidTimeText = (value: string) => Boolean(getTimeParts(value));


/** 解析 HH:mm。 */
const getTimeParts = (value: string) =>
{
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return { hour, minute };
};
// #endregion
