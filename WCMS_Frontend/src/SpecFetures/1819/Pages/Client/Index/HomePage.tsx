import type { Lang } from "@/SysCore/i18n/lang";
import { useLoaderData } from "react-router";
import type { HomePageLoaderData } from "./HomePage_Loader";
import { LatestIssueSection } from "./Section/LatestIssueSection";
import { AccessKeyCSection } from "./Section/AccessKeyCSection";
import { IndexedSection } from "./Section/IndexedSection";
import { AboutPublicationSection } from "./Section/AboutPublicationSection";
import { NewsSection } from "./Section/NewsSection";
import { RelatedLinksSection } from "./Section/RelatedLinksSection";

/**
 * 1819 - HomePage
 * - 對標 1816：首頁殼層先接 SSR loader
 * - 本階段先不改 section DOM，只先把 loader data 接進來
 * - 後續各 section 再逐步改成 initial + hook 接手
 */
const HomePage = (props: { lang: Lang }) => {
  // 宣告變數
  const loaderData = useLoaderData() as HomePageLoaderData;
  const rawData = loaderData?.res?.rawData;
  // 執行 function：尚未接到 loader 時不渲染，避免首屏資料結構不完整
  if (!rawData) return null;
  // return：目前先維持 section 原本結構，下一步再逐支改成吃 initial data
  return (
    <main id="Site-Main" className="ALL_Main_DivBar main-fullpage-wraper">
      <div className="background_area">
        {/* 最新卷期 */}
        <LatestIssueSection lang={props.lang} initialData={{latestIssueBgBanner: rawData.latestIssueBgBanner, latestIssueCoverBanner: rawData.latestIssueCoverBanner, latestIssuePublishedList: rawData.latestIssuePublishedList, latestIssueUnpublishedList: rawData.latestIssueUnpublishedList, }}/>
        {/* accesskey C（中央主要內容） */}
        <AccessKeyCSection />
        {/* 索引 */}
        <IndexedSection lang={props.lang} initialData={{indexedBanner: rawData.indexedBanner,}}/>
        {/* 最新消息 */}
        <NewsSection lang={props.lang} topParam={loaderData.args.newsTopParam} listParam={loaderData.args.newsListParam} initialData={{newsTopList: rawData.newsTopList, newsList: rawData.newsList, newsMergedList: rawData.newsMergedList,}}/>
        {/* 關於本刊 */}
        <AboutPublicationSection lang={props.lang} aboutPublicationParam={loaderData.args.aboutPublicationParam} initialAboutPublicationBanner={rawData.aboutPublicationBanner}/>
        {/* 相關連結 */}
        <RelatedLinksSection lang={props.lang} relatedLinksParam={loaderData.args.relatedLinksParam} initialData={{relatedLinksList: rawData.relatedLinksList,}}/>
      </div>
    </main>
  );
};

export default HomePage;