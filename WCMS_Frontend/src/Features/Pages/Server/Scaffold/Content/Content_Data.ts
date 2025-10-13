import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { GridProps } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
export interface FormCompProp
{
    Title: string;
    Theme: IBETheme;
    LoadingList: boolean[];
    ErrorList: (string | null | undefined)[];
    Actions: UseActionsResult;
}

export interface ListCompProp
{
    Title: string;
    Theme: IBETheme;
    LoadingList: boolean[];
    ErrorList: (string | null | undefined)[];
    SearchBar: SearchBarProps;
    Actions: UseActionsResult;
    // SearchBar:SearchBarProps
    GridType?: string;
    GridData?: GridProps;
}

/** 標籤/類別使用 */
