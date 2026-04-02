// src/Features/Pages/Client/Route/ClientComponentResolver.ts
// 規則：
// 1. 只解析目前 VITE_SPEC_CODE 對應的 Spec 元件（透過 SpecFeature alias）
// 2. 找得到 Spec 元件就用 Spec
// 3. 找不到就直接 fallback 到 Feature base
// 4. 不再讓 _default 介入 component resolver，避免空殼覆蓋 Feature

import { resolveSpecComponent, resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";
import HomePageBase from "SpecFeature/Pages/Client/Index/HomePage";
import { HomePageLoader as HomePageLoaderBase } from "SpecFeature/Pages/Client/Index/HomePage_Loader";

// ---------------- Feature 基準版元件 ----------------
import AnnouncementFormCompBase from "@/Features/Pages/Client/BizFunc/WebManagement/Announcement/AnnouncementForm";
import AnnouncementListBase, {
    type IAnnouncementListOptions,
} from "@/Features/Pages/Client/BizFunc/WebManagement/Announcement/AnnouncementList";
import FileArchiveListBase, {
    type IFileArchiveOptions,
} from "@/Features/Pages/Client/BizFunc/WebManagement/FileArchive/FileArchiveList";
import GalleryFormCompBase from "@/Features/Pages/Client/BizFunc/WebManagement/Gallery/GalleryForm_Comp";
import GalleryListCompBase from "@/Features/Pages/Client/BizFunc/WebManagement/Gallery/GalleryList_Comp";
import type { IGalleryListOptions } from "@/Features/Pages/Client/BizFunc/WebManagement/Gallery/GalleryList_Loader";
import PageManagementFormCompBase from "@/Features/Pages/Client/BizFunc/WebManagement/PageManagement/PageManagementForm_Comp";
import type { IPageManagementOptions } from "@/Features/Pages/Client/BizFunc/WebManagement/PageManagement/PageManagementForm_Loader";
import WebResourceListCompBase, {
    type IWebResourceListOptions,
} from "@/Features/Pages/Client/BizFunc/WebManagement/WebResource/WebResourceList";
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
export const SubPage = resolveSpecComponent(
    "Pages/Client/Scaffold/SubPages/SubPage.tsx",
    SubPageBase,
    ["SubPage", "default"],
);

// HomePage
export const HomePage: typeof HomePageBase = resolveSpecComponent(
    "Pages/Client/Index/HomePage.tsx",
    HomePageBase,
    ["HomePage", "default"],
);

// HomePage Loader
export const HomePageLoader: typeof HomePageLoaderBase = resolveSpecFunc(
    "Pages/Client/Index/HomePage_Loader.ts",
    HomePageLoaderBase,
    ["HomePageLoader", "default"],
);

// PageManagement Form
export const PageManagementForm: typeof PageManagementFormCompBase = resolveSpecComponent(
    "Pages/Client/BizFunc/WebManagement/PageManagement/PageManagementForm.tsx",
    PageManagementFormCompBase,
    ["PageManagementFormComp", "PageManagementForm", "default"],
);

// Announcement List
export const AnnouncementList = resolveSpecComponent(
    "Pages/Client/BizFunc/WebManagement/Announcement/AnnouncementList.tsx",
    AnnouncementListBase,
    ["AnnouncementList", "AnnouncementListComp", "default"],
);

// Announcement Form
export const AnnouncementForm: typeof AnnouncementFormCompBase = resolveSpecComponent(
    "Pages/Client/BizFunc/WebManagement/Announcement/AnnouncementForm.tsx",
    AnnouncementFormCompBase,
    ["AnnouncementFormComp", "AnnouncementForm", "default"],
);

// FileArchive List
export const FileArchiveList = resolveSpecComponent(
    "Pages/Client/BizFunc/WebManagement/FileArchive/FileArchiveList.tsx",
    FileArchiveListBase,
    ["FileArchiveList", "FileArchiveListComp", "default"],
);

// Gallery List
export const GalleryListComp = resolveSpecComponent(
    "Pages/Client/BizFunc/WebManagement/Gallery/GalleryList.tsx",
    GalleryListCompBase,
    ["GalleryListComp", "GalleryList", "default"],
);

// Gallery Form
export const GalleryForm = resolveSpecComponent(
    "Pages/Client/BizFunc/WebManagement/Gallery/GalleryForm.tsx",
    GalleryFormCompBase,
    ["GalleryFormComp", "GalleryForm", "default"],
);

// WebResource List
export const WebResourceListComp = resolveSpecComponent(
    "Pages/Client/BizFunc/WebManagement/WebResource/WebResourceList.tsx",
    WebResourceListCompBase,
    ["WebResourceListComp", "WebResourceList", "default"],
);

// Options 型別一起 re-export，讓 ClientRouter 只依賴這支
export type {
    IAnnouncementListOptions,
    IFileArchiveOptions,
    IGalleryListOptions,
    IPageManagementOptions,
    IWebResourceListOptions,
};
