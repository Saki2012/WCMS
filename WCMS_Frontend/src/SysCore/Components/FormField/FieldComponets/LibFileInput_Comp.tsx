import { useUploadFile } from '@/SysCore/Utils/UI_HookFunc/useUploadFile';

interface LibFileInputProps {
    ColumnDisplayName?: string;
    DefaultInputDisplay?: string;
    Style?: any;
    /** 上方：FileName（可編輯） */
    InputValue: string;
    /** 下方：顯示 internalId（唯讀） */
    InternalId?: string | null;
    Accept?: string;
    disabled?: boolean;
    onFileUploaded?: (internalId: string, originalName?: string) => void;
    onNameChange?: (name: string) => void;
    /** 提供用來做刪除行項或是清空內容 */
    onDelete?: () => void;
}
const LibFileInput = (props: LibFileInputProps) => {
    const { result, handleFileChange } = useUploadFile({ enablePreview: false });
    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) {
            e.currentTarget.value = "";
            return; // 取消選檔：不動作
        }
        handleFileChange(files, (internalId, originalName) => {
            // 成功上傳交給父層處理（父層會更新 FileId 與必要時預設 FileName）
            props.onFileUploaded?.(internalId, originalName);
        });
        e.currentTarget.value = ""; // 允許選同一檔再次觸發
    };
    /** 顯示：檔名 (internalId) */
    const displayText = (() => {
        const name = (props.InputValue ?? '').trim();
        const id = (props.InternalId ?? '').trim();
        if (!name && !id) return '未上傳';
        if (name && id) return `${name} (${id})`;
        return name || id || '未上傳';
    })();

    /** 下載（開新分頁；以 Preview 下載） */
    const openDownload = () => {
        if (!props.InternalId) return;
        if (typeof window === 'undefined') return;
        const url = `/Service/FileManagement/Download/${encodeURIComponent(props.InternalId)}`;
        // 開新分頁，比較不會被瀏覽器擋
        window.open(url, '_blank', 'noopener');
    };

    const canDownload = !!props.InternalId;

    return (
        <div className="lib-file-input">
            {props.ColumnDisplayName && <div className="mb-1">{props.ColumnDisplayName}</div>}
            {/* 上：FileName（可編輯） + 右側 × */}
            <div className="input-group">
                <input type="text" className="form-control" placeholder={props.DefaultInputDisplay ?? "請選擇檔案附件..."} value={props.InputValue ?? ""} onChange={(e) => props.onNameChange?.(e.target.value)} disabled={props.disabled} aria-label="檔名" />
                <button type="button" className="btn btn-outline-secondary" onClick={() => props.onDelete?.()} aria-label="移除此附件" disabled={props.disabled}>×</button>
            </div>
            {/* 下：選檔按鈕 + 灰底唯讀列（顯示 internalId） */}
            <div className="input-group mt-2">
                <label className="btn btn-secondary mb-0">
                    選擇檔案
                    <input
                        type="file"
                        className="d-none"
                        accept={props.Accept}
                        onChange={onPickFile}
                        disabled={props.disabled}
                        aria-label="選擇檔案並上傳"
                    />
                </label>

                {/* 可點擊下載：支援鍵盤操作（Enter/Space）與 AA 無障礙敘述 */}
                <input
                    type="text"
                    className="form-control"
                    value={displayText}
                    readOnly
                    aria-readonly="true"
                    title={displayText}
                    role="link"
                    tabIndex={0}
                    aria-label={canDownload ? `下載檔案：${displayText}` : '尚未上傳，無可下載檔案'}
                    aria-disabled={!canDownload}
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
            {result.uploading && <div className="form-text mt-1" aria-live="polite">上傳中…</div>}
            {!!result.error && <div className="text-danger mt-1" role="alert">上傳失敗：{result.error}</div>}
        </div>
    );
};

export default LibFileInput