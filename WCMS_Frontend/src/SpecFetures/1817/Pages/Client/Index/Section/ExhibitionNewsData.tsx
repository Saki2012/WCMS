import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";
import bgImg from "@/SpecFetures/1817/Assets/Client/images/bg/underline_02_Beige_1920x292.svg";
import maskImg from "@/SpecFetures/1817/Assets/Client/images/exhibition/corner_mask_30x30.svg";
import lineTitleImg from "@/SpecFetures/1817/Assets/Client/images/line_title.svg";
import defaultPic from "@/SpecFetures/1817/Assets/Custom/DefaultEventPic.jpg";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { useEffect, useMemo } from "react";

import { findTextByKey } from "@/SysCore/Utils/Library/LibData";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"];

type TagSet = components["schemas"]["TagSet_DTO"];


interface ExhibitionNewsDataProps
{
    lang: Lang;
    listParam: QueryListParam;
    cateParam: QueryListParam;
    tagParam: QueryListParam;
    initialList: AnnouncementSet[];
    initialCategories: CategoryDataSet[];
    initialTags: TagSet[];
}


interface NewsItemViewModel
{
    redir: string;
    announceInternalId: string;
    title: string;
    content: string;
    date: string;
    month: string;
    year: string;
    monthNum: number;
    tagName: string;
    categoryName: string;
    contentStatus: number;
    internalId: string;
    pictureId: string;
}


type OwlResponsiveOption = { items: number; };


type OwlCarouselOptions = {
    items: number;
    loop: boolean;
    dots: boolean;
    nav: boolean;
    margin: number;
    autoplay: boolean;
    autoplayTimeout: number;
    autoplayHoverPause: boolean;
    responsive: Record<number, OwlResponsiveOption>;
};


type OwlJQueryElement = JQuery<HTMLElement> & { owlCarousel: (options: OwlCarouselOptions) => OwlJQueryElement; };


type JQueryGlobal = Window & typeof globalThis & { $?: JQueryStatic; jQuery?: JQueryStatic; };


const DAY_MS = 24 * 60 * 60 * 1000;
// #endregion

// #region Public
export const ExhibitionNewsData = (props: ExhibitionNewsDataProps) =>
{
    // 宣告變數：展演公告 hydration
    const newsQuery = useExhibitionList({ listParam: props.listParam, initialList: props.initialList });

    // 宣告變數：分類 / 標籤 hydration
    const dicts = useCategoryTagDict({
        lang: props.lang,
        cateParam: props.cateParam,
        tagParam: props.tagParam,
        initialCategories: props.initialCategories,
        initialTags: props.initialTags,
    });

    // 宣告變數：畫面資料
    const allNews = useMemo(() =>
    {
        return getNewsDataProps(newsQuery.data ?? [], props.lang, "/News/News-01", dicts.categoryDict, dicts.tagDict);
    }, [newsQuery.data, props.lang, dicts.categoryDict, dicts.tagDict]);

    // 宣告變數：重新初始化 owl 的 key
    const owlKey = useMemo(() =>
    {
        const ids = allNews.map((item) => item.announceInternalId).join("|");
        return `${props.lang}|${ids}`;
    }, [allNews, props.lang]);

    useEffect(() =>
    {
        // 執行 function：SSR 防護
        if (typeof window === "undefined") return;
        if (allNews.length === 0) return;

        // 宣告變數：jQuery
        const $ = getJQuery();
        if (!$ || !$.fn?.owlCarousel) return;

        // 宣告變數：目標元素
        const $owl = $("#Exhibition_owl_carousel") as OwlJQueryElement;
        const $toggle = $("#Exhibition_toggle");

        if ($owl.length === 0 || $toggle.length === 0) return;

        // 宣告變數：播放狀態
        let isPlaying = true;

        // 執行 function：初始化輪播
        initOwlCarousel($owl);
        updateToggleButton($toggle, isPlaying);

        const handleToggleClick = (event: JQuery.ClickEvent) =>
        {
            // 執行 function：切換播放 / 暫停
            event.preventDefault();

            if (isPlaying)
            {
                $owl.trigger("stop.owl.autoplay");
                isPlaying = false;
            } else
            {
                $owl.trigger("play.owl.autoplay", [5000]);
                isPlaying = true;
            }

            updateToggleButton($toggle, isPlaying);
        };

        // 執行 function：綁定 click
        $toggle.on("click", handleToggleClick);

        return () =>
        {
            // 執行 function：解除事件與清理 owl
            $toggle.off("click", handleToggleClick);

            try
            {
                $owl.trigger("destroy.owl.carousel");
            } catch
            {
                //
            }
        };
    }, [owlKey, allNews.length]);

    return (
        <section className="Exhibition_section + owl-box + Layout_Padding_1_top + Layout_Padding_5_bottom" style={{ backgroundImage: `url(${bgImg})` }}>
            <div className="circle-1 iMG-Shape-1" />

            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize3">
                        <div className="row">
                            <div className="col-12">
                                <div className="headDiv mb-sm-5 mb-4">
                                    <span className="headDiv-subtxt">Exhibition activities</span>
                                    <img alt="標題裝飾線條圖示" className="headDiv-title-line" src={lineTitleImg} />
                                    <span className="headDiv-txt">展演活動</span>
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="content-box px-0">
                                    <div className="DIV-singleBox">
                                        <div className="control-singlebox">
                                            <a
                                                aria-label="圖片輪播播放中，點擊暫停"
                                                aria-pressed="true"
                                                className="toggle ms-1"
                                                href="javascript:void(0);"
                                                id="Exhibition_toggle"
                                                tabIndex={0}
                                                title="暫停"
                                            >
                                                <div className="control-toggle control-pause-icon">
                                                    <span className="sr-only">圖片輪播播放中，點擊暫停</span>
                                                </div>
                                            </a>
                                        </div>
                                    </div>

                                    <div className="owl-carousel owl-theme" id="Exhibition_owl_carousel" key={owlKey}>
                                        <GetData prop={allNews} />
                                    </div>

                                    <div className="position-absolute + d-flex + btn_right_S1 + btn_bottom_S1 + z-2">
                                        <div className="customize_btn">
                                            <LangLink
                                                className="Btn_a"
                                                to="/performance/seminar"
                                                role="button"
                                                tabIndex={0}
                                                target="_self"
                                                title="更多展演活動"
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
// #endregion

// #region EntityComp
const buildCategoryDict = (rows: CategoryDataSet[], lang: Lang): Record<string, string> =>
{
    // return：分類 id -> 名稱
    return rows.reduce<Record<string, string>>((acc, row) =>
    {
        const id = row.Category?.CategoryId;
        if (!id) return acc;

        const name = findTextByKey(row.CategoryDetail, (item) => item?.Lang, lang, (item) => item?.CategoryName);

        acc[String(id)] = name;
        return acc;
    }, {});
};


const buildTagDict = (rows: TagSet[], lang: Lang): Record<string, string> =>
{
    // return：標籤 id -> 名稱
    return rows.reduce<Record<string, string>>((acc, row) =>
    {
        const id = row.TagData?.TagId;
        if (!id) return acc;

        const name = findTextByKey(row.TagDetail, (item) => item?.Lang, lang, (item) => item?.TagName);

        acc[String(id)] = name;
        return acc;
    }, {});
};
// #endregion

// #region Private
const toListInitial = <TArgs, TItem>(args: TArgs, data: TItem[]) =>
{
    // return：符合 adapter hook 的 initial 結構
    return { args, apiRes: { IsSuccess: true, Data: data, SysMessage: [] } };
};


const formatDate = (dateStr: string) =>
{
    // 宣告變數：日期
    const date = new Date(dateStr);

    // return：首頁列表顯示格式
    return { day: date.getDate().toString().padStart(2, "0"), month: (date.getMonth() + 1).toString().padStart(2, "0"), year: date.getFullYear().toString() };
};


const splitCsvIds = (value: string | null | undefined): string[] =>
{
    // return：把 csv id 字串拆成陣列
    return (value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
};


const joinDisplayNames = (ids: string[], dict: Record<string, string>): string =>
{
    // return：依字典把 id 轉成顯示名稱
    return ids.map((id) => dict[id] ?? "").filter(Boolean).join(", ");
};


const getNewsDataProps = (
    newsData: AnnouncementSet[],
    lang: Lang,
    redir: string,
    categoryDict: Record<string, string>,
    tagDict: Record<string, string>,
): NewsItemViewModel[] =>
{
    // return：公告資料轉成畫面 props
    return newsData.slice(0, 6).map((item) =>
    {
        const categoryIds = splitCsvIds(item.Announcement?.Categories);
        const tagIds = splitCsvIds(item.Announcement?.Tags);
        const contentStatus = item.Announcement?.ContentStatus ?? 0;
        const validateStart = item.Announcement?.Validate_Start ?? "";
        const date = formatDate(validateStart);
        const monthNum = Number(new Date(validateStart).getUTCMonth() + 1);
        const internalId = item.Announcement?.InternalId ?? "";
        const pictureId = item.Announcement?.PictureId ?? "";

        return {
            redir,
            announceInternalId: internalId,
            title: findTextByKey(item.AnnouncementDetail, (p) => p?.Lang, lang, (p) => p?.Title),
            content: findTextByKey(item.AnnouncementDetail, (p) => p?.Lang, lang, (p) => p?.Content),
            date: date.day,
            month: date.month,
            year: date.year,
            monthNum,
            contentStatus,
            tagName: joinDisplayNames(tagIds, tagDict),
            categoryName: joinDisplayNames(categoryIds, categoryDict),
            internalId,
            pictureId,
        };
    });
};


const isWithinLastNDaysFromMD = (month1to12?: number, day1to31?: number, n: number = 8): boolean =>
{
    // 宣告變數：缺值直接不是最新
    if (!month1to12 || !day1to31) return false;

    const now = new Date();
    const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    let year = now.getUTCFullYear();
    let candidateUTC = Date.UTC(year, month1to12 - 1, day1to31);

    if (candidateUTC > nowUTC)
    {
        year -= 1;
        candidateUTC = Date.UTC(year, month1to12 - 1, day1to31);
    }

    const diffDays = Math.floor((nowUTC - candidateUTC) / DAY_MS);

    return diffDays >= 0 && diffDays <= n;
};


const resolvePictureUrl = (pictureId: string, title: string): string =>
{
    // return：有圖用 preview，沒圖用預設圖
    if (!pictureId) return defaultPic;
    return FileManagementAPI.get_Public_Preview_Url(pictureId, title);
};


const getJQuery = (): JQueryStatic | null =>
{
    // return：取得全域 jQuery，不擴充 Window 型別
    if (typeof window === "undefined") return null;

    const jqWindow = window as JQueryGlobal;
    return jqWindow.jQuery ?? jqWindow.$ ?? null;
};


const initOwlCarousel = ($owl: OwlJQueryElement): void =>
{
    // 執行 function：初始化 owl
    $owl.owlCarousel({
        items: 3,
        loop: true,
        dots: false,
        nav: true,
        margin: 30,
        autoplay: false,
        autoplayTimeout: 5000,
        autoplayHoverPause: true,
        responsive: { 0: { items: 2 }, 575: { items: 2 }, 767: { items: 2 }, 991: { items: 3 }, 1199: { items: 3 } },
    });
};


const updateToggleButton = ($toggle: JQuery<HTMLElement>, isPlaying: boolean): void =>
{
    // 宣告變數：按鈕內 icon / sr-only
    const $iconBox = $toggle.find(".control-toggle");
    const $srText = $toggle.find(".sr-only");

    // 執行 function：先清空舊狀態
    $iconBox.removeClass("control-play-icon control-pause-icon");

    // 執行 function：依播放狀態更新按鈕
    if (isPlaying)
    {
        $toggle.attr("aria-pressed", "true").attr("aria-label", "圖片輪播播放中，點擊暫停");

        $iconBox.addClass("control-pause-icon");
        $srText.text("圖片輪播播放中，點擊暫停");
        return;
    }

    $toggle.attr("aria-pressed", "false").attr("aria-label", "圖片輪播已暫停，點擊播放");

    $iconBox.addClass("control-play-icon");
    $srText.text("圖片輪播已暫停，點擊播放");
};


const useExhibitionList = (props: { listParam: QueryListParam; initialList: AnnouncementSet[]; }) =>
{
    // 宣告變數：adapter / initial
    const adapter = useMemo(() => AnnouncementAdapter(), []);
    const initial = useMemo(() =>
    {
        return toListInitial(props.listParam, props.initialList ?? []);
    }, [props.listParam, props.initialList]);

    // return：首頁展演公告列表
    return adapter.hooks.useQueryList({
        condition: props.listParam,
        initial,
        deps: [props.listParam.Condition ?? "", props.listParam.PageNumber ?? 0, props.listParam.PageSize ?? 0],
    });
};


const useCategoryTagDict = (
    props: { lang: Lang; cateParam: QueryListParam; tagParam: QueryListParam; initialCategories: CategoryDataSet[]; initialTags: TagSet[]; },
) =>
{
    // 宣告變數：adapter / initial
    const cateAdapter = useMemo(() => CategoryAdapter(), []);
    const tagAdapter = useMemo(() => TagAdapter(), []);

    const cateInitial = useMemo(() =>
    {
        return toListInitial(props.cateParam, props.initialCategories ?? []);
    }, [props.cateParam, props.initialCategories]);

    const tagInitial = useMemo(() =>
    {
        return toListInitial(props.tagParam, props.initialTags ?? []);
    }, [props.tagParam, props.initialTags]);

    // 執行 function：分類 / 標籤 hydration query
    const cateQuery = cateAdapter.hooks.useQueryList({ condition: props.cateParam, initial: cateInitial, deps: [props.cateParam.Condition ?? ""] });

    const tagQuery = tagAdapter.hooks.useQueryList({ condition: props.tagParam, initial: tagInitial, deps: [props.tagParam.Condition ?? ""] });

    // 宣告變數：字典
    const categoryDict = useMemo(() =>
    {
        return buildCategoryDict(cateQuery.data ?? [], props.lang);
    }, [cateQuery.data, props.lang]);

    const tagDict = useMemo(() =>
    {
        return buildTagDict(tagQuery.data ?? [], props.lang);
    }, [tagQuery.data, props.lang]);

    // return：畫面對照字典
    return { categoryDict, tagDict };
};


const GetData = ({ prop }: { prop: NewsItemViewModel[]; }) =>
{
    // return：owl item DOM
    return (
        <>
            {prop.map((item) =>
            {
                const picUrl = resolvePictureUrl(item.pictureId, item.title);

                return (
                    <div className="item" key={item.announceInternalId}>
                        <LangLink to={`${item.redir}/${item.internalId}`} title={item.title} tabIndex={0} className="item-inner">
                            <article className="cardbox">
                                <div className="card_content">
                                    <figure className="figure_Box">
                                        <div className="card_figure">
                                            <div className="img-wrapper">
                                                <img alt="" className="card_image" src={picUrl} />
                                            </div>
                                        </div>

                                        <div className="Arrow_RD_area">
                                            <div className="Frame_White">
                                                <div className="wrapper_icon">
                                                    <span className="icon_ii">
                                                        <i className="fas fa-long-arrow-alt-right" />
                                                        <span className="sr-only">前往</span>
                                                    </span>

                                                    <div className="sticky_corner + top-right-corner">
                                                        <img src={maskImg} className="card_image" alt="" />
                                                    </div>

                                                    <div className="sticky_corner + bottom-left-corner">
                                                        <img src={maskImg} className="card_image" alt="" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </figure>

                                    <div className="Text_Block_Area">
                                        <div className="card_catDiv">
                                            <div className="card_time">
                                                <i className="far fa-calendar-alt mr-2" />
                                                <span className="sr-only">日期</span>
                                                {item.year}-{item.month}-{item.date}
                                            </div>

                                            <div className="CustomState">
                                                {isWithinLastNDaysFromMD(Number(item.monthNum), Number(item.date)) && (
                                                    <span className="label icon-small label-warning">最新</span>
                                                )}

                                                {item.contentStatus !== 0 && (
                                                    <>
                                                        {Boolean(item.contentStatus & 1) && <span className="label icon-small label-success">置頂</span>}

                                                        {Boolean(item.contentStatus & 2) && <span className="label icon-small label-danger">熱門</span>}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="card_titleDiv + mb-md-4 mb-sm-3 mb-2">
                                            <div className="card_title">{item.title}</div>
                                        </div>

                                        <div className="card_StateDiv">
                                            <div className="card_cat">
                                                <div className="card_cat_link">
                                                    <span className="s-tle">
                                                        <i className="fas fa-tasks-alt mr-2" />
                                                        {item.categoryName}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </LangLink>
                    </div>
                );
            })}
        </>
    );
};
// #endregion
