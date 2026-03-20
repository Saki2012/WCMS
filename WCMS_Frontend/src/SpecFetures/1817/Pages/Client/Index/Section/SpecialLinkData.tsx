import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/BannerSlider_Api";
import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { useEffect, useMemo } from "react";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { Lang } from "@/SysCore/i18n/lang";
import bgImg from "@/SpecFetures/1817/Assets/Client/images/bg/underline_04_W_1920x292.svg"
import { Link } from "react-router-dom";
import { LangLink } from "@/SysCore/i18n/LangLink";
type BannerSet = components["schemas"]["BannerSet_DTO"]

export const SpecialLinkData = (props: { lang: Lang }) => {
	const useBanner = useFetchFormData<BannerSet>(BannerSliderProvider(), "9a09525e-e4e8-4d5a-9a33-c42e8430508b", {})
	const sortedDetails = useMemo(() => {
		const list = useBanner.data?.BannerDetail ?? [];
		return [...list].sort((a, b) => {
			const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
			const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
			return as - bs || (a.RowId ?? 0) - (b.RowId ?? 0);
		});
	}, [useBanner.data?.BannerDetail]);

	const owlKey = useMemo(() => { const ids = sortedDetails.map(x => String(x.RowId ?? x.PicSrcId ?? "")).join("|"); return `${props.lang}|${ids}`; }, [sortedDetails, props.lang]);
	useEffect(() => {
		// SSR 防護：server 端不要執行
		if (typeof window === "undefined") return;
		if (sortedDetails.length === 0) return;
		const w = window as any;
		const $ = (w.$ || w.jQuery) as any;
		if (!$ || !$.fn || !$.fn.owlCarousel) {
			// jQuery 或 owlCarousel 還沒載入就直接跳過
			return;
		}

		const $owl = $("#Zone_owl_carousel");
		const $toggle = $("#Zone_toggle");

		if ($owl.length === 0 || $toggle.length === 0) {
			return;
		}

		let isPlaying = true; // 🔧 跟原本 script 一樣

		// 初始化 owlCarousel（照你給的設定）
		($owl as any).owlCarousel({
			items: 5,
			loop: false, // true or false
			dots: false,
			nav: true,
			margin: 30,
			autoplay: false, // true or false
			autoplayTimeout: 5000,
			autoplayHoverPause: true,
			responsive: {
				0: { items: 2 },
				575: { items: 2 },
				767: { items: 3 },
				991: { items: 4 },
				1199: { items: 5 },
			},
		});

		const updateToggleButton = () => {
			const $iconBox = $toggle.find(".control-toggle");
			const $srText = $toggle.find(".sr-only");

			// 先清空可能存在的 class
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

		const handleToggleClick = (e: any) => {
			e.preventDefault();

			if (isPlaying) {
				$owl.trigger("stop.owl.autoplay");
				isPlaying = false;
			} else {
				$owl.trigger("play.owl.autoplay", [5000]);
				isPlaying = true;
			}
			updateToggleButton();
		};

		// 綁定 click 事件 & 初始化狀態
		$toggle.on("click", handleToggleClick);
		updateToggleButton();

		// 清理：解除事件 & 摧毀 owl，避免重複綁定
		return () => {
			$toggle.off("click", handleToggleClick);
			try {
				$owl.trigger("destroy.owl.carousel");
			} catch {
				// ignore
			}
		};
	}, [owlKey]);

	return (
		<section className="Zone_section + owl-box + Layout_Padding_1_top + Layout_Padding_5_bottom + bg-custom-Customize_color" style={{ backgroundImage: `url(${bgImg})`, }}>
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="circle-1 iMG-Shape-3" />
					<div className="container-customize3">
						<div className="row">
							<div className="col-12" />
							<div className="col-12">
								<div className="content-box px-0">
									<div className="DIV-singleBox">
										<div className="control-singlebox">
											<a aria-label="圖片輪播播放中，點擊暫停" aria-pressed="true" className="toggle ms-1" href="javascript:void(0);" id="Zone_toggle" tabIndex={0} title="暫停">
												<div className="control-toggle control-pause-icon">
													<span className="sr-only">圖片輪播播放中，點擊暫停</span>
												</div>
											</a>
										</div>
									</div>
									<div className="owl-carousel owl-theme" id="Zone_owl_carousel" key={owlKey}>
										{sortedDetails.map((p, i) => {
											const info = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang)
											const alt = info?.Title ?? ""
											const url = info?.URL ?? ""
											const urlopen = info?.URL_Open === 0 ? "_self" : "_blank"
											const imgUrl = FileManagementAPI.get_Public_Preview_Url(p.PicSrcId);
											return (
												<div className="item" key={i}>
													<LangLink aria-label={alt} to={url} role="button" tabIndex={0} target={urlopen} title={alt} type="button" >
														<article className="cardbox">
															<div className="card_content">
																<figure className="figure_Box">
																	<div className="card_figure">
																		<div className="img-wrapper">
																			<img className="card_image" alt={alt} src={imgUrl} />
																		</div>
																	</div>
																	<div className="Arrow_ZZ_area">
																		<span className="Zonelink-arrow">
																			<i className="fas fa-long-arrow-alt-right" />
																			<span className="sr-only">前往</span>
																		</span>
																	</div>
																</figure>
																<div className="Text_Block_Area">
																	<div className="card_titleDiv">
																		<div className="card_title">{alt}</div>
																	</div>
																</div>
															</div>
														</article>
													</LangLink>
												</div>
											)
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
