import { type HomePageLoaderData, useHomePageHydrationSource } from "@/SpecFetures/1810/Pages/Client/Index/HomePage_Loader";
import { BannerSlider } from "@/SpecFetures/1810/Pages/Client/Index/Section/BannerSlider";
import { CategoryTabs } from "@/SpecFetures/1810/Pages/Client/Index/Section/CategoryTabs";
import { EventSession } from "@/SpecFetures/1810/Pages/Client/Index/Section/EventSession";
import { GallerySession } from "@/SpecFetures/1810/Pages/Client/Index/Section/GallerySession";
import { IconCardMenu } from "@/SpecFetures/1810/Pages/Client/Index/Section/IconCardMenu";
import { VideoSession } from "@/SpecFetures/1810/Pages/Client/Index/Section/VideoSession";
import type { Lang } from "@/SysCore/i18n/lang";
import { useLoaderData } from "react-router-dom";

// #region Private
const HomePage = (props: { lang: Lang; }) =>
{
    // 宣告變數：先取 SSR loader 資料
    const loaderData = useLoaderData() as HomePageLoaderData | undefined;

    // 宣告變數：統一建立 Homepage hydration source
    const homeSource = useHomePageHydrationSource({ lang: props.lang, loaderData: loaderData ?? null });

    return (
        <main id="fullpage" className="fullpage-wrapper">
            <div className="bg_area">
                <div className="mainArea" id="mainArea">
                    {/* // 輪播BANNER // */}
                    <BannerSlider lang={props.lang} hydrationData={homeSource.bannerSlider} />

                    {/* IConCard 輪播 */}
                    <IconCardMenu />

                    {/* // 最新消息 // */}
                    <CategoryTabs lang={props.lang} hydrationData={homeSource.categoryTabs} />

                    {/* // 活動資訊 start // */}
                    <EventSession lang={props.lang} hydrationData={homeSource.eventSession} />

                    {/* // 活動花絮 start // */}
                    <GallerySession lang={props.lang} hydrationData={homeSource.gallerySession} />

                    {/* // 影音專區 start // */}
                    <VideoSession lang={props.lang} hydrationData={homeSource.videoSession} />
                </div>
            </div>
        </main>
    );
};


export default HomePage;
// #endregion
