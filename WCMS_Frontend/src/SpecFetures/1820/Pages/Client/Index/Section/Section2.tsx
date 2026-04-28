import bgImg from "@/SpecFetures/1820/Assets/Client/images/bg/vertical_textbox_1920x700.png";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { components } from "@/types/api";
import parse from "html-react-parser";
import { useMemo } from "react";
type HomePageModel = components["schemas"]["SpecHomePage1820Model_DTO"];
export const Section2 = (props: { lang: Lang; homePage: HomePageModel; }) =>
{
    const data = props.homePage;
    const textMap: Record<string, { ViewMoreText: string; }> = { en: { ViewMoreText: "View More" }, "zh-tw": { ViewMoreText: "查看更多" } };
    const text = textMap[props.lang] ?? textMap["zh-tw"];

    const heroText = useMemo(() => (data.HeroText ? parse(data.HeroText) : null), [data.HeroText]);

    return (
        <section className="After_content_section + Layout_Padding_3_bottom + bg-custom">
            <div className="Mask-DivBox" style={{ backgroundImage: `url(${bgImg})` }}>
                <div className="customizeBox">
                    <div className="container-customize2">
                        <div className="row">
                            <div className="col-12">
                                <div className="vertical_DivBox">
                                    <div className="content_wrap">
                                        <div className="verticaltbox">
                                            {heroText}
                                            <div className="button-col link-group">
                                                <div className="vertical-link-box">
                                                    <LangLink
                                                        to={data.HeroText_ViewMoreLink ?? ""}
                                                        className="more-Vlink font-wt-lg"
                                                        role="button"
                                                        aria-label={text.ViewMoreText}
                                                        title={text.ViewMoreText}
                                                    >
                                                        <span className="vm">View More</span>
                                                        <span className="icon >">&gt;</span>
                                                    </LangLink>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
