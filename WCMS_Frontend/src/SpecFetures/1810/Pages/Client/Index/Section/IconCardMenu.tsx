/* 快速區塊導覽 */
import { useEffect, useRef } from "react";
import Swiper from "swiper";
import "swiper/swiper-bundle.css";
import img1 from "@/SpecFetures/1810/Assets/Client/images/icon/icon_01_256x256.svg";
import img2 from "@/SpecFetures/1810/Assets/Client/images/icon/icon_02_256x256.svg";
import img3 from "@/SpecFetures/1810/Assets/Client/images/icon/icon_03_256x256.svg";
import img4 from "@/SpecFetures/1810/Assets/Client/images/icon/icon_04_256x256.svg";
import { LangLink } from "@/SysCore/i18n/LangLink";

// #region Public
export const IconCardMenu = () =>
{
    const swiperRootRef = useRef<HTMLDivElement>(null);
    const swiperInstanceRef = useRef<Swiper | null>(null);

    useEffect(() =>
    {
        const root = swiperRootRef.current;
        if (!root) return;

        swiperInstanceRef.current?.destroy(true, true);
        swiperInstanceRef.current = createIconCardSwiper(root);

        requestAnimationFrame(() =>
        {
            swiperInstanceRef.current?.update();
        });

        return () =>
        {
            swiperInstanceRef.current?.destroy(true, true);
            swiperInstanceRef.current = null;
        };
    }, []);

    return (
        <section className="card_section swiper-box layout_padding3">
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize1 BA layout_padding0">
                        <div className="sliderBox">
                            <div id="card" className="swiper px-2" ref={swiperRootRef}>
                                <div className="swiper-wrapper">
                                    <div className="swiper-slide">
                                        <div className="item + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.1s">
                                            <div className="wrapper_box">
                                                <LangLink
                                                    to="/Allnews/Project-solicitation/National-Science-Accounting"
                                                    tabIndex={1}
                                                    title="計畫徵件"
                                                    target="_self"
                                                >
                                                    <div className="media-item w-100">
                                                        <div className="Icon-DIV">
                                                            <div className="IMG-Content">
                                                                <div className="IMG-icon">
                                                                    <img src={img1} className="d-block w-100" alt="計畫徵件" />
                                                                </div>
                                                            </div>
                                                            <div className="Title-Content">
                                                                <div className="iconTitle">計畫徵件</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </LangLink>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="swiper-slide">
                                        <div className="item + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.1s">
                                            <div className="wrapper_box">
                                                <LangLink to="/RelevantRegulations/DownloadsAll1" tabIndex={1} title="相關法規" target="_self">
                                                    <div className="media-item w-100">
                                                        <div className="Icon-DIV">
                                                            <div className="IMG-Content">
                                                                <div className="IMG-icon">
                                                                    <img src={img2} className="d-block w-100" alt="相關法規" />
                                                                </div>
                                                            </div>
                                                            <div className="Title-Content">
                                                                <div className="iconTitle">相關法規</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </LangLink>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="swiper-slide">
                                        <div className="item + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.1s">
                                            <div className="wrapper_box">
                                                <LangLink to="/All-Downloads/DownloadsAllView" tabIndex={1} title="資料下載" target="_self">
                                                    <div className="media-item w-100">
                                                        <div className="Icon-DIV">
                                                            <div className="IMG-Content">
                                                                <div className="IMG-icon">
                                                                    <img src={img3} className="d-block w-100" alt="資料下載" />
                                                                </div>
                                                            </div>
                                                            <div className="Title-Content">
                                                                <div className="iconTitle">資料下載</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </LangLink>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="swiper-slide">
                                        <div className="item + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.1s">
                                            <div className="wrapper_box">
                                                <LangLink to="/research-highlights/rh4" tabIndex={1} title="研究亮點" target="_self">
                                                    <div className="media-item w-100">
                                                        <div className="Icon-DIV">
                                                            <div className="IMG-Content">
                                                                <div className="IMG-icon">
                                                                    <img src={img4} className="d-block w-100" alt="研究亮點" />
                                                                </div>
                                                            </div>
                                                            <div className="Title-Content">
                                                                <div className="iconTitle">研究亮點</div>
                                                            </div>
                                                        </div>
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
            </div>
        </section>
    );
};
// #endregion

// #region Private
/// 建立 IconCard Swiper
const createIconCardSwiper = (element: HTMLElement) =>
{
    return new Swiper(element, {
        direction: "horizontal",
        rewind: true,
        watchOverflow: true,
        observer: true,
        observeParents: true,
        slidesPerView: 4,
        spaceBetween: 30,
        breakpoints: { 1200: { slidesPerView: 4 }, 992: { slidesPerView: 3 }, 576: { slidesPerView: 2 }, 0: { slidesPerView: 2 } },
        navigation: { nextEl: ".swiper-next", prevEl: ".swiper-prev" },
        pagination: { el: ".swiper-pagination", clickable: false },
    });
};
// #endregion
