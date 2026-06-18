import { type CSSProperties, type Dispatch, type FocusEvent, type KeyboardEvent, type RefObject, type SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getPortalFocusableElements, isBrowserDocumentReady } from "../AAInputField_Dom";
import { applyAAFocusStyle, clearAAFocusStyle } from "../AAInputField_Focus";
import { FieldError } from "../AAInputField_Shell";
import type { AAInputField, AAInputOption, FieldRenderContext } from "../AAInputField_Types";
import { buildDescribedBy, buildSelectClass, getAriaInvalid, getAriaRequired, getHintText, getNativeRequired, getSelectedValues, toStringArray } from "../AAInputField_Utils";
import { buildSearchOptionClass, filterUnselectedSelectOptions, getFirstEnabledIndex, getNextEnabledIndex, getSearchOptionId, normalizeSearchText, renderSearchClearButton } from "./SelectHelpers";

// #region Public
/**
 * 使用範例：
 * <AAInputFieldList fields={[{ key: "selectMultiple", type: "selectMultiple", label: "分類", aaLabel: "請選擇項目(可複選)", options, value: state.selectMultiple }]} onChange={handleChange} />
 */

/** selectMultiple 欄位，預設使用可搜尋標籤式選單。 */
export const SelectMultipleField = (props: { field: AAInputField; context: FieldRenderContext; }) =>
{
    if (props.field.searchable === false) return <NativeSelectMultipleField field={props.field} context={props.context} />;
    return <SearchableSelectMultipleField field={props.field} context={props.context} />;
};
// #endregion

// #region Protected
/** 建立 select Portal 浮層樣式，會依可視空間自動往上或往下開。 */
const buildSelectPortalStyle = (anchor: HTMLDivElement | null, popup: HTMLDivElement | null): CSSProperties =>
{
    if (!anchor || !isBrowserDocumentReady()) return { display: "none" };

    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 12;
    const gap = 4;
    const width = Math.min(Math.max(rect.width, 320), Math.max(280, viewportWidth - margin * 2));
    const left = Math.min(Math.max(rect.left, margin), Math.max(margin, viewportWidth - width - margin));
    const bottomSpace = Math.max(120, viewportHeight - rect.bottom - margin - gap);
    const topSpace = Math.max(120, rect.top - margin - gap);
    const estimatedHeight = Math.min(popup?.offsetHeight || 360, viewportHeight - margin * 2);
    const shouldOpenAbove = bottomSpace < estimatedHeight && topSpace > bottomSpace;
    const maxHeight = Math.max(120, Math.min(360, shouldOpenAbove ? topSpace : bottomSpace));
    const top = shouldOpenAbove ? Math.max(margin, rect.top - Math.min(estimatedHeight, maxHeight) - gap) : Math.min(rect.bottom + gap, viewportHeight - margin - 120);

    return {
        position: "fixed",
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        maxWidth: `calc(100vw - ${margin * 2}px)`,
        maxHeight: `${maxHeight}px`,
        overflowX: "hidden",
        overflowY: "hidden",
        boxSizing: "border-box",
        zIndex: 99999,
    };
};

/** 渲染多選搜尋選單的展開內容。 */
const renderSearchMultiSelectDropdown = (
    field: AAInputField,
    fieldId: string,
    wrapperRef: RefObject<HTMLDivElement>,
    popupRef: RefObject<HTMLDivElement>,
    popupStyle: CSSProperties,
    searchInputRef: RefObject<HTMLInputElement>,
    filteredOptions: AAInputOption[],
    activeIndex: number,
    searchText: string,
    searchId: string,
    listboxId: string,
    activeOptionId: string | undefined,
    describedBy: string,
    updateSearch: (value: string) => void,
    clearSearch: () => void,
    addOption: (item: AAInputOption) => void,
    closeSelect: () => void,
    setActiveIndex: Dispatch<SetStateAction<number>>,
    shouldTabToSelectedList: boolean,
    focusSelectedList: () => void,
) =>
{
    return (
        <div
            ref={popupRef}
            className="bg-white border rounded shadow-sm"
            style={popupStyle}
            onKeyDown={(event) => handleSelectPortalPopupKeyDown(event, wrapperRef, popupRef, closeSelect)}
            onBlur={(event) => closeSelectWhenPortalFocusLeaves(event, undefined, popupRef, closeSelect)}
        >
            <div className="px-2 py-2 border-bottom">
                <label htmlFor={searchId} className="visually-hidden">搜尋選項</label>
                <div className="position-relative">
                    <input
                        ref={searchInputRef}
                        id={searchId}
                        type="text"
                        className="form-control form-control-sm rounded-pill"
                        style={{ paddingRight: searchText ? "2.25rem" : undefined }}
                        value={searchText}
                        placeholder={field.searchPlaceholder ?? "Search tags"}
                        disabled={field.disabled}
                        autoComplete="off"
                        maxLength={field.maxSearchLength ?? 80}
                        role="combobox"
                        aria-autocomplete="list"
                        aria-haspopup="listbox"
                        aria-expanded="true"
                        aria-controls={listboxId}
                        aria-activedescendant={activeOptionId}
                        aria-describedby={describedBy}
                        onFocus={applyAAFocusStyle}
                        onBlur={clearAAFocusStyle}
                        onChange={(event) => updateSearch(event.target.value)}
                        onKeyDown={(event) =>
                            handleSearchMultiInputKeyDown(event, fieldId, filteredOptions, activeIndex, addOption, closeSelect, setActiveIndex, toStringArray(field.value), () => undefined, wrapperRef, shouldTabToSelectedList, focusSelectedList)}
                    />
                    {searchText && renderSearchClearButton("清除查詢文字", clearSearch)}
                </div>
            </div>
            <ul id={listboxId} className="list-group list-group-flush overflow-auto mb-0" style={{ maxHeight: 280 }} role="listbox" aria-label={field.label} aria-multiselectable="true">
                {filteredOptions.length === 0 && <li className="list-group-item text-muted small" role="presentation">{field.emptyText ?? "查無可加入項目"}</li>}
                {filteredOptions.map((item, index) => renderSearchMultiSelectOption(fieldId, item, index, activeIndex, filteredOptions, addOption, setActiveIndex, shouldTabToSelectedList, focusSelectedList, closeSelect))}
            </ul>
        </div>
    );
};

/** 渲染可加入的多選選項。 */
const renderSearchMultiSelectOption = (
    fieldId: string,
    item: AAInputOption,
    index: number,
    activeIndex: number,
    _optionList: AAInputOption[],
    addOption: (item: AAInputOption) => void,
    setActiveIndex: Dispatch<SetStateAction<number>>,
    _shouldTabToSelectedList: boolean,
    _focusSelectedList: () => void,
    _closeSelect: () => void,
) =>
{
    const isActive = index === activeIndex;

    return (
        <li
            key={item.value}
            id={getSearchOptionId(fieldId, item.value)}
            className={buildSearchOptionClass(false, isActive, item.disabled)}
            role="option"
            tabIndex={-1}
            aria-selected={false}
            aria-disabled={item.disabled || undefined}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
            {
                if (!item.disabled) addOption(item);
            }}
        >
            <span className="me-2" aria-hidden="true">＋</span>
            <span>{item.label}</span>
        </li>
    );
};

/** 渲染多選已選取項目清單。 */
const renderSelectedMultiTagList = (
    selectedOptionList: AAInputOption[],
    field: AAInputField,
    removeOption: (value: string) => void,
    wrapperRef: RefObject<HTMLDivElement>,
    setShouldLeaveFieldOnNextTab: Dispatch<SetStateAction<boolean>>,
) =>
{
    if (selectedOptionList.length === 0) return null;

    return (
        <div className="d-flex flex-wrap align-items-center gap-2" aria-label={`${field.label}已選取項目`}>
            {selectedOptionList.map((item, index) => (
                <span key={item.value} className="badge rounded-pill bg-light text-dark border d-inline-flex align-items-center gap-1 py-2 px-2">
                    <span className="text-break">{item.label}</span>
                    <button
                        type="button"
                        className="btn-close btn-close-sm ms-1 aa-selected-remove-button"
                        style={{ fontSize: "0.65rem" }}
                        disabled={field.disabled || item.disabled}
                        aria-label={`移除 ${item.label}`}
                        onFocus={applyAAFocusStyle}
                        onBlur={clearAAFocusStyle}
                        onKeyDown={(event) => handleSelectedRemoveButtonKeyDown(event, wrapperRef, index, setShouldLeaveFieldOnNextTab, () => removeOption(item.value))}
                        onClick={(event) =>
                        {
                            event.stopPropagation();
                            removeOption(item.value);
                        }}
                    >
                    </button>
                </span>
            ))}
        </div>
    );
};

/** 建立可搜尋多選框樣式。 */
const buildSearchMultiSelectClass = (field: AAInputField, isOpen: boolean) =>
{
    const classList = ["form-select", "d-flex", "flex-wrap", "align-items-center", "gap-2", "py-2", "h-auto"];
    if (field.errorText) classList.push("is-invalid");
    if (isOpen) classList.push("shadow-md");
    if (field.disabled) classList.push("bg-light", "opacity-75");
    return classList.join(" ");
};
// #endregion

// #region Private
/** 原生多選下拉欄位。 */
const NativeSelectMultipleField = (props: { field: AAInputField; context: FieldRenderContext; }) =>
{
    const isGridCell = props.field.renderVariant === "gridCell";
    const hintClassName = isGridCell ? "visually-hidden" : "form-text mb-1";

    return (
        <div className={isGridCell ? "aa-input-field-cell" : "form-group"}>
            <label htmlFor={props.context.fieldId} className="visually-hidden">{props.field.aaLabel ?? "請選擇項目(可複選)"}</label>
            <div id={props.context.hintId} className={hintClassName}>{getHintText(props.field)}</div>
            <select
                id={props.context.fieldId}
                name={props.field.key}
                className={buildSelectClass(props.field)}
                value={toStringArray(props.field.value)}
                multiple
                disabled={props.field.disabled}
                required={getNativeRequired(props.field)}
                aria-required={getAriaRequired(props.field)}
                aria-invalid={getAriaInvalid(props.field)}
                aria-describedby={props.context.describedBy}
                onFocus={applyAAFocusStyle}
                onBlur={clearAAFocusStyle}
                onChange={(event) => props.context.onChange(props.field.key, getSelectedValues(event))}
            >
                {(props.field.options ?? []).map((item) => <option key={item.value} value={item.value} disabled={item.disabled}>{item.label}</option>)}
            </select>
            <FieldError field={props.field} errorId={props.context.errorId} />
        </div>
    );
};

/** 可搜尋多選欄位，選取後以標籤方式加入框內，並提供 aria-live 操作回饋。 */
const SearchableSelectMultipleField = (props: { field: AAInputField; context: FieldRenderContext; }) =>
{
    const wrapperRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [popupStyle, setPopupStyle] = useState<CSSProperties>({});
    const [searchText, setSearchText] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);
    const [announceText, setAnnounceText] = useState("");
    const [shouldTabToSelectedList, setShouldTabToSelectedList] = useState(false);
    const [shouldLeaveFieldOnNextTab, setShouldLeaveFieldOnNextTab] = useState(false);
    const optionList = props.field.options ?? [];
    const selectedValues = toStringArray(props.field.value);
    const selectedOptionList = useMemo(() => getSelectedMultiOptions(optionList, selectedValues), [optionList, selectedValues]);
    const filteredOptions = useMemo(() => filterUnselectedSelectOptions(optionList, selectedValues, searchText), [optionList, selectedValues, searchText]);
    const activeOption = activeIndex >= 0 ? filteredOptions[activeIndex] : undefined;
    const labelId = `${props.context.fieldId}-label`;
    const listboxId = `${props.context.fieldId}-listbox`;
    const searchId = `${props.context.fieldId}-search`;
    const selectedStatusId = `${props.context.fieldId}-selected-status`;
    const liveStatusId = `${props.context.fieldId}-live-status`;
    const activeOptionId = activeOption ? getSearchOptionId(props.context.fieldId, activeOption.value) : undefined;
    const describedBy = buildDescribedBy(props.context.hintId, props.field.errorText ? props.context.errorId : "", selectedStatusId, liveStatusId);

    useEffect(() => bindSelectPortalOutsideClick(isOpen, wrapperRef, popupRef, closeSelect), [isOpen]);
    useEffect(() => bindSelectPortalPosition(isOpen, wrapperRef, popupRef, setPopupStyle), [isOpen]);
    useEffect(() =>
    {
        if (isOpen) focusSearchInputWithRetry(popupRef, 0);
    }, [isOpen]);
    useEffect(() => scrollActiveSelectOptionInPopup(activeOptionId, popupRef), [activeOptionId]);

    /** 開啟多選搜尋選單。 */
    const openSelect = () =>
    {
        if (props.field.disabled) return;
        const nextOptions = filterUnselectedSelectOptions(optionList, selectedValues, "");
        setSearchText("");
        setActiveIndex(getFirstEnabledIndex(nextOptions));
        setShouldTabToSelectedList(false);
        setShouldLeaveFieldOnNextTab(false);
        setIsOpen(true);
    };

    /** 關閉多選搜尋選單。 */
    const closeSelect = () =>
    {
        setIsOpen(false);
        setSearchText("");
        setActiveIndex(-1);
        setShouldTabToSelectedList(false);
        setShouldLeaveFieldOnNextTab(false);
    };

    /** 更新搜尋文字。 */
    const updateSearch = (value: string) =>
    {
        const nextText = normalizeSearchText(value, props.field.maxSearchLength ?? 80);
        const nextOptions = filterUnselectedSelectOptions(optionList, selectedValues, nextText);
        setSearchText(nextText);
        setActiveIndex(getFirstEnabledIndex(nextOptions));
        setShouldTabToSelectedList(false);
        setShouldLeaveFieldOnNextTab(false);
        setIsOpen(true);
    };

    /** 清除查詢文字。 */
    const clearSearch = () =>
    {
        const nextOptions = filterUnselectedSelectOptions(optionList, selectedValues, "");
        setSearchText("");
        setActiveIndex(getFirstEnabledIndex(nextOptions));
        setShouldTabToSelectedList(false);
        setShouldLeaveFieldOnNextTab(false);
        setIsOpen(true);
        focusElementWithoutScroll(searchInputRef.current);
    };

    /** 加入選取項目到框內，多選不自動關閉 popup，focus 保持在 search。 */
    const addOption = (item: AAInputOption) =>
    {
        if (item.disabled || selectedValues.includes(item.value)) return;

        const nextSelectedValues = [...selectedValues, item.value];
        const nextOptions = filterUnselectedSelectOptions(optionList, nextSelectedValues, "");

        props.context.onChange(props.field.key, nextSelectedValues);
        setSearchText("");
        setActiveIndex(getFirstEnabledIndex(nextOptions));
        setIsOpen(true);
        focusSearchInputWithRetry(popupRef, 0);
        setAnnounceText(`已加入：${item.label}`);
    };

    /** 從框內移除已選取項目，刪除後停留在已選項目鍵盤流程內。 */
    const removeOption = (value: string) =>
    {
        const item = selectedOptionList.find((option) => option.value === value);
        const removeIndex = selectedValues.indexOf(value);
        const nextSelectedValues = selectedValues.filter((selectedValue) => selectedValue !== value);

        props.context.onChange(props.field.key, nextSelectedValues);
        focusSelectedRemoveByIndexWithRetry(wrapperRef, removeIndex, 0);
        setAnnounceText(`已移除：${item?.label ?? value}`);
    };

    /** 將 focus 移到第一個已選項目的移除按鈕；若沒有已選項目，回主框並讓下一次 Tab 離開。 */
    const focusSelectedList = () =>
    {
        if (getSelectedRemoveButtons(wrapperRef.current).length === 0)
        {
            focusFrameAfterSelectedList(wrapperRef, setShouldLeaveFieldOnNextTab);
            return;
        }

        focusSelectedRemoveByIndexWithRetry(wrapperRef, 0, 0);
    };

    const isGridCell = props.field.renderVariant === "gridCell";
    const hintClassName = isGridCell ? "visually-hidden" : "form-text mb-1";

    return (
        <div className={isGridCell ? "aa-input-field-cell" : "form-group"}>
            <label id={labelId} className="visually-hidden">{props.field.aaLabel ?? "請選擇項目(可複選)"}</label>
            <div id={props.context.hintId} className={hintClassName}>{getHintText(props.field)}</div>
            <div ref={wrapperRef} className="position-relative" onBlur={(event) => closeSelectWhenPortalFocusLeaves(event, wrapperRef, popupRef, closeSelect)}>
                {selectedValues.map((value) => <input key={value} type="hidden" name={props.field.key} value={value} />)}
                <div
                    id={props.context.fieldId}
                    className={buildSearchMultiSelectClass(props.field, isOpen)}
                    style={{ cursor: "default" }}
                    role="combobox"
                    tabIndex={props.field.disabled ? undefined : 0}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-controls={listboxId}
                    aria-required={getAriaRequired(props.field)}
                    aria-invalid={getAriaInvalid(props.field)}
                    onFocus={handleSelectMultipleFrameFocus}
                    onBlur={handleSelectMultipleFrameBlur}
                    onClick={openSelect}
                    onKeyDown={(event) => handleReadonlyMultiSelectBoxKeyDown(event, isOpen, wrapperRef, popupRef, openSelect, closeSelect, selectedValues, removeOption, shouldLeaveFieldOnNextTab, setShouldLeaveFieldOnNextTab)}
                >
                    <div id={selectedStatusId} className="visually-hidden">{getMultiSelectStatusText(selectedOptionList)}</div>
                    <div id={liveStatusId} className="visually-hidden" aria-live="polite" aria-atomic="true">{announceText}</div>
                    {selectedOptionList.length === 0 && <span className="text-muted">{props.field.placeholder ?? "請搜尋或選擇..."}</span>}
                    {renderSelectedMultiTagList(selectedOptionList, props.field, removeOption, wrapperRef, setShouldLeaveFieldOnNextTab)}
                </div>
                {isOpen && isBrowserDocumentReady()
                    && createPortal(
                        renderSearchMultiSelectDropdown(
                            props.field,
                            props.context.fieldId,
                            wrapperRef,
                            popupRef,
                            popupStyle,
                            searchInputRef,
                            filteredOptions,
                            activeIndex,
                            searchText,
                            searchId,
                            listboxId,
                            activeOptionId,
                            describedBy,
                            updateSearch,
                            clearSearch,
                            addOption,
                            closeSelect,
                            setActiveIndex,
                            shouldTabToSelectedList,
                            focusSelectedList,
                        ),
                        document.body,
                    )}
            </div>
            <FieldError field={props.field} errorId={props.context.errorId} />
        </div>
    );
};

/** 控制 Select Portal 內 Tab 離開時回到原表單流程，而不是跳到 body 結尾。 */
const handleSelectPortalPopupKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    wrapperRef: RefObject<HTMLDivElement> | undefined,
    popupRef: RefObject<HTMLDivElement>,
    closeSelect: () => void,
) =>
{
    if (event.key === "Escape")
    {
        event.preventDefault();
        closeSelect();
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
        closeSelect();
        focusLastBeforeElement(wrapperRef?.current);
        return;
    }

    if (!event.shiftKey && activeElement === lastElement)
    {
        event.preventDefault();
        closeSelect();
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

/** focus 元素但避免瀏覽器自動捲動頁面或表格容器。 */
const focusElementWithoutScroll = (element: HTMLElement | null | undefined) =>
{
    if (!element) return;
    element.focus({ preventScroll: true });
};

/** 只捲動 popup 內部 listbox，不讓 active option 觸發 body / table 的 scroll。 */
const scrollActiveSelectOptionInPopup = (
    activeOptionId: string | undefined,
    popupRef: RefObject<HTMLDivElement>,
) =>
{
    if (!activeOptionId || !isBrowserDocumentReady()) return;

    window.requestAnimationFrame(() =>
    {
        const popup = popupRef.current;
        const activeElement = document.getElementById(activeOptionId);
        const listbox = popup?.querySelector<HTMLElement>("[role='listbox']");

        if (!popup || !activeElement || !listbox) return;
        if (!popup.contains(activeElement) || !listbox.contains(activeElement)) return;

        scrollElementIntoListbox(activeElement, listbox);
    });
};

/** 以調整 listbox.scrollTop 的方式讓選項可視，避免使用 scrollIntoView 造成頁面位移。 */
const scrollElementIntoListbox = (element: HTMLElement, listbox: HTMLElement) =>
{
    const elementRect = element.getBoundingClientRect();
    const listboxRect = listbox.getBoundingClientRect();

    if (elementRect.top < listboxRect.top)
    {
        listbox.scrollTop -= listboxRect.top - elementRect.top;
        return;
    }

    if (elementRect.bottom > listboxRect.bottom)
    {
        listbox.scrollTop += elementRect.bottom - listboxRect.bottom;
    }
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

/** 綁定自製 select 的外部點擊，Portal 面板與原欄位都視為內部。 */
const bindSelectPortalOutsideClick = (
    isOpen: boolean,
    wrapperRef: RefObject<HTMLDivElement>,
    popupRef: RefObject<HTMLDivElement>,
    closeSelect: () => void,
) =>
{
    if (!isOpen || !isBrowserDocumentReady()) return;

    const handleMouseDown = (event: MouseEvent) =>
    {
        const target = event.target as Node | null;
        if (!target) return;
        if (wrapperRef.current?.contains(target) || popupRef.current?.contains(target)) return;
        closeSelect();
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    return () => document.removeEventListener("mousedown", handleMouseDown, true);
};

/** 綁定 Portal 面板定位，避免 select 選單被 table/td/overflow 裁切。 */
const bindSelectPortalPosition = (
    isOpen: boolean,
    wrapperRef: RefObject<HTMLDivElement>,
    popupRef: RefObject<HTMLDivElement>,
    setPopupStyle: (style: CSSProperties) => void,
) =>
{
    if (!isOpen || !isBrowserDocumentReady()) return;

    const updatePosition = () => setPopupStyle(buildSelectPortalStyle(wrapperRef.current, popupRef.current));
    updatePosition();
    window.requestAnimationFrame(updatePosition);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () =>
    {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
    };
};

/** focus 離開原欄位與 Portal 面板後關閉 select。 */
const closeSelectWhenPortalFocusLeaves = (
    event: FocusEvent<HTMLDivElement>,
    wrapperRef: RefObject<HTMLDivElement> | undefined,
    popupRef: RefObject<HTMLDivElement>,
    closeSelect: () => void,
) =>
{
    void event;
    if (!isBrowserDocumentReady()) return;

    window.requestAnimationFrame(() =>
    {
        const activeElement = document.activeElement;
        if (!activeElement)
        {
            closeSelect();
            return;
        }
        if (wrapperRef?.current?.contains(activeElement) || popupRef.current?.contains(activeElement)) return;
        closeSelect();
    });
};

/** selectMultiple 主框只有自身取得 focus 時才套用焦點樣式，避免子層 X 按鈕 focus 冒泡污染主框。 */
const handleSelectMultipleFrameFocus = (event: FocusEvent<HTMLDivElement>) =>
{
    if (event.target !== event.currentTarget) return;
    applyAAFocusStyle(event);
};

/** selectMultiple 主框離開整個框內時清除焦點樣式。 */
const handleSelectMultipleFrameBlur = (event: FocusEvent<HTMLDivElement>) =>
{
    const nextFocus = event.relatedTarget as Node | null;
    if (nextFocus && event.currentTarget.contains(nextFocus)) return;
    clearAAFocusStyle(event);
};

/** 清除 selectMultiple 主框可能殘留的 inline focus 樣式。 */
const clearSelectMultipleFrameFocusStyle = (wrapper: HTMLElement | null) =>
{
    const frame = wrapper?.querySelector<HTMLElement>("[role='combobox']");
    if (!frame) return;

    frame.style.outline = "";
    frame.style.outlineOffset = "";
    frame.style.boxShadow = "";
};

/** 處理多選主框鍵盤操作。 */
const handleReadonlyMultiSelectBoxKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    isOpen: boolean,
    wrapperRef: RefObject<HTMLDivElement>,
    popupRef: RefObject<HTMLDivElement>,
    openSelect: () => void,
    closeSelect: () => void,
    selectedValues: string[],
    removeOption: (value: string) => void,
    shouldLeaveFieldOnNextTab: boolean,
    setShouldLeaveFieldOnNextTab: Dispatch<SetStateAction<boolean>>,
) =>
{
    if (event.target !== event.currentTarget) return;

    if (event.key === "Tab" && shouldLeaveFieldOnNextTab)
    {
        event.preventDefault();
        setShouldLeaveFieldOnNextTab(false);
        clearSelectMultipleFrameFocusStyle(wrapperRef.current);
        focusFirstAfterElement(wrapperRef.current);
        return;
    }

    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ")
    {
        event.preventDefault();
        openSelect();
        focusSearchInputWithRetry(popupRef, 0);
    }

    if (event.key === "Escape" && isOpen)
    {
        event.preventDefault();
        closeSelect();
        focusPortalAnchor(wrapperRef.current);
    }

    if (event.key === "Backspace" && selectedValues.length > 0)
    {
        event.preventDefault();
        removeOption(selectedValues[selectedValues.length - 1]);
    }
};

/** 處理多選搜尋輸入框鍵盤操作。 */
const handleSearchMultiInputKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    _fieldId: string,
    optionList: AAInputOption[],
    activeIndex: number,
    addOption: (item: AAInputOption) => void,
    closeSelect: () => void,
    setActiveIndex: Dispatch<SetStateAction<number>>,
    selectedValues: string[],
    removeOption: (value: string) => void,
    wrapperRef: RefObject<HTMLDivElement>,
    _shouldTabToSelectedList: boolean,
    _focusSelectedList: () => void,
) =>
{
    if (event.key === "Escape")
    {
        event.preventDefault();
        closeSelect();
        focusPortalAnchor(wrapperRef.current);
        return;
    }

    if (event.key === "ArrowDown") moveSelectActiveIndex(event, optionList, activeIndex, 1, setActiveIndex);
    if (event.key === "ArrowUp") moveSelectActiveIndex(event, optionList, activeIndex, -1, setActiveIndex);
    if (event.key === "Enter") commitActiveSelectOption(event, optionList, activeIndex, addOption);

    if (event.key === "Tab" && event.shiftKey)
    {
        event.preventDefault();
        closeSelect();
        focusPortalAnchor(wrapperRef.current);
        return;
    }

    if (event.key === "Tab")
    {
        event.preventDefault();
        closeSelect();
        focusFirstSelectedRemoveOrAfter(wrapperRef.current);
    }

    if (event.key === "Backspace" && event.currentTarget.value === "" && selectedValues.length > 0)
    {
        event.preventDefault();
        removeOption(selectedValues[selectedValues.length - 1]);
    }
};

/** 控制已選項目 X 鍵的 Tab 流程，最後回到 selectMultiple 框。 */
const handleSelectedRemoveButtonKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    wrapperRef: RefObject<HTMLDivElement>,
    index: number,
    _setShouldLeaveFieldOnNextTab: Dispatch<SetStateAction<boolean>>,
    removeCurrentOption: () => void,
) =>
{
    if (event.key === "Enter" || event.key === " ")
    {
        event.preventDefault();
        removeCurrentOption();
        return;
    }

    if (event.key !== "Tab") return;

    event.preventDefault();

    const buttonList = getSelectedRemoveButtons(wrapperRef.current);
    const nextIndex = event.shiftKey ? index - 1 : index + 1;

    if (nextIndex >= 0 && nextIndex < buttonList.length)
    {
        focusElementWithoutScroll(buttonList[nextIndex]);
        return;
    }

    if (event.shiftKey)
    {
        focusPortalAnchor(wrapperRef.current);
        return;
    }

    clearSelectMultipleFrameFocusStyle(wrapperRef.current);
    focusFirstAfterElement(wrapperRef.current);
};

/** popup 以 Tab 離開時，優先進入已選項目的移除按鈕，沒有已選項目才往下一欄位。 */
const focusFirstSelectedRemoveOrAfter = (wrapper: HTMLElement | null) =>
{
    const firstButton = getSelectedRemoveButtons(wrapper)[0];
    if (firstButton)
    {
        focusElementWithoutScroll(firstButton);
        return;
    }

    focusFirstAfterElement(wrapper);
};

/** 刪除已選項目後，focus 下一個 X；若已無下一個則往下一個欄位。 */
const focusSelectedRemoveByIndexWithRetry = (
    wrapperRef: RefObject<HTMLDivElement>,
    index: number,
    retryCount: number,
) =>
{
    if (!isBrowserDocumentReady()) return;

    window.requestAnimationFrame(() =>
    {
        const buttonList = getSelectedRemoveButtons(wrapperRef.current);
        const targetButton = buttonList[Math.min(index, buttonList.length - 1)];

        if (targetButton)
        {
            focusElementWithoutScroll(targetButton);
            return;
        }
        if (retryCount < 5)
        {
            focusSelectedRemoveByIndexWithRetry(wrapperRef, index, retryCount + 1);
            return;
        }

        clearSelectMultipleFrameFocusStyle(wrapperRef.current);
        focusFirstAfterElement(wrapperRef.current);
    });
};

/** 沒有已選項目時回主框，下一次 Tab 直接離開欄位。 */
const focusFrameAfterSelectedList = (
    wrapperRef: RefObject<HTMLDivElement>,
    setShouldLeaveFieldOnNextTab: Dispatch<SetStateAction<boolean>>,
) =>
{
    setShouldLeaveFieldOnNextTab(true);
    focusPortalAnchor(wrapperRef.current);
};

/** 取得已選項目的移除按鈕。 */
const getSelectedRemoveButtons = (wrapper: HTMLElement | null) =>
{
    if (!wrapper) return [] as HTMLButtonElement[];

    return Array.from(wrapper.querySelectorAll<HTMLButtonElement>(".aa-selected-remove-button"))
        .filter((button) => !button.disabled);
};

/** 等待 Portal render 後 focus 到 search 欄位。 */
const focusSearchInputWithRetry = (popupRef: RefObject<HTMLDivElement>, retryCount: number) =>
{
    if (!isBrowserDocumentReady()) return;

    window.requestAnimationFrame(() =>
    {
        const searchInput = popupRef.current?.querySelector<HTMLInputElement>("input[type='text']");
        if (searchInput)
        {
            focusElementWithoutScroll(searchInput);
            return;
        }
        if (retryCount < 5) focusSearchInputWithRetry(popupRef, retryCount + 1);
    });
};

/** 移動可搜尋選單的鍵盤焦點。 */
const moveSelectActiveIndex = (event: KeyboardEvent<HTMLInputElement>, optionList: AAInputOption[], activeIndex: number, step: number, setActiveIndex: Dispatch<SetStateAction<number>>) =>
{
    event.preventDefault();
    setActiveIndex(getNextEnabledIndex(optionList, activeIndex, step));
};

/** Enter 時選取目前 active option。 */
const commitActiveSelectOption = (event: KeyboardEvent<HTMLElement>, optionList: AAInputOption[], activeIndex: number, addOption: (item: AAInputOption) => void) =>
{
    const item = optionList[activeIndex];
    if (!item || item.disabled) return;
    event.preventDefault();
    addOption(item);
};

/** 依目前值取得已選取項目，保留外部 value 的排序。 */
const getSelectedMultiOptions = (optionList: AAInputOption[], selectedValues: string[]) =>
{
    const optionMap = new Map(optionList.map((item) => [item.value, item]));
    return selectedValues.map((value) => optionMap.get(value) ?? { value, label: value });
};

/** 取得多選狀態文字。 */
const getMultiSelectStatusText = (selectedOptionList: AAInputOption[]) => selectedOptionList.length > 0 ? `目前已選取 ${selectedOptionList.length} 個項目：${selectedOptionList.map((item) => item.label).join("、")}` : "目前尚未選取項目";
// #endregion
