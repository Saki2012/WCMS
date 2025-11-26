/*Header模塊*/
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";

const Header = (props: { lang: Lang; site: INormSite; style: IFETheme }) => {
    return (<A11yContent />);
}
export default Header

export const A11yContent = () => {
    return (
        <>
            <noscript>
                <div style={{ color: 'red' }}>{"您的瀏覽器不支援 JavaScript，請開啟 Javascript 功能。"}</div>
            </noscript>
            <a href="#content" id="gotocenter" title="跳到頁面主要內容區" tabIndex={1} className="sr-only sr-only-focusable">跳到頁面主要內容區</a>
        </>
    )
}
