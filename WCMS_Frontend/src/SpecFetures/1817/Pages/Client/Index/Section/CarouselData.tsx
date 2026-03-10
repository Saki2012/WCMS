import { LinkData } from '@/SpecFetures/1817/Pages/Client/Index/Section/LinkData'
import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/BannerSlider_Api";
import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import img from '@/SpecFetures/1817/Assets/Client/images/Tradition_and_Art_900x210.svg'
import type { Lang } from '@/SysCore/i18n/lang';
import { PerformancesPage } from './PerformancesPage';
import { LangNavLink } from '@/SysCore/i18n/LangLink';

type BannerSet = components["schemas"]["BannerSet_DTO"]

type BootstrapCarouselInstance = {
  cycle: () => void;
  pause: () => void;
  dispose?: () => void;
};

const resolveIntervalMs = (data?: BannerSet | null): number => {
  // 後台 Banner.Interval 單位是秒(s)，Bootstrap interval 需要毫秒(ms)
  const sec = data?.Banner?.Interval;
  const n = Number(sec);
  if (!Number.isFinite(n) || n <= 0) return 5000;
  return Math.round(n * 1000);
};

const applyPlayState = (ins: BootstrapCarouselInstance | null, playing: boolean): void => {
  // 依播放狀態切換輪播
  if (!ins) return;
  if (playing) ins.cycle();
  else ins.pause();
};

const initBootstrapCarousel = async (el: HTMLElement, intervalMs: number): Promise<BootstrapCarouselInstance> => {
  // 建立/取得 Bootstrap Carousel instance（只在 Client 端執行）
  const mod = await import("bootstrap/js/dist/carousel");
  const CarouselAny = mod.default as any;

  const ins = CarouselAny.getOrCreateInstance(el, {
    interval: intervalMs,
    ride: "carousel",
    pause: false,
  });

  return ins as BootstrapCarouselInstance;
};

export const CarouselData = (props: { lang: Lang }) => {
  const useBanner = useFetchFormData<BannerSet>(BannerSliderProvider(), '41d46011-6fd7-4da4-917f-c917fa034c19', {});
  const sortedDetails = useMemo(() => {
    // 依 Detail.Sort 由小到大
    const list = useBanner.data?.BannerDetail ?? [];
    return [...list].sort((a, b) => {
      const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
      const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
      // 次排序：RowId，確保順序穩定
      return as - bs || (a.RowId ?? 0) - (b.RowId ?? 0);
    });
  }, [useBanner.data?.BannerDetail]);
  const intervalMs = useMemo(() => { return resolveIntervalMs(useBanner.data ?? null); }, [useBanner.data]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const carouselInsRef = useRef<BootstrapCarouselInstance | null>(null);
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    // 記住最新 isPlaying，給 init 時使用
    isPlayingRef.current = isPlaying;
    // 已建立 instance 時，立即套用播放狀態
    applyPlayState(carouselInsRef.current, isPlaying);
  }, [isPlaying]);
  useEffect(() => {
    // 當後端 interval 變更（或第一次載入）就重建 instance，確保 interval 生效
    const el = carouselRef.current;
    if (!el) return;
    let disposed = false;
    const run = async () => {
      const ins = await initBootstrapCarousel(el, intervalMs);
      if (disposed) {
        ins.dispose?.();
        return;
      }
      carouselInsRef.current = ins;
      applyPlayState(ins, isPlayingRef.current);
    };
    run();
    return () => {
      disposed = true;
      carouselInsRef.current?.dispose?.();
      carouselInsRef.current = null;
    };
  }, [intervalMs]);

  useEffect(() => {
    // Bootstrap 5 carousel 事件：slid.bs.carousel（輪播完成後）
    const el = carouselRef.current;
    if (!el) return;
    const handler = (event: any) => {
      if (typeof event.to === "number") setCurrentIndex(event.to);
    };
    el.addEventListener("slid.bs.carousel", handler);
    return () => el.removeEventListener("slid.bs.carousel", handler);
  }, []);

  useEffect(() => {
    // 當輪播資料變動時，避免 currentIndex 落在範圍外
    if (currentIndex >= sortedDetails.length) setCurrentIndex(0);
  }, [sortedDetails.length, currentIndex]);

  const safeIndex = currentIndex >= 0 && currentIndex < sortedDetails.length ? currentIndex : 0;
  const currentDetail = sortedDetails[safeIndex];

  const performanceData = useMemo(() => {
    // 依目前 slide + 語系取標題等資料
    if (!currentDetail) return { title: "", subTitle: "", showtime: "" };
    const info = useBanner.data?.BannerDetailInfo?.find(
      (x) =>
        x.BannerId === currentDetail.BannerId &&
        x.ParentRowId === currentDetail.RowId &&
        x.Lang === props.lang
    );
    return {
      title: info?.SpecLatestShows ?? "",
      subTitle: info?.SpecShowLocation ?? "",
      showtime: info?.SpecShowDate ?? "",
    };
  }, [currentDetail, useBanner.data?.BannerDetailInfo, props.lang]);

  const onTogglePlay = (e?: React.MouseEvent) => {
    // 點擊播放/暫停
    e?.preventDefault();
    setIsPlaying((p) => !p);
  };

  const onTogglePlayKeyDown = (e: React.KeyboardEvent) => {
    // 鍵盤 Enter/Space 也可操作
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    setIsPlaying((p) => !p);
  };

  const toggleLabel = isPlaying ? "暫停" : "播放";

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
                    <div className="carousel slide" id="B5_default_carousel" ref={carouselRef} data-bs-ride="carousel" data-bs-interval={intervalMs}>
                      {/* Banner 控制 暫停 / 播放 按鈕 */}
                      <div className="control-singlebox">
                        <div className="control-toggle">
                          <a aria-label={toggleLabel} aria-pressed={isPlaying ? "true" : "false"} className="carousel-toggle-btn" id="toggleCarousel"
                            role="button" tabIndex={0} title={toggleLabel} href="#" onClick={onTogglePlay} onKeyDown={onTogglePlayKeyDown}>
                            <span className={clsx("control-icon", isPlaying ? "pause" : "play")} />
                            <span className="sr-only">{toggleLabel}</span>
                          </a>
                        </div>
                      </div>

                      <div className="carousel-inner">
                        {sortedDetails.map((p, i) => {
                          const info = useBanner.data?.BannerDetailInfo?.find((x) => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang);
                          const alt = info?.Title ?? "";
                          const url = info?.URL;
                          const tar = info?.URL_Open === 0 ? "_self" : "_blank"
                          return (
                            <div key={`${p.BannerId}-${p.RowId}-${i}`} className={clsx("carousel-item", i === 0 ? "active" : "")}>
                              {url ?
                                <LangNavLink to={url} target={tar} rel={tar === "_blank" ? "noopener noreferrer" : undefined} aria-label={alt || "banner link"}>
                                  <img src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`} className="d-block w-100" alt={alt} />
                                </LangNavLink>
                                :
                                <img src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`} className="d-block w-100" alt={alt} />
                              }
                            </div>
                          );
                        })}
                      </div>

                      <div className="carousel-indicators">
                        {sortedDetails.map((_, i) => (
                          <button key={i} type="button" data-bs-target="#B5_default_carousel" data-bs-slide-to={i} className={clsx(i === safeIndex && "active")}
                            aria-current={i === safeIndex ? "true" : undefined} aria-label={`Slide ${i + 1}`} title={`第 ${i + 1} 張`} />
                        ))}
                      </div>

                      <div className="carousel_btn-icon-prev">
                        <a data-bs-slide="prev" data-bs-target="#B5_default_carousel" role="button" tabIndex={0} title="上一張" href="#" onClick={(e) => e.preventDefault()}>
                          <div className="carousel-control-prev">
                            <span aria-hidden="true" className="carousel-control-prev-icon" />
                            <span className="sr-only">Previous</span>
                          </div>
                        </a>
                      </div>

                      <div className="carousel_btn-icon-next">
                        <a data-bs-slide="next" data-bs-target="#B5_default_carousel" role="button" tabIndex={0} title="下一張" href="#" onClick={(e) => e.preventDefault()}>
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
      <PerformancesPage title={performanceData.title} subTitle={performanceData.subTitle} showtime={performanceData.showtime} />
    </>
  );
};
