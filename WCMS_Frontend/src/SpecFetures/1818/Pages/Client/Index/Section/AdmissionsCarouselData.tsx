import type { components } from "@/types/api";
import { useEffect, useMemo, useRef } from "react";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { Lang } from "@/SysCore/i18n/lang";
import { IndexLabel } from "@/SpecFetures/1818/Pages/Client//Index/Section/IndexLabelText";
import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WebManagement/BannerSlider_Api";

type BannerSet = components["schemas"]["BannerSet_DTO"];

const toInitial = <TArgs, TData>(args: TArgs, data: TData) => {
  // return：符合 adapter hook initial
  return { args, apiRes: { IsSuccess: true, Data: data, SysMessage: [] } };
};

export const AdmissionsCarouselData = (props: { lang: Lang; internalId: string; initialBanner: BannerSet | null }) => {
  // 宣告變數：adapter
  const adapter = useMemo(() => BannerSliderAdapter(), []);

  // 宣告變數：initial
  const initial = useMemo(() => {
    if (!props.initialBanner) return undefined;
    return toInitial(props.internalId, props.initialBanner);
  }, [props.internalId, props.initialBanner]);

  // 執行 function：CSR hook 接手（SSR 有 initial → 不重抓）
  const q = adapter.hooks.useQueryData({
    internalId: props.internalId,
    initial,
    deps: [props.internalId],
  });

  // 宣告變數：排序 detail
  const sortedDetails = useMemo(() => {
    const list = q.data?.BannerDetail ?? [];
    return [...list].sort((a, b) => {
      const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
      const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
      return as - bs || (a.RowId ?? 0) - (b.RowId ?? 0);
    });
  }, [q.data?.BannerDetail]);


  type OwlOptions = Record<string, unknown>;

type JQueryObj = {
  length: number;
  data: (key: string) => unknown;
  trigger: (evt: string, payload?: unknown[]) => void;
  owlCarousel: (opts: OwlOptions) => void;
};

type JQueryLike = ((el: HTMLElement) => JQueryObj) & {
  fn?: { owlCarousel?: (opts: OwlOptions) => void };
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const getJQuery = (): JQueryLike | null => {
  // 宣告變數：嘗試抓 window.$ / window.jQuery
  const w = window as unknown as { $?: JQueryLike; jQuery?: JQueryLike };
  // return
  return w.jQuery ?? w.$ ?? null;
};

const waitForOwlReady = async (p?: { timeoutMs?: number; intervalMs?: number }) => {
  // 宣告變數
  const timeoutMs = p?.timeoutMs ?? 8000;
  const intervalMs = p?.intervalMs ?? 50;
  const start = Date.now();

  // 執行：輪詢直到 owl plugin 掛上來
  while (Date.now() - start < timeoutMs) {
    const $ = getJQuery();
    if ($?.fn?.owlCarousel) return $;
    await sleep(intervalMs);
  }

  // return
  return null;
};

const safeDestroyOwl = ($owl: JQueryObj) => {
  // 執行：若已初始化，先 destroy
  try {
    if ($owl.data("owl.carousel")) $owl.trigger("destroy.owl.carousel");
  } catch {
    // ignore
  }
};

// --------------------
// 在 component 內：加入 ref + 用它 init Owl
// --------------------

// 例：在 AdmissionsCarouselData component 內加
const carouselRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
  // SSR guard
  if (typeof window === "undefined") return;

  // 宣告變數
  const root = carouselRef.current;
  if (!root) return;

  let disposed = false;
  let $: JQueryLike | null = null;
  let $owl: JQueryObj | null = null;

  // 執行 function
  const run = async () => {
    $ = await waitForOwlReady();
    if (disposed || !$) return;

    $owl = $(root);
    safeDestroyOwl($owl);

    const opts: OwlOptions = {
      items: 4,
      dots: false,
      nav: true,
      margin: 30,
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
    };

    // 執行：初始化
    try {
      $owl.owlCarousel(opts);
    } catch {
      // ignore
    }
  };

  run();

  // return：cleanup
  return () => {
    disposed = true;
    if ($owl) safeDestroyOwl($owl);
  };
}, [
  /* 建議依賴：資料數量或你自己算的 key */
  sortedDetails.length,
]);

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
                      <div className="owl-carousel owl-theme" id="Admissions_owl_carousel" ref={carouselRef}>
                        {sortedDetails.map((p, i) => {
                          const info = q.data?.BannerDetailInfo?.find(
                            x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang
                          );

                          const alt = info?.Title ?? "";
                          const content = info?.Content ?? "";
                          const url = info?.URL ?? "";
                          const urlopen = info?.URL_Open === 1 ? "_blank" : "_self";
                          const imgUrl = FileManagementAPI.get_Public_Preview_Url(p.PicSrcId,alt)
                          return (
                            <div key={i} className={"item"}>
                              <a href={url} tabIndex={0} target={urlopen} rel={urlopen === "_blank" ? "noopener noreferrer" : undefined} title={alt}>
                                <div className="wrapper_box">
                                  <div className="Qlink-item">
                                    <div className="Content_Div">
                                      <div className="box_content">
                                        <div className="tit-text mb-4">{alt}</div>
                                        <div className="subtit-text mb-4">{content}</div>
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
                                        <img alt={alt} src={imgUrl} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </a>
                            </div>
                          );
                        })}
                      </div>
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