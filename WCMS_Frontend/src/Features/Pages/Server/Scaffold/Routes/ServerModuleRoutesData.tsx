import { CalendarPageComp } from "@/Features/Pages/Server/BizFunc/COMM/Calendar/Server_Calendar_Comp";
import { Server_CategoryListFormComp } from "@/Features/Pages/Server/BizFunc/COMM/Category/Server_Category_ListForm_Comp";
import { Server_Person_Form_Comp } from "@/Features/Pages/Server/BizFunc/COMM/Person/Server_Person_Form_Comp";
import { Server_Person_List_Comp } from "@/Features/Pages/Server/BizFunc/COMM/Person/Server_Person_List_Comp";
import { Server_Tag_ListForm_Comp } from "@/Features/Pages/Server/BizFunc/COMM/Tags/Server_Tag_ListForm_Comp";
import { Server_Account_Form_Comp } from "@/Features/Pages/Server/BizFunc/IAM/Account/Server_Account_Form_Comp";
import { Server_Account_List_Comp } from "@/Features/Pages/Server/BizFunc/IAM/Account/Server_Account_List_Comp";
import { Server_ChangePassword_Comp } from "@/Features/Pages/Server/BizFunc/IAM/Account/Server_ChangePassword_Comp";
import { Server_Announcement_Form_Comp } from "@/Features/Pages/Server/BizFunc/WEB/Announcement/Server_Announcement_Form_Comp";
import { Server_AnnouncementListComp } from "@/Features/Pages/Server/BizFunc/WEB/Announcement/Server_Announcement_List_Comp";
import { BannerSliderFormComp } from "@/Features/Pages/Server/BizFunc/WEB/Banner/Server_BannerSlider_Form_Comp";
import { BannerSliderListComp } from "@/Features/Pages/Server/BizFunc/WEB/Banner/Server_BannerSlider_List_Comp";
import { Server_FileArchive_Form_Comp } from "@/Features/Pages/Server/BizFunc/WEB/FileArchive/Server_FileArchive_Form_Comp";
import { Server_FileArchiveListComp } from "@/Features/Pages/Server/BizFunc/WEB/FileArchive/Server_FileArchive_List_Comp";
import { Server_GalleryFormComp } from "@/Features/Pages/Server/BizFunc/WEB/Gallery/Server_Gallery_Form_Comp";
import { Server_GalleryListComp } from "@/Features/Pages/Server/BizFunc/WEB/Gallery/Server_Gallery_List_Comp";
import { Server_PageManagement_Form_Comp } from "@/Features/Pages/Server/BizFunc/WEB/PageManagement/Server_PageManagement_Form_Comp";
import { PageListComp } from "@/Features/Pages/Server/BizFunc/WEB/PageManagement/Server_PageManagement_List_Comp";
import { SiteMenu_Comp } from "@/Features/Pages/Server/BizFunc/WEB/SiteMenu/SiteMenu_Comp";
import { WebResourceFormComp } from "@/Features/Pages/Server/BizFunc/WEB/WebResource/Server_WebResource_Form_Comp";
import { WebResourceListComp } from "@/Features/Pages/Server/BizFunc/WEB/WebResource/Server_WebResource_List_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import { PGID } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { Server_ResetPassword_Comp } from "../../BizFunc/IAM/Account/Server_ResetPassword_Comp";
import { Server_RolePermission_Form_Comp } from "../../BizFunc/IAM/RolePermission/Server_RolePermission_Form_Comp";
import { Server_RolePermission_Comp } from "../../BizFunc/IAM/RolePermission/Server_RolePermission_List_Comp";
import { Server_MatCategory_Form_Comp } from "../../BizFunc/MAT/MatCategory/Server_MatCategory_Form_Comp";
import { Server_MatCategory_List_Comp } from "../../BizFunc/MAT/MatCategory/Server_MatCategory_List_Comp";
import { Server_Material_Form_Comp } from "../../BizFunc/MAT/Material/Server_Material_Form_Comp";
import { Server_Material_List_Comp } from "../../BizFunc/MAT/Material/Server_Material_List_Comp";
import { Server_Survey_Form_Comp } from "../../BizFunc/WEB/Survey/Server_Survey_Form_Comp";
import { Server_Survey_List_Comp } from "../../BizFunc/WEB/Survey/Server_Survey_List_Comp";
import { Server_SurveySubmission_Form_Comp } from "../../BizFunc/WEB/SurveySubmission/Server_SurveySubmission_Form_Comp";
import { Server_SurveySubmission_List_Comp } from "../../BizFunc/WEB/SurveySubmission/Server_SurveySubmission_List_Comp";
import { Server_Timeline_Form_Comp } from "../../BizFunc/WEB/Timeline/Server_Timeline_Form_Comp";
import { Server_Timeline_List_Comp } from "../../BizFunc/WEB/Timeline/Server_Timeline_List_Comp";

// #region Property
export interface IModuleMeta
{
    ModuleCode: string;
    Title: string;
    DefaultPath: string;
    IconClassName?: string;
    Progs: IProgMeta[];
}
export interface IProgMeta
{
    /** 前端選單唯一鍵，不影響後端 ProgId / 權限 */
    MenuKey?: string;
    /** 程式單元代碼，對應後端既有的 ProgId */
    ProgId: string;
    Title: string;
    IconClassName: string;
    DefaultActionCode: IActionMeta["ActionCode"];
    Actions: IActionMeta[];
}
export interface IActionMeta
{
    ActionCode: string;
    Title: string;
    RoutePath: string; // 例: "Form/:internalId?"、"Category/:internalId?"
    ShowInMenu?: boolean;
    /** ✅ 給 Router 用：由 data 決定要 render 什麼 element */
    elementFactory?: ServerElementFactory;
}
export interface IActionHandle
{
    ActionCode: string;
    Title: string;
    /** ✅ 給 Router 用：由 data 決定要 render 什麼 element */
}
export interface IServerElementFactoryCtx
{
    theme: IBETheme;
    lang: Lang;
    // params?: Record<string, string | undefined>;
}
export type ServerElementFactory = (ctx: IServerElementFactoryCtx) => ReactNode;
/** 後台功能路由資料 */
const isSpec1816 = String(import.meta.env.VITE_SPEC_CODE ?? "") === "1816";
// 暫時寫死
const ServerModuleRoutesData: IModuleMeta[] = [
    {
        ModuleCode: "Dashboard",
        Title: "網站管理",
        DefaultPath: "/Server/Dashboard/SiteMenu/List",
        IconClassName: "fas fa-tachometer-alt",
        Progs: [
            {
                ProgId: "SiteMenu",
                Title: "網站導覽",
                DefaultActionCode: "List",
                IconClassName: "fas fa-sitemap",
                Actions: [{
                    ActionCode: "List",
                    Title: "網站導覽",
                    RoutePath: "List",
                    elementFactory: (ctx) => <SiteMenu_Comp theme={ctx.theme} lang={ctx.lang} />,
                }],
            },
            ...(isSpec1816
                ? [{
                    ProgId: "Calendar",
                    Title: "行事曆",
                    DefaultActionCode: "Index",
                    IconClassName: "fas fa-calendar-alt",
                    Actions: [{
                        ActionCode: "Index",
                        Title: "行事曆",
                        RoutePath: "Index",
                        elementFactory: () => <CalendarPageComp defaultYear={new Date().getFullYear()} />,
                    }],
                }]
                : []),
        ],
    },

    {
        ModuleCode: "WebManagement",
        Title: "網站功能管理",
        DefaultPath: "/Server/WebManagement/Announcement/List",
        IconClassName: "fas fa-globe",
        Progs: [
            // 廣告輪播
            {
                ProgId: "BannerSlider",
                Title: "廣告輪播",
                DefaultActionCode: "List",
                IconClassName: "fas fa-bring-front",
                Actions: [{
                    ActionCode: "List",
                    Title: "廣告輪播列表",
                    RoutePath: "List",
                    elementFactory: (ctx) => <BannerSliderListComp title="廣告輪播列表" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Form",
                    Title: "廣告輪播設定",
                    RoutePath: "Form/:internalId?",
                    elementFactory: (ctx) => <BannerSliderFormComp theme={ctx.theme} lang={ctx.lang} />,
                }],
            },
            // 公告
            {
                ProgId: "Announcement",
                Title: "公告",
                DefaultActionCode: "List",
                IconClassName: "fas fa-bullhorn",
                Actions: [{
                    ActionCode: "List",
                    Title: "公告列表",
                    RoutePath: "List",
                    elementFactory: (ctx) => <Server_AnnouncementListComp title="公告列表" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Form",
                    Title: "公告維護",
                    RoutePath: "Form/:internalId?",
                    elementFactory: (ctx) => <Server_Announcement_Form_Comp theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Category",
                    Title: "公告類別",
                    RoutePath: "Category/:internalId?",
                    elementFactory: (ctx) => <Server_CategoryListFormComp progId="Announcement" title="類別" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Tag",
                    Title: "公告標籤",
                    RoutePath: "Tag/:internalId?",
                    elementFactory: (ctx) => <Server_Tag_ListForm_Comp progId="Announcement" title="標籤" theme={ctx.theme} lang={ctx.lang} />,
                }],
            },

            // 頁面
            {
                ProgId: "PageManagement",
                Title: "頁面管理",
                DefaultActionCode: "List",
                IconClassName: "fas fa-file-signature",
                Actions: [{
                    ActionCode: "List",
                    Title: "頁面列表",
                    RoutePath: "List",
                    elementFactory: (ctx) => <PageListComp title="頁面列表" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Form",
                    Title: "頁面維護",
                    RoutePath: "Form/:internalId?",
                    elementFactory: (ctx) => <Server_PageManagement_Form_Comp theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Category",
                    Title: "頁面類別",
                    RoutePath: "Category/:internalId?",
                    elementFactory: (ctx) => <Server_CategoryListFormComp progId="PageManagement" title="類別" theme={ctx.theme} lang={ctx.lang} />,
                }],
            },

            // 相簿
            {
                ProgId: "Gallery",
                Title: "相簿",
                DefaultActionCode: "List",
                IconClassName: "fas fa-images",
                Actions: [{
                    ActionCode: "List",
                    Title: "相簿列表",
                    RoutePath: "List",
                    elementFactory: (ctx) => <Server_GalleryListComp title="相簿列表" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Form",
                    Title: "相簿維護",
                    RoutePath: "Form/:internalId?",
                    elementFactory: (ctx) => <Server_GalleryFormComp theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Category",
                    Title: "相簿類別",
                    RoutePath: "Category/:internalId?",
                    elementFactory: (ctx) => <Server_CategoryListFormComp progId="Gallery" title="類別" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Tag",
                    Title: "相簿標籤",
                    RoutePath: "Tag/:internalId?",
                    elementFactory: (ctx) => <Server_Tag_ListForm_Comp progId="Gallery" title="標籤" theme={ctx.theme} lang={ctx.lang} />,
                }],
            },

            // 檔案室
            {
                ProgId: "FileArchive",
                Title: "檔案室",
                DefaultActionCode: "List",
                IconClassName: "fas fa-cabinet-filing",
                Actions: [{
                    ActionCode: "List",
                    Title: "檔案室列表",
                    RoutePath: "List",
                    elementFactory: (ctx) => <Server_FileArchiveListComp title="檔案室列表" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Form",
                    Title: "檔案室維護",
                    RoutePath: "Form/:internalId?",
                    elementFactory: (ctx) => <Server_FileArchive_Form_Comp theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Category",
                    Title: "檔案類別",
                    RoutePath: "Category/:internalId?",
                    elementFactory: (ctx) => <Server_CategoryListFormComp progId="FileArchive" title="類別" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Tag",
                    Title: "檔案標籤",
                    RoutePath: "Tag/:internalId?",
                    elementFactory: (ctx) => <Server_Tag_ListForm_Comp progId="FileArchive" title="標籤" theme={ctx.theme} lang={ctx.lang} />,
                }],
            },
            // 網路資源
            {
                ProgId: "WebResource",
                Title: "網路資源",
                DefaultActionCode: "List",
                IconClassName: "fas fa-link",
                Actions: [{
                    ActionCode: "List",
                    Title: "網路資源列表",
                    RoutePath: "List",
                    elementFactory: (ctx) => <WebResourceListComp title="網路資源列表" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Form",
                    Title: "網路資源維護",
                    RoutePath: "Form/:internalId?",
                    elementFactory: (ctx) => <WebResourceFormComp theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Category",
                    Title: "資源類別",
                    RoutePath: "Category/:internalId?",
                    elementFactory: (ctx) => <Server_CategoryListFormComp progId="WebResource" title="類別" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Tag",
                    Title: "資源標籤",
                    RoutePath: "Tag/:internalId?",
                    elementFactory: (ctx) => <Server_Tag_ListForm_Comp progId="WebResource" title="標籤" theme={ctx.theme} lang={ctx.lang} />,
                }],
            },
            // 紀事表
            {
                ProgId: PGID.Timeline,
                Title: "紀事表",
                DefaultActionCode: "List",
                IconClassName: "fas fa-stream",
                Actions: [{
                    ActionCode: "List",
                    Title: "紀事表列表",
                    RoutePath: "List",
                    elementFactory: (ctx) => <Server_Timeline_List_Comp title="紀事表列表" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Form",
                    Title: "紀事表維護",
                    RoutePath: "Form/:internalId?",
                    elementFactory: (ctx) => <Server_Timeline_Form_Comp theme={ctx.theme} lang={ctx.lang} />,
                }],
            },
            // 問卷設計
            {
                ProgId: PGID.Survey,
                Title: "問卷設計",
                DefaultActionCode: "List",
                IconClassName: "fas fa-clipboard-list",
                Actions: [{
                    ActionCode: "List",
                    Title: "問卷設計列表",
                    RoutePath: "List",
                    elementFactory: (ctx) => <Server_Survey_List_Comp title="問卷設計列表" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Form",
                    Title: "問卷設計維護",
                    RoutePath: "Form/:internalId?",
                    elementFactory: (ctx) => <Server_Survey_Form_Comp theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "SubmitList",
                    Title: "問卷回覆列表",
                    RoutePath: "SubmitList",
                    elementFactory: (ctx) => <Server_SurveySubmission_List_Comp title="問卷回覆列表" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "SubmitForm",
                    Title: "問卷回覆表單",
                    RoutePath: "SubmitForm/:internalId",
                    ShowInMenu: false,
                    elementFactory: (ctx) => <Server_SurveySubmission_Form_Comp theme={ctx.theme} lang={ctx.lang} />,
                }],
            },
        ],
    },

    {
        ModuleCode: "MAT",
        Title: "物件資料管理",
        DefaultPath: `/Server/MAT/${PGID.Material}/List`,
        IconClassName: "fas fa-boxes",
        Progs: [
            {
                ProgId: PGID.Material,
                Title: "物件基礎資料",
                DefaultActionCode: "Form",
                IconClassName: "fas fa-box",
                Actions: [{
                    ActionCode: "List",
                    Title: "物件列表",
                    RoutePath: "List",
                    elementFactory: (ctx) => <Server_Material_List_Comp title="物件" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Form",
                    Title: "新增物件",
                    RoutePath: "Form/:internalId?",
                    elementFactory: (ctx) => <Server_Material_Form_Comp title="物件" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "MatCategoryList",
                    Title: "物件類別列表",
                    RoutePath: "MatCategory/List",
                    elementFactory: (ctx) => <Server_MatCategory_List_Comp title="物件類別" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "MatCategory",
                    Title: "新增物件類別",
                    RoutePath: "MatCategory/Form/:internalId?",
                    elementFactory: (ctx) => <Server_MatCategory_Form_Comp progId={PGID.Material} title="類別" theme={ctx.theme} lang={ctx.lang} />,
                }, {
                    ActionCode: "Tag",
                    Title: "物件標籤",
                    RoutePath: "Tag/:internalId?",
                    elementFactory: (ctx) => <Server_Tag_ListForm_Comp progId={PGID.Material} title="標籤" theme={ctx.theme} lang={ctx.lang} />,
                }],
            },
        ],
    },

    {
        ModuleCode: "AccountManage",
        Title: "帳號管理",
        DefaultPath: "/Server/AccountManage/Account/List",
        IconClassName: "fas fa-users-cog",
        Progs: [
            // 帳號
            {
                ProgId: "Account",
                Title: "帳號管理",
                DefaultActionCode: "Form",
                IconClassName: "fas fa-user-cog",
                Actions: [
                    { ActionCode: "List", Title: "帳號列表", RoutePath: "List", elementFactory: (ctx) => <Server_Account_List_Comp theme={ctx.theme} /> },
                    {
                        ActionCode: "Form",
                        Title: "帳號維護",
                        RoutePath: "Form/:internalId?",
                        elementFactory: (ctx) => <Server_Account_Form_Comp theme={ctx.theme} />,
                    },
                    {
                        ActionCode: "ChangePassword",
                        Title: "修改密碼",
                        RoutePath: "ChangePassword",
                        elementFactory: (ctx) => <Server_ChangePassword_Comp theme={ctx.theme} />,
                    },
                    {
                        //  這段Route給系統管理員重置其他用戶密碼的功能
                        ActionCode: "ResetPassword",
                        Title: "重置密碼",
                        RoutePath: "ResetPassword",
                        elementFactory: (ctx) => <Server_ResetPassword_Comp theme={ctx.theme} />,
                    },
                ],
            },
            // 人員
            {
                ProgId: "Person",
                Title: "人員資料",
                DefaultActionCode: "Form",
                IconClassName: "fas fa-id-card",
                Actions: [
                    { ActionCode: "List", Title: "人員列表", RoutePath: "List", elementFactory: (ctx) => <Server_Person_List_Comp theme={ctx.theme} /> },
                    {
                        ActionCode: "Form",
                        Title: "人員維護",
                        RoutePath: "Form/:internalId?",
                        elementFactory: (ctx) => <Server_Person_Form_Comp theme={ctx.theme} />,
                    },
                ],
            },
            // 角色權限
            {
                ProgId: "RolePermission",
                Title: "角色權限",
                DefaultActionCode: "List",
                IconClassName: "fas fa-user-shield",
                Actions: [{
                    ActionCode: "List",
                    Title: "角色列表",
                    RoutePath: "List",
                    elementFactory: (ctx) => <Server_RolePermission_Comp title={"角色列表"} lang={DefaultLang} theme={ctx.theme} />,
                }, {
                    ActionCode: "Form",
                    Title: "角色維護",
                    RoutePath: "Form/:internalId?",
                    elementFactory: (ctx) => <Server_RolePermission_Form_Comp theme={ctx.theme} lang={DefaultLang} />,
                }],
            },
        ],
    },

    { ModuleCode: "Logout", Title: "登出系統", DefaultPath: "/Server/Logout", IconClassName: "far fa-sign-out", Progs: [] },
];
export interface IServerMenuExtModule
{
    extendServerModuleRoutes?: (modules: IModuleMeta[]) => IModuleMeta[];
    default?: (modules: IModuleMeta[]) => IModuleMeta[];
}
export interface IServerMenuExtModule
{
    extendServerModuleRoutes?: (modules: IModuleMeta[]) => IModuleMeta[];
    default?: (modules: IModuleMeta[]) => IModuleMeta[];
}

const getServerModuleRoutes = (): IModuleMeta[] =>
{
    const base = ServerModuleRoutesData;
    const mod = resolveServerMenuExt();
    const extend = mod.extendServerModuleRoutes ?? mod.default;
    if (typeof extend !== "function") return base;
    const next = extend(base);
    return Array.isArray(next) ? next : base;
};
// #endregion

// #region Initialization
/** 只載入目前 SpecCode 的後台擴充路由，避免其他 Spec 被編譯 */
const activeExtModules = import.meta.glob("SpecFeature/Pages/Server/Scaffold/ServerModuleRoutesExtData.tsx", { eager: true }) as Record<string, IServerMenuExtModule>;
/** 載入預設 Spec 擴充路由，作為 fallback */
const defaultExtModules = import.meta.glob("SpecDefault/Pages/Server/Scaffold/ServerModuleRoutesExtData.tsx", { eager: true }) as Record<string, IServerMenuExtModule>;
/** 取得 glob 載入的第一個模組 */
const getFirstExtModule = (modules: Record<string, IServerMenuExtModule>): IServerMenuExtModule =>
{
    const first = Object.values(modules)[0];
    return first ?? {};
};
/** 解析目前 Spec 可用的後台擴充路由 */
const resolveServerMenuExt = (): IServerMenuExtModule =>
{
    const active = getFirstExtModule(activeExtModules);
    if (active.extendServerModuleRoutes || active.default) return active;
    return getFirstExtModule(defaultExtModules);
};
export const ServerModuleRoutes: IModuleMeta[] = getServerModuleRoutes();
// #endregion

// #region Private

// #endregion
