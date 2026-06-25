import type { components } from "@/types/api";
import {
    SpecHomePage1821_BannerFields as SpecHomePage1821BannerFields,
    SpecHomePage1821_ShortcutFields as SpecHomePage1821ShortcutFields,
    SpecHomePage1821_ShortcutModuleItemFields as SpecHomePage1821ShortcutModuleItemFields,
    SpecHomePage1821ModelFields,
    SpecHomePage1821SetFields,
} from "@/types/SchemaFields";

export type QueryListParam = components["schemas"]["QueryListParam"];
export type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
export type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
export type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
export type FileManageDto = components["schemas"]["FileManageModel_DTO"];
export type SpecHomePage1821Model = components["schemas"]["SpecHomePage1821Model_DTO"];
export type SpecHomePage1821Banner = components["schemas"]["SpecHomePage1821_Banner_DTO"];
export type SpecHomePage1821Shortcut = components["schemas"]["SpecHomePage1821_Shortcut_DTO"];
export type SpecHomePage1821ShortcutModuleItem = components["schemas"]["SpecHomePage1821_ShortcutModuleItem_DTO"];
export type SpecHomePage1821Set = components["schemas"]["SpecHomePage1821Set_DTO"];
export type HomePageModuleTypeValue = components["schemas"]["SpecHomePageModuleType"];

export {
    SpecHomePage1821BannerFields,
    SpecHomePage1821ModelFields,
    SpecHomePage1821SetFields,
    SpecHomePage1821ShortcutFields,
    SpecHomePage1821ShortcutModuleItemFields,
};

export interface HomePageOptions
{
    categoryIds: string;
    tagIds: string;
}

export const HomePageModuleType = {
    Announcement: 1,
    FileArchive: 2,
} as const satisfies Record<string, HomePageModuleTypeValue>;

export interface HomePageShortcutModuleViewModel
{
    setting: SpecHomePage1821ShortcutModuleItem;
    moduleType: HomePageModuleTypeValue;
    announcementList: AnnouncementSet[];
    fileArchiveList: FileArchiveSet[];
}

export interface HomePageShortcutViewModel
{
    shortcut: SpecHomePage1821Shortcut;
    modules: HomePageShortcutModuleViewModel[];
}

export interface HomePageLinkViewModel
{
    key: string;
    title: string;
    url: string;
    pictureId: string;
    pictureDescription: string;
}

export interface HomePageFeatureCardViewModel
{
    key: string;
    title: string;
    pictureId: string;
    pictureDescription: string;
}
