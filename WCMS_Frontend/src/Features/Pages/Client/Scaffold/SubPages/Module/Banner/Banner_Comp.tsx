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

// #region Property
type BannerFormModel = components["schemas"]["Banner"];

type BannerDetail = components["schemas"]["BannerDetail"];

type BannerDetailInfo = components["schemas"]["BannerDetailInfo"];

type QueryListParam = components["schemas"]["QueryListParam"];

type BootstrapCarouselInstance = { cycle: () => void; pause: () => void; dispose?: () => void; };
// #endregion

// #region Public
export const Banner_Comp = (props: { lang: Lang; node: INormNode; initialBanner?: ApiLoaderData<QueryListParam, BannerFormModel[]> | null; }) =>
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
        const list = banner?._BannerDetail ?? [];

        return [...list].filter(d =>
        {
            const start = d.Validate_Start ? new Date(d.Validate_Start).getTime() : -Infinity;
            const end = d.Validate_End ? new Date(d.Validate_End).getTime() : Infinity;
            return start <= now && now <= end && !!d.PicSrcId;
        }).sort((a, b) => (a.Sort ?? 0) - (b.Sort ?? 0));
    }, [banner, props.lang]);

    // function：長寬比（依資料來源設定）
    const ratioStyle = useMemo(() =>
    {
        const w = banner?.Width ?? 0;
        const h = banner?.Height ?? 0;
        if (!w || !h) return undefined;
        return { aspectRatio: `${w} / ${h}` } as React.CSSProperties;
    }, [banner?.Width, banner?.Height]);

    // function：輪播間隔（後台欄位為秒，Bootstrap 需要毫秒）
    const intervalMs = useMemo(() =>
    {
        return toCarouselIntervalMs(banner?.Interval);
    }, [banner?.Interval]);

    // function：輪播轉場速度（後台欄位為毫秒）
    const speedMs = useMemo(() =>
    {
        return toCarouselSpeedMs(banner?.Speed);
    }, [banner?.Speed]);

    // function：套用 Bootstrap carousel 轉場速度
    const carouselStyle = useMemo(() =>
    {
        return { "--bs-carousel-transition-duration": `${speedMs}ms` } as React.CSSProperties;
    }, [speedMs]);

    // Carousel instance（client-only）
    const carouselRef = useRef<HTMLDivElement | null>(null);
    const carouselInsRef = useRef<BootstrapCarouselInstance | null>(null);
    const [isBootReady, setIsBootReady] = useState(false);

    // function：初始化 bootstrap carousel
    const initCarousel = useCallback(async (el: HTMLElement, interval: number) =>
    {
        const mod = await import("bootstrap/js/dist/carousel");
        const CarouselAny = mod.default as unknown as { getOrCreateInstance: (el: HTMLElement, opt: unknown) => BootstrapCarouselInstance; };

        return CarouselAny.getOrCreateInstance(el, { interval, ride: "carousel", pause: false, touch: true });
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
                        <div className="subpage_banner_wrapper w-100" style={ratioStyle}>
                            <div className="carousel slide h-100" id={carouselId} ref={carouselRef} data-bs-interval={intervalMs} style={carouselStyle}>
                                <div className="carousel-inner h-100">
                                    {validDetails.map((d, i) =>
                                    {
                                        const info = pickBannerDetailInfo(d, props.lang);
                                        const title = getInfoTitle(info) || props.node.title || "Banner";
                                        const url = getInfoUrl(info);
                                        const imgUrl = FileManagementAPI.get_Public_Preview_Url(d.PicSrcId);
                                        return (
                                            <div
                                                key={`${bannerId}_${d.RowId ?? i}_${i}`}
                                                className={`carousel-item ${i === 0 ? "active" : ""} h-100`}
                                                style={{ transitionDuration: `${speedMs}ms` }}
                                            >
                                                {url
                                                    ? (
                                                        <LangLink to={url} title={title}>
                                                            <img
                                                                src={imgUrl}
                                                                className="d-block w-100 h-100"
                                                                alt=""
                                                                aria-hidden="true"
                                                                style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: "200px" }}
                                                            />
                                                        </LangLink>
                                                    )
                                                    : (
                                                        <img
                                                            src={imgUrl}
                                                            className="d-block w-100 h-100"
                                                            alt={title}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: "200px" }}
                                                        />
                                                    )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {!!props.node.title && (
                                <div className="container-customize2" style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
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
// #endregion

// #region Private
const BannerFetch = (
    adapter: ReturnType<typeof BannerSliderAdapter>,
    lang: Lang,
    bannerId: string,
    initial: ApiLoaderData<QueryListParam, BannerFormModel[]> | null,
) =>
{
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
    return adapter.hooks.useQueryList({ condition: queryCondition, initial, deps: [bannerId, lang] });
};

const toCarouselIntervalMs = (value: unknown): number =>
{
    const n = Number(value ?? 0);
    if (!Number.isFinite(n) || n <= 0) return 5000;

    // 舊資料可能已是毫秒，新欄位標示為秒；小於 100 視為秒，避免 8 被當成 8ms。
    return n < 100 ? n * 1000 : n;
};

const toCarouselSpeedMs = (value: unknown): number =>
{
    const n = Number(value ?? 0);
    if (!Number.isFinite(n) || n <= 0) return 600;

    return n;
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
// #endregion
