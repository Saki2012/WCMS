import type { IGalleryListOptions } from "@/Features/Pages/Client/BizFunc/WebManagement/Gallery/GalleryList_Comp";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";

interface IGalleryListProps
{
    Theme: IFETheme;
    Lang: Lang;
    Options?: IGalleryListOptions;
    title: string;
}
export const GalleryListComp = (props: IGalleryListProps) =>
{
    return <></>;
};
