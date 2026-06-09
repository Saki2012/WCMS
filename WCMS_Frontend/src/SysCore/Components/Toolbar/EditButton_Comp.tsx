import type { FC } from "react";
import { useNavigate } from "react-router-dom";

// #region Property
interface EditButtonProps
{
    id: string | number; // 主鍵值
    routePath: string; // 要前往的編輯頁 base 路徑，如 "/page/edit"
}
// #endregion

// #region Private
const EditButton: FC<EditButtonProps> = ({ id, routePath }) =>
{
    const navigate = useNavigate();

    const handleEdit = () =>
    {
        navigate(`${routePath}/${id}`);
    };

    return (
        <button type="button" className="Ipencil btn btn-ctm btn-ctm-rounded" title="內容編輯" onClick={handleEdit}>
            <i className="far fa-edit" />
        </button>
    );
};


export default EditButton;
// #endregion
