// #region Public
/** 確認目前可使用 document/window，避免 SSR render 階段碰到 browser API。 */
export const isBrowserDocumentReady = (): boolean =>
{
    return typeof document !== "undefined" && typeof window !== "undefined";
};

/** 取得 Portal 內可被鍵盤 focus 的元素清單。 */
export const getPortalFocusableElements = (root: ParentNode | null): HTMLElement[] =>
{
    if (!root) return [];

    const selector = getPortalFocusableSelector();
    const elements = Array.from(root.querySelectorAll<HTMLElement>(selector));

    return elements.filter(isPortalFocusableElement);
};
// #endregion

// #region Private
/** 取得 Portal 可被 focus 的 selector。 */
const getPortalFocusableSelector = (): string =>
{
    return [
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
};

/** 判斷元素是否可被 Portal focus 流程使用。 */
const isPortalFocusableElement = (element: HTMLElement): boolean =>
{
    if (element.hasAttribute("disabled")) return false;
    if (element.getAttribute("aria-hidden") === "true") return false;
    if (element.tabIndex === -1) return false;
    if (isHiddenInputElement(element)) return false;

    return isElementVisible(element);
};

/** 排除 hidden input，避免 focus 回到錯誤位置。 */
const isHiddenInputElement = (element: HTMLElement): boolean =>
{
    return element instanceof HTMLInputElement && element.type === "hidden";
};

/** 判斷元素目前是否可視。 */
const isElementVisible = (element: HTMLElement): boolean =>
{
    if (!isBrowserDocumentReady()) return false;

    const style = window.getComputedStyle(element);
    return style.visibility !== "hidden" && style.display !== "none";
};
// #endregion
