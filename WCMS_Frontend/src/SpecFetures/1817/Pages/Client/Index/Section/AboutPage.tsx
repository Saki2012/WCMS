import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";

export const AboutPage = (props: { lang: Lang; }) =>
{
    return (
        <section className="About_section + Layout_Padding_1 + bg-custom-Video_color">
            <div className="Mask-DivBox" style={{ backgroundImage: "url(/images/bg/underline_03_Beige_1920x292.svg)" }}>
                <div className="customizeBox">
                    <div className="circle-1 iMG-Shape-2" />
                    <div className="container-customize3">
                        <div className="row">
                            <div className="col-12" />
                            <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-5 col-sm-5 col-12">
                                <article className="cardbox + mb-md-4 mb-sm-3 mb-2">
                                    <div className="card_content">
                                        <figure className="figure_Box">
                                            <div className="card_youtube_figure">
                                                <div className="img-wrapper">
                                                    <iframe
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                        frameBorder="0"
                                                        height="350"
                                                        referrerPolicy="strict-origin-when-cross-origin"
                                                        src="https://www.youtube.com/embed/65qCx584bVA?si=oITqbz83-ypocwsI"
                                                        title="YouTube video player"
                                                        width="100%"
                                                    />
                                                </div>
                                            </div>
                                        </figure>
                                        <div className="Text_Block_Area">
                                            <div className="card_titleDiv">
                                                <LangLink to="https://www.youtube.com/@taiwantradmus8182?sub_confirmation=1">
                                                    <div className="card_title">【2025大學OPEN DAY系列影音】｜國立臺北藝術大學傳統音樂學系」</div>
                                                </LangLink>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                                <div className="col-12 + btn-w100-wrapper justify-content-center mt-3 mb-5">
                                    <div className="customize_btn">
                                        <LangLink
                                            className="Btn_a"
                                            to="https://www.youtube.com/@taiwantradmus8182?sub_confirmation=1"
                                            role="button"
                                            title="更多傳音系影音"
                                            type="button"
                                        >
                                            <div className="BtnBox">
                                                <span>More View</span>
                                                <span className="ml-2">+</span>
                                            </div>
                                        </LangLink>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-12 + offset-xxl-1 offset-xl-1 offset-lg-1">
                                <div className="row">
                                    <div className="col-12 + p_contents mt-0">
                                        <h4 className="p_title">國立臺北藝術大學 音樂學院 傳統音樂學系</h4>
                                        <p className="p_text"></p>
                                        <div className="About_open_wrapper">
                                            <div className="About_message_text">
                                                <span>
                                                    國立臺北藝術大學音樂學院傳統音樂學系成立於1995年。乃為了培育傳統音樂專業人才，以傳承、研究並發展傳統音樂而設立，並於2007年成立碩士班。以臺灣具代表性的古典音樂種類「南管樂」、「北管樂」，及中國代表性樂器「古琴」、「琵琶」，結合「音樂理論」，構成五個主修項目。其中古琴與琵琶為中國傳統音樂中代表性的樂器，不論藝術內涵與曲目質量均相當可觀；南管樂與北管樂則為最具特色與內涵的臺灣傳統音樂；音樂理論主修則以加強傳統音樂的研究，培育研究人才為目的。
                                                    <br />
                                                    以保存、傳承、研究並發展傳統音樂為宗旨，結合傳統藝術傳承理念與經驗和高等教育體系，兼融傳統與現代精神，發展精緻傳統音樂，並隨著臺灣移民社會及國際視野之需，延伸至亞洲許多地區傳統音樂的涉獵與實作。在強調傳承與發展在地傳統的同時，也積極開發傳統音樂於當代社會的各種可能的發展和應用，並且透過跨文化音樂技藝的養成，以培養具本國音樂專業技藝、國際文化視野與時代感的新世代音樂人才。
                                                </span>
                                            </div>
                                        </div>
                                        <p />
                                    </div>
                                    <div className="col-12 + btn-w100-wrapper justify-content-start mt-5">
                                        <div className="customize_btn">
                                            <LangLink
                                                className="Btn_a"
                                                to="/department/department-intro"
                                                role="button"
                                                tabIndex={0}
                                                target="_self"
                                                title="更多傳音系介紹"
                                                type="button"
                                            >
                                                <div className="BtnBox">
                                                    <span>More View</span>
                                                    <span className="ml-2">+</span>
                                                </div>
                                            </LangLink>
                                        </div>
                                    </div>
                                    <div className="col-12 + w100-wrapper justify-content-start mt-5">
                                        <div className="row + mx-0 + w-100">
                                            <div className="col-md-6 col-sm-12 col-12">
                                                <article className="cardbox + mb-md-4 mb-sm-3 mb-2">
                                                    <div className="card_content">
                                                        <figure className="figure_Box">
                                                            <div className="card_youtube_figure">
                                                                <div className="img-wrapper">
                                                                    <iframe
                                                                        title="SoundCloud 音樂播放器：TNUA傳音系 特色精彩課程介紹"
                                                                        allow="autoplay"
                                                                        frameBorder="no"
                                                                        width="100%"
                                                                        height="165"
                                                                        scrolling="no"
                                                                        src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A530105151&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </figure>
                                                    </div>
                                                </article>
                                            </div>
                                            <div className="col-md-6 col-sm-12 col-12">
                                                <article className="cardbox + mb-md-4 mb-sm-3 mb-2">
                                                    <div className="card_content">
                                                        <figure className="figure_Box">
                                                            <div className="card_youtube_figure">
                                                                <div className="img-wrapper">
                                                                    <iframe
                                                                        title="SoundCloud 音樂播放器：TNUA傳音系招生考試方式介紹"
                                                                        allow="autoplay"
                                                                        frameBorder="no"
                                                                        height="165"
                                                                        scrolling="no"
                                                                        width="100%"
                                                                        src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A530109579&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </figure>
                                                    </div>
                                                </article>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12 + btn-w100-wrapper justify-content-center mt-3">
                                        <div className="customize_btn">
                                            <LangLink
                                                className="Btn_a"
                                                to="/videos/online-msc"
                                                role="button"
                                                tabIndex={0}
                                                target="_self"
                                                title="更多音樂線上試聽"
                                                type="button"
                                            >
                                                <div className="BtnBox">
                                                    <span>More View</span>
                                                    <span className="ml-2">+</span>
                                                </div>
                                            </LangLink>
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
