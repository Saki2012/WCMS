// src/hooks/TinyMCE_Hook.ts
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { MessageStatus, type SysMessageModel } from "@/SysCore/Utils/API/APIBase";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useMemo, useRef } from "react";
import type { Editor as TinyMCEEditor } from "tinymce";
import { useContentTransform } from "./useContentTransform";

export interface TinyMceHookOptions
{
    id: string;
    value: string;
    onChange: (html: string) => void;

    // 後端 API
    uploadFileApi?: string; // 檔案/圖片上傳 API (form-data: file)
    // 依 internalId 轉可瀏覽 URL（同時插入 data-internal）
    makeFileUrl?: (internalId: string, meta: { kind: "file" | "image"; }) => string;

    // 多語、外觀
    languageUrl?: string; // 例如 "/tinymce-i18n/langs5/zh_TW.js"
    language?: string; // "zh_TW"
    baseUrl?: string; // "/tinymce"
    initExtras?: Record<string, any>;
}
const pickSandboxForUrl = (rawUrl: string) =>
{
    // 讓相對網址也能被解析（SSR 也安全）
    const base = "https://example.com";
    let host = "";
    try
    {
        host = new URL(rawUrl, base).hostname.toLowerCase(); // ← 只拿主機名
    } catch
    {
        return "allow-same-origin"; // 解析失敗就保守處理
    }

    // google.*（含 maps.google.com、google.com.tw 等）
    if (/^(?:[\w-]+\.)*google\.[a-z.]+$/i.test(host))
    {
        return "allow-same-origin allow-scripts allow-popups";
    }

    // YouTube / Vimeo（舉例）
    if (
        host === "youtu.be"
        || /^(?:[\w-]+\.)*youtube\.com$/i.test(host)
        || /^(?:[\w-]+\.)*vimeo\.com$/i.test(host)
    )
    {
        return "allow-same-origin allow-scripts allow-presentation";
    }

    return "allow-same-origin";
};
const normalizeWidth = (raw?: string) =>
{
    const x = (raw ?? "").trim();
    if (!x) return "100%";
    if (/^\d+%$/i.test(x)) return x;
    if (/^\d+(px)?$/i.test(x)) return x.replace(/px$/i, "") + "px";
    return "100%";
};

/* 🟢 新增：height 空白→"360"；禁止百分比；接受數字或 123px（轉為 "123"） */
const normalizeHeight = (raw?: string) =>
{
    const x = (raw ?? "").trim();
    if (!x) return "360";
    if (/^\d+%$/i.test(x)) return "360";
    if (/^\d+$/i.test(x)) return x;
    if (/^\d+px$/i.test(x)) return x.replace(/px$/i, "");
    return "360";
};
export const useTinyMCE = (p: TinyMceHookOptions) =>
{
    const editorRef = useRef<TinyMCEEditor | null>(null);
    const { publish } = useToast();
    // 1) 掛上內容轉換（prefix 可自訂；不給就用預設）
    const { toDb, toEditor } = useContentTransform({
        previewPrefix: `${FileManagementAPI.PREVIEW_URL}`,
        attrName: INTERNAL_ATTR,
    });

    const uploadAndReturn = async (file: File) =>
    {
        const api = p.uploadFileApi ?? `${FileManagementAPI.UPLOAD_URL}`;
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(api, { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        // 後端請回傳 { internalId: "xxx", name: "filename.ext" }
        const json = await res.json();
        if (!json.IsSuccess)
        {
            (json.SysMessage as SysMessageModel[]).forEach((msg) =>
            {
                if (msg.Status === 3)
                {
                    publish({ level: MessageStatus.Error, title: msg.MessageCode, text: msg.Message });
                }
            });
        }
        return { isSuccess: json.IsSuccess, internalId: json.Data[0], name: file.name };
    };

    const toUrl = (id: string, kind: "file" | "image") =>
        (p.makeFileUrl?.(id, { kind })) ?? `${FileManagementAPI.PREVIEW_URL}/${id}`;

    const pickLocalFile = (cb: (file: File) => void, opt?: { accept?: string; }) =>
    {
        const input = document.createElement("input");
        input.type = "file";

        // 若有指定檔案類型，設定到 input.accept
        if (opt?.accept)
        {
            input.accept = opt.accept; // 例如 ".pdf,application/pdf"
        }

        input.onchange = () =>
        {
            const f = input.files?.[0];
            if (f) cb(f);
        };
        input.click();
    };

    const insertIframeDialog = (ed: TinyMCEEditor) =>
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
            buttons: [
                { type: "cancel", text: "取消" },
                { type: "submit", text: "插入", primary: true },
            ],
            onSubmit(api)
            {
                const data: any = api.getData();
                const width = normalizeWidth(data.width);
                const height = normalizeHeight(data.height);
                const title = (data.title || "").trim();
                const url = (data.url || "").trim();
                if (!url)
                {
                    ed.windowManager.alert("請輸入 URL");
                    return;
                }

                const html = `<iframe src="${ed.dom.encode(url)}"
                    title="${ed.dom.encode(title)}"
                    width="${ed.dom.encode(width)}"
                    height="${ed.dom.encode(height)}"
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"  
                    allowfullscreen
                    style="max-width:100%;border:0;"></iframe>`;
                ed.insertContent(html);
                api.close();
            },
        });
    };

    const editorInit = useMemo(() =>
    {
        const baseUrl = p.baseUrl ?? "/tinymce";
        return {
            base_url: baseUrl,
            tinymceScriptSrc: `${baseUrl}/tinymce.min.js`,
            license_key: "gpl",
            height: 450,
            menubar: false,
            convert_urls: false,
            relative_urls: false,
            remove_script_host: false,
            plugins: [
                "advlist",
                "autolink",
                "lists",
                "link",
                "image",
                "charmap",
                "preview",
                "anchor",
                "searchreplace",
                "code",
                "fullscreen",
                "insertdatetime",
                "media",
                "table",
                "help",
                "wordcount",
                "hr",
                "paste",
            ],
            toolbar: [
                "undo redo | blocks fontfamily fontsize |",
                "bold italic underline strikethrough forecolor backcolor superscript subscript|",
                "alignleft aligncenter alignright alignjustify |",
                "bullist numlist outdent indent |",
                "link unlink | image filepicker |",
                "table |",
                "copyformat applyformat removeformat | insertiframe insertpdfiframe | hr |",
                "togglePBlocks toggleDivBlocks |",
                "fullscreen code",
            ].join(" "),
            contextmenu: "link image table",
            visualblocks_default_state: true,
            toolbar_mode: "wrap",

            // ★06 字體大小、字型
            font_size_formats:
                "8=8px 9=9px 10=10px 11=11px 12=12px 14=14px 16=16px 18=18px 20=20px 24=24px 28=28px 32=32px 36=36px 48=48px 72=72px",
            font_family_formats: `
        Arial=arial,helvetica,sans-serif;
        Courier New=courier new,courier;
        Georgia=georgia,palatino;
        Tahoma=tahoma,arial,helvetica,sans-serif;
        Times New Roman=times new roman,times;
        Verdana=verdana,geneva;
        微軟正黑體=微軟正黑體,Microsoft JhengHei,sans-serif;
        新細明體=新細明體,PMingLiU,serif;
        標楷體=標楷體,DFKai-SB,serif;`,

            // AA：讓圖片/iframe RWD；允許 td/th 設定背景色
            content_style: `
        img.rwd-img{max-width:100%;height:auto;}
        iframe{max-width:100%;}
        table{border-collapse:collapse;width:100%;}
        td,th{border:1px solid #C9CDD4;padding:6px;vertical-align:top;}
        thead th{background:#f6f7f9;}
        hr{border:0;border-top:1px solid #C9CDD4;margin:1rem 0;}

        /* ===== WCMS: Block helpers (per element toggle) ===== */
      body.wcms-show-p p{
        outline: 1px dashed rgba(60, 120, 255, .55);
        position: relative;
      }
      body.wcms-show-p p::before{
        content: "p";
        position: absolute;
        top: -9px; left: 0;
        font-size: 11px; line-height: 1;
        background: rgba(17, 24, 39, .9);
        color: #fff; padding: 0 3px; border-radius: 2px;
        pointer-events: none;
      }
      body.wcms-show-div div{
        outline: 1px dashed rgba(16, 185, 129, .55);
        position: relative;
      }
      body.wcms-show-div div::before{
        content: "div";
        position: absolute;
        top: -9px; left: 0;
        font-size: 11px; line-height: 1;
        background: rgba(17, 24, 39, .9);
        color: #fff; padding: 0 3px; border-radius: 2px;
        pointer-events: none;
      }
      /* ===== /WCMS ===== */
      `,
            valid_styles: {
                td: "background-color",
                th: "background-color",
                "*": "color,font-size,font-family,background-color,text-decoration,font-style,font-weight,line-height,vertical-align,"
                    + "border,border-top,border-right,border-bottom,border-left,text-align,width,height",
            },
            table_advtab: true,
            table_cell_advtab: true,
            table_toolbar: "tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | "
                + "tableinsertcolbefore tableinsertcolafter tabledeletecol | mergecells",
            table_responsive_width: true,
            // i18n / skin
            skin_url: `${baseUrl}/skins/ui/oxide`,
            content_css: `${baseUrl}/skins/content/default/content.css`,
            icons_url: `${baseUrl}/icons/default/icons.js`,
            language: p.language ?? "zh_TW",
            language_url: p.languageUrl ?? "/tinymce-i18n/langs5/zh_TW.js",

            // ★01/02 本機檔案與圖片上傳（插入 data-internal）
            file_picker_types: "image",
            file_picker_callback: (callback: any, _value: any, meta: any) =>
            {
                pickLocalFile(async (file) =>
                {
                    try
                    {
                        const { isSuccess, internalId, name } = await uploadAndReturn(file);
                        if (!isSuccess) return;
                        if (meta.filetype === "file")
                        {
                            const href = toUrl(internalId, "file");
                            // 插入可下載連結 + data-internal
                            const ed = editorRef.current!;
                            applyFileLinkToSelection(ed, {
                                href,
                                title: name ?? file.name,
                                internalId,
                                download: true,
                                // targetBlank: true, // 若你想讓下載另開視窗可打開這行
                            });
                            // 直接把當前選取轉成 <a>
                            const anchor = ed.dom.select("a[href=\"" + href + "\"]").pop();
                            if (anchor) ed.dom.setAttrib(anchor, "download", "");
                        } else if (meta.filetype === "image")
                        {
                            const src = toUrl(internalId, "image");
                            // 先用 100% RWD
                            callback(src, {
                                alt: name ?? file.name,
                                "class": "rwd-img",
                                [INTERNAL_ATTR]: internalId,
                            });
                        }
                    } catch
                    {
                        alert("上傳失敗");
                    }
                });
            },

            // ★04 自訂 IFrame 插入
            setup: (editor: TinyMCEEditor) =>
            {
                editorRef.current = editor;

                const hasCellSelection = (): boolean =>
                {
                    const doc = editor.getDoc();
                    if (!doc) return false;

                    // 多格框選時，TinyMCE 會替被選到的 cell 加上 mce-selected
                    const selected = editor.dom.select("td.mce-selected,th.mce-selected", doc);
                    if (selected.length > 0) return true;

                    // 游標在 cell 內也算
                    const start = editor.selection.getStart(true);
                    return !!(editor.dom.is(start, "td,th") || editor.dom.getParent(start, "td,th"));
                };

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
                let copiedSupSub: "sup" | "sub" | null = null; // ✅ 新增旗標
                const getCS = (el?: Element | null) =>
                {
                    if (!el) return null;
                    const view = el.ownerDocument?.defaultView || (editor as any).getWin?.() || window;
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
                    // 解析 inline style
                    const inlineMap = new Map<string, string>();
                    (el.getAttribute("style") ?? "")
                        .split(";")
                        .forEach(s =>
                        {
                            const [k, v] = s.split(":").map(x => x?.trim());
                            if (k && v) inlineMap.set(k.toLowerCase(), v);
                        });

                    const cs = getCS(el);

                    FORMAT_WHITELIST.forEach((key) =>
                    {
                        const kebab = (key as string).replace(/[A-Z]/g, m => "-" + m.toLowerCase());
                        const inlineVal = inlineMap.get(kebab);
                        const val = inlineVal ?? (cs as any)[key];
                        if (isMeaningful(key, val)) result[key] = val!;
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
                    probe.appendChild(doc.createTextNode("\u200B")); // zero-width space
                    editor.selection.getRng()?.insertNode(probe);
                    const src = probe.parentElement;
                    // 清掉探針
                    const p = probe.parentNode;
                    if (p) p.removeChild(probe);
                    return src;
                };
                // ✅ 轉成 style 屬性字串
                const toStyleAttr = (styles: Partial<Record<keyof CSSStyleDeclaration, string>>) =>
                    Object.entries(styles)
                        .filter(([, v]) => !!v)
                        .map(([k, v]) => `${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}:${v}`)
                        .join(";");

                if (p.initExtras && typeof p.initExtras.setup === "function")
                {
                    p.initExtras.setup(editor);
                }

                // DB → 編輯器：BeforeSetContent 時把 data-internalid 改回 src
                editor.on("BeforeSetContent", (e: any) =>
                {
                    if (typeof e.content === "string") e.content = toEditor(e.content);
                });
                // 編輯器 → DB：GetContent 時把 src 改回 data-internalid（僅程式取用）
                editor.on("GetContent", (e: any) =>
                {
                    if (typeof e.content === "string") e.content = toDb(e.content);
                });

                // insertiframe 按鈕
                editor.ui.registry.addButton("insertiframe", {
                    icon: "embed",
                    tooltip: "插入 IFrame（YouTube / Google Map）",
                    onAction: () => insertIframeDialog(editor),
                });
                // 🆕 上傳 PDF 並插入 iframe
                editor.ui.registry.addButton("insertpdfiframe", {
                    icon: "export-pdf",
                    tooltip: "上傳 PDF 並插入 iFrame",
                    onAction: () =>
                    {
                        // 用既有的本機檔案挑選工具
                        pickLocalFile(async (file) =>
                        {
                            // 只接受 pdf
                            if (!/\.pdf$/i.test(file.name))
                            {
                                alert("請選擇 PDF 檔案");
                                return;
                            }

                            try
                            {
                                const { isSuccess, internalId, name } = await uploadAndReturn(file);
                                if (!isSuccess) return;

                                // 用預覽 API 當 src（可視需要改成 toUrl(internalId, 'file')）
                                const src = `${FileManagementAPI.PREVIEW_URL}/${internalId}`;
                                const title = (name ?? file.name).replace(/\.[^.]+$/, "");
                                const attrName = INTERNAL_ATTR; // data-internalid

                                const html = `<p>`
                                    + `<iframe`
                                    + ` title="${editor.dom.encode(title)}"`
                                    + ` width="100%"`
                                    + ` height="1000"`
                                    + ` loading="lazy"`
                                    + ` referrerpolicy="no-referrer-when-downgrade"`
                                    + ` frameborder="0"`
                                    + ` allowfullscreen`
                                    // + ` sandbox="allow-same-origin"`
                                    + ` src="${src}"`
                                    + ` ${attrName}="${internalId}"` // 🔴 關鍵：把 internalId 寫進 data-internalid
                                    + `></iframe>`
                                    + `</p>`;

                                editor.insertContent(html);
                                editor.nodeChanged();
                            } catch
                            {
                                alert("上傳失敗");
                            }
                        }, { accept: "application/pdf" });
                    },
                });

                // format-painter
                // ✅ 複製格式：從目前選取最接近的 inline 元素取樣
                editor.ui.registry.addButton("copyformat", {
                    tooltip: "複製格式",
                    icon: "format-painter",
                    onAction: () =>
                    {
                        // 先取選取起點（TinyMCE 會回傳最貼近的 inline 元素）
                        let startEl = editor.selection.getStart(true) as Element | null;
                        // 找到第一個有意義樣式的祖先
                        let src = findStyleSource(startEl);
                        // 找不到就用探針取樣
                        if (!src) src = probeCurrentPosition();

                        copiedStyles = pickStyles(src);
                        editor.notificationManager.open({
                            text: Object.keys(copiedStyles).length > 0 ? "已複製格式" : "找不到可複製的格式",
                            type: Object.keys(copiedStyles).length > 0 ? "info" : "warning",
                            timeout: 1200,
                        });
                    },
                });
                // ✅ 共用：讀取/切換 body 上的 class
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
                // ✅ 顯示/隱藏 P 區塊框線
                editor.ui.registry.addToggleButton("togglePBlocks", {
                    tooltip: "顯示/隱藏 P 區塊框線",
                    text: "P", // 也可換成 icon: 'paragraph'
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
                // ✅ 顯示/隱藏 DIV 區塊框線
                editor.ui.registry.addToggleButton("toggleDivBlocks", {
                    tooltip: "顯示/隱藏 DIV 區塊框線",
                    text: "DIV", // 也可換成 icon: 'blockquote' 或自定義
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
                // ✅ 套用格式：用 <span style="..."> 包住選取內容（最穩定）
                editor.ui.registry.addButton("applyformat", {
                    tooltip: "套用格式",
                    icon: "paste",
                    onAction: () =>
                    {
                        if (!copiedStyles || Object.keys(copiedStyles).length === 0)
                        {
                            editor.notificationManager.open({
                                text: "尚未複製任何格式",
                                type: "warning",
                                timeout: 1500,
                            });
                            return;
                        }
                        const styleAttr = toStyleAttr(copiedStyles);
                        if (!styleAttr) return;
                        if (styleAttr)
                        {
                            editor.formatter.register("__wcms_format_painter__", {
                                inline: "span",
                                attributes: { style: styleAttr },
                            });
                            editor.formatter.apply("__wcms_format_painter__");
                        }

                        editor.undoManager.transact(() =>
                        {
                            // ✅ 先處理語意化上/下標
                            if (copiedSupSub === "sup") editor.execCommand("superscript"); // 或 editor.formatter.apply('superscript')
                            else if (copiedSupSub === "sub") editor.execCommand("subscript");
                            editor.formatter.register("__wcms_format_painter__", {
                                inline: "span",
                                attributes: { style: styleAttr }, // ✅ 一律輸出成 inline style，最穩
                            });
                            editor.formatter.apply("__wcms_format_painter__");
                        });
                    },
                });
                editor.addShortcut("alt+shift+c", "複製格式", () => editor.execCommand("mceToggleFormat")); // 只為了提示，實際上用上面的按鈕
                editor.addShortcut("alt+shift+v", "套用格式", () =>
                {/* 上面按鈕處理 */});

                // ★11 移除連結快捷鍵
                editor.addShortcut("alt+shift+u", "移除連結", () => editor.execCommand("unlink"));

                // ★10 自訂移除樣式快捷鍵（原本有 removeformat 按鈕）
                editor.addShortcut("alt+shift+r", "移除格式", () => editor.execCommand("RemoveFormat"));
                editor.addShortcut("alt+shift+b", "切換顯示區塊框線", () =>
                {
                    editor.execCommand("mceVisualBlocks");
                });
                // ★02 調整圖片寬高（若空白或100% → RWD）
                editor.on("ObjectSelected", (e) =>
                {
                    const elm = e.target as HTMLElement;
                    if (elm?.tagName?.toLowerCase() === "img")
                    {
                        // 保持 data-internal
                        const internal = elm.getAttribute(INTERNAL_ATTR);
                        if (internal && !elm.classList.contains("rwd-img"))
                        {
                            // 若寬度是空白或 100%，就 RWD
                            const w = elm.getAttribute("width") || elm.style.width || "";
                            if (!w || w === "100%" || w === "100")
                            {
                                elm.classList.add("rwd-img");
                                elm.removeAttribute("height");
                                elm.style.height = "";
                            }
                        }
                    }
                });
                editor.ui.registry.addButton("smarttableprops", {
                    tooltip: "表格/儲存格屬性",
                    icon: "table", // 使用現成圖示
                    onAction: () =>
                    {
                        if (hasCellSelection())
                        {
                            // 👉 直接開「儲存格屬性」：背景色只會套到所選儲存格
                            editor.execCommand("mceTableCellProps");
                        } else
                        {
                            // 👉 沒選到儲存格才開「表格屬性」
                            editor.execCommand("mceTableProps");
                        }
                    },
                });
                editor.ui.registry.addMenuItem?.("cellbg", {
                    text: "設定儲存格背景色…",
                    onAction: () => editor.execCommand("mceTableCellProps"),
                    context: "table",
                });
                // 保障：將使用者手動輸入的 <img> 也轉為 data-internal（若可解析 internal）
                editor.on("NodeChange", (_evt) =>
                {
                    const imgs = editor.dom.select("img");
                    imgs.forEach((img) =>
                    {
                        if (!img.getAttribute(INTERNAL_ATTR)) return;
                        // 確保 src 與 internal 對應（避免被 TinyMCE 改寫）
                        const internalId = img.getAttribute(INTERNAL_ATTR)!;
                        const expect = toUrl(internalId, "image");
                        if (img.getAttribute("src") !== expect) editor.dom.setAttrib(img, "src", expect);
                    });
                });
                // ★01 檔案連結插入按鈕（除了工具列外也提供）
                editor.ui.registry.addButton("filepicker", {
                    icon: "new-document",
                    tooltip: "上傳檔案並插入下載連結",
                    onAction: () =>
                    {
                        pickLocalFile(async (file) =>
                        {
                            try
                            {
                                const { isSuccess, internalId, name } = await uploadAndReturn(file);
                                if (!isSuccess) return;
                                const href = toUrl(internalId, "file");
                                applyFileLinkToSelection(editor, {
                                    href,
                                    title: name ?? file.name,
                                    internalId,
                                    download: true,
                                });
                            } catch
                            {
                                alert("上傳失敗");
                            }
                        });
                    },
                });
                // AA：連結預設帶 title（以文字當 title，使用者可再改）
                editor.on("ExecCommand", (cmd) =>
                {
                    if (cmd.command?.toLowerCase() === "mcelink")
                    {
                        const a = editor.dom.getParent(editor.selection.getNode(), "a");
                        if (a && !a.title && a.textContent) a.title = a.textContent;
                    }
                });
            },
            // ★06 / ★14 文字前景/背景色已在 toolbar forecolor / backcolor
            // ★10 / ★11 的快捷鍵見 setup
            // 基本事件接上外部 state
            setup_onchange: true,
            init_instance_callback: (ed: TinyMCEEditor) =>
            {
                editorRef.current = ed;
            },
            paste_data_images: false,
            paste_retain_style_properties: "all",
            paste_merge_formats: true,
            paste_word_valid_elements:
                "b,strong,i,em,u,strike,sub,sup,p,h1,h2,h3,h4,h5,h6,table,tr,td,th,thead,tbody,tfoot,colgroup,col,span,div,ol,ul,li,img,a,br,hr",
            paste_webkit_styles:
                "color font-size font-family background-color text-decoration font-style font-weight line-height",
            paste_filter_drop: false,
            valid_elements: "*[*]",
            extended_valid_elements: undefined,
            invalid_elements: "script",
            // ← 這裡是處理從 Word/Excel 貼上時移除固定 px 寬度
            paste_postprocess: (_plugin: any, args: any) =>
            {
                const root = args.node as HTMLElement;
                root.querySelectorAll("table").forEach(t =>
                {
                    t.removeAttribute("width");
                    (t as HTMLElement).style.width = "100%";
                    t.querySelectorAll("colgroup,col,td,th").forEach(el =>
                    {
                        el.removeAttribute("width");
                        (el as HTMLElement).style.width = "";
                    });
                });
            },
            ...(p.initExtras ?? {}),
        } as const;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [p.id, p.language, p.languageUrl, p.baseUrl, p.uploadFileApi, p.makeFileUrl, p.initExtras, toDb, toEditor]);

    return { editorRef, init: editorInit, value: p.value, onChange: p.onChange, uploadAndReturn, toUrl };
};

export interface UseTinyMceInternalImageOptions
{
    // 把 internalId 轉成可預覽的 API URL（例如 /Service/File/Image/:id）
    resolvePreviewUrl: (internalId: string) => string;
    // AA：存檔時若沒有 alt，就補 alt=""（預設 true）
    enforceAlt?: boolean;
}

export interface UseTinyMceInternalImageResult
{
    // 提供給外部把事件掛到 editor（由外層 comp 整合）
    setup: (editor: any) => void;
    // 額外提供純函式，若你在外部流程要單獨呼叫也行（可不使用）
    transformForEditor: (html: string) => string;
    transformForDb: (html: string) => string;
}

export const INTERNAL_ATTR = "data-internalid";

const applyFileLinkToSelection = (
    ed: TinyMCEEditor,
    opts: { href: string; title?: string; internalId?: string; download?: boolean; targetBlank?: boolean; },
) =>
{
    const { href, title, internalId, download, targetBlank } = opts;
    const sel = ed.selection;
    if (!sel) return;

    const setAttrs = (a: HTMLElement) =>
    {
        // TinyMCE 的 setAttribs 不吃運算子鍵名，因此用逐一設定避免型別衝突
        ed.dom.setAttrib(a, "href", href);
        ed.dom.setAttrib(a, "title", title ?? "");
        if (internalId) ed.dom.setAttrib(a, INTERNAL_ATTR, internalId);
        if (download) ed.dom.setAttrib(a, "download", "");
        if (targetBlank)
        {
            ed.dom.setAttrib(a, "target", "_blank");
            // AA & 安全性
            ed.dom.setAttrib(a, "rel", "noopener");
        }
    };

    // 未選取 → 直接插入一個連結（用 title 或檔名當文字）
    if (sel.isCollapsed())
    {
        const linkText = title || href.split("/").pop() || "download";
        const a = ed.dom.create("a", {}) as HTMLElement;
        a.textContent = linkText;
        setAttrs(a);
        ed.insertContent((a as any).outerHTML);
        ed.nodeChanged();
        return;
    }

    // 有選取 → 優先修改既有 <a>；若沒有 <a>，用 mceInsertLink 包起來
    const start = sel.getStart();
    const existing = ed.dom.getParent(start, "a");
    if (existing)
    {
        setAttrs(existing as HTMLElement);
        ed.nodeChanged();
        return;
    }

    // 包成連結（不會改文字內容）
    ed.execCommand("mceInsertLink", false, { href, title: title ?? "" });
    const wrapped = ed.dom.getParent(ed.selection.getStart(), "a");
    if (wrapped) setAttrs(wrapped as HTMLElement);
    ed.nodeChanged();
};
const doTransformForEditor = (html: string, makeSrc: (id: string) => string) =>
{
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll<HTMLImageElement>("img").forEach(img =>
    {
        const id = img.getAttribute(INTERNAL_ATTR) || "";
        if (!id) return;
        const want = makeSrc(id);
        if (img.getAttribute("src") !== want) img.setAttribute("src", want);
    });
    return doc.body.innerHTML;
};

const doTransformForDb = (html: string, enforceAlt: boolean) =>
{
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll<HTMLImageElement>("img").forEach(img =>
    {
        if (img.hasAttribute(INTERNAL_ATTR))
        {
            // 存 DB 前：只留 internalId，移除 src
            img.removeAttribute("src");
        }
        if (enforceAlt && !img.hasAttribute("alt")) img.setAttribute("alt", "");
    });
    return doc.body.innerHTML;
};

export const useTinyMceInternalImage = (
    opts: UseTinyMceInternalImageOptions,
): UseTinyMceInternalImageResult =>
{
    const { resolvePreviewUrl, enforceAlt = true } = opts;

    const transformForEditor = (html: string) => doTransformForEditor(html, resolvePreviewUrl);

    const transformForDb = (html: string) => doTransformForDb(html, enforceAlt);

    const setup = (editor: any) =>
    {
        editor.on("BeforeSetContent", (e: any) =>
        {
            if (typeof e.content === "string" && e.content.includes("<img"))
            {
                e.content = transformForEditor(e.content);
            }
        });
        editor.on("GetContent", (e: any) =>
        {
            if (!e.format || e.format === "html")
            {
                e.content = transformForDb(e.content);
            }
        });
        editor.on("DblClick", (e: any) =>
        {
            const el = e?.target as HTMLElement | null;
            const img = el?.closest?.("img");
            if (img)
            {
                editor.selection.select(img); // 🟢 先選到該 <img>，對話框才能帶入現值
                editor.execCommand("mceImage"); // 🟢 呼叫內建圖片編輯對話框
            }
            const a = el?.closest?.("a[href]");
            if (a)
            {
                editor.selection.select(a);
                editor.execCommand("mceLink", false, { dialog: true });
                return;
            }
        });
        editor.on("PreInit", () =>
        {
            const ser = (editor as any).serializer;
            if (ser?.addNodeFilter)
            {
                ser.addNodeFilter("iframe", (nodes: any[]) =>
                {
                    nodes.forEach((node: any) =>
                    {
                        // 與你現成的函式一致
                        node.attr("sandbox", null);
                        node.attr("loading", "lazy");
                        node.attr("referrerpolicy", "no-referrer-when-downgrade");
                        node.attr("allowfullscreen", "");

                        // 一起把 wrapper 的快取欄位補齊，避免被蓋回空值
                        const wrap = node.parent;
                        if (wrap)
                        {
                            wrap.attr("data-mce-p-sandbox", null);
                            wrap.attr("data-mce-p-loading", "lazy");
                            wrap.attr("data-mce-p-referrerpolicy", "no-referrer-when-downgrade");
                            wrap.attr("data-mce-p-allowfullscreen", "");
                        }
                    });
                });
            }
        });
    };

    return { setup, transformForEditor, transformForDb } as const;
};

export type TinySetup = { setup: (editor: any) => void; };
export const useTinyMceIframeEdit = (): TinySetup =>
{
    const resolveIframeElm = (editor: any, node: Node | null): HTMLIFrameElement | null =>
    {
        if (!node) return null;
        // a) 自己就是 <iframe>
        if ((node as HTMLElement).nodeName === "IFRAME") return node as HTMLIFrameElement;
        const el = node as HTMLElement;
        // b) 往下找：常見結構 figure/div.mce-object-iframe > iframe
        const down1 = el.querySelector?.("iframe");
        if (down1) return down1 as HTMLIFrameElement;
        // c) 往上找祖先：有時選到的是內層的裝飾元素
        const up = editor.dom.getParent(el, "iframe");
        if (up) return up as HTMLIFrameElement;
        // d) 再保險：如果選到 wrapper（figure/div.mce-object-iframe），從 wrapper 內找
        if (el.matches?.("figure.mce-object-iframe, div.mce-object-iframe, figure, div"))
        {
            const inner = el.querySelector?.("iframe");
            if (inner) return inner as HTMLIFrameElement;
        }
        return null;
    };
    const openDialog = (editor: any, node: HTMLIFrameElement) =>
    {
        const ifr = resolveIframeElm(editor, node);
        const dom = editor.dom;
        const wrapper = ifr
            ? dom.getParent(ifr, (n: any) =>
                dom.hasClass(n, "mce-preview-object")
                || dom.hasClass(n, "mce-object")
                || dom.hasClass(n, "mce-object-iframe")
                || n.nodeName === "FIGURE")
            : null;

        const data = {
            src: node.getAttribute("src") || "",
            "data-mce-src": node.getAttribute("src") || "",
            title: (ifr?.getAttribute("title") || "") || (wrapper ? dom.getAttrib(wrapper, "data-mce-p-title") : "")
                || (ifr?.getAttribute("aria-label") || ""),
            width: node.getAttribute("width") || dom.getStyle(node, "width") || "", // 可能是屬性或 style
            height: node.getAttribute("height") || dom.getStyle(node, "height") || "",
        };

        editor.windowManager.open({
            title: "編輯 iFrame",
            size: "normal",
            body: {
                type: "panel",
                items: [
                    { type: "input", name: "src", label: "來源網址 (src)" },
                    { type: "input", name: "title", label: "替代文字 / 描述 (AA)" },
                    { type: "input", name: "width", label: "寬度 (留空=100%, 例: 640, 640px, 80%)" },
                    { type: "input", name: "height", label: "高度 (例: 360, 360px)" },
                ],
            },
            initialData: data,
            buttons: [
                { type: "cancel", text: "取消" },
                { type: "submit", text: "套用", primary: true },
            ],

            onSubmit: (api: any) =>
            {
                const v = api.getData() as typeof data;
                const ifr = resolveIframeElm(editor, node);
                if (!ifr)
                {
                    api.close();
                    return;
                } // 找不到就先跳出，避免誤改 wrapper

                // 依 URL 決定 sandbox（沿用你原本的判斷）
                // const sandbox = pickSandboxForUrl(v.src);

                const nw = normalizeWidth(v.width);
                const nh = normalizeHeight(v.height);

                editor.undoManager.transact(() =>
                {
                    const dom = editor.dom;

                    // 1) 直接在同一顆 <iframe> 上改屬性（null 代表移除）
                    dom.setAttrib(ifr, "src", v.src || null);
                    dom.setAttrib(ifr, "title", v.title || null);
                    dom.setAttrib(ifr, "width", nw);
                    dom.setAttrib(ifr, "height", nh);
                    // dom.setAttrib(ifr, "sandbox", sandbox || null);
                    dom.setAttrib(ifr, "loading", "lazy");
                    dom.setAttrib(ifr, "referrerpolicy", "no-referrer-when-downgrade");
                    dom.setAttrib(ifr, "allowfullscreen", "");

                    // 3) 補保險：清狀況外的 "width/height='null'" 殘留
                    if (ifr.getAttribute("width") === "null") dom.setAttrib(ifr, "width", null);
                    if (ifr.getAttribute("height") === "null") dom.setAttrib(ifr, "height", null);

                    // 4) 你原本就有的
                    dom.setStyle(ifr, "max-width", "100%");
                    dom.setStyle(ifr, "border", "0");

                    // 2) 找到 wrapper，更新「序列化會參考的快取屬性」
                    const wrapper = dom.getParent(ifr, (n: any) =>
                        dom.hasClass(n, "mce-preview-object")
                        || dom.hasClass(n, "mce-object")
                        || dom.hasClass(n, "mce-object-iframe")
                        || n.nodeName === "FIGURE");

                    if (wrapper)
                    {
                        // 這幾個欄位視 TinyMCE/插件版本而定，能找到就一起同步
                        const setWrap = (k: string, val: string | null) => dom.setAttrib(wrapper, k, val);
                        // 主要：保證 data-mce-p-src 與各類 URL 欄位是新值
                        setWrap("data-mce-p-src", v.src || null);
                        setWrap("data-mce-url", v.src || null);
                        setWrap("data-ephox-embed-iri", v.src || null);

                        // 如需更完整，其他屬性也能補上 data-mce-p-*
                        const cacheAttrs: Record<string, string | null> = {
                            "data-mce-p-title": v.title || null,
                            "data-mce-p-width": (typeof nw === "string" ? nw : String(nw)) || null,
                            "data-mce-p-height": (typeof nh === "string" ? nh : String(nh)) || null,
                            // "data-mce-p-sandbox": sandbox || null,
                            "data-mce-p-loading": "lazy",
                            "data-mce-p-referrerpolicy": "no-referrer-when-downgrade",
                            "data-mce-p-allowfullscreen": "", // boolean attr
                        };
                        Object.entries(cacheAttrs).forEach(([k, val]) => setWrap(k, val));
                    }

                    editor.nodeChanged();
                });
                // 4) 通知變更（確保 getContent / 外層 onChange 都拿到新字串）
                editor.setDirty(true);
                editor.fire("input");
                editor.fire("change");
                editor.fire("wcms-iframe-updated");
                api.close();
            },
        });
    };

    const setup = (editor: any) =>
    {
        // 🟢 1) 追蹤滑鼠位置（相對於視窗座標）
        let lastPos = { x: 0, y: 0 };
        editor.on("MouseMove", (e: any) =>
        {
            // TinyMCE 事件有 clientX/clientY
            if (typeof e?.clientX === "number" && typeof e?.clientY === "number")
            {
                lastPos = { x: e.clientX, y: e.clientY };
            }
        });

        // 🟢 2) 透過座標找目前滑鼠下的 iframe
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

        // 🟢 3) 自訂右鍵選單項目
        editor.ui.registry.addMenuItem("iframeedit", {
            text: "編輯 iFrame",
            onAction: () =>
            {
                const node = getIframeAtPoint();
                if (node) openDialog(editor, node);
            },
        });

        // 🟢 4) 只有在滑鼠正壓在 iframe 上時才顯示選單
        editor.ui.registry.addContextMenu("wcms-iframe-menu", {
            update: () => (getIframeAtPoint() ? ["iframeedit"] : []),
        });

        // 🟢 5) 雙擊也能開（同樣用座標判斷）
        editor.on("DblClick", () =>
        {
            const node = getIframeAtPoint();
            if (node) openDialog(editor, node);
        });
    };

    return { setup };
};
