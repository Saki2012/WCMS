import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import bgImg from "@/SpecFetures/1817/Assets/Client/images/bg/underline_04_W_1920x292.svg";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { useEffect, useMemo, useRef } from "react";

// #region Property
type BannerSet = components["schemas"]["BannerSet_DTO"];

type BannerDetail = NonNullable<BannerSet["BannerDetail"]>[number];

type BannerDetailInfo = NonNullable<BannerSet["BannerDetailInfo"]>[number];

interface SpecialLinkDataProps
{
    lang: Lang;
    internalId: string;
    initialBanner: BannerSet | null;
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
// #endregion

// #region Public
export const SpecialLinkData = (props: SpecialLinkDataProps) =>
{
    // 宣告變數：adapter
    const adapter = useMemo(() => BannerSliderAdapter(), []);

    // 宣告變數：SSR initial
    const initial = useMemo(() =>
    {
        return buildQueryDataInitial(props.internalId, props.initialBanner);
    }, [props.internalId, props.initialBanner]);

    // 執行 function：Banner QueryData
    const bannerQuery = adapter.hooks.useQueryData({ internalId: props.internalId, initial, deps: [props.internalId] });

    // 宣告變數：排序後明細
    const sortedDetails = useMemo(() =>
    {
        return sortBannerDetails(bannerQuery.data ?? null);
    }, [bannerQuery.data]);

    // 宣告變數：owl 重建 key
    const owlKey = useMemo(() =>
    {
        return buildOwlKey(props.lang, bannerQuery.data ?? null);
    }, [props.lang, bannerQuery.data]);

    // 宣告變數：DOM ref
    const carouselRef = useRef<HTMLDivElement | null>(null);
    const toggleRef = useRef<HTMLAnchorElement | null>(null);

    useEffect(() =>
    {
        // 執行 function：SSR 防護
        if (typeof window === "undefined") return;
        if (sortedDetails.length === 0) return;

        // 宣告變數：jQuery
        const $ = getJQuery();
        if (!$) return;

        const owlFn = $.fn as ({ owlCarousel?: unknown; } & object) | undefined;
        if (!owlFn?.owlCarousel) return;

        if (!$ || !owlFn?.owlCarousel) return;

        // 宣告變數：目標元素
        const carouselEl = carouselRef.current;
        const toggleEl = toggleRef.current;

        if (!carouselEl || !toggleEl) return;

        const $owl = $(carouselEl) as OwlJQueryElement;

        if ($owl.length === 0) return;

        // 宣告變數：播放狀態
        let isPlaying = false;

        // 執行 function：先清舊 owl 再重建
        destroyOwlSafe($owl);
        initOwlCarousel($owl);
        updateToggleButton(toggleEl, isPlaying);

        const togglePlayState = (): void =>
        {
            // 執行 function：切換播放 / 暫停
            if (isPlaying)
            {
                $owl.trigger("stop.owl.autoplay");
                isPlaying = false;
            } else
            {
                $owl.trigger("play.owl.autoplay", [5000]);
                isPlaying = true;
            }

            updateToggleButton(toggleEl, isPlaying);
        };

        const handleToggleClick = (event: MouseEvent): void =>
        {
            // 執行 function：點擊切換播放
            event.preventDefault();
            togglePlayState();
        };

        const handleToggleKeydown = (event: KeyboardEvent): void =>
        {
            // 執行 function：支援 Enter / Space
            if (event.key !== "Enter" && event.key !== " ") return;

            event.preventDefault();
            togglePlayState();
        };

        // 執行 function：綁定原生事件
        toggleEl.addEventListener("click", handleToggleClick);
        toggleEl.addEventListener("keydown", handleToggleKeydown);

        return () =>
        {
            // 執行 function：解除事件與清理 owl
            toggleEl.removeEventListener("click", handleToggleClick);
            toggleEl.removeEventListener("keydown", handleToggleKeydown);
            destroyOwlSafe($owl);
        };
    }, [owlKey, sortedDetails.length]);

    return (
        <section
            className="Zone_section + owl-box + Layout_Padding_1_top + Layout_Padding_5_bottom + bg-custom-Customize_color"
            style={{ backgroundImage: `url(${bgImg})` }}
        >
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="circle-1 iMG-Shape-3" />
                    <div className="container-customize3">
                        <div className="row">
                            <div className="col-12" />

                            <div className="col-12">
                                <div className="content-box px-0">
                                    <div className="DIV-singleBox">
                                        <div className="control-singlebox">
                                            <a
                                                aria-label="圖片輪播已暫停，點擊播放"
                                                aria-pressed="false"
                                                className="toggle ms-1"
                                                href="#"
                                                id="Zone_toggle"
                                                ref={toggleRef}
                                                tabIndex={0}
                                                title="播放"
                                            >
                                                <div className="control-toggle control-play-icon">
                                                    <span className="sr-only">圖片輪播已暫停，點擊播放</span>
                                                </div>
                                            </a>
                                        </div>
                                    </div>

                                    <div className="owl-carousel owl-theme" id="Zone_owl_carousel" key={owlKey} ref={carouselRef}>
                                        {sortedDetails.map((item, index) =>
                                        {
                                            const info = findBannerInfo(bannerQuery.data ?? null, item.BannerId, item.RowId, props.lang);

                                            return renderLinkCard({ item, info, index });
                                        })}
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

// #region Protected
const buildQueryDataInitial = (internalId: string, banner: BannerSet | null): ApiLoaderData<string, BannerSet> | null =>
{
    // 宣告變數：沒有 SSR 初始資料時直接回 null
    if (!banner) return null;

    const apiRes: ApiResponse<BannerSet> = { IsSuccess: true, Data: banner, SysMessage: [] };

    // return：Hydration 初始資料
    return { args: internalId, apiRes };
};

const buildOwlKey = (lang: Lang, banner: BannerSet | null): string =>
{
    // 宣告變數：排序後資料
    const details = sortBannerDetails(banner);

    // return：資料變更時用來強制重建 owl
    return `${lang}|${details.map((item) => `${item.RowId ?? ""}_${item.PicSrcId ?? ""}_${item.Sort ?? ""}`).join("|")}`;
};

const renderLinkCard = (props: { item: BannerDetail; info: BannerDetailInfo | undefined; index: number; }) =>
{
    // 宣告變數：畫面資料
    const alt = props.info?.Title ?? "";
    const url = props.info?.URL ?? "";
    const target = props.info?.URL_Open === 0 ? "_self" : "_blank";
    const imgUrl = FileManagementAPI.get_Public_Preview_Url(props.item.PicSrcId, alt);

    const cardBody = (
        <article className="cardbox">
            <div className="card_content">
                <figure className="figure_Box">
                    <div className="card_figure">
                        <div className="img-wrapper">
                            <img className="card_image" alt={alt} src={imgUrl} />
                        </div>
                    </div>

                    <div className="Arrow_ZZ_area">
                        <span className="Zonelink-arrow">
                            <i className="fas fa-long-arrow-alt-right" />
                            <span className="sr-only">前往</span>
                        </span>
                    </div>
                </figure>

                <div className="Text_Block_Area">
                    <div className="card_titleDiv">
                        <div className="card_title">{alt}</div>
                    </div>
                </div>
            </div>
        </article>
    );

    // return：有連結就渲染 LangLink，否則維持卡片
    if (!url)
    {
        return <div className="item" key={props.item.RowId ?? props.index}>{cardBody}</div>;
    }

    return (
        <div className="item" key={props.item.RowId ?? props.index}>
            <LangLink
                aria-label={alt}
                to={url}
                role="button"
                tabIndex={0}
                target={target}
                title={alt}
                rel={target === "_blank" ? "noopener noreferrer" : undefined}
            >
                {cardBody}
            </LangLink>
        </div>
    );
};
// #endregion

// #region Private
const getJQuery = (): JQueryStatic | null =>
{
    // return：取得全域 jQuery
    if (typeof window === "undefined") return null;

    const jqWindow = window as JQueryGlobal;
    return jqWindow.jQuery ?? jqWindow.$ ?? null;
};

const sortBannerDetails = (banner: BannerSet | null): BannerDetail[] =>
{
    // 宣告變數：原始明細
    const list = banner?.BannerDetail ?? [];

    // return：依 Sort 與 RowId 穩定排序
    return [...list].sort((a, b) =>
    {
        const aSort = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
        const bSort = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;

        return aSort - bSort || (a.RowId ?? 0) - (b.RowId ?? 0);
    });
};

const initOwlCarousel = ($owl: OwlJQueryElement): void =>
{
    // 執行 function：初始化 owl
    $owl.owlCarousel({
        items: 5,
        loop: false,
        dots: false,
        nav: true,
        margin: 30,
        autoplay: false,
        autoplayTimeout: 5000,
        autoplayHoverPause: true,
        responsive: { 0: { items: 2 }, 575: { items: 2 }, 767: { items: 3 }, 991: { items: 4 }, 1199: { items: 5 } },
    });
};

const destroyOwlSafe = ($owl: JQuery<HTMLElement>): void =>
{
    // 執行 function：安全摧毀 owl
    try
    {
        $owl.trigger("destroy.owl.carousel");
    } catch
    {
        //
    }
};

const updateToggleButton = (toggleEl: HTMLAnchorElement, isPlaying: boolean): void =>
{
    // 宣告變數：按鈕內 icon / sr-only
    const iconBox = toggleEl.querySelector(".control-toggle");
    const srText = toggleEl.querySelector(".sr-only");

    // 執行 function：清空舊狀態
    iconBox?.classList.remove("control-play-icon", "control-pause-icon");

    if (isPlaying)
    {
        toggleEl.setAttribute("aria-pressed", "true");
        toggleEl.setAttribute("title", "暫停");
        toggleEl.setAttribute("aria-label", "圖片輪播播放中，點擊暫停");

        iconBox?.classList.add("control-pause-icon");

        if (srText)
        {
            srText.textContent = "圖片輪播播放中，點擊暫停";
        }
        return;
    }

    toggleEl.setAttribute("aria-pressed", "false");
    toggleEl.setAttribute("title", "播放");
    toggleEl.setAttribute("aria-label", "圖片輪播已暫停，點擊播放");

    iconBox?.classList.add("control-play-icon");

    if (srText)
    {
        srText.textContent = "圖片輪播已暫停，點擊播放";
    }
};

const findBannerInfo = (
    banner: BannerSet | null,
    bannerId: string | null | undefined,
    rowId: number | null | undefined,
    lang: Lang,
): BannerDetailInfo | undefined =>
{
    // return：依語系找對應資訊
    return banner?.BannerDetailInfo?.find((item) =>
    {
        return (item.BannerId === bannerId && item.ParentRowId === rowId && item.Lang === lang);
    });
};
// #endregion
