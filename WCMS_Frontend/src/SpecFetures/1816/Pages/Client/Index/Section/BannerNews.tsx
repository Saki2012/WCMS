import type { Lang } from "@/SysCore/i18n/lang";
import { CarouselData } from "@/SpecFetures/1816/Pages/Client/Index/Section/CarouselData";
import { NewsData } from "@/SpecFetures/1816/Pages/Client/Index/Section/NewsData";

/**
 * BannerNews：對標 prototype 的「container-customize4」區塊
 * - 左半：Carousel_slide_section
 * - 右半：Newsii_section
 */
export const BannerNews = (props: { lang: Lang }) => {
    // 宣告變數：News 區塊背景（沿用 prototype/原本 NewsData 的 style）
    const bgStyle = { backgroundImage: "url(/images/bg/background-transparent-image_1920x600.png)" };

    // return：對標 prototype DOM（section.container-customize4 > .row > 2 cols）
    return (
        <section className="BannerNews container-customize4">
            <div className="row">
                <div className="col-xxl-6 col-xl-c1 col-12 Carousel_slide_section Layout_Padding_4_top Layout_Padding_5_bottom">
                    <CarouselData lang={props.lang} />
                </div>

                <div className="col-xxl-6 col-xl-c2 col-12 Newsii_section Layout_Padding_4_top Layout_Padding_5_bottom" style={bgStyle}>
                    <NewsData lang={props.lang} />
                </div>
            </div>
        </section>
    );
};
