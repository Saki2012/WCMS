// src/Features/Pages/Client/TS/ClientComponentResolver.ts
// 一支檔案同時處理：
// 1) 解析目前 VITE_SPEC_CODE 對應的 Spec 元件（只掃 SpecFeature，不掃全部 Spec）
// 2) 各模組的 Feature 版 + Spec 版 fallback（可選 _default 再 fallback）

import type { ComponentType } from "react";

// ---------------- Feature 基準版元件 ----------------

import SubPageBase from "@/Features/Pages/Client/Scaffold/SubPages/SubPage";

import PageManagementFormCompBase, {
    type IPageManagementOptions,
} from "@/Features/Pages/Client/BizFunc/WebManagement/PageManagement/PageManagementForm_Comp";

import AnnouncementListBase, {
    type IAnnouncementListOptions,
} from "@/Features/Pages/Client/BizFunc/WebManagement/Announcement/AnnouncementList";

import AnnouncementFormCompBase from "@/Features/Pages/Client/BizFunc/WebManagement/Announcement/AnnouncementForm";

import FileArchiveListBase, {
    type IFileArchiveOptions,
} from "@/Features/Pages/Client/BizFunc/WebManagement/FileArchive/FileArchiveList";

import GalleryListCompBase, {
    type IGalleryListOptions,
} from "@/Features/Pages/Client/BizFunc/WebManagement/Gallery/GalleryList_Comp";

import GalleryFormCompBase from "@/Features/Pages/Client/BizFunc/WebManagement/Gallery/GalleryForm_Comp";

import WebResourceListCompBase, {
    type IWebResourceListOptions,
} from "@/Features/Pages/Client/BizFunc/WebManagement/WebResource/WebResourceList";

// ====================================================
// 共用 Resolver：只從「目前 SpecFeature」取對應元件
// 找不到就 fallback 到 Feature 版（可選再 fallback 到 _default）
// ====================================================

export type SpecComponent<TProps = Record<string, never>> = ComponentType<TProps>;

type SpecModule = {
    default?: unknown;
    [key: string]: unknown;
};

/**
 * ✅ 關鍵：不要用 /src/SpecFetures/* 這種 wildcard
 * - SpecFeature 由 vite.config.ts alias 指向 /src/SpecFetures/{VITE_SPEC_CODE}
 * - 所以這個 glob 只會把「當前 spec」打包進來
 */
const specModules = import.meta.glob("SpecFeature/**/*.tsx", {
    eager: true,
}) as Record<string, SpecModule>;

/**
 * （可選）_default fallback
 * 需要 vite.config.ts alias：SpecDefault -> /src/SpecFetures/_default
 * 你若還沒加 SpecDefault，也可以先留著，不用的話不會影響功能。
 */
const defaultModules = import.meta.glob("SpecDefault/**/*.tsx", {
    eager: true,
}) as Record<string, SpecModule>;

const normalizeRelativePath = (relativePath: string): string => {
    // 🔧 避免傳入以 / 開頭導致 key 對不上
    return (relativePath ?? "").trim().replace(/^\/+/, "");
};

const pickExport = (mod: SpecModule, exportName?: string): unknown => {
    // 🔧 named export 優先，否則吃 default
    if (exportName && mod[exportName]) return mod[exportName];
    return mod.default;
};

const resolveFromModules = <TComponent,>(
    modules: Record<string, SpecModule>,
    key: string,
    core: TComponent,
    exportName?: string,
): TComponent => {
    const mod = modules[key];
    if (!mod) return core;

    const resolved = pickExport(mod, exportName);
    if (!resolved) return core;

    // 🔧 這裡是「Spec 覆蓋 Feature」的型別橋接點
    return resolved as TComponent;
};

/**
 * relativePath: 從 SpecFeature 開始算的路徑
 *               例如 "Pages/Client/Scaffold/SubPages/SubPage.tsx"
 * core:         Feature 基準版元件
 * exportName:   Spec 檔若是 named export，就給它 export 名稱；default export 則可不給
 */
function resolveSpecComponent<TComponent>(
    relativePath: string,
    core: TComponent,
    exportName?: string,
): TComponent {
    const rel = normalizeRelativePath(relativePath);

    // SpecFeature/{rel}
    const specKey = `SpecFeature/${rel}`;
    const hit = resolveFromModules(specModules, specKey, core, exportName);
    if (hit !== core) return hit;

    // SpecDefault/{rel}（可選 fallback）
    const defaultKey = `SpecDefault/${rel}`;
    return resolveFromModules(defaultModules, defaultKey, core, exportName);
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