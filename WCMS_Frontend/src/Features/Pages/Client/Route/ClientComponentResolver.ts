// src/Features/Pages/Client/Route/ClientComponentResolver.ts
// 規則：
// 1. 只解析目前 VITE_SPEC_CODE 對應的 Spec 元件（透過 SpecFeature alias）
// 2. 找得到 Spec 元件就用 Spec
// 3. 找不到就直接 fallback 到 Feature base
// 4. 不再讓 _default 介入 component resolver，避免空殼覆蓋 Feature
import { HomePage as DefaultHomePage } from "@/Features/Pages/Client/Index/HomePage";
import { HomePageLoader as HomePageLoaderBase } from "@/Features/Pages/Client/Index/HomePage_Loader";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import { resolveSpecComponent, resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";
// ---------------- Feature 基準版元件 ----------------
import AnnouncementFormCompBase from "@/Features/Pages/Client/BizFunc/WEB/Announcement/AnnouncementForm";
import AnnouncementListBase, { type IAnnouncementListOptions } from "@/Features/Pages/Client/BizFunc/WEB/Announcement/AnnouncementList";
import FileArchiveListBase, { type IFileArchiveOptions } from "@/Features/Pages/Client/BizFunc/WEB/FileArchive/FileArchiveList";
import GalleryFormCompBase from "@/Features/Pages/Client/BizFunc/WEB/Gallery/GalleryForm_Comp";
import GalleryListCompBase from "@/Features/Pages/Client/BizFunc/WEB/Gallery/GalleryList_Comp";
import type { IGalleryListOptions } from "@/Features/Pages/Client/BizFunc/WEB/Gallery/GalleryList_Loader";
import PageManagementFormCompBase from "@/Features/Pages/Client/BizFunc/WEB/PageManagement/PageManagementForm_Comp";
import type { IPageManagementOptions } from "@/Features/Pages/Client/BizFunc/WEB/PageManagement/PageManagementForm_Loader";
import WebResourceListCompBase, { type IWebResourceListOptions } from "@/Features/Pages/Client/BizFunc/WEB/WebResource/WebResourceList";
import SubPageBase from "@/Features/Pages/Client/Scaffold/SubPages/SubPage";

// ====================================================
// 共用 Resolver 已收斂到 SlotResolver.ts
// 這邊只保留各模組的 core + export mapping
// ====================================================

// ====================================================
// 各模組對外輸出的「已套用 Spec 的元件」
// 之後 ClientRouter 一律從這裡 import
// ====================================================

// SubPage
export const SubPage: typeof SubPageBase = resolveSpecComponent(getClientSlotPath("SubPage"), SubPageBase, ["SubPage", "default"]);

// HomePage
export const HomePage: typeof DefaultHomePage = resolveSpecComponent(getClientSlotPath("HomePage"), DefaultHomePage, ["HomePage", "default"]);

export const HomePageLoader: typeof HomePageLoaderBase = resolveSpecFunc(getClientSlotPath("HomePageLoader"), HomePageLoaderBase, [
    "HomePageLoader",
    "default",
]);
// PageManagement Form
export const PageManagementForm: typeof PageManagementFormCompBase = resolveSpecComponent(
    getClientSlotPath("PageManagementForm"),
    PageManagementFormCompBase,
    ["PageManagementFormComp", "PageManagementForm", "default"],
);

// Announcement List
export const AnnouncementList = resolveSpecComponent(getClientSlotPath("AnnouncementList"), AnnouncementListBase, [
    "AnnouncementList",
    "AnnouncementListComp",
    "default",
]);

// Announcement Form
export const AnnouncementForm: typeof AnnouncementFormCompBase = resolveSpecComponent(
    getClientSlotPath("AnnouncementForm"),
    AnnouncementFormCompBase,
    ["AnnouncementFormComp", "AnnouncementForm", "default"],
);

// FileArchive List
export const FileArchiveList = resolveSpecComponent(getClientSlotPath("FileArchiveList"), FileArchiveListBase, [
    "FileArchiveList",
    "FileArchiveListComp",
    "default",
]);

// Gallery List
export const GalleryListComp = resolveSpecComponent(getClientSlotPath("GalleryList"), GalleryListCompBase, [
    "GalleryListComp",
    "GalleryList",
    "default",
]);

// Gallery Form
export const GalleryForm = resolveSpecComponent(getClientSlotPath("GalleryForm"), GalleryFormCompBase, [
    "GalleryFormComp",
    "GalleryForm",
    "default",
]);

// WebResource List
export const WebResourceListComp = resolveSpecComponent(getClientSlotPath("WebResourceList"), WebResourceListCompBase, [
    "WebResourceListComp",
    "WebResourceList",
    "default",
]);

// Options 型別一起 re-export，讓 ClientRouter 只依賴這支
export type { IAnnouncementListOptions, IFileArchiveOptions, IGalleryListOptions, IPageManagementOptions, IWebResourceListOptions };
