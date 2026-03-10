import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WebManagement/BannerSlider_Api";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { components } from "@/types/api";
import { useEffect, useMemo } from "react";

type BannerSet = components["schemas"]["BannerSet_DTO"];

export interface QuickLinksDataProps {
	lang: Lang;
	internalId: string;
	initialBanner: BannerSet | null;
}

const buildQueryDataInitial = (internalId: string, banner: BannerSet | null): ApiLoaderData<string, BannerSet> | null => {
	// 宣告變數：沒有 SSR initial 就回 null（CSR 會自己抓）
	if (!banner) return null;

	// 宣告變數：組成功 env
	const apiRes: ApiResponse<BannerSet> = { IsSuccess: true, Data: banner, SysMessage: [] };

	// return
	return { args: internalId, apiRes };
};

export const QuickLinksData = (props: QuickLinksDataProps) => {
	// 宣告變數：Adapter（固定一次）
	const adapter = useMemo(() => BannerSliderAdapter(), []);

	// 宣告變數：SSR initial（QueryData 單筆）
	const initial = useMemo(() => { return buildQueryDataInitial(props.internalId, props.initialBanner); }, [props.internalId, props.initialBanner]);

	// 宣告變數：QueryData（SSR 有 initial → hydration 不重抓）
	const useBanner = adapter.hooks.useQueryData({
		internalId: props.internalId,
		initial,
		deps: [props.internalId, props.lang],
	});

	const sortedDetails = useMemo(() => {
		const list = useBanner.data?.BannerDetail ?? [];
		return [...list].sort((a, b) => {
			const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
			const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
			if (as !== bs) return as - bs;
			const ar = Number.isFinite(a?.RowId) ? Number(a.RowId) : Number.MAX_SAFE_INTEGER;
			const br = Number.isFinite(b?.RowId) ? Number(b.RowId) : Number.MAX_SAFE_INTEGER;
			return ar - br;
		});
	}, [useBanner.data?.BannerDetail]);

	// ✅ 建議：不要只看 length，PicSrcId 換一批但數量相同也會重建
const depsKey = useMemo(() => {
  return sortedDetails.map((d) => d?.PicSrcId ?? "").join("|");
}, [sortedDetails]);

useEffect(() => {
  // SSR guard
  if (typeof window === "undefined") return;

  // 宣告變數：carousel root
  const rootEl = document.getElementById("Links_owl_carousel");
  if (!rootEl) return;

  // 宣告變數：toggle（可選）
  const toggleEl = document.getElementById("Links_toggle");

  interface OwlOptions {
    items: number;
    loop: boolean;
    dots: boolean;
    nav: boolean;
    margin: number;
    autoplay: boolean;
    autoplayTimeout: number;
    autoplayHoverPause: boolean;
    responsive: Record<number, { items: number }>;
  }

  type JQueryOwl = {
    owlCarousel?: (opt: OwlOptions) => void;
    trigger: (eventName: string, args?: unknown[]) => void;
  };

  type JQueryStaticLike = ((el: Element) => JQueryOwl) & {
    fn?: { owlCarousel?: unknown };
  };

  let cancelled = false;
  let isPlaying = true;
  let jqRef: JQueryStaticLike | null = null;

  const sleep = (ms: number): Promise<void> => {
    // 宣告變數
    // 執行 function
    return new Promise<void>((r) => setTimeout(r, ms));
  };

  const buildOwlOptions = (): OwlOptions => {
    // 宣告變數
    const opt: OwlOptions = {
      items: 4,
      loop: false,
      dots: false,
      nav: true,
      margin: 5,
      autoplay: true,
      autoplayTimeout: 10000,
      autoplayHoverPause: true,
      responsive: {
        0: { items: 2 },
        575: { items: 2 },
        767: { items: 2 },
        991: { items: 3 },
        1199: { items: 4 },
      },
    };

    // return
    return opt;
  };

  const waitForOwlReady = async (): Promise<JQueryStaticLike | null> => {
    // SSR guard
    if (typeof window === "undefined") return null;

    // 宣告變數
    for (let i = 0; i < 40; i++) {
      const $ = ((window as unknown as { jQuery?: unknown; $?: unknown }).jQuery ??
        (window as unknown as { jQuery?: unknown; $?: unknown }).$) as JQueryStaticLike | undefined;

      // 執行 function
      if ($?.fn?.owlCarousel) return $;
      await sleep(50);
    }

    // return
    return null;
  };

  const destroyOwlSafe = ($: JQueryStaticLike): void => {
    // 宣告變數
    const $owl = $(rootEl);

    // 執行 function
    try {
      $owl.trigger("destroy.owl.carousel");
    } catch {
      // ignore
    }

    // return
  };

  const updateToggleButton = (): void => {
    // 宣告變數
    if (!(toggleEl instanceof HTMLElement)) return;

    const iconBox = toggleEl.querySelector<HTMLElement>(".control-toggle");
    const srText = toggleEl.querySelector<HTMLElement>(".sr-only");

    // 執行 function
    iconBox?.classList.remove("control-play-icon", "control-pause-icon");

    if (isPlaying) {
      toggleEl.setAttribute("aria-pressed", "true");
      toggleEl.setAttribute("aria-label", "圖片輪播播放中，點擊暫停");
      iconBox?.classList.add("control-pause-icon");
      if (srText) srText.textContent = "圖片輪播播放中，點擊暫停";
    } else {
      toggleEl.setAttribute("aria-pressed", "false");
      toggleEl.setAttribute("aria-label", "圖片輪播已暫停，點擊播放");
      iconBox?.classList.add("control-play-icon");
      if (srText) srText.textContent = "圖片輪播已暫停，點擊播放";
    }

    // return
  };

  const onToggleClick = (): void => {
    // 宣告變數
    const $ = jqRef;
    if (!$) return;

    const $owl = $(rootEl);

    // 執行 function
    if (isPlaying) {
      $owl.trigger("stop.owl.autoplay");
      isPlaying = false;
    } else {
      $owl.trigger("play.owl.autoplay", [5000]);
      isPlaying = true;
    }

    updateToggleButton();

    // return
  };

  const initOwl = ($: JQueryStaticLike): void => {
    // 宣告變數
    // ✅ 若已初始化過（資料更新），先 destroy 再重建
    destroyOwlSafe($);

    // 執行 function
    requestAnimationFrame(() => {
      if (cancelled) return;

      const $owl = $(rootEl);
      if (typeof $owl.owlCarousel !== "function") return;

      $owl.owlCarousel(buildOwlOptions());

      // 初始化 toggle 狀態（可選）
      isPlaying = true;
      updateToggleButton();
    });

    // return
  };

  // ✅ 沒資料就 destroy（避免殘留 & Owl CSS 造成整段 display:none）
  if (sortedDetails.length === 0) {
    const $maybe = (((window as unknown as { jQuery?: unknown; $?: unknown }).jQuery ??
      (window as unknown as { jQuery?: unknown; $?: unknown }).$) as JQueryStaticLike | undefined);

    if ($maybe?.fn?.owlCarousel) {
      try {
        $maybe(rootEl).trigger("destroy.owl.carousel");
      } catch {
        // ignore
      }
    }
    return;
  }

  const run = async (): Promise<void> => {
    // 宣告變數
    const $ = await waitForOwlReady();
    if (!$ || cancelled) return;

    // 執行 function
    jqRef = $;

    // 綁 toggle（可選）
    if (toggleEl instanceof HTMLElement) {
      toggleEl.addEventListener("click", onToggleClick);
      updateToggleButton();
    }

    initOwl($);

    // return
  };

  void run();

  // cleanup
  return () => {
    cancelled = true;

    if (toggleEl instanceof HTMLElement) {
      toggleEl.removeEventListener("click", onToggleClick);
    }

    if (jqRef) {
      destroyOwlSafe(jqRef);
    }
  };
}, [depsKey, sortedDetails.length]);
	return (
		<section className="Links_section owl-box Layout_Padding_4_top Layout_Padding_4_bottom">
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="container-customize4">
						<div className="row">
							<div className="col-12">
								<div className="headDiv mb-3">
									{props.lang === "zh-tw" ? (
										<>
											<span className="headDiv-txt">快速連結</span>
											<span className="headDiv-subtxt">Links</span>
										</>
									) : props.lang === "en" ? (
										<>
											<span className="headDiv-txt">Links</span>
										</>
									) : (
										""
									)}
								</div>
							</div>
							<div className="col-12">
								<div className="content-box px-0 mb-5">
									<div className="owl-carousel owl-theme" id="Links_owl_carousel">
										{sortedDetails.map((p, i) => {
											const info = useBanner.data?.BannerDetailInfo?.find(
												(x) => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang,
											);
											const alt = info?.Title ?? "";
											const url = info?.URL ?? "";
											const urlopen = info?.URL_Open === 0 ? "_self" : "_blank";
											return (
												<div key={i} className="item">
													<LangLink to={url} tabIndex={0} target={urlopen}>
														<div className="wrapper_box">
															<figure className="card_figure">
																<div className="card_image_link">
																	<picture>
																		<img className="card_image" src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`} alt={alt}/>
																	</picture>
																</div>
															</figure>
														</div>
													</LangLink>
												</div>
											);
										})}
									</div>

									<div className="customize_btn mr-4 d-none" style={{ bottom: "-40px", position: "absolute", right: "0" }}>
										<a className="Btn_a" role="button" tabIndex={0} target="_self" title="更多連結" type="button">
											<div className="BtnBox">
												<span>更多連結</span>
												<span className="ml-2">+</span>
											</div>
										</a>
									</div>

								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};