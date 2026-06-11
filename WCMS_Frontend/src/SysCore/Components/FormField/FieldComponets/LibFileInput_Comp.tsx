import { useUploadFile } from "@/SysCore/Utils/UI_HookFunc/useUploadFile";
import { useId, useRef, useState } from "react";

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

    onFileUploaded?: (internalId: string, originalName?: string) => void;
    onNameChange?: (name: string) => void;
    onDelete?: () => void;

    /** 可選：讓這顆元件直接吃專案原本的 label/input 欄寬 */
    LabelColClassName?: string;
    InputColClassName?: string;
    RowClassName?: string;
}
// #endregion

// #region Private
export const LibFileInput = (props: LibFileInputProps) =>
{
    // NOTE: AA - 唯一 id，讓 label 可以對應到檔名輸入框
    const baseId = useId();
    const nameInputId = `${baseId}-name`;
    const fileInputId = `${baseId}-file`;

    // NOTE: 上傳 hook，選取與拖曳都統一走這裡
    const { result, handleFileChange } = useUploadFile({ enablePreview: false });

    // NOTE: 拖曳狀態，只負責紅框範圍的 UI 提示，不負責錯誤訊息
    const [isDragging, setIsDragging] = useState(false);
    const dragDepthRef = useRef(0);

    // NOTE: 顯示文字：檔名 + (internalId)
    const displayText = (() =>
    {
        const name = (props.FileName ?? props.InputValue ?? "").trim();
        const id = (props.FileInternalId ?? "").trim();
        if (!name && !id) return "未上傳";
        if (name && id) return `${name} (${id})`;
        return name || id || "未上傳";
    })();

    // NOTE: 下載（開新分頁；以後端 Download 下載）
    const openDownload = () =>
    {
        if (!props.FileInternalId) return;
        if (typeof window === "undefined") return;

        const url = `/Service/FileManagement/Server_Download/${encodeURIComponent(props.FileInternalId)}`;
        window.open(url, "_blank", "noopener");
    };

    const canDownload = !!props.FileInternalId;

    /** 執行檔案上傳，選取與拖曳都統一走 useUploadFile */
    const uploadFiles = (files: FileList | null | undefined) =>
    {
        // 宣告變數：沒有檔案就不處理
        if (!files || files.length === 0) return;

        // 執行 function：統一交給 useUploadFile，錯誤 toast 由 hook 裡的 publish 處理
        handleFileChange(files, (internalId, originalName) =>
        {
            props.onFileUploaded?.(internalId, originalName);
        });
    };

    /** 選檔事件 */
    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        // 執行 function：上傳選取檔案
        uploadFiles(e.target.files);

        // 執行 function：清空 value，避免同檔案重選不觸發 change
        e.currentTarget.value = "";
    };

    /** 阻止瀏覽器預設開啟檔案 */
    const preventDropDefault = (e: React.DragEvent<HTMLDivElement>) =>
    {
        // 執行 function：避免拖曳檔案時被瀏覽器直接打開
        e.preventDefault();
        e.stopPropagation();
    };

    /** 判斷拖曳內容是否為檔案 */
    const hasDragFile = (e: React.DragEvent<HTMLDivElement>) =>
    {
        // return：只處理檔案拖曳，不處理文字或其他內容拖曳
        return Array.from(e.dataTransfer.types).includes("Files");
    };

    /** 拖曳進入紅框上傳區 */
    const onDragEnterFile = (e: React.DragEvent<HTMLDivElement>) =>
    {
        // 執行 function：顯示拖曳上傳提示
        preventDropDefault(e);
        if (props.disabled || !hasDragFile(e)) return;

        dragDepthRef.current += 1;
        setIsDragging(true);
    };

    /** 拖曳停留紅框上傳區 */
    const onDragOverFile = (e: React.DragEvent<HTMLDivElement>) =>
    {
        // 執行 function：允許 drop
        preventDropDefault(e);
        if (!props.disabled) e.dataTransfer.dropEffect = "copy";
    };

    /** 拖曳離開紅框上傳區 */
    const onDragLeaveFile = (e: React.DragEvent<HTMLDivElement>) =>
    {
        // 執行 function：離開整個紅框範圍才隱藏提示
        preventDropDefault(e);

        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) setIsDragging(false);
    };

    /** 拖曳檔案上傳 */
    const onDropFile = (e: React.DragEvent<HTMLDivElement>) =>
    {
        // 執行 function：拖曳檔案也走同一個 uploadFiles
        preventDropDefault(e);
        dragDepthRef.current = 0;
        setIsDragging(false);

        if (props.disabled) return;
        uploadFiles(e.dataTransfer.files);
    };

    // NOTE: 與你上面欄位一致的預設 col
    const rowClass = props.RowClassName ?? "row mb-3";
    const labelCol = props.LabelColClassName ?? "col-sm-2";
    const inputCol = props.InputColClassName ?? "col-sm-10";

    return (
        <div className={rowClass}>
            {/* 左：label（跟其他欄位同一套 col） */}
            <div className={labelCol}>
                {props.ColumnDisplayName && <label htmlFor={nameInputId} className="col-form-label">{props.ColumnDisplayName}</label>}
            </div>

            {/* 右：內容（同一套 col，裡面維持兩行） */}
            <div className={inputCol}>
                <div
                    className="position-relative"
                    onDragEnter={onDragEnterFile}
                    onDragOver={onDragOverFile}
                    onDragLeave={onDragLeaveFile}
                    onDrop={onDropFile}
                    aria-label="附件上傳區，可選擇檔案或拖曳檔案上傳"
                >
                    {/* 第 1 行：檔名 + × */}
                    <div className="input-group">
                        <input
                            id={nameInputId}
                            type="text"
                            className="form-control"
                            placeholder={props.DefaultInputDisplay ?? "請輸入檔名..."}
                            value={props.InputValue ?? ""}
                            onChange={(e) => props.onNameChange?.(e.target.value)}
                            disabled={props.disabled}
                            aria-label="檔名"
                        />
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => props.onDelete?.()}
                            aria-label="移除此附件"
                            disabled={props.disabled}
                        >
                            ×
                        </button>
                    </div>

                    {/* 第 2 行：選擇檔案 + 顯示列（可點擊下載 / 可拖曳上傳） */}
                    <div className="input-group mt-2">
                        <label className={`btn btn-outline-primary mb-0 ${props.disabled ? "disabled" : ""}`}>
                            選擇檔案
                            <input
                                id={fileInputId}
                                type="file"
                                className="d-none"
                                accept={props.Accept}
                                onChange={onPickFile}
                                disabled={props.disabled}
                                aria-label="選擇檔案並上傳"
                            />
                        </label>

                        <input
                            type="text"
                            className="form-control"
                            value={displayText}
                            readOnly
                            aria-readonly="true"
                            title={displayText}
                            role="link"
                            tabIndex={0}
                            aria-disabled={!canDownload}
                            aria-label={canDownload ? `下載檔案：${displayText}` : "尚未上傳，無可下載檔案"}
                            onClick={() => canDownload && openDownload()}
                            onKeyDown={(e) =>
                            {
                                if (!canDownload)
                                {
                                    return;
                                }

                                if (e.key === "Enter" || e.key === " ")
                                {
                                    e.preventDefault();
                                    openDownload();
                                }
                            }}
                            style={{ cursor: canDownload ? "pointer" : "not-allowed" }}
                        />
                    </div>

                    {isDragging && (
                        <div
                            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded"
                            aria-hidden="true"
                            style={{
                                zIndex: 5,
                                pointerEvents: "none",
                                border: "2px dashed #0d6efd",
                                backgroundColor: "rgba(13, 110, 253, 0.08)",
                                color: "#0d6efd",
                                fontWeight: 600,
                            }}
                        >
                            拖曳檔案到這裡上傳
                        </div>
                    )}
                </div>

                {result.uploading && <div className="form-text mt-1" aria-live="polite">上傳中…</div>}

                {!!result.error && <div className="text-danger mt-1" role="alert">上傳失敗：{result.error}</div>}
            </div>
        </div>
    );
};
// #endregion
