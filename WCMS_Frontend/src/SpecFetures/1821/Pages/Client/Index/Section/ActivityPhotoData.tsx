import { IndexLabel } from "@/SpecFetures/1818/Pages/Client//Index/Section/IndexLabelText";
import { type Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { useEffect, useMemo } from "react";

import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WEB/Gallery_Api";

import { findTextByKey } from "@/SysCore/Utils/Library/LibData";

import { formatDateParts as formatDate } from "@/SysCore/Utils/Library/LibData";
import {
    buildClientCategoryTextDict as buildCategoryDict,
    buildClientListInitial as toListInitial,
    buildClientTagTextDict as buildTagDict,
    getAnnouncementSetKey,
    getGallerySetKey,
    takeTopThenFill,
    delayMs as sleep,
} from "@/Features/Pages/Client/Index/HomePage_Helper";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type GallerySet = components["schemas"]["GallerySet_DTO"];

type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"];

type TagSet = components["schemas"]["TagSet_DTO"];


// ----- 以下保留你原本的 helper（沿用） -----

interface getDataProp
{
    redir: string;
    galleryInternalId: string;
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
    PicSrcId: string;
}
// #endregion

// #region Public
export const ActivityPhotoData = (
    props: {
        lang: Lang;

        galleryTopParam: QueryListParam;
        galleryListParam: QueryListParam;
        cateParam: QueryListParam;
        tagParam: QueryListParam;

        initialTopList: GallerySet[];
        initialList: GallerySet[];
        initialCategories: CategoryDataSet[];
        initialTags: TagSet[];
    },
) =>
{
    // 宣告變數：adapters
    const galleryAdapter = useMemo(() => GalleryAdapter(), []);
    const cateAdapter = useMemo(() => CategoryAdapter(), []);
    const tagAdapter = useMemo(() => TagAdapter(), []);

    // 宣告變數：initial（必須 memo）
    const topInitial = useMemo(() => toListInitial(props.galleryTopParam, props.initialTopList ?? []), [props.galleryTopParam, props.initialTopList]);
    const listInitial = useMemo(() => toListInitial(props.galleryListParam, props.initialList ?? []), [props.galleryListParam, props.initialList]);
    const cateInitial = useMemo(() => toListInitial(props.cateParam, props.initialCategories ?? []), [props.cateParam, props.initialCategories]);
    const tagInitial = useMemo(() => toListInitial(props.tagParam, props.initialTags ?? []), [props.tagParam, props.initialTags]);

    // 執行：CSR hooks 接手（SSR 有 initial → 不重抓）
    const useTopList = galleryAdapter.hooks.useQueryList({
        condition: props.galleryTopParam,
        initial: topInitial,
        deps: [props.galleryTopParam.Condition ?? ""],
    });
    const useList = galleryAdapter.hooks.useQueryList({
        condition: props.galleryListParam,
        initial: listInitial,
        deps: [props.galleryListParam.Condition ?? ""],
    });
    const useCategoryData = cateAdapter.hooks.useQueryList({ condition: props.cateParam, initial: cateInitial, deps: [props.cateParam.Condition ?? ""] });
    const useTagData = tagAdapter.hooks.useQueryList({ condition: props.tagParam, initial: tagInitial, deps: [props.tagParam.Condition ?? ""] });

    // 宣告：合併（置頂優先補滿 6）
    const allGalleryRawData1 = useMemo(() =>
    {
        return takeTopThenFill(useTopList.data ?? [], useList.data ?? [], 6, getGallerySetKey);
    }, [useTopList.data, useList.data]);

    // 宣告：字典
    const categoryDict = useMemo(() =>
    {
        return buildCategoryDict(useCategoryData.data ?? [], props.lang);
    }, [useCategoryData.data, props.lang]);

    const tagDict = useMemo(() =>
    {
        return buildTagDict(useTagData.data ?? [], props.lang);
    }, [useTagData.data, props.lang]);

    // 宣告：轉成 UI props（沿用你原本函式）
    const allGallery1 = useMemo(() =>
    {
        return getGalleryDataProps(allGalleryRawData1, props.lang, "/announcement/announcement-activity", "", categoryDict, tagDict);
    }, [allGalleryRawData1, props.lang, categoryDict, tagDict]);

    // 宣告：owl dep key（避免每次 render 都 destroy/re-init）
    const owlKey = useMemo(() =>
    {
        return (allGallery1 ?? []).map((x) => x.internalId).join(",");
    }, [allGallery1]);

    type OwlOptions = Record<string, unknown>;

    type JQueryObj = {
        length: number;
        data: (key: string) => unknown;
        trigger: (evt: string, payload?: unknown[]) => void;
        owlCarousel: (opts: OwlOptions) => void;
        on: (evt: string, handler: (e: Event) => void) => void;
        off: (evt: string, handler: (e: Event) => void) => void;
        attr: (name: string, value: string) => JQueryObj;
        find: (sel: string) => JQueryObj;
        text: (value: string) => JQueryObj;
    };

    type JQueryLike = ((el: HTMLElement | string) => JQueryObj) & { fn?: { owlCarousel?: (opts: OwlOptions) => void; }; };

    

    const getJQuery = (): JQueryLike | null =>
    {
        const w = window as unknown as { $?: JQueryLike; jQuery?: JQueryLike; };
        return w.jQuery ?? w.$ ?? null;
    };

    const waitForOwlReady = async (p?: { timeoutMs?: number; intervalMs?: number; }) =>
    {
        const timeoutMs = p?.timeoutMs ?? 8000;
        const intervalMs = p?.intervalMs ?? 50;
        const start = Date.now();

        while (Date.now() - start < timeoutMs)
        {
            const $ = getJQuery();
            if ($?.fn?.owlCarousel) return $;
            await sleep(intervalMs);
        }
        return null;
    };

    const safeDestroyOwl = ($owl: JQueryObj) =>
    {
        try
        {
            if ($owl.data("owl.carousel")) $owl.trigger("destroy.owl.carousel");
        } catch
        {
            // ignore
        }
    };

    const setPlayPauseA11y = (p: { isPlaying: boolean; $start: JQueryObj; $pause: JQueryObj; }) =>
    {
        // 執行：同步 aria 狀態（避免 AA 警告）
        if (p.isPlaying)
        {
            p.$start.attr("aria-pressed", "true").attr("aria-label", "圖片輪播播放中").find(".sr-only").text("圖片輪播播放中");
            p.$pause.attr("aria-pressed", "false").attr("aria-label", "暫停圖片輪播").find(".sr-only").text("暫停圖片輪播");
            return;
        }
        p.$start.attr("aria-pressed", "false").attr("aria-label", "開始播放圖片輪播").find(".sr-only").text("開始播放圖片輪播");
        p.$pause.attr("aria-pressed", "true").attr("aria-label", "圖片輪播已暫停").find(".sr-only").text("圖片輪播已暫停");
    };

    // --------------------
    // 在 component 內：用 owlKey（你原本算的 join key）當依賴
    // --------------------
    useEffect(() =>
    {
        // SSR guard
        if (typeof window === "undefined") return;
        if (!allGallery1 || allGallery1.length === 0) return;

        let disposed = false;
        let $: JQueryLike | null = null;
        let $owl: JQueryObj | null = null;
        let $start: JQueryObj | null = null;
        let $pause: JQueryObj | null = null;

        let isPlaying = false;

        // 宣告：handler（要留 reference 才能 off）
        const onPause = (e: Event) =>
        {
            e.preventDefault?.();
            if (!$owl || !$start || !$pause) return;
            $owl.trigger("stop.owl.autoplay");
            isPlaying = false;
            setPlayPauseA11y({ isPlaying, $start, $pause });
        };

        const onStart = (e: Event) =>
        {
            e.preventDefault?.();
            if (!$owl || !$start || !$pause) return;
            $owl.trigger("play.owl.autoplay", [5000]);
            isPlaying = true;
            setPlayPauseA11y({ isPlaying, $start, $pause });
        };

        // 執行
        const run = async () =>
        {
            $ = await waitForOwlReady();
            if (disposed || !$) return;

            $owl = $("#Gallery_owl_carousel");
            if (!$owl || $owl.length === 0) return;

            safeDestroyOwl($owl);

            const opts: OwlOptions = {
                items: 4,
                dots: false,
                nav: true,
                margin: 30,
                autoplayTimeout: 5000,
                autoplayHoverPause: true,
                responsive: { 0: { items: 1 }, 500: { items: 2 }, 575: { items: 2 }, 767: { items: 2 }, 991: { items: 3 }, 1199: { items: 3 } },
            };

            try
            {
                $owl.owlCarousel(opts);
            } catch
            {
                // ignore
            }

            $start = $("#Gallery_start");
            $pause = $("#Gallery_pause");
            if ($start?.length) $start.on("click", onStart);
            if ($pause?.length) $pause.on("click", onPause);

            isPlaying = false;
            if ($start && $pause) setPlayPauseA11y({ isPlaying, $start, $pause });
        };

        run();

        // return：cleanup
        return () =>
        {
            disposed = true;

            if ($start) $start.off("click", onStart);
            if ($pause) $pause.off("click", onPause);
            if ($owl) safeDestroyOwl($owl);
        };
    }, [owlKey]);

    return (
        <section className="Gallery_section owl-box Layout_Padding_1_top Layout_Padding_1_bottom bg-white">
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize3">
                        <div className="row">
                            <div className="offset-3 col-6">
                                <div className="headDiv mb-lg-5 mb-4">
                                    <span className="headDiv-txt-5 tw">{IndexLabel(props.lang).AlbumTitle}</span>
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="content-box px-0 mb-5">
                                    <div className="owl-carousel owl-theme" id="Gallery_owl_carousel">
                                        <GetData prop={allGallery1}></GetData>
                                    </div>
                                    <div className="DIV-Box">
                                        <div className="control-box">
                                            <a
                                                aria-label="開始播放圖片輪播"
                                                aria-pressed="false"
                                                className="play me-1"
                                                href="javascript:void(0);"
                                                id="Gallery_start"
                                                tabIndex={0}
                                                title="播放"
                                            >
                                                <div className="contrl_start">
                                                    <span className="control-start-icon">
                                                        <span className="sr-only">開始播放圖片輪播</span>
                                                    </span>
                                                </div>
                                            </a>
                                            <a
                                                aria-label="暫停圖片輪播"
                                                aria-pressed="true"
                                                className="stop ms-1"
                                                href="javascript:void(0);"
                                                id="Gallery_pause"
                                                tabIndex={0}
                                                title="暫停"
                                            >
                                                <div className="contrl_pause">
                                                    <span className="control-pause-icon">
                                                        <span className="sr-only">暫停圖片輪播</span>
                                                    </span>
                                                </div>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="offset-6 col-6 mt-customize">
                                <div className="btn-w100-wrapper justify-content-end">
                                    <div className="customize_btn">
                                        <LangNavLink
                                            className="Btn_a"
                                            to="/announcement/announcement-activity"
                                            role="button"
                                            tabIndex={0}
                                            target="_self"
                                            title={IndexLabel(props.lang).MoreInfo}
                                            type="button"
                                        >
                                            <div className="BtnBox">
                                                <span>{IndexLabel(props.lang).MoreInfo}</span>
                                            </div>
                                        </LangNavLink>
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
const getGalleryDataProps = (
    GalleryData: GallerySet[],
    lang: string,
    redir: string,
    targetCategoryId: string,
    categoryDict: Record<string, string>,
    tagDict: Record<string, string>,
) =>
{
    const top6 = pickGallerysByCategories(GalleryData, targetCategoryId, 6, "any");
    const resultProps: getDataProp[] = [];
    top6.map((item) =>
    {
        const categoryIds = (item.Gallery?.Categories ?? "").split(",").map(s => s.trim()).filter(Boolean);
        const categoryName = categoryIds.map(id => categoryDict[id] ?? "").filter(Boolean).join(", ");
        const tags = (item.Gallery?.Tags ?? "").split(",").map(s => s.trim()).filter(Boolean);
        const tagsName = tags.map(id => tagDict[id] ?? "").filter(Boolean).join(", ");
        const contentStatus = item.Gallery?.ContentStatus ?? 0;
        const coverPicSrcId = item.Gallery?.CoverPicSrcId ?? "";
        const date = formatDate(item.Gallery?.Validate_Start ?? "");
        const monthNum = Number(new Date(item.Gallery?.Validate_Start ?? "").getUTCMonth() + 1);
        const InternalId = item.Gallery?.InternalId ?? "";
        resultProps.push({
            redir: redir,
            galleryInternalId: item.Gallery?.InternalId ?? "",
            title: item.GalleryInfo?.find(p => p.Lang === lang)?.Title ?? "",
            content: item.GalleryInfo?.find(p => p.Lang === lang)?.Content ?? "",
            date: date.day,
            month: date.month,
            year: date.year,
            monthNum: monthNum,
            contentStatus: contentStatus,
            tagName: tagsName,
            categoryName: categoryName,
            internalId: InternalId,
            PicSrcId: coverPicSrcId,
        });
    });
    return resultProps;
};


const pickGallerysByCategories = <T extends { Gallery?: { Categories?: string | null | undefined; }; }>(
    newsData: T[] | undefined,
    categories: string | string[],
    take: number = 6,
    mode: "any" | "all" = "any",
): T[] =>
{
    const target = new Set((Array.isArray(categories) ? categories : String(categories).split(",")).map(s => s.trim()).filter(Boolean));
    if (!newsData || target.size === 0) return (newsData ?? []).slice(0, take);
    const result = newsData.filter(item =>
    {
        const tokens = (item.Gallery?.Categories ?? "").split(",").map(s => s.trim()).filter(Boolean);
        if (tokens.length === 0) return false;
        return mode === "all" ? [...target].every(t => tokens.includes(t)) : tokens.some(t => target.has(t));
    });
    return result.slice(0, take);
};



const GetData = ({ prop }: { prop: getDataProp[]; }) =>
{
    return (
        <>
            {prop.map((item) =>
            {
                const imgUrl = FileManagementAPI.get_Public_Preview_Url(item.PicSrcId, item.title);
                return (
                    <div className="item" key={item.galleryInternalId}>
                        <LangLink to={`${item.redir}/${item.internalId}`} title={item.title} tabIndex={0} className="item-inner">
                            <div className="wrapper_box">
                                <div className="Qlink-item">
                                    <div className="Img_Div w-100">
                                        <div className="Qlinkimg-outer">
                                            <img alt={item.title} src={imgUrl} />
                                        </div>
                                    </div>
                                    <div className="Content_Div">
                                        <div className="box_content">
                                            <div className="tit-text">{item.title}</div>
                                            <div className="date">{item.year}-{item.month}-{item.date}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </LangLink>
                    </div>
                );
            })}
        </>
    );
};
// #endregion
