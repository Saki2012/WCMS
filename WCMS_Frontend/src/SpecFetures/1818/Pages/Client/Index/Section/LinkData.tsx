import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { useBannerListData } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Hook";
import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { useEffect, useMemo, useRef } from "react";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { type Lang } from "@/SysCore/i18n/lang";
type BannerSet = components["schemas"]["BannerSet_DTO"]


export const LinkData = (props: { lang?: Lang }) => {
	// props.lang = DefaultLang
	const usebannerList = useBannerListData(`${SchemaFields.BannerFields.BannerId} = Banner20251119001`)
	const bannerInternal = usebannerList.rawData?.[0]?.Banner?.InternalId ?? ""
	const useBanner = useFetchFormData<BannerSet>(BannerSliderProvider(), bannerInternal, {})
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
	const { carouselRef, pauseRef, startRef } = useLinksCarousel(sortedDetails);
	return (
		<section className="Links_section owl-box Layout_Padding_1_top Layout_Padding_1_bottom bg-white">
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="container-customize3">
						<div className="row">
							<div className="offset-3 col-9">
								<div className="headDiv mb-lg-5 mb-4">
									<span className="headDiv-txt tw">相關連結</span>
								</div>
							</div>
							<div className="col-12">
								<div className="content-box px-0 mb-5">
									<div className="owl-carousel owl-theme" id="Links_owl_carousel" ref={carouselRef}>

										{sortedDetails.map((p, i) => {
											const info = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang)
											const alt = info?.Title ?? ""
											const url = info?.URL ?? ""
											const urlopen = info?.URL_Open ?? ""
											return (
												<div key={i} className="item" >
													<a href={url} tabIndex={0} target={(urlopen === 1 ? "_blank" : "_self")} title={alt}>
														<div className="wrapper_box">
															<div className="Qlink-item">
																<div className="Content_Div">
																	<div className="box_content">
																		<div className="tit-text">
																			{alt}
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
									<div className="DIV-Box">
										<div className="control-box">
											<a aria-label="開始播放圖片輪播" aria-pressed="false" className="play me-1" href="#" onClick={(e) => { e.preventDefault(); }}
												data-bs-target="#carousel-Controls" id="Links_start" tabIndex={0} title="播放" ref={startRef}>
												<div id="cycleCarousel" className="contrl_start">
													<span className="control-start-icon">
														<span className="sr-only">開始播放圖片輪播</span>
													</span>
												</div>
											</a>
											<a aria-label="暫停圖片輪播" aria-pressed="true" className="stop ms-1" href="#" onClick={(e) => { e.preventDefault(); }}
												data-bs-target="#carousel-Controls" id="Links_pause" tabIndex={0} title="暫停" type="button" ref={pauseRef}>
												<div id="pauseCarousel" className="contrl_pause">
													<span className="control-pause-icon">
														<span className="sr-only">暫停圖片輪播</span>
													</span>
												</div>
											</a>
										</div>
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


const ensureJQuery = (() => {
	let p: Promise<any> | null = null;
	return () => {
		if (typeof window === "undefined") return Promise.resolve(null);
		if ((window as any).jQuery) return Promise.resolve((window as any).jQuery);
		if (!p) {
			p = (async () => {
				const { default: jqUrl } = await import("@/SpecFetures/1818/Assets/Client/Content/jquery-3.7.1/jquery-3.7.1.min.js?url");
				await new Promise<void>((resolve, reject) => {
					const s = document.createElement("script");
					s.src = jqUrl;
					s.async = true;
					s.onload = () => resolve();
					s.onerror = () => reject(new Error("load jQuery failed"));
					document.head.appendChild(s);
				});
				// 保險：確保 $ / jQuery 都在 window
				(window as any).$ = (window as any).jQuery = (window as any).jQuery || (window as any).$;
				return (window as any).jQuery;
			})();
		}
		return p;
	};
})();

const ensureOwl = (() => {
	let p: Promise<any> | null = null;
	return async () => {
		if (typeof window === "undefined") return null;
		if ((window as any).jQuery?.fn?.owlCarousel) return (window as any).jQuery;
		if (!p) {
			p = (async () => {
				const $ = await ensureJQuery();

				// ✅ 第一個 JS，第二個 CSS
				const [{ default: jsUrl }, { default: cssUrl }] = await Promise.all([
					import("https://owlcarousel2.github.io/OwlCarousel2/assets/owlcarousel/owl.carousel.min.js?url"),
					import("https://owlcarousel2.github.io/OwlCarousel2/assets/owlcarousel/assets/owl.carousel.min.css?url"),
				]);

				// 先掛 CSS
				if (!document.querySelector(`link[href="${cssUrl}"]`)) {
					const link = document.createElement("link");
					link.rel = "stylesheet";
					link.href = cssUrl;
					document.head.appendChild(link);
				}

				// 再掛 JS
				await new Promise<void>((resolve, reject) => {
					const s = document.createElement("script");
					s.src = jsUrl;
					s.async = true;
					s.onload = () => resolve();
					s.onerror = () => reject(new Error("load Owl failed"));
					document.head.appendChild(s);
				});

				return $;
			})();
		}
		return p;
	};
})();

const useLinksCarousel = (dep: any) => {
	const carouselRef = useRef<HTMLDivElement | null>(null);
	const pauseRef = useRef<HTMLAnchorElement>(null);
	const startRef = useRef<HTMLAnchorElement>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const root = carouselRef.current;
		if (!root) return;

		let cleanup: (() => void) | undefined;

		(async () => {
			const $ = await ensureOwl();
			if (!$) return;

			const $owl = $(root);

			// 先銷毀舊的 carousel，避免重複初始化
			try {
				if ($owl.data("owl.carousel")) {
					$owl.trigger("destroy.owl.carousel");
				}
			}
			catch { /* ignore */ }

			// ✅ 完全依照你原本 script 的設定
			const opts = {
				items: 4,
				// loop: true, //true or false
				dots: false,
				nav: true,
				margin: 30,
				// autoplay: true, //true or false
				autoplayTimeout: 5000,
				autoplayHoverPause: true,
				responsive: {
					0: { items: 1 },
					500: { items: 2 },
					575: { items: 2 },
					767: { items: 3 },
					991: { items: 3 },
					1199: { items: 4 },
				},
			};

			// owl 的 autoplay 預設關閉（跟你原本註解掉 autoplay 一樣）
			let isPlaying = false;

			$owl.owlCarousel(opts);

			// 綁定控制按鈕（維持原本的 id）
			const $pause = $(pauseRef.current ?? document.getElementById("Links_pause"));
			const $start = $(startRef.current ?? document.getElementById("Links_start"));

			const updateControls = () => {
				// ✅ 完全照你原本的 aria / .sr-only 文案邏輯
				if (isPlaying) {
					$start
						.attr("aria-pressed", "true")
						.attr("aria-label", "圖片輪播播放中")
						.find(".sr-only").text("圖片輪播播放中");

					$pause
						.attr("aria-pressed", "false")
						.attr("aria-label", "暫停圖片輪播")
						.find(".sr-only").text("暫停圖片輪播");
				}
				else {
					$start
						.attr("aria-pressed", "false")
						.attr("aria-label", "開始播放圖片輪播")
						.find(".sr-only").text("開始播放圖片輪播");

					$pause
						.attr("aria-pressed", "true")
						.attr("aria-label", "圖片輪播已暫停")
						.find(".sr-only").text("圖片輪播已暫停");
				}
			};

			const onPauseClick = (ev: any) => {
				ev.preventDefault?.();
				$owl.trigger("stop.owl.autoplay");
				isPlaying = false;
				updateControls();
			};

			const onStartClick = (ev: any) => {
				ev.preventDefault?.();
				$owl.trigger("play.owl.autoplay", [opts.autoplayTimeout]);
				isPlaying = true;
				updateControls();
			};

			$pause.on("click", onPauseClick);
			$start.on("click", onStartClick);

			// 預設初始化狀態（跟原本 script 一樣 isPlaying = false）
			isPlaying = false;
			updateControls();

			cleanup = () => {
				try {
					$pause.off("click", onPauseClick);
					$start.off("click", onStartClick);
					if ($owl.data("owl.carousel")) {
						$owl.trigger("destroy.owl.carousel");
					}
				}
				catch { /* ignore */ }
			};
		})();

		return () => cleanup?.();
		// 🔁 建議傳入像是 linksData.length 之類的依賴
	}, [dep]);

	return {
		carouselRef,
		pauseRef,
		startRef,
	};
};