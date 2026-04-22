import { SpecHomePage1820Adapter } from "@/SpecFetures/1820/Hooks/WEB/HomePage_Api";
import { Section1 } from "@/SpecFetures/1820/Pages/Client/Index/Section/Section1";
import { type Lang } from "@/SysCore/i18n/lang";
import { useMemo } from "react";
import { useLoaderData } from "react-router";
import type { HomePageLoaderData } from "./HomePage_Loader";
import { Section2 } from "./Section/Section2";
import { Section3 } from "./Section/Section3";
import { Section4 } from "./Section/Section4";
import { Section5 } from "./Section/Section5";
import { Section6 } from "./Section/Section6";

const HomePage = (props: { lang: Lang; }) =>
{
    // 宣告變數：讀取 SSR / CSR loader 資料
    const loaderData = useLoaderData() as HomePageLoaderData | undefined;
    const rawData = loaderData?.res?.rawData;
    const adapter = useMemo(() => SpecHomePage1820Adapter(), []);
    const weatherQuery = adapter.hooks.useWeatherData({
        initial: loaderData?.res?.weatherInitial ?? null,
    });
    // 執行 function：主資料不存在就先不渲染
    if (!rawData?.homePage) return null;

    const homePage = rawData.homePage;

    return (
        <>
            <Section1
                homePage={homePage}
                banners={rawData.banners}
                weather={weatherQuery.weather}
            />

            <main id="Site-Main" className="ALL_Main_DivBar main-fullpage-wraper">
                <div className="background_area">
                    <section className="accesskey_C_H">
                        <div className="container-customize3">
                            <a
                                accessKey="C"
                                className="accesskey_main C"
                                href="#C"
                                id="content"
                                title="中央主要內容區(C)"
                            >
                                :::
                            </a>
                        </div>
                    </section>

                    <Section2 lang={props.lang} homePage={homePage} />
                    <Section3
                        lang={props.lang}
                        homePage={homePage}
                        announcements={rawData.announcements}
                        announcementCategoryMap={rawData.announcementCategoryMap}
                    />
                    <Section4 data={rawData.details} />
                    <Section5 data={rawData.marquees} />
                    <Section6 header={homePage} data={rawData.resources} />
                </div>
            </main>
        </>
    );
};

export default HomePage;
