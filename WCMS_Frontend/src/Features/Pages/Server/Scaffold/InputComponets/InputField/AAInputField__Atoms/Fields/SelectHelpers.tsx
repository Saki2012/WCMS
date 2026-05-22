import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import type { AAInputField, AAInputOption, AAInputValue } from "../AAInputField_Types";

/** 搜尋可用選項，僅做純文字比對避免 HTML 注入風險。 */
export const filterSelectOptions = (optionList: AAInputOption[], searchText: string) =>
{
    const keyword = normalizeSearchText(searchText, 80).toLowerCase();
    if (!keyword) return optionList;
    return optionList.filter((item) => item.label.toLowerCase().includes(keyword) || item.value.toLowerCase().includes(keyword));
};

/** 搜尋尚未選取的多選項目。 */
export const filterUnselectedSelectOptions = (optionList: AAInputOption[], selectedValues: string[], searchText: string) =>
{
    const selectedSet = new Set(selectedValues);
    return filterSelectOptions(optionList, searchText).filter((item) => !selectedSet.has(item.value));
};

/** 限制搜尋字串長度並移除控制字元。 */
export const normalizeSearchText = (value: string, maxLength: number) => value.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, maxLength);

/** 取得第一個可選項目。 */
export const getFirstEnabledIndex = (optionList: AAInputOption[]) => optionList.findIndex((item) => !item.disabled);

/** 取得下一個可用項目的 index。 */
export const getNextEnabledIndex = (optionList: AAInputOption[], activeIndex: number, step: number) =>
{
    if (optionList.length === 0) return -1;
    for (let count = 1; count <= optionList.length; count++)
    {
        const nextIndex = (activeIndex + step * count + optionList.length) % optionList.length;
        if (!optionList[nextIndex].disabled) return nextIndex;
    }
    return -1;
};

/** 建立搜尋選項 id。 */
export const getSearchOptionId = (fieldId: string, value: string) => `${fieldId}-option-${value.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

/** 讓鍵盤 active option 維持在可視範圍內。 */
export const scrollActiveSelectOption = (activeOptionId?: string) =>
{
    if (!activeOptionId) return;
    document.getElementById(activeOptionId)?.scrollIntoView({ block: "nearest" });
};

/** 取得目前選取項目的顯示文字。 */
export const getSelectedOptionLabel = (optionList: AAInputOption[], selectedValue: string, placeholder?: string) => optionList.find((item) => item.value === selectedValue)?.label ?? placeholder ?? "請選擇...";

/** 建立可搜尋 select 選項樣式。 */
export const buildSearchOptionClass = (isSelected: boolean, isActive: boolean, disabled?: boolean) =>
{
    const classList = ["list-group-item", "list-group-item-action", "d-flex", "align-items-center", "py-1", "small"];
    if (isSelected || isActive) classList.push("active");
    if (disabled) classList.push("disabled", "opacity-75");
    return classList.join(" ");
};

/** 綁定外部點擊關閉選單，僅在 CSR effect 中執行避免 SSR 差異。 */
export const bindOutsideClick = (isOpen: boolean, wrapperRef: RefObject<HTMLDivElement>, closeSelect: () => void) =>
{
    if (!isOpen) return;
    const handleMouseDown = (event: globalThis.MouseEvent) =>
    {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) closeSelect();
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
};

/** 渲染查詢輸入框的清除按鈕。 */
export const renderSearchClearButton = (ariaLabel: string, onClear: () => void) =>
{
    return (
        <button
            type="button"
            className="btn btn-link text-muted position-absolute top-50 end-0 translate-middle-y px-2 py-0"
            style={{ textDecoration: "none" }}
            aria-label={ariaLabel}
            onMouseDown={(event: ReactMouseEvent<HTMLButtonElement>) => event.preventDefault()}
            onClick={(event: ReactMouseEvent<HTMLButtonElement>) => { event.stopPropagation(); onClear(); }}
        >
            <span aria-hidden="true">×</span>
        </button>
    );
};

/** 套用可搜尋選單的選取值。 */
export const commitSearchableSelectOption = (field: AAInputField, item: AAInputOption, onChange: (fieldKey: string, value: AAInputValue) => void, closeSelect: () => void) =>
{
    if (item.disabled) return;
    onChange(field.key, item.value);
    closeSelect();
};
