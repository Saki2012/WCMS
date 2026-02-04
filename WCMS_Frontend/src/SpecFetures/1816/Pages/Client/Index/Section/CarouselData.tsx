import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import clsx from "clsx";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import { useEffect, useMemo, useRef } from "react";

type BannerSet = components["schemas"]["BannerSet_DTO"];

export const CarouselData = (props: { lang: Lang }) => {
	// 宣告變數：讀取 BannerSlider（目前固定 id）
	const useBanner = useFetchFormData<BannerSet>(BannerSliderProvider(), "d35e52e6-aba0-411f-bff0-560181e8663b", {});

	// 宣告變數：依 Sort 排序（穩定排序）
	const sortedDetails = useMemo(() => {
		const list = useBanner.data?.BannerDetail ?? [];
		return [...list].sort((a, b) => {
			const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
			const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
			return as - bs || (a.RowId ?? 0) - (b.RowId ?? 0);
		});
	}, [useBanner.data?.BannerDetail]);

	const carouselRef = useRef<HTMLDivElement | null>(null);

	// 宣告變數：停留/速度（ms），無設定則 fallback
	const bannerSetting = useMemo(() => {
		// 宣告變數：data 可能是 null / undefined
		const data = useBanner?.data ?? null;
		const banner = data?.Banner ?? null;
		// 宣告變數：interval/speed 允許 number 或字串
		const intervalRaw = banner?.Interval;
		const speedRaw = banner?.Speed;
		const interval = typeof intervalRaw === "number" ? intervalRaw : Number(intervalRaw);
		const speed = typeof speedRaw === "number" ? speedRaw : Number(speedRaw);
		// return：帶預設值
		return {
			interval: Number.isFinite(interval) && interval > 0 ? interval * 1000 : 5000,
			speed: Number.isFinite(speed) && speed >= 0 ? speed : 500,
		};
	}, [
		useBanner?.data?.Banner?.Interval,
		useBanner?.data?.Banner?.Speed,
	]);
	type BootstrapCarouselInstance = {
		cycle: () => void;
		pause: () => void;
		dispose: () => void;
	};

	type BootstrapCarouselStatic = {
		getInstance: (el: Element) => BootstrapCarouselInstance | null;
		new(el: Element, opts: { interval: number; ride?: "carousel" | boolean; pause?: boolean | "hover" }): BootstrapCarouselInstance;
	};

	type BootstrapStatic = {
		Carousel?: BootstrapCarouselStatic;
	};

	const getBootstrap = (): BootstrapStatic | null => {
		if (typeof window === "undefined") return null;
		const w = window as unknown as { bootstrap?: BootstrapStatic };
		return w.bootstrap ?? null;
	};

	// 執行 function：初始化輪播（資料到齊後再 init，避免空資料先 init）
	useEffect(() => {
		const el = carouselRef.current;
		if (!el) return;
		if (sortedDetails.length <= 1) return; // 0/1 張不用輪播

		const bs = getBootstrap();
		const Carousel = bs?.Carousel;
		if (!Carousel) return;

		// 1) 重建 instance（避免 interval 改了但 instance 沒更新）
		const prev = Carousel.getInstance(el);
		if (prev) prev.dispose();

		const inst = new Carousel(el, {
			interval: bannerSetting.interval,
			ride: "carousel",
			pause: false, // 你有自訂 pause button，所以這裡不靠 hover pause
		});

		// 2) 接暫停/播放按鈕（對標你 prototype 的 toggle）
		const toggle = document.getElementById("toggleCarousel");
		if (!toggle) return;

		let isPaused = false;

		const setToggleUi = (paused: boolean) => {
			// aria-pressed：true = paused（你 prototype 目前是 true）
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

		// 初始狀態：自動播放
		setToggleUi(false);

		const onToggleClick = (e: Event) => {
			e.preventDefault();
			isPaused = !isPaused;
			if (isPaused) inst.pause();
			else inst.cycle();
			setToggleUi(isPaused);
		};

		toggle.addEventListener("click", onToggleClick);

		return () => {
			toggle.removeEventListener("click", onToggleClick);
			inst.dispose();
		};
	}, [bannerSetting.interval, bannerSetting.speed, sortedDetails.length]);


	// return：注意！外層 section 由 BannerNews 包，這裡只輸出內容
	return (
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
								const info = useBanner.data?.BannerDetailInfo?.find(
									(x) => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang
								);
								const alt = info?.Title ?? "";
								const url = info?.URL;
								const tar = info?.URL_Open === 0 ? "_self" : "_blank";

								return (
									<div key={`${p.BannerId}-${p.RowId}-${i}`} className={clsx("carousel-item", i === 0 ? "active" : "")}>
										{url ? (
											<LangNavLink
												to={url}
												target={tar}
												rel={tar === "_blank" ? "noopener noreferrer" : undefined}
												aria-label={alt || "banner link"}
											>
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
							<a tabIndex={0} title="上一張">
								<button aria-current="true" aria-label="Slide 1" className="active" data-bs-slide-to="0" data-bs-target="#B5_default_carousel" type="button" />
							</a>
							<a tabIndex={0} title="上一張">
								<button aria-label="Slide 2" className="" data-bs-slide-to="1" data-bs-target="#B5_default_carousel" type="button" />
							</a>
							<a tabIndex={0} title="上一張">
								<button aria-label="Slide 3" className="" data-bs-slide-to="2" data-bs-target="#B5_default_carousel" type="button" />
							</a>
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
							<a data-bs-slide="next" data-bs-target="#B5_default_carousel" role="button" tabIndex={0} title="上一張" type="buttson">
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
	);
};
