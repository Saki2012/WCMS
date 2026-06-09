import type { IBreadCrumbStyle } from "@/SysCore/Components/BreadCrumb/BreadCrumb_Clsx";
import type { ILibDropListStyle } from "@/SysCore/Components/FormField/FieldComponets/LibDropList_Comp";
import type { ILibTabsStyle } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import type {
    ILibCheckBoxStyle,
    ILibFileInputStyle,
    ILibFileStyle,
    ILibTextAreaStyle,
    ILibTextAreaStyle2,
    ILibTextBoxStyle,
    ILibTextBoxStyle2,
    ILibTextBoxStyle3,
    ILibTinyMCEStyle,
    ILibUserCardStyle,
} from "@/SysCore/Components/FormField/LibFormField";

import type { IGridView_Style } from "@/SysCore/Components/Grid/Grid_Clsx";
import type { IMenu_Style } from "@/SysCore/Components/MenuList/MenuList_Clsx";
import type { INaviBarStyle } from "@/SysCore/Components/NaviBar/NaviBar_Clsx";
import type { IPaginator_Style } from "@/SysCore/Components/Paginator/Paginator_Clsx";

// #region Property
/** 後台主題設定 */
export interface IBETheme
{
    SidebarMenu: IMenu_Style;
    BreadCrumb: IBreadCrumbStyle;
    NavBarMenu: INaviBarStyle;
    GridView: IGridView_Style;
    Paginator: IPaginator_Style;
    CategoryTagList: IMenu_Style;

    DropList: ILibDropListStyle;
    DropList2: ILibDropListStyle;
    Tabs: ILibTabsStyle;
    TextBox: ILibTextBoxStyle;
    TextBox2: ILibTextBoxStyle2;
    TextBox3: ILibTextBoxStyle3;
    TextArea: ILibTextAreaStyle;
    TextArea2: ILibTextAreaStyle2;
    TinyMCE: ILibTinyMCEStyle;
    File: ILibFileStyle;
    FileInput: ILibFileInputStyle;
    UserEditCard: ILibUserCardStyle;
    UserImageUploadCard: ILibUserCardStyle;
    UserCard: ILibUserCardStyle;
    CheckBox: ILibCheckBoxStyle;
    RadioBox: ILibCheckBoxStyle;
}
// #endregion
