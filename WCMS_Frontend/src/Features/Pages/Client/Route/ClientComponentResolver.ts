// src/Features/Pages/Client/TS/ClientComponentResolver.ts
// 一支檔案同時處理：
// 1) 解析目前 VITE_SPEC_CODE 對應的 Spec 元件
// 2) 各模組的 Feature 版 + Spec 版 fallback

import type { ComponentType } from "react";

// ---------------- Feature 基準版元件 ----------------

import SubPageBase from "@/Features/Pages/Client/Scaffold/SubPages/SubPage";

import PageManagementFormCompBase, {
    type IPageManagementOptions,
} from "@/Features/Pages/Client/BizFunc/WebManagement/PageManagement/PageManagementForm";

import AnnouncementListBase, {
    type IAnnouncementListOptions,
} from "@/Features/Pages/Client/BizFunc/WebManagement/Announcement/AnnouncementList";

import AnnouncementFormCompBase from "@/Features/Pages/Client/BizFunc/WebManagement/Announcement/AnnouncementForm";

import FileArchiveListBase, {
    type IFileArchiveOptions,
} from "@/Features/Pages/Client/BizFunc/WebManagement/FileArchive/FileArchiveList";

import GalleryListCompBase, {
    type IGalleryListOptions,
} from "@/Features/Pages/Client/BizFunc/WebManagement/Gallery/GalleryList";

import GalleryFormCompBase from "@/Features/Pages/Client/BizFunc/WebManagement/Gallery/GalleryForm";

import WebResourceListCompBase, {
    type IWebResourceListOptions,
} from "@/Features/Pages/Client/BizFunc/WebManagement/WebResource/WebResourceList";

// ====================================================
// 共用 Resolver：依 VITE_SPEC_CODE 從 SpecFetures 取對應元件
// 找不到就 fallback 到 Feature 版
// ====================================================

export type SpecComponent<TProps = any> = ComponentType<TProps>;

const SPEC_CODE = import.meta.env.VITE_SPEC_CODE as string | undefined;

// 注意：專案實際資料夾是 src/SpecFetures（少一個 a）
// 如果之後你改成 SpecFeatures，要記得這邊一起調整
const specModules = import.meta.glob("/src/SpecFetures/*/**/*.tsx", {
    eager: true,
}) as Record<string, any>;

/**
 * relativePath: 從 "SpecFetures/{specCode}" 開始算的路徑
 *               例如 "Pages/Client/Scaffold/SubPages/SubPage.tsx"
 * core:         Feature 基準版元件
 * exportName:   如果 Spec 檔是 named export，就給它 export 名稱
 *               如果 Spec 檔有 default export，可以不給（或給 undefined）
 */
function resolveSpecComponent<TComponent>(relativePath: string, core: TComponent, exportName?: string): TComponent
{
    if (!SPEC_CODE) return core;
    const key = `/src/SpecFetures/${SPEC_CODE}/${relativePath}`;
    const mod = specModules[key];
    if (!mod) return core;
    const resolved = exportName && mod[exportName] ? mod[exportName] : mod.default;
    return (resolved ?? core) as TComponent;
}

// ====================================================
// 各模組對外輸出的「已套用 Spec 的元件」
// 之後 ClientRouter 一律從這裡 import
// ====================================================

// SubPage（1810/1816... Spec 裡請 export const SubPage = ...）
export const SubPage = resolveSpecComponent("Pages/Client/Scaffold/SubPages/SubPage.tsx", SubPageBase, "SubPage");

// PageManagement Form
export const PageManagementForm: typeof PageManagementFormCompBase = resolveSpecComponent(
    "Pages/Client/BizFunc/WebManagement/PageManagement/PageManagementForm.tsx",
    PageManagementFormCompBase,
    "PageManagementForm",
);

// Announcement List
export const AnnouncementList = resolveSpecComponent(
    "Pages/Client/BizFunc/WebManagement/Announcement/AnnouncementList.tsx",
    AnnouncementListBase,
    "AnnouncementList",
);

export const AnnouncementForm: typeof AnnouncementFormCompBase = resolveSpecComponent(
    "Pages/Client/BizFunc/WebManagement/Announcement/AnnouncementForm.tsx",
    AnnouncementFormCompBase,
    "AnnouncementForm",
);

// FileArchive List
export const FileArchiveList = resolveSpecComponent(
    "Pages/Client/BizFunc/WebManagement/FileArchive/FileArchiveList.tsx",
    FileArchiveListBase,
    "FileArchiveList",
);

// Gallery List
export const GalleryListComp = resolveSpecComponent(
    "Pages/Client/BizFunc/WebManagement/Gallery/GalleryList.tsx",
    GalleryListCompBase,
    "GalleryListComp",
);

// Gallery Form
export const GalleryForm = resolveSpecComponent(
    "Pages/Client/BizFunc/WebManagement/Gallery/GalleryForm.tsx",
    GalleryFormCompBase,
    "GalleryFormComp",
);

// WebResource List
export const WebResourceListComp = resolveSpecComponent(
    "Pages/Client/BizFunc/WebManagement/WebResource/WebResourceList.tsx",
    WebResourceListCompBase,
    "WebResourceListComp",
);

// Options 型別也一起 re-export，讓 ClientRouter 只依賴這支檔案
export type {
    IAnnouncementListOptions,
    IFileArchiveOptions,
    IGalleryListOptions,
    IPageManagementOptions,
    IWebResourceListOptions,
};
