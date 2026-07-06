// #region Property
export interface ILibUserCardStyle
{
    Bgstyle: string;
    LinkType: "Edit" | "ImageUpload" | "None";
}


export interface ILibUserCardProp
{
    Style?: ILibUserCardStyle;
    DisplayNameEN: string;
    DisplayNameTW: string;
    DisplayRole: string;
    PicSrc: string;
    dirUrl?: string;
    onUploadedTempId?: (internalId: string) => void;
}
// #endregion
