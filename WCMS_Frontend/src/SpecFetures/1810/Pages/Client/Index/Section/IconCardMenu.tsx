/* 快速區塊導覽 */
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Swiper from 'swiper';
import 'swiper/swiper-bundle.css';

import img1 from "@/SpecFetures/1810/Assets/Client/images/icon/icon_01_256x256.svg"
import img2 from "@/SpecFetures/1810/Assets/Client/images/icon/icon_02_256x256.svg"
import img3 from "@/SpecFetures/1810/Assets/Client/images/icon/icon_03_256x256.svg"
import img4 from "@/SpecFetures/1810/Assets/Client/images/icon/icon_04_256x256.svg"
import { LangLink } from '@/SysCore/i18n/LangLink';
import type { Lang } from '@/SysCore/i18n/lang';



export const IconCardMenu = (props: { lang: Lang }) => {
    const iconCardRef = useRef<HTMLElement>(null);
    useEffect(() => {
        // ✅ Swiper 區塊
        if (iconCardRef.current && typeof Swiper !== 'undefined') {
            new Swiper('#card', {
                direction: 'horizontal',
                loop: true,
                slidesPerView: 4,
                spaceBetween: 30,
                breakpoints: {
                    1200: { slidesPerView: 4 },
                    992: { slidesPerView: 3 },
                    576: { slidesPerView: 2 },
                    0: { slidesPerView: 2 },
                },
                navigation: {
                    nextEl: '.swiper-next',
                    prevEl: '.swiper-prev',
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: false,
                },
            });
        }
    }, []);
    return (
        <section className="card_section swiper-box layout_padding3" ref={iconCardRef}>
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize1 BA layout_padding0">
                        <div className="sliderBox">
                            <div id="card" className="swiper px-2">
                                <div className="swiper-wrapper">
                                    {/* <asp:Literal ID="Lit_Banner3" runat="server" /> 以下為假資料*/}
                                    <div className="swiper-slide">
                                        <div className="item + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.1s">
                                            <div className="wrapper_box">
                                                <LangLink to="/Allnews/Project-solicitation/National-Science-Accounting" tabIndex={1} title="計畫徵件" target="_self">
                                                    <div className="media-item w-100">
                                                        <div className="Icon-DIV">
                                                            <div className="IMG-Content">
                                                                <div className="IMG-icon">
                                                                    <img src={img1} className="d-block w-100" alt="..." />
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
                                        <div className="item + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.175s">
                                            <div className="wrapper_box">
                                                <LangLink to="/RelevantRegulations/DownloadsAll1" tabIndex={1} title="相關法規" target="_self">
                                                    <div className="media-item w-100">
                                                        <div className="Icon-DIV">
                                                            <div className="IMG-Content">
                                                                <div className="IMG-icon">
                                                                    <img src={img2} className="d-block w-100" alt="..." />
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
                                        <div className="item + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.25s">
                                            <div className="wrapper_box">
                                                <LangLink to="/All-Downloads/DownloadsAllView" tabIndex={1} title="資料下載" target="_self">
                                                    <div className="media-item w-100">
                                                        <div className="Icon-DIV">
                                                            <div className="IMG-Content">
                                                                <div className="IMG-icon">
                                                                    <img src={img3} className="d-block w-100" alt="..." />
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
                                        <div className="item + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.25s">
                                            <div className="wrapper_box">
                                                <LangLink to="/research-highlights/rh4/List" tabIndex={1} title="研究亮點" target="_self">
                                                    <div className="media-item w-100">
                                                        <div className="Icon-DIV">
                                                            <div className="IMG-Content">
                                                                <div className="IMG-icon">
                                                                    <img src={img4} className="d-block w-100" alt="..." />
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
                                    {/* 以上為假資料 */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
};
