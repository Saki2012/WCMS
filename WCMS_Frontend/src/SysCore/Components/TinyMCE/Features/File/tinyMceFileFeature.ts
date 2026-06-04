import { INTERNAL_ATTR } from "../../Core/tinyMceConstants";
import type { TinyMCEEditor } from "../../Core/tinyMceTypes";

// #region Property
export type PickLocalFileOptions = { accept?: string; };
// #endregion

// #region Public
export const pickLocalFile = (cb: (file: File) => void, opt?: PickLocalFileOptions) =>
{
    const input = document.createElement("input");
    input.type = "file";

    if (opt?.accept) input.accept = opt.accept;

    input.onchange = () =>
    {
        const f = input.files?.[0];
        if (f) cb(f);
    };
    input.click();
};

export const applyFileLinkToSelection = (
    ed: TinyMCEEditor,
    opts: { href: string; title?: string; internalId?: string; download?: boolean; targetBlank?: boolean; },
) =>
{
    const { href, title, internalId, download, targetBlank } = opts;
    const sel = ed.selection;
    if (!sel) return;

    const setAttrs = (a: HTMLElement) =>
    {
        ed.dom.setAttrib(a, "href", href);
        ed.dom.setAttrib(a, "title", title ?? "");
        if (internalId) ed.dom.setAttrib(a, INTERNAL_ATTR, internalId);
        if (download) ed.dom.setAttrib(a, "download", "");
        if (targetBlank)
        {
            ed.dom.setAttrib(a, "target", "_blank");
            ed.dom.setAttrib(a, "rel", "noopener");
        }
    };

    if (sel.isCollapsed())
    {
        const linkText = title || href.split("/").pop() || "download";
        const a = ed.dom.create("a", {}) as HTMLElement;
        a.textContent = linkText;
        setAttrs(a);
        ed.insertContent(a.outerHTML);
        ed.nodeChanged();
        return;
    }

    const start = sel.getStart();
    const existing = ed.dom.getParent(start, "a");
    if (existing)
    {
        setAttrs(existing as HTMLElement);
        ed.nodeChanged();
        return;
    }

    ed.execCommand("mceInsertLink", false, { href, title: title ?? "" });
    const wrapped = ed.dom.getParent(ed.selection.getStart(), "a");
    if (wrapped) setAttrs(wrapped as HTMLElement);
    ed.nodeChanged();
};
// #endregion
