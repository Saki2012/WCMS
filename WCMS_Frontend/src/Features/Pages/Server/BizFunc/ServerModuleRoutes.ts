import { SpecPGID } from "@/SpecFetures/1817/Hooks/Common/SpecProgId";

export interface IModuleMeta
{
    /** 模組代碼：網站功能 / 帳號管理 / 系統設定… */
    ModuleCode: string; // 例: "WebManagement"
    /** 顯示名稱（第一層 menu 的字） */
    Title: string; // 例: "網站功能"
    /** 點這個模組時預設導向的路徑 */
    DefaultPath: string; // 例: "/Server/WebManagement/Announcement/List"
    /** Icon className（要的話可以顯示在左側） */
    IconClassName?: string;
    /** 底下有哪些 Prog（公告 / 廣告輪播 / 頁面…） */
    Progs: IProgMeta[];
}
export interface IProgMeta
{
    /** 所屬模組（網站功能 / 帳號管理 …） */
    ModuleCode: IModuleMeta["ModuleCode"]; // 例: "WebManagement"
    /** 程式單元代碼，對應後端既有的 ProgId */
    ProgId: string; // 例: "Announcement"
    /** 顯示名稱（側邊第二層顯示的字） */
    Title: string; // 例: "公告"
    /** Icon className（要的話可以顯示在左側） */
    IconClassName: string;
    /** 點這個 Prog 時預設要進哪一個 Action */
    DefaultActionCode: IActionMeta["ActionCode"]; // 例: "List"
    /** 這個程式底下有哪些實際功能（Action） */
    Actions: IActionMeta[];
}
export interface IActionMeta
{
    /** 所屬程式單元（後端原本的 ProgId） */
    ProgId: IProgMeta["ProgId"]; // 例: "Announcement"
    /** 功能代碼：同一個 Prog 底下的動作代碼 */
    ActionCode: string; // 例: "List" | "Create" | "Category"
    /** 顯示名稱（之後可以改成 i18nKey） */
    Title: string; // 例: "列表", "新增", "類別管理"
    /** 需要哪些權限才看得到 / 進得去（之後串 RolePermission 用） */
    // RequiredPermissions?: PermissionCode[];
}

export const ServerModuleRoutes: IModuleMeta[] = [
    // #region Dashboard （網站管理）
    {
        ModuleCode: "Dashboard",
        Title: "網站管理",
        DefaultPath: "/Server/Dashboard/SiteMenu",
        IconClassName: "fas fa-tachometer-alt",
        Progs: [
            {
                ModuleCode: "Dashboard",
                ProgId: "SiteMenu",
                Title: "網站導覽",
                DefaultActionCode: "List",
                IconClassName: "",
                Actions: [
                    { ProgId: "SiteMenu", ActionCode: "List", Title: "網站導覽" },
                ],
            },
        ],
    },
    // #endregion

    // #region 網站功能管理模組
    {
        ModuleCode: "WebManagement",
        Title: "網站功能管理",
        DefaultPath: "/Server/WebManagement/Announcement/List",
        IconClassName: "fas fa-globe",
        Progs: [
            // 廣告輪播
            {
                ModuleCode: "WebManagement",
                ProgId: "BannerSlider",
                Title: "廣告輪播",
                DefaultActionCode: "List",
                IconClassName: "fas fa-bring-front",
                Actions: [
                    { ProgId: "BannerSlider", ActionCode: "List", Title: "廣告輪播列表" },
                    { ProgId: "BannerSlider", ActionCode: "Form", Title: "廣告輪播設定" },
                ],
            },

            // 公告
            {
                ModuleCode: "WebManagement",
                ProgId: "Announcement",
                Title: "公告",
                DefaultActionCode: "List",
                IconClassName: "fas fa-bullhorn",
                Actions: [
                    { ProgId: "Announcement", ActionCode: "List", Title: "公告列表" },
                    { ProgId: "Announcement", ActionCode: "Form", Title: "公告維護" },
                    { ProgId: "Announcement", ActionCode: "Category", Title: "公告類別" },
                    { ProgId: "Announcement", ActionCode: "Tag", Title: "公告標籤" },
                ],
            },

            // 頁面管理
            {
                ModuleCode: "WebManagement",
                ProgId: "PageManagement",
                Title: "頁面管理",
                DefaultActionCode: "List",
                IconClassName: "fas fa-file-signature",
                Actions: [
                    { ProgId: "PageManagement", ActionCode: "List", Title: "頁面列表" },
                    { ProgId: "PageManagement", ActionCode: "Form", Title: "頁面維護" },
                    { ProgId: "PageManagement", ActionCode: "Category", Title: "頁面類別" },
                ],
            },

            // 相簿
            {
                ModuleCode: "WebManagement",
                ProgId: "Gallery",
                Title: "相簿",
                DefaultActionCode: "List",
                IconClassName: "fas fa-images",
                Actions: [
                    { ProgId: "Gallery", ActionCode: "List", Title: "相簿列表" },
                    { ProgId: "Gallery", ActionCode: "Form", Title: "相簿維護" },
                    { ProgId: "Gallery", ActionCode: "Category", Title: "相簿類別" },
                    { ProgId: "Gallery", ActionCode: "Tag", Title: "相簿標籤" },
                ],
            },

            // 檔案室
            {
                ModuleCode: "WebManagement",
                ProgId: "FileArchive",
                Title: "檔案室",
                DefaultActionCode: "List",
                IconClassName: "fas fa-cabinet-filing",
                Actions: [
                    { ProgId: "FileArchive", ActionCode: "List", Title: "檔案室列表" },
                    { ProgId: "FileArchive", ActionCode: "Form", Title: "檔案室維護" },
                    { ProgId: "FileArchive", ActionCode: "Category", Title: "檔案類別" },
                    { ProgId: "FileArchive", ActionCode: "Tag", Title: "檔案標籤" },
                ],
            },

            // 網路資源
            {
                ModuleCode: "WebManagement",
                ProgId: "WebResource",
                Title: "網路資源",
                DefaultActionCode: "List",
                IconClassName: "fas fa-link",
                Actions: [
                    { ProgId: "WebResource", ActionCode: "List", Title: "網路資源列表" },
                    { ProgId: "WebResource", ActionCode: "Form", Title: "網路資源維護" },
                    { ProgId: "WebResource", ActionCode: "Category", Title: "資源類別" },
                    { ProgId: "WebResource", ActionCode: "Tag", Title: "資源標籤" },
                ],
            },
            // 研究計畫 (SpecResearch)
            // {
            //     ModuleCode: "WebManagement",
            //     ProgId: "SpecResearch",
            //     Title: "研究計畫",
            //     DefaultActionCode: "List",
            //     IconClassName: "fas fa-search",
            //     Actions: [
            //         { ProgId: "SpecResearch", ActionCode: "List", Title: "研究計畫列表" },
            //         { ProgId: "SpecResearch", ActionCode: "Form", Title: "研究計畫維護" },
            //         { ProgId: "SpecResearch", ActionCode: "SpecCategory", Title: "研究計畫類別" },
            //         { ProgId: "SpecResearch", ActionCode: "Tag", Title: "研究計畫標籤" },
            //     ],
            // },

            // // USR (SpecUSR)
            // {
            //     ModuleCode: "WebManagement",
            //     ProgId: "SpecUSR",
            //     Title: "USR",
            //     DefaultActionCode: "List",
            //     IconClassName: "fas fa-university",
            //     Actions: [
            //         { ProgId: "SpecUSR", ActionCode: "List", Title: "USR列表" },
            //         { ProgId: "SpecUSR", ActionCode: "Form", Title: "USR維護" },
            //         { ProgId: "SpecUSR", ActionCode: "SpecCategory", Title: "USR類別" },
            //         { ProgId: "SpecUSR", ActionCode: "Tag", Title: "USR標籤" },
            //     ],
            // },

            // // 開館時間規則設定(Spec)
            // {
            //     ModuleCode: "Dashboard",
            //     ProgId: "SpecOpenScheduleRule",
            //     Title: "開館時間規則設定",
            //     DefaultActionCode: "List",
            //     IconClassName: "fas fa-university",
            //     Actions: [
            //         { ProgId: "SpecOpenScheduleRule", ActionCode: "List", Title: "列表" },
            //         { ProgId: "SpecOpenScheduleRule", ActionCode: "Form", Title: "新增規則" },
            //     ],
            // },
            // 琵琶介紹(Spec)
            {
                ModuleCode: "WebManagement",
                ProgId: SpecPGID.SpecMusical,
                Title: "琵琶介紹",
                DefaultActionCode: "List",
                IconClassName: "fas fa-music",
                Actions: [
                    { ProgId: SpecPGID.SpecMusical, ActionCode: "List", Title: "琵琶列表" },
                    { ProgId: SpecPGID.SpecMusical, ActionCode: "Form", Title: "新增資料" },
                    { ProgId: SpecPGID.SpecMusical, ActionCode: "Category", Title: "類別" },
                ],
            },
        ],
    },
    // #endregion

    // #region 帳號管理模組
    {
        ModuleCode: "AccountManage",
        Title: "帳號管理",
        DefaultPath: "/Server/AccountManage/Account/List",
        IconClassName: "fas fa-users-cog",
        Progs: [
            // 帳號
            {
                ModuleCode: "AccountManage",
                ProgId: "Account",
                Title: "帳號",
                DefaultActionCode: "List",
                IconClassName: "",
                Actions: [
                    { ProgId: "Account", ActionCode: "List", Title: "帳號列表" },
                    { ProgId: "Account", ActionCode: "Form", Title: "帳號維護" },
                    { ProgId: "Account", ActionCode: "ResetPassword", Title: "重設密碼" },
                ],
            },
            // 人員
            {
                ModuleCode: "AccountManage",
                ProgId: "Person",
                Title: "人員",
                DefaultActionCode: "List",
                IconClassName: "",
                Actions: [
                    { ProgId: "Person", ActionCode: "List", Title: "人員列表" },
                    { ProgId: "Person", ActionCode: "Form", Title: "人員維護" },
                ],
            },
        ],
    },
    // #endregion

    // #region 登出系統
    {
        ModuleCode: "Logout",
        Title: "登出系統",
        DefaultPath: "/Server/Logout",
        IconClassName: "far fa-sign-out",
        Progs: [],
    },
    // #endregion
];
