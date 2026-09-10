// src/hooks/TinyMCE_Hook.ts
import pdfIconUrl from "@/Features/Assets/Server/fonts/fontawesome-5.15.4/svgs/regular/file-pdf.svg?url";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { CMS_HTML_VIEWER_ATTR, CMS_HTML_VIEWER_PDF } from "@/SysCore/Components/CmsHtml/CmsHtml_Types";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { PGID } from "@/types/SchemaFields";
import { useCallback, useMemo, useRef } from "react";
import { INTERNAL_ATTR } from "./Core/tinyMceConstants";
import type { TinyMCEEditor } from "./Core/tinyMceTypes";
import { useContentTransform } from "./Core/useContentTransform";
import { applyFileLinkToSelection, openFileLinkDialog, pickLocalFile, registerDownloadLinkTargetFieldBehavior } from "./Features/File/tinyMceFileFeature";
import { registerTinyMceFormatControls } from "./Features/Format/tinyMceFormatFeature";
import { registerTinyMceParagraphIndentFeature } from "./Features/Format/tinyMceParagraphIndentFeature";
import { openInsertIframeDialog } from "./Features/Iframe/tinyMceIframeFeature";
import { WCMS_TINYMCE_IFRAME_SANDBOX_EXCLUSIONS } from "./Features/Iframe/tinyMceIframeUtils";
import { registerInternalImageSync } from "./Features/Image/tinyMceImageFeature";
import { normalizeListHtmlBeforeSave } from "./Features/List/tinyMceListNormalize";
import { fromTinyMcePdfEditorHtml, toTinyMcePdfEditorHtml } from "./Features/Pdf/tinyMcePdfFeature";
import { openFormattedSourceCodeDialog } from "./Features/Source/tinyMceSourceFeature";
import { registerTinyMceTableFeature } from "./Features/Table/tinyMceTableFeature";
import { normalizePastedTableElement, normalizeTableHtmlBeforeSave, normalizeTableHtmlForEditor } from "./Features/Table/tinyMceTableUtils";

// #region Property
type TinyMceInitExtras = Record<string, unknown> & { setup?: (editor: TinyMCEEditor) => void; };
type TinyMceFilePickerCallback = (url: string, meta?: Record<string, unknown>) => void;
type TinyMceFilePickerMeta = { filetype?: "file" | "image" | string; };
type TinyMceContentEvent = { content: string; };
type TinyMceUploadResult = { isSuccess: boolean; internalId: string; name: string; };
type TinyMceToastPublish = ReturnType<typeof useToast>["publish"];

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
    languageUrl?: string;
    language?: string;
    baseUrl?: string;
    initExtras?: TinyMceInitExtras;
}
// #endregion

// #region Public
export { INTERNAL_ATTR } from "./Core/tinyMceConstants";
export { useTinyMceIframeEdit } from "./Features/Iframe/tinyMceIframeFeature";
export { useTinyMceInternalImage } from "./Features/Image/tinyMceImageFeature";

export const useTinyMCE = (p: TinyMceHookOptions) =>
{
    const editorRef = useRef<TinyMCEEditor | null>(null);
    const { publish } = useToast();
    const { toDb, toEditor } = useContentTransform({
        previewPrefix: `/Service/${PGID.FileManagement}/Public_Preview`,
        attrName: INTERNAL_ATTR,
    });

    const uploadAndReturn = useCallback((file: File) =>
    {
        return uploadTinyMceFile(file, p.uploadFileApi ?? FileManagementAPI.Server_UploadTemp, publish);
    }, [p.uploadFileApi, publish]);

    const toUrl = useCallback((id: string, kind: "file" | "image") =>
    {
        return resolveTinyMceFileUrl(id, kind, p.makeFileUrl);
    }, [p.makeFileUrl]);

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
            ],
            sandbox_iframes_exclusions: [...WCMS_TINYMCE_IFRAME_SANDBOX_EXCLUSIONS],
            toolbar: [
                "undo redo | blocks fontfamily fontsize |",
                "bold italic underline strikethrough forecolor backcolor superscript subscript|",
                "alignleft aligncenter alignright alignjustify |",
                "bullist numlist outdent indent |",
                "link unlink | image filepicker |",
                "table |",
                "copyformat applyformat removeformat firstlineindent hangingindent | insertiframe insertpdfiframe | wcmsHr |",
                "togglePBlocks toggleDivBlocks |",
                "fullscreen code",
            ].join(" "),
            contextmenu: "link image table",
            link_target_list: [
                { text: "Default", value: "" },
                { text: "Current window", value: "_self" },
                { text: "New window", value: "_blank" },
            ],
            visualblocks_default_state: true,
            toolbar_mode: "wrap",
            font_size_formats: "8=8px 9=9px 10=10px 11=11px 12=12px 14=14px 16=16px 18=18px 20=20px 24=24px 28=28px 32=32px 36=36px 48=48px 72=72px",
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
            valid_styles: {
                table: "border-color,border-top-color,border-right-color,border-bottom-color,border-left-color",
                td: "background-color,border-color,border-top-color,border-right-color,border-bottom-color,border-left-color",
                th: "background-color,border-color,border-top-color,border-right-color,border-bottom-color,border-left-color",
                "*": "color,font-size,font-family,background-color,text-decoration,font-style,font-weight,line-height,vertical-align,"
                    + "border,border-top,border-right,border-bottom,border-left,border-color,border-top-color,border-right-color,border-bottom-color,border-left-color,text-align,width,height,"
                    + "min-width,max-width,min-height,max-height,margin-left,padding-left,list-style-type,list-style-position",
            },
            table_advtab: true,
            table_cell_advtab: true,
            table_toolbar: "tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | "
                + "tableinsertcolbefore tableinsertcolafter tabledeletecol | mergecells",
            skin_url: `${baseUrl}/skins/ui/oxide`,
            content_css: [`${baseUrl}/skins/content/default/content.css`, `${baseUrl}/cms_content_format.css`],
            icons_url: `${baseUrl}/icons/default/icons.js`,
            language: p.language ?? "zh_TW",
            language_url: p.languageUrl ?? "/tinymce-i18n/langs5/zh_TW.js",
            file_picker_types: "image",
            file_picker_callback: (callback: TinyMceFilePickerCallback, _value: string, meta: TinyMceFilePickerMeta) =>
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
                            const ed = editorRef.current;
                            if (!ed) return;
                            applyFileLinkToSelection(ed, {
                                href,
                                title: name ?? file.name,
                                internalId,
                                download: true,
                            });
                            const anchor = ed.dom.select(`a[href="${href}"]`).pop();
                            if (anchor) ed.dom.setAttrib(anchor, "download", "");
                        } else if (meta.filetype === "image")
                        {
                            const src = toUrl(internalId, "image");
                            callback(src, { alt: name ?? file.name, "class": "rwd-img", [INTERNAL_ATTR]: internalId });
                        }
                    } catch
                    {
                        alert("上傳失敗");
                    }
                });
            },
            setup: (editor: TinyMCEEditor) =>
            {
                editorRef.current = editor;

                if (p.initExtras && typeof p.initExtras.setup === "function")
                {
                    p.initExtras.setup(editor);
                }

                editor.addCommand("mceCodeEditor", () =>
                {
                    openFormattedSourceCodeDialog(editor);
                });

                editor.on("BeforeSetContent", (e: TinyMceContentEvent) =>
                {
                    if (typeof e.content === "string") e.content = toTinyMcePdfEditorHtml(normalizeTableHtmlForEditor(toEditor(e.content)), pdfIconUrl);
                });
                editor.on("GetContent", (e: TinyMceContentEvent) =>
                {
                    if (typeof e.content === "string")
                    {
                        const canonicalHtml = fromTinyMcePdfEditorHtml(e.content);
                        e.content = toDb(normalizeListHtmlBeforeSave(normalizeTableHtmlBeforeSave(canonicalHtml)));
                    }
                });

                registerTinyMceTableFeature(editor);
                registerTinyMceFormatControls(editor);
                registerTinyMceParagraphIndentFeature(editor);
                registerDownloadLinkTargetFieldBehavior(editor);
                registerInternalImageSync(editor, (internalId) => toUrl(internalId, "image"));

                editor.ui.registry.addButton("insertiframe", {
                    icon: "embed",
                    tooltip: "插入 IFrame（YouTube / Google Map）",
                    onAction: () => openInsertIframeDialog(editor),
                });
                editor.ui.registry.addButton("insertpdfiframe", {
                    icon: "export-pdf",
                    tooltip: "上傳 PDF 並插入 iFrame",
                    onAction: () =>
                    {
                        pickLocalFile(async (file) =>
                        {
                            if (!/\.pdf$/i.test(file.name))
                            {
                                alert("請選擇 PDF 檔案");
                                return;
                            }

                            try
                            {
                                const { isSuccess, internalId, name } = await uploadAndReturn(file);
                                if (!isSuccess) return;

                                const src = FileManagementAPI.get_Public_Preview_Url(internalId);
                                const title = (name ?? file.name).replace(/\.[^.]+$/, "");
                                const attrName = INTERNAL_ATTR;

                                const html = `<p>`
                                    + `<iframe`
                                    + ` title="${editor.dom.encode(title)}"`
                                    + ` width="100%"`
                                    + ` height="1000"`
                                    + ` loading="lazy"`
                                    + ` referrerpolicy="strict-origin-when-cross-origin"`
                                    + ` frameborder="0"`
                                    + ` allowfullscreen`
                                    + ` ${CMS_HTML_VIEWER_ATTR}="${CMS_HTML_VIEWER_PDF}"`
                                    + ` src="${editor.dom.encode(src)}"`
                                    + ` ${attrName}="${editor.dom.encode(internalId)}"`
                                    + `></iframe>`
                                    + `</p>`;

                                editor.insertContent(toTinyMcePdfEditorHtml(html, pdfIconUrl));
                                editor.nodeChanged();
                            } catch
                            {
                                alert("上傳失敗");
                            }
                        }, { accept: "application/pdf" });
                    },
                });

                editor.ui.registry.addButton("wcmsHr", { text: "HR", tooltip: "插入水平線", onAction: () => editor.insertContent("<hr />") });
                editor.ui.registry.addButton("filepicker", {
                    icon: "new-document",
                    tooltip: "上傳檔案並插入連結",
                    onAction: () => openFileLinkDialog(editor, uploadAndReturn),
                });
                editor.on("ExecCommand", (cmd) =>
                {
                    if (cmd.command?.toLowerCase() === "mcelink")
                    {
                        const a = editor.dom.getParent(editor.selection.getNode(), "a");
                        if (a && !a.title && a.textContent) a.title = a.textContent;
                    }
                });
            },
            setup_onchange: true,
            init_instance_callback: (ed: TinyMCEEditor) =>
            {
                editorRef.current = ed;
            },
            paste_data_images: false,
            paste_merge_formats: true,
            paste_webkit_styles: "color font-size font-family background-color text-decoration font-style font-weight line-height",
            valid_elements: "*[*]",
            extended_valid_elements: undefined,
            invalid_elements: "script",
            paste_postprocess: (_plugin: unknown, args: { node: HTMLElement; }) =>
            {
                normalizePastedTableElement(args.node);
            },
            ...(p.initExtras ?? {}),
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [p.id, p.language, p.languageUrl, p.baseUrl, p.uploadFileApi, p.makeFileUrl, p.initExtras, toDb, toEditor]);

    return { editorRef, init: editorInit, value: p.value, onChange: p.onChange, uploadAndReturn, toUrl };
};
// #endregion

// #region Private
/** TinyMCE 上傳統一沿用 FileManagementAPI，避免 raw fetch 繞過共用 XSRF 流程。 */
const uploadTinyMceFile = async (file: File, uploadUrl: string, publish: TinyMceToastPublish): Promise<TinyMceUploadResult> =>
{
    const json = await FileManagementAPI.uploadTemp(file, uploadUrl);
    if (!json.IsSuccess)
    {
        json.SysMessage.forEach((msg) =>
        {
            if (msg.Status === MessageStatus.Error)
            {
                publish({ level: MessageStatus.Error, title: msg.MessageCode, text: msg.Message });
            }
        });
        return { isSuccess: false, internalId: "", name: file.name };
    }

    const internalId = json.Data?.[0] ?? "";
    if (!internalId) throw new Error("No internalId in upload response");
    return { isSuccess: true, internalId, name: file.name };
};

const resolveTinyMceFileUrl = (
    id: string,
    kind: "file" | "image",
    makeFileUrl?: TinyMceHookOptions["makeFileUrl"],
): string =>
{
    return makeFileUrl?.(id, { kind })
        ?? (kind === "image" ? FileManagementAPI.get_Public_Preview_Url(id) : FileManagementAPI.get_Public_Download_Url(id));
};
// #endregion