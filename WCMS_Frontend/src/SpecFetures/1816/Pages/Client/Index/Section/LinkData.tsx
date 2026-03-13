import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WebManagement/BannerSlider_Api";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
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

export interface LinkDataProps {
	lang: Lang;
	/** BannerSlider QueryData 的 internalId */
	internalId: string;
	/** SSR loader 已抓到的 BannerSet（可為 null） */
	initialBanner: BannerSet | null;
}

export const LinkData = (props: LinkDataProps) => {
	// 宣告變數：adapter（固定一次）
	const adapter = useMemo(() => BannerSliderAdapter(), []);

	// 宣告變數：把 loader 的單筆資料包成 hook 的 initial（QueryData）
	const initial = useMemo(() => {
		return buildQueryDataInitial(props.internalId, props.initialBanner);
	}, [props.internalId, props.initialBanner]);

	// 執行 function：CSR 用 adapter hook 接手（SSR 有 initial → 不重抓）
	const useBanner = adapter.hooks.useQueryData({
		internalId: props.internalId,
		initial,
		deps: [props.internalId, props.lang],
	});

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

		// 宣告變數
		const root = swiperRootRef.current;
		if (!root) return;

		// ✅ 沒資料就 destroy（避免殘留）
		if (sortedDetails.length === 0) {
			destroySwiperSafe(swiperInstanceRef);
			return;
		}

		let cancelled = false;

		const run = async () => {
			const SwiperCtor = await ensureSwiper();
			if (!SwiperCtor || cancelled) return;

			const els = getSwiperElements(root);
			if (!els) return;

			// ✅ 若已初始化過（資料更新），先 destroy 再重建
			destroySwiperSafe(swiperInstanceRef);

			// ✅ 等 React 把 slide 都掛上去再 init（更穩）
			requestAnimationFrame(() => {
				if (cancelled) return;
				if (!swiperRootRef.current) return;

				swiperInstanceRef.current = new SwiperCtor(root, buildSwiperOptions(els));

				// 若 Swiper 有 update 就順便呼叫一次（兼容某些版本）
				try {
					swiperInstanceRef.current?.update?.();
				} catch {
					// ignore
				}
			});
		};

		void run();

		// cleanup
		return () => {
			cancelled = true;
			destroySwiperSafe(swiperInstanceRef);
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
														<LangLink to={url || "#"} onClick={(e) => handleClick(e, url)} title={title}
															target={target} rel={target === "_blank" ? "noreferrer" : undefined} tabIndex={0}>
															<div className="icon-wrapper">
																<div className="icon-area">
																	<div className={iconClass}>
																		{imgSrc ? <img src={imgSrc} aria-hidden="true"/> : null}
																	</div>
																</div>
																<div className="tit-contents">
																	<div className="Link-icons-title">{title}</div>
																</div>
															</div>
														</LangLink>
													</div>
												</div>
											);
										})}
									</div>

									{/* ✅ pagination element（避免 Swiper 把 bullet 亂塞到 root 直接吃掉結構） */}
									<div className="swiper-pagination" />

									{/* 控制 左 / 右 按鈕 START（對標 prototype） */}
									<div className="swiper-nav mt-1">
										<button type="button" className="swiper-prev" tabIndex={0}>
											<span aria-label="Previous" title="上一張">
												<span className="d-none">上一張</span>
											</span>
										</button>
										<button type="button" className="swiper-next" tabIndex={0}>
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

// --------------------
// helpers（避免 effect 過長）
// --------------------
const buildQueryDataInitial = (internalId: string, banner: BannerSet | null): ApiLoaderData<string, BannerSet> | null => {
	// 宣告變數：沒有 initial 就回 null
	if (!banner) return null;

	// 宣告變數：組出 env（QueryData 單筆）
	const apiRes: ApiResponse<BannerSet> = { IsSuccess: true, Data: banner, SysMessage: [] };

	// return
	return { args: internalId, apiRes };
};

const destroySwiperSafe = (ref: React.MutableRefObject<SwiperInstance | null>) => {
	// 宣告變數
	const ins = ref.current;
	if (!ins) return;

	// 執行 function：安全 destroy
	try {
		ins.destroy(true, true);
	} catch {
		// ignore
	}

	// 執行 function：清空 ref
	ref.current = null;
};

const getSwiperElements = (root: Element) => {
	// 宣告變數
	const nextBtn = root.querySelector(".swiper-next");
	const prevBtn = root.querySelector(".swiper-prev");
	const paginationEl = root.querySelector(".swiper-pagination");
	const wrapperEl = root.querySelector(".swiper-wrapper");

	// return：結構不完整就不 init（避免 Swiper 亂塞）
	if (!nextBtn || !prevBtn || !paginationEl || !wrapperEl) return null;
	return { nextBtn, prevBtn, paginationEl };
};

const buildSwiperOptions = (els: { nextBtn: Element; prevBtn: Element; paginationEl: Element }): SwiperOptions => {
	// return
	return {
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
			nextEl: els.nextBtn,
			prevEl: els.prevBtn,
		},
		pagination: {
			el: els.paginationEl,
			clickable: false,
		},
		simulateTouch: true,
		grabCursor: true,
	};
};

// --------------------
// Swiper loader（沿用原本邏輯）
// --------------------
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