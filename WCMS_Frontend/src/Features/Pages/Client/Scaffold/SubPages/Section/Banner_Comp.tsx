import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import type { components } from '@/types/api';
import { BannerDetailFields, BannerDetailInfoFields, BannerFields } from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type BannerSet = components["schemas"]["BannerSet_DTO"]

type BootstrapCarouselInstance = {
    cycle: () => void;
    pause: () => void;
    dispose?: () => void;
};

export const Banner_Comp = (props: { lang: Lang; node: INormNode }) => {
    // 變數宣告
    const bannerId = props.node.bannerId ?? "";
    const pvdr = useMemo(() => BannerSliderProvider(), []);
    const bannerData = BannerFetch(pvdr, props.lang, bannerId);

    const banner = bannerData.rawData?.[0];
    const carouselId = useMemo(() => `wcms_banner_carousel_${bannerId || "na"}`, [bannerId]);

    // function：依時間過濾（下架的不顯示）+ 依 Sort 排序 + 必須有圖
    const validDetails = useMemo(() => {
        const now = Date.now();
        const list = banner?.BannerDetail ?? [];

        return [...list]
            .filter(d => {
                const start = d.Validate_Start ? new Date(d.Validate_Start).getTime() : -Infinity;
                const end = d.Validate_End ? new Date(d.Validate_End).getTime() : Infinity;
                const info = pickBannerDetailInfo(d, props.lang);
                return start <= now && now <= end && !!d.PicSrcId && !!getInfoTitle(info);
            })
            .sort((a, b) => (a.Sort ?? 0) - (b.Sort ?? 0));
    }, [banner, props.lang]);

    // function：長寬比（依資料來源設定）
    const ratioStyle = useMemo(() => {
        if (!banner?.Banner?.Width || !banner?.Banner?.Height) return undefined;
        return { aspectRatio: `${banner.Banner.Width} / ${banner.Banner.Height}` } as React.CSSProperties;
    }, [banner?.Banner?.Width, banner?.Banner?.Height]);

    // function：輪播間隔（來源資料決定）
    const intervalMs = useMemo(() => {
        const raw = banner?.Banner?.Interval ?? 5000;
        const n = Number(raw);
        if (!Number.isFinite(n) || n <= 0) return 5000;
        return n;
    }, [banner?.Banner?.Interval]);
    // Carousel instance（client-only）
    const carouselRef = useRef<HTMLDivElement | null>(null);
    const carouselInsRef = useRef<BootstrapCarouselInstance | null>(null);

    // function：初始化 bootstrap carousel（避免引入舊外掛/舊 js）
    const initCarousel = useCallback(async (el: HTMLElement, interval: number) => {
        // 只在瀏覽器端載入 bootstrap carousel js
        const mod = await import("bootstrap/js/dist/carousel");
        const CarouselAny = mod.default as any;

        const ins = CarouselAny.getOrCreateInstance(el, {
            interval,
            ride: "carousel",
            pause: false,
            touch: true,
        });

        return ins as BootstrapCarouselInstance;
    }, []);

    // effect：當資料 ready / interval 改變時啟動 carousel
    useEffect(() => {
        const el = carouselRef.current;
        if (!el) return;
        if (!validDetails.length) return;

        let disposed = false;

        const run = async () => {
            const ins = await initCarousel(el, intervalMs);
            if (disposed) {
                ins.dispose?.();
                return;
            }
            carouselInsRef.current = ins;
            ins.cycle();
        };

        run();

        return () => {
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
                        <div className="subpage_banner_wrapper" style={ratioStyle}>
                            <div
                                className="carousel slide"
                                id={carouselId}
                                ref={carouselRef}
                                data-bs-ride="carousel"
                                data-bs-interval={intervalMs}
                            >
                                <div className="carousel-inner">
                                    {validDetails.map((d, i) => {
                                        const info = pickBannerDetailInfo(d, props.lang);
                                        const title = getInfoTitle(info) ?? "";
                                        const url = getInfoUrl(info) ?? "";
                                        const openBlank = getInfoUrlOpen(info);
                                        const imgUrl = `${FileManagementAPI.PREVIEW_URL}/${d.PicSrcId}`;

                                        return (
                                            <div
                                                key={`${bannerId}_${d.RowId ?? i}_${i}`}
                                                className={`carousel-item ${i === 0 ? "active" : ""}`}
                                            >
                                                {url ? (
                                                    <LangLink to={url} target={openBlank ? "_blank" : undefined} rel={openBlank ? "noopener noreferrer" : undefined} aria-label={title ? `Banner 連結：${title}` : "Banner 連結"} title={title}>
                                                        <img src={imgUrl} className="d-block w-100" alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    </LangLink>
                                                ) : (
                                                    <img src={imgUrl} className="d-block w-100" alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ✅ Prototype 的文字區塊：沒有 key 文字就不顯示 */}
                            {!!props.node.title && (
                                <div className="container-customize2" style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", }}>
                                    <div className="banner-content">
                                        <div className="content-inner">
                                            <div className="titlebar">
                                                <div className="titlebar-inner container">
                                                    <h1 className="Big-title">{props.node.title}</h1>
                                                </div>
                                            </div>
                                            {/* breadcrumb 先不做：prototype 是 d-none */}
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

const BannerFetch = (provider: IDataProvider<BannerSet>, lang: Lang, bannerId: string) => {
    // 變數宣告
    const enabled = !!bannerId;
    const condition = useMemo(() => {
        if (!bannerId) return "";
        const c = `${BannerFields.BannerId} = ${bannerId}`;
        return c;
    }, [bannerId]);
    const queryCondition = useMemo(() => {
        return {
            Fields: [
                BannerFields.BannerId, BannerFields.Width, BannerFields.Height, BannerFields.Interval, BannerFields.Speed,
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
    }, [condition]);

    const buildQueryCondition = useCallback(() => queryCondition, [queryCondition]);
    // return
    return useFetchGridListData<BannerSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition,
        enabled,
        deps: [bannerId, lang],
    });
};

// function：依語系挑出正確的 BannerDetailInfo（✅你已確認是陣列）
const pickBannerDetailInfo = (detail: any, lang: Lang) => {
    // 變數宣告
    const info = detail?._BannerDetailInfo;
    const list = Array.isArray(info) ? info : [];

    // 執行 function
    if (list.length === 0) return null;
    const hit = list.find((x) => (x?.Lang ?? "").toString() === lang);

    // return
    return hit ?? list[0] ?? null;
};

// function：安全取得 Title
const getInfoTitle = (info: any) => {
    // return
    return (info?.Title ?? "") as string;
};

// function：安全取得 URL
const getInfoUrl = (info: any) => {
    // return
    return (info?.URL ?? info?.Url ?? "") as string;
};

// function：安全取得是否開新分頁
const getInfoUrlOpen = (info: any) => {
    // 變數宣告
    const v =
        info?.URL_Open ??
        info?.Url_Open ??
        info?.URLOpen ??
        info?.UrlOpen;

    // return
    return !!v;
};
