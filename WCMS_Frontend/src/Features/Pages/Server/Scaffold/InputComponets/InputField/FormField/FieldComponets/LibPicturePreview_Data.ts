// #region Property
export interface ILibPicturePreviewStyle
{
    Labelstyle: string;
    SelectStyle: string;
    InputStyle: string;
}

export interface ILibPicturePreviewProp
{
    // Style:ILibPicturePreviewStyle,
    ColumnDisplayName: string;
    PicSrc: string;
    PicDescription: string;
    /** 刪除圖片與其連動標籤資料。 */
    onRemove?: () => void;
    /** 控制刪除按鈕是否停用。 */
    removeDisabled?: boolean;
}
// #endregion