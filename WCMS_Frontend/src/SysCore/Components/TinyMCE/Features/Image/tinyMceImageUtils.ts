// #region Property
const IMAGE_MARKUP_PATTERN = /<img\b/i;
// #endregion

// #region Public
export const syncResponsiveImageElement = (img: HTMLImageElement, internalAttr: string): boolean =>
{
    const hasExplicitSizing = hasExplicitDimension(img, "width") || hasExplicitDimension(img, "height");
    const hasResponsiveClass = img.classList.contains("rwd-img");

    if (hasExplicitSizing)
    {
        if (!hasResponsiveClass) return false;
        img.classList.remove("rwd-img");
        if (!img.className.trim()) img.removeAttribute("class");
        return true;
    }

    if (!img.hasAttribute(internalAttr) || hasResponsiveClass) return false;

    img.classList.add("rwd-img");
    return true;
};

export const syncResponsiveImageClasses = (root: ParentNode, internalAttr: string): boolean =>
{
    let changed = false;

    root.querySelectorAll<HTMLImageElement>("img").forEach((img) =>
    {
        changed = syncResponsiveImageElement(img, internalAttr) || changed;
    });

    return changed;
};

export const normalizeImageHtmlForEditor = (html: string, internalAttr: string): string =>
{
    return normalizeImageHtml(html, internalAttr);
};

export const normalizeImageHtmlBeforeSave = (html: string, internalAttr: string): string =>
{
    return normalizeImageHtml(html, internalAttr);
};
// #endregion

// #region Private
const hasExplicitDimension = (img: HTMLImageElement, property: "width" | "height"): boolean =>
{
    const attributeValue = `${img.getAttribute(property) ?? ""}`.trim();
    if (attributeValue) return true;

    return img.style.getPropertyValue(property).trim().length > 0;
};

const normalizeImageHtml = (html: string, internalAttr: string): string =>
{
    if (!html || !IMAGE_MARKUP_PATTERN.test(html)) return html;

    const doc = new DOMParser().parseFromString(html, "text/html");
    const changed = syncResponsiveImageClasses(doc.body, internalAttr);
    return changed ? doc.body.innerHTML : html;
};
// #endregion
