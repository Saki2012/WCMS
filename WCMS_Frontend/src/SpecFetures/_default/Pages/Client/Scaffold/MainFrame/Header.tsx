/*Header模塊*/
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import SkipToContent from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/SkipToContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";

// #region Property
export interface HeaderProps
{
    lang: Lang;
    site: INormSite;
    style: IFETheme;
}
// #endregion

// #region Public
export const A11yContent = ({ lang }: { lang?: Lang; }) =>
{
    return (
        <>
            <SkipToContent lang={lang} />
        </>
    );
};
// #endregion

// #region Private
const Header = (props: HeaderProps) =>
{
    return <A11yContent lang={props.lang} />;
};
// #endregion
