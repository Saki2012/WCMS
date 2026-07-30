import { delayMs } from "@/Features/Pages/Client/Index/HomePage_Helper";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

// #region Property
type SpecHomePage1821Model = components["schemas"]["SpecHomePage1821Model_DTO"];

interface HomePageLinkViewModel
{
    key: string;
    title: string;
    url: string;
    pictureId: string;
    pictureDescription: string;
}

interface OwlCarouselOptions
{
    items: number;
    loop: boolean;
    dots: boolean;
    nav: boolean;
    margin: number;
    autoplay: boolean;
    autoplayTimeout: number;
    autoplayHoverPause: boolean;
    responsive: Record<number, { items: number; }>;
}

interface JQueryCollectionLite
{
    owlCarousel?: (options: OwlCarouselOptions) => JQueryCollectionLite;
    trigger: (eventName: string, args?: unknown[]) => JQueryCollectionLite;
    data: (key: string) => unknown;
}

interface JQueryFactoryLite
{
    (target: Element): JQueryCollectionLite;
    fn?: { owlCarousel?: unknown; };
}

const RELATED_LINKS_AUTOPLAY_MS = 5000;
// #endregion

// #region Public
/** Section4：對標 prototype 的相關連結 Owl Carousel DOM。 */
export const Section4 = (props: { lang: Lang; header: SpecHomePage1821Model; data: HomePageLinkViewModel[]; }) =>
{
    const links = props.data ?? [];
    const carouselDep = links.map((item) => item.key).join("|");
    const carousel = useRelatedLinksCarousel(carouselDep, links.length);
    if (links.length === 0) return null;

    return (
        <section className="RelatedLinks_section owl-box Layout_Padding_1">
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize0">
                        <div className="row mx-0">
                            <HeaderSection header={props.header} />
                            <RelatedLinksContent
                                lang={props.lang}
                                links={links}
                                header={props.header}
                                carouselRef={carousel.carouselRef}
                                isPlaying={carousel.isPlaying}
                                onToggle={carousel.toggleCarousel}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
// #endregion

// #region Section
/** 相關連結標題區塊。 */
const HeaderSection = (props: { header: SpecHomePage1821Model; }) =>
{
    return (
        <div className="col-12">
            <div className="headDiv headDiv-left mb-sm-5 mb-4">
                <span className="headDiv-txt">{props.header.Section4Title || "相關連結"}</span>
                <span className="diagonal-line mx-2">/</span>
                <span className="headDiv-subtxt">{props.header.Section4SubTitle || "Links"}</span>
            </div>
        </div>
    );
};

/** 相關連結內容區塊。 */
const RelatedLinksContent = (props: {
    lang: Lang;
    links: HomePageLinkViewModel[];
    header: SpecHomePage1821Model;
    carouselRef: RefObject<HTMLDivElement>;
    isPlaying: boolean;
    onToggle: () => void;
}) =>
{
    return (
        <div className="col-12">
            <div className="content-box px-0">
                <CarouselToggle isPlaying={props.isPlaying} onToggle={props.onToggle} />
                <div id="RelatedLinks_owl_carousel" className="owl-carousel owl-theme" ref={props.carouselRef}>
                    {props.links.map((item) => <RelatedLinkItem key={item.key} item={item} lang={props.lang} />)}
                </div>
                <MoreLink lang={props.lang} to={props.header.LinkViewMore} />
            </div>
        </div>
    );
};
// #endregion

// #region EntityComp
/** 相關連結播放 / 暫停按鈕。 */
const CarouselToggle = (props: { isPlaying: boolean; onToggle: () => void; }) =>
{
    const label = props.isPlaying ? "圖片輪播播放中，點擊暫停" : "圖片輪播已暫停，點擊播放";
    const iconClass = props.isPlaying ? "control-pause-icon" : "control-play-icon";

    return (
        <div className="DIV-singleBox">
            <div className="control-singlebox">
                <a
                    id="RelatedLinks_toggle"
                    href="#"
                    className="toggle ms-1"
                    aria-label={label}
                    aria-pressed={props.isPlaying}
                    title={props.isPlaying ? "暫停" : "播放"}
                    onClick={(e) =>
                    {
                        e.preventDefault();
                        props.onToggle();
                    }}
                >
                    <div className={`control-toggle ${iconClass}`}>
                        <span className="sr-only">{label}</span>
                    </div>
                </a>
            </div>
        </div>
    );
};

/** 相關連結輪播項目。 */
const RelatedLinkItem = (props: { item: HomePageLinkViewModel; lang: Lang; }) =>
{
    const content = <RelatedLinkContent item={props.item} />;
    return (
        <div className="item">
            {LibText.isNonEmptyString(props.item.url)
                ? <LangLink to={props.item.url} lang={props.lang} title={props.item.title}>{content}</LangLink>
                : <div>{content}</div>}
        </div>
    );
};

/** 相關連結圖文內容。 */
const RelatedLinkContent = (props: { item: HomePageLinkViewModel; }) =>
{
    const alt = props.item.pictureDescription || props.item.title;

    return (
        <div className="wrapper_box">
            <div className="Qlink-item">
                <div className="Img_Div w-100">
                    <div className="Qlinkimg-outer">
                        {LibText.isNonEmptyString(props.item.pictureId)
                            ? <img src={FileManagementAPI.get_Public_Preview_Url(props.item.pictureId, alt)} alt={alt} />
                            : <span className="tit-text">{props.item.title}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

/** 更多相關連結按鈕。 */
const MoreLink = (props: { lang: Lang; to?: string | null; }) =>
{
    if (!LibText.isNonEmptyString(props.to)) return null;

    return (
        <div className="position-absolute d-flex btn_right_S1 btn_bottom_S1 z-2">
            <div className="customize_btn">
                <LangLink to={props.to ?? ""} lang={props.lang} className="Btn_a" role="button" title="更多相關連結">
                    <div className="BtnBox">
                        <span>View More</span>
                        <span className="ml-2">
                            <i className="fas fa-long-arrow-alt-right" aria-hidden="true" />
                        </span>
                    </div>
                </LangLink>
            </div>
        </div>
    );
};
// #endregion

// #region Private
/** 初始化相關連結 Owl Carousel。 */
const useRelatedLinksCarousel = (carouselDep: string, itemCount: number) =>
{
    const carouselRef = useRef<HTMLDivElement>(null);
    const owlRef = useRef<JQueryCollectionLite | null>(null);
    const [isPlaying, setIsPlaying] = useState(true);

    useEffect(() =>
    {
        if (typeof window === "undefined") return;
        const root = carouselRef.current;
        if (!root || itemCount <= 0) return;

        let cleanup: (() => void) | undefined;
        let disposed = false;

        initRelatedLinksCarousel(root, itemCount, (owl) =>
        {
            if (disposed) return;
            owlRef.current = owl;
            setIsPlaying(true);
            cleanup = () => destroyOwlCarousel(owl);
        });

        return () =>
        {
            disposed = true;
            cleanup?.();
            owlRef.current = null;
        };
    }, [carouselDep, itemCount]);

    const toggleCarousel = useCallback(() =>
    {
        const nextIsPlaying = !isPlaying;
        controlOwlAutoplay(owlRef.current, nextIsPlaying);
        setIsPlaying(nextIsPlaying);
    }, [isPlaying]);

    return { carouselRef, isPlaying, toggleCarousel };
};

/** 等待 Owl 載入後初始化，失敗時至少讓資料可見。 */
const initRelatedLinksCarousel = async (root: HTMLDivElement, itemCount: number, onReady: (owl: JQueryCollectionLite) => void): Promise<void> =>
{
    const $ = await waitForOwlReady();
    if (!$)
    {
        root.classList.add("owl-loaded");
        root.style.display = "block";
        return;
    }

    const owl = $(root);
    destroyOwlCarousel(owl);
    root.style.display = "";
    owl.owlCarousel?.(buildOwlOptions(itemCount));
    onReady(owl);
};

/** 等待 jQuery Owl Carousel 掛載完成。 */
const waitForOwlReady = async () =>
{
    const timeoutMs = 12000;
    const intervalMs = 50;
    const start = Date.now();

    while (Date.now() - start < timeoutMs)
    {
        const jq = getJQuery();
        if (jq) return jq;
        await delayMs(intervalMs);
    }

    return null;
};

/** 取得目前頁面已掛載的 jQuery。 */
const getJQuery = (): JQueryFactoryLite | null =>
{
    const currentWindow = window as Window & { jQuery?: JQueryFactoryLite; $?: JQueryFactoryLite; };
    const jq = currentWindow.jQuery ?? currentWindow.$;
    return jq?.fn?.owlCarousel ? jq : null;
};

/** 建立相關連結輪播設定。 */
const buildOwlOptions = (itemCount: number): OwlCarouselOptions =>
{
    return {
        items: 5,
        loop: itemCount > 5,
        dots: false,
        nav: true,
        margin: 30,
        autoplay: true,
        autoplayTimeout: RELATED_LINKS_AUTOPLAY_MS,
        autoplayHoverPause: true,
        responsive: {
            0: { items: 2 },
            575: { items: 2 },
            767: { items: 3 },
            991: { items: 4 },
            1199: { items: 5 },
        },
    };
};

/** 控制相關連結輪播播放狀態。 */
const controlOwlAutoplay = (owl: JQueryCollectionLite | null, isPlaying: boolean): void =>
{
    if (!owl) return;
    if (isPlaying) owl.trigger("play.owl.autoplay", [RELATED_LINKS_AUTOPLAY_MS]);
    else owl.trigger("stop.owl.autoplay");
};

/** 銷毀既有 Owl，避免 React 重掛時重複初始化。 */
const destroyOwlCarousel = (owl: JQueryCollectionLite): void =>
{
    try
    {
        if (owl.data("owl.carousel")) owl.trigger("destroy.owl.carousel");
    } catch
    {
        // Owl 尚未完成初始化時略過銷毀錯誤。
    }
};
// #endregion
