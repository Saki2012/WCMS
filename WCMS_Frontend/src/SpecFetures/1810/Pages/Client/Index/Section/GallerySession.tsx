/* Banner */
import "swiper/swiper-bundle.css";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { formatDate } from "@/SysCore/Utils/Library/LibData";
import { useEffect, useMemo, useRef } from "react";

import bgImg from "@/SpecFetures/1810/Assets/Client/Images/bg/background-transparent-image_1920x600.png";
import type { HomePageGalleryHookResult } from "@/SpecFetures/1810/Pages/Client/Index/HomePage_Loader";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { components } from "@/types/api";

// #region Property
type GallerySet = components["schemas"]["GallerySet_DTO"];

interface DataProp
{
    internalId: string;
    picInternalId: string;
    title: string;
    date: string;
    catName: string;
}
// #endregion

// #region Public
export const GallerySession = (props: { lang: Lang; hydrationData: HomePageGalleryHookResult; }) =>
{
    // 宣告變數：統一吃 Homepage hydration source
    const source = props.hydrationData;
    // 宣告變數：保留原本資料轉換規則
    const result = useMemo(() =>
    {
        return getDataProps(props.lang, source.galleryData ?? [], source.categoryDict);
    }, [props.lang, source.galleryData, source.categoryDict]);

    // 宣告變數：用 key 強制 remount，避免 owl 改過的 DOM 與 React 衝突
    const galleryKey = useMemo(() =>
    {
        const ids = result.map(p => p.internalId).join("|");
        return `${props.lang}|${ids || "__empty__"}`;
    }, [props.lang, result]);

    // 宣告變數：保留原本 carousel ref
    const carouselRef = useRef<HTMLDivElement>(null);
    const initTimerRef = useRef<number | null>(null);
    const isOwlInitedRef = useRef(false);

    useEffect(() =>
    {
        const el = carouselRef.current;
        if (!el) return;
        const $owl = $(el);
        const owlCarousel = $owl.owlCarousel;
        if (typeof owlCarousel !== "function") return;
        const cleanup = () =>
        {
            if (initTimerRef.current !== null)
            {
                window.clearTimeout(initTimerRef.current);
                initTimerRef.current = null;
            }
            $("#Gallery_start").off("click.gallerySession");
            $("#Gallery_pause").off("click.gallerySession");
            if (isOwlInitedRef.current && $owl.hasClass("owl-loaded"))
            {
                $owl.trigger("destroy.owl.carousel");
            }
            isOwlInitedRef.current = false;
        };
        cleanup();
        if (result.length === 0) return;
        initTimerRef.current = window.setTimeout(() =>
        {
            if (!carouselRef.current) return;
            owlCarousel.call($owl, { items: 3, loop: true, dots: true, nav: true, margin: 30, autoplayTimeout: 3000, autoplayHoverPause: true, responsive: { 0: { items: 1 }, 767: { items: 2 }, 991: { items: 3 }, 1200: { items: 3 } } });
            isOwlInitedRef.current = true;
            $("#Gallery .owl-nav button").attr("tabindex", "7");
            $("#Gallery_start").off("click.gallerySession").on("click.gallerySession", () =>
            {
                $owl.trigger("play.owl.autoplay", [6000]);
            });
            $("#Gallery_pause").off("click.gallerySession").on("click.gallerySession", () =>
            {
                $owl.trigger("stop.owl.autoplay");
            });
        }, 0);
        return cleanup;
    }, [galleryKey]);

    return (
        <section className="Gallery-section owl-box" style={{ backgroundImage: `url(${bgImg})` }}>
            <div className="Mask-DivBox layout_padding2">
                <div className="customizeBox">
                    <div className="container-customize1">
                        <div className="row">
                            <div className="col-12 px-4 + animate__animated animate__slow wow animate__bounceInUp" data-wow-delay="0.1s">
                                <div className="Standard-TitleDiv div-header">
                                    <div className="TextDIV">
                                        <h3>
                                            <span className="title-tw">
                                                活動花絮<span className="c-line"></span>
                                            </span>
                                        </h3>
                                        <span className="en-box">
                                            <span className="title-en">Gallery</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="container-customize1">
                        <div className="row">
                            <div className="col-12 + p-0">
                                <div className="content-box + animate__animated animate__slow wow animate__zoomIn" data-wow-delay="0.15s">
                                    <div id="Gallery" className="owl-carousel owl-theme px-2" ref={carouselRef} key={galleryKey}>
                                        {result.map((item) =>
                                        {
                                            const imgUrl = FileManagementAPI.get_Public_Preview_Url(item.picInternalId, item.title);
                                            return item && (
                                                <div className="item" key={item.internalId}>
                                                    <LangLink to={`/EventHighlights/event-album/${item.internalId}`} tabIndex={13} title={item.title}>
                                                        <div className="DivBox_content v_itemBOX">
                                                            <div className="Picture_Div">
                                                                <div className="img_wrapper">
                                                                    <div className="figure_wrapper">
                                                                        <img src={imgUrl} alt={item.title} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="TxtBoxDiv">
                                                                <div className="card_titleDiv">
                                                                    <div className="card_title">{item.title}</div>
                                                                </div>
                                                                <div className="m-news_detail">
                                                                    <div className="category_box">
                                                                        <div className="m-news_category">
                                                                            <i className="fa fa-bookmark" aria-hidden="true"></i>
                                                                            <div className="tags-text">{item.catName}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="TimeBoxDiv">
                                                                        <div className="card_time">
                                                                            <i className="fa fa-clock-o" aria-hidden="true"></i>
                                                                            {item.date}
                                                                        </div>
                                                                        <div className="card_arrow">
                                                                            <i className="fa fa-arrow-circle-right" aria-hidden="true"></i>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </LangLink>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="control-box">
                                        <a
                                            id="Gallery_start"
                                            href="#"
                                            onClick={(e) =>
                                            {
                                                e.preventDefault();
                                            }}
                                            className="play"
                                            tabIndex={13}
                                            title="播放"
                                        >
                                            <div className="control_start">
                                                <span className="control-start-icon">
                                                    <span className="d-none">播放</span>
                                                </span>
                                            </div>
                                        </a>

                                        <a
                                            id="Gallery_pause"
                                            href="#"
                                            onClick={(e) =>
                                            {
                                                e.preventDefault();
                                            }}
                                            className="stop"
                                            tabIndex={13}
                                            title="暫停"
                                        >
                                            <div className="control_pause">
                                                <span className="control-pause-icon">
                                                    <span className="d-none">暫停</span>
                                                </span>
                                            </div>
                                        </a>
                                    </div>

                                    <div className="btn_Div justify-content-end px-2">
                                        <div className="customize_btn my-3">
                                            <LangLink to="/EventHighlights/event-album" className="Btn_s1" tabIndex={13} title="更多活動花絮">
                                                VIEW ALL<span className="ml-2">+</span>
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
// #endregion

// #region Private
const getDataProps = (lang: string, galleryData: GallerySet[], categoryDict: Record<string, string>): DataProp[] =>
{
    const result: DataProp[] = [];

    galleryData.map((item) =>
    {
        const cats = (item.Gallery?.Categories ?? "").split(",").map(s => s.trim()).filter(Boolean);
        const catsName = cats.map(id => categoryDict[id] ?? "").filter(Boolean).join(", ");

        result.push({
            internalId: item.Gallery?.InternalId ?? "",
            picInternalId: item.Gallery?.CoverPicSrcId ?? "",
            title: item.GalleryInfo?.find(p => p.Lang === lang)?.Title ?? "",
            date: formatDate(item.Gallery?.Validate_Start),
            catName: catsName,
        });
    });

    return result;
};
// #endregion
