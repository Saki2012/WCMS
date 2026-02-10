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
import more_d from '@/SpecFetures/1816/Assets/Client/images/svg_icon/more-d.svg'
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]



const useAnnouncementList = (lang: Lang, categories?: string) => {
	const provider = AnnouncementProvider();
	let cdt = `${AnnouncementFields.ContentStatus} !& 4`;
	cdt = LibMerge(" And ", false, cdt, `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang} = ${lang}`)
	cdt = LibMerge(" And ", false, cdt, `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} != ''`)
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
			RankGroups: [{ Condition: `${AnnouncementFields.ContentStatus} & 1` }],
			OrderBy: [{ Col: AnnouncementFields.Validate_Start, Desc: true }],
			PageNumber: 1,
			PageSize: 5,
		}),
		enabled: true,
		deps: [lang, categories],
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
	const useAllNewsData1 = useAnnouncementList(props.lang, "1");
	const useAllNewsData2 = useAnnouncementList(props.lang, "2");
	const useAllNewsData3 = useAnnouncementList(props.lang, "3");
	const useAllNewsData4 = useAnnouncementList(props.lang, "4	");
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
	const allNews1 = getNewsDataProps(useAllNewsData1.rawData, props.lang, "/News/News-01", "", categoryDict, tagDict);
	const allNews2 = getNewsDataProps(useAllNewsData2.rawData, props.lang, "/News/News-02", "", categoryDict, tagDict);
	const allNews3 = getNewsDataProps(useAllNewsData3.rawData, props.lang, "/News/News-03", "", categoryDict, tagDict);
	const allNews4 = getNewsDataProps(useAllNewsData4.rawData, props.lang, "/News/News-04", "", categoryDict, tagDict);
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
		<div className="col-xxl-6 col-xl-c2 col-12 Newsii_section Layout_Padding_4_top Layout_Padding_5_bottom">
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="container-customize4 bg-layer p-3">
						<div className="row">
							<div className="col-12">
								{/* 標題 start（對標 prototype：置中 + margin class） */}
								<div className="headDiv mb-3 mt-1 d-flex justify-content-center">
									<span className="headDiv-txt">{props.lang === "en" ? "News" : "最新消息"}</span>
									<span className="headDiv-subtxt">{props.lang === "en" ? "" : "News"}</span>
								</div>
								{/* 標題 end */}
							</div>

							<div className="V-nav-tabs-content-box" id="Horizontal">
								<div className="Horizontal nav-tabs-list">
									<ul className="nav nav-tabs" id="V-nav-tab" role="tablist">
										<li className="nav-item" role="presentation">
											<a
												className={getTabLinkClass("01")}
												id="V-Tabs__01"
												data-bs-toggle="tab"
												href="#V-navTabs-01-content"
												role="tab"
												aria-controls="V-navTabs-01-content"
												aria-selected={activeTab === "01"}
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
													id="V-navTabs-01-content"
													role="tabpanel"
												>
													<div className="News_mainDIV">
														<ul className="ListNews">
															<GetData lang={props.lang} prop={allNews1}></GetData>
														</ul>

														{/* 對標 prototype：Btn_a / BtnBox（大寫 B） */}
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
																			<img alt="" src={more_d} />
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
												className={getTabLinkClass("02")}
												id="V-Tabs__02"
												data-bs-toggle="tab"
												href="#V-navTabs-02-content"
												role="tab"
												aria-controls="V-navTabs-02-content"
												aria-selected={activeTab === "02"}
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
													id="V-navTabs-02-content"
													role="tabpanel"
												>
													<div className="News_mainDIV">
														<ul className="ListNews">
															<GetData lang={props.lang} prop={allNews2}></GetData>
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
																			<img alt="" src={more_d} />
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
												className={getTabLinkClass("03")}
												id="V-Tabs__03"
												data-bs-toggle="tab"
												href="#V-navTabs-03-content"
												role="tab"
												aria-controls="V-navTabs-03-content"
												aria-selected={activeTab === "03"}
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
													id="V-navTabs-03-content"
													role="tabpanel"
												>
													<div className="News_mainDIV">
														<ul className="ListNews">
															<GetData lang={props.lang} prop={allNews3}></GetData>
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
																			<img alt="" src={more_d} />
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
												className={getTabLinkClass("04")}
												id="V-Tabs__04"
												data-bs-toggle="tab"
												href="#V-navTabs-04-content"
												role="tab"
												aria-controls="V-navTabs-04-content"
												aria-selected={activeTab === "04"}
												tabIndex={0}
												type="button"
												onClick={onTabClick("04")}
											>
												{categoryDict["4"] ?? categoryDict[4] ?? ""}
											</a>
											<div className="tab-content" id="V-nav-tabContent"><div
												aria-labelledby="V-Tabs__04"
												className={getPaneClass("04")}
												id="V-navTabs-04-content"
												role="tabpanel"
											>
												<div className="News_mainDIV">
													<ul className="ListNews">
														<GetData lang={props.lang} prop={allNews4}></GetData>
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
																		<img alt="" src={more_d} />
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

								{/* ✅ tab-content 一次放在 ul 外面（維持正確 DOM） */}

								{/* tab-content end */}
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


type TagKey = "top" | "new" | "hot";
const GetData = (props: { lang: Lang; prop: getDataProp[] }) => {
	// 宣告變數
	const list = props.prop ?? [];



	// return：對標 prototype 的 News_item DOM
	return (
		<>
			{list.map((p, idx) => {

				// 宣告變數：你原本的判斷邏輯照舊（這裡只示意）
				const isTop = Boolean(p.contentStatus & 1);   // 置頂（依你原本 bitmask）
				const isNew = Boolean(p.contentStatus & 2);   // 熱門（依你原本 bitmask）
				const isHot = isWithinLastNDaysFromMD(Number(p.month), Number(p.date))

				const tagText: Record<TagKey, string> = props.lang === 'zh-tw'
					? { top: "置頂", new: "最新", hot: "熱門" }
					: { top: "TOP", new: "NEW", hot: "HOT" };

				const tagEnabled: Record<TagKey, boolean> = {
					top: isTop,
					new: isHot, // 「最新」：最近 N 天
					hot: isNew, // 「熱門」：bitmask
				};
				const tagKeys = (["top", "new", "hot"] as const).filter((k) => tagEnabled[k]).slice(0, 2);

				const href = `${p.redir}/${p.announceInternalId}`;

				return (
					<li key={`${p.announceInternalId}-${idx}`} className="News_item">
						<LangLink to={href} className="item-inner" tabIndex={0} title={p.title}>
							<div className="rightBox">
								<div className="card_catDiv">
									{/* a-left：日期（prototype 放左邊，純文字，不要 clock icon） */}
									<div className="a-left order-1">
										<div className="card_time">{`${p.year}-${String(p.month).padStart(2, "0")}-${String(p.date).padStart(2, "0")}`}</div>
									</div>

									{/* card_titleDiv：標題（prototype 放在 card_catDiv 內） */}
									<div className="card_titleDiv order-xl-2 order-3">
										<div className="card_title">{p.title}</div>
									</div>

									{/* a-right：狀態（置頂/最新） */}
									<div className="a-right order-xl-3 order-2">
										<div className="CustomState">
											{tagKeys.map((k) => (
												<div key={k} className="icon-small top-bg">
													{tagText[k]}
												</div>
											))}
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


const DAY_MS = 24 * 60 * 60 * 1000;
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