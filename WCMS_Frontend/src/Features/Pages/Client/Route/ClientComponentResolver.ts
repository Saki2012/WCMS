// src/Features/Pages/Client/Route/ClientComponentResolver.ts
// 一支檔案同時處理：
// 1) 解析目前 VITE_SPEC_CODE 對應的 Spec 元件（只掃 SpecFeature，不掃全部 Spec）
// 2) 各模組的 Feature 版 + Spec 版 fallback（可選 _default 再 fallback）

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
// 找不到就 fallback 到 Feature 版（可選再 fallback 到 _default）
// ====================================================

export type SpecComponent<TProps = Record<string, never>> = ComponentType<TProps>;

type SpecModule = { default?: unknown; [key: string]: unknown; };

const specModules = import.meta.glob("SpecFeature/**/*.tsx", { eager: true }) as Record<string, SpecModule>;
const defaultModules = import.meta.glob("SpecDefault/**/*.tsx", { eager: true }) as Record<string, SpecModule>;

const normalizePath = (value: string): string =>
{
    return `${value ?? ""}`.trim().replace(/\\/g, "/").replace(/^\/+/, "");
};

const pickExport = (mod: SpecModule, exportNames: string[] = []): unknown =>
{
    for (const name of exportNames)
    {
        if (name && mod[name]) return mod[name];
    }

    return mod.default;
};

const findModuleBySuffix = (modules: Record<string, SpecModule>, relativePath: string): SpecModule | undefined =>
{
    const rel = normalizePath(relativePath);
    const hitKey = Object.keys(modules).find(key => normalizePath(key).endsWith(rel));
    return hitKey ? modules[hitKey] : undefined;
};

const resolveFromModules = <TComponent>(
    modules: Record<string, SpecModule>,
    relativePath: string,
    core: TComponent,
    exportNames: string[] = [],
): TComponent =>
{
    const mod = findModuleBySuffix(modules, relativePath);
    if (!mod) return core;

    const resolved = pickExport(mod, exportNames);
    if (!resolved) return core;

    return resolved as TComponent;
};

function resolveSpecComponent<TComponent>(
    relativePath: string,
    core: TComponent,
    exportNames: string[] = [],
): TComponent
{
    const rel = normalizePath(relativePath);

    const fromSpec = resolveFromModules(specModules, rel, core, exportNames);
    if (fromSpec !== core) return fromSpec;

    return resolveFromModules(defaultModules, rel, core, exportNames);
}

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

// Options 型別也一起 re-export，讓 ClientRouter 只依賴這支檔案
export type {
    IAnnouncementListOptions,
    IFileArchiveOptions,
    IGalleryListOptions,
    IPageManagementOptions,
    IWebResourceListOptions,
};
