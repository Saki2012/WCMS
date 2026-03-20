import { useBannerSetByCondition, type BannerSet } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Hook";
import clsx from "clsx";
import * as SchemaFields from "@/types/SchemaFields";
import { useEffect, useMemo } from "react";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { Lang } from "@/SysCore/i18n/lang";

const emptyData: BannerSet = {
    Banner: {},
    BannerDetail: [
        {
            RowId: 1,
            Validate_Start: "",
            Validate_End: "",
            PicSrcId: "",
            FontColor: "",
        }
    ],
    BannerDetailInfo: [
        {
            ParentRowId: 1,
            RowId: 1,
            Lang: "zh-tw",
            Title: "",
            Content: "",
            URL: "",
            URL_Open: 1,
        },
        {
            ParentRowId: 1,
            RowId: 2,
            Lang: "en",
            Title: "",
            Content: "",
            URL: "",
            URL_Open: 1,
        }
    ]
};

const SLIDE_INTERVAL = 5000;

export const BannerSlider = (props: { lang: Lang }) => {
    // 宣告變數：用 Adapter QueryList 拿第一筆（BannerId=1）
    const bannerRes = useBannerSetByCondition({ condition: `${SchemaFields.BannerFields.BannerId} = 1` });
    const bannerData = bannerRes.data ?? emptyData;

    const sortedDetails = useMemo(() => {
        const list = bannerData?.BannerDetail ?? [];
        // 依 Detail.Sort 由小到大
        return [...list].sort((a, b) => {
            const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
            const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
            // 次排序：RowId，確保穩定
            if (as !== bs) return as - bs;
            const ar = Number.isFinite(a?.RowId) ? Number(a.RowId) : Number.MAX_SAFE_INTEGER;
            const br = Number.isFinite(b?.RowId) ? Number(b.RowId) : Number.MAX_SAFE_INTEGER;
            return ar - br;
        });
    }, [bannerData?.BannerDetail]);

    const mappedDetails = useMemo(() => {
        return sortedDetails.map(d => ({ ...d, __url: "" as string }));
    }, [sortedDetails]);

    useEffect(() => {
        // 宣告變數
        let alive = true;

        // 執行 function：把 PicSrcId 轉成可用 URL（CSR 才有 window）
        const run = async () => {
            if (typeof window === "undefined") return;
            if (!mappedDetails.length) return;

            const tasks = mappedDetails.map(async (d) => {
                const id = d?.PicSrcId ?? "";
                if (!id) return { id, url: "" };
                const url = FileManagementAPI.get_Public_Preview_Url(id);
                return { id, url };
            });

            const res = await Promise.all(tasks);
            if (!alive) return;

            // 把 URL 寫回 DOM dataset（不動原本 render 結構）
            res.forEach(({ id, url }) => {
                const els = document.querySelectorAll(`[data-picsrcid="${id}"]`);
                els.forEach(el => (el as HTMLElement).setAttribute("data-picurl", url));
            });
        };

        run();

        // return
        return () => {
            alive = false;
        };
    }, [mappedDetails.length]);

    const handleCarouselControl = (id: string, action: "play" | "pause") => {
        if (typeof window === "undefined") return;

        const root = document.getElementById(id);
        const anyWindow = window as any;
        const Carousel = anyWindow.bootstrap?.Carousel;

        if (!root || !Carousel) return;

        const instance = Carousel.getOrCreateInstance(root);
        if (action === "play") {
            instance.cycle();
        } else {
            instance.pause();
        }
    };

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!sortedDetails.length) return;

        const anyWindow = window as any;
        const Carousel = anyWindow.bootstrap?.Carousel;
        if (!Carousel) return;

        const pc = document.getElementById("carousel-Controls");
        if (pc) {
            const instPc = Carousel.getOrCreateInstance(pc, {
                interval: SLIDE_INTERVAL,
            });
            instPc.cycle();
        }

        const mb = document.getElementById("carousel-Controls_MB");
        if (mb) {
            const instMb = Carousel.getOrCreateInstance(mb, { interval: SLIDE_INTERVAL });
            instMb.cycle();
        }
    }, [sortedDetails.length]);

    return (
        // <LoadingErrorHandler loadingList={loadingList} errorList={errorList} >
        <section className="index_banner_Section">
            <div className="index_banner-carousel">
                <div className="container">
                    <div className="row">
                        <div className="index_banner carousel-inner" id="carousel-Controls">
                            {sortedDetails.map((p, idx) => {
                                const info = bannerData?.BannerDetailInfo?.find(
                                    x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang
                                );

                                const title = info?.Title ?? "";
                                const content = info?.Content ?? "";
                                const url = info?.URL ?? "";
                                const open = info?.URL_Open ?? 0;

                                const picId = p.PicSrcId ?? "";
                                const dataAttr = { "data-picsrcid": picId };

                                return (
                                    <div key={`${p.RowId}-${idx}`} className={clsx("carousel-item", idx === 0 && "active")}>
                                        <div className="row">
                                            <div className="col-lg-6">
                                                <div className="index_banner-text">
                                                    <h2 style={{ color: p.FontColor || undefined }}>{title}</h2>
                                                    <p style={{ color: p.FontColor || undefined }}>{content}</p>
                                                    {url && (
                                                        <a
                                                            href={url}
                                                            target={open === 1 ? "_blank" : "_self"}
                                                            rel={open === 1 ? "noreferrer" : undefined}
                                                            className="btn btn-primary"
                                                        >
                                                            More
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="index_banner-img" {...dataAttr}></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="index_banner-carousel-controls">
                            <button className="carousel-control-prev" type="button" data-bs-target="#carousel-Controls" data-bs-slide="prev">
                                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                <span className="visually-hidden">Previous</span>
                            </button>
                            <button className="carousel-control-next" type="button" data-bs-target="#carousel-Controls" data-bs-slide="next">
                                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                <span className="visually-hidden">Next</span>
                            </button>

                            <button type="button" onClick={() => handleCarouselControl("carousel-Controls", "pause")} className="carousel-pause-btn">
                                <span className="visually-hidden">Pause</span>
                            </button>
                            <button type="button" onClick={() => handleCarouselControl("carousel-Controls", "play")} className="carousel-play-btn">
                                <span className="visually-hidden">Play</span>
                            </button>
                        </div>

                        <div className="index_banner carousel-inner" id="carousel-Controls_MB">
                            {sortedDetails.map((p, idx) => {
                                const alt = bannerData?.BannerDetailInfo?.find(
                                    x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang
                                )?.Title ?? "";

                                const picId = p.PicSrcId ?? "";
                                const dataAttr = { "data-picsrcid": picId, "aria-label": alt };

                                return (
                                    <div key={`${p.RowId}-${idx}`} className={clsx("carousel-item", idx === 0 && "active")}>
                                        <div className="index_banner-img" {...dataAttr}></div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="index_banner-carousel-controls_MB">
                            <button className="carousel-control-prev" type="button" data-bs-target="#carousel-Controls_MB" data-bs-slide="prev">
                                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                <span className="visually-hidden">Previous</span>
                            </button>
                            <button className="carousel-control-next" type="button" data-bs-target="#carousel-Controls_MB" data-bs-slide="next">
                                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                <span className="visually-hidden">Next</span>
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </section>
        // </LoadingErrorHandler>
    );
};
