import { useUploadFile } from '@/SysCore/Utils/UI_HookFunc/useUploadFile';
import { useId } from 'react';

interface LibFileInputProps {
    ColumnDisplayName?: string;
    DefaultInputDisplay?: string;

    /** 上方：FileName（可編輯） */
    InputValue: string;

    /** 下方：顯示 internalId（唯讀） */
    InternalId?: string | null;

    Accept?: string;
    disabled?: boolean;

    onFileUploaded?: (internalId: string, originalName?: string) => void;
    onNameChange?: (name: string) => void;
    onDelete?: () => void;

    /** ✅ 可選：讓這顆元件直接吃你專案原本的 label/input 欄寬（不給就用預設） */
    LabelColClassName?: string; // ex: "col-sm-2"
    InputColClassName?: string; // ex: "col-sm-10"
    RowClassName?: string; // ex: "row mb-3"
}

const LibFileInput = (props: LibFileInputProps) => {
    // NOTE: AA - 唯一 id，讓 label 可以對應到檔名輸入框
    const baseId = useId();
    const nameInputId = `${baseId}-name`;
    const fileInputId = `${baseId}-file`;

    // NOTE: 上傳 hook
    const { result, handleFileChange } = useUploadFile({ enablePreview: false });

    // NOTE: 顯示文字：檔名 + (internalId)
    const displayText = (() => {
        const name = (props.InputValue ?? '').trim();
        const id = (props.InternalId ?? '').trim();
        if (!name && !id) return '未上傳';
        if (name && id) return `${name} (${id})`;
        return name || id || '未上傳';
    })();

    // NOTE: 下載（開新分頁；以後端 Download 下載）
    const openDownload = () => {
        if (!props.InternalId) return;
        if (typeof window === 'undefined') return;

        const url = `/Service/FileManagement/Download/${encodeURIComponent(props.InternalId)}`;
        window.open(url, '_blank', 'noopener');
    };

    const canDownload = !!props.InternalId;

    // NOTE: 選檔事件（取消選檔不動作；成功上傳交給父層）
    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) {
            e.currentTarget.value = '';
            return;
        }

        handleFileChange(files, (internalId, originalName) => {
            props.onFileUploaded?.(internalId, originalName);
        });

        // NOTE: 清空 value，避免同檔案重選不觸發 change
        e.currentTarget.value = '';
    };

    // NOTE: 與你上面欄位一致的預設 col
    const rowClass = props.RowClassName ?? 'row mb-3';
    const labelCol = props.LabelColClassName ?? 'col-sm-2';
    const inputCol = props.InputColClassName ?? 'col-sm-10';

    return (
        <div className={rowClass}>
            {/* 左：label（跟其他欄位同一套 col） */}
            <div className={labelCol}>
                {props.ColumnDisplayName && (
                    <label htmlFor={nameInputId} className="col-form-label">
                        {props.ColumnDisplayName}
                    </label>
                )}
            </div>

            {/* 右：內容（同一套 col，裡面維持兩行） */}
            <div className={inputCol}>
                {/* 第 1 行：檔名 + × */}
                <div className="input-group">
                    <input id={nameInputId} type="text" className="form-control" placeholder={props.DefaultInputDisplay ?? '請輸入檔名...'} value={props.InputValue ?? ''}
                        onChange={(e) => props.onNameChange?.(e.target.value)} disabled={props.disabled} aria-label="檔名" />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => props.onDelete?.()} aria-label="移除此附件" disabled={props.disabled}>
                        ×
                    </button>
                </div>

                {/* 第 2 行：選擇檔案 + 顯示列（可點擊下載） */}
                <div className="input-group mt-2">
                    <label className={`btn btn-outline-primary mb-0 ${props.disabled ? 'disabled' : ''}`}>
                        選擇檔案
                        <input id={fileInputId} type="file" className="d-none" accept={props.Accept} onChange={onPickFile} disabled={props.disabled} aria-label="選擇檔案並上傳" />
                    </label>

                    <input type="text" className="form-control" value={displayText} readOnly aria-readonly="true"
                        title={displayText} role="link" tabIndex={0} aria-disabled={!canDownload} aria-label={canDownload ? `下載檔案：${displayText}` : '尚未上傳，無可下載檔案'}
                        onClick={() => canDownload && openDownload()}
                        onKeyDown={(e) => {
                            if (!canDownload) return;
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openDownload();
                            }
                        }}
                        style={{ cursor: canDownload ? 'pointer' : 'not-allowed' }}
                    />
                </div>

                {result.uploading && (
                    <div className="form-text mt-1" aria-live="polite">
                        上傳中…
                    </div>
                )}

                {!!result.error && (
                    <div className="text-danger mt-1" role="alert">
                        上傳失敗：{result.error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LibFileInput;
