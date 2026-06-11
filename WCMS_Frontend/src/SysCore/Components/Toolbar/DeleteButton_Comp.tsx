import type { FC } from "react";

// #region Property
interface DeleteButtonProps
{
    id: string | number; // 主鍵值
    onDelete: (id: string | number) => Promise<void>; // 傳入的刪除邏輯
}
// #endregion

// #region Private
export const DeleteButton: FC<DeleteButtonProps> = ({ id, onDelete }) =>
{
    const handleDelete = async () =>
    {
        const confirm = window.confirm("確認要刪除這筆資料嗎？");
        if (!confirm) return;

        try
        {
            await onDelete(id);
        } catch (error)
        {
            console.error("刪除失敗", error);
            alert("刪除失敗，請稍後再試");
        }
    };

    return (
        <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" title="刪除輪播" onClick={handleDelete}>
            <i className="far fa-trash-alt" />
        </button>
    );
};
// #endregion
