
import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { useBannerListData } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Hook";
import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { useEffect, useMemo, useRef } from "react";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { Link } from "react-router-dom";

declare global { interface Window { Swiper?: any } }
type BannerSet = components["schemas"]["BannerSet_DTO"]


export const LinkData = () => {
	const useBanner = useFetchFormData<BannerSet>(BannerSliderProvider(), "aaf84f7c-3521-4288-9c2e-c75b43f14c56", {})
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
	const swiperRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (typeof window === "undefined" || !swiperRef.current) return;
		let instance: any;
		(async () => {
			const SwiperCtor = await ensureSwiper();
			if (!SwiperCtor) return;
			const root = swiperRef.current!;
			instance = new SwiperCtor(root, {
				direction: "horizontal",
				slidesPerView: 6,
				spaceBetween: 0,
				breakpoints: {
					768: { slidesPerView: 6 },
					576: { slidesPerView: 5 },
					480: { slidesPerView: 4 },
					0: { slidesPerView: 3 },
				},
				navigation: {
					nextEl: root.querySelector(".swiper-next")!,
					prevEl: root.querySelector(".swiper-prev")!,
				},
				pagination: {
					el: root.querySelector(".swiper-pagination")!,
					clickable: false,
				},
				// 想要可拖曳請用這兩個（沒有 draggable 參數）
				simulateTouch: true,
				grabCursor: true,
			});
		})();
		return () => { try { instance?.destroy(true, true); } catch { } };
	}, []);
	return (
		<section className="Link-icons_section Layout_Padding_4_bottom" style={{ backgroundImage: "url(/images/bg/background-transparent-image_1920x600.png)", }}>
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="container-customize2">
						<div className="Link-icons-pos">
							<div className="content-box px-0" >
								<div className="swiper" id="icon_area" ref={swiperRef}>
									<div className="swiper-wrapper">
										{sortedDetails.map((p, i) => {
											const info = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw");
											const alt = info?.Title ?? ""
											const url = info?.URL ?? ""
											const tar = info?.URL_Open === 0 ? "_self" : "_blank"
											return (
												<div key={i} className="swiper-slide">
													<div className="item">
														<Link to={url} tabIndex={0} target={tar} title={alt}>
															<div className="icon-wrapper">
																<div className="icon-area">
																	<div className="icon-type-image">
																		<img alt={alt} src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`} />
																	</div>
																</div>
																<div className="tit-contents">
																	<div className="Link-icons-title">{alt}</div>
																</div>
															</div>
														</Link>
													</div>
												</div>
											)
										})}
									</div>
									<div className="swiper-nav mt-1">
										<button className="swiper-prev" role="presentation" tabIndex={0} type="button">
											<span aria-label="Previous" title="上一張">
												<span className="d-none">上一張</span>
											</span>
										</button>
										<button className="swiper-next" role="presentation" tabIndex={0} type="button">
											<span aria-label="Next" title="下一張">
												<span className="d-none">下一張</span>
											</span>
										</button>
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

const ensureSwiper = (() => {
	let promise: Promise<any> | null = null;
	return () => {
		if (typeof window === "undefined") return Promise.resolve(null);
		if ((window as any).Swiper) return Promise.resolve((window as any).Swiper);
		if (!promise) {
			promise = (async () => {
				// 這兩行用 ?url 從 src 取回「實際打包後的 URL」
				const [{ default: jsUrl }, { default: cssUrl }] = await Promise.all([
					import("@/SpecFetures/1816/Assets/Client/Content/css_import/assets/swiper-11.1.14/swiper-bundle.min.js?url"),
					import("@/SpecFetures/1816/Assets/Client/Content/css_import/assets/swiper-11.1.14/swiper-bundle.min.css?url"),
				]);
				// 動態插入 CSS（若尚未插入）
				if (!document.querySelector(`link[href="${cssUrl}"]`)) {
					const link = document.createElement("link");
					link.rel = "stylesheet";
					link.href = cssUrl;
					document.head.appendChild(link);
				}
				// 動態插入 JS（載完後 window.Swiper 才會存在）
				await new Promise<void>((resolve, reject) => {
					const s = document.createElement("script");
					s.src = jsUrl;
					s.async = true;
					s.onload = () => resolve();
					s.onerror = () => reject(new Error("Load Swiper failed"));
					document.head.appendChild(s);
				});
				return (window as any).Swiper;
			})();
		}
		return promise;
	};
})();