import type { ReactNode } from "react";

export interface ILibFileStyle{
    Labelstyle:string,
    SelectStyle:string,
    InputStyle:string,
}

export interface ILibFileProp{
    Style:ILibFileStyle,
    ColumnDisplayName:string,
    Multiple:boolean,
    onChange?: (files: File[]) => void,
    children?: ReactNode;
}
