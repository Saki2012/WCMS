/** subPage banner - 含大標題 */

import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { BannerDetailFields, BannerDetailInfoFields, BannerFields } from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Banner.css";

type BannerSet = components["schemas"]["BannerSet_DTO"];
type BannerDetail = components["schemas"]["BannerDetail_DTO"];
type BannerDetailInfo = components["schemas"]["BannerDetailInfo_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

type BootstrapCarouselInstance = {
    cycle: () => void;
    pause: () => void;
    dispose?: () => void;
};

export const Banner_Comp = (
    props: { lang: Lang; node: INormNode; initialBanner?: ApiLoaderData<QueryListParam, BannerSet[]> | null; },
) =>
{
    // 變數宣告
    const bannerId = props.node.bannerId ?? "";
    const adapter = useMemo(() => BannerSliderAdapter(), []);
    const bannerData = BannerFetch(adapter, props.lang, bannerId, props.initialBanner ?? null);

    const banner = bannerData.data?.[0];
    const carouselId = useMemo(() => `wcms_banner_carousel_${bannerId || "na"}`, [bannerId]);

    // function：依時間過濾（下架的不顯示）+ 依 Sort 排序 + 必須有圖
    const validDetails = useMemo(() =>
    {
        const now = Date.now();
        const list = banner?.BannerDetail ?? [];

        return [...list]
            .filter(d =>
            {
                const start = d.Validate_Start ? new Date(d.Validate_Start).getTime() : -Infinity;
                const end = d.Validate_End ? new Date(d.Validate_End).getTime() : Infinity;
                const info = pickBannerDetailInfo(d, props.lang);
                return start <= now && now <= end && !!d.PicSrcId && !!getInfoTitle(info);
            })
            .sort((a, b) => (a.Sort ?? 0) - (b.Sort ?? 0));
    }, [banner, props.lang]);

    // function：長寬比（依資料來源設定）
    const ratioStyle = useMemo(() =>
    {
        const w = banner?.Banner?.Width ?? 0;
        const h = banner?.Banner?.Height ?? 0;
        if (!w || !h) return undefined;
        return { aspectRatio: `${w} / ${h}` } as React.CSSProperties;
    }, [banner?.Banner?.Width, banner?.Banner?.Height]);

    // function：輪播間隔（來源資料決定）
    const intervalMs = useMemo(() =>
    {
        const raw = banner?.Banner?.Interval ?? 5000;
        const n = Number(raw);
        if (!Number.isFinite(n) || n <= 0) return 5000;
        return n;
    }, [banner?.Banner?.Interval]);

    // Carousel instance（client-only）
    const carouselRef = useRef<HTMLDivElement | null>(null);
    const carouselInsRef = useRef<BootstrapCarouselInstance | null>(null);
    const [isBootReady, setIsBootReady] = useState(false);

    // function：初始化 bootstrap carousel
    const initCarousel = useCallback(async (el: HTMLElement, interval: number) =>
    {
        const mod = await import("bootstrap/js/dist/carousel");
        const CarouselAny = mod.default as unknown as {
            getOrCreateInstance: (el: HTMLElement, opt: unknown) => BootstrapCarouselInstance;
        };

        return CarouselAny.getOrCreateInstance(el, {
            interval,
            ride: "carousel",
            pause: false,
            touch: true,
        });
    }, []);

    // effect：當資料 ready / interval 改變時啟動 carousel
    useEffect(() =>
    {
        const el = carouselRef.current;
        if (!el) return;
        if (!validDetails.length) return;

        let disposed = false;

        const run = async () =>
        {
            const ins = await initCarousel(el, intervalMs);
            if (disposed)
            {
                ins.dispose?.();
                return;
            }
            carouselInsRef.current = ins;
            setIsBootReady(true);
            ins.cycle();
        };

        void run();

        return () =>
        {
            disposed = true;
            carouselInsRef.current?.dispose?.();
            carouselInsRef.current = null;
        };
    }, [initCarousel, intervalMs, validDetails.length]);

    // 無 BannerId / 無圖片 -> 不顯示
    if (!bannerId || !validDetails.length) return null;

    return (
        <section className="SubPage_Section SubPage-TopBanner background-IMG">
            <div className="LR_VLine_Div">
                <div className="VLine_inner">
                    <div className="VLine_wrapper">
                        {/* <div className="subpage_banner_wrapper w-100" style={ratioStyle}> */}
                        <div className="subpage_banner_wrapper w-100">
                            <div
                                className="carousel slide h-100"
                                id={carouselId}
                                ref={carouselRef}
                                data-bs-ride="carousel"
                                data-bs-interval={intervalMs}
                            >
                                <div className="carousel-inner h-100">
                                    {validDetails.map((d, i) =>
                                    {
                                        const info = pickBannerDetailInfo(d, props.lang);
                                        const title = getInfoTitle(info);
                                        const url = getInfoUrl(info);
                                        const openBlank = getInfoOpenBlank(info);
                                        const imgUrl = FileManagementAPI.get_Public_Preview_Url(d.PicSrcId);
                                        return (
                                            <div
                                                key={`${bannerId}_${d.RowId ?? i}_${i}`}
                                                className={`carousel-item ${i === 0 ? "active" : ""} h-100`}
                                            >
                                                {url
                                                    ? (
                                                        <LangLink
                                                            to={url}
                                                            target={openBlank ? "_blank" : undefined}
                                                            rel={openBlank ? "noopener noreferrer" : undefined}
                                                            aria-label={title ? `Banner 連結：${title}` : "Banner 連結"}
                                                            title={title}
                                                        >
                                                            <img
                                                                src={imgUrl}
                                                                className="d-block w-100 h-100"
                                                                alt={title}
                                                                style={{
                                                                    width: "100%",
                                                                    height: "100%",
                                                                    objectFit: "cover",
                                                                    minHeight: "200px",
                                                                }}
                                                            />
                                                        </LangLink>
                                                    )
                                                    : (
                                                        <img
                                                            src={imgUrl}
                                                            className="d-block w-100 h-100"
                                                            alt={title}
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit: "cover",
                                                                minHeight: "200px",
                                                            }}
                                                        />
                                                    )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {!!props.node.title && (
                                <div
                                    className="container-customize2"
                                    style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}
                                >
                                    <div className="banner-content">
                                        <div className="content-inner">
                                            <div className="titlebar">
                                                <div className="titlebar-inner container">
                                                    <h1 className="Big-title">{props.node.title}</h1>
                                                </div>
                                            </div>
                                            {/* breadcrumb 先不做：prototype 是 d-none */}
                                            {isBootReady && null}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const BannerFetch = (
    adapter: ReturnType<typeof BannerSliderAdapter>,
    lang: Lang,
    bannerId: string,
    initial: ApiLoaderData<QueryListParam, BannerSet[]> | null,
) =>
{
    // 變數宣告
    const enabled = !!bannerId;

    // function：優先使用 loader 提供的 condition（initial.args）
    const queryCondition = useMemo<QueryListParam>(() =>
    {
        if (initial?.args) return initial.args;

        if (!bannerId)
        {
            return { Fields: [], Condition: "" };
        }

        const condition = `${BannerFields.BannerId} = ${bannerId}`;

        return {
            Fields: [
                BannerFields.BannerId,
                BannerFields.Width,
                BannerFields.Height,
                BannerFields.Interval,
                BannerFields.Speed,
                `${BannerFields._BannerDetail}.${BannerDetailFields.PicSrcId}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields.Validate_Start}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields.Validate_End}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Lang}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Title}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.URL}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.URL_Open}`,
            ],
            Condition: condition,
            OrderBy: [{ Col: `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`, Desc: false }],
        };
    }, [initial?.args, bannerId]);

    // return：SSR 有 initial → hydration 不重抓；否則 CSR 依條件抓取
    return adapter.hooks.useQueryList({
        condition: queryCondition,
        initial,
        deps: [bannerId, lang],
    });
};

const pickBannerDetailInfo = (detail: BannerDetail, lang: Lang): BannerDetailInfo | null =>
{
    // 宣告變數
    const list = Array.isArray(detail?._BannerDetailInfo) ? detail._BannerDetailInfo : [];

    // 執行 function
    if (list.length === 0) return null;
    const hit = list.find(x => (x?.Lang ?? "").toString() === lang);

    // return
    return hit ?? list[0] ?? null;
};

const getInfoTitle = (info: BannerDetailInfo | null): string =>
{
    // return
    return (info?.Title ?? "").toString();
};

const getInfoUrl = (info: BannerDetailInfo | null): string =>
{
    // return
    return (info?.URL ?? "").toString();
};

const getInfoOpenBlank = (info: BannerDetailInfo | null): boolean =>
{
    // return
    return Boolean(info?.URL_Open);
};
