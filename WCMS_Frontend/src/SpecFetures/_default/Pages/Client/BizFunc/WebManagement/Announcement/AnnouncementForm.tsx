import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";

// #region Property
interface IAnnouncementFormProps
{
    Theme: IFETheme;
    Lang: string | Lang;
}
// #endregion

// #region Public
export const AnnouncementFormComp = (props: IAnnouncementFormProps) =>
{
    return <></>;
};
// #endregion
