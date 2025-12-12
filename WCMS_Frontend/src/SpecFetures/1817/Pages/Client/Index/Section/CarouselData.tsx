
import { LinkData } from '@/SpecFetures/1817/Pages/Client/Index/Section/LinkData'
import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import img from '@/SpecFetures/1817/Assets/Client/images/Tradition_and_Art_900x210.svg'
import type { Lang } from '@/SysCore/i18n/lang';
import { PerformancesPage } from './PerformancesPage';
type BannerSet = components["schemas"]["BannerSet_DTO"]

export const CarouselData = (props: { lang: Lang }) => {
  const useBanner = useFetchFormData<BannerSet>(BannerSliderProvider(), '41d46011-6fd7-4da4-917f-c917fa034c19', {})
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

  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    // Bootstrap 5 carousel 事件：slid.bs.carousel
    const handler = (event: any) => {
      if (typeof event.to === "number") {
        setCurrentIndex(event.to);
      }
    };

    el.addEventListener("slid.bs.carousel", handler);
    return () => {
      el.removeEventListener("slid.bs.carousel", handler);
    };
  }, []);

  const safeIndex =
    currentIndex >= 0 && currentIndex < sortedDetails.length ? currentIndex : 0;
  const currentDetail = sortedDetails[safeIndex];

  const performanceData = useMemo(() => {
    if (!currentDetail) {
      return { title: "", subTitle: "", showtime: "" };
    }

    const info = useBanner.data?.BannerDetailInfo?.find(
      (x) =>
        x.BannerId === currentDetail.BannerId &&
        x.ParentRowId === currentDetail.RowId &&
        x.Lang === props.lang
    );

    // ⚠ 這邊先用 any，避免你 DTO 欄位名稱不一樣時 TypeScript 直接炸掉
    const anyInfo = info as any;
    const anyDetail = currentDetail as any;

    return {
      // 1. 標題：例如《辯韻》音樂會…
      title: anyInfo?.Title ?? "",
      // 2. 內文 / 簡述：你可以換成自己想要放的欄位
      subTitle: anyInfo?.Content ?? "",
      // 3. 展演時間：這邊先示範用 StartDate ~ EndDate，你再對應實際欄位
      showtime:
        anyDetail?.ShowTime ??
        (anyDetail?.StartDate && anyDetail?.EndDate
          ? `${anyDetail.StartDate} ～ ${anyDetail.EndDate}`
          : ""),
    };
  }, [currentDetail, useBanner.data?.BannerDetailInfo, props.lang]);

  return (
    <>
      <section className="TraditionArt_section + Layout_Padding_3_top + bg-custom-Customize_color">
        <div className="Mask-DivBox">
          <div className="customizeBox">
            <div className="Top_Div_All">
              <div className="Top_inner">
                <div className="LineIMG-0 iMG-Shape-0" />
                <p className="P_head">
                  <span>與世界交朋友</span>
                  <br />
                  <span>從臺灣的傳統音樂出發，</span>
                </p>
                <div className="Top_title_wrap">
                  <div className="Top_Font_Img">
                    <img alt="傳統 . 藝術" src={img} />
                  </div>
                </div>
                <div className="Top_banner_wrap">
                  <div className="Carousel_slide_section">
                    <div className="carousel slide" id="B5_default_carousel" ref={carouselRef}>
                      <div className="control-singlebox">
                        <div className="control-toggle">
                          <a aria-label="暫停" aria-pressed="true" className="carousel-toggle-btn"
                            id="toggleCarousel" role="button" tabIndex={0}
                            title="暫停" type="button">
                            <span className="control-icon pause" />
                            <span className="sr-only">暫停</span>
                          </a>
                        </div>
                      </div>
                      <div className="carousel-inner">
                        {sortedDetails.map((p, i) => {
                          const info = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang);
                          const alt = info?.Title ?? ""
                          return (
                            <div key={i} className={clsx("carousel-item", i === 0 ? "active" : "")} data-bs-interval="5000">
                              <img src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`} className="d-block w-100" alt={alt} />
                            </div>
                          )
                        })}
                      </div>
                      <div className="carousel-indicators">
                        <a tabIndex={0} title="上一張">
                          <button aria-current="true" aria-label="Slide 1" className="active" data-bs-slide-to="0" data-bs-target="#B5_default_carousel" type="button" />
                        </a>
                        <a tabIndex={0} title="上一張">
                          <button aria-label="Slide 2" className="" data-bs-slide-to="1" data-bs-target="#B5_default_carousel" type="button" />
                        </a>
                        <a tabIndex={0} title="上一張">
                          <button aria-label="Slide 3" className="" data-bs-slide-to="2" data-bs-target="#B5_default_carousel" type="button" />
                        </a>
                      </div>
                      <div className="carousel_btn-icon-prev">
                        <a data-bs-slide="prev" data-bs-target="#B5_default_carousel" role="button" tabIndex={0} title="上一張" type="button">
                          <div className="carousel-control-prev">
                            <span aria-hidden="true" className="carousel-control-prev-icon" />
                            <span className="sr-only">Previous</span>
                          </div>
                        </a>
                      </div>
                      <div className="carousel_btn-icon-next">
                        <a data-bs-slide="next" data-bs-target="#B5_default_carousel" role="button" tabIndex={0} title="上一張" type="button">
                          <div className="carousel-control-next">
                            <span aria-hidden="true" className="carousel-control-next-icon" />
                            <span className="sr-only">Next</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <LinkData lang={props.lang} />
              </div>
            </div>
          </div>
        </div>
      </section>
      <PerformancesPage
        title={performanceData.title}
        subTitle={performanceData.subTitle}
        showtime={performanceData.showtime}
      />
    </>
  );
};
