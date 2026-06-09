import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import { AboutPage } from "@/SpecFetures/1818/Pages/Client/Index/Section/AboutPage";
import { ActivityPhotoData } from "@/SpecFetures/1818/Pages/Client/Index/Section/ActivityPhotoData";
import { CarouselData } from "@/SpecFetures/1818/Pages/Client/Index/Section/CarouselData";
import { LinkData } from "@/SpecFetures/1818/Pages/Client/Index/Section/LinkData";
import { NewsData } from "@/SpecFetures/1818/Pages/Client/Index/Section/NewsData";
import { type Lang } from "@/SysCore/i18n/lang";
import { useHomePageTemplateData } from "./HomePage_Loader";

// #region Private
const HomePage = (props: { lang: Lang; }) =>
{
    const homePage = useHomePageTemplateData(props.lang);
    const loaderData = homePage.loaderData;
    const rawData = homePage.rawData;
    if (!loaderData || !rawData) return null;
    return (
        <main id="Site-Main" className="ALL_Main_DivBar main-fullpage-wraper">
            <div className="background_area">
                <div className="iMG-Shape-3" />
                {/* // 輪播BANNER //  */}
                <CarouselData lang={props.lang} internalId={loaderData.args.heroBannerInternalId} initialBanner={rawData.heroBanner} />
                <div className="container-customize3">
                    <Accesskey type="C" lang={props.lang} />
                </div>
                {/* // 相關連結 //  */}
                <LinkData lang={props.lang} bannerParam={loaderData.args.linksBannerParam} initialBanner={rawData.linksBanner} />
                {/* // 關於我們 //  */}
                <AboutPage
                    lang={props.lang}
                    webInternalId={loaderData.args.aboutWebResourceInternalId}
                    pageInternalId={loaderData.args.aboutPageInternalId}
                    admissionsInternalId={loaderData.args.admissionsBannerInternalId}
                    initialWebResource={rawData.aboutWebResource}
                    initialPage={rawData.aboutPage}
                    initialAdmissionsBanner={rawData.admissionsBanner}
                />
                {/* // 最新消息 //  */}
                <NewsData
                    lang={props.lang}
                    newsTopParam={loaderData.args.newsTopParam}
                    newsListParam={loaderData.args.newsListParam}
                    cateParam={loaderData.args.newsCateParam}
                    tagParam={loaderData.args.newsTagParam}
                    initialTopList={rawData.newsTopList}
                    initialList={rawData.newsList}
                    initialCategories={rawData.newsCategories}
                    initialTags={rawData.newsTags}
                />
                {/* // 活動相簿 //  */}
                <ActivityPhotoData
                    lang={props.lang}
                    galleryTopParam={loaderData.args.galleryTopParam}
                    galleryListParam={loaderData.args.galleryListParam}
                    cateParam={loaderData.args.galleryCateParam}
                    tagParam={loaderData.args.galleryTagParam}
                    initialTopList={rawData.galleryTopList}
                    initialList={rawData.galleryList}
                    initialCategories={rawData.galleryCategories}
                    initialTags={rawData.galleryTags}
                />
            </div>
        </main>
    );
};


export default HomePage;
// #endregion
