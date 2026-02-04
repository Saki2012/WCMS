import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";

type BannerSet = components["schemas"]["BannerSet_DTO"];

type SwiperOptions = {
	direction?: "horizontal" | "vertical";
	slidesPerView?: number;
	spaceBetween?: number;
	breakpoints?: Record<number, { slidesPerView: number }>;
	navigation?: { nextEl: string | Element; prevEl: string | Element };
	pagination?: { el: string | Element; clickable?: boolean };
	simulateTouch?: boolean;
	grabCursor?: boolean;
};

type SwiperInstance = {
	destroy: (deleteInstance?: boolean, cleanStyles?: boolean) => void;
	update?: () => void;
};

type SwiperConstructor = new (el: Element, options: SwiperOptions) => SwiperInstance;

declare global {
	interface Window {
		Swiper?: SwiperConstructor;
	}
}

export const LinkData = (props: { lang: Lang }) => {
	// 宣告變數：資料來源（沿用既有 BannerSlider）
	const useBanner = useFetchFormData<BannerSet>(
		BannerSliderProvider(),
		"aaf84f7c-3521-4288-9c2e-c75b43f14c56",
		{},
	);

	// 宣告變數：依 Sort 排序（穩定排序）
	const sortedDetails = useMemo(() => {
		const list = useBanner.data?.BannerDetail ?? [];
		return [...list].sort((a, b) => {
			const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
			const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
			return as - bs || (a.RowId ?? 0) - (b.RowId ?? 0);
		});
	}, [useBanner.data?.BannerDetail]);

	// 宣告變數：Swiper root + instance
	const swiperRootRef = useRef<HTMLDivElement | null>(null);
	const swiperInstanceRef = useRef<SwiperInstance | null>(null);

	// 執行 function：點擊行為（對標 prototype 的 js_method placeholder）
	const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
		if (!url) {
			e.preventDefault();
			e.stopPropagation();
		}
	}, []);

	// 執行 function：初始化 / 重建 Swiper（等資料出現才做）
	useEffect(() => {
		// SSR guard
		if (typeof window === "undefined") return;
		if (!swiperRootRef.current) return;

		// ✅ 沒資料就不要 init（避免空初始化）
		if (sortedDetails.length === 0) return;

		let cancelled = false;

		(async () => {
			const SwiperCtor = await ensureSwiper();
			if (!SwiperCtor) return;
			if (cancelled) return;

			const root = swiperRootRef.current;
			if (!root) return;

			const nextBtn = root.querySelector(".swiper-next");
			const prevBtn = root.querySelector(".swiper-prev");
			const paginationEl = root.querySelector(".swiper-pagination");
			const wrapperEl = root.querySelector(".swiper-wrapper");

			// ✅ 結構不完整就不 init（避免 Swiper 亂塞東西）
			if (!nextBtn || !prevBtn || !paginationEl || !wrapperEl) return;

			// ✅ 若已初始化過（資料更新），先 destroy 再重建
			try {
				swiperInstanceRef.current?.destroy(true, true);
			} catch {
				// ignore
			}
			swiperInstanceRef.current = null;

			// ✅ 等 React 把 slide 都掛上去再 init（更穩）
			requestAnimationFrame(() => {
				if (cancelled) return;
				if (!swiperRootRef.current) return;

				swiperInstanceRef.current = new SwiperCtor(root, {
					direction: "horizontal",
					slidesPerView: 1,
					spaceBetween: 0,
					breakpoints: {
						1200: { slidesPerView: 6 },
						992: { slidesPerView: 5 },
						768: { slidesPerView: 4 },
						680: { slidesPerView: 3 },
						480: { slidesPerView: 2 },
					},
					navigation: {
						nextEl: nextBtn,
						prevEl: prevBtn,
					},
					pagination: {
						el: paginationEl,
						clickable: false,
					},
					simulateTouch: true,
					grabCursor: true,
				});

				// 若 Swiper 有 update 就順便呼叫一次（兼容某些版本）
				try {
					swiperInstanceRef.current?.update?.();
				} catch {
					// ignore
				}
			});
		})();

		return () => {
			cancelled = true;
		};
	}, [sortedDetails.length]);

	return (
		<section className="Link-icons_section" style={{}}>
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="container-customize4 px-0">
						<div className="Link-icons-pos">
							<div className="content-box px-0">
								<div id="icon_area" className="swiper" ref={swiperRootRef}>
									<div className="swiper-wrapper">
										{sortedDetails.map((p, i) => {
											const info = useBanner.data?.BannerDetailInfo?.find(
												(x) => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang,
											);

											const title = info?.Title ?? "";
											const url = info?.URL ?? "";
											const target = info?.URL_Open === 0 ? "_self" : "_blank";

											// 對標 prototype：img-1 ~ img-6（超過 6 迴圈）
											const iconIdx = ((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
											const iconClass = `icon-type-image img-${iconIdx}`;

											const imgSrc = p.PicSrcId ? `${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}` : "";

											return (
												<div key={p.RowId ?? i} className="swiper-slide">
													<div className="item">
														<a
															href={url || "#"}
															onClick={(e) => handleClick(e, url)}
															title={title}
															target={target}
															rel={target === "_blank" ? "noreferrer" : undefined}
															tabIndex={0}
														>
															<div className="icon-wrapper">
																<div className="icon-area">
																	<div className={iconClass}>
																		{imgSrc ? <img src={imgSrc} alt={title} /> : null}
																	</div>
																</div>
																<div className="tit-contents">
																	<div className="Link-icons-title">{title}</div>
																</div>
															</div>
														</a>
													</div>
												</div>
											);
										})}
									</div>

									{/* ✅ pagination element（避免 Swiper 把 bullet 亂塞到 root 直接吃掉結構） */}
									<div className="swiper-pagination" />

									{/* 控制 左 / 右 按鈕 START（對標 prototype） */}
									<div className="swiper-nav mt-1">
										<button type="button" role="presentation" className="swiper-prev" tabIndex={0}>
											<span aria-label="Previous" title="上一張">
												<span className="d-none">上一張</span>
											</span>
										</button>
										<button type="button" role="presentation" className="swiper-next" tabIndex={0}>
											<span aria-label="Next" title="下一張">
												<span className="d-none">下一張</span>
											</span>
										</button>
									</div>
									{/* 控制 左 / 右 按鈕 END */}
								</div>
							</div>
						</div>
						{/* //Link-icons-pos */}
					</div>
				</div>
				{/* //customizeBox */}
			</div>
			{/* //Mask-DivBox */}
		</section>
	);
};

const ensureSwiper = (() => {
	let promise: Promise<SwiperConstructor | null> | null = null;

	return () => {
		// SSR guard
		if (typeof window === "undefined") return Promise.resolve(null);

		if (window.Swiper) return Promise.resolve(window.Swiper);

		if (!promise) {
			promise = (async () => {
				const [{ default: jsUrl }, { default: cssUrl }] = await Promise.all([
					import("@/SpecFetures/1816/Assets/Client/Content/css_import/assets/swiper-11.1.14/swiper-bundle.min.js?url"),
					import("@/SpecFetures/1816/Assets/Client/Content/css_import/assets/swiper-11.1.14/swiper-bundle.min.css?url"),
				]);

				// 插入 CSS
				if (!document.querySelector(`link[href="${cssUrl}"]`)) {
					const link = document.createElement("link");
					link.rel = "stylesheet";
					link.href = cssUrl;
					document.head.appendChild(link);
				}

				// 插入 JS
				await new Promise<void>((resolve, reject) => {
					const s = document.createElement("script");
					s.src = jsUrl;
					s.async = true;
					s.onload = () => resolve();
					s.onerror = () => reject(new Error("Load Swiper failed"));
					document.head.appendChild(s);
				});

				return window.Swiper ?? null;
			})();
		}

		return promise;
	};
})();
