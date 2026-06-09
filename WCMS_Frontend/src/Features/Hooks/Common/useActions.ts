// #region Property
/** 功能列按鈕的型別，但還未規劃後台Toolbar完整邏輯，先擱置，等ok了就會接上，移除這份Code */
export interface UseActionsResult
{
    isExecuting: boolean;
    onSave: () => Promise<boolean>;
    onDelete: (internalId: string) => Promise<void>;
    onInvalid: (reason?: unknown) => void;
    onCancelBack: () => void;
    onAddNew: () => void;
    onEdit: (internalId: string) => void;
    onPreview: () => void;
}
// #endregion
