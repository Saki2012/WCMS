import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import { type Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { useEffect, useMemo, useRef } from "react";

import icon1 from "@/SpecFetures/1816/Assets/Client/images/collections/Collect-icon-01.svg";
import icon2 from "@/SpecFetures/1816/Assets/Client/images/collections/Collect-icon-02.svg";
import icon3 from "@/SpecFetures/1816/Assets/Client/images/collections/Collect-icon-03.svg";
import icon4 from "@/SpecFetures/1816/Assets/Client/images/collections/Collect-icon-04.svg";

type BannerSet = components["schemas"]["BannerSet_DTO"];

const buildQueryDataInitial = (internalId: string, banner: BannerSet | null): ApiLoaderData<string, BannerSet> | null =>
{
    // 宣告變數：沒有 SSR initial 就回 null（CSR 會自己抓）
    if (!banner) return null;

    // 宣告變數：組成功 env
    const apiRes: ApiResponse<BannerSet> = { IsSuccess: true, Data: banner, SysMessage: [] };

    // return
    return { args: internalId, apiRes };
};

export const CollectionsData = (props: { lang: Lang; internalId: string; initialBanner: BannerSet | null; }) =>
{
    // 宣告變數：Adapter（固定一次）
    const adapter = useMemo(() => BannerSliderAdapter(), []);

    // 宣告變數：SSR initial（QueryData 單筆）
    const initial = useMemo(() =>
    {
        return buildQueryDataInitial(props.internalId, props.initialBanner);
    }, [props.internalId, props.initialBanner]);

    // 宣告變數：取得館藏櫥窗 Banner 資料（SSR 有 initial → hydration 不重抓）
    const useBanner = adapter.hooks.useQueryData({ internalId: props.internalId, initial, deps: [props.internalId, props.lang] });

    const carouselRef = useRef<HTMLDivElement | null>(null);
    const toggleRef = useRef<HTMLAnchorElement | null>(null);

    // 執行 function：依 Rank 排序明細
    const sortedDetails = useMemo(() =>
    {
        const list = useBanner.data?.BannerDetail ?? [];
        return [...list].sort((a, b) => (a?.Sort ?? 0) - (b?.Sort ?? 0));
    }, [useBanner.data?.BannerDetail]);

    const depsKey = useMemo(() =>
    {
        return sortedDetails.map((d) => d?.PicSrcId ?? "").join("|");
    }, [sortedDetails]);

    useEffect(() =>
    {
        // SSR guard
        if (typeof window === "undefined") return;

        // 宣告變數
        const root = carouselRef.current;
        if (!root) return;

        // ✅ fallback：先解除 Owl CSS 的 display:none（避免首屏空白）
        root.style.display = "block";

        // ✅ 沒資料就 destroy（避免殘留 / Owl CSS 造成整段 display:none）
        if (sortedDetails.length === 0)
        {
            const win = window as unknown as { jQuery?: JQueryStaticLike; $?: JQueryStaticLike; };
            const $maybe = win.jQuery ?? win.$;
            if ($maybe?.fn?.owlCarousel)
            {
                try
                {
                    $maybe(root).trigger("destroy.owl.carousel");
                } catch
                {
                    // ignore
                }
            }
            return;
        }

        type OwlOptions = {
            items: number;
            loop: boolean;
            dots: boolean;
            nav: boolean;
            margin: number;
            autoplay: boolean;
            autoplayTimeout: number;
            autoplayHoverPause: boolean;
            responsive: Record<number, { items: number; }>;
        };

        type JQueryObj = {
            length: number;
            trigger: (eventName: string, args?: (string | number)[]) => void;
            owlCarousel?: (opt: OwlOptions) => void;
            off: (eventName?: string) => void;
            on: (eventName: string, handler: (e: Event) => void) => void;
            find: (selector: string) => JQueryObj;
            attr: (name: string, value: string) => JQueryObj;
            text: (value: string) => void;
            addClass: (name: string) => void;
            removeClass: (name: string) => void;
        };

        type JQueryStaticLike = ((el: Element) => JQueryObj) & { fn?: { owlCarousel?: (opt: OwlOptions) => void; }; };

        let cancelled = false;
        let isPlaying = true;

        const sleep = (ms: number): Promise<void> =>
        {
            return new Promise<void>((r) => setTimeout(r, ms));
        };

        const waitForOwlReady = async (): Promise<JQueryStaticLike | null> =>
        {
            // 執行 function：輪詢等待 legacy bundle 的 Owl 掛載完成
            for (let i = 0; i < 40; i++)
            {
                const win = window as unknown as { jQuery?: JQueryStaticLike; $?: JQueryStaticLike; };
                const $ = win.jQuery ?? win.$;
                if ($?.fn?.owlCarousel) return $;
                await sleep(50);
            }

            // return
            return null;
        };

        const destroyOwlSafe = ($: JQueryStaticLike): void =>
        {
            // 宣告變數
            const $owl = $(root);

            // 執行 function
            try
            {
                $owl.trigger("destroy.owl.carousel");
            } catch
            {
                // ignore
            }

            // return
        };

        const updateToggleButton = ($toggle: JQueryObj): void =>
        {
            // 宣告變數
            if (!$toggle.length) return;

            const $iconBox = $toggle.find(".control-toggle");
            const $srText = $toggle.find(".sr-only");

            // 執行 function
            $iconBox.removeClass("control-play-icon control-pause-icon");

            if (isPlaying)
            {
                $toggle.attr("aria-pressed", "true").attr("title", "暫停").attr("aria-label", "圖片輪播播放中，點擊暫停");
                $iconBox.addClass("control-pause-icon");
                $srText.text("圖片輪播播放中，點擊暫停");
            } else
            {
                $toggle.attr("aria-pressed", "false").attr("title", "播放").attr("aria-label", "圖片輪播已暫停，點擊播放");
                $iconBox.addClass("control-play-icon");
                $srText.text("圖片輪播已暫停，點擊播放");
            }

            // return
        };

        const run = async (): Promise<void> =>
        {
            // 宣告變數
            const $ = await waitForOwlReady();
            if (cancelled) return;

            // ✅ fallback：沒有 Owl 也先把內容顯示出來（AA/Freego 首屏可見）
            if (!$)
            {
                root.classList.add("owl-loaded");
                return;
            }

            // 宣告變數：初始化 Owl（與 prototype 參數一致）
            const opts: OwlOptions = {
                items: 4,
                loop: false,
                dots: false,
                nav: true,
                margin: 0,
                autoplay: true,
                autoplayTimeout: 10000,
                autoplayHoverPause: true,
                responsive: { 0: { items: 2 }, 575: { items: 2 }, 767: { items: 2 }, 991: { items: 3 }, 1199: { items: 4 } },
            };

            const $owl = $(root);

            // ✅ 若已初始化過（資料更新），先 destroy 再重建
            destroyOwlSafe($);

            // ✅ 等 React 把 item 都掛上去再 init（更穩）
            requestAnimationFrame(() =>
            {
                if (cancelled) return;

                $owl.owlCarousel?.(opts);

                // 播放/暫停切換（A11y，可選）
                const toggleEl = toggleRef.current ?? document.getElementById("Collections_toggle");
                const $toggle = toggleEl ? $(toggleEl) : null;

                isPlaying = !!opts.autoplay;

                if ($toggle && $toggle.length)
                {
                    const onToggle = (e: Event) =>
                    {
                        e.preventDefault();

                        if (isPlaying)
                        {
                            $owl.trigger("stop.owl.autoplay");
                            isPlaying = false;
                        } else
                        {
                            $owl.trigger("play.owl.autoplay", [opts.autoplayTimeout]);
                            isPlaying = true;
                        }

                        updateToggleButton($toggle);
                    };

                    const onToggleKeydown = (e: Event) =>
                    {
                        const keyEvent = e as KeyboardEvent;
                        if (keyEvent.key !== "Enter") return;

                        onToggle(e);
                    };

                    $toggle.off("click.collectionsToggle");
                    $toggle.off("keydown.collectionsToggle");
                    $toggle.on("click.collectionsToggle", onToggle);
                    $toggle.on("keydown.collectionsToggle", onToggleKeydown);

                    updateToggleButton($toggle);
                }
            });
        };

        void run();

        // cleanup
        return () =>
        {
            cancelled = true;

            try
            {
                const win = window as unknown as { jQuery?: JQueryStaticLike; $?: JQueryStaticLike; };
                const $ = win.jQuery ?? win.$;
                const toggleEl = toggleRef.current ?? document.getElementById("Collections_toggle");
                const $toggle = $ && toggleEl ? $(toggleEl) : null;

                if ($toggle && $toggle.length)
                {
                    $toggle.off("click.collectionsToggle");
                    $toggle.off("keydown.collectionsToggle");
                }
            } catch
            {
                // ignore
            }

            try
            {
                const win = window as unknown as { jQuery?: JQueryStaticLike; $?: JQueryStaticLike; };
                const $ = win.jQuery ?? win.$;
                if ($?.fn?.owlCarousel)
                {
                    destroyOwlSafe($);
                }
            } catch
            {
                // ignore
            }
        };
    }, [depsKey]);
    const iconList = [icon1, icon2, icon3, icon4];
    return (
        <section className="Collections_section owl-box Layout_Padding_4_top">
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize4">
                        <div className="row">
                            <div className="col-12">
                                {/* 標題 start */}
                                <div className="headDiv mb-3">
                                    {props.lang === "zh-tw"
                                        ? (
                                            <>
                                                <span className="headDiv-txt">館藏櫥窗</span>
                                                <span className="headDiv-subtxt">Collection Showcase</span>
                                            </>
                                        )
                                        : props.lang === "en"
                                        ? (
                                            <>
                                                <span className="headDiv-txt">Collection Showcase</span>
                                            </>
                                        )
                                        : ("")}
                                </div>
                                {/* 標題 end */}
                            </div>

                            <div className="col-12">
                                <div className="content-box px-0 mb-0">
                                    <div className="owl-carousel owl-theme" id="Collections_owl_carousel" ref={carouselRef}>
                                        {sortedDetails.map((p, i) =>
                                        {
                                            const detail = useBanner.data?.BannerDetailInfo?.find((x) =>
                                                x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang
                                            );
                                            const alt = detail?.Title ?? "";
                                            const url = detail?.URL ?? "#";
                                            const content = detail?.Content ?? "";
                                            const urlopen = detail?.URL_Open ?? "";
                                            const imgUrl = FileManagementAPI.get_Public_Preview_Url(p.PicSrcId, alt);
                                            return (
                                                <div key={i} className="item">
                                                    <LangLink to={url} tabIndex={0} target={urlopen === 1 ? "_blank" : "_self"}>
                                                        <div className="wrapper_box">
                                                            <figure className="card_figure">
                                                                <div className="card_image_link">
                                                                    <picture>
                                                                        <img className="card_image" src={imgUrl} alt={alt} aria-hidden="true" />
                                                                    </picture>
                                                                </div>
                                                            </figure>

                                                            <div className="txtarea">
                                                                <div className="card_catinfo d-flex flex-column">
                                                                    <div className="mb-1">
                                                                        <img src={iconList[i]} alt="" aria-hidden="true" />
                                                                    </div>
                                                                    <span className="card_catname mb-4">
                                                                        <span className="mx-1">{alt}</span>
                                                                    </span>
                                                                </div>
                                                                <span className="sr-only">{content}</span>
                                                            </div>
                                                        </div>
                                                    </LangLink>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* 單一顆按鈕 START  */}
                                    <div className="DIV-singleBox">
                                        <div className="control-singlebox">
                                            <div className="control-toggle">
                                                <a
                                                    aria-label="暫停"
                                                    aria-pressed="true"
                                                    className="carousel-toggle-btn toggle ms-1"
                                                    id="Collections_toggle"
                                                    role="button"
                                                    tabIndex={0}
                                                    title="暫停"
                                                    type="button"
                                                >
                                                    <span className="control-toggle control-pause-icon" />
                                                    <span className="sr-only">暫停</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    {/* 單一顆按鈕 END */}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* //container-customize4 */}
                </div>
                {/* //customizeBox */}
            </div>
            {/* //Mask-DivBox */}
        </section>
    );
};
