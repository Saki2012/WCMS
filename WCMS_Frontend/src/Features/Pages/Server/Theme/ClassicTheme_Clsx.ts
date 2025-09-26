import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { IBreadCrumbStyle } from "@/SysCore/Components/BreadCrumb/BreadCrumb_Clsx";
import type { ILibDropListStyle } from "@/SysCore/Components/FormField/FieldComponets/LibDropList_Comp";
import type { ILibTabsStyle } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import type {
    ILibCheckBoxStyle,
    // ILibDropListStyle,
    ILibFileInputStyle,
    ILibFileStyle,
    // ILibTabsStyle,
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
import { clsx } from "clsx";

/** 後台BreadCrumb樣式 */
export const Classic_BreadCrumb: IBreadCrumbStyle = {
    ul: clsx("breadcrumb", "mb-0"),
    li: (isLast: boolean) => clsx("breadcrumb-item", { "active": isLast }),
};

/** 經典樣式 */
export const Classic_NaviBarMenu: INaviBarStyle = {
    ul: clsx("navbar-nav", "me-auto", "mb-2", "mb-lg-0"),
    li: clsx("nav-item"),
};

/** 經典Menu樣式 */
export const Classic_SidebarMenu: IMenu_Style = {
    isUl: true,
    ul: (lv: number, isExpanded?: boolean) =>
        clsx(lv == 1 ? "pc-navbar" : "pc-submenu", { show: isExpanded, hide: !isExpanded }),
    li: (lv, isFirst, hasMenu, isExpanded = false) =>
        clsx("pc-item", {
            "pc-caption": isFirst,
            "Left_line": isFirst,
            "pc-hasmenu": hasMenu,
            "open-trigger": isExpanded,
        }),
};

/** 頁籤樣式 */
export const Classic_LibTabs: ILibTabsStyle = {
    UlStyle: clsx("nav", "nav-tabs"),
    LiStyle: clsx("nav-item"),
    BtnStyle: clsx("nav-link"),
};

/** 下拉選單樣式 */
export const Classic_LibDropList: ILibDropListStyle = {
    Labelstyle: clsx("col-md-2", "col-sm-12", "float-md-left", "float-sm-none", "col-form-label", "mb-1"),
    SelectStyle: clsx("col-md-10", "col-sm-12", "float-md-left", "float-sm-none", "mb-1"),
    OptionsStyle: clsx("form-select"),
};

/** 文字輸入框樣式 */
export const Classic_LibTextBox: ILibTextBoxStyle = {
    Labelstyle: clsx("col-md-2", "col-sm-12", "float-md-left", "float-sm-none", "col-form-label", "mb-1"),
    SelectStyle: clsx("col-md-10", "col-sm-12", "float-md-left", "float-sm-none", "mb-1"),
    InputStyle: clsx("form-control"),
};
/** 文字輸入框樣式2 */
export const Classic_LibTextBox2: ILibTextBoxStyle2 = {
    Labelstyle: clsx("col-md-4", "col-sm-12", "float-md-left", "float-sm-none", "col-form-label", "mb-1"),
    SelectStyle: clsx("col-md-8", "col-sm-12", "float-md-left", "float-sm-none", "mb-1"),
    InputStyle: clsx("form-control"),
};
/** 文字輸入框樣式2 */
export const Classic_LibTextBox3: ILibTextBoxStyle3 = {
    Labelstyle: clsx("col-md-2", "col-sm-12", "float-md-left", "float-sm-none", "col-form-label", "mb-1"),
    SelectStyle: clsx("col-md-4", "col-sm-12", "float-md-left", "float-sm-none", "mb-1"),
    InputStyle: clsx("form-control"),
};

/** 多行文字輸入框樣式 */
export const Classic_LibTextArea: ILibTextAreaStyle = {
    Labelstyle: clsx("col-md-2", "col-sm-12", "float-md-left", "float-sm-none", "col-form-label", "mb-1"),
    SelectStyle: clsx("col-md-10", "col-sm-12", "float-md-left", "float-sm-none", "mb-1"),
    InputStyle: clsx("custom-form-control-height-lg", "form-control"),
};
/** 多行文字輸入框樣式2 */
export const Classic_LibTextArea2: ILibTextAreaStyle2 = {
    Labelstyle: clsx("col-md-4", "col-sm-12", "float-md-left", "float-sm-none", "col-form-label", "mb-1"),
    SelectStyle: clsx("col-md-8", "col-sm-12", "float-md-left", "float-sm-none", "mb-1"),
    InputStyle: clsx("custom-form-control-height-lg", "form-control"),
};

/** TinyMCE輸入框樣式 */
export const Classic_LibTinyMCE: ILibTinyMCEStyle = {
    Labelstyle: clsx("col-md-2", "col-sm-12", "float-md-left", "float-sm-none", "col-form-label", "mb-1"),
    SelectStyle: clsx("col-md-10", "col-sm-12", "float-md-left", "float-sm-none", "mb-1"),
};

/** 檔案樣式 */
export const Classic_LibFile: ILibFileStyle = {
    Labelstyle: clsx("col-md-2", "col-sm-12", "float-md-left", "float-sm-none", "col-form-label", "mb-1"),
    SelectStyle: clsx("col-md-10", "col-sm-12", "float-md-left", "float-sm-none", "mb-1"),
    InputStyle: clsx("form-control"),
};

/** 檔案文字輸入樣式 */
export const Classic_LibFileInput: ILibFileInputStyle = {
    Labelstyle: clsx("col-md-2", "col-sm-12", "float-md-left", "float-sm-none", "col-form-label", "mb-1"),
    SelectStyle: clsx("col-md-10", "col-sm-12", "float-md-left", "float-sm-none", "mb-1"),
    InputStyle: clsx("form-control"),
};

export const Classic_LibUserCard: ILibUserCardStyle = {
    Bgstyle: clsx("bg-custom-gray"),
};

/** Grid表樣式 */
export const Classic_GridView: IGridView_Style = {
    TableStyle: clsx("table", "table-striped", "table-bordered", "table-rwd"),
    ColumnStyle: clsx("tr-only-hide-titlebar"),
    RowStyle: clsx(""),
    Odd: clsx("transparent"),
    Even: clsx("gray"),
    CellStyle: clsx("table_td_vertical_align"),
};

/** 分頁樣式 */
export const Classic_Paginator: IPaginator_Style = {
    ul: clsx("pagination"),
    li: clsx("page-item"),
    aLink: clsx("page-link"),
    FirstPage: clsx("far", "fa-arrow-to-left"),
    PrePage: clsx("far", "fa-angle-left"),
    NextPage: clsx("far", "fa-angle-right"),
    LastPage: clsx("far", "fa-arrow-to-right"),
};
/** 類別/標籤用的list表 */
export const Classic_CategoryListTag: IMenu_Style = {
    isUl: true,
    ul: () => clsx("list-group", "p-0"),
    li: () => clsx("list-group-item"),
};

export const Classic_CheckBox: ILibCheckBoxStyle = {
    Labelstyle: "",
    SelectStyle: "",
    OptionsStyle: "checkbox",
};

export const Classic_RadioBox: ILibCheckBoxStyle = {
    Labelstyle: "",
    SelectStyle: "",
    OptionsStyle: "radio",
};

/** 經典主題 */
export const Classic_BETheme: IBETheme = {
    // #region Componets
    SidebarMenu: Classic_SidebarMenu,
    BreadCrumb: Classic_BreadCrumb,
    NavBarMenu: Classic_NaviBarMenu,
    Paginator: Classic_Paginator,
    CategoryTagList: Classic_CategoryListTag,
    // #region Fields
    GridView: Classic_GridView,
    DropList: Classic_LibDropList,
    Tabs: Classic_LibTabs,
    TextBox: Classic_LibTextBox,
    TextBox2: Classic_LibTextBox2,
    TextBox3: Classic_LibTextBox3,
    TextArea: Classic_LibTextArea,
    TextArea2: Classic_LibTextArea2,
    TinyMCE: Classic_LibTinyMCE,
    File: Classic_LibFile,
    FileInput: Classic_LibFileInput,
    UserCard: Classic_LibUserCard,
    CheckBox: Classic_CheckBox,
    RadioBox: Classic_RadioBox,
};
