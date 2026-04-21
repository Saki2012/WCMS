import { Section1 } from "@/SpecFetures/1820/Pages/Client/Index/Section/Section1";
import { type Lang } from "@/SysCore/i18n/lang";
import { useLoaderData } from "react-router";
import type { HomePageLoaderData } from "./HomePage_Loader";
import { Section2 } from "./Section/Section2";
import { Section3 } from "./Section/Section3";
import { Section4 } from "./Section/Section4";
import { Section5 } from "./Section/Section5";
import { Section6 } from "./Section/Section6";

const HomePage = (props: { lang: Lang; }) =>
{
    const loaderData = useLoaderData() as HomePageLoaderData;
    const rawData = loaderData.res.rawData;
    return (
        <>
            <Section1 homePage={rawData.homePage ?? {}} banners={rawData.banners ?? []} />
            <main id="Site-Main" className="ALL_Main_DivBar main-fullpage-wraper">
                <div className="background_area">
                    <section className="accesskey_C_H">
                        <div className="container-customize3">
                            <a
                                accessKey="C"
                                className="accesskey_main C"
                                href="#C"
                                id="content"
                                tabIndex={0}
                                title="中央主要內容區(C)"
                            >
                                :::
                            </a>
                        </div>
                    </section>
                    <Section2 lang={props.lang} homePage={rawData.homePage ?? {}} />
                    <Section3 lang={props.lang} homePage={rawData.homePage ?? {}} />
                    <Section4 data={rawData.details ?? []} />
                    <Section5 data={rawData.marquees ?? []} />
                    <Section6 header={rawData.homePage ?? {}} data={rawData.resources ?? []} />
                </div>
            </main>
        </>
    );
};

export default HomePage;
