import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useAnchorPreventDefaultClick } from "@/SysCore/Utils/UI_HookFunc/useAnchorPreventDefaultClick";
import type { components } from "@/types/api";
import clsx from "clsx";
import { useMemo } from "react";

type BannerSet = components["schemas"]["BannerSet_DTO"];

const toOkEnv = <T,>(data: T): ApiResponse<T> =>
{
    return { IsSuccess: true, SysMessage: [], Data: data };
};
const toInitial = <TArgs, TData>(args: TArgs, data: TData): ApiLoaderData<TArgs, TData> =>
{
    return { args, apiRes: toOkEnv(data) };
};

export const CarouselData = (props: { lang: Lang; internalId: string; initialBanner: BannerSet | null; }) =>
{
    const adapter = useMemo(() => BannerSliderAdapter(), []);
    const initial = useMemo(() =>
    {
        if (!props.initialBanner) return null;
        return toInitial(props.internalId, props.initialBanner);
    }, [props.internalId, props.initialBanner]);
    const q = adapter.hooks.useQueryData({ internalId: props.internalId, initial, deps: [props.internalId] });
    // 宣告：統一資料來源（SSR/CSR 都只看這個）
    const banner = q.data;
    // 宣告：排序 detail
    const sortedDetails = useMemo(() =>
    {
        const list = banner?.BannerDetail ?? [];
        return [...list].sort((a, b) =>
        {
            const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
            const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
            return as - bs || (a.RowId ?? 0) - (b.RowId ?? 0);
        });
    }, [banner?.BannerDetail]);
    const onClickLink = useAnchorPreventDefaultClick();

    return (
        <section className="Carousel_slide_section">
            <div className="sidebar">
                <div className="scroll_Down">
                    <div className="eng_font">SCROLL</div>
                </div>
            </div>

            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-fluid px-0">
                        <div className="carousel slide d-flex justify-content-end" id="B5_default_carousel">
                            <div className="carousel-inner">
                                {sortedDetails.map((p, i) =>
                                {
                                    const info = banner?.BannerDetailInfo?.find(x =>
                                        x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang
                                    );
                                    const alt = info?.Title ?? "";
                                    const content = info?.Content ?? "";
                                    const url = info?.URL;
                                    const tar = info?.URL_Open === 0 ? "_self" : "_blank";
                                    const imgUrl = FileManagementAPI.get_Public_Preview_Url(p.PicSrcId, alt);
                                    return (
                                        <div key={i} className={clsx("carousel-item", i === 0 ? "active" : "")} data-bs-interval="5000">
                                            {url
                                                ? (
                                                    <LangNavLink
                                                        to={url}
                                                        target={tar}
                                                        rel={tar === "_blank" ? "noopener noreferrer" : undefined}
                                                        aria-label={alt || "banner link"}
                                                    >
                                                        <img src={imgUrl} className="d-block w-100" alt={alt} />
                                                    </LangNavLink>
                                                )
                                                : <img src={imgUrl} className="d-block w-100" alt={alt} />}
                                            <div className="caption bg-customize-op09">
                                                <div className="caption-title mb-sm-3 mb-1">{alt}</div>
                                                <div className="caption-subtitle mb-sm-2 mb-1">{content}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="carousel_btn-icon-prev">
                                <a
                                    data-bs-slide="prev"
                                    data-bs-target="#B5_default_carousel"
                                    href="#"
                                    role="button"
                                    tabIndex={0}
                                    title="上一張"
                                    type="button"
                                    onClick={onClickLink}
                                >
                                    <div className="carousel-control-prev">
                                        <span aria-hidden="true" className="carousel-control-prev-icon" />
                                        <span className="sr-only">Previous</span>
                                    </div>
                                </a>
                            </div>

                            <div className="carousel_btn-icon-next">
                                <a
                                    data-bs-slide="next"
                                    data-bs-target="#B5_default_carousel"
                                    href="#"
                                    role="button"
                                    tabIndex={0}
                                    title="上一張"
                                    type="buttson"
                                    onClick={onClickLink}
                                >
                                    <div className="carousel-control-next">
                                        <span aria-hidden="true" className="carousel-control-next-icon" />
                                        <span className="sr-only">Next</span>
                                    </div>
                                </a>
                            </div>

                            <div className="control-box">
                                <div className="control-start">
                                    <a
                                        aria-label="播放輪播"
                                        aria-pressed="false"
                                        href="#B5_default_carousel"
                                        id="cycleCarousel"
                                        tabIndex={0}
                                        title="播放"
                                        type="button"
                                    >
                                        <span className="control-start-icon" />
                                        <span className="sr-only">播放</span>
                                    </a>
                                </div>
                                <div className="control-pause">
                                    <a
                                        aria-label="暫停輪播"
                                        aria-pressed="true"
                                        href="#B5_default_carousel"
                                        id="pauseCarousel"
                                        tabIndex={0}
                                        title="暫停"
                                        type="button"
                                    >
                                        <span className="control-pause-icon" />
                                        <span className="sr-only">暫停</span>
                                    </a>
                                </div>
                            </div>

                            <div className="carousel-indicators">
                                <a href="#" tabIndex={0} title="上一張" onClick={onClickLink}>
                                    <button
                                        aria-current="true"
                                        aria-label="Slide 1"
                                        className="active"
                                        data-bs-slide-to="0"
                                        data-bs-target="#B5_default_carousel"
                                        type="button"
                                    />
                                </a>
                                <a href="#" tabIndex={0} title="上一張" onClick={onClickLink}>
                                    <button aria-label="Slide 2" className="" data-bs-slide-to="1" data-bs-target="#B5_default_carousel" type="button" />
                                </a>
                                <a href="#" tabIndex={0} title="上一張" onClick={onClickLink}>
                                    <button aria-label="Slide 3" className="" data-bs-slide-to="2" data-bs-target="#B5_default_carousel" type="button" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
