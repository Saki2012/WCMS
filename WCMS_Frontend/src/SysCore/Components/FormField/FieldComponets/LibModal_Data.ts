import type { ReactNode } from "react";

export interface ILibModalStyle
{
    // BtnStyle:string,
}

export interface LibModalProp
{
    // Style:ILibModalStyle,
    ModalName: string;
    BtnName1?: string;
    BtnName2?: string;
    children?: ReactNode;
}
