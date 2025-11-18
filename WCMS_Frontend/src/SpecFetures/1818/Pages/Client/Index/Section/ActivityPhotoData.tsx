import { Link } from 'react-router-dom';
import GalleryProvider from '@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api';
import CategoryProvider from '@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api';
import TagProvider from '@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api';
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
//import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
//type BannerSet = components["schemas"]["BannerSet_DTO"]
//type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]

type GallerySet = components["schemas"]["GallerySet_DTO"]


type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]

import { LibMerge } from '@/SysCore/Utils/Library/LibMergeData';
import { useNow } from '@/SysCore/Utils/Library/LibHook';
import { DefaultLang } from '@/SysCore/i18n/lang';
import { ProgId } from '@/Features/Hooks/Common/ProgId';

//const emptyData: AnnouncementSet = {
//	Announcement:
//	{
//		AnnouncementId: "",
//		Validate_Start: "",
//		Validate_End: "",
//		PictureId: "",
//		PicDescription: "",
//	}
//	,
//	AnnouncementDetail: [
//		{
//			RowId: 1,
//			Lang: "zh-tw",
//			Title: "",
//			Content: "",
//			Url: "",
//			UrlDescription: "",
//		},
//		{
//			RowId: 2,
//			Lang: "en",
//			Title: "",
//			Content: "",
//			Url: "",
//			UrlDescription: "",
//		}
//	]
//}


const emptyData: GallerySet = {
	Gallery:
	{
		GalleryId: "",
		Validate_Start: "",
		InternalId: "",
		CoverPicSrcId: "",
		Categories: "",
		Tags: "",
		ContentStatus: 0,
	}
	,
	GalleryInfo: [
		{
			RowId: 1,
			Lang: "zh-tw",
			Title: "",
			Content: "",
		}
	]
}


/** 找置頂公告 */
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
			Condition: `${SchemaFields.CategoryFields.ProgId} = Gallery`,
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
			Condition: `${SchemaFields.TagDataFields.ProgId} = ${ProgId.Gallery}`,
			PageNumber: 0,
			PageSize: 0,
		}),
		enabled: true,
		deps: [],
	});
};


export const ActivityPhotoData = () => {

	const useTopAllGalleryData1 = useTopGalleryList("1");
	//	const useTopAllNewsData2 = useTopAnnouncementList("2");
	//	const useTopAllNewsData3 = useTopAnnouncementList("3");
	//	const useTopAllNewsData4 = useTopAnnouncementList("4");

	const useAllGalleryData1 = useGalleryList("1");
	//	const useAllNewsData2 = useAnnouncementList("2");
	//	const useAllNewsData3 = useAnnouncementList("3");
	//	const useAllNewsData4 = useAnnouncementList("4");



	const allGalleryRawData1 = takeTopThenFill(useTopAllGalleryData1.rawData, useAllGalleryData1.rawData, 6);
	//	const allNewsRawData2 = takeTopThenFill(useTopAllNewsData2.rawData, useAllNewsData2.rawData, 3);
	//	const allNewsRawData3 = takeTopThenFill(useTopAllNewsData3.rawData, useAllNewsData3.rawData, 3);
	//	const allNewsRawData4 = takeTopThenFill(useTopAllNewsData4.rawData, useAllNewsData4.rawData, 3);


	const useCategoryData = useCategoryList();
	const useTagData = useTagList();



	const lang = DefaultLang

	const categoryDict: Record<string, string> = Object.fromEntries(
		(useCategoryData.rawData ?? []).map(cat => {
			const id = cat.Category?.CategoryId;
			const name = cat.CategoryDetail?.find(p => p.Lang === lang)?.CategoryName ?? "";
			return [id, name];
		})
	);

	const tagDict: Record<string, string> = Object.fromEntries(
		(useTagData.rawData ?? []).map(cat => {
			const id = cat.TagData?.TagId;
			const name = cat.TagDetail?.find(p => p.Lang === lang)?.TagName ?? "";
			return [id, name];
		})
	);



	const allGallery1 = getGalleryDataProps(allGalleryRawData1, lang, "/News/News-01", "", categoryDict, tagDict);
	//	const allNews2 = getNewsDataProps(allNewsRawData2, lang, "/News/News-02", "", categoryDict, tagDict);
	//	const allNews3 = getNewsDataProps(allNewsRawData3, lang, "/News/News-03", "", categoryDict, tagDict);
	//	const allNews4 = getNewsDataProps(allNewsRawData4, lang, "/News/News-04", "", categoryDict, tagDict);

	return (



		<section className="Gallery_section owl-box Layout_Padding_1_top Layout_Padding_1_bottom bg-white">
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="container-customize3">
						<div className="row">
							<div className="offset-3 col-6">
								<div className="headDiv mb-lg-5 mb-4">
									<span className="headDiv-txt-5 tw">活動相簿</span>
								</div>
							</div>
							<div className="col-12">
								<div className="content-box px-0 mb-5">
									<div className="owl-carousel owl-theme" id="Gallery_owl_carousel">

										<GetData prop={allGallery1}></GetData>



									</div>
									<div className="DIV-Box">
										<div className="control-box">
											<a
												aria-label="開始播放圖片輪播"
												aria-pressed="false"
												className="play me-1"
												href="javascript:void(0);"
												id="Gallery_start"
												tabIndex={0}
												title="播放">
												<div className="contrl_start">
													<span className="control-start-icon">
														<span className="sr-only">開始播放圖片輪播</span>
													</span>
												</div>
											</a>
											<a
												aria-label="暫停圖片輪播"
												aria-pressed="true"
												className="stop ms-1"
												href="javascript:void(0);"
												id="Gallery_pause"
												tabIndex={0}
												title="暫停">
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
										<a
											className="Btn_a"
											href="/News/News-01"
											role="button"
											tabIndex={0}
											target="_self"
											title="MORE INFO"
											type="button">
											<div className="BtnBox">
												<span>更多資訊</span>
											</div>
										</a>
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


						<Link to={`${item.redir}/${item.internalId}`} title={item.title} tabIndex={0} className="item-inner">

							<div className="wrapper_box">
								<div className="Qlink-item">
									<div className="Img_Div w-100">
										<div className="Qlinkimg-outer">
											<img
												alt={item.title}
												src={`${FileManagementAPI.PREVIEW_URL}/${item.PicSrcId}`}
											/>
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
						</Link>
					</div>



				)
			})}
		</>
	)
}


const DAY_MS = 24 * 60 * 60 * 1000;

// 置頂優先 → 去重 → 補滿到 limit（預設 3）
const takeTopThenFill = (
	top: GallerySet[] | undefined,
	rest: GallerySet[] | undefined,
	limit: number = 3
): GallerySet[] => {
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