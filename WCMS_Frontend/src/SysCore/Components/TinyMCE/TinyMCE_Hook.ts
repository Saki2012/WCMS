// src/hooks/TinyMCE_Hook.ts
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useCallback, useMemo, useRef } from "react";
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

export const useTinyMCE = (p: TinyMceHookOptions) =>
{
    const editorRef = useRef<TinyMCEEditor | null>(null);

    // 1) 掛上內容轉換（prefix 可自訂；不給就用預設）
    const { toDb, toEditor } = useContentTransform({
        previewPrefix: `${FileManagementAPI.PREVIEW_URL}`,
        attrName: "data-internalid",
    });
    const value = useMemo(() => toEditor(p.value ?? ""), [p.value, toEditor]);
    const onChange = useCallback(
        (editorHtml: string) =>
        {
            const dbHtml = toDb(editorHtml);
            p.onChange?.(dbHtml);
        },
        [p.onChange, toDb],
    );

    const uploadAndReturn = async (file: File) =>
    {
        const api = p.uploadFileApi ?? `${FileManagementAPI.UPLOAD_URL}`;
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(api, { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        // 後端請回傳 { internalId: "xxx", name: "filename.ext" }
        const json = await res.json();
        if (!json.IsSuccess) throw new Error("No internalId");
        return {
            internalId: json.Data[0],
            name: file.name,
        } as { internalId: string; name: string; };
    };

    const toUrl = (id: string, kind: "file" | "image") =>
        (p.makeFileUrl?.(id, { kind })) ?? `${FileManagementAPI.PREVIEW_URL}/${id}`;

    const pickLocalFile = (cb: (file: File) => void) =>
    {
        const input = document.createElement("input");
        input.type = "file";
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
                const width = (data.width || "100%").trim();
                const height = (data.height || "360").trim();
                const title = (data.title || "").trim();
                const url = (data.url || "").trim();
                if (!url)
                {
                    ed.windowManager.alert("請輸入 URL");
                    return;
                }
                const html = `<iframe src="${ed.dom.encode(url)}" title="${ed.dom.encode(title)}" width="${
                    ed.dom.encode(width)
                }" height="${
                    ed.dom.encode(height)
                }" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen style="max-width:100%;border:0;"></iframe>`;
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
                "copyformat applyformat removeformat | insertiframe | hr |",
                "togglePBlocks toggleDivBlocks |",
                "fullscreen code preview",
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
            file_picker_types: "file image",
            file_picker_callback: (callback: any, _value: any, meta: any) =>
            {
                pickLocalFile(async (file) =>
                {
                    try
                    {
                        const { internalId, name } = await uploadAndReturn(file);
                        if (meta.filetype === "file")
                        {
                            const href = toUrl(internalId, "file");
                            // 插入可下載連結 + data-internal
                            callback(href, { text: name ?? file.name, "data-internal": internalId });
                            // 直接把當前選取轉成 <a>
                            const ed = editorRef.current!;
                            const anchor = ed.dom.select("a[href=\"" + href + "\"]").pop();
                            if (anchor) ed.dom.setAttrib(anchor, "download", "");
                        } else if (meta.filetype === "image")
                        {
                            const src = toUrl(internalId, "image");
                            // 先用 100% RWD
                            callback(src, { alt: name ?? file.name, "class": "rwd-img", "data-internal": internalId });
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
                        const internal = elm.getAttribute("data-internal");
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
                        if (!img.getAttribute("data-internal")) return;
                        // 確保 src 與 internal 對應（避免被 TinyMCE 改寫）
                        const internalId = img.getAttribute("data-internal")!;
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
                                const { internalId, name } = await uploadAndReturn(file);
                                const href = toUrl(internalId, "file");
                                editor.insertContent(
                                    `<a href="${editor.dom.encode(href)}" data-internal="${
                                        editor.dom.encode(internalId)
                                    }" download>${editor.dom.encode(name ?? file.name)}</a>`,
                                );
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

    return { editorRef, init: editorInit, value: value, onChange: onChange, uploadAndReturn, toUrl };
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

const INTERNAL_ATTR = "data-internalid";

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
    };

    return { setup, transformForEditor, transformForDb } as const;
};
