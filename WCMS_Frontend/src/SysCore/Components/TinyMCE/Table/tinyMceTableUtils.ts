// #region Property
const TABLE_DIMENSION_SELECTOR = "table,colgroup,col,td,th";

const TABLE_MARKUP_PATTERN = /<(table|colgroup|col|td|th)\b/i;

const CSS_DIMENSION_RE = /^\d+(?:\.\d+)?(?:px|%|vh|vw|rem|em)?$/i;

const NUMERIC_DIMENSION_RE = /^\d+(?:\.\d+)?$/;
// #endregion

// #region Public
export const normalizeTableHtmlForEditor = (html: string): string =>
{
    return normalizeTableHtml(html);
};


export const normalizeTableHtmlBeforeSave = (html: string): string =>
{
    return normalizeTableHtml(html);
};


export const normalizePastedTableElement = (root: HTMLElement): void =>
{
    normalizeTableDimensions(root);
};
// #endregion

// #region Private
const normalizeDimensionAttribute = (raw: string | null): string | null =>
{
    const value = `${raw ?? ""}`.trim();
    if (!value) return null;
    if (NUMERIC_DIMENSION_RE.test(value)) return `${value}px`;
    if (CSS_DIMENSION_RE.test(value)) return value.toLowerCase();
    return null;
};


const hasStyleDimension = (element: HTMLElement, property: "width" | "height"): boolean =>
{
    return element.style.getPropertyValue(property).trim().length > 0;
};


const applyAttributeDimensionToStyle = (element: Element, property: "width" | "height"): boolean =>
{
    if (!(element instanceof HTMLElement)) return false;
    if (hasStyleDimension(element, property)) return false;

    const normalized = normalizeDimensionAttribute(element.getAttribute(property));
    if (!normalized) return false;

    element.style.setProperty(property, normalized);
    return true;
};


const getDimensionTargets = (root: ParentNode): HTMLElement[] =>
{
    const elements = Array.from(root.querySelectorAll<HTMLElement>(TABLE_DIMENSION_SELECTOR));
    if (root instanceof HTMLElement && root.matches(TABLE_DIMENSION_SELECTOR))
    {
        elements.unshift(root);
    }
    return elements;
};


const normalizeTableDimensions = (root: ParentNode): boolean =>
{
    let changed = false;

    getDimensionTargets(root).forEach((element) =>
    {
        changed = applyAttributeDimensionToStyle(element, "width") || changed;
        changed = applyAttributeDimensionToStyle(element, "height") || changed;
    });

    return changed;
};


const normalizeTableHtml = (html: string): string =>
{
    if (!html || !TABLE_MARKUP_PATTERN.test(html)) return html;

    const doc = new DOMParser().parseFromString(html, "text/html");
    const changed = normalizeTableDimensions(doc.body);
    return changed ? doc.body.innerHTML : html;
};
// #endregion
