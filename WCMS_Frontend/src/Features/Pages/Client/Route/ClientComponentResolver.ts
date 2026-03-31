// src/Features/Pages/Client/Route/ClientComponentResolver.ts
// 規則：
// 1. 只解析目前 VITE_SPEC_CODE 對應的 Spec 元件（透過 SpecFeature alias）
// 2. 找得到 Spec 元件就用 Spec
// 3. 找不到就直接 fallback 到 Feature base
// 4. 不再讓 _default 介入 component resolver，避免空殼覆蓋 Feature

import type { ComponentType } from "react";

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
// 共用 Resolver：只從「目前 SpecFeature」取對應元件
// 找不到就直接 fallback 到 Feature 版
// ====================================================

export type SpecComponent<TProps = Record<string, never>> = ComponentType<TProps>;
type SpecModule = { default?: unknown; [key: string]: unknown; };

// 只掃目前 build 的 SpecFeature；不要再掃 _default
const specModules = import.meta.glob("SpecFeature/**/*.tsx", { eager: true }) as Record<string, SpecModule>;

/** 路徑正規化，避免 slash 差異造成比對失敗 */
const normalizePath = (value: string): string =>
{
    return `${value ?? ""}`.trim().replace(/\\/g, "/").replace(/^\/+/, "");
};

/** 依照 export 名稱順序挑元件，最後才退 default */
const pickExport = (mod: SpecModule, exportNames: string[] = []): unknown =>
{
    for (const name of exportNames)
    {
        if (name && mod[name]) return mod[name];
    }

    return mod.default;
};

/** 依 suffix 找目前 spec 中的對應檔案 */
const findSpecModuleBySuffix = (relativePath: string): SpecModule | undefined =>
{
    const rel = normalizePath(relativePath);
    const hitKey = Object.keys(specModules).find(key => normalizePath(key).endsWith(rel));
    return hitKey ? specModules[hitKey] : undefined;
};

/** 解析 Spec 元件；找不到就直接回 Feature base */
const resolveSpecComponent = <TComponent>(
    relativePath: string,
    core: TComponent,
    exportNames: string[] = [],
): TComponent =>
{
    const mod = findSpecModuleBySuffix(relativePath);
    if (!mod) return core;

    const resolved = pickExport(mod, exportNames);
    if (!resolved) return core;

    return resolved as TComponent;
};

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
