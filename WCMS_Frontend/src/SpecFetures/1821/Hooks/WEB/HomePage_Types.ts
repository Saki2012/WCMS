import type { components } from "@/types/api";

export type QueryListParam = components["schemas"]["QueryListParam"];
export type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
export type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
export type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];

export interface FileManageDto
{
    InternalId?: string | null;
    FileName?: string | null;
    FileDescription?: string | null;
}

export interface SpecHomePage1821Model
{
    InternalId?: string | null;
    HomePageId?: string | null;
    Lang?: string | null;
    Section3Title?: string | null;
    Section3SubTitle?: string | null;
    Card1Title?: string | null;
    Card1PicId?: string | null;
    Card1Pic?: FileManageDto | null;
    Card2Title?: string | null;
    Card2PicId?: string | null;
    Card2Pic?: FileManageDto | null;
    Section4Title?: string | null;
    Section4SubTitle?: string | null;
    LinkOptions?: string | null;
    LinkViewMore?: string | null;
}

export interface SpecHomePage1821Banner
{
    HomePageId?: string | null;
    RowId?: number | null;
    RowNo?: number | null;
    Title?: string | null;
    SubTitle?: string | null;
    BannerFileId?: string | null;
    BannerFile?: FileManageDto | null;
    BannerFileDescription?: string | null;
    Link?: string | null;
    IsHide?: boolean | null;
}

export interface SpecHomePage1821Shortcut
{
    HomePageId?: string | null;
    RowId?: number | null;
    RowNo?: number | null;
    ShortcutCode?: string | null;
    Title?: string | null;
    SubTitle?: string | null;
    IconFileId?: string | null;
    IconFile?: FileManageDto | null;
    IconFileDescription?: string | null;
    ActionType?: string | null;
    ActionValue?: string | null;
    IsLink?: boolean | null;
    Link?: string | null;
    LinkPicId?: string | null;
    LinkPic?: FileManageDto | null;
    IsHide?: boolean | null;
}

export interface SpecHomePage1821ShortcutModuleItem
{
    HomePageId?: string | null;
    ParentRowId?: number | null;
    RowId?: number | null;
    RowNo?: number | null;
    Title?: string | null;
    SubTitle?: string | null;
    ModuleType?: number | null;
    ModuleOptions?: string | null;
    MoreViewLink?: string | null;
    IsHide?: boolean | null;
}

export interface SpecHomePage1821FeatureCard
{
    HomePageId?: string | null;
    RowId?: number | null;
    Title?: string | null;
    SubTitle?: string | null;
    PictureId?: string | null;
    PictureDescription?: string | null;
    Link?: string | null;
    IsHide?: boolean | null;
}

export interface SpecHomePage1821RelatedLink
{
    HomePageId?: string | null;
    RowId?: number | null;
    Title?: string | null;
    PictureId?: string | null;
    PictureDescription?: string | null;
    Link?: string | null;
    IsHide?: boolean | null;
}

export interface SpecHomePage1821Set
{
    SpecHomePage1821?: SpecHomePage1821Model | null;
    SpecHomePage1821_Banner?: SpecHomePage1821Banner[] | null;
    SpecHomePage1821_Shortcut?: SpecHomePage1821Shortcut[] | null;
    SpecHomePage1821_ShortcutModuleItem?:
        | SpecHomePage1821ShortcutModuleItem[]
        | null;
    SpecHomePage1821_FeatureCard?: SpecHomePage1821FeatureCard[] | null;
    SpecHomePage1821_RelatedLink?: SpecHomePage1821RelatedLink[] | null;
}

export interface HomePageOptions
{
    categoryIds: string;
    tagIds: string;
}

export const HomePageModuleType = {
    Announcement: 1,
    FileArchive: 2,
} as const;

export type HomePageModuleTypeValue = (typeof HomePageModuleType)[keyof typeof HomePageModuleType];

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

export const SpecHomePage1821ModelFields = {
    InternalId: "InternalId",
    HomePageId: "HomePageId",
    Lang: "Lang",
    Section3Title: "Section3Title",
    Section3SubTitle: "Section3SubTitle",
    Card1Title: "Card1Title",
    Card1PicId: "Card1PicId",
    Card2Title: "Card2Title",
    Card2PicId: "Card2PicId",
    Section4Title: "Section4Title",
    Section4SubTitle: "Section4SubTitle",
    LinkOptions: "LinkOptions",
    LinkViewMore: "LinkViewMore",
} as const;

export const SpecHomePage1821SetFields = {
    SpecHomePage1821: "SpecHomePage1821",
    SpecHomePage1821_Banner: "SpecHomePage1821_Banner",
    SpecHomePage1821_Shortcut: "SpecHomePage1821_Shortcut",
    SpecHomePage1821_ShortcutModuleItem: "SpecHomePage1821_ShortcutModuleItem",
    SpecHomePage1821_FeatureCard: "SpecHomePage1821_FeatureCard",
    SpecHomePage1821_RelatedLink: "SpecHomePage1821_RelatedLink",
} as const;

export const SpecHomePage1821BannerFields = {
    HomePageId: "HomePageId",
    RowId: "RowId",
    RowNo: "RowNo",
    Title: "Title",
    SubTitle: "SubTitle",
    BannerFileId: "BannerFileId",
    BannerFileDescription: "BannerFileDescription",
    Link: "Link",
    IsHide: "IsHide",
} as const;

export const SpecHomePage1821ShortcutFields = {
    HomePageId: "HomePageId",
    RowId: "RowId",
    RowNo: "RowNo",
    ShortcutCode: "ShortcutCode",
    Title: "Title",
    SubTitle: "SubTitle",
    IconFileId: "IconFileId",
    IconFileDescription: "IconFileDescription",
    ActionType: "ActionType",
    ActionValue: "ActionValue",
    IsLink: "IsLink",
    Link: "Link",
    LinkPicId: "LinkPicId",
    IsHide: "IsHide",
} as const;

export const SpecHomePage1821ShortcutModuleItemFields = {
    HomePageId: "HomePageId",
    ParentRowId: "ParentRowId",
    RowId: "RowId",
    RowNo: "RowNo",
    Title: "Title",
    SubTitle: "SubTitle",
    ModuleType: "ModuleType",
    ModuleOptions: "ModuleOptions",
    MoreViewLink: "MoreViewLink",
    IsHide: "IsHide",
} as const;
