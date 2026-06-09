import type { ILibBaseComponentsProp } from "@/SysCore/Components/FormField/FieldComponets/LibBaseData";
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
}
// #endregion
