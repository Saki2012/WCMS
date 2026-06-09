// #region Property
const LIST_SELECTOR = "ul,ol";
// #endregion

// #region Public
export const normalizeListHtmlBeforeSave = (html: string): string =>
{
    if (!html || (!html.includes("<ul") && !html.includes("<ol"))) return html;

    const doc = new DOMParser().parseFromString(html, "text/html");
    let changed = false;
    let keepNormalizing = true;

    while (keepNormalizing)
    {
        const movedSiblingLists = moveOrphanSiblingListsIntoPreviousItem(doc.body);
        const collapsedWrappers = collapseEmptyWrapperItems(doc.body);
        keepNormalizing = movedSiblingLists || collapsedWrappers;
        changed = changed || keepNormalizing;
    }

    return changed ? doc.body.innerHTML : html;
};
// #endregion

// #region Private
const isListElement = (node: Element | null): node is HTMLOListElement | HTMLUListElement =>
{
    return !!node && node.matches(LIST_SELECTOR);
};


const hasOwnContent = (item: HTMLLIElement): boolean =>
{
    return Array.from(item.childNodes).some((node) =>
    {
        if (node.nodeType === Node.TEXT_NODE) return `${node.textContent ?? ""}`.trim().length > 0;
        if (node.nodeType !== Node.ELEMENT_NODE) return false;

        const element = node as Element;
        if (isListElement(element)) return false;
        if (element.tagName === "BR") return false;
        return `${element.textContent ?? ""}`.trim().length > 0;
    });
};


const moveOrphanSiblingListsIntoPreviousItem = (root: ParentNode): boolean =>
{
    let changed = false;

    root.querySelectorAll<HTMLOListElement | HTMLUListElement>(LIST_SELECTOR).forEach((list) =>
    {
        Array.from(list.children).forEach((child) =>
        {
            if (!isListElement(child)) return;

            const previous = child.previousElementSibling;
            if (!(previous instanceof HTMLLIElement)) return;

            previous.appendChild(child);
            changed = true;
        });
    });

    return changed;
};


const collapseEmptyWrapperItems = (root: ParentNode): boolean =>
{
    let changed = false;

    root.querySelectorAll<HTMLLIElement>("li").forEach((item) =>
    {
        const nestedLists = Array.from(item.children).filter(isListElement);
        if (nestedLists.length !== 1) return;
        if (item.children.length !== 1) return;
        if (hasOwnContent(item)) return;

        const previous = item.previousElementSibling;
        if (!(previous instanceof HTMLLIElement)) return;

        previous.appendChild(nestedLists[0]);
        item.remove();
        changed = true;
    });

    return changed;
};
// #endregion
