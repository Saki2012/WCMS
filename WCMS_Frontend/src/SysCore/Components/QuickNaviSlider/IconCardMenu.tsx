/* 快速區塊導覽 */
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Swiper from 'swiper';
import 'swiper/swiper-bundle.css';


const IconCardMenu = () => {
    const iconCardRef = useRef<HTMLElement>(null);
    useEffect(() => {
        // ✅ Swiper 區塊
        if (iconCardRef.current && typeof Swiper !== 'undefined') {
            new Swiper('#card', {
                direction: 'horizontal',
                loop: true,
                slidesPerView: 2,
                spaceBetween: 30,
                breakpoints: {
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
                // draggable: true,
            });
        }
    }, []);
    return (
        <section className="card_section swiper-box layout_padding3" ref={iconCardRef}>
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize0 BA layout_padding0">
                        <div className="sliderBox">
                            <div id="card" className="swiper px-2">
                                <div className="swiper-wrapper">
                                    {/* <asp:Literal ID="Lit_Banner3" runat="server" /> 以下為假資料*/}
                                    <div className="swiper-slide">
                                        <div className="item + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.1s">
                                            <div className="wrapper_box">
                                                <Link to="/Allnews/Project-solicitation/National-Science-Accounting" tabIndex={1} title="計畫徵件" target="_self">
                                                    <div className="media-item w-100">
                                                        <div className="Icon-DIV">
                                                            <div className="IMG-Content">
                                                                <div className="IMG-icon">
                                                                    <img src="/Legacy/Client/images/icon/icon_01_256x256.svg" className="d-block w-100" alt="..." />
                                                                </div>
                                                            </div>
                                                            <div className="Title-Content">
                                                                <div className="iconTitle">計畫徵件</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="swiper-slide">
                                        <div className="item + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.175s">
                                            <div className="wrapper_box">
                                                <Link to="/RelevantRegulations/DownloadsAll1" tabIndex={1} title="相關法規" target="_self">
                                                    <div className="media-item w-100">
                                                        <div className="Icon-DIV">
                                                            <div className="IMG-Content">
                                                                <div className="IMG-icon">
                                                                    <img src="/Legacy/Client/images/icon/icon_02_256x256.svg" className="d-block w-100" alt="..." />
                                                                </div>
                                                            </div>
                                                            <div className="Title-Content">
                                                                <div className="iconTitle">相關法規</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="swiper-slide">
                                        <div className="item + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.25s">
                                            <div className="wrapper_box">
                                                <Link to="/All-Downloads/DownloadsAllView" tabIndex={1} title="資料下載" target="_self">
                                                    <div className="media-item w-100">
                                                        <div className="Icon-DIV">
                                                            <div className="IMG-Content">
                                                                <div className="IMG-icon">
                                                                    <img src="/Legacy/Client/images/icon/icon_03_256x256.svg" className="d-block w-100" alt="..." />
                                                                </div>
                                                            </div>
                                                            <div className="Title-Content">
                                                                <div className="iconTitle">資料下載</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    {/* 以上為假資料 */}
                                </div>
                                <div className="swiper-nav mt-1">
                                    <button type="button" className="swiper-prev" tabIndex={6}>
                                        <span aria-label="Previous" title="上一張">
                                            <span className="d-none">上一張</span>
                                        </span>
                                    </button>
                                    <button type="button" className="swiper-next" tabIndex={6}>
                                        <span aria-label="Next" title="下一張">
                                            <span className="d-none">下一張</span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
};

export default IconCardMenu;