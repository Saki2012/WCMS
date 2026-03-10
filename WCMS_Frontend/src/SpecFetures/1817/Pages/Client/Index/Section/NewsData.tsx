import { Link } from 'react-router-dom';
import AnnouncementProvider from '@/Features/Hooks/BizFunc/WebManagement/Announcement_Api';
import CategoryProvider from '@/Features/Hooks/BizFunc/WebManagement/Category_Api';
import TagProvider from '@/Features/Hooks/BizFunc/WebManagement/Tag_Api';
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { LibMerge } from '@/SysCore/Utils/Library/LibMergeData';
import { useNow } from '@/SysCore/Utils/Library/LibHook';
import { type Lang } from '@/SysCore/i18n/lang';
import { PGID } from '@/Features/Hooks/Common/ProgId';
import img from "@/SpecFetures/1817/Assets/Client/images/line_title.svg"
import { LangLink } from '@/SysCore/i18n/LangLink';

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
				`${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Lang}`,
				`${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Title}`,
				`${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.SubTitle}`,
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
				`${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.SubTitle}`,
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
			Condition: `${SchemaFields.TagDataFields.ProgId} = ${PGID.Announcement}`,
			PageNumber: 0,
			PageSize: 0,
		}),
		enabled: true,
		deps: [],
	});
};


export const NewsData = (props: { lang: Lang }) => {
	const cats = "Category20251125001,Category20251125002"
	const useTopAllNewsData1 = useTopAnnouncementList(cats);
	const useAllNewsData1 = useAnnouncementList(cats);
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
	return (
		<section className="Newsii_section Layout_Padding_0_top + Layout_Padding_3_bottom + bg-custom-Customize_color">
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="container-customize3 image-layer">
						<div className="row">
							<div className="col-12">
								<div className="col-12">
									<div className="headDiv mb-sm-5 mb-4">
										<span className="headDiv-subtxt">News</span>
										<img alt="標題裝飾線條圖示" className="headDiv-title-line" src={img} />
										<span className="headDiv-txt">最新消息</span>
									</div>
								</div>
								<div className="H-nav-tabs-content-box" id="Horizontal">
									<div className="tab-content" id="H-nav-tabContent">
										<div aria-labelledby="V-Tabs__01" className="tab-pane fade show active" id="H-navTabs-01" role="tabpanel">
											<div className="News_mainDIV">
												<ul className="ListNews">
													<GetData data={allNews1} lang={props.lang}></GetData>
												</ul>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div className="btn-w100-wrapper justify-content-center">
								<div className="customize_btn">
									<LangLink className="Btn_a" to="/News/News-01" role="button" tabIndex={0} target="_self" title="更多系所公告" type="button">
										<div className="BtnBox">
											<span>More View</span>
											<span className="ml-2">+</span>
										</div>
									</LangLink>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

interface getDataProp { redir: string; announceInternalId: string; title: string; subTitle: string; date: string; month: string; year: string; monthNum: number; tagName: string; categoryName: string; contentStatus: number; internalId: string }

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
			subTitle: item.AnnouncementDetail?.find(p => p.Lang === lang)?.SubTitle ?? "",
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



const GetData = (prop: { data: getDataProp[]; lang: Lang }) => {
	return (
		<>
			{prop.data.map((item) => {
				return (
					<li className="News_item" key={item.announceInternalId} >
						<LangLink to={`${item.redir}/${item.internalId}`} title={item.title} tabIndex={0} className="item-inner">
							<div className="leftBox">
								<div className="news-date-box">
									<div className="year">{item.year}</div>
									<div className="mm-dd">{item.month}.{item.date}</div>
								</div>
							</div>
							<div className="rightBox">
								<div className="card_catDiv">
									<div className="a-left">
										<div className="card_cat">
											<div className="card_cat_link">
												<span className="cat_title">{item.categoryName}</span>
											</div>
										</div>
										<div className="CustomState">
											{isWithinLastNDaysFromMD(Number(item.monthNum), Number(item.date)) && (<div className="icon-small new-bg" >最新</div>)}
											{item.contentStatus != 0 && (
												<>
													{Boolean(item.contentStatus & 1) && (<div className="icon-small top-bg">置頂</div>)}
													{Boolean(item.contentStatus & 2) && (<div className="icon-small hot-bg">熱門</div>)}
												</>
											)}
										</div>
									</div>
									<div className="a-right + d-none">
										<div className="card_time">
											<i aria-hidden="true" className="fa fa-clock-o" style={{ marginRight: "3px", }} />
											2023-11-10
										</div>
									</div>
								</div>
								<div className="card_titleDiv">
									<div className="card_title">
										{item.title}
									</div>
									<div className="card_introduction">
										{item.subTitle}
									</div>
									<span className="link-arrow">
										<i className="fas fa-long-arrow-alt-right" />
										<span className="sr-only">前往</span>
									</span>
								</div>
							</div>
						</LangLink>
					</li>
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