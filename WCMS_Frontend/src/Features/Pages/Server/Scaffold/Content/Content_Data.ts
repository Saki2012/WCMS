import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";

export interface FormCompProp
{
    Title: string;
    Theme: IBETheme;
    LoadingList: boolean[];
    ErrorList: (string | null | undefined)[];
    Actions: UseActionsResult | ServerFormActions;
    SearchBar?: SearchBarProps;
}

/** 標籤/類別使用 */
