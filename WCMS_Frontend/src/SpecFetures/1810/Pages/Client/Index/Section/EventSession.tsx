import bgImg from "@/SpecFetures/1810/Assets/Client/Images/bg/background-transparent-image_1920x600.png";
import defaulteventpic from "@/SpecFetures/1810/Assets/Custom/DefaultEventPic_940x1330.jpg";
import type { HomePageEventHookResult } from "@/SpecFetures/1810/Pages/Client/Index/HomePage_Loader";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { formatDate } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { useEffect, useMemo, useRef } from "react";

// #region Property
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

interface EventData
{
    Id: string;
    Title: string;
    ImgSrc: string;
    Url: string;
    Tags: string;
    date: string;
    contentStatus: number;
}

interface EventSessionGlobal
{
    $?: unknown;
    jQuery?: unknown;
}

interface JQueryCarousel
{
    hasClass: (className: string) => boolean;
    owlCarousel?: (options: Record<string, unknown>) => JQueryCarousel;
    trigger: (eventName: string, args?: unknown[]) => JQueryCarousel;
    off: (eventName: string) => JQueryCarousel;
    on: (eventName: string, handler: () => void) => JQueryCarousel;
    attr: (name: string, value: string) => JQueryCarousel;
}

interface ValueRef<T>
{
    current: T;
}

type JQueryFactory = (selector: Element | string) => JQueryCarousel;

/** 一天的毫秒數。 */
const DAY_MS = 24 * 60 * 60 * 1000;

/** Plugin 初始化重試間隔。 */
const PluginReadyRetryMs = 80;

/** Plugin 初始化最大重試次數。 */
const PluginReadyMaxRetry = 30;
// #endregion

// #region Public
/** 首頁活動資訊專區。 */
export const EventSession = (props: { lang: Lang; hydrationData: HomePageEventHookResult; }) =>
{
    const source = props.hydrationData;
    const tagDict = source.tagDict;

    const eventList = useMemo(() =>
    {
        const raw = source.announcementData ?? [];
        return getData(props.lang, raw, tagDict);
    }, [props.lang, source.announcementData, tagDict]);

    const eventKey = useMemo(() =>
    {
        const ids = eventList.map(p => p.Id).join("|");
        return `${props.lang}|${ids || "__empty__"}`;
    }, [props.lang, eventList]);

    const carouselRef = useRef<HTMLDivElement>(null);
    const initTimerRef = useRef<number | null>(null);
    const isOwlInitedRef = useRef(false);

    useEffect(() =>
    {
        const el = carouselRef.current;
        if (!el) return;

        let retryCount = 0;

        const queueInit = (handler: () => void): void =>
        {
            clearInitTimer(initTimerRef);
            initTimerRef.current = window.setTimeout(handler, PluginReadyRetryMs);
        };

        const cleanup = (): void =>
        {
            const jquery = getWindowJQuery();
            const $owl = jquery ? jquery(el) : null;

            clearInitTimer(initTimerRef);
            cleanupEventEvents(jquery);
            cleanupOwlCarousel($owl, isOwlInitedRef);
        };

        const tryInit = (): void =>
        {
            const jquery = getWindowJQuery();

            if (!jquery)
            {
                retryCount += 1;

                if (retryCount <= PluginReadyMaxRetry)
                {
                    queueInit(tryInit);
                    return;
                }
                return;
            }

            const $owl = jquery(el);

            if (!isOwlReady($owl))
            {
                retryCount += 1;

                if (retryCount <= PluginReadyMaxRetry)
                {
                    queueInit(tryInit);
                    return;
                }
                return;
            }

            cleanupEventEvents(jquery);
            initOwlCarousel($owl);
            isOwlInitedRef.current = true;
            setupEventControls(jquery, $owl);
        };

        cleanup();

        if (eventList.length === 0) return cleanup;

        queueInit(tryInit);

        return cleanup;
    }, [eventKey, eventList.length]);

    return (
        <section className="Event-section owl-box" style={{ backgroundImage: `url(${bgImg})` }}>
            <div className="Mask-DivBox layout_padding2">
                <div className="customizeBox">
                    <div className="container-customize1">
                        <div className="row">
                            <div className="col-12 px-4 + animate__animated animate__slow wow animate__bounceInUp" data-wow-delay="0.1s">
                                <div className="Standard-TitleDiv div-header">
                                    <div className="TextDIV">
                                        <h3>
                                            <span className="title-tw">
                                                活動資訊<span className="c-line-3ac3d1"></span>
                                            </span>
                                        </h3>
                                        <span className="en-box">
                                            <span className="title-en-3ac3d1">Event information</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="container-customize1">
                        <div className="row">
                            <div className="col-12 + p-0">
                                <div className="content-box + animate__animated animate__slow wow animate__bounceInUp" data-wow-delay="0.1s">
                                    <div id="Event" className="owl-carousel owl-theme px-2" ref={carouselRef} key={eventKey}>
                                        {eventList.map((item, index) =>
                                        {
                                            const { month, day } = getMonthDayNums(item.date);

                                            return item && (
                                                <div className="item" key={item.Id}>
                                                    <LangLink to={`Allnews/Intramural-activities/In-school-activities${item.Url}`} title={item.Title} tabIndex={index + 1}>
                                                        <div className="DivBox_content v_itemBOX">
                                                            <div className="Picture_Div">
                                                                <div className="img_wrapper">
                                                                    <div className="figure_wrapper">
                                                                        <img src={item.ImgSrc} alt={item.Title} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="TxtBoxDiv">
                                                                <div className="card_titleDiv">
                                                                    <div className="card_title">{item.Title}</div>
                                                                </div>
                                                                <div className="m-news_detail">
                                                                    <div className="customstyle-hotop">
                                                                        {isWithinLastNDaysFromMD(Number(month), Number(day)) && <div className="icon-small new-bg" role="status" aria-label="最新">最新</div>}
                                                                        {item.contentStatus !== 0 && (
                                                                            <>
                                                                                {Boolean(item.contentStatus & 1) && <div className="icon-small top-bg">置頂</div>}
                                                                                {Boolean(item.contentStatus & 2) && <div className="icon-small hot-bg">熱門</div>}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    <div className="category_box">
                                                                        <div className="m-news_category">
                                                                            <i className="fa fa-bookmark" aria-hidden="true"></i>
                                                                            <div className="tags-text">{item.Tags}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="TimeBoxDiv">
                                                                        <div className="card_time">
                                                                            <i className="fa fa-clock-o" aria-hidden="true"></i>
                                                                            {formatDate(item.date)}
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
                                            id="Event_start"
                                            href="#"
                                            onClick={(e) =>
                                            {
                                                e.preventDefault();
                                            }}
                                            className="play"
                                            tabIndex={12}
                                            title="播放"
                                        >
                                            <div className="control_start">
                                                <span className="control-start-icon">
                                                    <span className="d-none">播放</span>
                                                </span>
                                            </div>
                                        </a>
                                        <a
                                            id="Event_pause"
                                            href="#"
                                            onClick={(e) =>
                                            {
                                                e.preventDefault();
                                            }}
                                            className="stop"
                                            tabIndex={12}
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
                                            <LangLink
                                                to="/Allnews/Intramural-activities/In-school-activities"
                                                className="Btn_s2"
                                                tabIndex={12}
                                                title="更多活動資訊"
                                            >
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
/** 轉換活動資訊資料為畫面使用格式。 */
const getData = (lang: string, rawData: AnnouncementSet[], tagDict: Record<string, string>): EventData[] =>
{
    const result: EventData[] = [];

    rawData.forEach((item) =>
    {
        const tags = (item.Announcement?.Tags ?? "").split(",").map(s => s.trim()).filter(Boolean);
        const tagsName = tags.map(id => tagDict[id] ?? "").filter(Boolean).join(", ");
        const pictureId = item.Announcement?.PictureId ?? "";
        const img = pictureId ? FileManagementAPI.get_Public_Preview_Url(pictureId) : defaulteventpic;

        result.push({
            Id: item.Announcement?.AnnouncementId ?? "",
            Title: item.AnnouncementDetail?.find(p => p.Lang === lang)?.Title ?? "",
            ImgSrc: img,
            Url: `/${item.Announcement?.InternalId}`,
            Tags: tagsName,
            date: item.Announcement?.Validate_Start ?? "",
            contentStatus: item.Announcement?.ContentStatus ?? 0,
        });
    });

    return result;
};

/** 取得日期的 UTC 月日。 */
const getMonthDayNums = (d?: string | Date | null): { month?: number; day?: number; } =>
{
    if (!d) return {};

    const dt = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dt.getTime())) return {};

    return { month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
};

/** 判斷指定月日是否在最近 N 天內。 */
const isWithinLastNDaysFromMD = (month1to12?: number, day1to31?: number, n: number = 8): boolean =>
{
    if (!month1to12 || !day1to31) return false;

    const now = new Date();
    const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    let y = now.getUTCFullYear();
    let candidateUTC = Date.UTC(y, month1to12 - 1, day1to31);

    if (candidateUTC > nowUTC)
    {
        y -= 1;
        candidateUTC = Date.UTC(y, month1to12 - 1, day1to31);
    }

    const diffDays = Math.floor((nowUTC - candidateUTC) / DAY_MS);
    return diffDays >= 0 && diffDays <= n;
};

/** 取得全域 jQuery，避免外部 script 尚未載入時造成頁面崩潰。 */
const getWindowJQuery = (): JQueryFactory | null =>
{
    const win = window as unknown as EventSessionGlobal;
    const jquery = typeof win.$ === "function" ? win.$ : win.jQuery;

    return typeof jquery === "function"
        ? jquery as JQueryFactory
        : null;
};

/** 清除延遲初始化 timer。 */
const clearInitTimer = (initTimerRef: ValueRef<number | null>): void =>
{
    if (initTimerRef.current === null) return;

    window.clearTimeout(initTimerRef.current);
    initTimerRef.current = null;
};

/** 檢查 owlCarousel 是否已經可用。 */
const isOwlReady = ($owl: JQueryCarousel | null): $owl is JQueryCarousel =>
{
    return Boolean($owl && typeof $owl.owlCarousel === "function");
};

/** 解除活動資訊控制按鈕事件。 */
const cleanupEventEvents = (jquery: JQueryFactory | null): void =>
{
    if (!jquery) return;

    jquery("#Event_start").off("click.eventSession");
    jquery("#Event_pause").off("click.eventSession");
};

/** 銷毀 owlCarousel，避免切頁或重掛時殘留舊 DOM。 */
const cleanupOwlCarousel = ($owl: JQueryCarousel | null, isOwlInitedRef: ValueRef<boolean>): void =>
{
    if (isOwlInitedRef.current && $owl?.hasClass("owl-loaded"))
    {
        $owl.trigger("destroy.owl.carousel");
    }

    isOwlInitedRef.current = false;
};

/** 初始化活動資訊 owlCarousel 輪播。 */
const initOwlCarousel = ($owl: JQueryCarousel): void =>
{
    $owl.owlCarousel?.({
        items: 4,
        loop: true,
        dots: true,
        nav: true,
        margin: 30,
        autoplayTimeout: 3000,
        autoplayHoverPause: true,
        responsive: { 0: { items: 1 }, 767: { items: 2 }, 991: { items: 3 }, 1200: { items: 4 } },
    });
};

/** 綁定活動資訊播放與暫停控制。 */
const setupEventControls = (jquery: JQueryFactory, $owl: JQueryCarousel): void =>
{
    jquery("#Event .owl-nav button").attr("tabindex", "7");

    jquery("#Event_start").off("click.eventSession").on("click.eventSession", () =>
    {
        $owl.trigger("play.owl.autoplay", [6000]);
    });

    jquery("#Event_pause").off("click.eventSession").on("click.eventSession", () =>
    {
        $owl.trigger("stop.owl.autoplay");
    });
};
// #endregion
