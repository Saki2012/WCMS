import type { ILibBaseComponentsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibBaseData";
import type { ReactNode } from "react";

// #region Property
export interface ILibFileStyle
{
    Labelstyle: string;
    SelectStyle: string;
    InputStyle: string;
}


export interface ILibFileProp extends ILibBaseComponentsProp
{
    Style: ILibFileStyle;
    ColumnDisplayName: string;
    accept?: string;
    Multiple: boolean;
    onChange?: (files: File[]) => void;
    children?: ReactNode;
    /** 檔案數量上限。 */
    maxFileCount?: number;
    /** 單檔大小上限，單位 MB。 */
    maxFileSizeMB?: number;
    /** 是否顯示 children 預覽區，預設 true，通常用在 LibPicture。 */
    ShowPreview?: boolean;
    /** 是否顯示 AA file 欄位內的檔案名稱與圖片/影片預覽，預設 false。 */
    ShowFileNameAndImg?: boolean;
}
// #endregion
