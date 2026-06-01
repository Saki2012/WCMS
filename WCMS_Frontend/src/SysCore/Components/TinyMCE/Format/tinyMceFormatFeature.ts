import type { TinyMCEEditor } from "../Core/tinyMceTypes";

export const registerTinyMceFormatControls = (editor: TinyMCEEditor) =>
{
    const FORMAT_WHITELIST: Array<keyof CSSStyleDeclaration> = [
        "color",
        "backgroundColor",
        "fontFamily",
        "fontSize",
        "textDecoration",
        "fontStyle",
        "fontWeight",
        "lineHeight",
        "verticalAlign",
    ];
    let copiedStyles: Partial<Record<keyof CSSStyleDeclaration, string>> = {};
    let copiedSupSub: "sup" | "sub" | null = null;

    const getCS = (el?: Element | null) =>
    {
        if (!el) return null;
        const view = el.ownerDocument?.defaultView || (editor as TinyMCEEditor & { getWin?: () => Window; }).getWin?.() || window;
        return view.getComputedStyle(el);
    };

    const isMeaningful = (key: keyof CSSStyleDeclaration, val?: string) =>
    {
        if (!val) return false;
        const v = String(val).trim().toLowerCase();
        if (v === "initial" || v === "normal" || v === "none") return false;
        if (key === "backgroundColor" && (v === "transparent" || v === "rgba(0, 0, 0, 0)")) return false;
        return true;
    };

    const pickStyles = (el: Element | null) =>
    {
        const result: Partial<Record<keyof CSSStyleDeclaration, string>> = {};
        if (!el) return result;
        copiedSupSub = el.tagName === "SUP" ? "sup" : el.tagName === "SUB" ? "sub" : null;
        const inlineMap = new Map<string, string>();
        (el.getAttribute("style") ?? "").split(";").forEach(s =>
        {
            const [k, v] = s.split(":").map(x => x?.trim());
            if (k && v) inlineMap.set(k.toLowerCase(), v);
        });

        const cs = getCS(el);

        FORMAT_WHITELIST.forEach((key) =>
        {
            const kebab = (key as string).replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
            const inlineVal = inlineMap.get(kebab);
            const val = inlineVal ?? cs?.getPropertyValue(kebab);
            if (isMeaningful(key, val)) result[key] = val;
        });

        return result;
    };

    const findStyleSource = (start: Element | null): Element | null =>
    {
        let cur: Element | null = start;
        const stop = editor.getBody();
        while (cur && cur !== stop)
        {
            const styles = pickStyles(cur);
            if (Object.keys(styles).length > 0) return cur;
            cur = cur.parentElement;
        }
        return null;
    };

    const probeCurrentPosition = (): Element | null =>
    {
        const doc = editor.getDoc();
        const probe = doc.createElement("span");
        probe.setAttribute("data-fp-probe", "1");
        probe.appendChild(doc.createTextNode("\u200B"));
        editor.selection.getRng()?.insertNode(probe);
        const src = probe.parentElement;
        const p = probe.parentNode;
        if (p) p.removeChild(probe);
        return src;
    };

    const toStyleAttr = (styles: Partial<Record<keyof CSSStyleDeclaration, string>>) =>
        Object.entries(styles).filter(([, v]) => !!v).map(([k, v]) => `${k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}:${v}`).join(";");

    const toggleBodyClass = (cls: string) =>
    {
        const body = editor.getBody?.();
        if (!body) return;
        editor.dom.toggleClass(body, cls);
    };

    const hasBodyClass = (cls: string) =>
    {
        const body = editor.getBody?.();
        return !!body && editor.dom.hasClass(body, cls);
    };

    editor.ui.registry.addButton("copyformat", {
        tooltip: "複製格式",
        icon: "format-painter",
        onAction: () =>
        {
            const startEl = editor.selection.getStart(true) as Element | null;
            let src = findStyleSource(startEl);
            if (!src) src = probeCurrentPosition();

            copiedStyles = pickStyles(src);
            editor.notificationManager.open({
                text: Object.keys(copiedStyles).length > 0 ? "已複製格式" : "找不到可複製的格式",
                type: Object.keys(copiedStyles).length > 0 ? "info" : "warning",
                timeout: 1200,
            });
        },
    });

    editor.ui.registry.addToggleButton("togglePBlocks", {
        tooltip: "顯示/隱藏 P 區塊框線",
        text: "P",
        onAction: (api) =>
        {
            toggleBodyClass("wcms-show-p");
            api.setActive(hasBodyClass("wcms-show-p"));
        },
        onSetup: (api) =>
        {
            const refresh = () => api.setActive(hasBodyClass("wcms-show-p"));
            editor.on("init NodeChange", refresh);
            return () => editor.off("init NodeChange", refresh);
        },
    });

    editor.ui.registry.addToggleButton("toggleDivBlocks", {
        tooltip: "顯示/隱藏 DIV 區塊框線",
        text: "DIV",
        onAction: (api) =>
        {
            toggleBodyClass("wcms-show-div");
            api.setActive(hasBodyClass("wcms-show-div"));
        },
        onSetup: (api) =>
        {
            const refresh = () => api.setActive(hasBodyClass("wcms-show-div"));
            editor.on("init NodeChange", refresh);
            return () => editor.off("init NodeChange", refresh);
        },
    });

    editor.ui.registry.addButton("applyformat", {
        tooltip: "套用格式",
        icon: "paste",
        onAction: () =>
        {
            if (!copiedStyles || Object.keys(copiedStyles).length === 0)
            {
                editor.notificationManager.open({ text: "尚未複製任何格式", type: "warning", timeout: 1500 });
                return;
            }
            const styleAttr = toStyleAttr(copiedStyles);
            if (!styleAttr) return;
            if (styleAttr)
            {
                editor.formatter.register("__wcms_format_painter__", { inline: "span", attributes: { style: styleAttr } });
                editor.formatter.apply("__wcms_format_painter__");
            }

            editor.undoManager.transact(() =>
            {
                if (copiedSupSub === "sup") editor.execCommand("superscript");
                else if (copiedSupSub === "sub") editor.execCommand("subscript");
                editor.formatter.register("__wcms_format_painter__", { inline: "span", attributes: { style: styleAttr } });
                editor.formatter.apply("__wcms_format_painter__");
            });
        },
    });

    editor.addShortcut("alt+shift+c", "複製格式", () => editor.execCommand("mceToggleFormat"));
    editor.addShortcut("alt+shift+v", "套用格式", () =>
    {});
    editor.addShortcut("alt+shift+u", "移除連結", () => editor.execCommand("unlink"));
    editor.addShortcut("alt+shift+r", "移除格式", () => editor.execCommand("RemoveFormat"));
    editor.addShortcut("alt+shift+b", "切換顯示區塊框線", () =>
    {
        editor.execCommand("mceVisualBlocks");
    });
};
