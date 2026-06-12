// src/Features/Pages/Client/Route/ClientComponentResolver.ts
// 規則：
// 1. 只解析目前 VITE_SPEC_CODE 對應的 Spec 元件（透過 SpecFeature alias）
// 2. 找得到 Spec 元件就用 Spec
// 3. 找不到就直接 fallback 到 Feature base
// 4. 不再讓 _default 介入 component resolver，避免空殼覆蓋 Feature

import { Client_Announcement_Form as AnnouncementFormBase } from "@/Features/Pages/Client/BizFunc/WEB/Announcement/Client_Announcement_Form_Comp";
import { Client_Announcement_List as AnnouncementListBase, type IAnnouncementListOptions } from "@/Features/Pages/Client/BizFunc/WEB/Announcement/Client_Announcement_List_Comp";
import { Client_FileArchive_List as FileArchiveListBase, type IFileArchiveOptions } from "@/Features/Pages/Client/BizFunc/WEB/FileArchive/Client_FileArchive_List_Comp";
import { Client_Gallery_Form as GalleryFormBase } from "@/Features/Pages/Client/BizFunc/WEB/Gallery/Client_Gallery_Form_Comp";
import { Client_Gallery_List as GalleryListBase } from "@/Features/Pages/Client/BizFunc/WEB/Gallery/Client_Gallery_List_Comp";
import type { IGalleryListOptions } from "@/Features/Pages/Client/BizFunc/WEB/Gallery/Client_Gallery_List_Loader";
import { Client_PageManagement_Form as PageManagementFormBase } from "@/Features/Pages/Client/BizFunc/WEB/PageManagement/Client_PageManagement_Form_Comp";
import type { IPageManagementOptions } from "@/Features/Pages/Client/BizFunc/WEB/PageManagement/Client_PageManagement_Form_Loader";
import { Client_WebResource_List_Comp as WebResourceListBase, type IWebResourceListOptions } from "@/Features/Pages/Client/BizFunc/WEB/WebResource/Client_WebResource_List_Comp";
import { HomePage as HomePageBase } from "@/Features/Pages/Client/Index/HomePage";
import { HomePageLoader as HomePageLoaderBase } from "@/Features/Pages/Client/Index/HomePage_Loader";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import { SubPage as SubPageBase } from "@/Features/Pages/Client/Scaffold/SubPages/SubPage";
import { resolveSpecComponent, resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";

// #region Property
// Options 型別一起 re-export，讓 ClientRouter 不需要直接依賴各功能 Comp。
export type {
    IAnnouncementListOptions,
    IFileArchiveOptions,
    IGalleryListOptions,
    IPageManagementOptions,
    IWebResourceListOptions,
};
// #endregion

// #region Initialization
// SubPage
export const SubPage: typeof SubPageBase = resolveSpecComponent(getClientSlotPath("SubPage"), SubPageBase, ["SubPage", "default"]);
// HomePage
export const HomePage: typeof HomePageBase = resolveSpecComponent(getClientSlotPath("HomePage"), HomePageBase, ["HomePage", "default"]);
// HomePage Loader
export const HomePageLoader: typeof HomePageLoaderBase = resolveSpecFunc(getClientSlotPath("HomePageLoader"), HomePageLoaderBase, ["HomePageLoader", "default"]);
// PageManagement Form
export const PageManagementForm: typeof PageManagementFormBase = resolveSpecComponent(getClientSlotPath("Slot_PageManagement_Form_Comp"), PageManagementFormBase, ["PageManagementFormComp", "PageManagementForm", "default"]);
// Announcement List
export const AnnouncementList: typeof AnnouncementListBase = resolveSpecComponent(getClientSlotPath("Slot_Announcement_List_Comp"), AnnouncementListBase, ["AnnouncementList", "AnnouncementListComp", "default"]);
// Announcement Form
export const AnnouncementForm: typeof AnnouncementFormBase = resolveSpecComponent(getClientSlotPath("Slot_Announcement_Form_Comp"), AnnouncementFormBase, ["AnnouncementFormComp", "AnnouncementForm", "default"]);
// FileArchive List
export const FileArchiveList: typeof FileArchiveListBase = resolveSpecComponent(getClientSlotPath("Slot_FileArchive_List_Comp"), FileArchiveListBase, ["FileArchiveList", "FileArchiveListComp", "default"]);
// Gallery List
export const GalleryListComp: typeof GalleryListBase = resolveSpecComponent(getClientSlotPath("Slot_Gallery_List_Comp"), GalleryListBase, ["GalleryListComp", "GalleryList", "default"]);
// Gallery Form
export const GalleryForm: typeof GalleryFormBase = resolveSpecComponent(getClientSlotPath("Slot_Gallery_Form_Comp"), GalleryFormBase, ["GalleryFormComp", "GalleryForm", "default"]);
// WebResource List
export const WebResourceListComp: typeof WebResourceListBase = resolveSpecComponent(getClientSlotPath("Slot_WebResource_List_Comp"), WebResourceListBase, ["WebResourceListComp", "WebResourceList", "default"]);
// #endregion
