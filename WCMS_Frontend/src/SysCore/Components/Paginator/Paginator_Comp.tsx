import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data.ts";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import clsx from "clsx";
import { type ChangeEvent, type KeyboardEvent, type MouseEvent, useEffect, useId, useState } from "react";

// #region Property
/** 分頁 a11y 文案結構 */
type PaginatorA11yText = {
    navLabel: string;
    first: string;
    prev: string;
    next: string;
    last: string;
    input: string; // 20260415
    go: string; // 20260415
    goBtn: string; // 20260415
    total: (p: number) => string; // 20260415
    page: (p: number) => string;
    currentPage: (p: number) => string;
};

/** 分頁 a11y 文案表（用 xxx[lang] 讀；不足語系會 fallback） */
const PAGINATOR_A11Y_MAP: Partial<Record<Lang, PaginatorA11yText>> = {
    "zh-tw": {
        navLabel: "分頁",
        first: "第一頁",
        prev: "上一頁",
        next: "下一頁",
        last: "最後一頁",
        page: (p) => `第 ${p} 頁`,
        currentPage: (p) => `第 ${p} 頁，目前頁面`,
        input: "輸入頁碼", // 20260415
        go: "前往頁面", // 20260415
        goBtn: "前往", // 20260416
        total: (p) => `/　${p}`, // 20260415
    },
    "zh-cn": {
        navLabel: "分页",
        first: "第一页",
        prev: "上一页",
        next: "下一页",
        last: "最后一页",
        page: (p) => `第 ${p} 页`,
        currentPage: (p) => `第 ${p} 页，当前页`,
        input: "输入页码", // 20260415
        go: "前往页面", // 20260415
        goBtn: "前往", // 20260416
        total: (p) => `/　${p}`, // 20260415
    },
    en: {
        navLabel: "Pagination",
        first: "First page",
        prev: "Previous page",
        next: "Next page",
        last: "Last page",
        page: (p) => `Page ${p}`,
        currentPage: (p) => `Page ${p}, current page`,
        input: "Enter page number", // 20260415
        go: "Go to page", // 20260415
        goBtn: "GO", // 20260416
        total: (p) => `of　${p}`, // 20260415
    },
};
// #endregion

// #region Public
/** 第一版本 無樣式 */
export const Paginator = (props: PaginatorProps) =>
{
    // 宣告：只有 1 頁就不渲染
    if (props.currentPage <= 1 && props.totalPages <= 1) return null;

    // 宣告變數：語系文案
    const a11y = getPaginatorA11y(props.lang);

    // 宣告變數：頁碼列表
    const visiblePages = buildVisiblePages(props.currentPage, props.totalPages);

    // 宣告：disabled 狀態
    const isFirstDisabled = props.currentPage === 1;
    const isPrevDisabled = props.currentPage === 1;
    const isNextDisabled = props.currentPage === props.totalPages;
    const isLastDisabled = props.currentPage === props.totalPages;

    // return：維持原 DOM 結構
    return (
        <div className="row mx-0 px-0">
            <nav className="d-flex align-content-center w-100 px-0" aria-label={a11y.navLabel}>
                <ul className={props.style?.ul}>
                    {/* 第一頁 */}
                    <li className={clsx(props.style?.li, isFirstDisabled ? "disabled" : "")}>
                        <a
                            role="button"
                            tabIndex={isFirstDisabled ? -1 : 0}
                            onClick={(e) => handleAnchorClick(e, isFirstDisabled, () => props.onPageChange(1))}
                            onKeyDown={(e) => handleAnchorKeyDown(e, isFirstDisabled, () => props.onPageChange(1))}
                            className={clsx(props.style?.aLink, isFirstDisabled ? "disabled" : "")}
                            aria-disabled={isFirstDisabled}
                            aria-label={a11y.first}
                            title={a11y.first}
                        >
                            <span aria-hidden="true">
                                <i className={props.style?.FirstPage}></i>
                            </span>
                        </a>
                    </li>

                    {/* 上一頁 */}
                    <li className={clsx(props.style?.li, isPrevDisabled ? "disabled" : "")}>
                        <a
                            role="button"
                            tabIndex={isPrevDisabled ? -1 : 0}
                            onClick={(e) => handleAnchorClick(e, isPrevDisabled, () => props.onPageChange(props.currentPage - 1))}
                            onKeyDown={(e) => handleAnchorKeyDown(e, isPrevDisabled, () => props.onPageChange(props.currentPage - 1))}
                            className={clsx(props.style?.aLink, isPrevDisabled ? "disabled" : "")}
                            aria-disabled={isPrevDisabled}
                            aria-label={a11y.prev}
                            title={a11y.prev}
                        >
                            <span aria-hidden="true">
                                <i className={props.style?.PrePage}></i>
                            </span>
                        </a>
                    </li>

                    {/* 中間頁碼 */}
                    {visiblePages.map((page) =>
                    {
                        // 宣告：目前頁（不可 Tab focus）
                        const isCurrent = page === props.currentPage;

                        return (
                            <li key={page} className={clsx(props.style?.li, isCurrent ? "active" : "")}>
                                <a
                                    role="button"
                                    tabIndex={isCurrent ? -1 : 0}
                                    aria-current={isCurrent ? "page" : undefined}
                                    aria-disabled={isCurrent}
                                    aria-label={isCurrent ? a11y.currentPage(page) : a11y.page(page)}
                                    title={isCurrent ? a11y.currentPage(page) : a11y.page(page)}
                                    onClick={(e) => handleAnchorClick(e, isCurrent, () => props.onPageChange(page))}
                                    onKeyDown={(e) => handleAnchorKeyDown(e, isCurrent, () => props.onPageChange(page))}
                                    className={clsx(props.style?.aLink, isCurrent ? "active" : "")}
                                >
                                    {page}
                                </a>
                            </li>
                        );
                    })}

                    {/* 下一頁 */}
                    <li className={clsx(props.style?.li, isNextDisabled ? "disabled" : "")}>
                        <a
                            role="button"
                            tabIndex={isNextDisabled ? -1 : 0}
                            onClick={(e) => handleAnchorClick(e, isNextDisabled, () => props.onPageChange(props.currentPage + 1))}
                            onKeyDown={(e) => handleAnchorKeyDown(e, isNextDisabled, () => props.onPageChange(props.currentPage + 1))}
                            className={clsx(props.style?.aLink, isNextDisabled ? "disabled" : "")}
                            aria-disabled={isNextDisabled}
                            aria-label={a11y.next}
                            title={a11y.next}
                        >
                            <span aria-hidden="true">
                                <i className={props.style?.NextPage}></i>
                            </span>
                        </a>
                    </li>

                    {/* 最後一頁 */}
                    <li className={clsx(props.style?.li, isLastDisabled ? "disabled" : "")}>
                        <a
                            role="button"
                            tabIndex={isLastDisabled ? -1 : 0}
                            onClick={(e) => handleAnchorClick(e, isLastDisabled, () => props.onPageChange(props.totalPages))}
                            onKeyDown={(e) => handleAnchorKeyDown(e, isLastDisabled, () => props.onPageChange(props.totalPages))}
                            className={clsx(props.style?.aLink, isLastDisabled ? "disabled" : "")}
                            aria-disabled={isLastDisabled}
                            aria-label={a11y.last}
                            title={a11y.last}
                        >
                            <span aria-hidden="true">
                                <i className={props.style?.LastPage}></i>
                            </span>
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

/** 第二版本 前台BaseLine用的格式，待確認這邊使用方式及邏輯*/
export const NewPaginator = (props: PaginatorProps) =>
{
    // 宣告：只有 1 頁就不渲染
    if (props.currentPage <= 1 && props.totalPages <= 1) return <></>;

    // 宣告變數：語系文案
    const a11y = getPaginatorA11y(props.lang);

    // 宣告變數：頁碼列表
    const visiblePages = buildVisiblePages(props.currentPage, props.totalPages);

    // 宣告：disabled 狀態
    const isFirstDisabled = props.currentPage === 1;
    const isPrevDisabled = props.currentPage === 1;
    const isNextDisabled = props.currentPage === props.totalPages;
    const isLastDisabled = props.currentPage === props.totalPages;

    // 執行：分頁跳轉（保持原本邏輯）
    const handleGoFirst = () => props.onPageChange(1);
    const handleGoPrev = () => props.onPageChange(props.currentPage - 1);
    const handleGoNext = () => props.onPageChange(props.currentPage + 1);
    const handleGoLast = () => props.onPageChange(props.totalPages);

    return (
        <div className="row">
            <div className="col-12">
                <nav className="d-flex justify-content-sm-start justify-content-center" aria-label={a11y.navLabel}>
                    <ul className="pagination">
                        {/* 第一頁 */}
                        <li className={clsx("paginate_button", isFirstDisabled && "disabled")} aria-disabled={isFirstDisabled}>
                            <a
                                role="button"
                                tabIndex={isFirstDisabled ? -1 : 0}
                                aria-disabled={isFirstDisabled}
                                aria-label={a11y.first}
                                title={a11y.first}
                                onClick={(e) => handleAnchorClick(e, isFirstDisabled, handleGoFirst)}
                                onKeyDown={(e) => handleAnchorKeyDown(e, isFirstDisabled, handleGoFirst)}
                            >
                                <span aria-hidden="true">
                                    <i className="far fa-arrow-to-left"></i>
                                </span>
                            </a>
                        </li>

                        {/* 上一頁 */}
                        <li className={clsx("paginate_button", isPrevDisabled && "disabled")} aria-disabled={isPrevDisabled}>
                            <a
                                role="button"
                                tabIndex={isPrevDisabled ? -1 : 0}
                                aria-disabled={isPrevDisabled}
                                aria-label={a11y.prev}
                                title={a11y.prev}
                                onClick={(e) => handleAnchorClick(e, isPrevDisabled, handleGoPrev)}
                                onKeyDown={(e) => handleAnchorKeyDown(e, isPrevDisabled, handleGoPrev)}
                            >
                                <span aria-hidden="true">
                                    <i className="far fa-angle-left"></i>
                                </span>
                            </a>
                        </li>

                        {/* 中間頁碼 */}
                        {visiblePages.map((page) =>
                        {
                            // 宣告：目前頁（不可 Tab focus）
                            const isCurrent = page === props.currentPage;

                            return (
                                <li key={page} className={clsx("paginate_button", isCurrent && "active")}>
                                    <a
                                        role="button"
                                        tabIndex={isCurrent ? -1 : 0}
                                        aria-current={isCurrent ? "page" : undefined}
                                        aria-disabled={isCurrent}
                                        aria-label={isCurrent ? a11y.currentPage(page) : a11y.page(page)}
                                        title={isCurrent ? a11y.currentPage(page) : a11y.page(page)}
                                        onClick={(e) => handleAnchorClick(e, isCurrent, () => props.onPageChange(page))}
                                        onKeyDown={(e) => handleAnchorKeyDown(e, isCurrent, () => props.onPageChange(page))}
                                    >
                                        {page}
                                    </a>
                                </li>
                            );
                        })}

                        {/* 下一頁 */}
                        <li className={clsx("paginate_button", isNextDisabled && "disabled")} aria-disabled={isNextDisabled}>
                            <a
                                role="button"
                                tabIndex={isNextDisabled ? -1 : 0}
                                aria-disabled={isNextDisabled}
                                aria-label={a11y.next}
                                title={a11y.next}
                                onClick={(e) => handleAnchorClick(e, isNextDisabled, handleGoNext)}
                                onKeyDown={(e) => handleAnchorKeyDown(e, isNextDisabled, handleGoNext)}
                            >
                                <span aria-hidden="true">
                                    <i className="far fa-angle-right"></i>
                                </span>
                            </a>
                        </li>

                        {/* 最後頁 */}
                        <li className={clsx("paginate_button", isLastDisabled && "disabled")} aria-disabled={isLastDisabled}>
                            <a
                                role="button"
                                tabIndex={isLastDisabled ? -1 : 0}
                                aria-disabled={isLastDisabled}
                                aria-label={a11y.last}
                                title={a11y.last}
                                onClick={(e) => handleAnchorClick(e, isLastDisabled, handleGoLast)}
                                onKeyDown={(e) => handleAnchorKeyDown(e, isLastDisabled, handleGoLast)}
                            >
                                <span aria-hidden="true">
                                    <i className="far fa-arrow-to-right"></i>
                                </span>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
};

// ************************** */

/** 第三版本 最新前台 BaseLine 用的格式 */
export const NewPaginatorCanInputPage = (props: PaginatorProps) =>
{
    // 宣告：只有 1 頁就不渲染
    if (props.currentPage <= 1 && props.totalPages <= 1) return <></>;

    // 宣告變數：語系文案與 input id
    const a11y = getPaginatorA11y(props.lang);

    const inputId = useId();

    // 宣告變數：輸入框頁碼
    const [inputPage, setInputPage] = useState<string>(String(props.currentPage));

    // 宣告：disabled 狀態
    const isFirstDisabled = props.currentPage === 1;
    const isPrevDisabled = props.currentPage === 1;
    const isLastDisabled = props.currentPage === props.totalPages;
    const isNextDisabled = props.currentPage === props.totalPages;

    /** 同步輸入框頁碼 */
    const syncInputPage = (page: number) =>
    {
        // 執行：同步成目前頁碼
        setInputPage(String(page));
    };

    /** 統一跳頁處理 */
    const goToPage = (page: number) =>
    {
        // 宣告變數：限制頁碼範圍
        const nextPage = clampPage(page, props.totalPages);

        // 執行：同步 input 並觸發外部換頁
        syncInputPage(nextPage);
        props.onPageChange(nextPage);
    };

    /** 送出輸入頁碼 */
    const submitInputPage = () =>
    {
        // 宣告變數：空值時回復目前頁
        if (!inputPage)
        {
            syncInputPage(props.currentPage);
            return;
        }

        // 宣告變數：轉成數字並限制範圍
        const nextPage = clampPage(Number(inputPage), props.totalPages);

        // 執行：同步輸入框並跳頁
        goToPage(nextPage);
    };

    /** 處理第一頁 */
    const handleGoFirst = () =>
    {
        // 執行：跳第一頁
        goToPage(1);
    };

    /** 處理最後頁 */
    const handleGoLast = () =>
    {
        // 執行：跳最後頁
        goToPage(props.totalPages);
    };

    /** 處理上一頁 */
    const handleGoPrev = () =>
    {
        // 執行：跳上一頁
        goToPage(props.currentPage - 1);
    };

    /** 處理下一頁 */
    const handleGoNext = () =>
    {
        // 執行：跳下一頁
        goToPage(props.currentPage + 1);
    };

    /** 處理輸入框變更 */
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        // 宣告變數：input 原始值
        const raw = e.target.value;

        // 執行：允許清空，避免使用者刪除時卡住
        if (raw === "")
        {
            setInputPage("");
            return;
        }

        // 宣告變數：轉數字
        const page = Number(raw);

        // 執行：非數字不處理
        if (Number.isNaN(page)) return;

        // 宣告變數：限制範圍
        const nextPage = clampPage(page, props.totalPages);

        // 執行：同步輸入框
        setInputPage(String(nextPage));
    };

    /** 處理 GO */
    const handleGoPage = () =>
    {
        // 執行：送出輸入頁碼
        submitInputPage();
    };

    /** 處理 input Enter */
    const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) =>
    {
        // 執行：Enter 直接送出
        if (e.key !== "Enter") return;
        e.preventDefault();
        submitInputPage();
    };

    /** 處理 input 失焦 */
    const handleInputBlur = () =>
    {
        // 執行：失焦後自動送出
        submitInputPage();
    };

    /** 外部 currentPage 改變時同步輸入框 */
    useEffect(() =>
    {
        // 執行：同步外部頁碼
        syncInputPage(props.currentPage);
    }, [props.currentPage, props.totalPages]);

    return (
        <div className="row">
            <div className="col-12">
                <nav className="d-flex flex-wrap align-items-center justify-content-sm-start justify-content-center" aria-label={a11y.navLabel}>
                    <ul className="pagination flex-wrap ">
                        {/* 第一頁 */}
                        <li className={clsx("paginate_button", isFirstDisabled && "disabled")} aria-disabled={isFirstDisabled}>
                            <a
                                role="button"
                                tabIndex={isFirstDisabled ? -1 : 0}
                                aria-disabled={isFirstDisabled}
                                aria-label={a11y.first}
                                title={a11y.first}
                                onClick={(e) => handleAnchorClick(e, isFirstDisabled, handleGoFirst)}
                                onKeyDown={(e) => handleAnchorKeyDown(e, isFirstDisabled, handleGoFirst)}
                            >
                                <span aria-hidden="true">
                                    <i className="far fa-arrow-to-left"></i>
                                </span>
                            </a>
                        </li>

                        {/* 上一頁 */}
                        <li className={clsx("paginate_button", isPrevDisabled && "disabled")} aria-disabled={isPrevDisabled}>
                            <a
                                role="button"
                                tabIndex={isPrevDisabled ? -1 : 0}
                                aria-disabled={isPrevDisabled}
                                aria-label={a11y.prev}
                                title={a11y.prev}
                                onClick={(e) => handleAnchorClick(e, isPrevDisabled, handleGoPrev)}
                                onKeyDown={(e) => handleAnchorKeyDown(e, isPrevDisabled, handleGoPrev)}
                            >
                                <span aria-hidden="true">
                                    <i className="far fa-angle-left"></i>
                                </span>
                            </a>
                        </li>

                        {/* 輸入頁碼 */}
                        <li className="paginate_button ps-1">
                            <div className="d-flex page-input-box">
                                <div>
                                    <label htmlFor={inputId} className="visually-hidden">{a11y.input}</label>
                                    <input
                                        id={inputId}
                                        type="number"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        min={1}
                                        max={props.totalPages}
                                        className="form-control page-input pe-0"
                                        value={inputPage}
                                        onChange={handleInputChange}
                                        onKeyDown={handleInputKeyDown}
                                        onBlur={handleInputBlur}
                                        aria-label={a11y.input}
                                    />
                                </div>
                                <div>
                                    {/* 總頁數 */}
                                    <span className="page-link border-0 text-dark ps-0 d-flex align-items-center">
                                        {a11y.total(props.totalPages)}
                                    </span>
                                </div>
                            </div>
                        </li>

                        {/* GO */}
                        <li className="paginate_button pe-1">
                            <button type="button" className="page-link go px-2" aria-label={a11y.go} title={a11y.go} onClick={handleGoPage}>
                                {a11y.goBtn}
                            </button>
                        </li>

                        {/* 下一頁 */}
                        <li className={clsx("paginate_button", isNextDisabled && "disabled")} aria-disabled={isNextDisabled}>
                            <a
                                role="button"
                                tabIndex={isNextDisabled ? -1 : 0}
                                aria-disabled={isNextDisabled}
                                aria-label={a11y.next}
                                title={a11y.next}
                                onClick={(e) => handleAnchorClick(e, isNextDisabled, handleGoNext)}
                                onKeyDown={(e) => handleAnchorKeyDown(e, isNextDisabled, handleGoNext)}
                            >
                                <span aria-hidden="true">
                                    <i className="far fa-angle-right"></i>
                                </span>
                            </a>
                        </li>

                        {/* 最後頁 */}
                        <li className={clsx("paginate_button", isLastDisabled && "disabled")} aria-disabled={isLastDisabled}>
                            <a
                                role="button"
                                tabIndex={isLastDisabled ? -1 : 0}
                                aria-disabled={isLastDisabled}
                                aria-label={a11y.last}
                                title={a11y.last}
                                onClick={(e) => handleAnchorClick(e, isLastDisabled, handleGoLast)}
                                onKeyDown={(e) => handleAnchorKeyDown(e, isLastDisabled, handleGoLast)}
                            >
                                <span aria-hidden="true">
                                    <i className="far fa-arrow-to-right"></i>
                                </span>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
};
// #endregion

// #region Protected
/** 計算可視頁碼（最多顯示 maxVisible 個） */
const buildVisiblePages = (currentPage: number, totalPages: number, maxVisible = 5): number[] =>
{
    // 宣告變數：計算左右範圍
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(currentPage - half, 1);
    let end = start + maxVisible - 1;

    // 執行：向右超出就回推
    if (end > totalPages)
    {
        end = totalPages;
        start = Math.max(end - maxVisible + 1, 1);
    }

    // return：頁碼陣列
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};
// #endregion

// #region Private
/** 取得分頁 a11y 文案（語系不在表內時，回退到 DefaultLang） */
const getPaginatorA11y = (lang?: Lang): PaginatorA11yText =>
{
    // 宣告：fallback key
    const key = (lang ?? DefaultLang) as Lang;

    // 執行：依語系取值，取不到就回 default
    const byLang = PAGINATOR_A11Y_MAP[key];
    const byDefault = PAGINATOR_A11Y_MAP[DefaultLang];

    // return：保證回傳一份可用文案
    return byLang ?? byDefault ?? {
        navLabel: "分頁",
        first: "第一頁",
        prev: "上一頁",
        next: "下一頁",
        last: "最後一頁",
        page: (p) => `第 ${p} 頁`,
        currentPage: (p) => `第 ${p} 頁，目前頁面`,
        input: "輸入頁碼", // 20260415
        go: "前往頁面", // 20260415
        goBtn: "前往", // 20260416
        total: (p) => `/　${p}`, // 20260415
    };
};

/** 限制頁碼範圍 */
const clampPage = (page: number, totalPages: number): number =>
{
    // return：限制在 1 ~ totalPages
    return Math.min(Math.max(page, 1), totalPages);
};

/** a(role=button) 的 click 行為：disabled 時不動作 */
const handleAnchorClick = (e: MouseEvent<HTMLAnchorElement>, isDisabled: boolean, action: () => void) =>
{
    // 執行：避免未來加 href 造成跳動
    e.preventDefault();

    // 執行：disabled 就不做事
    if (isDisabled) return;
    action();
};

// /** a(role=button) 的鍵盤行為：Enter/Space 觸發 click 同等效果 */
// const handleAnchorKeyDown = (
//     e: KeyboardEvent<HTMLAnchorElement>,
//     isDisabled: boolean,
//     action: () => void
// ) => {
//     // 宣告：disabled 不處理
//     if (isDisabled) return;

//     // 執行：Enter/Space 觸發
//     if (!isActivateKey(e.key)) return;
//     e.preventDefault();
//     action();
// };
/** a(role=button) 的鍵盤行為：Enter/Space 觸發 */
const handleAnchorKeyDown = (e: KeyboardEvent<HTMLAnchorElement>, isDisabled: boolean, action: () => void) =>
{
    // 執行：disabled 不處理
    if (isDisabled) return;

    // 執行：只處理 Enter / Space
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    action();
};
// #endregion
