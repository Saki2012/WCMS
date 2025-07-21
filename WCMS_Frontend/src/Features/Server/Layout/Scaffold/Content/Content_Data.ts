import type { IBETheme } from "../../Theme/ITheme"
import type { ToolbarAction } from "../../../../../SysCore/Components/Toolbar/Toolbar_Data"
import type { GridProps } from "../../../../../SysCore/Components/Grid/Grid_Data"

export interface FormCompProp{
    Title:string
    Theme:IBETheme
    LoadingList:boolean[],
    ErrorList:(string | null | undefined)[],
    Toolbar:ToolbarAction[]
}

export interface ListCompProp{
    Title:string
    Theme:IBETheme
    LoadingList:boolean[],
    ErrorList:(string | null | undefined)[],
    Toolbar:ToolbarAction[]
    GridType?:string
    GridData:GridProps
}