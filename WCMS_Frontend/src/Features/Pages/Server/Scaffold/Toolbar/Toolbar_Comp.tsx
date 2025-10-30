import type { UseActionsResult } from '@/Features/Hooks/Common/useActions';


export const FormList_Toolbar = (prop: { action: UseActionsResult }) => {
    return (
        <div className="row mx-0">
            <div className="text-center mb-2">
                <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" title={"儲存送出"} onClick={prop.action.onSave}>
                    {"儲存送出"}
                </button>
                <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" title={"取消返回"} onClick={prop.action.onCancelBack}>
                    {"取消"}
                </button>
            </div>
        </div>
    );
}


export const List_Toolbar = (prop: { action: UseActionsResult }) => {
    return (
        <div className="row mx-0">
            <div className="px-0 mb-2">

                <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" title={"新建資料"} onClick={prop.action.onAddNew}>
                    {"新建資料"}
                </button>

            </div>
        </div>
    );
}

export const Form_Toolbar = (prop: { action: UseActionsResult }) => {
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <div className="col float-md-left float-sm-none d-flex justify-content-start">
                        <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" title={"儲存送出"} onClick={prop.action.onSave}>{"儲存送出"}</button>
                        <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" title={"取消返回"} onClick={prop.action.onCancelBack}>{"取消返回"}</button>
                        <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" title={"預覽"} onClick={prop.action.onPreview}>{"預覽"}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}






export const GridCol_Toolbar = (prop: { action: UseActionsResult, internalId: string }) => {
    return (
        <div className="all-btn Edit Icon">
            <a id="edit" className="icon" onClick={() => prop.action.onEdit(prop.internalId)} target="_self">
                <button type="button" className="Ipencil btn btn-ctm btn-ctm-rounded" data-bs-toggle="tooltip" title="內容編輯">
                    <i className="far fa-edit"></i>
                </button>
            </a>
            <a id="trash" className="icon" onClick={() => prop.action.onDelete(prop.internalId)} data-bs-toggle="modal" data-bs-target="#All_Delete">
                <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" data-bs-toggle="tooltip" title="刪除">
                    <i className="far fa-trash-alt"></i>
                </button>
            </a>
        </div>
    )
}