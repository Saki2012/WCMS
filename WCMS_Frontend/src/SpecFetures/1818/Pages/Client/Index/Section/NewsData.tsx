import { IndexLabel } from "@/SpecFetures/1818/Pages/Client//Index/Section/IndexLabelText";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import type { components } from "@/types/api";
import { useMemo } from "react";

import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";

type QueryListParam = components["schemas"]["QueryListParam"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];

const toListInitial = <TArgs, TItem>(args: TArgs, data: TItem[]) =>
{
    // return：符合 adapter hook 的 initial 型別
    return { args, apiRes: { IsSuccess: true, Data: data, SysMessage: [] } };
};

const buildCategoryDict = (list: CategoryDataSet[], lang: Lang): Record<string, string> =>
{
    // 宣告變數
    const pairs = list.map((cat) =>
    {
        const id = cat.Category?.CategoryId ?? "";
        const name = cat.CategoryDetail?.find((p) => p.Lang === lang)?.CategoryName ?? "";
        return [id, name] as const;
    });

    // return
    return Object.fromEntries(pairs.filter(([id]) => Boolean(id)));
};

const buildTagDict = (list: TagSet[], lang: Lang): Record<string, string> =>
{
    // 宣告變數
    const pairs = list.map((t) =>
    {
        const id = t.TagData?.TagId ?? "";
        const name = t.TagDetail?.find((p) => p.Lang === lang)?.TagName ?? "";
        return [id, name] as const;
    });

    // return
    return Object.fromEntries(pairs.filter(([id]) => Boolean(id)));
};

export const NewsData = (props: {
    lang: Lang;

    newsTopParam: QueryListParam;
    newsListParam: QueryListParam;
    cateParam: QueryListParam;
    tagParam: QueryListParam;

    initialTopList: AnnouncementSet[];
    initialList: AnnouncementSet[];
    initialCategories: CategoryDataSet[];
    initialTags: TagSet[];
}) =>
{
    // 宣告變數：adapters（CSR 用）
    const announceAdapter = useMemo(() => AnnouncementAdapter(), []);
    const cateAdapter = useMemo(() => CategoryAdapter(), []);
    const tagAdapter = useMemo(() => TagAdapter(), []);

    // 宣告變數：initial（必須 memo，避免每次 render 產生新物件造成重置）
    const topInitial = useMemo(
        () => toListInitial(props.newsTopParam, props.initialTopList ?? []),
        [props.newsTopParam, props.initialTopList],
    );
    const listInitial = useMemo(
        () => toListInitial(props.newsListParam, props.initialList ?? []),
        [props.newsListParam, props.initialList],
    );
    const cateInitial = useMemo(
        () => toListInitial(props.cateParam, props.initialCategories ?? []),
        [props.cateParam, props.initialCategories],
    );
    const tagInitial = useMemo(
        () => toListInitial(props.tagParam, props.initialTags ?? []),
        [props.tagParam, props.initialTags],
    );

    // 執行 function：CSR hooks 接手（SSR 有 initial → 不會因 provider 爆）
    const useTopList = announceAdapter.hooks.useQueryList({
        condition: props.newsTopParam,
        initial: topInitial,
        deps: [props.newsTopParam.Condition ?? ""],
    });

    const useList = announceAdapter.hooks.useQueryList({
        condition: props.newsListParam,
        initial: listInitial,
        deps: [props.newsListParam.Condition ?? ""],
    });

    const useCategoryData = cateAdapter.hooks.useQueryList({
        condition: props.cateParam,
        initial: cateInitial,
        deps: [props.cateParam.Condition ?? ""],
    });

    const useTagData = tagAdapter.hooks.useQueryList({
        condition: props.tagParam,
        initial: tagInitial,
        deps: [props.tagParam.Condition ?? ""],
    });

    // 宣告變數：資料整理（置頂優先補滿）
    const allNewsRawData1 = useMemo(() =>
    {
        return takeTopThenFill(useTopList.data ?? [], useList.data ?? [], 6);
    }, [useTopList.data, useList.data]);

    const categoryDict = useMemo(() =>
    {
        return buildCategoryDict(useCategoryData.data ?? [], props.lang);
    }, [useCategoryData.data, props.lang]);

    const tagDict = useMemo(() =>
    {
        return buildTagDict(useTagData.data ?? [], props.lang);
    }, [useTagData.data, props.lang]);

    const allNews1 = useMemo(() =>
    {
        return getNewsDataProps(
            allNewsRawData1,
            props.lang,
            "/announcement/announcement-news",
            "",
            categoryDict,
            tagDict,
        );
    }, [allNewsRawData1, props.lang, categoryDict, tagDict]);

    // return：DOM 結構維持原本
    return (
        <section className="Newsii_section Layout_Padding_1_top Layout_Padding_1_bottom bg-white">
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="iMG-Shape-0" />
                    <div className="container-customize3">
                        <div className="row">
                            <div className="offset-md-5 offset-sm-3 offset-1 col-md-6 col-sm-6 col-10">
                                <div className="headDiv mb-lg-5 mb-4">
                                    <span className="headDiv-txt-4 tw">{IndexLabel(props.lang).NewsTitle}</span>
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="H-nav-tabs-content-box" id="Horizontal">
                                    <div className="tab-content" id="H-nav-tabContent">
                                        <div
                                            aria-labelledby="H-Tabs__01"
                                            className="tab-pane fade show active"
                                            id="H-navTabs-01"
                                            role="tabpanel"
                                        >
                                            <div className="News_mainDIV">
                                                <ul className="ListNews">
                                                    <GetData prop={allNews1}></GetData>
                                                </ul>
                                                <div className="btn-w100-wrapper justify-content-center">
                                                    <div className="customize_btn">
                                                        <LangNavLink
                                                            className="Btn_a"
                                                            to="/announcement/announcement-news"
                                                            role="button"
                                                            tabIndex={0}
                                                            target="_self"
                                                            title={IndexLabel(props.lang).MoreInfo}
                                                            type="button"
                                                        >
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
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

interface getDataProp
{
    redir: string;
    announceInternalId: string;
    title: string;
    content: string;
    date: string;
    month: string;
    year: string;
    monthNum: number;
    tagName: string;
    categoryName: string;
    contentStatus: number;
    internalId: string;
}

const getNewsDataProps = (
    newsData: AnnouncementSet[],
    lang: string,
    redir: string,
    targetCategoryId: string,
    categoryDict: Record<string, string>,
    tagDict: Record<string, string>,
) =>
{
    // 宣告變數
    const top6 = pickNewsByCategories(newsData, targetCategoryId, 6, "any");
    const resultProps: getDataProp[] = [];

    // 執行 function
    top6.map((item) =>
    {
        const categoryIds = (item.Announcement?.Categories ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        const categoryName = categoryIds.map((id) => categoryDict[id] ?? "").filter(Boolean).join(", ");
        const tags = (item.Announcement?.Tags ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        const tagsName = tags.map((id) => tagDict[id] ?? "").filter(Boolean).join(", ");
        const contentStatus = item.Announcement?.ContentStatus ?? 0;
        const date = formatDate(item.Announcement?.Validate_Start ?? "");
        const monthNum = Number(new Date(item.Announcement?.Validate_Start ?? "").getUTCMonth() + 1);
        const InternalId = item.Announcement?.InternalId ?? "";

        resultProps.push({
            redir: redir,
            announceInternalId: item.Announcement?.InternalId ?? "",
            title: item.AnnouncementDetail?.find((p) => p.Lang === lang)?.Title ?? "",
            content: item.AnnouncementDetail?.find((p) => p.Lang === lang)?.Content ?? "",
            date: date.day,
            month: date.month,
            year: date.year,
            monthNum: monthNum,
            contentStatus: contentStatus,
            tagName: tagsName,
            categoryName: categoryName,
            internalId: InternalId,
        });
    });

    // return
    return resultProps;
};

const pickNewsByCategories = <T extends { Announcement?: { Categories?: string | null | undefined; }; }>(
    newsData: T[] | undefined,
    categories: string | string[],
    take: number = 6,
    mode: "any" | "all" = "any",
): T[] =>
{
    const target = new Set(
        (Array.isArray(categories) ? categories : String(categories).split(",")).map((s) => s.trim()).filter(Boolean),
    );
    if (!newsData || target.size === 0) return (newsData ?? []).slice(0, take);

    const result = newsData.filter((item) =>
    {
        const tokens = (item.Announcement?.Categories ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        if (tokens.length === 0) return false;
        return mode === "all" ? [...target].every((t) => tokens.includes(t)) : tokens.some((t) => target.has(t));
    });

    return result.slice(0, take);
};

const formatDate = (dateStr: string) =>
{
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString();
    return { day, month, year };
};

const GetData = ({ prop }: { prop: getDataProp[]; }) =>
{
    return (
        <>
            {prop.map((item) =>
            {
                return (
                    <li className="News_item" key={item.announceInternalId}>
                        <LangLink
                            to={`${item.redir}/${item.internalId}`}
                            title={item.title}
                            tabIndex={0}
                            className="item-inner"
                        >
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
                                                <div className="icon-small new-bg">最新</div>
                                            )}
                                            {item.contentStatus != 0 && (
                                                <>
                                                    {Boolean(item.contentStatus & 1) && (
                                                        <div className="icon-small top-bg">置頂</div>
                                                    )}
                                                    {Boolean(item.contentStatus & 2) && (
                                                        <div className="icon-small hot-bg">熱門</div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="a-right">
                                        <div className="card_time">
                                            {item.year}-{item.month}-{item.date}
                                        </div>
                                    </div>
                                </div>
                                <div className="card_titleDiv">
                                    <div className="card_title">{item.title}</div>
                                </div>
                                <div className="card_subtitleDiv">
                                    <div className="card_subtitle">{/*item.content*/}</div>
                                </div>
                            </div>
                        </LangLink>
                    </li>
                );
            })}
        </>
    );
};

const DAY_MS = 24 * 60 * 60 * 1000;

const takeTopThenFill = (
    top: AnnouncementSet[] | undefined,
    rest: AnnouncementSet[] | undefined,
    limit: number = 3,
): AnnouncementSet[] =>
{
    const getKey = (x: AnnouncementSet) => x.Announcement?.InternalId ?? String(x.Announcement?.AnnouncementId ?? "");
    const seen = new Set<string>();
    const out: AnnouncementSet[] = [];
    for (const it of top ?? [])
    {
        const k = getKey(it);
        if (!seen.has(k) && out.length < limit)
        {
            seen.add(k);
            out.push(it);
        }
    }
    for (const it of rest ?? [])
    {
        if (out.length >= limit) break;
        const k = getKey(it);
        if (!seen.has(k))
        {
            seen.add(k);
            out.push(it);
        }
    }
    return out;
};

const isWithinLastNDaysFromMD = (month1to12?: number, day1to31?: number, n: number = 8): boolean =>
{
    if (!month1to12 || !day1to31) return false;
    const now = new Date();
    const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    let y = now.getUTCFullYear();
    let candidateUTC = Date.UTC(y, month1to12 - 1, day1to31);
    if (candidateUTC > nowUTC)
    {
        y -= 1;
        candidateUTC = Date.UTC(y, month1to12 - 1, day1to31);
    }
    const diffDays = Math.floor((nowUTC - candidateUTC) / DAY_MS);
    return diffDays >= 0 && diffDays <= n;
};
