// #region Property
export type ClientSlotPathKey = keyof typeof ClientSlotPath;
// #endregion

// #region Public
/** 前台 Spec slot 相對路徑集中管理，避免 resolver 與擴充點各自手刻路徑造成漏改。 */
export const ClientSlotPath = {
    SubPage: "Pages/Client/Scaffold/SubPages/SubPage.tsx",
    HomePage: "Pages/Client/Index/HomePage.tsx",
    HomePageLoader: "Pages/Client/Index/HomePage_Loader.ts",
    PageManagementForm: "Pages/Client/BizFunc/WEB/PageManagement/PageManagementForm.tsx",
    AnnouncementList: "Pages/Client/BizFunc/WEB/Announcement/AnnouncementList.tsx",
    AnnouncementForm: "Pages/Client/BizFunc/WEB/Announcement/AnnouncementForm.tsx",
    FileArchiveList: "Pages/Client/BizFunc/WEB/FileArchive/FileArchiveList.tsx",
    FileArchiveListLoader: "Pages/Client/BizFunc/WEB/FileArchive/FileArchiveList_Loader.ts",
    GalleryList: "Pages/Client/BizFunc/WEB/Gallery/GalleryList.tsx",
    GalleryForm: "Pages/Client/BizFunc/WEB/Gallery/GalleryForm.tsx",
    WebResourceList: "Pages/Client/BizFunc/WEB/WebResource/WebResourceList.tsx",
} as const;

/** 以 key 取得 slot path，讓呼叫端接近 nameof 的用法。 */
export const getClientSlotPath = (key: ClientSlotPathKey): string =>
{
    return ClientSlotPath[key];
};
// #endregion
