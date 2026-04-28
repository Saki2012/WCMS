import type { IWebResourceListOptions } from "@/Features/Pages/Client/BizFunc/WebManagement/WebResource/WebResourceList";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";

interface IWebResourceListProps
{
    Theme: IFETheme;
    Lang: Lang;
    Options?: IWebResourceListOptions;
    title: string;
}
export const WebResourceListComp = (props: IWebResourceListProps) =>
{
    return <></>;
};
