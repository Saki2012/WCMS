import type { ReactNode } from "react";
import type { IFETheme } from "../../../Theme/ITheme";

export interface ContentCompProp
{
    Theme?: IFETheme;
    LoadingList: boolean[];
    ErrorList: (string | null | undefined)[];
    Title: string;
    StartDate?: string;
    Category?: string[];
    Tag?: string[];
    Content?: ReactNode;
    Href?: string;
    Files?: any[];
}
