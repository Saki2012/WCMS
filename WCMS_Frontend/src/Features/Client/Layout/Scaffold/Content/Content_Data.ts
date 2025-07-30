import type { IFETheme } from "../../Theme/ITheme"
import type { ToolbarAction } from "../../../../../SysCore/Components/Toolbar/Toolbar_Data"
import type { GridProps } from "../../../../../SysCore/Components/Grid/Grid_Data"
import type { SearchBarProps } from "../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp"



export interface FormCompProp{
    Title:string
    Theme:IFETheme
    LoadingList:boolean[],
    ErrorList:(string | null | undefined)[],
}

export interface ListCompProp{
    // Title:string
    Theme:IFETheme
    LoadingList:boolean[],
    ErrorList:(string | null | undefined)[],
    // SearchBar:SearchBarProps,
    // SearchBar:SearchBarProps
    // GridType?:string
    GridData:GridProps
}
