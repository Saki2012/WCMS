import {
    AAInputFieldItem,
    buildAdapterBaseId,
    buildFieldId,
    type AAFileValue,
    type AAInputValue,
} from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms";
import { LibAttachment } from "@/SysCore/Utils/Library/LibData";
import { useUploadFile } from "@/SysCore/Utils/UI_HookFunc/useUploadFile";
import { useId, useState } from "react";
import type { KeyboardEvent } from "react";

// #region Property
interface LibFileInputProps
{
    ColumnDisplayName?: string;
    DefaultInputDisplay?: string;

    /** 上方：FileName（可編輯） */
    InputValue: string;

    /** 下方：顯示 internalId（唯讀） */
    FileName?: string;
    FileInternalId?: string;

    Accept?: string;
    disabled?: boolean;

    /** 檔案數量上限，預設 1。 */
    maxFileCount?: number;

    /** 單檔大小上限，單位 MB，預設 10。 */
    maxFileSizeMB?: number;

    onFileUploaded?: (internalId: string, originalName?: string) => void;
    onNameChange?: (name: string) => void;
    onDelete?: () => void;

    /** 可選：讓這顆元件直接吃專案原本的 label/input 欄寬 */
    LabelColClassName?: string;
    InputColClassName?: string;
    RowClassName?: string;
}
// #endregion

// #region Public
/** 檔案名稱與附件上傳欄位，input 本體統一改用 AAInputFieldItem。 */
export const LibFileInput = (props: LibFileInputProps) =>
{
    const reactId = useId();
    const baseId = buildAdapterBaseId(reactId);
    const nameFieldKey = "fileName";
    const uploadFieldKey = "fileUpload";
    const displayFieldKey = "fileDisplay";
    const nameInputId = buildFieldId(baseId, nameFieldKey);
    const { result, handleFileChange } = useUploadFile({ enablePreview: false });
    const [uploadResetKey, setUploadResetKey] = useState(0);
    const displayText = buildDisplayText(props.FileName, props.InputValue, props.FileInternalId);
    const canDownload = !!props.FileInternalId;
    const rowClass = props.RowClassName ?? "row mb-3";
    const labelCol = props.LabelColClassName ?? "col-sm-2";
    const inputCol = props.InputColClassName ?? "col-sm-10";

    /** 下載附件，使用後端 Server_Download。 */
    const openDownload = () =>
    {
        if (!props.FileInternalId) return;
        if (typeof window === "undefined") return;

        const url = `/Service/FileManagement/Server_Download/${encodeURIComponent(props.FileInternalId)}`;
        window.open(url, "_blank", "noopener");
    };

    /** 清除目前這一組檔名、檔案與外部資料。 */
    const clearCurrentInput = () =>
    {
        setUploadResetKey(value => value + 1);
        props.onNameChange?.("");
        props.onDelete?.();
    };

    /** 執行檔案上傳，重新選檔時同步更新檔名欄位與 readonly internalId。 */
    const uploadFiles = (files: File[]) =>
    {
        if (files.length === 0)
        {
            clearCurrentInput();
            return;
        }

        handleFileChange(files, (internalId, originalName) =>
        {
            const displayName = buildUploadedDisplayName(originalName, files[0]);
            props.onFileUploaded?.(internalId, originalName);
            props.onNameChange?.(displayName);
        });
    };

    /** 處理檔名輸入變更。 */
    const handleNameChange = (_fieldKey: string, value: AAInputValue) =>
    {
        props.onNameChange?.(String(value ?? ""));
    };

    /** 處理 AA 檔案欄位變更；清除檔案時也要清掉整組 input。 */
    const handleFileChangeByAA = (_fieldKey: string, value: AAInputValue) =>
    {
        const files = getFilesFromAAValue(value);

        if (files.length === 0)
        {
            clearCurrentInput();
            return;
        }

        uploadFiles(files);
    };

    /** 處理下載顯示欄位鍵盤操作。 */
    const handleDisplayKeyDown = (_fieldKey: string, event: KeyboardEvent<HTMLInputElement>) =>
    {
        if (!canDownload) return;
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        openDownload();
    };

    return (
        <div className={rowClass}>
            <div className={labelCol}>
                {props.ColumnDisplayName && <label htmlFor={nameInputId} className="col-form-label">{props.ColumnDisplayName}</label>}
            </div>

            <div className={inputCol}>
                <div className="position-relative" aria-label="附件上傳區，可選擇檔案或拖曳檔案上傳">
                    <div className="input-group">
                        <AAInputFieldItem
                            baseId={baseId}
                            variant="gridCell"
                            className="flex-grow-1"
                            field={{
                                key: nameFieldKey,
                                type: "text",
                                label: props.ColumnDisplayName ?? "檔名",
                                aaLabel: "請輸入檔名",
                                value: props.InputValue ?? "",
                                placeholder: props.DefaultInputDisplay ?? "請輸入檔名...",
                                disabled: props.disabled,
                                helpText: "檔名欄位",
                            }}
                            onChange={handleNameChange}
                        />
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={clearCurrentInput}
                            aria-label="移除此附件"
                            disabled={props.disabled}
                        >
                            ×
                        </button>
                    </div>

                    <div className="mt-2">
                        <AAInputFieldItem
                            key={`file-upload-${uploadResetKey}`}
                            baseId={baseId}
                            variant="gridCell"
                            field={{
                                key: uploadFieldKey,
                                type: "file",
                                label: "選擇檔案",
                                aaLabel: "選擇檔案並上傳",
                                value: [],
                                accept: props.Accept,
                                multiple: false,
                                maxFileCount: props.maxFileCount ?? 1,
                                maxFileSizeMB: props.maxFileSizeMB ?? 10,
                                disabled: props.disabled,
                                helpText: "可選擇檔案或拖曳檔案上傳",
                            }}
                            onChange={handleFileChangeByAA}
                        />
                    </div>

                    <div
                        className="mt-2"
                        onClick={() => canDownload && openDownload()}
                        style={{ cursor: canDownload ? "pointer" : "not-allowed" }}
                    >
                        <AAInputFieldItem
                            baseId={baseId}
                            variant="gridCell"
                            field={{
                                key: displayFieldKey,
                                type: "readonly",
                                label: "附件下載",
                                aaLabel: canDownload ? `下載檔案：${displayText}` : "尚未上傳，無可下載檔案",
                                value: displayText,
                                readOnly: true,
                                disabled: false,
                                helpText: "附件顯示欄位",
                            }}
                            onChange={() => undefined}
                            onKeyDown={handleDisplayKeyDown}
                        />
                    </div>
                </div>

                {result.uploading && <div className="form-text mt-1" aria-live="polite">上傳中…</div>}

                {!!result.error && <div className="text-danger mt-1" role="alert">上傳失敗：{result.error}</div>}
            </div>
        </div>
    );
};
// #endregion

// #region Private
/** 建立附件顯示文字。 */
const buildDisplayText = (
    fileName?: string,
    inputValue?: string,
    fileInternalId?: string,
): string =>
{
    const name = (fileName ?? inputValue ?? "").trim();
    const id = (fileInternalId ?? "").trim();

    if (!name && !id) return "未上傳";
    if (name && id) return `${name} (${id})`;

    return name || id || "未上傳";
};

/** 建立上傳後要同步到檔名輸入框的顯示名稱。 */
const buildUploadedDisplayName = (originalName?: string, file?: File): string =>
{
    const source = originalName || file;
    return LibAttachment.getDisplayFileNameWithoutExtension(source).trim();
};

/** 判斷是否為 AA 檔案值。 */
const isAAFileValue = (value: unknown): value is AAFileValue =>
{
    if (!value || typeof value !== "object") return false;

    const fileValue = value as AAFileValue;
    return typeof fileValue.name === "string";
};

/** 將 AAInputValue 轉回 useUploadFile 使用的 File[]。 */
const getFilesFromAAValue = (value: AAInputValue): File[] =>
{
    if (!Array.isArray(value)) return [];

    return value
        .filter(isAAFileValue)
        .map(item => item.file)
        .filter((file): file is File => !!file);
};
// #endregion
