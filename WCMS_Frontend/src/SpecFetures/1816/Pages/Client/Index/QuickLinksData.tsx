import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { useBannerListData } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Hook";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import clsx from "clsx";
import * as SchemaFields from "@/types/SchemaFields";
import { useEffect, useMemo, useRef } from "react";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
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

export const QuickLinksData = () => {

	const usebannerList = useBannerListData(`${SchemaFields.BannerFields.BannerId} = Banner20251106001`)
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

	const carouselRef = useRef<HTMLDivElement | null>(null);
	const toggleRef = useRef<HTMLAnchorElement | null>(null);
	useEffect(() => {
		if (typeof window === "undefined") return;
		if (!carouselRef.current) return;
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const root = carouselRef.current;
		if (!root) return;
		let cleanup: (() => void) | undefined;
		(async () => {
			const $ = await ensureOwl();
			if (!$) return;
			const $owl = $(root);
			try {
				if ($owl.data("owl.carousel")) {
					$owl.trigger("destroy.owl.carousel");
				}
			} catch { }
			// 與你原始腳本一致的參數
			const opts = {
				items: 4,
				loop: false,
				dots: false,
				nav: true,
				margin: 30,
				autoplay: false,
				autoplayTimeout: 1000,
				autoplayHoverPause: true,
				responsive: {
					0: { items: 2 },
					575: { items: 2 },
					767: { items: 2 },
					991: { items: 3 },
					1199: { items: 4 },
				},
			};
			let isPlaying = !!opts.autoplay;
			$owl.owlCarousel(opts);
			// 播放/暫停切換（A11y）
			const $toggle = $(toggleRef.current ?? document.getElementById("Links_toggle"));
			const updateToggleButton = () => {
				if (!$toggle.length) return;
				const $iconBox = $toggle.find(".control-toggle");
				const $srText = $toggle.find(".sr-only");
				$iconBox.removeClass("control-play-icon control-pause-icon");
				if (isPlaying) {
					$toggle
						.attr("aria-pressed", "true")
						.attr("aria-label", "圖片輪播播放中，點擊暫停");
					$iconBox.addClass("control-pause-icon");
					$srText.text("圖片輪播播放中，點擊暫停");
				} else {
					$toggle
						.attr("aria-pressed", "false")
						.attr("aria-label", "圖片輪播已暫停，點擊播放");
					$iconBox.addClass("control-play-icon");
					$srText.text("圖片輪播已暫停，點擊播放");
				}
			};

			const onToggle = (ev: any) => {
				ev.preventDefault?.();
				if (isPlaying) {
					$owl.trigger("stop.owl.autoplay");
					isPlaying = false;
				} else {
					$owl.trigger("play.owl.autoplay", [opts.autoplayTimeout]);
					isPlaying = true;
				}
				updateToggleButton();
			};

			// 綁事件與初始化按鈕狀態
			$toggle.on("click", onToggle);
			updateToggleButton();

			cleanup = () => {
				try {
					$toggle.off("click", onToggle);
					if ($owl.data("owl.carousel")) {
						$owl.trigger("destroy.owl.carousel");
					}
				} catch { }
			};
		})();

		return () => cleanup?.();
		// 每次 slides 資料量變更才重建，避免每 render 都初始化
	}, [sortedDetails.length]);

	return (


		<section className="Links_section owl-box Layout_Padding_3_top Layout_Padding_1_bottom">
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="container-customize2">
						<div className="row">
							<div className="col-12">
								<div className="headDiv mb-sm-5 mb-4">
									<span className="headDiv-txt">快速連結</span>
									<span className="headDiv-subtxt">Links</span>
								</div>
							</div>
							<div className="col-12">
								<div className="content-box px-0 mb-5">
									<div className="DIV-singleBox d-none">
										<div className="control-singlebox">
											<a
												ref={toggleRef}
												aria-label="圖片輪播播放中，點擊暫停"
												aria-pressed="true"
												className="toggle ms-1"
												href="javascript:void(0);"
												id="Links_toggle"
												tabIndex={0}
												title="暫停">
												<div className="control-toggle control-pause-icon">
													<span className="sr-only">圖片輪播播放中，點擊暫停</span>
												</div>
											</a>
										</div>
									</div>
									<div className="owl-carousel owl-theme" id="Links_owl_carousel" ref={carouselRef}>


										{sortedDetails.map((p, i) => {
											const alt = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.Title ?? ""
											const url = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.URL ?? ""
											const content = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.Content ?? ""
											const urlopen = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.URL_Open ?? ""
											return (

												<div key={i} className="item">
													<a
														href={url}
														//onclick="js_method();return false;"
														tabIndex={0}
														target={(urlopen === 1 ? "_blank" : "_self")}
														title="">
														<div className="wrapper_box">
															<div className="Qlink-item">
																<div className="Img_Div w-100">
																	<div className="Qlinkimg-outer">
																		<img
																			alt={alt}
																			src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`}
																		/>
																	</div>
																</div>
																<div className="go_label d-none">
																	<i aria-hidden="true" className="fa fa-link">
																		<span className="sr-only">{alt}</span>
																	</i>
																</div>
																<div className="Content_Div">
																	<div className="box_content">
																		<div className="tit-text">
																			{alt}
																		</div>
																	</div>
																</div>
															</div>
														</div>
													</a>
												</div>
											)
										})}








									</div>
									<div
										className="customize_btn mr-4 d-none"
										style={{
											bottom: "-40px",
											position: "absolute",
											right: "0",
										}}>
										<a
											className="Btn_a"
											href="javascript:void(0);"
											role="button"
											tabIndex={0}
											target="_self"
											title="更多連結"
											type="button">
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


const ensureJQuery = (() => {
	let p: Promise<any> | null = null;
	return () => {
		if (typeof window === "undefined") return Promise.resolve(null);
		if ((window as any).jQuery) return Promise.resolve((window as any).jQuery);
		if (!p) {
			p = (async () => {
				const { default: jqUrl } = await import("@/SpecFetures/1816/Assets/Client/Content/jquery-3.7.1/jquery-3.7.1.min.js?url");
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
				const [{ default: cssUrl }, { default: jsUrl }] = await Promise.all([
					import("https://owlcarousel2.github.io/OwlCarousel2/assets/owlcarousel/owl.carousel.js?url"),
					import("https://owlcarousel2.github.io/OwlCarousel2/assets/owlcarousel/assets/owl.carousel.min.css?url"),
				]);
				// 先掛 CSS（若尚未）
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