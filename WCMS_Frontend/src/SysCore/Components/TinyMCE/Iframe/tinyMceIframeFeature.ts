import type { TinyMCEEditor, TinySetup } from "../Core/tinyMceTypes";
import {
    getIframeReferrerPolicy,
    normalizeIframeHeight,
    normalizeIframeWidth,
    toIframeCssDimension,
    toIframeDimensionAttribute,
    validateIframeSrc,
} from "./tinyMceIframeUtils";

// #region Public
type InsertIframeDialogData = { url?: string; title?: string; width?: string; height?: string; };
type EditIframeDialogData = { src: string; "data-mce-src": string; title: string; width: string; height: string; };

export const openInsertIframeDialog = (ed: TinyMCEEditor) =>
{
    ed.windowManager.open({
        title: "插入 IFrame（YouTube / Google Map）",
        body: {
            type: "panel",
            items: [
                { type: "input", name: "url", label: "完整 URL", placeholder: "https://www.youtube.com/embed/..." },
                { type: "input", name: "title", label: "標題（無障礙）" },
                { type: "input", name: "width", label: "寬度(px 或 %，空白=100%)" },
                { type: "input", name: "height", label: "高度(px，建議 315/360/480...)" },
            ],
        },
        buttons: [{ type: "cancel", text: "取消" }, { type: "submit", text: "插入", primary: true }],
        onSubmit(api)
        {
            const data = api.getData() as InsertIframeDialogData;
            const width = normalizeIframeWidth(data.width);
            const height = normalizeIframeHeight(data.height);
            const title = (data.title || "").trim();
            const { url, warning } = validateIframeSrc(data.url);
            if (!url)
            {
                ed.windowManager.alert("請輸入 URL");
                return;
            }
            if (warning)
            {
                ed.windowManager.alert(warning);
                return;
            }
            const referrerPolicy = getIframeReferrerPolicy(url);
            const widthAttr = toIframeDimensionAttribute(width);
            const heightAttr = toIframeDimensionAttribute(height);
            const style = ["display:block", `width:${toIframeCssDimension(width)}`, `height:${toIframeCssDimension(height)}`, "max-width:100%", "border:0"]
                .join(";");

            const html = `<iframe src="${ed.dom.encode(url)}"
                    title="${ed.dom.encode(title)}"
                    ${widthAttr ? `width="${ed.dom.encode(widthAttr)}"` : ""}
                    ${heightAttr ? `height="${ed.dom.encode(heightAttr)}"` : ""}
                    loading="lazy"
                    referrerpolicy="${ed.dom.encode(referrerPolicy)}"
                    allowfullscreen
                    style="${ed.dom.encode(style)}"></iframe>`;
            ed.insertContent(html);
            api.close();
        },
    });
};

export const useTinyMceIframeEdit = (): TinySetup =>
{
    const resolveIframeElm = (editor: TinyMCEEditor, node: Node | null): HTMLIFrameElement | null =>
    {
        if (!node) return null;
        if ((node as HTMLElement).nodeName === "IFRAME") return node as HTMLIFrameElement;
        const el = node as HTMLElement;
        const down1 = el.querySelector?.("iframe");
        if (down1) return down1 as HTMLIFrameElement;
        const up = editor.dom.getParent(el, "iframe");
        if (up) return up as HTMLIFrameElement;
        if (el.matches?.("figure.mce-object-iframe, div.mce-object-iframe, figure, div"))
        {
            const inner = el.querySelector?.("iframe");
            if (inner) return inner as HTMLIFrameElement;
        }
        return null;
    };

    const openDialog = (editor: TinyMCEEditor, node: HTMLIFrameElement) =>
    {
        const ifr = resolveIframeElm(editor, node);
        const dom = editor.dom;
        const wrapperNode = ifr ? dom.getParent(ifr, (n: Node) => isIframeObjectWrapper(editor, n)) : null;
        const wrapper = isElementNode(wrapperNode) ? wrapperNode : null;
        const data: EditIframeDialogData = {
            src: node.getAttribute("src") || "",
            "data-mce-src": node.getAttribute("src") || "",
            title: (ifr?.getAttribute("title") || "") || (wrapper ? dom.getAttrib(wrapper, "data-mce-p-title") : "") || (ifr?.getAttribute("aria-label") || ""),
            width: node.getAttribute("width") || dom.getStyle(node, "width") || "",
            height: node.getAttribute("height") || dom.getStyle(node, "height") || "",
        };

        editor.windowManager.open({
            title: "編輯 iFrame",
            size: "normal",
            body: {
                type: "panel",
                items: [{ type: "input", name: "src", label: "來源網址 (src)" }, { type: "input", name: "title", label: "替代文字 / 描述 (AA)" }, {
                    type: "input",
                    name: "width",
                    label: "寬度 (留空=100%, 例: 640, 640px, 80%)",
                }, { type: "input", name: "height", label: "高度 (例: 360, 360px)" }],
            },
            initialData: data,
            buttons: [{ type: "cancel", text: "取消" }, { type: "submit", text: "套用", primary: true }],

            onSubmit: (api) =>
            {
                const v = api.getData() as typeof data;
                const ifr = resolveIframeElm(editor, node);
                if (!ifr)
                {
                    api.close();
                    return;
                }

                const { url, warning } = validateIframeSrc(v.src);
                if (warning)
                {
                    editor.windowManager.alert(warning);
                    return;
                }

                const nw = normalizeIframeWidth(v.width);
                const nh = normalizeIframeHeight(v.height);
                const referrerPolicy = getIframeReferrerPolicy(url);
                const widthAttr = toIframeDimensionAttribute(nw);
                const heightAttr = toIframeDimensionAttribute(nh);
                const cssWidth = toIframeCssDimension(nw);
                const cssHeight = toIframeCssDimension(nh);

                editor.undoManager.transact(() =>
                {
                    const dom = editor.dom;

                    dom.setAttrib(ifr, "src", url || null);
                    dom.setAttrib(ifr, "title", v.title || null);
                    dom.setAttrib(ifr, "width", widthAttr);
                    dom.setAttrib(ifr, "height", heightAttr);
                    dom.setAttrib(ifr, "loading", "lazy");
                    dom.setAttrib(ifr, "referrerpolicy", referrerPolicy);
                    dom.setAttrib(ifr, "allowfullscreen", "");

                    dom.setStyle(ifr, "display", "block");
                    dom.setStyle(ifr, "width", cssWidth);
                    dom.setStyle(ifr, "height", cssHeight);
                    dom.setStyle(ifr, "max-width", "100%");
                    dom.setStyle(ifr, "border", "0");

                    const wrapperNode = dom.getParent(ifr, (n: Node) => isIframeObjectWrapper(editor, n));
                    const wrapper = isElementNode(wrapperNode) ? wrapperNode : null;

                    if (wrapper)
                    {
                        const setWrap = (k: string, val: string | null) => dom.setAttrib(wrapper, k, val);
                        setWrap("data-mce-p-src", url || null);
                        setWrap("data-mce-url", url || null);
                        setWrap("data-ephox-embed-iri", url || null);
                        dom.setStyle(wrapper, "display", "block");
                        dom.setStyle(wrapper, "width", cssWidth);
                        dom.setStyle(wrapper, "height", cssHeight);
                        dom.setStyle(wrapper, "max-width", "100%");
                        dom.setStyle(wrapper, "border", "0");

                        const cacheAttrs: Record<string, string | null> = {
                            "data-mce-p-title": v.title || null,
                            "data-mce-p-width": widthAttr,
                            "data-mce-p-height": heightAttr,
                            "data-mce-p-loading": "lazy",
                            "data-mce-p-referrerpolicy": referrerPolicy,
                            "data-mce-p-allowfullscreen": "",
                        };
                        Object.entries(cacheAttrs).forEach(([k, val]) => setWrap(k, val));
                    }

                    editor.nodeChanged();
                });
                editor.setDirty(true);
                editor.fire("input");
                editor.fire("change");
                editor.fire("wcms-iframe-updated");
                api.close();
            },
        });
    };

    const setup = (editor: TinyMCEEditor) =>
    {
        let lastPos = { x: 0, y: 0 };
        editor.on("MouseMove", (e) =>
        {
            if (typeof e?.clientX === "number" && typeof e?.clientY === "number")
            {
                lastPos = { x: e.clientX, y: e.clientY };
            }
        });

        const getIframeAtPoint = (): HTMLIFrameElement | null =>
        {
            const iframes = editor.dom.select("iframe") as HTMLIFrameElement[];
            if (!iframes?.length) return null;
            for (const node of iframes)
            {
                const r = node.getBoundingClientRect?.();
                if (!r) continue;
                if (lastPos.x >= r.left && lastPos.x <= r.right && lastPos.y >= r.top && lastPos.y <= r.bottom)
                {
                    return node;
                }
            }
            return null;
        };

        editor.ui.registry.addMenuItem("iframeedit", {
            text: "編輯 iFrame",
            onAction: () =>
            {
                const node = getIframeAtPoint();
                if (node) openDialog(editor, node);
            },
        });

        editor.ui.registry.addContextMenu("wcms-iframe-menu", { update: () => (getIframeAtPoint() ? ["iframeedit"] : []) });

        editor.on("DblClick", () =>
        {
            const node = getIframeAtPoint();
            if (node) openDialog(editor, node);
        });
    };

    return { setup };
};
// #endregion

// #region Private
const isIframeObjectWrapper = (editor: TinyMCEEditor, node: Node) =>
{
    const el = node as HTMLElement;
    return editor.dom.hasClass(el, "mce-preview-object")
        || editor.dom.hasClass(el, "mce-object")
        || editor.dom.hasClass(el, "mce-object-iframe")
        || node.nodeName === "FIGURE";
};

/** 判斷節點是否為 TinyMCE DOM API 可操作的 Element。 */
const isElementNode = (node: Node | null): node is Element =>
{
    return node?.nodeType === 1;
};
// #endregion
