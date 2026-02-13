import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { useEffect, useMemo } from "react";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { Lang } from "@/SysCore/i18n/lang";
import { IndexLabel } from "@/SpecFetures/1818/Pages/Client//Index/Section/IndexLabelText";

type BannerSet = components["schemas"]["BannerSet_DTO"]

export const AdmissionsCarouselData = (props: { lang: Lang }) => {
  const useBanner = useFetchFormData<BannerSet>(BannerSliderProvider(), "a25c98f9-e254-43f4-9468-9afac6939f9f", {})
  const sortedDetails = useMemo(() => {
    const list = useBanner.data?.BannerDetail ?? [];
    return [...list].sort((a, b) => {
      const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
      const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
      return as - bs || (a.RowId ?? 0) - (b.RowId ?? 0);
    });
  }, [useBanner.data?.BannerDetail]);
  useEffect(() => {
    // SSR 保護：避免在伺服器端執行到 window / $
    if (typeof window === "undefined") return;
    const $: any = (window as any).$ || (window as any).jQuery;
    if (!$) return;
    const $owl = $('#Admissions_owl_carousel');
    if (!$owl.length || typeof $owl.owlCarousel !== "function") return;
    // 初始化 Owl Carousel
    $owl.owlCarousel({
      items: 4,
      // loop: true, // 依舊站設定需要再打開
      dots: false,
      nav: true,
      margin: 30,
      // autoplay: true, // 依需求是否要預設自動播放
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      responsive: {
        0: { items: 1 },
        500: { items: 2 },
        575: { items: 2 },
        767: { items: 3 },
        991: { items: 3 },
        1199: { items: 3 },
      },
    });

    let isPlaying = false;

    const $start = $('#Admissions_start');
    const $pause = $('#Admissions_pause');

    const updateControls = () => {
      if (isPlaying) {
        $start
          .attr('aria-pressed', 'true')
          .attr('aria-label', '圖片輪播播放中')
          .find('.sr-only')
          .text('圖片輪播播放中');

        $pause
          .attr('aria-pressed', 'false')
          .attr('aria-label', '暫停圖片輪播')
          .find('.sr-only')
          .text('暫停圖片輪播');
      } else {
        $start
          .attr('aria-pressed', 'false')
          .attr('aria-label', '開始播放圖片輪播')
          .find('.sr-only')
          .text('開始播放圖片輪播');

        $pause
          .attr('aria-pressed', 'true')
          .attr('aria-label', '圖片輪播已暫停')
          .find('.sr-only')
          .text('圖片輪播已暫停');
      }
    };

    const handlePauseClick = (e: JQuery.ClickEvent) => {
      e.preventDefault();
      $owl.trigger('stop.owl.autoplay');
      isPlaying = false;
      updateControls();
    };

    const handleStartClick = (e: JQuery.ClickEvent) => {
      e.preventDefault();
      $owl.trigger('play.owl.autoplay', [5000]);
      isPlaying = true;
      updateControls();
    };

    // 綁定事件
    $pause.on('click', handlePauseClick);
    $start.on('click', handleStartClick);

    // 預設初始化狀態（依實際 autoplay 設定調整）
    isPlaying = false;
    updateControls();

    // 清除：移除事件 + 如需可以銷毀 carousel
    return () => {
      $pause.off('click', handlePauseClick);
      $start.off('click', handleStartClick);
      try {
        $owl.trigger('destroy.owl.carousel');
      } catch {
        // ignore
      }
    };
  }, [sortedDetails]);
  return (
    <div className="row Layout_Padding_1_top Layout_Padding_1_bottom">
      <div className="offset-lg-0 offset-md-4 offset-sm-3 offset-2 col-xl-3 col-lg-3 col-md-12 col-sm-12 col-12">
        <div className="headDiv mb-lg-5 mb-4">
          <span className="headDiv-txt-3 tw">{IndexLabel(props.lang).AdmissionsTitle}</span>
        </div>
        <p className="headDiv-subtxt">
          {IndexLabel(props.lang).AdmissionsContent}
        </p>
      </div>
      <div className="col-xl-9 col-lg-9 col-md-12 col-sm-12 col-12">
        <section className="Admissions_section owl-box">
          <div className="Mask-DivBox">
            <div className="customizeBox">
              <div className="container-customize3">
                <div className="row">
                  <div className="col-12 px-0">
                    <div className="content-box px-0 mb-5">
                      <div className="owl-carousel owl-theme" id="Admissions_owl_carousel">
                        {sortedDetails.map((p, i) => {
                          const info = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang)
                          const alt = info?.Title ?? ""
                          const content = info?.Content ?? ""
                          const url = info?.URL ?? ""
                          const urlopen = info?.URL_Open === 1 ? "_blank" : "_self"
                          return (
                            <div key={i} className={"item"}>
                              <a href={url} tabIndex={0} target={urlopen} title={alt}>
                                <div className="wrapper_box">
                                  <div className="Qlink-item">
                                    <div className="Content_Div">
                                      <div className="box_content">
                                        <div className="tit-text mb-4">
                                          {alt}
                                        </div>
                                        <div className="subtit-text mb-4">
                                          {content}
                                        </div>
                                        <div className="customize_btn">
                                          <div className="Btn_a">
                                            <div className="BtnBox">
                                              <span>{IndexLabel(props.lang).MoreInfo}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="Img_Div w-100">
                                      <div className="Qlinkimg-outer">
                                        <img alt={alt} src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </a>
                            </div>
                          )
                        })}
                      </div>
                      {/* 輪播按鈕暫時隱藏 */}
                      {/* <div className="DIV-Box">
                        <div className="control-box">
                          <a aria-label="開始播放圖片輪播" aria-pressed="false" className="play me-1" href="javascript:void(0);" id="Admissions_start" tabIndex={0} title="播放">
                            <div className="contrl_start">
                              <span className="control-start-icon">
                                <span className="sr-only">
                                  開始播放圖片輪播
                                </span>
                              </span>
                            </div>
                          </a>
                          <a aria-label="暫停圖片輪播" aria-pressed="true" className="stop ms-1" href="javascript:void(0);" id="Admissions_pause" tabIndex={0} title="暫停">
                            <div className="contrl_pause">
                              <span className="control-pause-icon">
                                <span className="sr-only">
                                  暫停圖片輪播
                                </span>
                              </span>
                            </div>
                          </a>
                        </div>
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
