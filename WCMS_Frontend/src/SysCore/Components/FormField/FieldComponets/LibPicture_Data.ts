import type { ReactNode } from "react";

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
}
