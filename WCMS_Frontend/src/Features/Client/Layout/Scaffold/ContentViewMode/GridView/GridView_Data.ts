import type { IFETheme } from "../../../Theme/ITheme"
import type { GridProps } from "../../../../../../SysCore/Components/Grid/Grid_Data"
import type { ReactNode } from "react"
import type { FileInfo } from "../../../../../../SysCore/Components/File/File_Data"

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

export interface ContentCompProp{
  Theme:IFETheme
  LoadingList:boolean[],
  ErrorList:(string | null | undefined)[],
  
  Title:string
  StartDate:string
  Category?:string[]
  Tag?:string[]
  Content?:ReactNode
  Href?:string
  Files?:FileInfo[]
}
