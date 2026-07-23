import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";
import {
    buildClientCategoryTextDict as buildCategoryDict,
    buildClientListInitial as toListInitial,
    buildClientTagTextDict as buildTagDict,
} from "@/Features/Pages/Client/Index/HomePage_Helper";
import img from "@/SpecFetures/1817/Assets/Client/images/line_title.svg";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { findTextByKey } from "@/SysCore/Utils/Library/LibData";
import { formatDateParts as formatDate } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { useMemo } from "react";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type CategoryFormModel = components["schemas"]["Category"];
type TagFormModel = components["schemas"]["TagData"];
interface NewsDataProps
{
    lang: Lang;
    listParam: QueryListParam;
    cateParam: QueryListParam;
    tagParam: QueryListParam;
    initialList: AnnouncementSet[];
    initialCategories: CategoryFormModel[];
    initialTags: TagFormModel[];
}
interface NewsItemViewModel
{
    redir: string;
    announceInternalId: string;
    title: string;
    subTitle: string;
    date: string;
    month: string;
    year: string;
    monthNum: number;
    tagName: string;
    categoryName: string;
    contentStatus: number;
    internalId: string;
}
const DAY_MS = 24 * 60 * 60 * 1000;
// #endregion

// #region Public
export const NewsData = (props: NewsDataProps) =>
{
    // 宣告變數：公告列表 hydration
    const newsQuery = useNewsList({ listParam: props.listParam, initialList: props.initialList });

    // 宣告變數：分類 / 標籤 hydration
    const dicts = useCategoryTagDict({
        lang: props.lang,
        cateParam: props.cateParam,
        tagParam: props.tagParam,
        initialCategories: props.initialCategories,
        initialTags: props.initialTags,
    });

    // 宣告變數：畫面資料
    const allNews = useMemo(() =>
    {
        return getNewsDataProps(newsQuery.data ?? [], props.lang, "/News/News-01", dicts.categoryDict, dicts.tagDict);
    }, [newsQuery.data, props.lang, dicts.categoryDict, dicts.tagDict]);

    // return：維持 1817 首頁版型
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
                                                    <GetData data={allNews} lang={props.lang} />
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="btn-w100-wrapper justify-content-center">
                                <div className="customize_btn">
                                    <LangLink
                                        className="Btn_a"
                                        to="/News/News-01"
                                        role="button"
                                        tabIndex={0}
                                        target="_self"
                                        title={props.lang === "en" ? "More News" : "更多系所公告"}
                                        type="button"
                                    >
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
// #endregion

// #region Private
const splitCsvIds = (value: string | null | undefined): string[] =>
{
    // return：把 csv id 字串拆成陣列
    return (value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
};

const joinDisplayNames = (ids: string[], dict: Record<string, string>): string =>
{
    // return：依字典把 id 轉成顯示名稱
    return ids.map((id) => dict[id] ?? "").filter(Boolean).join(", ");
};

const getNewsDataProps = (
    newsData: AnnouncementSet[],
    lang: Lang,
    redir: string,
    categoryDict: Record<string, string>,
    tagDict: Record<string, string>,
): NewsItemViewModel[] =>
{
    // return：公告資料轉成畫面 props
    return newsData.slice(0, 6).map((item) =>
    {
        const categoryIds = splitCsvIds(item.Announcement?.Categories);
        const tagIds = splitCsvIds(item.Announcement?.Tags);
        const contentStatus = item.Announcement?.ContentStatus ?? 0;
        const validateStart = item.Announcement?.Validate_Start ?? "";
        const date = formatDate(validateStart);
        const monthNum = new Date(validateStart).getUTCMonth() + 1;
        const internalId = item.Announcement?.InternalId ?? "";

        return {
            redir,
            announceInternalId: internalId,
            title: findTextByKey(item.AnnouncementDetail, (p) => p?.Lang, lang, (p) => p?.Title),
            subTitle: findTextByKey(item.AnnouncementDetail, (p) => p?.Lang, lang, (p) => p?.SubTitle),
            date: date.day,
            month: date.month,
            year: date.year,
            monthNum,
            tagName: joinDisplayNames(tagIds, tagDict),
            categoryName: joinDisplayNames(categoryIds, categoryDict),
            contentStatus,
            internalId,
        };
    });
};

const isWithinLastNDaysFromMD = (month1to12?: number, day1to31?: number, n: number = 8): boolean =>
{
    // 宣告變數：缺值直接不是最新
    if (!month1to12 || !day1to31) return false;

    const now = new Date();
    const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    let year = now.getUTCFullYear();
    let candidateUTC = Date.UTC(year, month1to12 - 1, day1to31);

    if (candidateUTC > nowUTC)
    {
        year -= 1;
        candidateUTC = Date.UTC(year, month1to12 - 1, day1to31);
    }

    const diffDays = Math.floor((nowUTC - candidateUTC) / DAY_MS);

    return diffDays >= 0 && diffDays <= n;
};

const useNewsList = (props: { listParam: QueryListParam; initialList: AnnouncementSet[]; }) =>
{
    // 宣告變數：adapter / initial
    const adapter = useMemo(() => AnnouncementAdapter(), []);
    const initial = useMemo(() =>
    {
        return toListInitial(props.listParam, props.initialList ?? []);
    }, [props.listParam, props.initialList]);

    // return：首頁公告列表
    return adapter.hooks.useQueryList({
        condition: props.listParam,
        initial,
        deps: [props.listParam.Condition ?? "", props.listParam.PageNumber ?? 0, props.listParam.PageSize ?? 0],
    });
};

const useCategoryTagDict = (
    props: { lang: Lang; cateParam: QueryListParam; tagParam: QueryListParam; initialCategories: CategoryFormModel[]; initialTags: TagFormModel[]; },
) =>
{
    // 宣告變數：adapter / initial
    const cateAdapter = useMemo(() => CategoryAdapter(), []);
    const tagAdapter = useMemo(() => TagAdapter(), []);

    const cateInitial = useMemo(() =>
    {
        return toListInitial(props.cateParam, props.initialCategories ?? []);
    }, [props.cateParam, props.initialCategories]);

    const tagInitial = useMemo(() =>
    {
        return toListInitial(props.tagParam, props.initialTags ?? []);
    }, [props.tagParam, props.initialTags]);

    // 執行 function：分類 / 標籤 hydration query
    const cateQuery = cateAdapter.hooks.useQueryList({ condition: props.cateParam, initial: cateInitial, deps: [props.cateParam.Condition ?? ""] });

    const tagQuery = tagAdapter.hooks.useQueryList({ condition: props.tagParam, initial: tagInitial, deps: [props.tagParam.Condition ?? ""] });

    // 宣告變數：字典
    const categoryDict = useMemo(() =>
    {
        return buildCategoryDict(cateQuery.data ?? [], props.lang);
    }, [cateQuery.data, props.lang]);

    const tagDict = useMemo(() =>
    {
        return buildTagDict(tagQuery.data ?? [], props.lang);
    }, [tagQuery.data, props.lang]);

    // return：畫面對照字典
    return { categoryDict, tagDict };
};

const GetData = (props: { data: NewsItemViewModel[]; lang: Lang; }) =>
{
    // return：公告列表 DOM
    return (
        <>
            {props.data.map((item) =>
            {
                return (
                    <li className="News_item" key={item.announceInternalId}>
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
                                            {isWithinLastNDaysFromMD(Number(item.monthNum), Number(item.date)) && <div className="icon-small new-bg">最新</div>}

                                            {item.contentStatus !== 0 && (
                                                <>
                                                    {Boolean(item.contentStatus & 1) && <div className="icon-small top-bg">置頂</div>}

                                                    {Boolean(item.contentStatus & 2) && <div className="icon-small hot-bg">熱門</div>}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="a-right + d-none">
                                        <div className="card_time">
                                            <i aria-hidden="true" className="fa fa-clock-o" style={{ marginRight: "3px" }} />
                                            2023-11-10
                                        </div>
                                    </div>
                                </div>

                                <div className="card_titleDiv">
                                    <div className="card_title">{item.title}</div>

                                    <div className="card_introduction">{item.subTitle}</div>

                                    <span className="link-arrow">
                                        <i className="fas fa-long-arrow-alt-right" />
                                        <span className="sr-only">前往</span>
                                    </span>
                                </div>
                            </div>
                        </LangLink>
                    </li>
                );
            })}
        </>
    );
};
// #endregion
