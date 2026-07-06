import { type ChangeEvent, type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import type { AAFileValue, AAInputField, FilePreviewItem, FileReadResult, FieldRenderContext } from "../AAInputField_Types";
import { FieldError } from "../AAInputField_Shell";
import { applyAAFocusStyle, clearAAFocusStyle, applyFileAAFocusStyle, clearFileAAFocusStyle } from "../AAInputField_Focus";
import { defaultAccept, getAriaRequired, getNativeRequired, sanitizeFileName, toFileArray } from "../AAInputField_Utils";
import { LibAttachment } from "@/SysCore/Utils/Library/LibData";

// #region Public
/**
 * 使用範例：
 * <AAInputFieldList fields={[{ key: "file", type: "file", label: "檔案", aaLabel: "請上傳檔案", accept: defaultAccept, maxFileCount: 1, maxFileSizeMB: 10, value: state.file }]} onChange={handleChange} />
 */

/** file 欄位，支援瀏覽檔案與拖曳檔案。 */
export const FileField = (props: { field: AAInputField; context: FieldRenderContext; }) =>
{
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localErrorText, setLocalErrorText] = useState("");
    const [localPreviewList, setLocalPreviewList] = useState<FilePreviewItem[]>([]);
    const valuePreviewList = useMemo(() => toFileArray(props.field.value).map(toExistingPreviewItem), [props.field.value]);
    const displayFileList = localPreviewList.length > 0 ? localPreviewList : valuePreviewList;
    const errorId = localErrorText ? `${props.context.fieldId}-file-error` : props.context.errorId;
    const describedBy = [props.context.describedBy, localErrorText ? errorId : ""].filter(Boolean).join(" ");
    const showFileNameAndImg = props.field.showFileNameAndImg ?? true;

    /** 元件卸載時釋放本機 blob 預覽網址。 */
    useEffect(() => () => revokePreviewUrls(localPreviewList), [localPreviewList]);

    /** 開啟瀏覽檔案視窗。 */
    const handleBrowseClick = () => inputRef.current?.click();

    /** 處理 input 選檔。 */
    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) =>
    {
        const result = readSafeFiles(event.target.files, props.field);
        applyFileResult(result, event.target);
    };

    /** 處理拖曳檔案進入虛框。 */
    const handleDragOver = (event: DragEvent<HTMLDivElement>) =>
    {
        event.preventDefault();
        if (!props.field.disabled) setIsDragging(true);
    };

    /** 處理拖曳檔案放開。 */
    const handleDrop = (event: DragEvent<HTMLDivElement>) =>
    {
        event.preventDefault();
        setIsDragging(false);
        if (props.field.disabled) return;
        applyFileResult(readSafeFiles(event.dataTransfer.files, props.field), inputRef.current);
    };

    /** 清除目前檔案欄位與預覽資料，讓外層 binding 可真正寫回空值。 */
    const handleClearClick = () =>
    {
        clearNativeFileInput(inputRef.current);
        revokePreviewUrls(localPreviewList);
        setLocalErrorText("");
        setLocalPreviewList([]);
        props.context.onChange(props.field.key, []);
    };

    /** 套用檔案驗證結果並通知外層表單，不合法檔案只顯示錯誤，不觸發原生 validity 捲動。 */
    const applyFileResult = (result: FileReadResult, input: HTMLInputElement | null) =>
    {
        revokePreviewUrls(localPreviewList);
        setLocalErrorText(result.errorText);
        setInputCustomValidity(input, result.errorText);

        if (result.errorText)
        {
            clearNativeFileInput(input);
            setLocalPreviewList([]);
            return;
        }

        setLocalPreviewList(result.fileList.map(toLocalPreviewItem));
        props.context.onChange(props.field.key, result.value);
    };

    return (
        <div className="form-group">
            <label htmlFor={props.context.fieldId} className="visually-hidden">{props.field.aaLabel ?? "請上傳檔案"}</label>
            <div id={props.context.hintId} className="form-text mb-2">{getFileLimitText(props.field)}</div>
            <div
                className={buildFileDropZoneClass(props.field, isDragging, localErrorText)}
                style={{ width: "100%", minHeight: 95, border: "1px dashed #777" }}
                role="group"
                aria-describedby={describedBy}
                aria-invalid={Boolean(props.field.errorText || localErrorText) || undefined}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    id={props.context.fieldId}
                    name={props.field.key}
                    type="file"
                    className="visually-hidden"
                    accept={props.field.accept ?? defaultAccept}
                    multiple={props.field.multiple}
                    disabled={props.field.disabled}
                    required={getNativeRequired(props.field)}
                    aria-required={getAriaRequired(props.field)}
                    aria-invalid={Boolean(props.field.errorText || localErrorText) || undefined}
                    aria-describedby={describedBy}
                    onChange={handleInputChange}
                    onFocus={applyFileAAFocusStyle}
                    onBlur={clearFileAAFocusStyle}
                />
                {displayFileList.length === 0
                    ? renderEmptyFileDropContent(props.field, handleBrowseClick)
                    : renderFilePreviewList(displayFileList, handleBrowseClick, handleClearClick, props.field.disabled, showFileNameAndImg)}
            </div>
            <div className="form-text mt-2">允許格式為{props.field.accept ?? defaultAccept}</div>
            {localErrorText && <div id={errorId} className="invalid-feedback d-block" role="alert" aria-live="polite">{localErrorText}</div>}
            <FieldError field={props.field} errorId={props.context.errorId} />
        </div>
    );
};
// #endregion

// #region Protected
/** 渲染未上傳時的虛框內容。 */
const renderEmptyFileDropContent = (field: AAInputField, onBrowseClick: () => void) =>
{
    return (
        <div className="d-flex flex-column align-items-center justify-content-center gap-2 py-3 text-center">
            <div className="d-flex align-items-center justify-content-center gap-3 fw-semibold text-dark">
                <i className="fas fa-cloud-upload" aria-hidden="true"></i>
                <span>選擇或拖曳檔案至此</span>
            </div>
            <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                disabled={field.disabled}
                onFocus={applyAAFocusStyle}
                onBlur={clearAAFocusStyle}
                onClick={onBrowseClick}
            >
                瀏覽檔案
            </button>
        </div>
    );
};


/** 渲染已選擇/已上傳檔案的預覽內容。 */
const renderFilePreviewList = (
    fileList: FilePreviewItem[],
    onBrowseClick: () => void,
    onClearClick: () => void,
    disabled?: boolean,
    showFileNameAndImg = true,
) =>
{
    return (
        <div className="d-flex flex-column align-items-center justify-content-center gap-2 py-3 text-center">
            {showFileNameAndImg && (
                <ul className="list-unstyled mb-0 w-100" aria-label="已上傳檔案">
                    {fileList.map((file) => <li key={file.key} className="mb-2">{renderFilePreviewItem(file)}</li>)}
                </ul>
            )}
            <div className="d-flex flex-wrap justify-content-center gap-2">
                <button type="button" className="btn btn-outline-primary btn-sm" disabled={disabled} onFocus={applyAAFocusStyle} onBlur={clearAAFocusStyle} onClick={onBrowseClick}>重新選擇檔案</button>
                <button type="button" className="btn btn-outline-danger btn-sm" disabled={disabled} onFocus={applyAAFocusStyle} onBlur={clearAAFocusStyle} onClick={onClearClick}>清除檔案</button>
            </div>
        </div>
    );
};


/** 渲染單一檔案預覽，圖片/影片會顯示媒體，其餘只顯示檔名。 */
const renderFilePreviewItem = (file: FilePreviewItem, showFileName = true) =>
{
    return (
        <div className="d-flex flex-column align-items-center gap-1">
            {file.isImage && <img src={file.previewUrl} alt={`${file.name} 預覽圖`} style={{ height: 72, maxWidth: "100%", objectFit: "contain" }} />}
            {file.isVideo && <video src={file.previewUrl} controls preload="metadata" style={{ height: 72, maxWidth: "100%" }}>您的瀏覽器不支援影片預覽。</video>}
            {showFileName && <span className="small text-break">{file.name}</span>}
        </div>
    );
};


/** 組合拖曳虛框樣式。 */
const buildFileDropZoneClass = (field: AAInputField, isDragging: boolean, errorText: string) =>
{
    const classList = ["rounded", "bg-white", "px-3", "d-flex", "align-items-center", "justify-content-center"];
    if (isDragging) classList.push("shadow-sm");
    if (field.disabled) classList.push("opacity-75");
    if (field.errorText || errorText) classList.push("border-danger");
    return classList.join(" ");
};
// #endregion

// #region Private
/** 讀取 FileList 的安全中繼資料。 */
const readSafeFiles = (files: FileList | null, field: AAInputField): FileReadResult =>
{
    const sourceFileList = Array.from(files ?? []);
    const maxCount = field.maxFileCount ?? 1;
    const maxSize = (field.maxFileSizeMB ?? 10) * 1024 * 1024;
    const errorList: string[] = [];

    if (sourceFileList.length > maxCount) errorList.push(`最多只能選擇 ${maxCount} 個檔案。`);
    const fileList = sourceFileList.slice(0, maxCount).filter((file) => validateFile(file, field, maxSize, errorList));
    const value = fileList.map(toSafeFileValue);
    return { value, fileList, errorText: errorList.join(" ") };
};


/** 驗證單一檔案的副檔名與大小。 */
const validateFile = (file: File, field: AAInputField, maxSize: number, errorList: string[]) =>
{
    const accepted = LibAttachment.isAcceptedByAcceptText(file, field.accept ?? defaultAccept);
    const validSize = file.size <= maxSize;
    if (!accepted) errorList.push(`${sanitizeFileName(file.name)} 的檔案類型不允許。`);
    if (!validSize) errorList.push(`${sanitizeFileName(file.name)} 超過 ${field.maxFileSizeMB ?? 10}MB。`);
    return accepted && validSize;
};


/** 只保存安全顯示用的檔案資訊。 */
const toSafeFileValue = (file: File): AAFileValue =>
{
    const name = sanitizeFileName(file.name);
    return { file, name, size: file.size, type: file.type, url: URL.createObjectURL(file) };
};


/** 建立本機檔案預覽資料。 */
const toLocalPreviewItem = (file: File): FilePreviewItem =>
{
    const name = sanitizeFileName(file.name);
    const type = file.type;
    const previewUrl = URL.createObjectURL(file);
    return { key: `${name}-${file.size}-${file.lastModified}`, name, size: file.size, type, previewUrl, isImage: isPreviewImageFile(name, type), isVideo: isPreviewVideoFile(name, type) };
};


/** 建立既有已上傳檔案預覽資料。 */
const toExistingPreviewItem = (file: AAFileValue): FilePreviewItem =>
{
    const name = sanitizeFileName(file.name);
    const previewUrl = sanitizePreviewUrl(file.url ?? "");
    return { key: `${name}-${file.size}-${previewUrl}`, name, size: file.size, type: file.type, previewUrl, isImage: Boolean(previewUrl) && isPreviewImageFile(name, file.type), isVideo: Boolean(previewUrl) && isPreviewVideoFile(name, file.type) };
};


/** 釋放本機預覽網址，避免長時間停留後記憶體累積。 */
const revokePreviewUrls = (previewList: FilePreviewItem[]) => previewList.forEach((item) =>
{
    if (item.previewUrl.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
});


/** 設定 input file 原生驗證狀態；不呼叫 reportValidity，避免隱藏 input 觸發瀏覽器自動水平捲動。 */
const setInputCustomValidity = (input: HTMLInputElement | null, _errorText: string) =>
{
    if (!input) return;
    input.setCustomValidity("");
};


/** 清空原生 file input，讓同一個不合法檔案可以再次選取並保留目前表格位置。 */
const clearNativeFileInput = (input: HTMLInputElement | null) =>
{
    if (!input) return;
    input.value = "";
};


/** 取得檔案上傳限制文字。 */
const getFileLimitText = (field: AAInputField) => `選擇或拖曳檔案至虛框內，僅限上傳${field.maxFileCount ?? 0}個${field.maxFileSizeMB ?? 0}MB以內檔案。${field.required ? "(必填)" : ""}`;


/** 判斷是否可用圖片方式預覽，SVG 為安全考量只顯示檔名。 */
const isPreviewImageFile = (name: string, type: string) =>
{
    const lowerName = name.toLowerCase();
    if (lowerName.endsWith(".svg")) return false;
    return type.startsWith("image/") || [".jpg", ".jpeg", ".png", ".gif", ".webp"].some((ext) => lowerName.endsWith(ext));
};


/** 判斷是否可用影片方式預覽。 */
const isPreviewVideoFile = (name: string, type: string) => type.startsWith("video/") || name.toLowerCase().endsWith(".mp4");


/** 避免預覽網址使用 javascript 等不安全協定。 */
const sanitizePreviewUrl = (value: string) =>
{
    const url = value.trim();
    if (!url) return "";
    if (url.startsWith("/") || url.startsWith("blob:") || url.startsWith("https://") || url.startsWith("http://")) return url;
    return "";
};
// #endregion