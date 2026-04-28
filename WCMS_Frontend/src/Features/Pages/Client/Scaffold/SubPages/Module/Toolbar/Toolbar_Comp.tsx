import type { Lang } from "@/SysCore/i18n/lang";
import "./Toolbar.css";

export const Toolbar_Comp = (props: { lang: Lang; }) =>
{
    const shareTitle = props.lang === "zh-tw" ? "分享" : "Share";
    const printTitle = props.lang === "zh-tw" ? "友善列印" : "Print";
    return (
        <>
            <div className="col-md-12">
                <div className="PrintingSite__wrapper">
                    <div className="R ms-auto">
                        <div className="Print-box">
                            <ul className="nav custom_nav py-0 justify-content-center my-2">
                                <li className="nav-item">
                                    <a className="nav-link" href="/" role="button" aria-label={shareTitle} title={shareTitle} tabIndex={0}>
                                        <i className="fas fa-share-alt mx-2"></i>
                                        <span className="sr-only">{shareTitle}</span>
                                        {shareTitle}
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link" href="/" role="button" aria-label={printTitle} title={printTitle} tabIndex={0}>
                                        <i className="fas fa-print mx-2"></i>
                                        <span className="sr-only">{printTitle}</span>
                                        {printTitle}
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
