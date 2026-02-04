import AnnouncementProvider from '@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api';
import CategoryProvider from '@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api';
import TagProvider from '@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api';
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import type { components } from "@/types/api";
import { LibMerge } from '@/SysCore/Utils/Library/LibMergeData';
import { useNow } from '@/SysCore/Utils/Library/LibHook';
import { PGID } from '@/Features/Hooks/Common/ProgId';
import { LangLink } from '@/SysCore/i18n/LangLink';
import type { Lang } from '@/SysCore/i18n/lang';
import { AnnouncementDetailFields, AnnouncementFields, CategoryDetailFields, CategoryFields, TagDataFields, TagDetailFields } from '@/types/SchemaFields';
import { useCallback, useState } from 'react';
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]


/** 找置頂公告 */
const useTopAnnouncementList = (categories?: string) => {
	const provider = AnnouncementProvider();
	let cdt = `${AnnouncementFields.ContentStatus} & 1`;
	//因時程關係，暫時用前端來判斷有效日期時間，多少會有客戶端修改時間的風險。之後再改到後端開新的api寫死抓系統時間為依據。
	const now = useNow({ startPaused: true });
	if (now.isoLocal) cdt = LibMerge(" And ", false, cdt, `${AnnouncementFields.Validate_Start} <= ${now.isoLocal}`);
	cdt = LibMerge(" And ", false, cdt, categories ? `${AnnouncementFields.Categories} HasAny [${categories}]` : "");
	return useFetchGridListData<AnnouncementSet>({
		getModelDisplayName: () => provider.getModelDisplayName(),
		fetchList: (cond) => provider.fetchList(cond),
		fetchListCount: (cond) => provider.fetchListCount(cond),
		visibleKeys: [],
		buildQueryCondition: () => ({
			Fields: [
				AnnouncementFields.AnnouncementId,
				AnnouncementFields.InternalId,
				AnnouncementFields.Categories,
				AnnouncementFields.Tags,
				AnnouncementFields.ContentStatus,
				AnnouncementFields.Validate_Start,
				`${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
				`${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
				AnnouncementFields.ViewCount,
			],
			Condition: cdt,
			OrderBy: [{ Col: AnnouncementFields.Validate_Start, Desc: true }],
			PageNumber: 1,
			PageSize: 6,
		}),
		enabled: true,
		deps: [categories],
	});
};



const useAnnouncementList = (categories?: string) => {
	const provider = AnnouncementProvider();
	let cdt = `${AnnouncementFields.ContentStatus} !& 4 And ${AnnouncementFields.ContentStatus} !& 1`;
	//因時程關係，暫時用前端來判斷有效日期時間，多少會有客戶端修改時間的風險。之後再改到後端開新的api寫死抓系統時間為依據。
	const now = useNow({ startPaused: true });
	if (now.isoLocal) cdt = LibMerge(" And ", false, cdt, `${AnnouncementFields.Validate_Start} <= ${now.isoLocal}`);
	cdt = LibMerge(" And ", false, cdt, categories ? `${AnnouncementFields.Categories} HasAny [${categories}]` : "");
	return useFetchGridListData<AnnouncementSet>({
		getModelDisplayName: () => provider.getModelDisplayName(),
		fetchList: (cond) => provider.fetchList(cond),
		fetchListCount: (cond) => provider.fetchListCount(cond),
		visibleKeys: [],
		buildQueryCondition: () => ({
			Fields: [
				AnnouncementFields.AnnouncementId,
				AnnouncementFields.InternalId,
				AnnouncementFields.Categories,
				AnnouncementFields.Tags,
				AnnouncementFields.ContentStatus,
				AnnouncementFields.Validate_Start,
				`${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
				`${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
				AnnouncementFields.ViewCount,
			],
			Condition: cdt,
			OrderBy: [{ Col: AnnouncementFields.Validate_Start, Desc: true }],
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
				CategoryFields.CategoryId,
				`${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang}`,
				`${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName}`,
			],
			Condition: `${CategoryFields.ProgId} = Announcement`,
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
				TagDataFields.TagId,
				`${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
				`${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,
			],
			Condition: `${TagDataFields.ProgId} = ${PGID.Announcement}`,
			PageNumber: 0,
			PageSize: 0,
		}),
		enabled: true,
		deps: [],
	});
};


export const NewsData = (props: { lang: Lang }) => {
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
	const allNews2 = getNewsDataProps(allNewsRawData2, props.lang, "/News/News-02", "", categoryDict, tagDict);
	const allNews3 = getNewsDataProps(allNewsRawData3, props.lang, "/News/News-03", "", categoryDict, tagDict);
	const allNews4 = getNewsDataProps(allNewsRawData4, props.lang, "/News/News-04", "", categoryDict, tagDict);
	const getMoreText = (catName: string) => {
		// 宣告變數
		const base = props.lang === "en" ? "More " : "更多";
		// return
		return `${base}${catName ?? ""}`;
	};
	const [activeTab, setActiveTab] = useState<"01" | "02" | "03" | "04">("01");

	// 執行 function：切換 tab（阻止 a 預設行為，避免網址跳動）
	const onTabClick = useCallback((tab: "01" | "02" | "03" | "04") => {
		return (e: React.MouseEvent<HTMLAnchorElement>) => {
			e.preventDefault();
			setActiveTab(tab);
		};
	}, []);

	// 宣告變數：class helper（保持 DOM 結構不變，只換 class）
	const getTabLinkClass = (tab: "01" | "02" | "03" | "04") => {
		return tab === activeTab ? "nav-link active" : "nav-link";
	};

	const getPaneClass = (tab: "01" | "02" | "03" | "04") => {
		return tab === activeTab ? "tab-pane fade show active" : "tab-pane fade";
	};
	return (
		<div className="Mask-DivBox">
			<div className="customizeBox">
				<div className="container-customize4 bg-layer p-3">
					<div className="row">
						<div className="col-12">
							{/* 標題 start */}
							<div className="headDiv mb-3 mt-1 d-flex justify-content-center">
								<span className="headDiv-txt">{props.lang === "en" ? "News" : "最新消息"}</span>
								<span className="headDiv-subtxt">{props.lang === "en" ? "" : "NEWS"}</span>
							</div>
							{/* 標題 end */}
						</div>

						<div className="V-nav-tabs-content-box" id="Horizontal">
							<div className="Horizontal nav-tabs-list">
								<ul className="nav nav-tabs" role="tablist">
									<li className="nav-item" role="presentation">
										<a
											aria-controls="V-navTabs-01"
											aria-selected={activeTab === "01"}
											className={getTabLinkClass("01")}
											data-bs-target="#V-navTabs-01"
											data-bs-toggle="tab"
											href="#"
											id="V-Tabs__01"
											role="tab"
											tabIndex={0}
											type="button"
											onClick={onTabClick("01")}
										>
											{categoryDict["1"] ?? categoryDict[1] ?? ""}
										</a>

										<div className="tab-content" id="V-nav-tabContent">
											<div
												aria-labelledby="V-Tabs__01"
												className={getPaneClass("01")}
												id="V-navTabs-01"
												role="tabpanel"
											>												<div className="News_mainDIV">
													<ul className="ListNews">
														<GetData prop={allNews1}></GetData>
													</ul>

													<div className="btn-w100-wrapper w-100">
														<div className="customize_btn w-100">
															<LangLink
																to={"/News/News-01"}
																title={getMoreText(categoryDict["1"] ?? categoryDict[1] ?? "")}
																role="button"
																tabIndex={0}
																target="_self"
																className="Btn_a"
																type="button"
															>
																<div className="BtnBox">
																	<div className="me-2">
																		<img alt="" src="images/svg_icon/more-d.svg" />
																	</div>
																	<span>{getMoreText(categoryDict["1"] ?? categoryDict[1] ?? "")}</span>
																	<span className="ms-2">
																		<span className="fas fa-angle-right"></span>
																	</span>
																</div>
															</LangLink>
														</div>
													</div>
												</div>
											</div>
										</div>
									</li>

									<li className="nav-item" role="presentation">
										<a
											aria-controls="V-navTabs-02"
											aria-selected={activeTab === "02"}
											className={getTabLinkClass("02")}
											data-bs-target="#V-navTabs-02"
											data-bs-toggle="tab"
											href="#"
											id="V-Tabs__02"
											role="tab"
											tabIndex={0}
											type="button"
											onClick={onTabClick("02")}
										>
											{categoryDict["2"] ?? categoryDict[2] ?? ""}
										</a>

										<div className="tab-content" id="V-nav-tabContent">
											<div
												aria-labelledby="V-Tabs__02"
												className={getPaneClass("02")}
												id="V-navTabs-02"
												role="tabpanel"
											>												<div className="News_mainDIV">
													<ul className="ListNews">
														<GetData prop={allNews2}></GetData>
													</ul>

													<div className="btn-w100-wrapper w-100">
														<div className="customize_btn w-100">
															<LangLink
																to={"/News/News-02"}
																title={getMoreText(categoryDict["2"] ?? categoryDict[2] ?? "")}
																role="button"
																tabIndex={0}
																target="_self"
																className="Btn_a"
																type="button"
															>
																<div className="BtnBox">
																	<div className="me-2">
																		<img alt="" src="images/svg_icon/more-d.svg" />
																	</div>
																	<span>{getMoreText(categoryDict["2"] ?? categoryDict[2] ?? "")}</span>
																	<span className="ms-2">
																		<span className="fas fa-angle-right"></span>
																	</span>
																</div>
															</LangLink>
														</div>
													</div>
												</div>
											</div>
										</div>
									</li>

									<li className="nav-item" role="presentation">
										<a
											aria-controls="V-navTabs-03"
											aria-selected={activeTab === "03"}
											className={getTabLinkClass("03")}
											data-bs-target="#V-navTabs-03"
											data-bs-toggle="tab"
											href="#"
											id="V-Tabs__03"
											role="tab"
											tabIndex={0}
											type="button"
											onClick={onTabClick("03")}
										>
											{categoryDict["3"] ?? categoryDict[3] ?? ""}
										</a>

										<div className="tab-content" id="V-nav-tabContent">
											<div
												aria-labelledby="V-Tabs__03"
												className={getPaneClass("03")}
												id="V-navTabs-03"
												role="tabpanel"
											>												<div className="News_mainDIV">
													<ul className="ListNews">
														<GetData prop={allNews3}></GetData>
													</ul>

													<div className="btn-w100-wrapper w-100">
														<div className="customize_btn w-100">
															<LangLink
																to={"/News/News-03"}
																title={getMoreText(categoryDict["3"] ?? categoryDict[3] ?? "")}
																role="button"
																tabIndex={0}
																target="_self"
																className="Btn_a"
																type="button"
															>
																<div className="BtnBox">
																	<div className="me-2">
																		<img alt="" src="images/svg_icon/more-d.svg" />
																	</div>
																	<span>{getMoreText(categoryDict["3"] ?? categoryDict[3] ?? "")}</span>
																	<span className="ms-2">
																		<span className="fas fa-angle-right"></span>
																	</span>
																</div>
															</LangLink>
														</div>
													</div>
												</div>
											</div>
										</div>
									</li>

									<li className="nav-item" role="presentation">
										<a
											aria-controls="V-navTabs-04"
											aria-selected={activeTab === "04"}
											className={getTabLinkClass("04")}
											data-bs-target="#V-navTabs-04"
											data-bs-toggle="tab"
											href="#"
											id="V-Tabs__04"
											role="tab"
											tabIndex={0}
											type="button"
											onClick={onTabClick("04")}
										>
											{categoryDict["4"] ?? categoryDict[4] ?? ""}
										</a>

										<div className="tab-content" id="V-nav-tabContent">
											<div
												aria-labelledby="V-Tabs__04"
												className={getPaneClass("04")}
												id="V-navTabs-04"
												role="tabpanel"
											>
												<div className="News_mainDIV">
													<ul className="ListNews">
														<GetData prop={allNews4}></GetData>
													</ul>

													<div className="btn-w100-wrapper w-100">
														<div className="customize_btn w-100">
															<LangLink
																to={"/News/News-04"}
																title={getMoreText(categoryDict["4"] ?? categoryDict[4] ?? "")}
																role="button"
																tabIndex={0}
																target="_self"
																className="Btn_a"
																type="button"
															>
																<div className="BtnBox">
																	<div className="me-2">
																		<img alt="" src="images/svg_icon/more-d.svg" />
																	</div>
																	<span>{getMoreText(categoryDict["4"] ?? categoryDict[4] ?? "")}</span>
																	<span className="ms-2">
																		<span className="fas fa-angle-right"></span>
																	</span>
																</div>
															</LangLink>
														</div>
													</div>
												</div>
											</div>
										</div>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
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



const GetData = (props: { prop: getDataProp[] }) => {
	// 宣告變數
	const list = props.prop ?? [];

	// return：對標 prototype 的 News_item DOM
	return (
		<>
			{list.map((p, idx) => {
				// 宣告變數：你原本的判斷邏輯照舊（這裡只示意）
				const isTop = Boolean(p.contentStatus & 1);   // 置頂（依你原本 bitmask）
				const isNew = Boolean(p.contentStatus & 2);   // 最新（依你原本 bitmask）
				const href = `${p.redir}/${p.announceInternalId}`;

				return (
					<li key={`${p.announceInternalId}-${idx}`} className="News_item">
						<LangLink to={href} className="item-inner" tabIndex={0} title={p.title}>
							<div className="rightBox">
								<div className="card_catDiv">
									{/* a-left：日期（prototype 放左邊，純文字，不要 clock icon） */}
									<div className="a-left order-1">
										<div className="card_time">{`${p.year}-${String(p.monthNum).padStart(2, "0")}-${String(p.date).padStart(2, "0")}`}</div>
									</div>

									{/* card_titleDiv：標題（prototype 放在 card_catDiv 內） */}
									<div className="card_titleDiv order-xl-2 order-3">
										<div className="card_title">{p.title}</div>
									</div>

									{/* a-right：狀態（置頂/最新） */}
									<div className="a-right order-xl-3 order-2">
										<div className="CustomState">
											{isTop ? <div className="icon-small top-bg">置頂</div> : null}
											{isNew ? <div className="icon-small top-bg">最新</div> : null}
										</div>
									</div>
								</div>
								{/* card_catDiv */}
							</div>
							{/* rightBox */}
						</LangLink>
					</li>
				);
			})}
		</>
	);
};


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
