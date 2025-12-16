/* Banner */
import * as SchemaFields from "@/types/SchemaFields";
import { Link } from 'react-router-dom';
import AnnouncementProvider from '@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api';
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import TagProvider from '@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api';
import LoadingErrorHandler from '@/SysCore/Components/LoadingErrorHandler';
import { useEffect, useRef } from 'react';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
import { FormatDate } from '@/SysCore/Utils/Library/LibData';
import defaulteventpic from '@/SpecFetures/1810/Assets/Custom/DefaultEventPic_940x1330.jpg'
import { useNow } from '@/SysCore/Utils/Library/LibHook';
import { LibMerge } from '@/SysCore/Utils/Library/LibMergeData';
import bgImg from '@/SpecFetures/1810/Assets/Client/Images/bg/background-transparent-image_1920x600.png'
import type { components } from '@/types/api';
import { LangLink } from "@/SysCore/i18n/LangLink";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]
interface EventData {
    Id: string;
    Title: string; // 標題
    ImgSrc: string; // 圖片來源
    Url: string; // 連結
    Tags: string; //
    date: string;
    contentStatus: number;
}

const useAnnouncementList = () => {
    const provider = AnnouncementProvider();
    let cdt: string = "";
    //因時程關係，暫時用前端來判斷有效日期時間，多少會有客戶端修改時間的風險。之後再改到後端開新的api寫死抓系統時間為依據。
    const now = useNow({ startPaused: true });
    if (now.isoLocal) cdt = LibMerge(" And ", false, cdt, `${SchemaFields.AnnouncementFields.Validate_Start} <= ${now.isoLocal}`);
    cdt = LibMerge(" And ", false, cdt, `${SchemaFields.AnnouncementFields.Categories} HasAny [8,10]`)
    cdt = LibMerge(" And ", false, cdt, `${SchemaFields.AnnouncementFields.ContentStatus} !&4`)

    return useFetchGridListData<AnnouncementSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                SchemaFields.AnnouncementFields.AnnouncementId,
                SchemaFields.AnnouncementFields.InternalId,
                SchemaFields.AnnouncementFields.Tags,
                SchemaFields.AnnouncementFields.Validate_Start,
                SchemaFields.AnnouncementFields.PictureId,
                SchemaFields.AnnouncementFields.PicDescription,
                SchemaFields.AnnouncementFields.ContentStatus,
                `${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Lang}`,
                `${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Title}`,
                SchemaFields.AnnouncementFields.ViewCount,
            ],
            Condition: cdt,
            OrderBy: [{ Col: SchemaFields.AnnouncementFields.Validate_Start, Desc: true }],
            PageNumber: 1,
            PageSize: 6,
        }),
        enabled: true,
        deps: [cdt],
    });
};

const useTagList = () => {
    const provider = TagProvider();
    return useFetchGridListData<TagSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                SchemaFields.TagDataFields.TagId,
                `${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.Lang}`,
                `${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.TagName}`,
            ],
            Condition: `${SchemaFields.TagDataFields.ProgId} = Announcement`,
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: true,
        deps: [],
    });
};

export const EventSession = () => {
    const useEvent = useAnnouncementList();
    const useTag = useTagList();
    const isLoading = [useEvent.isLoading, useTag.isLoading]
    const errors = [useEvent.error, useTag.error]
    const lang = 'zh-tw'
    const tagDict: Record<string, string> = Object.fromEntries(
        (useTag.rawData ?? []).map(tag => {
            const id = tag.TagData?.TagId;
            const name = tag.TagDetail?.find(p => p.Lang === lang)?.TagName ?? "";
            return [id, name];
        })
    );
    const rawData = (useEvent.rawData ?? []).sort((a, b) => new Date(b.Announcement?.Validate_Start ?? "").getTime() - new Date(a.Announcement?.Validate_Start ?? "").getTime()).slice(0, 6);
    const eventList = getData(lang, rawData, tagDict)
    const carouselRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (eventList.length > 0 && carouselRef.current) {
            const $owl = $(carouselRef.current);

            // Destroy if exists
            if ($owl.hasClass('owl-loaded')) {
                $owl.trigger('destroy.owl.carousel');
            }

            // Init carousel
            setTimeout(() => {
                $owl.owlCarousel({
                    items: 4,
                    loop: true,
                    dots: true,
                    nav: true,
                    margin: 30,
                    // autoplay: true,
                    autoplayTimeout: 3000,
                    autoplayHoverPause: true,
                    responsive: {
                        0: { items: 1 },
                        767: { items: 2 },
                        991: { items: 3 },
                        1200: { items: 4 }
                    }
                });

                // 設定 tabindex
                $('#Event .owl-nav button').attr('tabindex', '7');

                // 播放與暫停控制
                $('#Event_start').on('click', () => {
                    $owl.trigger('play.owl.autoplay', [6000]);
                });

                $('#Event_pause').on('click', () => {
                    $owl.trigger('stop.owl.autoplay');
                });
            }, 0);

            return () => {
                $('#Event_start').off();
                $('#Event_pause').off();
                if ($owl.hasClass('owl-loaded')) {
                    $owl.trigger('destroy.owl.carousel');
                }
            };
        }
    }, [eventList]);





    return (
        // <LoadingErrorHandler loadingList={isLoading} errorList={errors}>
        <section className="Event-section owl-box" style={{ backgroundImage: `url(${bgImg})` }}>
            <div className="Mask-DivBox layout_padding2">
                <div className="customizeBox">
                    <div className="container-customize1">
                        <div className="row">
                            <div className="col-12 px-4 + animate__animated animate__slow wow animate__bounceInUp" data-wow-delay="0.1s">
                                {/* // 標題 start // */}
                                <div className="Standard-TitleDiv div-header">
                                    <div className="TextDIV">
                                        <h3><span className="title-tw">活動資訊<span className="c-line-3ac3d1"></span></span></h3>
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
                                    <div id="Event" className="owl-carousel owl-theme px-2" ref={carouselRef}>
                                        {/* <asp:Literal ID="Lit_Event" runat="server" /> {/*輪播項目*/}
                                        {eventList.map((item, index) => {
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
                                                                        {isWithinLastNDaysFromMD(Number(month), Number(day)) && (
                                                                            <div className="icon-small new-bg" role="status" aria-label="最新">最新</div>
                                                                        )}
                                                                        {item.contentStatus != 0 && (
                                                                            <>
                                                                                {Boolean(item.contentStatus & 1) && (<div className="icon-small top-bg">置頂</div>)}
                                                                                {Boolean(item.contentStatus & 2) && (<div className="icon-small hot-bg">熱門</div>)}
                                                                            </>
                                                                        )}
                                                                    </div>


                                                                    <div className="category_box">
                                                                        <div className="m-news_category"> <i className="fa fa-bookmark" aria-hidden="true"></i>
                                                                            <div className="tags-text">{item.Tags}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="TimeBoxDiv">
                                                                        <div className="card_time"><i className="fa fa-clock-o" aria-hidden="true"></i>{FormatDate(item.date)}</div>
                                                                        <div className="card_arrow"><i className="fa fa-arrow-circle-right" aria-hidden="true"></i></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </LangLink>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="control-box">
                                        <a id="Event_start" href="#" onClick={(e) => { e.preventDefault(); }} className="play" tabIndex={12} title="播放">
                                            <div className="control_start">
                                                <span className="control-start-icon"><span className="d-none">播放</span></span>
                                            </div>
                                        </a>
                                        <a id="Event_pause" href="#" onClick={(e) => { e.preventDefault(); }} className="stop" tabIndex={12} title="暫停">
                                            <div className="control_pause">
                                                <span className="control-pause-icon"><span className="d-none">暫停</span></span>
                                            </div>
                                        </a>
                                    </div>
                                    <div className="btn_Div justify-content-end px-2">
                                        <div className="customize_btn my-3">
                                            <LangLink to="/Allnews/Intramural-activities/In-school-activities" className="Btn_s2" tabIndex={12} title="更多活動資訊">VIEW ALL<span className="ml-2">+</span></LangLink>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        // </LoadingErrorHandler>
    )
};



const getData = (lang: string, rawData: AnnouncementSet[], tagDict: Record<string, string>): EventData[] => {
    const result: EventData[] = []
    rawData.map((item) => {
        const tags = (item.Announcement?.Tags ?? "").split(",").map(s => s.trim()).filter(Boolean);
        const tagsName = tags.map(id => tagDict[id] ?? "").filter(Boolean).join(", ");
        const img = item.Announcement?.PictureId && item.Announcement.PictureId.trim() !== '' ? `${FileManagementAPI.PREVIEW_URL}/${item.Announcement.PictureId}` : defaulteventpic;
        result.push({
            Id: item.Announcement?.AnnouncementId ?? "",
            Title: item.AnnouncementDetail?.find(p => p.Lang === lang)?.Title ?? "",
            ImgSrc: img,
            Url: `/${item.Announcement?.InternalId}`,
            Tags: tagsName,
            date: item.Announcement?.Validate_Start ?? "",
            contentStatus: item.Announcement?.ContentStatus ?? 0
        })
    })
    return result;
}
const getMonthDayNums = (d?: string | Date | null): { month?: number; day?: number } => {
    if (!d) return {};
    const dt = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dt.getTime())) return {};
    return { month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
};
const DAY_MS = 24 * 60 * 60 * 1000;
const isWithinLastNDaysFromMD = (month1to12?: number, day1to31?: number, n: number = 8): boolean => {
    if (!month1to12 || !day1to31) return false;

    const now = new Date();
    const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    let y = now.getUTCFullYear();
    let candidateUTC = Date.UTC(y, month1to12 - 1, day1to31);

    // 若候選日在未來，代表跨年情境 → 改用去年
    if (candidateUTC > nowUTC) {
        y -= 1;
        candidateUTC = Date.UTC(y, month1to12 - 1, day1to31);
    }

    const diffDays = Math.floor((nowUTC - candidateUTC) / DAY_MS);
    return diffDays >= 0 && diffDays <= n;
};