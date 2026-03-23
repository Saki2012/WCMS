{/* // 最新消息 // */ }
import { Link } from 'react-router-dom';
import 'swiper/swiper-bundle.css';
import AnnouncementProvider from '@/Features/Hooks/BizFunc/WebManagement/Announcement_Api';
import type { components } from '@/types/api';
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]
import * as SchemaFields from "@/types/SchemaFields";
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import LoadingErrorHandler from '@/SysCore/Components/LoadingErrorHandler';
import CategoryProvider from '@/Features/Hooks/BizFunc/WebManagement/Category_Api';
import TagProvider from '@/Features/Hooks/BizFunc/WebManagement/Tag_Api';
import { LibMerge } from '@/SysCore/Utils/Library/LibMergeData';
import { PGID } from '@/Features/Hooks/Common/ProgId';
import { useNow } from '@/SysCore/Utils/Library/LibHook';
import bgImg from "@/SpecFetures/1810/Assets/Client/Images/bg/background-transparent-image_1920x600.png"
import { LangLink } from '@/SysCore/i18n/LangLink';
import type { Lang } from '@/SysCore/i18n/lang';


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

export const CategoryTabs = (props: { lang: Lang }) => {

    const useTopAllNewsData = useTopAnnouncementList();
    const useTopProjectData = useTopAnnouncementList("3,4,5");
    const useTopLegalData = useTopAnnouncementList("6");
    const useTopEvenData = useTopAnnouncementList("8,10");
    const useTopAwardData = useTopAnnouncementList("45");
    const useTopMediaData = useTopAnnouncementList("46");

    const useAllNewsData = useAnnouncementList();
    const useProjectData = useAnnouncementList("3,4,5");
    const useLegalData = useAnnouncementList("6");
    const useEvenData = useAnnouncementList("8,10");
    const useAwardData = useAnnouncementList("45");
    const useMediaData = useAnnouncementList("46");

    const allNewsRawData = takeTopThenFill(useTopAllNewsData.rawData, useAllNewsData.rawData, 6);
    const projectRawData = takeTopThenFill(useTopProjectData.rawData, useProjectData.rawData, 6);
    const legalRawData = takeTopThenFill(useTopLegalData.rawData, useLegalData.rawData, 6);
    const evenRawData = takeTopThenFill(useTopEvenData.rawData, useEvenData.rawData, 6);
    const awardRawData = takeTopThenFill(useTopAwardData.rawData, useAwardData.rawData, 6);
    const mediaRawData = takeTopThenFill(useTopMediaData.rawData, useMediaData.rawData, 6);


    const useCategoryData = useCategoryList();
    const useTagData = useTagList();
    const loadingList = [useAllNewsData.isLoading, useProjectData.isLoading, useLegalData.isLoading, useEvenData.isLoading, useAwardData.isLoading, useMediaData.isLoading, useCategoryData.isLoading, useTagData.isLoading,
    useTopAllNewsData.isLoading, useTopProjectData.isLoading, useTopLegalData.isLoading, useTopEvenData.isLoading, useTopAwardData.isLoading, useTopMediaData.isLoading,]
    const errorList = [useAllNewsData.error, useProjectData.error, useLegalData.error, useEvenData.error, useAwardData.error, useMediaData.error, useCategoryData.error, useTagData.error,
    useTopAllNewsData.error, useTopProjectData.error, useTopLegalData.error, useTopEvenData.error, useTopAwardData.error, useTopMediaData.error]


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

    const allNews = getNewsDataProps(allNewsRawData, props.lang, "/Allnews/All-announcement", "", categoryDict, tagDict);
    const project = getNewsDataProps(projectRawData, props.lang, "/Allnews/All-announcement", "", categoryDict, tagDict);
    const legal = getNewsDataProps(legalRawData, props.lang, "/Allnews/Regulatory-Announcements", "6", categoryDict, tagDict)
    const even = getNewsDataProps(evenRawData, props.lang, "/Allnews/Intramural-activities/In-school-activities", "", categoryDict, tagDict)
    const award = getNewsDataProps(awardRawData, props.lang, "/Allnews/Award-announcement", "45", categoryDict, tagDict)
    const media = getNewsDataProps(mediaRawData, props.lang, "/Allnews/Special-Topics-and-Media-Coverage", "46", categoryDict, tagDict)
    return (
        // <LoadingErrorHandler loadingList={loadingList} errorList={errorList} >
        <section className="Newsbox-section" style={{ backgroundImage: `url(${bgImg})` }}>
            <div className="Mask-DivBox layout_padding2 bg-white">
                <div className="customizeBox">
                    <div className="container-customize1">
                        <div className="row">
                            <div className="col-12 px-4 + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.1s">
                                {/* // 標題 start */}
                                <div className="Standard-TitleDiv div-header">
                                    <div className="TextDIV">
                                        <h3><span className="title-tw">最新消息<span className="c-line"></span></span></h3>
                                        <span className="en-box">
                                            <span className="title-en">Latest News</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="container-customize1">
                        <div className="row">
                            <div className="col-xxl-2 col-xl-3 col-lg-3 col-md-12 col-sm-12 col-12 + px-4">
                                <div className="tab_ulbox">
                                    <ul className="nav nav-tabs p-0 STYL0 + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.1s">
                                        <li className="nav-item">
                                            <a className="nav-link i1 active" data-bs-toggle="tab" href="#tab-1" tabIndex={6} title="最新公告" >最新公告</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link i2" data-bs-toggle="tab" href="#tab-2" tabIndex={7} title="計畫徵件" >計畫徵件</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link i3" data-bs-toggle="tab" href="#tab-3" tabIndex={8} title="法規公告" >法規公告</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link i4" data-bs-toggle="tab" href="#tab-4" tabIndex={9} title="活動公告" >活動公告</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link i5" data-bs-toggle="tab" href="#tab-5" tabIndex={10} title="獲獎公告" >獲獎公告</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link i6" data-bs-toggle="tab" href="#tab-6" tabIndex={11} title="專題與媒體報導" >專題與媒體報導</a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="col-xxl-10 col-xl-9 col-lg-9 col-md-12 col-sm-12 col-12 + px-4">
                                <div className="tab-content + animate__animated animate__slow wow bounceInUp" data-wow-delay="0.3s">

                                    <div className="tab-pane fade show active" id="tab-1">
                                        <div className="News_mainDIV">
                                            <div className="list-div">
                                                <ul className="m-news_list">
                                                    <GetData prop={allNews}></GetData>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="btn_Div justify-content-end">
                                            <div className="customize_btn my-3">
                                                <LangLink to="/Allnews/All-announcement" className="Btn_s1" tabIndex={6} title="更多最新公告">VIEW ALL<span className="ml-2">+</span></LangLink>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="tab-pane fade" id="tab-2">
                                        <div className="News_mainDIV">
                                            <div className="list-div">
                                                <ul className="m-news_list">
                                                    <GetData prop={project}></GetData>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="btn_Div justify-content-end">
                                            <div className="customize_btn my-3">
                                                <LangLink to="/Allnews/Project-solicitation/National-Science-Accounting" className="Btn_s1" tabIndex={7} title="更多計畫徵件">VIEW ALL<span className="ml-2">+</span></LangLink>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="tab-pane fade" id="tab-3">
                                        <div className="News_mainDIV">
                                            <div className="list-div">
                                                <ul className="m-news_list">
                                                    <GetData prop={legal}></GetData>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="btn_Div justify-content-end">
                                            <div className="customize_btn my-3">
                                                <LangLink to="/Allnews/Regulatory-Announcements" className="Btn_s1" tabIndex={8} title="更多法規公告">VIEW ALL<span className="ml-2">+</span></LangLink>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="tab-pane fade" id="tab-4">
                                        <div className="News_mainDIV">
                                            <div className="list-div">
                                                <ul className="m-news_list">
                                                    <GetData prop={even}></GetData>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="btn_Div justify-content-end">
                                            <div className="customize_btn my-3">
                                                <LangLink to="/Allnews/Intramural-activities/In-school-activities" className="Btn_s1" tabIndex={9} title="更多活動公告">VIEW ALL<span className="ml-2">+</span></LangLink>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="tab-pane fade" id="tab-5">
                                        <div className="News_mainDIV">
                                            <div className="list-div">
                                                <ul className="m-news_list">
                                                    <GetData prop={award}></GetData>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="btn_Div justify-content-end">
                                            <div className="customize_btn my-3">
                                                <LangLink to="/Allnews/Award-announcement" className="Btn_s1" tabIndex={10} title="更多獲獎公告">VIEW ALL<span className="ml-2">+</span></LangLink>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="tab-pane fade" id="tab-6">
                                        <div className="News_mainDIV">
                                            <div className="list-div">
                                                <ul className="m-news_list">
                                                    <GetData prop={media}></GetData>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="btn_Div justify-content-end">
                                            <div className="customize_btn my-3">
                                                <LangLink to="/Allnews/Special-Topics-and-Media-Coverage" className="Btn_s1" tabIndex={11} title="更多專題與媒體報導">VIEW ALL<span className="ml-2">+</span></LangLink>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        // </LoadingErrorHandler>
    )
};

interface getDataProp { redir: string; announceInternalId: string; title: string; date: string; month: string; monthNum: number; tagName: string; categoryName: string; contentStatus: number }
//最新公告
/**注:預計把targetCategoryId的參數拿掉，會影響邏輯 */
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
        resultProps.push({
            redir: redir,
            announceInternalId: item.Announcement?.InternalId ?? "",
            title: item.AnnouncementDetail?.find(p => p.Lang === lang)?.Title ?? "",
            date: date.day,
            month: date.month,
            monthNum: monthNum,
            contentStatus: contentStatus,
            tagName: tagsName,
            categoryName: categoryName,
        })
    })
    return resultProps;
}

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    return { day, month };
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


const GetData = ({ prop }: { prop: getDataProp[] }) => {
    return (
        <>
            {prop.map((item) => {
                return (
                    <li className="m-news_item" key={item.announceInternalId}>
                        <LangLink className="m-news_link" to={`${item.redir}/${item.announceInternalId}`} tabIndex={7} title={item.title}>
                            <div className="m-news_date">
                                <div className="d-big">{item.date}</div>
                                <div className="d-small">{item.month}</div>
                            </div>
                            <div className="m-news_content">
                                <div className="m-news_title">
                                    <div className="link-text">{item.title}</div>
                                </div>
                                <div className="m-news_detail">
                                    <div className="customstyle-hotop">
                                        {isWithinLastNDaysFromMD(Number(item.monthNum), Number(item.date)) && (
                                            <div className="icon-small new-bg" role="status" aria-label="最新">最新</div>
                                        )}
                                        {item.contentStatus != 0 && (
                                            <>
                                                {Boolean(item.contentStatus & 1) && (<div className="icon-small top-bg">置頂</div>)}
                                                {Boolean(item.contentStatus & 2) && (<div className="icon-small hot-bg">熱門</div>)}
                                            </>
                                        )}
                                    </div>
                                    <div className="category_box">
                                        <div className="m-news_category mr-3"> <i className="fa fa-tags" aria-hidden="true"></i>
                                            <div className="tags-text">{item.tagName}</div>
                                        </div>
                                        <div className="m-news_category"> <i className="fa fa-bookmark" aria-hidden="true"></i>
                                            <div className="tags-text">{item.categoryName}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </LangLink>
                    </li>)
            })}
        </>
    )
}


const DAY_MS = 24 * 60 * 60 * 1000;

// 置頂優先 → 去重 → 補滿到 limit（預設 6）
const takeTopThenFill = (
    top: AnnouncementSet[] | undefined,
    rest: AnnouncementSet[] | undefined,
    limit: number = 6
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