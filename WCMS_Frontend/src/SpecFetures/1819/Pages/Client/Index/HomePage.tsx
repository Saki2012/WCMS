import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import type { Lang } from "@/SysCore/i18n/lang";
import { useLoaderData } from "react-router";
import { type HomePageLoaderData, useHomePageData } from "./HomePage_Loader";
import { AboutPublicationSection } from "./Section/AboutPublicationSection";
import { IndexedSection } from "./Section/IndexedSection";
import { LatestIssueSection } from "./Section/LatestIssueSection";
import { NewsSection } from "./Section/NewsSection";
import { RelatedLinksSection } from "./Section/RelatedLinksSection";

// #region Private
/**
 * 1819 - HomePage
 * - 對標 1816：首頁殼層先接 SSR loader
 * - 本階段先不改 section DOM，只先把 loader data 接進來
 * - 後續各 section 再逐步改成 initial + hook 接手
 */
export const HomePage = (props: { lang: Lang; }) =>
{
    const loaderData = useLoaderData() as HomePageLoaderData | undefined;
    const homePage = useHomePageData({ lang: props.lang, loaderData });
    const args = homePage.args;
    const rawData = homePage.rawData;
    if (!rawData) return null;
    return (
        <main id="Site-Main" className="ALL_Main_DivBar main-fullpage-wraper">
            <div className="background_area">
                <LatestIssueSection
                    lang={props.lang}
                    initialData={{
                        latestIssueBgBanner: rawData.latestIssueBgBanner,
                        latestIssueCoverBanner: rawData.latestIssueCoverBanner,
                        latestIssuePublishedList: rawData.latestIssuePublishedList,
                        latestIssueUnpublishedList: rawData.latestIssueUnpublishedList,
                    }}
                />

                <div className="container-customize2" style={{ height: 0 }}>
                    <Accesskey type="C" lang={props.lang} />
                </div>

                <IndexedSection lang={props.lang} initialData={{ indexedBanner: rawData.indexedBanner }} />

                <NewsSection
                    lang={props.lang}
                    topParam={args.newsTopParam}
                    listParam={args.newsListParam}
                    categoryId={args.newsCategoryId}
                    initialData={{
                        newsTopList: rawData.newsTopList,
                        newsList: rawData.newsList,
                        newsMergedList: rawData.newsMergedList,
                        newsCategoryMap: rawData.newsCategoryMap,
                    }}
                />

                <AboutPublicationSection
                    lang={props.lang}
                    aboutPublicationParam={args.aboutPublicationParam}
                    initialAboutPublicationBanner={rawData.aboutPublicationBanner}
                />

                <RelatedLinksSection
                    lang={props.lang}
                    relatedLinksParam={args.relatedLinksParam}
                    initialData={{ relatedLinksList: rawData.relatedLinksList }}
                />
            </div>
        </main>
    );
};
// #endregion
