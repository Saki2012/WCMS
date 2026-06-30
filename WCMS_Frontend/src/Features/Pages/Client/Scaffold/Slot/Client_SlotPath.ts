// #region Property
export type ClientSlotPathKey = keyof typeof ClientSlotPath;
// #endregion

// #region Public
/** 前台 Spec slot 相對路徑集中管理，避免 resolver 與擴充點各自手刻路徑造成漏改。 */
export const ClientSlotPath = {
    Header: "Pages/Client/Scaffold/MainFrame/Header.tsx",
    SubPage: "Pages/Client/Scaffold/SubPages/SubPage.tsx",
    BreadCrumb: "Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp.tsx",
    SubMenu: "Pages/Client/Scaffold/SubPages/Module/SubMenu/SubMenu_Comp.tsx",
    ThirdMenu: "Pages/Client/Scaffold/SubPages/Module/ThirdMenu/ThirdMenu_Comp.tsx",
    HomePage: "Pages/Client/Index/HomePage.tsx",
    HomePageLoader: "Pages/Client/Index/HomePage_Loader.ts",
    Slot_ClientPreviewEntries: "Pages/Client/Scaffold/Preview/Registry/ClientPreviewEntries.tsx",
    Slot_Announcement_List_Comp: "Pages/Client/BizFunc/WEB/Announcement/Client_Announcement_List_Comp.tsx",
    Slot_Announcement_List_Loader: "Pages/Client/BizFunc/WEB/Announcement/Client_Announcement_List_Loader.ts",
    Slot_Announcement_Form_Comp: "Pages/Client/BizFunc/WEB/Announcement/Client_Announcement_Form_Comp.tsx",
    Slot_Announcement_Form_Loader: "Pages/Client/BizFunc/WEB/Announcement/Client_Announcement_Form_Loader.ts",
    Slot_FileArchive_List_Comp: "Pages/Client/BizFunc/WEB/FileArchive/Client_FileArchive_List_Comp.tsx",
    Slot_FileArchive_List_Loader: "Pages/Client/BizFunc/WEB/FileArchive/Client_FileArchive_List_Loader.ts",
    Slot_Gallery_Form_Comp: "Pages/Client/BizFunc/WEB/Gallery/Client_Gallery_Form_Comp.tsx",
    Slot_Gallery_Form_Loader: "Pages/Client/BizFunc/WEB/Gallery/Client_Gallery_Form_Loader.ts",
    Slot_Gallery_List_Comp: "Pages/Client/BizFunc/WEB/Gallery/Client_Gallery_List_Comp.tsx",
    Slot_Gallery_List_Loader: "Pages/Client/BizFunc/WEB/Gallery/Client_Gallery_List_Loader.ts",
    Slot_PageManagement_Form_Comp: "Pages/Client/BizFunc/WEB/PageManagement/Client_PageManagement_Form_Comp.tsx",
    Slot_PageManagement_Form_Loader: "Pages/Client/BizFunc/WEB/PageManagement/Client_PageManagement_Form_Loader.ts",
    Slot_WebResource_List_Comp: "Pages/Client/BizFunc/WEB/WebResource/Client_WebResource_List_Comp.tsx",
    Slot_WebResource_List_Loader: "Pages/Client/BizFunc/WEB/WebResource/Client_WebResource_List_Loader.ts",
    Slot_Timeline_Form_Comp: "Pages/Client/BizFunc/WEB/Timeline/Client_Timeline_Form_Comp.tsx",
    Slot_Timeline_Form_Loader: "Pages/Client/BizFunc/WEB/Timeline/Client_Timeline_Form_Loader.ts",
    Slot_Survey_Form_Comp: "Pages/Client/BizFunc/WEB/Survey/Client_Survey_Form_Comp.tsx",
    Slot_Survey_Form_Loader: "Pages/Client/BizFunc/WEB/Survey/Client_Survey_Form_Loader.ts",
    Slot_Material_List_Comp: "Pages/Client/BizFunc/MAT/Material/Client_Material_List_Comp.tsx",
    Slot_Material_List_Loader: "Pages/Client/BizFunc/MAT/Material/Client_Material_List_Loader.ts",
    Slot_Material_Form_Comp: "Pages/Client/BizFunc/MAT/Material/Client_Material_Form_Comp.tsx",
    Slot_Material_Form_Loader: "Pages/Client/BizFunc/MAT/Material/Client_Material_Form_Loader.ts",
} as const;

/** 以 key 取得 slot path，讓呼叫端接近 nameof 的用法。 */
export const getClientSlotPath = (key: ClientSlotPathKey): string =>
{
    return ClientSlotPath[key];
};
// #endregion
