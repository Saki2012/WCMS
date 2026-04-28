import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import { IndexLabel } from "@/SpecFetures/1818/Pages/Client//Index/Section/IndexLabelText";
import { type Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { useEffect, useMemo, useRef } from "react";

type BannerSet = components["schemas"]["BannerSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

export const LinkData = (props: { lang?: Lang; bannerParam: QueryListParam; initialBanner: BannerSet | null; }) =>
{
    // 宣告變數：adapter
    const adapter = useMemo(() => BannerSliderAdapter(), []);

    // 宣告變數：把 loader 的 single banner 包成 queryList initial（Data 是 array）
    const listInitial = useMemo(() =>
    {
        if (!props.initialBanner) return null;
        return { args: props.bannerParam, apiRes: { IsSuccess: true, Data: [props.initialBanner], SysMessage: [] } };
    }, [props.bannerParam, props.initialBanner]);

    // 執行 function：CSR 用 adapter hook 接手（SSR 有 initial → 不重抓；CSR 無 initial → 會自動抓）
    const useList = adapter.hooks.useQueryList({ condition: props.bannerParam, initial: listInitial ?? undefined, deps: [props.bannerParam.Condition ?? ""] });

    // 宣告變數：本頁只需要第一筆 BannerSet
    const bannerSet = useMemo(() => useList.data?.[0] ?? null, [useList.data]);

    // 宣告變數：排序 detail（維持你原本排序邏輯）
    const sortedDetails = useMemo(() =>
    {
        const list = bannerSet?.BannerDetail ?? [];
        return [...list].sort((a, b) =>
        {
            const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
            const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
            if (as !== bs) return as - bs;
            const ar = Number.isFinite(a?.RowId) ? Number(a.RowId) : Number.MAX_SAFE_INTEGER;
            const br = Number.isFinite(b?.RowId) ? Number(b.RowId) : Number.MAX_SAFE_INTEGER;
            return ar - br;
        });
    }, [bannerSet?.BannerDetail]);

    // 執行 function：初始化 owl（用長度當依賴即可）
    const { carouselRef, pauseRef, startRef } = useLinksCarousel(sortedDetails.length);

    // （你原本的 imgMapRef/useEffect 沒有被使用，我先保留不動，避免你後續要用）
    const imgMapRef = useRef<Record<string, string>>({});
    useEffect(() =>
    {
        if (typeof window === "undefined") return;
        if (!sortedDetails.length) return;

        const run = async () =>
        {
            const tasks = sortedDetails.map(async (d) =>
            {
                const id = d?.PicSrcId ?? "";
                if (!id) return { id, url: "" };
                const url = FileManagementAPI.get_Public_Preview_Url(id);
                return { id, url };
            });

            const res = await Promise.all(tasks);
            const map: Record<string, string> = {};
            res.forEach(x =>
            {
                if (x.id) map[x.id] = x.url;
            });
            imgMapRef.current = map;
        };

        run();
    }, [sortedDetails.length]);

    return (
        <section className="Links_section owl-box Layout_Padding_1_top Layout_Padding_1_bottom bg-white">
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize3">
                        <div className="row">
                            <div className="offset-3 col-9">
                                <div className="headDiv mb-lg-5 mb-4">
                                    <span className="headDiv-txt tw">{IndexLabel(props.lang).LinkDataTitle}</span>
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="content-box px-0 mb-5">
                                    <div className="owl-carousel owl-theme" id="Links_owl_carousel" ref={carouselRef}>
                                        {sortedDetails.map((p, i) =>
                                        {
                                            const info = bannerSet?.BannerDetailInfo?.find(x =>
                                                x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === (props.lang ?? "zh-tw")
                                            );
                                            const alt = info?.Title ?? "";
                                            const url = info?.URL ?? "";
                                            const open = info?.URL_Open ?? 0;

                                            return (
                                                <div key={i} className="item">
                                                    <a
                                                        href={url}
                                                        tabIndex={0}
                                                        target={open === 1 ? "_blank" : "_self"}
                                                        rel={open === 1 ? "noopener noreferrer" : undefined}
                                                        title={alt}
                                                    >
                                                        <div className="wrapper_box">
                                                            <div className="Qlink-item">
                                                                <div className="Content_Div">
                                                                    <div className="box_content">
                                                                        <div className="tit-text">{alt}</div>
                                                                    </div>
                                                                </div>

                                                                <div className="Img_Div w-100">
                                                                    <div className="Qlinkimg-outer">
                                                                        <img alt={alt} src={FileManagementAPI.get_Public_Preview_Url(p.PicSrcId, alt)} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </a>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="DIV-Box">
                                        <div className="control-box">
                                            <a
                                                aria-label="開始播放圖片輪播"
                                                aria-pressed="false"
                                                className="play me-1"
                                                href="#"
                                                onClick={(e) =>
                                                {
                                                    e.preventDefault();
                                                }}
                                                data-bs-target="#carousel-Controls"
                                                id="Links_start"
                                                tabIndex={0}
                                                title="播放"
                                                ref={startRef}
                                            >
                                                <div id="cycleCarousel" className="contrl_start">
                                                    <span className="control-start-icon">
                                                        <span className="sr-only">開始播放圖片輪播</span>
                                                    </span>
                                                </div>
                                            </a>

                                            <a
                                                aria-label="暫停圖片輪播"
                                                aria-pressed="true"
                                                className="stop ms-1"
                                                href="#"
                                                onClick={(e) =>
                                                {
                                                    e.preventDefault();
                                                }}
                                                data-bs-target="#carousel-Controls"
                                                id="Links_pause"
                                                tabIndex={0}
                                                title="暫停"
                                                type="button"
                                                ref={pauseRef}
                                            >
                                                <div id="pauseCarousel" className="contrl_pause">
                                                    <span className="control-pause-icon">
                                                        <span className="sr-only">暫停圖片輪播</span>
                                                    </span>
                                                </div>
                                            </a>
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

// --------------------
// 以下維持你原本的 Owl 初始化（只改掉 any）
// --------------------
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const waitForOwlReady = async (opt?: { timeoutMs?: number; intervalMs?: number; }) =>
{
    // 宣告變數
    const timeoutMs = opt?.timeoutMs ?? 12000;
    const intervalMs = opt?.intervalMs ?? 50;
    const start = Date.now();

    // 執行：輪詢等待 LoadSpecJs 掛載 jQuery / owlCarousel
    while (Date.now() - start < timeoutMs)
    {
        const w = window as any;
        const $ = w.jQuery ?? w.$;
        if ($?.fn?.owlCarousel) return $;
        await sleep(intervalMs);
    }

    // return：逾時就放棄（不擋頁面）
    return null;
};

const useLinksCarousel = (dep: number) =>
{
    // 宣告變數
    const carouselRef = useRef<HTMLDivElement | null>(null);
    const pauseRef = useRef<HTMLAnchorElement | null>(null);
    const startRef = useRef<HTMLAnchorElement | null>(null);

    useEffect(() =>
    {
        // SSR guard
        if (typeof window === "undefined") return;

        // 宣告：DOM ref
        const root = carouselRef.current;
        if (!root) return;

        let cleanup: (() => void) | undefined;

        // 執行：等待 owl plugin ready 後再 init
        (async () =>
        {
            const $ = await waitForOwlReady();
            if (!$) return;

            const $owl = $(root);

            // 先 destroy 避免重複 init
            try
            {
                if ($owl.data("owl.carousel")) $owl.trigger("destroy.owl.carousel");
            } catch
            {
                /* ignore */
            }

            const opts = {
                items: 4,
                dots: false,
                nav: true,
                margin: 30,
                autoplayTimeout: 5000,
                autoplayHoverPause: true,
                responsive: { 0: { items: 1 }, 500: { items: 2 }, 575: { items: 2 }, 767: { items: 3 }, 991: { items: 3 }, 1199: { items: 4 } },
            };

            let isPlaying = false;
            $owl.owlCarousel(opts);

            const $pause = $(pauseRef.current ?? document.getElementById("Links_pause"));
            const $start = $(startRef.current ?? document.getElementById("Links_start"));

            const updateControls = () =>
            {
                if (isPlaying)
                {
                    $start.attr("aria-pressed", "true").attr("aria-label", "圖片輪播播放中").find(".sr-only").text("圖片輪播播放中");
                    $pause.attr("aria-pressed", "false").attr("aria-label", "暫停圖片輪播").find(".sr-only").text("暫停圖片輪播");
                } else
                {
                    $start.attr("aria-pressed", "false").attr("aria-label", "開始播放圖片輪播").find(".sr-only").text("開始播放圖片輪播");
                    $pause.attr("aria-pressed", "true").attr("aria-label", "圖片輪播已暫停").find(".sr-only").text("圖片輪播已暫停");
                }
            };

            const onPauseClick = (ev: Event) =>
            {
                ev.preventDefault?.();
                $owl.trigger("stop.owl.autoplay");
                isPlaying = false;
                updateControls();
            };

            const onStartClick = (ev: Event) =>
            {
                ev.preventDefault?.();
                $owl.trigger("play.owl.autoplay", [opts.autoplayTimeout]);
                isPlaying = true;
                updateControls();
            };

            $pause.on("click", onPauseClick);
            $start.on("click", onStartClick);

            isPlaying = false;
            updateControls();

            cleanup = () =>
            {
                try
                {
                    $pause.off("click", onPauseClick);
                    $start.off("click", onStartClick);
                    if ($owl.data("owl.carousel")) $owl.trigger("destroy.owl.carousel");
                } catch
                {
                    /* ignore */
                }
            };
        })();

        // return
        return () => cleanup?.();
    }, [dep]);

    return { carouselRef, pauseRef, startRef };
};
