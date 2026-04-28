import img1 from "@/SpecFetures/1817/Assets/Client/images/media_reports/TOPic_01_960x960.jpg";
import img2 from "@/SpecFetures/1817/Assets/Client/images/media_reports/TOPic_02_960x960.png";
import type { Lang } from "@/SysCore/i18n/lang";

export const LinkData = (props: { lang: Lang; }) =>
{
    return (
        <div className="TOPic">
            <div className="pic_item">
                <a
                    aria-label={"傳音聚樂部"}
                    href={"https://podcasts.apple.com/tw/podcast/%E5%82%B3%E9%9F%B3%E8%81%9A%E6%A8%82%E9%83%A8/id1833645926"}
                    role="button"
                    tabIndex={0}
                    target={"_blank"}
                    title={"傳音聚樂部"}
                    type="button"
                >
                    <p className="TOPic_head + head_color_S1">{"北藝大傳音系"}</p>
                    <div className="TOPic_body + body_border_S1 + bg-custom-Customize_color">
                        <div className="TOPic_img">
                            <img alt={"傳音聚樂部"} src={img1} />
                        </div>
                        <span className="toplink-arrow + trd-music">
                            <i className="fas fa-long-arrow-alt-right" />
                            <span className="sr-only">前往</span>
                        </span>
                    </div>
                </a>
            </div>

            <div className="pic_item">
                <a
                    aria-label={"傳音系FB"}
                    href={"https://www.facebook.com/TaiwanTraditionalMusic/"}
                    role="button"
                    tabIndex={0}
                    target={"_blank"}
                    title={"傳音系FB"}
                    type="button"
                >
                    <p className="TOPic_head + head_color_S2">{"傳音系FB"}</p>
                    <div className="TOPic_body + body_border_S2 + bg-custom-Customize_color">
                        <div className="TOPic_img">
                            <img alt={"傳音系FB"} src={img2} />
                        </div>
                        <span className="toplink-arrow + trd-music">
                            <i className="fas fa-long-arrow-alt-right" />
                            <span className="sr-only">前往</span>
                        </span>
                    </div>
                </a>
            </div>
        </div>
    );
};
