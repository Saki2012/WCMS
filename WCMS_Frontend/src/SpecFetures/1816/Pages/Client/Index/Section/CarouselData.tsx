import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import type { components } from "@/types/api";
import clsx from "clsx";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import { useEffect, useMemo, useRef } from "react";

type BannerSet = components["schemas"]["BannerSet_DTO"];

type BootstrapCarouselInstance = {
	cycle: () => void;
	pause: () => void;
	dispose: () => void;
};

type BootstrapCarouselStatic = {
	getInstance: (el: Element) => BootstrapCarouselInstance | null;
	new (el: Element, opts: { interval: number; ride?: "carousel" | boolean; pause?: boolean | "hover" }): BootstrapCarouselInstance;
};

type BootstrapStatic = {
	Carousel?: BootstrapCarouselStatic;
};

type WindowWithBootstrap = Window & { bootstrap?: BootstrapStatic };

const toOkEnv = <T,>(data: T): ApiResponse<T> => {
	// return：統一成功 env
	return { IsSuccess: true, SysMessage: [], Data: data };
};

const toInitial = <TArgs, TData>(args: TArgs, data: TData): ApiLoaderData<TArgs, TData> => {
	// return：對標 1818（ApiLoaderData 使用 apiRes）
	return { args, apiRes: toOkEnv(data) };
};

const getBootstrap = (): BootstrapStatic | null => {
	// SSR guard
	if (typeof window === "undefined") return null;
	const w = window as WindowWithBootstrap;
	// return
	return w.bootstrap ?? null;
};

const buildBannerSetting = (banner: BannerSet | null) => {
	// 宣告變數：interval/speed 允許 number 或字串
	const intervalRaw = banner?.Banner?.Interval;
	const speedRaw = banner?.Banner?.Speed;
	const interval = typeof intervalRaw === "number" ? intervalRaw : Number(intervalRaw);
	const speed = typeof speedRaw === "number" ? speedRaw : Number(speedRaw);

	// return：interval 後端是秒 → 轉 ms
	return {
		interval: Number.isFinite(interval) && interval > 0 ? interval * 1000 : 5000,
		speed: Number.isFinite(speed) && speed >= 0 ? speed : 500,
	};
};

export const CarouselData = (props: { lang: Lang; internalId: string; initialBanner: BannerSet | null }) => {
	// 宣告變數：adapter
	const adapter = useMemo(() => BannerSliderAdapter(), []);

	// 宣告變數：SSR initial（單筆 QueryData）
	const initial = useMemo(() => {
		if (!props.initialBanner) return null;
		return toInitial(props.internalId, props.initialBanner);
	}, [props.internalId, props.initialBanner]);

	// 執行 function：QueryData（SSR 有 initial → hydration 不重抓）
	const q = adapter.hooks.useQueryData({
		internalId: props.internalId,
		initial,
		deps: [props.internalId],
	});

	// 宣告變數：統一資料來源
	const banner = q.data ?? null;

	// 宣告變數：依 Sort 排序（穩定排序）
	const sortedDetails = useMemo(() => {
		const list = banner?.BannerDetail ?? [];
		return [...list].sort((a, b) => {
			const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
			const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
			return as - bs || (a.RowId ?? 0) - (b.RowId ?? 0);
		});
	}, [banner?.BannerDetail]);

	// 宣告變數：停留/速度（ms）
	const bannerSetting = useMemo(() => {
		return buildBannerSetting(banner);
	}, [banner?.Banner?.Interval, banner?.Banner?.Speed]);

	// 宣告變數：indicator 最多 3 顆（對標原本 DOM）
	const indicatorCount = useMemo(() => {
		return Math.min(3, sortedDetails.length);
	}, [sortedDetails.length]);

	const carouselRef = useRef<HTMLDivElement | null>(null);

	// 執行 function：初始化輪播（資料到齊後再 init）
	useEffect(() => {
		// 宣告變數
		const el = carouselRef.current;
		if (!el) return;
		if (sortedDetails.length <= 1) return; // 0/1 張不用輪播

		const bs = getBootstrap();
		const Carousel = bs?.Carousel;
		if (!Carousel) return;

		// 執行：重建 instance（避免 interval 改了但 instance 沒更新）
		const prev = Carousel.getInstance(el);
		if (prev) prev.dispose();

		const inst = new Carousel(el, {
			interval: bannerSetting.interval,
			ride: "carousel",
			pause: false, // 有自訂 pause button，不靠 hover pause
		});

		// 執行：接暫停/播放按鈕（對標 prototype toggle）
		const toggle = document.getElementById("toggleCarousel");
		if (!toggle) return;

		let isPaused = false;

		const setToggleUi = (paused: boolean) => {
			toggle.setAttribute("aria-pressed", paused ? "true" : "false");
			toggle.setAttribute("title", paused ? "播放" : "暫停");

			const sr = toggle.querySelector(".sr-only");
			if (sr) sr.textContent = paused ? "播放" : "暫停";

			const icon = toggle.querySelector(".control-icon");
			if (icon) {
				icon.classList.toggle("pause", !paused);
				icon.classList.toggle("play", paused);
			}
		};

		setToggleUi(false);

		const onToggleClick = (e: Event) => {
			e.preventDefault();
			isPaused = !isPaused;
			if (isPaused) inst.pause();
			else inst.cycle();
			setToggleUi(isPaused);
		};

		toggle.addEventListener("click", onToggleClick);

		// cleanup
		return () => {
			toggle.removeEventListener("click", onToggleClick);
			inst.dispose();
		};
	}, [bannerSetting.interval, bannerSetting.speed, sortedDetails.length]);

	// return：注意！外層 section 由 BannerNews 包，這裡只輸出內容
	return (
		<div className="col-xxl-6 col-xl-c1 col-12 Carousel_slide_section Layout_Padding_4_top Layout_Padding_5_bottom">
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="circle-1" />
					<div className="container-customize4 px-0">
						<div
							ref={carouselRef}
							className="carousel slide"
							id="B5_default_carousel"
							data-bs-ride="carousel"
							data-bs-interval={bannerSetting.interval}
							style={{ ["--bs-carousel-transition-duration" as never]: `${bannerSetting.speed}ms` }}
						>
							<div className="control-singlebox">
								<div className="control-toggle">
									<a
										aria-label="暫停"
										aria-pressed="true"
										className="carousel-toggle-btn"
										id="toggleCarousel"
										role="button"
										tabIndex={0}
										title="暫停"
										type="button"
									>
										<span className="control-icon pause" />
										<span className="sr-only">暫停</span>
									</a>
								</div>
							</div>

							<div className="carousel-inner">
								{sortedDetails.map((p, i) => {
									const info = banner?.BannerDetailInfo?.find(
										(x) => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang,
									);

									const alt = info?.Title ?? "";
									const url = info?.URL;
									const tar = info?.URL_Open === 0 ? "_self" : "_blank";

									return (
										<div key={`${p.BannerId}-${p.RowId}-${i}`} className={clsx("carousel-item", i === 0 ? "active" : "")}>
											{url ? (
												<LangNavLink to={url} target={tar} rel={tar === "_blank" ? "noopener noreferrer" : undefined} aria-label={alt || "banner link"}>
													<img src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`} className="d-block w-100" alt={alt} />
												</LangNavLink>
											) : (
												<img src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`} className="d-block w-100" alt={alt} />
											)}
										</div>
									);
								})}
							</div>

							<div className="carousel-indicators">
								{Array.from({ length: indicatorCount }).map((_, i) => {
									const isActive = i === 0;
									return (
										<a key={i} tabIndex={0} title="上一張">
											<button
												aria-current={isActive ? "true" : undefined}
												aria-label={`Slide ${i + 1}`}
												className={clsx(isActive ? "active" : "")}
												data-bs-slide-to={i}
												data-bs-target="#B5_default_carousel"
												type="button"
											/>
										</a>
									);
								})}
							</div>

							<div className="carousel_btn-icon-prev">
								<a data-bs-slide="prev" data-bs-target="#B5_default_carousel" role="button" tabIndex={0} title="上一張" type="button">
									<div className="carousel-control-prev">
										<span aria-hidden="true" className="carousel-control-prev-icon" />
										<span className="sr-only">Previous</span>
									</div>
								</a>
							</div>

							<div className="carousel_btn-icon-next">
								<a data-bs-slide="next" data-bs-target="#B5_default_carousel" role="button" tabIndex={0} title="上一張" type="button">
									<div className="carousel-control-next">
										<span aria-hidden="true" className="carousel-control-next-icon" />
										<span className="sr-only">Next</span>
									</div>
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};