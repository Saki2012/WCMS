import { AboutPage } from "@/SpecFetures/1817/Pages/Client/Index/Section/AboutPage";
import { CarouselData } from "@/SpecFetures/1817/Pages/Client/Index/Section/CarouselData";
import { ExhibitionNewsData } from "@/SpecFetures/1817/Pages/Client/Index/Section/ExhibitionNewsData";
import { NewsData } from "@/SpecFetures/1817/Pages/Client/Index/Section/NewsData";
import { SpecialLinkData } from "@/SpecFetures/1817/Pages/Client/Index/Section/SpecialLinkData";
import type { Lang } from "@/SysCore/i18n/lang";
import { Navigate, useLoaderData } from "react-router";
import type { HomePageLoaderData } from "./HomePage_Loader";

const HomePage = (props: { lang: Lang; }) =>
{
    // 宣告變數：SSR loader 資料
    const loaderData = useLoaderData() as HomePageLoaderData;
    const rawData = loaderData?.res?.rawData;

    // 執行 function：保留原本英文首頁導頁邏輯
    if (props.lang === "en")
    {
        return <Navigate to="/en/about-en/about-us-en" replace />;
    }

    // return：loader 尚未取到資料時先不渲染
    if (!rawData)
    {
        return null;
    }

    // return：首頁 DOM
    return (
        <main id="fullpage" className="fullpage-wrapper">
            <div className="bg_area">
                <div className="mainArea" id="mainArea">
                    {/* 輪播 BANNER */}
                    <CarouselData lang={props.lang} internalId={loaderData.args.carouselBannerInternalId} initialBanner={rawData.carouselBanner} />

                    {/* 最新消息 */}
                    <NewsData
                        lang={props.lang}
                        listParam={loaderData.args.newsListParam}
                        cateParam={loaderData.args.categoryParam}
                        tagParam={loaderData.args.tagParam}
                        initialList={rawData.newsList}
                        initialCategories={rawData.announcementCategories}
                        initialTags={rawData.announcementTags}
                    />

                    {/* 展演消息 */}
                    <ExhibitionNewsData
                        lang={props.lang}
                        listParam={loaderData.args.exhibitionListParam}
                        cateParam={loaderData.args.categoryParam}
                        tagParam={loaderData.args.tagParam}
                        initialList={rawData.exhibitionList}
                        initialCategories={rawData.announcementCategories}
                        initialTags={rawData.announcementTags}
                    />

                    {/* 相關資料 */}
                    <AboutPage lang={props.lang} />

                    {/* 專區連結 */}
                    <SpecialLinkData lang={props.lang} internalId={loaderData.args.specialLinkBannerInternalId} initialBanner={rawData.specialLinkBanner} />
                </div>
            </div>
        </main>
    );
};

export default HomePage;
