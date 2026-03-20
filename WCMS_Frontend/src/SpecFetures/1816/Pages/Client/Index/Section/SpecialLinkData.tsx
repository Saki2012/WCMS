import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WebManagement/BannerSlider_Api";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import { useEffect, useMemo, useRef } from "react";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";

type BannerSet = components["schemas"]["BannerSet_DTO"];

const buildQueryDataInitial = (internalId: string, banner: BannerSet | null): ApiLoaderData<string, BannerSet> | null => {
	// 宣告變數：沒有 SSR initial 就回 null（CSR 會自己抓）
	if (!banner) return null;
	// 宣告變數：組成功 env
	const apiRes: ApiResponse<BannerSet> = { IsSuccess: true, Data: banner, SysMessage: [] };
	// return
	return { args: internalId, apiRes };
};

export const SpecialLinkData = (props: { lang: Lang; internalId: string; initialBanner: BannerSet | null }) => {
	// 宣告變數：Adapter（固定一次）
	const adapter = useMemo(() => BannerSliderAdapter(), []);

	// 宣告變數：SSR initial（QueryData 單筆）
	const initial = useMemo(() => {
		return buildQueryDataInitial(props.internalId, props.initialBanner);
	}, [props.internalId, props.initialBanner]);

	// 宣告變數：Banner QueryData（SSR 有 initial → hydration 不重抓）
	const useBanner = adapter.hooks.useQueryData({
		internalId: props.internalId,
		initial,
		deps: [props.internalId, props.lang],
	});

	// 宣告變數：排序後的 Banner 明細
	const sortedDetails = useMemo(() => {
		const list = useBanner.data?.BannerDetail ?? [];
		return [...list].sort((a, b) => {
			const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
			const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
			return as - bs || (a.RowId ?? 0) - (b.RowId ?? 0);
		});
	}, [useBanner.data?.BannerDetail]);

	// 宣告變數：重建 Owl 用 key
	const depsKey = useMemo(() => {
		return sortedDetails.map((d) => `${d?.RowId ?? ""}_${d?.PicSrcId ?? ""}_${d?.Sort ?? ""}`).join("|");
	}, [sortedDetails]);

	const carouselRef = useRef<HTMLDivElement | null>(null);
	const toggleRef = useRef<HTMLAnchorElement | null>(null);

	useEffect(() => {
		// SSR guard
		if (typeof window === "undefined") return;

		// 宣告變數
		const root = carouselRef.current;
		if (!root) return;

		// fallback：先解除可能被 Owl CSS 隱藏
		root.style.display = "block";

		type OwlOptions = {
			items: number;
			loop: boolean;
			dots: boolean;
			nav: boolean;
			margin: number;
			autoplay: boolean;
			autoplayTimeout: number;
			autoplayHoverPause: boolean;
			responsive: Record<number, { items: number }>;
		};

		type JQueryObj = {
			length: number;
			trigger: (eventName: string, args?: (string | number)[]) => void;
			owlCarousel?: (opt: OwlOptions) => void;
			off: (eventName?: string) => void;
			on: (eventName: string, handler: (e: Event) => void) => void;
			find: (selector: string) => JQueryObj;
			attr: (name: string, value: string) => JQueryObj;
			text: (value: string) => void;
			addClass: (name: string) => void;
			removeClass: (name: string) => void;
		};

		type JQueryStaticLike = ((el: Element) => JQueryObj) & {
			fn?: { owlCarousel?: (opt: OwlOptions) => void };
		};

		const getJQueryLike = (): JQueryStaticLike | null => {
			const win = window as unknown as {
				jQuery?: JQueryStaticLike;
				$?: JQueryStaticLike;
			};

			return win.jQuery ?? win.$ ?? null;
		};

		let cancelled = false;
		let isPlaying = false;

		const sleep = (ms: number): Promise<void> => {
			return new Promise<void>((resolve) => setTimeout(resolve, ms));
		};

		const waitForOwlReady = async (): Promise<JQueryStaticLike | null> => {
			// 執行 function：等待 legacy bundle 掛上 Owl
			for (let i = 0; i < 40; i++) {
				const $maybe = getJQueryLike();
				if ($maybe?.fn?.owlCarousel) return $maybe;
				await sleep(50);
			}

			return null;
		};

		const destroyOwlSafe = ($: JQueryStaticLike): void => {
			const $owl = $(root);

			try {
				$owl.trigger("destroy.owl.carousel");
			} catch {
				// ignore
			}
		};

		const updateToggleButton = ($toggle: JQueryObj): void => {
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
				return;
			}

			$toggle
				.attr("aria-pressed", "false")
				.attr("title", "播放")
				.attr("aria-label", "圖片輪播已暫停，點擊播放");
			$iconBox.addClass("control-play-icon");
			$srText.text("圖片輪播已暫停，點擊播放");
		};

		const run = async (): Promise<void> => {
			// 沒資料時先嘗試 destroy，避免殘留 display / class 狀態
			if (sortedDetails.length === 0) {
				const $maybe = getJQueryLike();
				if ($maybe?.fn?.owlCarousel) {
					destroyOwlSafe($maybe);
				}
				return;
			}

			const $ = await waitForOwlReady();
			if (cancelled) return;

			// Owl 沒載到也先讓首屏可見
			if (!$) {
				root.classList.add("owl-loaded");
				return;
			}

			const opts: OwlOptions = {
				items: 3,
				loop: false,
				dots: false,
				nav: true,
				margin: 5,
				autoplay:  true,
				autoplayTimeout: 10000,
				autoplayHoverPause: true,
				responsive: {
					0: { items: 2 },
					575: { items: 2 },
					767: { items: 2 },
					991: { items: 3 },
					1199: { items: 3 },
				},
			};

			const $owl = $(root);

			// 若已初始化過，先 destroy 再重建
			destroyOwlSafe($);

			requestAnimationFrame(() => {
				if (cancelled) return;

				$owl.owlCarousel?.(opts);

				const toggleEl = toggleRef.current ?? document.getElementById("Event_toggle");
				const $toggle = toggleEl ? $(toggleEl) : null;

				isPlaying = !!opts.autoplay;

				if ($toggle && $toggle.length) {
					const onToggle = (e: Event) => {
						e.preventDefault();

						if (isPlaying) {
							$owl.trigger("stop.owl.autoplay");
							isPlaying = false;
						} else {
							$owl.trigger("play.owl.autoplay", [opts.autoplayTimeout]);
							isPlaying = true;
						}

						updateToggleButton($toggle);
					};

					const onToggleKeydown = (e: Event) => {
						const keyEvent = e as KeyboardEvent;
						if (keyEvent.key !== "Enter") return;
						onToggle(e);
					};

					$toggle.off("click.specialLinkToggle");
					$toggle.off("keydown.specialLinkToggle");
					$toggle.on("click.specialLinkToggle", onToggle);
					$toggle.on("keydown.specialLinkToggle", onToggleKeydown);

					updateToggleButton($toggle);
				}
			});
		};

		void run();

		return () => {
			cancelled = true;

			try {
				const $ = getJQueryLike();
				const toggleEl = toggleRef.current ?? document.getElementById("Event_toggle");
				const $toggle = $ && toggleEl ? $(toggleEl) : null;

				if ($toggle && $toggle.length) {
					$toggle.off("click.specialLinkToggle");
					$toggle.off("keydown.specialLinkToggle");
				}
			} catch {
				// ignore
			}

			try {
				const $ = getJQueryLike();
				if ($?.fn?.owlCarousel) {
					destroyOwlSafe($);
				}
			} catch {
				// ignore
			}
		};
	}, [depsKey]);

	return (
		<section className="Event_section owl-box">
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="container-customize4">
						<div className="row">
							<div className="col-12">
								<div className="content-box px-0 mb-5 border-top">
									<div id="Event_owl_carousel" className="owl-carousel owl-theme" ref={carouselRef}>
										{sortedDetails.map((p, idx) => {
											const info = useBanner.data?.BannerDetailInfo?.find(
												(x) => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang,
											);
											const alt = info?.Title ?? "";
											const url = info?.URL ?? "#";
											const urlopen = info?.URL_Open === 0 ? "_self" : "_blank";
                      						const imgUrl = FileManagementAPI.get_Public_Preview_Url(p.PicSrcId,alt)

											return (
												<div key={p.RowId ?? idx} className="item">
													<LangLink to={url} tabIndex={0} target={urlopen}>
														<div className="wrapper_box">
															<figure className="card_figure">
																<div className="card_image_link">
																	<picture>
																		<img className="card_image" src={imgUrl} alt={alt}/>
																	</picture>
																</div>
															</figure>
														</div>
													</LangLink>
												</div>
											);
										})}
									</div>

									{/* 單一顆按鈕 START */}
									<div className="DIV-singleBox">
										<div className="control-singlebox">
											<div className="control-toggle">
												<a
													id="Event_toggle"
													ref={toggleRef}
													className="carousel-toggle-btn toggle ms-1"
													type="button"
													aria-label="暫停"
													aria-pressed="true"
													tabIndex={0}
													title="暫停"
												>
													<div className="control-toggle control-pause-icon">
														<span className="sr-only">暫停</span>
													</div>
												</a>
											</div>
										</div>
									</div>
									{/* 單一顆按鈕 END */}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};