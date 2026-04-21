import { useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { A11y, Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
type HomePageModel = components["schemas"]["SpecHomePage1820Model_DTO"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
/** 取得切換按鈕描述 */
const getToggleLabel = (isPlaying: boolean) => isPlaying ? "圖片輪播播放中，點擊暫停" : "圖片輪播已暫停，點擊播放";
/** 取得切換按鈕 title */
const getToggleTitle = (isPlaying: boolean) => isPlaying ? "暫停" : "播放";
/** 最新消息輪播 */
export const Section3 = (props: { lang: Lang; homePage: HomePageModel; }) =>
{
    const annDetail: AnnouncementSet[] = [];
    const swiperRef = useRef<SwiperType | null>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const handleToggleAutoplay = () =>
    {
        const swiper = swiperRef.current;
        if (!swiper?.autoplay) return;
        if (isPlaying) swiper.autoplay.stop();
        else swiper.autoplay.start();
        setIsPlaying(!isPlaying);
    };

    return (
        <section className="LatestNews_section owl-box Layout_Padding_3_top Layout_Padding_3_bottom bg-custom">
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize2">
                        <div className="row">
                            <div className="col-12">
                                <div className="Header_Div">
                                    <div className="title-accent font-wt-lg">{props.homePage.AnnouncementSubTitle}</div>
                                    <div className="main-title display-5">
                                        <span>{props.homePage.AnnouncementTitle}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="content-box px-0 mb-5">
                                    <div className="DIV-singleBox">
                                        <div className="control-singlebox">
                                            <button
                                                id="News_toggle"
                                                type="button"
                                                className="toggle ms-1"
                                                aria-label={getToggleLabel(isPlaying)}
                                                aria-pressed={isPlaying}
                                                title={getToggleTitle(isPlaying)}
                                                onClick={handleToggleAutoplay}
                                            >
                                                <div
                                                    className={`control-toggle ${
                                                        isPlaying ? "control-pause-icon" : "control-play-icon"
                                                    }`}
                                                >
                                                    <span className="sr-only">{getToggleLabel(isPlaying)}</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    <Swiper
                                        modules={[Navigation, A11y, Autoplay]}
                                        className="latest-news-swiper"
                                        spaceBetween={30}
                                        slidesPerView={1}
                                        navigation
                                        loop={false}
                                        autoplay={{
                                            delay: 5000,
                                            disableOnInteraction: false,
                                            pauseOnMouseEnter: true,
                                        }}
                                        breakpoints={{
                                            0: { slidesPerView: 1 },
                                            575: { slidesPerView: 1 },
                                            767: { slidesPerView: 2 },
                                            991: { slidesPerView: 3 },
                                            1199: { slidesPerView: 3 },
                                        }}
                                        onSwiper={(swiper) =>
                                        {
                                            swiperRef.current = swiper;
                                        }}
                                    >
                                        {annDetail.map((item) =>
                                        {
                                            const linkUrl = LibMerge(
                                                "/",
                                                false,
                                                props.homePage.Announcement_ViewMoreLink,
                                                item.Announcement?.InternalId,
                                            );
                                            const annDetail = item.AnnouncementDetail?.find(p => p.Lang === props.lang);

                                            return (
                                                <SwiperSlide key={item.Announcement?.InternalId}>
                                                    <div className="item">
                                                        <LangNavLink
                                                            to={linkUrl}
                                                            target="_self"
                                                            title={annDetail?.Title ?? ""}
                                                        >
                                                            <div className="news-item">
                                                                <div className="row g-0">
                                                                    <div className="col-6 left_All">
                                                                        <div className="card-cat">
                                                                            <div className="card-cat-link">
                                                                                <span className="cat-title font-wt-lg">
                                                                                    <i
                                                                                        className="fas fa-tasks-alt me-2"
                                                                                        aria-hidden="true"
                                                                                    >
                                                                                    </i>
                                                                                    <span className="sr-only">
                                                                                        分類：
                                                                                    </span>
                                                                                    {item.Announcement?.Categories}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {
                                                                            /* <div className="CustomState mb-3">
                                                                            {item.isTop && (
                                                                                <div
                                                                                    className="icon-small top-bg font-wt-xxl"
                                                                                    aria-label="狀態：置頂"
                                                                                >
                                                                                    置頂
                                                                                </div>
                                                                            )}
                                                                            {item.isHot && (
                                                                                <div
                                                                                    className="icon-small hot-bg font-wt-xxl"
                                                                                    aria-label="狀態：熱門"
                                                                                >
                                                                                    熱門
                                                                                </div>
                                                                            )}
                                                                            {item.isNew && (
                                                                                <div
                                                                                    className="icon-small new-bg font-wt-xxl"
                                                                                    aria-label="狀態：最新"
                                                                                >
                                                                                    最新
                                                                                </div>
                                                                            )}
                                                                        </div> */
                                                                        }

                                                                        <div className="Date-year">
                                                                            <div className="Date-year-txt">
                                                                                <span className="news-year-tt font-wt-lg">
                                                                                    <span className="sr-only">
                                                                                        發布年份：
                                                                                    </span>
                                                                                    {item.Announcement?.Validate_Start}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="Date-day">
                                                                            <div className="Date-day-txt">
                                                                                <span className="news-date-tt font-wt-xxl">
                                                                                    <span className="sr-only">
                                                                                        日期：
                                                                                    </span>
                                                                                    {item.Announcement?.Validate_Start}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="col-6">
                                                                        <figure className="figure_Box">
                                                                            <div className="card_figure">
                                                                                <div className="img-wrapper">
                                                                                    <img
                                                                                        className="card_image"
                                                                                        src={FileManagementAPI
                                                                                            .get_Public_Preview_Url(
                                                                                                item.Announcement
                                                                                                    ?.PictureId,
                                                                                            )}
                                                                                        alt={item.Announcement
                                                                                            ?.PicDescription ?? ""}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </figure>
                                                                    </div>
                                                                </div>

                                                                <div className="card_titleDiv">
                                                                    <div className="card_title font-wt-xl">
                                                                        {annDetail?.Title}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </LangNavLink>
                                                    </div>
                                                </SwiperSlide>
                                            );
                                        })}
                                    </Swiper>

                                    <div className="row w-100 mx-0 text-center">
                                        <div className="col-12 px-0">
                                            <div className="more-link-box">
                                                <LangLink
                                                    to={props.homePage.Announcement_ViewMoreLink ?? ""}
                                                    className="more-link font-wt-lg"
                                                    aria-label="查看更多"
                                                    title="查看更多"
                                                >
                                                    <span className="ms-1">〉</span>
                                                    <span className="vm">View More</span>
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
