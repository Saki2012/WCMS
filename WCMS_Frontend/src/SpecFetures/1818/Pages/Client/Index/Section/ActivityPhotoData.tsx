
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibMerge } from '@/SysCore/Utils/Library/LibMergeData';
import { useNow } from '@/SysCore/Utils/Library/LibHook';
import { type Lang } from '@/SysCore/i18n/lang';
import { useEffect } from 'react';
import { LangLink, LangNavLink } from '@/SysCore/i18n/LangLink';
import { IndexLabel } from "@/SpecFetures/1818/Pages/Client//Index/Section/IndexLabelText";

type GallerySet = components["schemas"]["GallerySet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]

const useTopGalleryList = (categories?: string) => {
	const provider = GalleryProvider();
	let cdt = `${SchemaFields.GalleryFields.ContentStatus} & 1`;
	//因時程關係，暫時用前端來判斷有效日期時間，多少會有客戶端修改時間的風險。之後再改到後端開新的api寫死抓系統時間為依據。
	const now = useNow({ startPaused: true });
	if (now.isoLocal) cdt = LibMerge(" And ", false, cdt, `${SchemaFields.GalleryFields.Validate_Start} <= ${now.isoLocal}`);
	cdt = LibMerge(" And ", false, cdt, categories ? `${SchemaFields.GalleryFields.Categories} HasAny [${categories}]` : "");
	return useFetchGridListData<GallerySet>({
		getModelDisplayName: () => provider.getModelDisplayName(),
		fetchList: (cond) => provider.fetchList(cond),
		fetchListCount: (cond) => provider.fetchListCount(cond),
		visibleKeys: [],
		buildQueryCondition: () => ({
			Fields: [
				SchemaFields.GalleryFields.GalleryId,
				SchemaFields.GalleryFields.InternalId,
				SchemaFields.GalleryFields.Categories,
				SchemaFields.GalleryFields.Tags,
				SchemaFields.GalleryFields.ContentStatus,
				SchemaFields.GalleryFields.Validate_Start,
				SchemaFields.GalleryFields.CoverPicSrcId,

				`${SchemaFields.GalleryFields._GalleryInfo}.${SchemaFields.GalleryInfoFields.Lang}`,
				`${SchemaFields.GalleryFields._GalleryInfo}.${SchemaFields.GalleryInfoFields.Title}`,
				`${SchemaFields.GalleryFields._GalleryInfo}.${SchemaFields.GalleryInfoFields.Content}`,
				//`${SchemaFields.GalleryFields._GalleryPhotos}.${SchemaFields.GalleryPhotosFields.RowId}`,
				//`${SchemaFields.GalleryFields._GalleryPhotos}.${SchemaFields.GalleryPhotosFields.PicSrcId}`,
				//`${SchemaFields.GalleryFields._GalleryPhotos}.${SchemaFields.GalleryPhotosFields.GalleryPhotosInfo}.${SchemaFields.GalleryPhotosInfoFields.Lang}`,
				//`${SchemaFields.GalleryFields._GalleryPhotos}.${SchemaFields.GalleryPhotosFields.GalleryPhotosInfo}.${SchemaFields.GalleryPhotosInfoFields.Title}`,
			],
			Condition: cdt,
			OrderBy: [{ Col: SchemaFields.GalleryFields.Validate_Start, Desc: true }],
			PageNumber: 1,
			PageSize: 6,
		}),
		enabled: true,
		deps: [categories],
	});
};
const useGalleryList = (categories?: string) => {
	const provider = GalleryProvider();
	let cdt = `${SchemaFields.GalleryFields.ContentStatus} !& 4 And ${SchemaFields.GalleryFields.ContentStatus} !& 1`;
	//因時程關係，暫時用前端來判斷有效日期時間，多少會有客戶端修改時間的風險。之後再改到後端開新的api寫死抓系統時間為依據。
	const now = useNow({ startPaused: true });
	if (now.isoLocal) cdt = LibMerge(" And ", false, cdt, `${SchemaFields.GalleryFields.Validate_Start} <= ${now.isoLocal}`);
	cdt = LibMerge(" And ", false, cdt, categories ? `${SchemaFields.GalleryFields.Categories} HasAny [${categories}]` : "");
	return useFetchGridListData<GallerySet>({
		getModelDisplayName: () => provider.getModelDisplayName(),
		fetchList: (cond) => provider.fetchList(cond),
		fetchListCount: (cond) => provider.fetchListCount(cond),
		visibleKeys: [],
		buildQueryCondition: () => ({
			Fields: [
				SchemaFields.GalleryFields.GalleryId,
				SchemaFields.GalleryFields.InternalId,
				SchemaFields.GalleryFields.Categories,
				SchemaFields.GalleryFields.Tags,
				SchemaFields.GalleryFields.ContentStatus,
				SchemaFields.GalleryFields.Validate_Start,
				SchemaFields.GalleryFields.CoverPicSrcId,
				`${SchemaFields.GalleryFields._GalleryInfo}.${SchemaFields.GalleryInfoFields.Lang}`,
				`${SchemaFields.GalleryFields._GalleryInfo}.${SchemaFields.GalleryInfoFields.Title}`,
				`${SchemaFields.GalleryFields._GalleryInfo}.${SchemaFields.GalleryInfoFields.Content}`,
				//`${SchemaFields.GalleryFields._GalleryPhotos}.${SchemaFields.GalleryPhotosFields.RowId}`,
				//`${SchemaFields.GalleryFields._GalleryPhotos}.${SchemaFields.GalleryPhotosFields.PicSrcId}`,
				//`${SchemaFields.GalleryFields._GalleryPhotos}.${SchemaFields.GalleryPhotosFields.GalleryPhotosInfo}.${SchemaFields.GalleryPhotosInfoFields.Lang}`,
				//`${SchemaFields.GalleryFields._GalleryPhotos}.${SchemaFields.GalleryPhotosFields.GalleryPhotosInfo}.${SchemaFields.GalleryPhotosInfoFields.Title}`,
			],
			Condition: cdt,
			OrderBy: [{ Col: SchemaFields.GalleryFields.Validate_Start, Desc: true }],
			PageNumber: 1,
			PageSize: 6,
		}),
		enabled: true,
		deps: [categories],
	});
};
const useCategoryList = () => {
	const provider = CategoryProvider();
	return useFetchGridListData<CategoryDataSet>({
		getModelDisplayName: () => provider.getModelDisplayName(),
		fetchList: (cond) => provider.fetchList(cond),
		fetchListCount: (cond) => provider.fetchListCount(cond),
		visibleKeys: [],
		buildQueryCondition: () => ({
			Fields: [
				SchemaFields.CategoryFields.CategoryId,
				`${SchemaFields.CategoryFields._CategoryDetail}.${SchemaFields.CategoryDetailFields.Lang}`,
				`${SchemaFields.CategoryFields._CategoryDetail}.${SchemaFields.CategoryDetailFields.CategoryName}`,
			],
			Condition: `${SchemaFields.CategoryFields.ProgId} = ${SchemaFields.PGID.Gallery}`,
			PageNumber: 0,
			PageSize: 0,
		}),
		enabled: true,
		deps: [],
	});
};
const useTagList = () => {
	const provider = TagProvider();
	return useFetchGridListData<TagSet>({
		getModelDisplayName: () => provider.getModelDisplayName(),
		fetchList: (cond) => provider.fetchList(cond),
		fetchListCount: (cond) => provider.fetchListCount(cond),
		visibleKeys: [],
		buildQueryCondition: () => ({
			Fields: [
				SchemaFields.TagDataFields.TagId,
				`${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.Lang}`,
				`${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.TagName}`,
			],
			Condition: `${SchemaFields.TagDataFields.ProgId} = ${PGID.Gallery}`,
			PageNumber: 0,
			PageSize: 0,
		}),
		enabled: true,
		deps: [],
	});
};
export const ActivityPhotoData = (props: { lang: Lang }) => {
	const useTopAllGalleryData1 = useTopGalleryList("Category20251113010");
	const useAllGalleryData1 = useGalleryList("Category20251113010");
	const allGalleryRawData1 = takeTopThenFill(useTopAllGalleryData1.rawData, useAllGalleryData1.rawData, 6);
	const useCategoryData = useCategoryList();
	const useTagData = useTagList();
	const categoryDict: Record<string, string> = Object.fromEntries(
		(useCategoryData.rawData ?? []).map(cat => {
			const id = cat.Category?.CategoryId;
			const name = cat.CategoryDetail?.find(p => p.Lang === props.lang)?.CategoryName ?? "";
			return [id, name];
		})
	);
	const tagDict: Record<string, string> = Object.fromEntries(
		(useTagData.rawData ?? []).map(cat => {
			const id = cat.TagData?.TagId;
			const name = cat.TagDetail?.find(p => p.Lang === props.lang)?.TagName ?? "";
			return [id, name];
		})
	);
	const allGallery1 = getGalleryDataProps(allGalleryRawData1, props.lang, "/announcement/announcement-activity", "", categoryDict, tagDict);
	useEffect(() => {
		// SSR 保護
		if (typeof window === "undefined") return;
		// 沒資料就不要初始化
		if (!allGallery1 || allGallery1.length === 0) return;
		const $: any = (window as any).$ || (window as any).jQuery;
		if (!$) return;
		const $owl = $('#Gallery_owl_carousel');
		if (!$owl.length || typeof $owl.owlCarousel !== "function") return;
		// 若已經被初始化過，先 destroy 再重建，避免重複包 wrapper
		if ($owl.hasClass('owl-loaded')) {
			try {
				$owl.trigger('destroy.owl.carousel');
				$owl.find('.owl-stage-outer').children().unwrap(); // 還原結構
				$owl.removeClass('owl-loaded owl-center owl-text-select-on');
			} catch {
				// ignore
			}
		}
		// 初始化 Owl Carousel（設定對齊原 index.html）
		$owl.owlCarousel({
			items: 4,
			// loop: true,
			dots: false,
			nav: true,
			margin: 30,
			// autoplay: true,
			autoplayTimeout: 5000,
			autoplayHoverPause: true,
			responsive: {
				0: { items: 1 },
				500: { items: 2 },
				575: { items: 2 },
				767: { items: 2 },
				991: { items: 3 },
				1199: { items: 3 },
			},
		});
		let isPlaying = false;
		const $start = $('#Gallery_start');
		const $pause = $('#Gallery_pause');
		const updateControls = () => {
			// 若按鈕被你先隱藏或乾脆沒 render，就直接跳過
			if (!$start.length || !$pause.length) return;
			if (isPlaying) {
				$start
					.attr('aria-pressed', 'true')
					.attr('aria-label', '圖片輪播播放中')
					.find('.sr-only')
					.text('圖片輪播播放中');

				$pause
					.attr('aria-pressed', 'false')
					.attr('aria-label', '暫停圖片輪播')
					.find('.sr-only')
					.text('暫停圖片輪播');
			} else {
				$start
					.attr('aria-pressed', 'false')
					.attr('aria-label', '開始播放圖片輪播')
					.find('.sr-only')
					.text('開始播放圖片輪播');

				$pause
					.attr('aria-pressed', 'true')
					.attr('aria-label', '圖片輪播已暫停')
					.find('.sr-only')
					.text('圖片輪播已暫停');
			}
		};
		const handlePauseClick = (e: any) => {
			e.preventDefault();
			$owl.trigger('stop.owl.autoplay');
			isPlaying = false;
			updateControls();
		};
		const handleStartClick = (e: any) => {
			e.preventDefault();
			$owl.trigger('play.owl.autoplay', [5000]);
			isPlaying = true;
			updateControls();
		};
		$pause.on('click', handlePauseClick);
		$start.on('click', handleStartClick);
		// 預設狀態（跟原始 script 一樣：暫停中）
		isPlaying = false;
		updateControls();
		return () => {
			$pause.off('click', handlePauseClick);
			$start.off('click', handleStartClick);
			try {
				$owl.trigger('destroy.owl.carousel');
			} catch {
				// ignore
			}
		};
	}, [allGallery1]);

	return (
		<section className="Gallery_section owl-box Layout_Padding_1_top Layout_Padding_1_bottom bg-white">
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="container-customize3">
						<div className="row">
							<div className="offset-3 col-6">
								<div className="headDiv mb-lg-5 mb-4">
									<span className="headDiv-txt-5 tw">{IndexLabel(props.lang).AlbumTitle}</span>
								</div>
							</div>
							<div className="col-12">
								<div className="content-box px-0 mb-5">
									<div className="owl-carousel owl-theme" id="Gallery_owl_carousel">
										<GetData prop={allGallery1}></GetData>
									</div>
									<div className="DIV-Box">
										<div className="control-box">
											<a aria-label="開始播放圖片輪播" aria-pressed="false" className="play me-1"
												href="javascript:void(0);" id="Gallery_start" tabIndex={0} title="播放">
												<div className="contrl_start">
													<span className="control-start-icon">
														<span className="sr-only">開始播放圖片輪播</span>
													</span>
												</div>
											</a>
											<a aria-label="暫停圖片輪播" aria-pressed="true" className="stop ms-1"
												href="javascript:void(0);" id="Gallery_pause" tabIndex={0} title="暫停">
												<div className="contrl_pause">
													<span className="control-pause-icon">
														<span className="sr-only">暫停圖片輪播</span>
													</span>
												</div>
											</a>
										</div>
									</div>
								</div>
							</div>
							<div className="offset-6 col-6 mt-customize">
								<div className="btn-w100-wrapper justify-content-end">
									<div className="customize_btn">
										<LangNavLink className="Btn_a" to="/announcement/announcement-activity/List" role="button" tabIndex={0} target="_self" title={IndexLabel(props.lang).MoreInfo} type="button">
											<div className="BtnBox">
												<span>{IndexLabel(props.lang).MoreInfo}</span>
											</div>
										</LangNavLink>
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
interface getDataProp { redir: string; galleryInternalId: string; title: string; content: string; date: string; month: string; year: string; monthNum: number; tagName: string; categoryName: string; contentStatus: number; internalId: string; PicSrcId: string; }
const getGalleryDataProps = (GalleryData: GallerySet[], lang: string, redir: string, targetCategoryId: string, categoryDict: Record<string, string>, tagDict: Record<string, string>) => {
	const top6 = pickGallerysByCategories(GalleryData, targetCategoryId, 6, 'any');
	const resultProps: getDataProp[] = []
	top6.map((item) => {
		const categoryIds = (item.Gallery?.Categories ?? "").split(",").map(s => s.trim()).filter(Boolean);
		const categoryName = categoryIds.map(id => categoryDict[id] ?? "").filter(Boolean).join(", ");
		const tags = (item.Gallery?.Tags ?? "").split(",").map(s => s.trim()).filter(Boolean);
		const tagsName = tags.map(id => tagDict[id] ?? "").filter(Boolean).join(", ");
		const contentStatus = item.Gallery?.ContentStatus ?? 0;
		const coverPicSrcId = item.Gallery?.CoverPicSrcId ?? "";
		const date = formatDate(item.Gallery?.Validate_Start ?? "");
		const monthNum = Number(new Date(item.Gallery?.Validate_Start ?? "").getUTCMonth() + 1);
		const InternalId = item.Gallery?.InternalId ?? "";
		resultProps.push({
			redir: redir,
			galleryInternalId: item.Gallery?.InternalId ?? "",
			title: item.GalleryInfo?.find(p => p.Lang === lang)?.Title ?? "",
			content: item.GalleryInfo?.find(p => p.Lang === lang)?.Content ?? "",
			date: date.day,
			month: date.month,
			year: date.year,
			monthNum: monthNum,
			contentStatus: contentStatus,
			tagName: tagsName,
			categoryName: categoryName,
			internalId: InternalId,
			PicSrcId: coverPicSrcId,
		})
	})
	return resultProps;
}
const pickGallerysByCategories = <T extends { Gallery?: { Categories?: string | null | undefined } }>
	(newsData: T[] | undefined, categories: string | string[], take: number = 6, mode: 'any' | 'all' = 'any'): T[] => {
	const target = new Set((Array.isArray(categories) ? categories : String(categories).split(',')).map(s => s.trim()).filter(Boolean));
	if (!newsData || target.size === 0) return (newsData ?? []).slice(0, take);
	const result = newsData.filter(item => {
		const tokens = (item.Gallery?.Categories ?? '').split(',').map(s => s.trim()).filter(Boolean);
		if (tokens.length === 0) return false;
		return mode === 'all' ? [...target].every(t => tokens.includes(t)) : tokens.some(t => target.has(t));
	});
	return result.slice(0, take);
}
const formatDate = (dateStr: string) => {
	const date = new Date(dateStr);
	const day = date.getDate().toString().padStart(2, "0");
	//const month = date.toLocaleString("en-US", { month: "short" });
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const year = date.getFullYear().toString();
	return { day, month, year };
}
const GetData = ({ prop }: { prop: getDataProp[] }) => {
	return (
		<>
			{prop.map((item) => {
				return (
					<div className="item" key={item.galleryInternalId} >
						<LangLink to={`${item.redir}/${item.internalId}`} title={item.title} tabIndex={0} className="item-inner">
							<div className="wrapper_box">
								<div className="Qlink-item">
									<div className="Img_Div w-100">
										<div className="Qlinkimg-outer">
											<img alt={item.title} src={`${FileManagementAPI.PREVIEW_URL}/${item.PicSrcId}`} />
										</div>
									</div>
									<div className="Content_Div">
										<div className="box_content">
											<div className="tit-text">
												{item.title}
											</div>
											<div className="date">{item.year}-{item.month}-{item.date}</div>
										</div>
									</div>
								</div>
							</div>
						</LangLink>
					</div>
				)
			})}
		</>
	)
}
const takeTopThenFill = (top: GallerySet[] | undefined, rest: GallerySet[] | undefined, limit: number = 3): GallerySet[] => {
	const getKey = (x: GallerySet) => x.Gallery?.InternalId ?? String(x.Gallery?.GalleryId ?? '');
	const seen = new Set<string>();
	const out: GallerySet[] = [];
	// 先放置頂
	for (const it of (top ?? [])) {
		const k = getKey(it);
		if (!seen.has(k) && out.length < limit) { seen.add(k); out.push(it); }
	}
	// 再用一般補足到 limit
	for (const it of (rest ?? [])) {
		if (out.length >= limit) break;
		const k = getKey(it);
		if (!seen.has(k)) { seen.add(k); out.push(it); }
	}
	return out;
};
