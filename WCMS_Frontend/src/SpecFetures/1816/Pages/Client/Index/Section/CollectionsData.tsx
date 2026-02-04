import CollectionsProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { useEffect, useMemo, useRef } from "react";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { type Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";

import icon1 from '@/SpecFetures/1816/Assets/Client/images/collections/Collect-icon-01.svg'
import icon2 from '@/SpecFetures/1816/Assets/Client/images/collections/Collect-icon-02.svg'
import icon3 from '@/SpecFetures/1816/Assets/Client/images/collections/Collect-icon-03.svg'
import icon4 from '@/SpecFetures/1816/Assets/Client/images/collections/Collect-icon-04.svg'



type BannerSet = components["schemas"]["BannerSet_DTO"];

export const CollectionsData = (props: { lang: Lang }) => {
	// 宣告變數：取得館藏櫥窗 Banner 資料
	const useBanner = useFetchFormData<BannerSet>(CollectionsProvider(), "5db9cbbe-9319-401c-ae40-1580f87b30e5", {});
	const carouselRef = useRef<HTMLDivElement | null>(null);
	const toggleRef = useRef<HTMLAnchorElement | null>(null);

	// 執行 function：依 Rank 排序明細
	const sortedDetails = useMemo(() => {
		const list = useBanner.data?.BannerDetail ?? [];
		return [...list].sort((a, b) => (a?.Sort ?? 0) - (b?.Sort ?? 0));
	}, [useBanner.data?.BannerDetail]);

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

			// 與 prototype 的 owl 設定一致（margin=0、autoplay=true）
			const opts = {
				items: 4,
				loop: false,
				dots: false,
				nav: true,
				margin: 0,
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

			let isPlaying = !!opts.autoplay;

			$owl.owlCarousel(opts);

			// 播放/暫停切換（A11y）
			const $toggle = $(toggleRef.current ?? document.getElementById("Collections_toggle"));

			const updateToggleButton = () => {
				if (!$toggle.length) return;

				const $iconBox = $toggle.find(".control-toggle");
				const $srText = $toggle.find(".sr-only");

				$iconBox.removeClass("control-play-icon control-pause-icon");

				if (isPlaying) {
					$toggle
						.attr("aria-pressed", "true")
						.attr("title", "暫停")
						.attr("aria-label", "圖片輪播播放中，點擊暫停");
					$iconBox.addClass("control-pause-icon");
					$srText.text("圖片輪播播放中，點擊暫停");
				} else {
					$toggle
						.attr("aria-pressed", "false")
						.attr("title", "播放")
						.attr("aria-label", "圖片輪播已暫停，點擊播放");
					$iconBox.addClass("control-play-icon");
					$srText.text("圖片輪播已暫停，點擊播放");
				}
			};

			const onToggle = (e: Event) => {
				e.preventDefault();
				if (isPlaying) {
					$owl.trigger("stop.owl.autoplay");
					isPlaying = false;
				} else {
					$owl.trigger("play.owl.autoplay", [opts.autoplayTimeout]);
					isPlaying = true;
				}
				updateToggleButton();
			};

			$toggle.off("click.collectionsToggle");
			$toggle.on("click.collectionsToggle", onToggle);

			updateToggleButton();

			cleanup = () => {
				try {
					$toggle.off("click.collectionsToggle");
					if ($owl.data("owl.carousel")) {
						$owl.trigger("destroy.owl.carousel");
					}
				} catch { }
			};
		})();

		return () => cleanup?.();
	}, [sortedDetails.length]);
	const iconList = [icon1, icon2, icon3, icon4];
	return (
		<section className="Collections_section owl-box Layout_Padding_4_top">
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="container-customize4">
						<div className="row">
							<div className="col-12">
								{/* 標題 start */}
								<div className="headDiv mb-3">
									{props.lang === "zh-tw" ? (
										<>
											<span className="headDiv-txt">館藏櫥窗</span>
											<span className="headDiv-subtxt">Collection Showcase</span>
										</>
									) : props.lang === "en" ? (
										<>
											<span className="headDiv-txt">Collection Showcase</span>
										</>
									) : (
										""
									)}
								</div>
								{/* 標題 end */}
							</div>

							<div className="col-12">
								<div className="content-box px-0 mb-0">
									<div className="owl-carousel owl-theme" id="Collections_owl_carousel" ref={carouselRef}>
										{sortedDetails.map((p, i) => {
											const detail = useBanner.data?.BannerDetailInfo?.find(
												(x) => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang
											);

											const alt = detail?.Title ?? "";
											const url = detail?.URL ?? "javascript:void(0);";
											const content = detail?.Content ?? "";
											const urlopen = detail?.URL_Open ?? "";

											return (
												<div key={i} className="item">
													<LangLink to={url} tabIndex={0} target={urlopen === 1 ? "_blank" : "_self"} title={alt} >
														<div className="wrapper_box">
															<figure className="card_figure">
																<div className="card_image_link">
																	<picture>
																		<img className="card_image" src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`} alt={alt} />
																	</picture>
																</div>
															</figure>

															<div className="txtarea">
																<div className="card_catinfo d-flex flex-column">
																	<div className="mb-1" >
																		<img src={iconList[i]} alt="" />
																	</div>
																	<span className="card_catname mb-4">
																		<span className="mx-1">{alt}</span>
																	</span>
																</div>
																<span className="sr-only">{content}</span>
															</div>
														</div>
													</LangLink>
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
	);
};





const ensureJQuery = (() => {
	let p: Promise<any> | null = null;
	return async () => {
		if (typeof window === "undefined") return null;
		if ((window as any).jQuery) return (window as any).jQuery;
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
				const [{ default: jsUrl }, { default: cssUrl }] = await Promise.all([
					import("https://owlcarousel2.github.io/OwlCarousel2/assets/owlcarousel/owl.carousel.js?url"),
					import("https://owlcarousel2.github.io/OwlCarousel2/assets/owlcarousel/assets/owl.carousel.min.css?url"),
				]);
				if (!document.querySelector(`link[href="${cssUrl}"]`)) {
					const link = document.createElement("link");
					link.rel = "stylesheet";
					link.href = cssUrl;
					document.head.appendChild(link);
				}
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
