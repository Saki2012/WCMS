import { Link } from 'react-router-dom';
import AnnouncementProvider from '@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api';
import CategoryProvider from '@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api';
import TagProvider from '@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api';
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { LibMerge } from '@/SysCore/Utils/Library/LibMergeData';
import { useNow } from '@/SysCore/Utils/Library/LibHook';
import { type Lang } from '@/SysCore/i18n/lang';
import { ProgId } from '@/Features/Hooks/Common/ProgId';
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import bgImg from "@/SpecFetures/1817/Assets/Client/images/bg/underline_02_Beige_1920x292.svg"
import lineTitleImg from "@/SpecFetures/1817/Assets/Client/images/line_title.svg"
import { useEffect } from 'react';

type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]

/** 找置頂公告 */
const useTopAnnouncementList = (categories?: string) => {
	const provider = AnnouncementProvider();
	let cdt = `${SchemaFields.AnnouncementFields.ContentStatus} & 1`;
	//因時程關係，暫時用前端來判斷有效日期時間，多少會有客戶端修改時間的風險。之後再改到後端開新的api寫死抓系統時間為依據。
	const now = useNow({ startPaused: true });
	if (now.isoLocal) cdt = LibMerge(" And ", false, cdt, `${SchemaFields.AnnouncementFields.Validate_Start} <= ${now.isoLocal}`);
	cdt = LibMerge(" And ", false, cdt, categories ? `${SchemaFields.AnnouncementFields.Categories} HasAny [${categories}]` : "");
	return useFetchGridListData<AnnouncementSet>({
		getModelDisplayName: () => provider.getModelDisplayName(),
		fetchList: (cond) => provider.fetchList(cond),
		fetchListCount: (cond) => provider.fetchListCount(cond),
		visibleKeys: [],
		buildQueryCondition: () => ({
			Fields: [
				SchemaFields.AnnouncementFields.AnnouncementId,
				SchemaFields.AnnouncementFields.InternalId,
				SchemaFields.AnnouncementFields.Categories,
				SchemaFields.AnnouncementFields.Tags,
				SchemaFields.AnnouncementFields.ContentStatus,
				SchemaFields.AnnouncementFields.Validate_Start,
				SchemaFields.AnnouncementFields.PictureId,
				`${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Lang}`,
				`${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Title}`,
				SchemaFields.AnnouncementFields.ViewCount,
			],
			Condition: cdt,
			OrderBy: [{ Col: SchemaFields.AnnouncementFields.Validate_Start, Desc: true }],
			PageNumber: 1,
			PageSize: 6,
		}),
		enabled: true,
		deps: [categories],
	});
};



const useAnnouncementList = (categories?: string) => {
	const provider = AnnouncementProvider();
	let cdt = `${SchemaFields.AnnouncementFields.ContentStatus} !& 4 And ${SchemaFields.AnnouncementFields.ContentStatus} !& 1`;
	//因時程關係，暫時用前端來判斷有效日期時間，多少會有客戶端修改時間的風險。之後再改到後端開新的api寫死抓系統時間為依據。
	const now = useNow({ startPaused: true });
	if (now.isoLocal) cdt = LibMerge(" And ", false, cdt, `${SchemaFields.AnnouncementFields.Validate_Start} <= ${now.isoLocal}`);
	cdt = LibMerge(" And ", false, cdt, categories ? `${SchemaFields.AnnouncementFields.Categories} HasAny [${categories}]` : "");
	return useFetchGridListData<AnnouncementSet>({
		getModelDisplayName: () => provider.getModelDisplayName(),
		fetchList: (cond) => provider.fetchList(cond),
		fetchListCount: (cond) => provider.fetchListCount(cond),
		visibleKeys: [],
		buildQueryCondition: () => ({
			Fields: [
				SchemaFields.AnnouncementFields.AnnouncementId,
				SchemaFields.AnnouncementFields.InternalId,
				SchemaFields.AnnouncementFields.Categories,
				SchemaFields.AnnouncementFields.Tags,
				SchemaFields.AnnouncementFields.ContentStatus,
				SchemaFields.AnnouncementFields.Validate_Start,
				SchemaFields.AnnouncementFields.PictureId,
				`${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Lang}`,
				`${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Title}`,
				SchemaFields.AnnouncementFields.ViewCount,
			],
			Condition: cdt,
			OrderBy: [{ Col: SchemaFields.AnnouncementFields.Validate_Start, Desc: true }],
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
			Condition: `${SchemaFields.CategoryFields.ProgId} = Announcement`,
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
			Condition: `${SchemaFields.TagDataFields.ProgId} = ${ProgId.Announcement}`,
			PageNumber: 0,
			PageSize: 0,
		}),
		enabled: true,
		deps: [],
	});
};


export const ExhibitionNewsData = (props: { lang: Lang }) => {
	const cat = "Category20251125003,Category20251125004,Category20251125005"
	const useTopAllNewsData1 = useTopAnnouncementList(cat);
	const useAllNewsData1 = useAnnouncementList(cat);
	const allNewsRawData1 = takeTopThenFill(useTopAllNewsData1.rawData, useAllNewsData1.rawData, 6);
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
	const allNews1 = getNewsDataProps(allNewsRawData1, props.lang, "/News/News-01", "", categoryDict, tagDict);
	useEffect(() => {
		// SSR 防護，避免在 server 端執行到 window / $
		if (typeof window === "undefined") return;

		const w = window as any;
		const $ = (w.$ || w.jQuery) as any;
		if (!$ || !$.fn || !$.fn.owlCarousel) {
			// jQuery 或 owlCarousel 還沒載進來就直接跳過
			return;
		}

		const $owl = $("#Exhibition_owl_carousel");
		const $toggle = $("#Exhibition_toggle");

		if ($owl.length === 0 || $toggle.length === 0) {
			return;
		}

		let isPlaying = true; // 🔧 跟原本 jQuery 一樣先設 true

		// 初始化 owlCarousel
		($owl as any).owlCarousel({
			items: 3,
			loop: true,
			dots: false,
			nav: true,
			margin: 30,
			autoplay: false, // true or false
			autoplayTimeout: 5000,
			autoplayHoverPause: true,
			responsive: {
				0: { items: 2 },
				575: { items: 2 },
				767: { items: 2 },
				991: { items: 3 },
				1199: { items: 3 },
			},
		});

		// 更新按鈕 aria + icon 狀態
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

		// 綁定 click 事件
		$toggle.on("click", handleToggleClick);

		// 初始化按鈕狀態
		updateToggleButton();

		// 清除事件與摧毀 owl（避免重複綁定）
		return () => {
			$toggle.off("click", handleToggleClick);
			try {
				$owl.trigger("destroy.owl.carousel");
			} catch {
				// ignore
			}
		};
	}, [allNews1]);
	return (
		<section className="Exhibition_section + owl-box + Layout_Padding_1_top + Layout_Padding_5_bottom" style={{ backgroundImage: `url(${bgImg})`, }}>
			<div className="circle-1 iMG-Shape-1" />
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="container-customize3">
						<div className="row">
							<div className="col-12">
								<div className="headDiv mb-sm-5 mb-4">
									<span className="headDiv-subtxt">Exhibition activities</span>
									<img alt="標題裝飾線條圖示" className="headDiv-title-line" src={lineTitleImg} />
									<span className="headDiv-txt">展演活動</span>
								</div>
							</div>
							<div className="col-12">
								<div className="content-box px-0">
									<div className="DIV-singleBox">
										<div className="control-singlebox">
											<a aria-label="圖片輪播播放中，點擊暫停" aria-pressed="true" className="toggle ms-1" href="javascript:void(0);"
												id="Exhibition_toggle" tabIndex={0} title="暫停">
												<div className="control-toggle control-pause-icon">
													<span className="sr-only">圖片輪播播放中，點擊暫停</span>
												</div>
											</a>
										</div>
									</div>
									<div className="owl-carousel owl-theme" id="Exhibition_owl_carousel">
										<GetData prop={allNews1}></GetData>
									</div>
									<div className="position-absolute + d-flex + btn_right_S1 + btn_bottom_S1 + z-2">
										<div className="customize_btn">
											<a className="Btn_a" href="/News/News-01" role="button" tabIndex={0} target="_self" title="更多展演活動" type="button">
												<div className="BtnBox">
													<span>More View</span>
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
			</div>
		</section>
	);
};

interface getDataProp { redir: string; announceInternalId: string; title: string; content: string; date: string; month: string; year: string; monthNum: number; tagName: string; categoryName: string; contentStatus: number; internalId: string; pictureId: string; }

const getNewsDataProps = (newsData: AnnouncementSet[], lang: string, redir: string, targetCategoryId: string, categoryDict: Record<string, string>, tagDict: Record<string, string>) => {
	const top6 = pickNewsByCategories(newsData, targetCategoryId, 6, 'any');
	const resultProps: getDataProp[] = []
	top6.map((item) => {
		const categoryIds = (item.Announcement?.Categories ?? "").split(",").map(s => s.trim()).filter(Boolean);
		const categoryName = categoryIds.map(id => categoryDict[id] ?? "").filter(Boolean).join(", ");
		const tags = (item.Announcement?.Tags ?? "").split(",").map(s => s.trim()).filter(Boolean);
		const tagsName = tags.map(id => tagDict[id] ?? "").filter(Boolean).join(", ");
		const contentStatus = item.Announcement?.ContentStatus ?? 0;
		const date = formatDate(item.Announcement?.Validate_Start ?? "");
		const monthNum = Number(new Date(item.Announcement?.Validate_Start ?? "").getUTCMonth() + 1);
		const InternalId = item.Announcement?.InternalId ?? "";
		const PictureId = item.Announcement?.PictureId ?? "";
		resultProps.push({
			redir: redir,
			announceInternalId: item.Announcement?.InternalId ?? "",
			title: item.AnnouncementDetail?.find(p => p.Lang === lang)?.Title ?? "",
			content: item.AnnouncementDetail?.find(p => p.Lang === lang)?.Content ?? "",
			date: date.day,
			month: date.month,
			year: date.year,
			monthNum: monthNum,
			contentStatus: contentStatus,
			tagName: tagsName,
			categoryName: categoryName,
			internalId: InternalId,
			pictureId: PictureId,
		})
	})
	return resultProps;
}

const pickNewsByCategories = <T extends { Announcement?: { Categories?: string | null | undefined } }>
	(newsData: T[] | undefined, categories: string | string[], take: number = 6, mode: 'any' | 'all' = 'any'): T[] => {
	const target = new Set((Array.isArray(categories) ? categories : String(categories).split(',')).map(s => s.trim()).filter(Boolean));
	if (!newsData || target.size === 0) return (newsData ?? []).slice(0, take);
	const result = newsData.filter(item => {
		const tokens = (item.Announcement?.Categories ?? '').split(',').map(s => s.trim()).filter(Boolean);
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
					<div className="item" key={item.announceInternalId} >
						<Link to={`${item.redir}/${item.internalId}`} title={item.title} tabIndex={0} className="item-inner">
							<article className="cardbox">
								<div className="card_content">
									<figure className="figure_Box">
										<div className="card_figure">
											<div className="img-wrapper">
												<img alt="" className="card_image" src={`${FileManagementAPI.PREVIEW_URL}/${item.pictureId}`} />
											</div>
										</div>
										<div className="Arrow_RD_area">
											<div className="Frame_White">
												<div className="wrapper_icon">
													<span className="icon_ii">
														<i className="fas fa-long-arrow-alt-right" />
														<span className="sr-only">前往</span>
													</span>
													<div className="sticky_corner + top-right-corner">
														<img src={`${FileManagementAPI.PREVIEW_URL}/${item.pictureId}`}
															className="card_image"
															alt=""
														/>
													</div>
													<div className="sticky_corner + bottom-left-corner">
														<img src={`${FileManagementAPI.PREVIEW_URL}/${item.pictureId}`}
															className="card_image"
															alt=""
														/>
													</div>
												</div>
											</div>
										</div>
									</figure>
									<div className="Text_Block_Area">
										<div className="card_catDiv">
											<div className="card_time">
												<i className="far fa-calendar-alt mr-2" />
												<span className="sr-only">日期</span>
												{item.year}-{item.month}-{item.date}
											</div>
											<div className="CustomState">
												{isWithinLastNDaysFromMD(Number(item.monthNum), Number(item.date)) && (
													<span className="label icon-small label-warning" >最新</span>
												)}
												{item.contentStatus != 0 && (
													<>
														{Boolean(item.contentStatus & 1) && (<span className="label icon-small label-success">置頂</span>)}
														{Boolean(item.contentStatus & 2) && (<span className="label icon-small label-danger">熱門</span>)}
													</>
												)}
											</div>
										</div>
										<div className="card_titleDiv + mb-md-4 mb-sm-3 mb-2">
											<div className="card_title">
												{item.title}
											</div>
										</div>
										<div className="card_StateDiv">
											<div className="card_cat">
												<div className="card_cat_link">
													<span className="s-tle">
														<i className="fas fa-tasks-alt mr-2" />
														{item.categoryName}
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</article>
						</Link>
					</div>
				)
			})}
		</>
	)
}


const DAY_MS = 24 * 60 * 60 * 1000;

// 置頂優先 → 去重 → 補滿到 limit（預設 3）
const takeTopThenFill = (top: AnnouncementSet[] | undefined, rest: AnnouncementSet[] | undefined, limit: number = 3): AnnouncementSet[] => {
	const getKey = (x: AnnouncementSet) => x.Announcement?.InternalId ?? String(x.Announcement?.AnnouncementId ?? '');
	const seen = new Set<string>();
	const out: AnnouncementSet[] = [];
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

const isWithinLastNDaysFromMD = (month1to12?: number, day1to31?: number, n: number = 8): boolean => {
	if (!month1to12 || !day1to31) return false;
	const now = new Date();
	const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
	let y = now.getUTCFullYear();
	let candidateUTC = Date.UTC(y, month1to12 - 1, day1to31);
	// 若候選日在未來，代表跨年情境 → 改用去年
	if (candidateUTC > nowUTC) {
		y -= 1;
		candidateUTC = Date.UTC(y, month1to12 - 1, day1to31);
	}
	const diffDays = Math.floor((nowUTC - candidateUTC) / DAY_MS);
	return diffDays >= 0 && diffDays <= n;
};