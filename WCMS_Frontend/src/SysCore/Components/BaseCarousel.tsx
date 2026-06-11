// #region Property
declare global
{
    interface Window
    {
        $?: JQueryStatic;
        jQuery?: JQueryStatic;
    }
    interface JQuery<TElement = HTMLElement>
    {
        owlCarousel?: (options?: OwlCarouselOptions) => JQuery<TElement>;
    }
}
interface OwlCarouselProps
{
    selectorId: string;
    itemCount: number;
}
interface OwlCarouselOptions
{
    items: number;
    loop: boolean;
    dots: boolean;
    nav: boolean;
    margin: number;
    autoplayTimeout: number;
    autoplayHoverPause: boolean;
    responsive: Record<number, { items: number; }>;
}
// #endregion

// #region Public
/** 啟用 OwlCarousel 輪播元件。 */
export const BaseCarousel = ({ selectorId, itemCount }: OwlCarouselProps): void =>
{
    if (typeof window === "undefined") return;

    const jqueryInstance = window.$;
    if (typeof jqueryInstance !== "function") return;

    const $el = jqueryInstance(selectorId);
    if ($el.length === 0) return;
    if (typeof $el.owlCarousel !== "function") return;

    $el.owlCarousel(buildOwlCarouselOptions(itemCount));
    bindOwlCarouselControl(jqueryInstance, $el, selectorId);
};
// #endregion

// #region Private
/** 建立 OwlCarousel 初始化設定。 */
const buildOwlCarouselOptions = (itemCount: number): OwlCarouselOptions =>
{
    return {
        items: itemCount,
        loop: true,
        dots: true,
        nav: true,
        margin: 30,
        autoplayTimeout: 3000,
        autoplayHoverPause: true,
        responsive: {
            0: { items: 1 },
            767: { items: 2 },
            991: { items: 3 },
            1200: { items: itemCount },
        },
    };
};

/** 綁定 OwlCarousel 播放、暫停與鍵盤焦點設定。 */
const bindOwlCarouselControl = (jqueryInstance: JQueryStatic, $el: JQuery<HTMLElement>, selectorId: string): void =>
{
    jqueryInstance(`${selectorId}_start`).on("click", () =>
    {
        $el.trigger("play.owl.autoplay", [6000]);
    });

    jqueryInstance(`${selectorId}_pause`).on("click", () =>
    {
        $el.trigger("stop.owl.autoplay");
    });

    jqueryInstance(`${selectorId} .owl-nav button`).attr("tabIndex", "7");
};
// #endregion
