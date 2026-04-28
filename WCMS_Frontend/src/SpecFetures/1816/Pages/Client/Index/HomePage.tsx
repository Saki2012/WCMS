import { LinkData } from "@/SpecFetures/1816/Pages/Client/Index/Section/LinkData";
import { CollectionsData } from "@/SpecFetures/1816/Pages/Client/Index/Section/CollectionsData";
import { SpecialLinkData } from "@/SpecFetures/1816/Pages/Client/Index/Section/SpecialLinkData";
import { QuickLinksData } from "@/SpecFetures/1816/Pages/Client/Index/Section/QuickLinksData";
import { NewsCalendarData } from "@/SpecFetures/1816/Pages/Client/Index/Section/NewsCalendarData";
import { CarouselData } from "@/SpecFetures/1816/Pages/Client/Index/Section/CarouselData";
import { NewsData } from "@/SpecFetures/1816/Pages/Client/Index/Section/NewsData";
import type { Lang } from "@/SysCore/i18n/lang";
import { useLoaderData } from "react-router";
import type { HomePageLoaderData } from "./HomePage_Loader";
import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";

const HomePage = (props: { lang: Lang }) => {
  const loaderData = useLoaderData() as HomePageLoaderData;
  const rawData = loaderData?.res?.rawData;
  if (!rawData) return null;
  return (
    <main id="Site-Main" className="ALL_Main_DivBar main-fullpage-wraper">
      <div className="background_area">
        {/* Link icons */}
        <LinkData lang={props.lang} internalId={loaderData.args.linkIconsBannerInternalId} initialBanner={rawData.linkIconsBanner}/>
        {/* Opening hours */}
        <NewsCalendarData lang={props.lang} initialOpenTime={rawData.currentOpenTime} />

        <div className="container-customize4">
          <Accesskey type="C" lang={props.lang} />
        </div>

        {/* 輪播+最新消息（DOM 對標原本 BannerNews） */}
        <section className="container-customize4">
          <div className="row">
            <CarouselData lang={props.lang} internalId={loaderData.args.carouselBannerInternalId} initialBanner={rawData.carouselBanner} />
            <NewsData lang={props.lang} 
              listParam01={loaderData.args.newsListParam01} listParam02={loaderData.args.newsListParam02} listParam03={loaderData.args.newsListParam03} listParam04={loaderData.args.newsListParam04}
              cateParam={loaderData.args.newsCateParam} tagParam={loaderData.args.newsTagParam}
              initialList01={rawData.newsList01} initialList02={rawData.newsList02} initialList03={rawData.newsList03} initialList04={rawData.newsList04} 
              initialCategories={rawData.newsCategories} initialTags={rawData.newsTags}
            />
          </div>
        </section>

        {/* 館藏櫥窗 */}
        <CollectionsData lang={props.lang} internalId={loaderData.args.collectionsBannerInternalId} initialBanner={rawData.collectionsBanner} />

        {/* 專區連結 */}
        <SpecialLinkData lang={props.lang} internalId={loaderData.args.specialLinkBannerInternalId} initialBanner={rawData.specialLinkBanner} />

        {/* 快速連結 */}
        <QuickLinksData lang={props.lang} internalId={loaderData.args.quickLinksBannerInternalId} initialBanner={rawData.quickLinksBanner} />
      </div>
    </main>
  );
};

export default HomePage;