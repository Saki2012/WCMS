import type { ReactNode } from "react";

// #region Property
export interface ILibPictureStyle
{
    Labelstyle: string;
    SelectStyle: string;
    InputStyle: string;
}

export interface ILibPictureProp
{
    // Style:ILibPictureStyle,
    ColumnDisplayName?: string;
    PicSrc: string;
    PicDescription?: string;
    children?: ReactNode;
    /** 刪除圖片與其連動資料。 */
    onRemove?: () => void;
    /** 控制刪除圖片按鈕是否停用。 */
    removeDisabled?: boolean;
}
// #endregion