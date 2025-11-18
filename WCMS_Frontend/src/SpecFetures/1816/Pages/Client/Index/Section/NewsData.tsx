import { NewsCalendarData } from '@/SpecFetures/1816/Pages/Client/Index/Section/NewsCalendarData'
import bgImg from '@/SpecFetures/1816/Assets/Client/images/bg/background-transparent-image_1920x600.png'



import { Link } from 'react-router-dom';
import AnnouncementProvider from '@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api';

import CategoryProvider from '@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api';
import TagProvider from '@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api';
//import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";

//import { useBannerListData } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Hook";

import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";



//import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import type { components } from "@/types/api";
import clsx from "clsx";
import * as SchemaFields from "@/types/SchemaFields";
import { useMemo } from "react";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
//type BannerSet = components["schemas"]["BannerSet_DTO"]
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]

import { LibMerge } from '@/SysCore/Utils/Library/LibMergeData';
import { useNow } from '@/SysCore/Utils/Library/LibHook';
import { DefaultLang } from '@/SysCore/i18n/lang';
import { ProgId } from '@/Features/Hooks/Common/ProgId';

const emptyData: AnnouncementSet = {
	Announcement:
	{
		AnnouncementId: "",
		Validate_Start: "",
		Validate_End: "",
		PictureId: "",
		PicDescription: "",
	}
	,
	AnnouncementDetail: [
		{
			RowId: 1,
			Lang: "zh-tw",
			Title: "",
			Content: "",
			Url: "",
			UrlDescription: "",
		},
		{
			RowId: 2,
			Lang: "en",
			Title: "",
			Content: "",
			Url: "",
			UrlDescription: "",
		}
	]
}


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


export const NewsData = () => {

	const useTopAllNewsData1 = useTopAnnouncementList("1");
	const useTopAllNewsData2 = useTopAnnouncementList("2");
	const useTopAllNewsData3 = useTopAnnouncementList("3");
	const useTopAllNewsData4 = useTopAnnouncementList("4");

	const useAllNewsData1 = useAnnouncementList("1");
	const useAllNewsData2 = useAnnouncementList("2");
	const useAllNewsData3 = useAnnouncementList("3");
	const useAllNewsData4 = useAnnouncementList("4");



	const allNewsRawData1 = takeTopThenFill(useTopAllNewsData1.rawData, useAllNewsData1.rawData, 3);
	const allNewsRawData2 = takeTopThenFill(useTopAllNewsData2.rawData, useAllNewsData2.rawData, 3);
	const allNewsRawData3 = takeTopThenFill(useTopAllNewsData3.rawData, useAllNewsData3.rawData, 3);
	const allNewsRawData4 = takeTopThenFill(useTopAllNewsData4.rawData, useAllNewsData4.rawData, 3);


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



	const allNews1 = getNewsDataProps(allNewsRawData1, lang, "/News/News-01", "", categoryDict, tagDict);
	const allNews2 = getNewsDataProps(allNewsRawData2, lang, "/News/News-02", "", categoryDict, tagDict);
	const allNews3 = getNewsDataProps(allNewsRawData3, lang, "/News/News-03", "", categoryDict, tagDict);
	const allNews4 = getNewsDataProps(allNewsRawData4, lang, "/News/News-04", "", categoryDict, tagDict);

	return (


		<section
			className="Newsii_section Layout_Padding_1_top Layout_Padding_5_bottom"
			style={{
				backgroundImage:
					"url(/images/bg/background-transparent-image_1920x600.png)",
			}}>
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="circle-1 iMG-Shape-1" />
					<div className="container-customize2 image-layer">
						<div className="row">
							<div className="col-xxl-7 col-xl-7 col-lg-7 col-md-12 col-sm-12 col-12 + order-xxl-1 order-xl-1 order-lg-1 order-md-2 order-sm-2  order-2">
								<div className="col-12">
									<div className="headDiv mb-sm-5 mb-4">
										<span className="headDiv-txt">最新消息</span>
										<span className="headDiv-subtxt">News</span>
									</div>
								</div>
								<div className="V-nav-tabs-content-box" id="Vertical">
									<div className="Vertical nav-tabs-list">
										<ul className="nav nav-tabs" role="tablist">
											<li className="nav-item" role="presentation">
												<a
													aria-controls="V-navTabs-01"
													aria-selected="true"
													className="nav-link active"
													data-bs-target="#V-navTabs-01"
													data-bs-toggle="tab"
													href="#"
													id="V-Tabs__01"
													role="tab"
													tabIndex={0}
													type="button">
													館務公告
												</a>
											</li>
											<li className="nav-item" role="presentation">
												<a
													aria-controls="V-navTabs-02"
													aria-selected="false"
													className="nav-link"
													data-bs-target="#V-navTabs-02"
													data-bs-toggle="tab"
													href="#"
													id="V-Tabs__02"
													role="tab"
													tabIndex={0}
													type="button">
													電子資源
												</a>
											</li>
											<li className="nav-item" role="presentation">
												<a
													aria-controls="V-navTabs-02"
													aria-selected="false"
													className="nav-link"
													data-bs-target="#V-navTabs-03"
													data-bs-toggle="tab"
													href="#"
													id="V-Tabs__03"
													role="tab"
													tabIndex={0}
													type="button">
													活動訊息
												</a>
											</li>
											<li className="nav-item" role="presentation">
												<a
													aria-controls="V-navTabs-04"
													aria-selected="false"
													className="nav-link"
													data-bs-target="#V-navTabs-04"
													data-bs-toggle="tab"
													href="#"
													id="V-Tabs__04"
													role="tab"
													tabIndex={0}
													type="button">
													講習課程
												</a>
											</li>
										</ul>
									</div>
									<div className="tab-content" id="V-nav-tabContent">
										<div
											aria-labelledby="V-Tabs__01"
											className="tab-pane fade show active"
											id="V-navTabs-01"
											role="tabpanel">
											<div className="News_mainDIV">
												<ul className="ListNews">

													<GetData prop={allNews1}></GetData>

												</ul>
												<div className="btn-w100-wrapper justify-content-start">
													<div className="customize_btn mr-4">
														<a
															className="Btn_a"
															href="/News/News-01"
															role="button"
															tabIndex={0}
															target="_self"
															title="更多館務公告"
															type="button">
															<div className="BtnBox">
																<span>更多館務公告</span>
																<span className="ml-2">+</span>
															</div>
														</a>
													</div>
												</div>
											</div>
										</div>
										<div
											aria-labelledby="V-Tabs__02"
											className="tab-pane fade"
											id="V-navTabs-02"
											role="tabpanel">
											<div className="News_mainDIV">
												<ul className="ListNews">

													<GetData prop={allNews2}></GetData>


												</ul>
												<div className="btn-w100-wrapper justify-content-start">
													<div className="customize_btn mr-4">
														<a
															className="Btn_a"
															href="/News/News-02"
															role="button"
															tabIndex={0}
															target="_self"
															title="更多電子資源"
															type="button">
															<div className="BtnBox">
																<span>更多電子資源</span>
																<span className="ml-2">+</span>
															</div>
														</a>
													</div>
												</div>
											</div>
										</div>
										<div
											aria-labelledby="V-Tabs__03"
											className="tab-pane fade"
											id="V-navTabs-03"
											role="tabpanel">
											<div className="News_mainDIV">
												<ul className="ListNews">

													<GetData prop={allNews3}></GetData>


												</ul>
												<div className="btn-w100-wrapper justify-content-start">
													<div className="customize_btn mr-4">
														<a
															className="Btn_a"
															href="/News/News-03"
															role="button"
															tabIndex={0}
															target="_self"
															title="更多活動訊息"
															type="button">
															<div className="BtnBox">
																<span>更多活動訊息</span>
																<span className="ml-2">+</span>
															</div>
														</a>
													</div>
												</div>
											</div>
										</div>
										<div
											aria-labelledby="V-Tabs__04"
											className="tab-pane fade"
											id="V-navTabs-04"
											role="tabpanel">
											<div className="News_mainDIV">
												<ul className="ListNews">

													<GetData prop={allNews4}></GetData>

												</ul>
												<div className="btn-w100-wrapper justify-content-start">
													<div className="customize_btn mr-4">
														<a
															className="Btn_a"
															href="/News/News-04"
															role="button"
															tabIndex={0}
															target="_self"
															title="更多講習課程"
															type="button">
															<div className="BtnBox">
																<span>更多講習課程</span>
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
							<NewsCalendarData />
						</div>
					</div>
				</div>
			</div>
		</section>


	);
};



interface getDataProp { redir: string; announceInternalId: string; title: string; date: string; month: string; year: string; monthNum: number; tagName: string; categoryName: string; contentStatus: number; internalId: string }

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
		resultProps.push({
			redir: redir,
			announceInternalId: item.Announcement?.InternalId ?? "",
			title: item.AnnouncementDetail?.find(p => p.Lang === lang)?.Title ?? "",
			date: date.day,
			month: date.month,
			year: date.year,
			monthNum: monthNum,
			contentStatus: contentStatus,
			tagName: tagsName,
			categoryName: categoryName,
			internalId: InternalId,
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


					<li className="News_item" key={item.announceInternalId} >

						<Link to={`${item.redir}/${item.internalId}`} title={item.title} tabIndex={0} className="item-inner">


							<div className="rightBox">
								<div className="card_catDiv">
									<div className="a-left">
										<div className="card_cat">
											<div className="card_cat_link">
												<span className="cat_title">{item.categoryName}</span>
											</div>
										</div>
										<div className="CustomState">

											{isWithinLastNDaysFromMD(Number(item.monthNum), Number(item.date)) && (
												<div className="icon-small new-bg" >最新</div>
											)}
											{item.contentStatus != 0 && (
												<>
													{Boolean(item.contentStatus & 1) && (<div className="icon-small top-bg">置頂</div>)}
													{Boolean(item.contentStatus & 2) && (<div className="icon-small hot-bg">熱門</div>)}
												</>
											)}

										</div>
									</div>
									<div className="a-right">
										<div className="card_time">
											<i
												aria-hidden="true"
												className="fa fa-clock-o"
												style={{
													marginRight: "3px",
												}}
											/>
											{item.year}-{item.month}-{item.date}
										</div>
									</div>
								</div>
								<div className="card_titleDiv">
									<div className="card_title" >
										{item.title}
									</div>
								</div>
							</div>

						</Link>
					</li>






				)
			})}
		</>
	)
}


const DAY_MS = 24 * 60 * 60 * 1000;

// 置頂優先 → 去重 → 補滿到 limit（預設 3）
const takeTopThenFill = (
	top: AnnouncementSet[] | undefined,
	rest: AnnouncementSet[] | undefined,
	limit: number = 3
): AnnouncementSet[] => {
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