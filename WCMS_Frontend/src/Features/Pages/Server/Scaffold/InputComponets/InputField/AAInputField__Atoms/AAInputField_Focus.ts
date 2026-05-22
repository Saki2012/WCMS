import type { FocusEvent, KeyboardEvent } from "react";

/** 套用明確鍵盤焦點樣式，避免專案 CSS reset 後看不出目前焦點位置。 */
export const applyAAFocusStyle = (event: FocusEvent<HTMLElement>) =>
{
    const target = event.currentTarget;
    target.style.outline = "1px solid #111";
    target.style.outlineOffset = "-1px";
    target.style.boxShadow = "none";
};

/** 清除元件自行套用的焦點樣式。 */
export const clearAAFocusStyle = (event: FocusEvent<HTMLElement>) =>
{
    const target = event.currentTarget;
    target.style.outline = "";
    target.style.outlineOffset = "";
    target.style.boxShadow = "none";
};

/** file input focus 時，改外層虛框 border。 */
export const applyFileAAFocusStyle = (event: FocusEvent<HTMLElement>) =>
{
    const parentElement = event.currentTarget.parentElement;
    if (!parentElement) return;

    parentElement.style.border = "1px solid #111";
};

/** file input blur 時，還原外層虛框 border。 */
export const clearFileAAFocusStyle = (event: FocusEvent<HTMLElement>) =>
{
    const parentElement = event.currentTarget.parentElement;
    if (!parentElement) return;

    parentElement.style.border = "1px dashed #777";
};

/** 讓月曆日期支援方向鍵移動焦點。 */
export const handleCalendarDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: string) =>
{
    const dayOffsetMap: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const offset = dayOffsetMap[event.key];
    if (!offset) return;

    event.preventDefault();
    focusCalendarDate(event.currentTarget, addIsoDateDays(date, offset));
};

/** 移動到目前月曆面板中指定日期的按鈕。 */
const focusCalendarDate = (sourceButton: HTMLButtonElement, targetDate: string) =>
{
    const dialog = sourceButton.closest('[role="dialog"]');
    const targetButton = dialog?.querySelector<HTMLButtonElement>(`[data-calendar-date="${targetDate}"]`);
    targetButton?.focus();
};

/** 增減 ISO 日期天數。 */
const addIsoDateDays = (date: string, count: number) =>
{
    const parts = getLocalIsoDateParts(date);
    if (!parts) return date;
    const nextDate = new Date(parts.year, parts.month - 1, parts.day + count);
    return buildLocalIsoDate(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
};

/** 解析 yyyy-MM-dd，避免焦點工具與日期元件產生循環依賴。 */
const getLocalIsoDateParts = (value: string) =>
{
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
};

/** 建立 yyyy-MM-dd，避免焦點工具與日期元件產生循環依賴。 */
const buildLocalIsoDate = (year: number, month: number, day: number) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

/** dateRange / dateTimeRange 透過 Tab 離開整個選擇器時，自動關閉浮層。 */
export const closeDatePickerWhenFocusLeaves = (event: FocusEvent<HTMLDivElement>, closePicker: () => void) =>
{
    const nextFocus = event.relatedTarget as Node | null;
    if (nextFocus && event.currentTarget.contains(nextFocus)) return;
    closePicker();
};
