import type { GridProps } from "../../../../../SysCore/Components/Grid/Grid_Data";
import type { SearchBarProps } from "../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { ToolbarAction } from "../../../../../SysCore/Components/Toolbar/Toolbar_Data";
import type { IBETheme } from "../../Theme/ITheme";
export interface FormCompProp
{
    Title: string;
    Theme: IBETheme;
    LoadingList: boolean[];
    ErrorList: (string | null | undefined)[];
    Toolbar?: ToolbarAction[];
}

export interface ListCompProp
{
    Title: string;
    Theme: IBETheme;
    LoadingList: boolean[];
    ErrorList: (string | null | undefined)[];
    SearchBar: SearchBarProps;
    Toolbar: ToolbarAction[];
    // SearchBar:SearchBarProps
    GridType?: string;
    GridData?: GridProps;
}

/** 標籤/類別使用 */
