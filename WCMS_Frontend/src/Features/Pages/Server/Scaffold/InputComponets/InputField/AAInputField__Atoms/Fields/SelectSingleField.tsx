import { type CSSProperties, type Dispatch, type FocusEvent, type KeyboardEvent, type MutableRefObject, type RefObject, type SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getPortalFocusableElements, isBrowserDocumentReady } from "../AAInputField_Dom";
import { applyAAFocusStyle, clearAAFocusStyle } from "../AAInputField_Focus";
import { FieldControlShell } from "../AAInputField_Shell";
import type { AAInputField, AAInputOption, FieldRenderContext } from "../AAInputField_Types";
import { buildDescribedBy, buildSelectClass, getAriaInvalid, getAriaRequired, getNativeRequired, stringifyValue } from "../AAInputField_Utils";
import { buildSearchOptionClass, commitSearchableSelectOption, filterSelectOptions, getFirstEnabledIndex, getSearchOptionId, getSelectedOptionLabel, normalizeSearchText, renderSearchClearButton } from "./SelectHelpers";

// #region Public
/**
 * 使用範例：
 * <AAInputFieldList fields={[{ key: "selectSingle", type: "selectSingle", label: "分類", aaLabel: "請選擇項目", options, value: state.selectSingle }]} onChange={handleChange} />
 */

/** selectSingle 欄位，預設使用可搜尋選單。 */
export const SelectSingleField = (props: { field: AAInputField; context: FieldRenderContext; }) =>
{
    if (props.field.searchable === false) return <NativeSelectSingleField field={props.field} context={props.context} />;
    return <SearchableSelectSingleField field={props.field} context={props.context} />;
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

/** 渲染可搜尋單選選單的展開內容。 */
const renderSearchSelectDropdown = (
    field: AAInputField,
    fieldId: string,
    wrapperRef: RefObject<HTMLDivElement>,
    popupRef: RefObject<HTMLDivElement>,
    popupStyle: CSSProperties,
    searchInputRef: RefObject<HTMLInputElement>,
    filteredOptions: AAInputOption[],
    selectedValue: string,
    activeIndex: number,
    activeIndexRef: MutableRefObject<number>,
    searchText: string,
    searchId: string,
    listboxId: string,
    activeOptionId: string | undefined,
    describedBy: string,
    updateSearch: (value: string) => void,
    clearSearch: () => void,
    selectOption: (item: AAInputOption) => void,
    closeSelect: () => void,
    setActiveIndex: Dispatch<SetStateAction<number>>,
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
                        onKeyDown={(event) => handleSearchInputKeyDown(event, fieldId, filteredOptions, activeIndexRef, selectOption, closeSelect, setActiveIndex, wrapperRef)}
                    />
                    {searchText && renderSearchClearButton("清除查詢文字", clearSearch)}
                </div>
            </div>
            <ul id={listboxId} className="list-group list-group-flush overflow-auto mb-0" style={{ maxHeight: 280 }} role="listbox" aria-label={field.label}>
                {filteredOptions.length === 0 && <li className="list-group-item text-muted small" role="presentation">{field.emptyText ?? "查無符合項目"}</li>}
                {filteredOptions.map((item, index) => renderSearchSelectOption(fieldId, item, index, selectedValue, activeIndex, filteredOptions, selectOption, setActiveIndex))}
            </ul>
        </div>
    );
};

/** 渲染可搜尋單選選單的單一選項。 */
const renderSearchSelectOption = (
    fieldId: string,
    item: AAInputOption,
    index: number,
    selectedValue: string,
    activeIndex: number,
    optionList: AAInputOption[],
    selectOption: (item: AAInputOption) => void,
    setActiveIndex: Dispatch<SetStateAction<number>>,
) =>
{
    const isSelected = item.value === selectedValue;
    const isActive = index === activeIndex;

    return (
        <li
            key={item.value}
            id={getSearchOptionId(fieldId, item.value)}
            className={buildSearchOptionClass(isSelected, isActive, item.disabled)}
            role="option"
            tabIndex={-1}
            aria-selected={isSelected}
            aria-disabled={item.disabled || undefined}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
            {
                if (!item.disabled) selectOption(item);
            }}
        >
            <span className="me-2" aria-hidden="true">{isSelected ? "✓" : ""}</span>
            <span>{item.label}</span>
        </li>
    );
};

/** 建立可搜尋單選 input 樣式。 */
const buildSearchSelectInputClass = (field: AAInputField, isOpen: boolean) => `form-select${field.errorText ? " is-invalid" : ""}${isOpen ? " shadow-md" : ""}`;
// #endregion

// #region Private
/** 原生單選下拉欄位。 */
const NativeSelectSingleField = (props: { field: AAInputField; context: FieldRenderContext; }) =>
{
    return (
        <FieldControlShell field={props.field} fieldId={props.context.fieldId} hintId={props.context.hintId} errorId={props.context.errorId}>
            <select
                id={props.context.fieldId}
                name={props.field.key}
                className={buildSelectClass(props.field)}
                value={stringifyValue(props.field.value)}
                disabled={props.field.disabled}
                required={getNativeRequired(props.field)}
                aria-required={getAriaRequired(props.field)}
                aria-invalid={getAriaInvalid(props.field)}
                aria-describedby={props.context.describedBy}
                onFocus={applyAAFocusStyle}
                onBlur={clearAAFocusStyle}
                onChange={(event) => props.context.onChange(props.field.key, event.target.value)}
            >
                <option value="">請選擇...</option>
                {(props.field.options ?? []).map((item) => <option key={item.value} value={item.value} disabled={item.disabled}>{item.label}</option>)}
            </select>
        </FieldControlShell>
    );
};

/** 可搜尋單選選單，主欄位負責開啟，下方搜尋框負責查詢與鍵盤選取。 */
const SearchableSelectSingleField = (props: { field: AAInputField; context: FieldRenderContext; }) =>
{
    const wrapperRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [popupStyle, setPopupStyle] = useState<CSSProperties>({});
    const [searchText, setSearchText] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);
    const activeIndexRef = useRef(-1);
    const [announceText, setAnnounceText] = useState("");
    const optionList = props.field.options ?? [];
    const selectedValue = stringifyValue(props.field.value);
    const selectedLabel = getSelectedOptionLabel(optionList, selectedValue, "");
    const filteredOptions = useMemo(() => filterSelectOptions(optionList, searchText), [optionList, searchText]);
    const activeOption = activeIndex >= 0 ? filteredOptions[activeIndex] : undefined;
    const listboxId = `${props.context.fieldId}-listbox`;
    const searchId = `${props.context.fieldId}-search`;
    const statusId = `${props.context.fieldId}-status`;
    const activeOptionId = activeOption ? getSearchOptionId(props.context.fieldId, activeOption.value) : undefined;
    const describedBy = buildDescribedBy(props.context.describedBy, statusId);

    useEffect(() => bindSelectPortalOutsideClick(isOpen, wrapperRef, popupRef, closeSelect), [isOpen]);
    useEffect(() => bindSelectPortalPosition(isOpen, wrapperRef, popupRef, setPopupStyle), [isOpen]);
    useEffect(() =>
    {
        if (isOpen) focusSearchInputWithRetry(popupRef, 0);
    }, [isOpen]);
    useEffect(() => scrollActiveSelectOptionInPopup(activeOptionId, popupRef), [activeOptionId]);

    /** 開啟單選搜尋選單。 */
    const openSelect = () =>
    {
        if (props.field.disabled) return;

        const nextActiveIndex = getInitialSelectActiveIndex(optionList, selectedValue);

        setSearchText("");
        setSelectActiveIndex(nextActiveIndex, activeIndexRef, setActiveIndex);
        setIsOpen(true);
    };

    /** 關閉單選搜尋選單。 */
    const closeSelect = () =>
    {
        setIsOpen(false);
        setSearchText("");
        setSelectActiveIndex(-1, activeIndexRef, setActiveIndex);
    };

    /** 選取項目並提供螢幕閱讀器狀態通知，完成後回到原欄位框。 */
    const selectOption = (item: AAInputOption) =>
    {
        commitSearchableSelectOption(props.field, item, props.context.onChange, closeSelect);
        setAnnounceText(`已選取：${item.label}`);
        focusPortalAnchor(wrapperRef.current);
    };

    useEffect(() => bindSelectSingleDocumentKeyboard(isOpen, props.context.fieldId, wrapperRef, popupRef, filteredOptions, activeIndexRef, selectOption, closeSelect, setActiveIndex), [isOpen, props.context.fieldId, filteredOptions, selectOption]);

    /** 更新搜尋文字。 */
    const updateSearch = (value: string) =>
    {
        const nextText = normalizeSearchText(value, props.field.maxSearchLength ?? 80);
        const nextFilteredOptions = filterSelectOptions(optionList, nextText);
        setSearchText(nextText);
        setSelectActiveIndex(getFirstEnabledIndex(nextFilteredOptions), activeIndexRef, setActiveIndex);
    };

    /** 清除查詢文字並重新定位選項。 */
    const clearSearch = () =>
    {
        setSearchText("");
        setSelectActiveIndex(getFirstEnabledIndex(filterSelectOptions(optionList, "")), activeIndexRef, setActiveIndex);
        focusElementWithoutScroll(searchInputRef.current);
    };

    return (
        <FieldControlShell field={props.field} fieldId={props.context.fieldId} hintId={props.context.hintId} errorId={props.context.errorId}>
            <div ref={wrapperRef} className="position-relative" onBlur={(event) => closeSelectWhenPortalFocusLeaves(event, wrapperRef, popupRef, closeSelect)}>
                <input type="hidden" name={props.field.key} value={selectedValue} />
                <input
                    id={props.context.fieldId}
                    type="text"
                    className={buildSearchSelectInputClass(props.field, isOpen)}
                    style={{ cursor: "default" }}
                    value={selectedLabel}
                    placeholder={props.field.placeholder ?? "請選擇..."}
                    disabled={props.field.disabled}
                    readOnly
                    autoComplete="off"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-controls={listboxId}
                    aria-required={getAriaRequired(props.field)}
                    aria-invalid={getAriaInvalid(props.field)}
                    aria-describedby={describedBy}
                    onFocus={applyAAFocusStyle}
                    onBlur={clearAAFocusStyle}
                    onClick={openSelect}
                    onKeyDown={(event) => handleReadonlySelectInputKeyDown(event, isOpen, props.context.fieldId, optionList, activeIndexRef, selectOption, setActiveIndex, wrapperRef, popupRef, openSelect, closeSelect)}
                />
                <div id={statusId} className="visually-hidden" aria-live="polite" aria-atomic="true">{announceText || getSingleSelectStatusText(selectedLabel)}</div>
                {isOpen && isBrowserDocumentReady()
                    && createPortal(
                        renderSearchSelectDropdown(
                            props.field,
                            props.context.fieldId,
                            wrapperRef,
                            popupRef,
                            popupStyle,
                            searchInputRef,
                            filteredOptions,
                            selectedValue,
                            activeIndex,
                            activeIndexRef,
                            searchText,
                            searchId,
                            listboxId,
                            activeOptionId,
                            describedBy,
                            updateSearch,
                            clearSearch,
                            selectOption,
                            closeSelect,
                            setActiveIndex,
                        ),
                        document.body,
                    )}
            </div>
        </FieldControlShell>
    );
};

/** 綁定單選 popup 的文件層鍵盤操作，避免 focus 留在主框或 Portal input 時無法接到 ↑↓/Enter。 */
const bindSelectSingleDocumentKeyboard = (
    isOpen: boolean,
    fieldId: string,
    wrapperRef: RefObject<HTMLDivElement>,
    popupRef: RefObject<HTMLDivElement>,
    optionList: AAInputOption[],
    activeIndexRef: MutableRefObject<number>,
    selectOption: (item: AAInputOption) => void,
    closeSelect: () => void,
    setActiveIndex: Dispatch<SetStateAction<number>>,
) =>
{
    if (!isOpen || !isBrowserDocumentReady()) return undefined;

    const handleKeyDown = (event: globalThis.KeyboardEvent) =>
    {
        if (!isSelectSingleKeyboardTarget(event.target, fieldId, wrapperRef, popupRef)) return;

        if (event.key === "ArrowDown")
        {
            moveSelectActiveIndexFromNativeEvent(event, fieldId, optionList, activeIndexRef, 1, setActiveIndex);
            return;
        }

        if (event.key === "ArrowUp")
        {
            moveSelectActiveIndexFromNativeEvent(event, fieldId, optionList, activeIndexRef, -1, setActiveIndex);
            return;
        }

        if (event.key === "Enter")
        {
            commitActiveSelectOptionFromNativeEvent(event, optionList, activeIndexRef, selectOption);
            return;
        }

        if (event.key === "Escape")
        {
            event.preventDefault();
            event.stopPropagation();
            closeSelect();
            focusPortalAnchor(wrapperRef.current);
        }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
};

/** 判斷目前鍵盤事件是否來自 selectSingle 主框或 popup。 */
const isSelectSingleKeyboardTarget = (
    target: EventTarget | null,
    fieldId: string,
    wrapperRef: RefObject<HTMLDivElement>,
    popupRef: RefObject<HTMLDivElement>,
) =>
{
    if (!(target instanceof HTMLElement)) return false;
    if (target.id === fieldId) return true;
    if (wrapperRef.current?.contains(target)) return true;
    if (popupRef.current?.contains(target)) return true;
    return false;
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

/** 處理搜尋輸入框鍵盤操作。 */
const handleSearchInputKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    fieldId: string,
    optionList: AAInputOption[],
    activeIndexRef: MutableRefObject<number>,
    selectOption: (item: AAInputOption) => void,
    closeSelect: () => void,
    setActiveIndex: Dispatch<SetStateAction<number>>,
    wrapperRef: RefObject<HTMLDivElement>,
) =>
{
    if (event.key === "Escape")
    {
        event.preventDefault();
        closeSelect();
        focusPortalAnchor(wrapperRef.current);
        return;
    }

    if (event.key === "ArrowDown") moveSelectActiveIndex(event, fieldId, optionList, activeIndexRef, 1, setActiveIndex);
    if (event.key === "ArrowUp") moveSelectActiveIndex(event, fieldId, optionList, activeIndexRef, -1, setActiveIndex);
    if (event.key === "Enter") commitActiveSelectOption(event, optionList, activeIndexRef, selectOption);
};

/** 處理已選文字欄位的鍵盤開關。 */
const handleReadonlySelectInputKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    isOpen: boolean,
    fieldId: string,
    optionList: AAInputOption[],
    activeIndexRef: MutableRefObject<number>,
    selectOption: (item: AAInputOption) => void,
    setActiveIndex: Dispatch<SetStateAction<number>>,
    wrapperRef: RefObject<HTMLDivElement>,
    popupRef: RefObject<HTMLDivElement>,
    openSelect: () => void,
    closeSelect: () => void,
) =>
{
    if (event.key === "Escape" && isOpen)
    {
        event.preventDefault();
        closeSelect();
        focusPortalAnchor(wrapperRef.current);
        return;
    }

    if (event.key === "ArrowDown")
    {
        event.preventDefault();
        if (!isOpen)
        {
            openSelect();
            focusSearchInputWithRetry(popupRef, 0);
            return;
        }
        moveSelectActiveIndex(event, fieldId, optionList, activeIndexRef, 1, setActiveIndex);
        return;
    }

    if (event.key === "ArrowUp")
    {
        event.preventDefault();
        if (!isOpen)
        {
            openSelect();
            focusSearchInputWithRetry(popupRef, 0);
            return;
        }
        moveSelectActiveIndex(event, fieldId, optionList, activeIndexRef, -1, setActiveIndex);
        return;
    }

    if (event.key === "Enter")
    {
        event.preventDefault();
        if (!isOpen)
        {
            openSelect();
            focusSearchInputWithRetry(popupRef, 0);
            return;
        }
        commitActiveSelectOption(event, optionList, activeIndexRef, selectOption);
        return;
    }

    if (event.key === " ")
    {
        event.preventDefault();
        openSelect();
        focusSearchInputWithRetry(popupRef, 0);
    }
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

/** 取得目前可用選項 index。 */
const getEnabledOptionIndex = (optionList: AAInputOption[], activeIndex: number) =>
{
    if (activeIndex >= 0 && activeIndex < optionList.length && optionList[activeIndex] && !optionList[activeIndex].disabled) return activeIndex;
    return optionList.findIndex((item) => !item.disabled);
};

/** 取得下一個可用選項 index，SelectSingle 專用避免與其他檔案 helper 撞名。 */
const getNextEnabledSearchOptionIndex = (optionList: AAInputOption[], activeIndex: number, step: number) =>
{
    if (optionList.length === 0) return -1;

    const startIndex = activeIndex < 0 ? (step > 0 ? -1 : optionList.length) : activeIndex;

    for (let offset = 1; offset <= optionList.length; offset++)
    {
        const nextIndex = (startIndex + step * offset + optionList.length) % optionList.length;
        if (!optionList[nextIndex].disabled) return nextIndex;
    }

    return activeIndex;
};

/** 同步設定 active index，避免 Enter 抓到上一次 render 的舊值。 */
const setSelectActiveIndex = (nextIndex: number, activeIndexRef: MutableRefObject<number>, setActiveIndex: Dispatch<SetStateAction<number>>) =>
{
    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
};

/** 文件層鍵盤事件：移動可搜尋選單的 active option。 */
const moveSelectActiveIndexFromNativeEvent = (
    event: globalThis.KeyboardEvent,
    fieldId: string,
    optionList: AAInputOption[],
    activeIndexRef: MutableRefObject<number>,
    step: number,
    setActiveIndex: Dispatch<SetStateAction<number>>,
) =>
{
    event.preventDefault();
    event.stopPropagation();

    const nextIndex = getNextEnabledSearchOptionIndex(optionList, activeIndexRef.current, step);
    setSelectActiveIndex(nextIndex, activeIndexRef, setActiveIndex);
    scrollOptionIntoViewByIndex(fieldId, optionList, nextIndex);
};

/** 文件層鍵盤事件：選取目前 active option。 */
const commitActiveSelectOptionFromNativeEvent = (
    event: globalThis.KeyboardEvent,
    optionList: AAInputOption[],
    activeIndexRef: MutableRefObject<number>,
    selectOption: (item: AAInputOption) => void,
) =>
{
    const targetIndex = getEnabledOptionIndex(optionList, activeIndexRef.current);
    const item = targetIndex >= 0 ? optionList[targetIndex] : undefined;

    if (!item || item.disabled) return;

    event.preventDefault();
    event.stopPropagation();
    selectOption(item);
};

/** 移動可搜尋選單的鍵盤焦點。 */
const moveSelectActiveIndex = (
    event: KeyboardEvent<HTMLInputElement>,
    fieldId: string,
    optionList: AAInputOption[],
    activeIndexRef: MutableRefObject<number>,
    step: number,
    setActiveIndex: Dispatch<SetStateAction<number>>,
) =>
{
    event.preventDefault();

    const nextIndex = getNextEnabledSearchOptionIndex(optionList, activeIndexRef.current, step);
    setSelectActiveIndex(nextIndex, activeIndexRef, setActiveIndex);
    scrollOptionIntoViewByIndex(fieldId, optionList, nextIndex);
};

/** Enter 時選取目前 active option。 */
const commitActiveSelectOption = (
    event: KeyboardEvent<HTMLElement>,
    optionList: AAInputOption[],
    activeIndexRef: MutableRefObject<number>,
    selectOption: (item: AAInputOption) => void,
) =>
{
    const targetIndex = getEnabledOptionIndex(optionList, activeIndexRef.current);
    const item = targetIndex >= 0 ? optionList[targetIndex] : undefined;

    if (!item || item.disabled) return;

    event.preventDefault();
    selectOption(item);
};

/** 確保鍵盤移動時 active option 會進入可視範圍。 */
const scrollOptionIntoViewByIndex = (fieldId: string, optionList: AAInputOption[], activeIndex: number) =>
{
    const item = optionList[activeIndex];
    if (!item || !isBrowserDocumentReady()) return;

    window.requestAnimationFrame(() =>
    {
        document.getElementById(getSearchOptionId(fieldId, item.value))?.scrollIntoView({ block: "nearest" });
    });
};

/** 取得打開選單時預設 active index。 */
const getInitialSelectActiveIndex = (optionList: AAInputOption[], selectedValue: string) =>
{
    const selectedIndex = optionList.findIndex((item) => item.value === selectedValue && !item.disabled);
    return selectedIndex >= 0 ? selectedIndex : getFirstEnabledIndex(optionList);
};

/** 取得單選狀態文字。 */
const getSingleSelectStatusText = (selectedLabel: string) => selectedLabel ? `目前已選取：${selectedLabel}` : "目前尚未選取項目";
// #endregion
