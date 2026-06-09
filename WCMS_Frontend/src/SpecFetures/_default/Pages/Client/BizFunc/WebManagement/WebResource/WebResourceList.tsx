import type { IWebResourceListOptions } from "@/Features/Pages/Client/BizFunc/WebManagement/WebResource/WebResourceList";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";

// #region Property
interface IWebResourceListProps
{
    Theme: IFETheme;
    Lang: Lang;
    Options?: IWebResourceListOptions;
    title: string;
}
// #endregion

// #region Public
export const WebResourceListComp = (props: IWebResourceListProps) =>
{
    return <></>;
};
// #endregion
