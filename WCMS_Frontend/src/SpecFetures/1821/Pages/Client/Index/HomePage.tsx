import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import type { Lang } from "@/SysCore/i18n/lang";
import { useHomePageTemplateData } from "./HomePage_Loader";
import { Section1 } from "./Section/Section1";
import { Section2 } from "./Section/Section2";
import { Section3 } from "./Section/Section3";
import { Section4 } from "./Section/Section4";

// #region Public
/** 1821 招生首頁 */
export const HomePage = (props: { lang: Lang; }) =>
{
    const homePageData = useHomePageTemplateData(props.lang);
    const rawData = homePageData.rawData;

    if (!rawData?.homePage) return null;

    return (
        <>
            <Section1 lang={props.lang} data={rawData.banners} />
            {/* biome-ignore lint/correctness/useUniqueElementIds: Site-Main is the shared client landmark id used by skip links. */}
            <main id="Site-Main" className="ALL_Main_DivBar main-fullpage-wraper">
                <div className="background_area">
                    <div className="container-customize0" style={{ height: "auto" }}>
                        <Accesskey type="C" lang={props.lang} />
                    </div>
                    <Section2 lang={props.lang} data={rawData.shortcuts} />
                    <Section3
                        lang={props.lang}
                        header={rawData.homePage}
                        data={rawData.featureCards}
                    />
                    <Section4
                        lang={props.lang}
                        header={rawData.homePage}
                        data={rawData.linkList}
                    />
                </div>
            </main>
        </>
    );
};
// #endregion
