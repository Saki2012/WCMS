import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { INTERNAL_ATTR } from "../../Core/tinyMceConstants";
import type { TinyMCEEditor, TinyMceUploadFile } from "../../Core/tinyMceTypes";

// #region Property
export type PickLocalFileOptions = { accept?: string; };

type TinyMceFileLinkMode = "download" | "preview";

type TinyMceFileLinkDialogData = {
    text?: string;
    title?: string;
    target?: string;
};

interface TinyMceFilePickerIds
{
    dropzoneId: string;
    inputId: string;
    buttonId: string;
    fileNameId: string;
}

interface TinyMceFilePickerElements
{
    dropzone: HTMLElement;
    input: HTMLInputElement;
    button: HTMLButtonElement;
    fileName: HTMLElement;
}

interface TinyMceFilePickerState
{
    file: File | null;
}
// #endregion

// #region Public
/** 開啟檔案連結插入視窗，統一處理上傳、文字、標題與下載/預覽模式。 */
export const openFileLinkDialog = (ed: TinyMCEEditor, uploadFile: TinyMceUploadFile) =>
{
    const token = Date.now().toString();
    const radioName = `wcms-file-link-mode-${token}`;
    const pickerIds = createFilePickerIds(token);
    const fileState: TinyMceFilePickerState = { file: null };

    const initialData: TinyMceFileLinkDialogData = {
        text: getSelectedText(ed),
        title: "",
        target: "",
    };

    const dialogApi = ed.windowManager.open({
        title: "上傳檔案並插入連結",
        size: "normal",
        body: {
            type: "panel",
            items: [
                { type: "htmlpanel", html: buildFilePickerHtml(pickerIds) },
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
        initialData: initialData,
        buttons: [
            { type: "cancel", text: "取消" },
            { type: "submit", text: "插入", primary: true },
        ],
        onSubmit: async (api) =>
        {
            const data = api.getData() as TinyMceFileLinkDialogData;
            const file = fileState.file;

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

                insertUploadedFileLink(
                    ed,
                    data,
                    result.internalId,
                    file,
                    mode,
                );

                api.unblock();
                api.close();
            } catch
            {
                api.unblock();
                ed.windowManager.alert("上傳失敗");
            }
        },
    });

    window.setTimeout(() =>
    {
        bindFilePickerEvents(pickerIds, (file) =>
        {
            fileState.file = file;

            updateSelectedFileName(pickerIds.fileNameId, file);

            const data = dialogApi.getData() as TinyMceFileLinkDialogData;
            dialogApi.setData(buildFallbackDialogData(data, file));
        });
    }, 0);
};

/** 建立本機檔案選擇器，供圖片與既有 PDF 功能共用。 */
export const pickLocalFile = (
    cb: (file: File) => void,
    opt?: PickLocalFileOptions,
) =>
{
    const input = document.createElement("input");

    input.type = "file";

    if (opt?.accept)
    {
        input.accept = opt.accept;
    }

    input.onchange = () =>
    {
        const file = input.files?.[0];

        if (file)
        {
            cb(file);
        }
    };

    input.click();
};

/** 將檔案連結套用到目前選取內容，並同步 WCMS internalId。 */
export const applyFileLinkToSelection = (
    ed: TinyMCEEditor,
    opts: {
        href: string;
        text?: string;
        title?: string;
        internalId?: string;
        download?: boolean;
        target?: string;
        targetBlank?: boolean;
    },
) =>
{
    const {
        href,
        text,
        title,
        internalId,
        download,
        targetBlank,
    } = opts;

    const target = opts.target ?? (targetBlank ? "_blank" : "");
    const selection = ed.selection;

    if (!selection)
    {
        return;
    }

    const setAttrs = (anchor: HTMLElement) =>
    {
        ed.dom.setAttrib(anchor, "href", href);
        ed.dom.setAttrib(anchor, "title", title ?? "");
        ed.dom.setAttrib(anchor, "target", target || null);
        ed.dom.setAttrib(anchor, "rel", target === "_blank" ? "noopener" : null);
        ed.dom.setAttrib(anchor, "download", download ? "" : null);

        if (internalId)
        {
            ed.dom.setAttrib(anchor, INTERNAL_ATTR, internalId);
        }

        if (text?.trim())
        {
            anchor.textContent = text.trim();
        }
    };

    if (selection.isCollapsed())
    {
        const linkText = text?.trim()
            || title
            || href.split("/").pop()
            || "download";

        const anchor = ed.dom.create("a", {}) as HTMLElement;

        anchor.textContent = linkText;
        setAttrs(anchor);

        ed.insertContent(anchor.outerHTML);
        ed.nodeChanged();

        return;
    }

    const start = selection.getStart();
    const existing = ed.dom.getParent(start, "a");

    if (existing)
    {
        setAttrs(existing as HTMLElement);
        ed.nodeChanged();

        return;
    }

    ed.execCommand(
        "mceInsertLink",
        false,
        {
            href,
            title: title ?? "",
        },
    );

    const wrapped = ed.dom.getParent(
        ed.selection.getStart(),
        "a",
    );

    if (wrapped)
    {
        setAttrs(wrapped as HTMLElement);
    }

    ed.nodeChanged();
};

/** 下載連結使用 TinyMCE 原生編輯視窗時，暫時隱藏 Target 選項。 */
export const registerDownloadLinkTargetFieldBehavior = (
    ed: TinyMCEEditor,
) =>
{
    ed.on("BeforeExecCommand", (event) =>
    {
        const isLinkCommand = event.command.toLowerCase() === "mcelink";

        if (!isLinkCommand || !isDownloadLinkSelected(ed))
        {
            return;
        }

        const targetList = ed.options.get<
            boolean | Array<Record<string, unknown>>
        >("link_target_list");

        if (targetList === false)
        {
            return;
        }

        const isUpdated = ed.options.set(
            "link_target_list",
            false,
        );

        if (!isUpdated)
        {
            return;
        }

        // TinyMCE 建立 Dialog 後立即還原，
        // 避免影響一般連結的 Target 選項。
        ed.once("OpenWindow", () =>
        {
            ed.options.set(
                "link_target_list",
                targetList,
            );
        });
    });
};
// #endregion

// #region Private

/** 產生本次 Dialog 專用的檔案選擇器元素 ID。 */
const createFilePickerIds = (
    token: string,
): TinyMceFilePickerIds =>
{
    return {
        dropzoneId: `wcms-file-dropzone-${token}`,
        inputId: `wcms-file-input-${token}`,
        buttonId: `wcms-file-button-${token}`,
        fileNameId: `wcms-file-name-${token}`,
    };
};

/** 建立 WCMS 自有檔案選擇區，避免使用 TinyMCE 圖片 DropZone 文案。 */
const buildFilePickerHtml = (
    ids: TinyMceFilePickerIds,
): string =>
{
    return `<fieldset class="tox-form__group">`
        + `<legend>檔案</legend>`
        + `<div class="tox-dropzone" id="${ids.dropzoneId}">`
        + `<p>拖曳檔案至此</p>`
        + `<p>或</p>`
        + `<button`
        + ` type="button"`
        + ` class="tox-button tox-button--secondary"`
        + ` id="${ids.buttonId}"`
        + `>瀏覽檔案</button>`
        + `<p`
        + ` id="${ids.fileNameId}"`
        + ` role="status"`
        + ` aria-live="polite"`
        + `></p>`
        + `<input`
        + ` type="file"`
        + ` id="${ids.inputId}"`
        + ` hidden`
        + `>`
        + `</div>`
        + `</fieldset>`;
};

/** 綁定瀏覽檔案、檔案變更與拖曳上傳事件。 */
const bindFilePickerEvents = (
    ids: TinyMceFilePickerIds,
    onFileSelected: (file: File) => void,
) =>
{
    const elements = getFilePickerElements(ids);

    if (!elements)
    {
        return;
    }

    const selectFile = (file?: File) =>
    {
        if (file)
        {
            onFileSelected(file);
        }
    };

    elements.button.addEventListener(
        "click",
        () => elements.input.click(),
    );

    elements.input.addEventListener("change", () =>
    {
        selectFile(elements.input.files?.[0]);
    });

    elements.dropzone.addEventListener("dragover", (event) =>
    {
        event.preventDefault();

        if (event.dataTransfer)
        {
            event.dataTransfer.dropEffect = "copy";
        }
    });

    elements.dropzone.addEventListener("drop", (event) =>
    {
        event.preventDefault();
        selectFile(event.dataTransfer?.files?.[0]);
    });
};

/** 取得目前 Dialog 中檔案選擇器所需的 DOM 元素。 */
const getFilePickerElements = (
    ids: TinyMceFilePickerIds,
): TinyMceFilePickerElements | null =>
{
    const dropzone = document.getElementById(ids.dropzoneId);
    const input = document.getElementById(ids.inputId);
    const button = document.getElementById(ids.buttonId);
    const fileName = document.getElementById(ids.fileNameId);

    if (!(dropzone instanceof HTMLElement))
    {
        return null;
    }

    if (!(input instanceof HTMLInputElement))
    {
        return null;
    }

    if (!(button instanceof HTMLButtonElement))
    {
        return null;
    }

    if (!(fileName instanceof HTMLElement))
    {
        return null;
    }

    return {
        dropzone,
        input,
        button,
        fileName,
    };
};

/** 顯示目前已選擇的實體檔案名稱。 */
const updateSelectedFileName = (
    fileNameId: string,
    file: File,
) =>
{
    const element = document.getElementById(fileNameId);

    if (!element)
    {
        return;
    }

    element.textContent = `已選擇：${file.name}`;
};

/** 取得目前選取文字；使用者已選字時優先保留，不強制覆蓋成檔名。 */
const getSelectedText = (
    ed: TinyMCEEditor,
): string =>
{
    return ed.selection
        .getContent({ format: "text" })
        .trim();
};

/** 檔案選取後，以不含副檔名的檔名補上文字與標題預設值。 */
const buildFallbackDialogData = (
    data: TinyMceFileLinkDialogData,
    file: File,
): TinyMceFileLinkDialogData =>
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
const buildFileLinkModeHtml = (
    radioName: string,
): string =>
{
    return `<fieldset class="tox-form__group">`
        + `<legend>連結模式</legend>`
        + `<label>`
        + `<input`
        + ` type="radio"`
        + ` name="${radioName}"`
        + ` value="download"`
        + ` checked`
        + `> 下載`
        + `</label>`
        + `　`
        + `<label>`
        + `<input`
        + ` type="radio"`
        + ` name="${radioName}"`
        + ` value="preview"`
        + `> 預覽`
        + `</label>`
        + `</fieldset>`;
};

/** 取得目前 Radio 選擇；無法取得時仍以下載為安全預設。 */
const getSelectedFileLinkMode = (
    radioName: string,
): TinyMceFileLinkMode =>
{
    const selector = `input[name="${radioName}"]:checked`;

    const selected = document.querySelector<HTMLInputElement>(
        selector,
    );

    return selected?.value === "preview"
        ? "preview"
        : "download";
};

/** 移除最後一段副檔名，保留使用者原始檔名作為顯示 fallback。 */
const removeFileExtension = (
    fileName: string,
): string =>
{
    return fileName.replace(/\.[^.]+$/, "")
        || fileName;
};

/** 判斷目前 TinyMCE 所選連結是否為下載連結。 */
const isDownloadLinkSelected = (
    ed: TinyMCEEditor,
): boolean =>
{
    const node = ed.selection.getNode();

    const anchor = node.nodeName.toLowerCase() === "a"
        ? node
        : ed.dom.getParent(node, "a");

    return Boolean(anchor?.hasAttribute("download"));
};
// #endregion
