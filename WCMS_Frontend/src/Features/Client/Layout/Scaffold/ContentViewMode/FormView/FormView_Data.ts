import { expr } from "jquery";
import type { ReactNode } from "react";
import type { GridProps } from "../../../../../../SysCore/Components/Grid/Grid_Data";
import type { SearchBarProps } from "../../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { ToolbarAction } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Data";
import type { IFETheme } from "../../../Theme/ITheme";

export interface ContentCompProp
{
    Theme?: IFETheme;
    LoadingList: boolean[];
    ErrorList: (string | null | undefined)[];
    Title: string;
    StartDate: string;
    Category?: string[];
    Tag?: string[];
    Content?: ReactNode;
    Href?: string;
    Files?: any[];
}
