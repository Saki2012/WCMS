import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { INTERNAL_ATTR } from "../../Core/tinyMceConstants";
import type { TinyMCEEditor, TinyMceUploadFile } from "../../Core/tinyMceTypes";

// #region Property
export type PickLocalFileOptions = { accept?: string; };
type TinyMceFileLinkMode = "download" | "preview";
type TinyMceFileLinkDialogData = {
    files?: File[];
    text?: string;
    title?: string;
    target?: string;
};
// #endregion

// #region Public
/** 開啟檔案連結插入視窗，統一處理上傳、文字、標題與下載/預覽模式。 */
export const openFileLinkDialog = (ed: TinyMCEEditor, uploadFile: TinyMceUploadFile) =>
{
    const radioName = `wcms-file-link-mode-${Date.now()}`;

    ed.windowManager.open({
        title: "上傳檔案並插入連結",
        size: "normal",
        body: {
            type: "panel",
            items: [
                { type: "dropzone", name: "files", label: "檔案" },
                { type: "input", name: "text", label: "顯示文字" },
                { type: "input", name: "title", label: "標題" },
                {
                    type: "selectbox",
                    name: "target",
                    label: "開啟連結於...",
                    items: [
                        { text: "預設", value: "" },
                        { text: "目前視窗", value: "_self" },
                        { text: "新視窗", value: "_blank" },
                    ],
                },
                { type: "htmlpanel", html: buildFileLinkModeHtml(radioName) },
            ],
        },
        initialData: { files: [], text: getSelectedText(ed), title: "", target: "" },
        buttons: [{ type: "cancel", text: "取消" }, { type: "submit", text: "插入", primary: true }],
        onChange: (api, details) =>
        {
            if (details.name !== "files") return;
            const data = api.getData() as TinyMceFileLinkDialogData;
            const file = data.files?.[0];
            if (!file) return;
            api.setData(buildFallbackDialogData(data, file));
        },
        onSubmit: async (api) =>
        {
            const data = api.getData() as TinyMceFileLinkDialogData;
            const file = data.files?.[0];
            if (!file)
            {
                ed.windowManager.alert("請選擇要上傳的檔案");
                return;
            }

            api.block("檔案上傳中...");
            try
            {
                const result = await uploadFile(file);
                if (!result.isSuccess)
                {
                    api.unblock();
                    return;
                }

                const mode = getSelectedFileLinkMode(radioName);
                insertUploadedFileLink(ed, data, result.internalId, file, mode);
                api.unblock();
                api.close();
            } catch
            {
                api.unblock();
                ed.windowManager.alert("上傳失敗");
            }
        },
    });
};

/** 建立本機檔案選擇器，供圖片與既有 PDF 功能共用。 */
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

/** 將檔案連結套用到目前選取內容，並同步 WCMS internalId。 */
export const applyFileLinkToSelection = (
    ed: TinyMCEEditor,
    opts: { href: string; text?: string; title?: string; internalId?: string; download?: boolean; target?: string; targetBlank?: boolean; },
) =>
{
    const { href, text, title, internalId, download, targetBlank } = opts;
    const target = opts.target ?? (targetBlank ? "_blank" : "");
    const sel = ed.selection;
    if (!sel) return;

    const setAttrs = (a: HTMLElement) =>
    {
        ed.dom.setAttrib(a, "href", href);
        ed.dom.setAttrib(a, "title", title ?? "");
        ed.dom.setAttrib(a, "target", target || null);
        ed.dom.setAttrib(a, "rel", target === "_blank" ? "noopener" : null);
        ed.dom.setAttrib(a, "download", download ? "" : null);
        if (internalId) ed.dom.setAttrib(a, INTERNAL_ATTR, internalId);
        if (text?.trim()) a.textContent = text.trim();
    };

    if (sel.isCollapsed())
    {
        const linkText = text?.trim() || title || href.split("/").pop() || "download";
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

export const registerDownloadLinkTargetFieldBehavior = (ed: TinyMCEEditor) =>
{
    ed.on("BeforeExecCommand", (event) =>
    {
        if (event.command.toLowerCase() !== "mcelink" || !isDownloadLinkSelected(ed)) return;

        const targetList = ed.options.get<boolean | Array<Record<string, unknown>>>("link_target_list");
        if (targetList === false) return;

        const isUpdated = ed.options.set("link_target_list", false);
        if (!isUpdated) return;

        // TinyMCE 會在非同步收集連結資料後才建立對話框；建立完成後立即還原，
        // 讓一般連結仍保有「開啟連結於」選項。
        ed.once("OpenWindow", () =>
        {
            ed.options.set("link_target_list", targetList);
        });
    });
};
// #endregion

// #region Private
/** 取得目前選取文字；使用者已選字時優先保留，不強制覆蓋成檔名。 */
const getSelectedText = (ed: TinyMCEEditor): string =>
{
    return ed.selection.getContent({ format: "text" }).trim();
};

/** 檔案選取後，以不含副檔名的檔名補上文字與標題預設值。 */
const buildFallbackDialogData = (data: TinyMceFileLinkDialogData, file: File): TinyMceFileLinkDialogData =>
{
    const fallbackName = removeFileExtension(file.name);
    return {
        ...data,
        text: data.text?.trim() || fallbackName,
        title: data.title?.trim() || fallbackName,
    };
};

/** 依下載/預覽模式產生公開網址並插入連結。 */
const insertUploadedFileLink = (
    ed: TinyMCEEditor,
    data: TinyMceFileLinkDialogData,
    internalId: string,
    file: File,
    mode: TinyMceFileLinkMode,
) =>
{
    const fallbackName = removeFileExtension(file.name);
    const href = mode === "preview"
        ? FileManagementAPI.get_Public_Preview_Url(internalId)
        : FileManagementAPI.get_Public_Download_Url(internalId);

    applyFileLinkToSelection(ed, {
        href,
        text: data.text?.trim() || fallbackName,
        title: data.title?.trim() || fallbackName,
        internalId,
        download: mode === "download",
        target: data.target ?? "",
    });
};

/** 建立下載/預覽 Radio；使用 fieldset/legend 保留群組語意與鍵盤操作。 */
const buildFileLinkModeHtml = (radioName: string): string =>
{
    return `<fieldset class="tox-form__group">`
        + `<legend>連結模式</legend>`
        + `<label><input type="radio" name="${radioName}" value="download" checked> 下載</label>`
        + `　`
        + `<label><input type="radio" name="${radioName}" value="preview"> 預覽</label>`
        + `</fieldset>`;
};

/** 取得目前 Radio 選擇；無法取得時仍以下載為安全預設。 */
const getSelectedFileLinkMode = (radioName: string): TinyMceFileLinkMode =>
{
    const selected = document.querySelector<HTMLInputElement>(`input[name="${radioName}"]:checked`);
    return selected?.value === "preview" ? "preview" : "download";
};

/** 移除最後一段副檔名，保留使用者原始檔名作為顯示 fallback。 */
const removeFileExtension = (fileName: string): string =>
{
    return fileName.replace(/\.[^.]+$/, "") || fileName;
};

const isDownloadLinkSelected = (ed: TinyMCEEditor): boolean =>
{
    const node = ed.selection.getNode();
    const anchor = node.nodeName.toLowerCase() === "a" ? node : ed.dom.getParent(node, "a");
    return Boolean(anchor?.hasAttribute("download"));
};
// #endregion