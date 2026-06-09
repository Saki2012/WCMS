import type { IAnnouncementListOptions } from "@/Features/Pages/Client/BizFunc/WEB/Announcement/Client_Announcement_List_Comp";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";

// #region Property
interface IAnnouncementListProps
{
    Theme: IFETheme;
    Lang: Lang;
    Options?: IAnnouncementListOptions;
}
// #endregion

// #region Public
export const AnnouncementList = (props: IAnnouncementListProps) =>
{
    return <></>;
};
// #endregion
