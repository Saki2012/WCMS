import type { IAnnouncementListOptions } from "@/Features/Pages/Client/BizFunc/WEB/Announcement/AnnouncementList";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";

interface IAnnouncementListProps
{
    Theme: IFETheme;
    Lang: Lang;
    Options?: IAnnouncementListOptions;
}
export const AnnouncementList = (props: IAnnouncementListProps) =>
{
    return <></>;
};
