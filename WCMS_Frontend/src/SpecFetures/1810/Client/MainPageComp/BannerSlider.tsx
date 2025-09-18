import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { useBannerListData } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Hook";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import clsx from "clsx";
import * as SchemaFields from "@/types/SchemaFields";
import { useMemo } from "react";
type BannerSet = components["schemas"]["BannerSet_DTO"]
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
}

export const BannerSlider = () => {

    const usebannerList = useBannerListData(`${SchemaFields.BannerFields.BannerId} = 1`)
    const bannerInternal = usebannerList.rawData?.[0]?.Banner?.InternalId ?? ""
    const useBanner = useFetchFormData<BannerSet>(BannerSliderProvider(), bannerInternal, emptyData)
    const loadingList = [useBanner.isLoading, usebannerList.isLoading]
    const errorList = [useBanner.error, usebannerList.error]

    const sortedDetails = useMemo(() => {
        const list = useBanner.data?.BannerDetail ?? [];
        // 依 Detail.Sort 由小到大
        return [...list].sort((a, b) => {
            const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
            const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
            // 次排序：RowId，確保順序穩定
            return as - bs || (a.RowId ?? 0) - (b.RowId ?? 0);
        });
    }, [useBanner.data?.BannerDetail]);

    return (
        <LoadingErrorHandler loadingList={loadingList} errorList={errorList} >
            <section className="carousel_slide_section">
                <div className="sidebar">
                    <div className="scroll_Down">
                        <a href="#content" className="eng_font">SCROLL</a>
                    </div>
                </div>
                <div className="customize_visualBox + animate__animated animate__slow wow fadeInRight d-xl-block d-lg-block d-md-block d-sm-none d-none" data-wow-delay="0.05s">
                    <div id="carousel-Controls" className="carousel carousel-dark slide carousel-fade" data-bs-ride="carousel">
                        <div className="carousel-inner">
                            {sortedDetails.map((p, i) => {
                                const alt = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.Title ?? ""
                                return (
                                    <div key={i} className={clsx("carousel-item", i === 0 ? "active" : "")} data-bs-interval="5000">
                                        <img src={`/Service/FileManagement/Preview/${p.PicSrcId}`}
                                            className="d-block w-100"
                                            alt={alt}
                                        />
                                    </div>
                                )
                            })}
                        </div>

                        <div className="control-box">
                            <div className="carousel_btn-icon-prev">
                                <a
                                    className="carousel-control-prev"
                                    href="#"
                                    data-bs-target="#carousel-Controls"
                                    role="button"
                                    data-bs-slide="prev"
                                    title="上一張"
                                    tabIndex={1}
                                >
                                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                    <span className="sr-only">Previous</span>
                                </a>
                            </div>
                            <div className="carousel_btn-icon-next">
                                <a
                                    className="carousel-control-next"
                                    href="#"
                                    data-bs-target="#carousel-Controls"
                                    role="button"
                                    data-bs-slide="next"
                                    title="下一張"
                                    tabIndex={1}
                                >
                                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                    <span className="sr-only">Next</span>
                                </a>
                            </div>
                            <div id="cycleCarousel" className="control-start">
                                <a
                                    type="button"
                                    href="#" onClick={(e) => { e.preventDefault(); }}
                                    data-bs-target="#carousel-Controls"
                                    title="播放"
                                    tabIndex={1}
                                >
                                    <span className="control-start-icon"></span>
                                    <span className="sr-only">播放</span>
                                </a>
                            </div>
                            <div id="pauseCarousel" className="control-pause">
                                <a
                                    type="button"
                                    href="#" onClick={(e) => { e.preventDefault(); }}
                                    data-bs-target="#carousel-Controls"
                                    title="暫停"
                                    tabIndex={1}
                                >
                                    <span className="control-pause-icon"></span>
                                    <span className="sr-only">暫停</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="customize_visualBox + animate__animated animate__slow wow fadeInRight d-xl-none d-lg-none d-md-none d-sm-block " data-wow-delay="0.05s">
                    <div id="carousel-Controls_MB" className="carousel carousel-dark slide carousel-fade" data-bs-ride="carousel">

                        {/* <asp:Literal ID="Lit_Banner_MB" runat="server" /> */}
                        <div className="carousel-inner">

                            {sortedDetails.map((p, i) => {
                                const alt = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.Title ?? ""
                                return (
                                    <div key={i} className={clsx("carousel-item", i === 0 ? "active" : "")} data-bs-interval="5000">
                                        <img src={`/Service/FileManagement/Preview/${p.PicSrcId}`}
                                            className="d-block w-100"
                                            alt={alt}
                                        />
                                    </div>
                                )
                            })}

                        </div>

                        <div className="control-box">
                            <div className="carousel_btn-icon-prev">
                                <a
                                    className="carousel-control-prev"
                                    href="#"
                                    type="button"
                                    data-bs-target="#carousel-Controls_MB"
                                    data-bs-slide="prev"
                                    title="上一張"
                                    tabIndex={1}
                                >
                                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                    <span className="sr-only">Previous</span>
                                </a>
                            </div>
                            <div className="carousel_btn-icon-next">
                                <a
                                    className="carousel-control-next"
                                    href="#"
                                    type="button"
                                    data-bs-target="#carousel-Controls_MB"
                                    data-bs-slide="next"
                                    title="下一張"
                                    tabIndex={1}
                                >
                                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                    <span className="sr-only">Next</span>
                                </a>
                            </div>
                            <div id="cycleCarousel_MB" className="control-start">
                                <a
                                    type="button"
                                    href="#carousel-Controls_MB"
                                    onClick={(e) => e.preventDefault()}
                                    title="播放"
                                    tabIndex={1}
                                >
                                    <span className="control-start-icon"></span>
                                    <span className="sr-only">播放</span>
                                </a>
                            </div>
                            <div id="pauseCarousel_MB" className="control-pause">
                                <a
                                    type="button"
                                    href="#carousel-Controls_MB"
                                    onClick={(e) => e.preventDefault()}
                                    title="暫停"
                                    tabIndex={1}
                                >
                                    <span className="control-pause-icon"></span>
                                    <span className="sr-only">暫停</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </LoadingErrorHandler>
    );
};


const PCBanner = () => {

}

const MobileBanner = () => {

}