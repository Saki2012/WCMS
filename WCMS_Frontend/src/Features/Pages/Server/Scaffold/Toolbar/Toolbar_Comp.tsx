import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import type { ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";

// #region Property
export type ToolbarActions = UseActionsResult | ServerFormActions;
// #endregion

// #region Public
export const FormList_Toolbar = (prop: { action: ToolbarActions; }) =>
{
    const onSave = isLegacy(prop.action) ? prop.action.onSave : prop.action.Save;
    const onBack = isLegacy(prop.action) ? prop.action.onCancelBack : prop.action.Back;

    return (
        <div className="row mx-0">
            <div className="text-center mb-2">
                <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" title={"儲存送出"} onClick={onSave}>{"儲存送出"}</button>
                <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" title={"取消返回"} onClick={onBack}>{"取消"}</button>
            </div>
        </div>
    );
};

export const List_Toolbar = (prop: { action: ToolbarActions; }) =>
{
    // List toolbar 舊版才有 onAddNew，新的 ServerFormActions 不含（先保留舊行為）
    if (!isLegacy(prop.action)) return null;

    return (
        <div className="row mx-0">
            <div className="px-0 mb-2">
                <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" title={"新建資料"} onClick={prop.action.onAddNew}>
                    {"新建資料"}
                </button>
            </div>
        </div>
    );
};

export const Form_Toolbar = (prop: { action: ToolbarActions; }) =>
{
    const onSave = isLegacy(prop.action) ? prop.action.onSave : prop.action.Save;
    const onBack = isLegacy(prop.action) ? prop.action.onCancelBack : prop.action.Back;

    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <div className="col float-md-left float-sm-none d-flex justify-content-start">
                        <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" title={"儲存送出"} onClick={onSave}>{"儲存送出"}</button>
                        <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" title={"取消返回"} onClick={onBack}>{"取消返回"}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** 表格欄位操作按鈕，提供舊版列表的編輯與刪除行為。 */
export const GridCol_Toolbar = (prop: { action: ToolbarActions; internalId: string; }) =>
{
    const action = prop.action;
    // 先只支援舊 actions，避免 ServerFormActions 誤用列表列操作。
    if (!isLegacy(action)) return null;
    /** 執行目前資料列的編輯動作。 */
    const handleEditClick = () =>
    {
        action.onEdit(prop.internalId);
    };
    /** 執行目前資料列的刪除動作。 */
    const handleDeleteClick = () =>
    {
        action.onDelete(prop.internalId);
    };
    return (
        <div className="all-btn Edit Icon">
            <a id="edit" className="icon" onClick={handleEditClick} target="_self">
                <button type="button" className="Ipencil btn btn-ctm btn-ctm-rounded" data-bs-toggle="tooltip" title="內容編輯">
                    <i className="far fa-edit"></i>
                </button>
            </a>
            <a id="trash" className="icon" onClick={handleDeleteClick} data-bs-toggle="modal" data-bs-target="#All_Delete">
                <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" data-bs-toggle="tooltip" title="刪除">
                    <i className="far fa-trash-alt"></i>
                </button>
            </a>
        </div>
    );
};
// #endregion

// #region Private
const isLegacy = (a: ToolbarActions): a is UseActionsResult =>
{
    return typeof (a as UseActionsResult).onSave === "function";
};
// #endregion
