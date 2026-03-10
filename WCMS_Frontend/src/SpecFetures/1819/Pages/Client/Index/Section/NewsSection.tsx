import type { Lang } from "@/SysCore/i18n/lang";
import TitleLine from "@/SpecFetures/1819/Assets/Client/images/line_title.svg";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import type { components } from "@/types/api";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import { AnnouncementDetailFields, AnnouncementFields } from "@/types/SchemaFields";
import { useMemo } from "react";
import AnnouncementProvider from "@/Features/Hooks/BizFunc/WebManagement/Announcement_Api";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";

type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

/** 最新消息（Prototype: .Newsii_section） */
export const NewsSection = (props: { lang: Lang }) => {
    const pdvr = useMemo(() => { return AnnouncementProvider() }, [])
    const categoryId = "Category20260113001";
    // ✅ 置頂優先 + 非置頂補滿，最多 5 筆
    const useTopNews = useNewsFetch(pdvr, props.lang, categoryId, "top", 5);
    const useNormalNews = useNewsFetch(pdvr, props.lang, categoryId, "normal", 5);
    const merged = useMemo(() => {
        return takeTopThenFill(useTopNews.rawData, useNormalNews.rawData, 5);
    }, [useTopNews.rawData, useNormalNews.rawData]);

    if (!merged || merged.length === 0) return null;
    return (
        <>
            <div className="Down-Line" />
            <section className="Newsii_section + Layout_Padding_3_top + Layout_Padding_3_bottom">
                <div className="Mask-DivBox">
                    <div className="customizeBox">
                        <div className="container-customize2">
                            <div className="row">
                                <div className="col-12">
                                    <div className="col-12">
                                        <div className="headDiv mb-sm-5 mb-4">
                                            <span className="headDiv-subtxt">News</span>
                                            <img className="headDiv-title-line" src={TitleLine} alt="標題裝飾線條圖示" />
                                            <span className="headDiv-txt">最新消息</span>
                                        </div>
                                    </div>
                                    <div id="Horizontal" className="H-nav-tabs-content-box">
                                        <div className="tab-content" id="H-nav-tabContent">
                                            <div id="H-navTabs-01" className="tab-pane fade show active" role="tabpanel" aria-labelledby="V-Tabs__01">
                                                <div className="News_mainDIV">
                                                    <ul className="ListNews">
                                                        {merged.map((data) => {
                                                            const InternalId = data.Announcement?.InternalId
                                                            const startRaw = data.Announcement?.Validate_Start;
                                                            const startDt = startRaw ? new Date(startRaw) : null;
                                                            const year = startDt ? String(startDt.getFullYear()) : "";
                                                            const month = startDt ? String(startDt.getMonth() + 1).padStart(2, "0") : "";
                                                            const day = startDt ? String(startDt.getDate()).padStart(2, "0") : "";
                                                            const dt = data.AnnouncementDetail?.find(p => p.Lang === props.lang)

                                                            return (
                                                                <li key={InternalId} className="News_item">
                                                                    <LangNavLink to={`/news/${InternalId}`} className="item-inner" target="_self" tabIndex={0}>
                                                                        <div className="leftBox">
                                                                            <div className="news-date-box">
                                                                                <div className="year">{year}</div>
                                                                                <div className="mm-dd">{`${month}.${day}`}</div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="rightBox">
                                                                            <div className="card_catDiv">
                                                                                <div className="a-left">
                                                                                    <div className="card_cat">
                                                                                        <div className="card_cat_link">
                                                                                            <i className="fas fa-tasks-alt me-2" aria-hidden="true" />
                                                                                            <span className="cat_title">系所公告</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="CustomState">
                                                                                        {isWithinLastNDaysFromMD(Number(month), Number(day)) && (
                                                                                            <div className="icon-small new-bg" role="status" aria-label="最新">最新</div>
                                                                                        )}
                                                                                        {data.Announcement?.ContentStatus != 0 && (
                                                                                            <>
                                                                                                {Boolean(data.Announcement?.ContentStatus ?? 0 & 1) && (<div className="icon-small top-bg">置頂</div>)}
                                                                                                {Boolean(data.Announcement?.ContentStatus ?? 0 & 2) && (<div className="icon-small hot-bg">熱門</div>)}
                                                                                            </>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="card_titleDiv">
                                                                                <div className="card_title">
                                                                                    {dt?.Title}
                                                                                </div>
                                                                                <span className="link-arrow">
                                                                                    <i className="fas fa-long-arrow-alt-right" aria-hidden="true" />
                                                                                    <span className="sr-only">前往</span>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </LangNavLink>
                                                                </li>
                                                            )
                                                        })}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="btn-w100-wrapper justify-content-center">
                                        <div className="customize_btn">
                                            <LangNavLink to={"/news/List"} className="Btn_a" role="button" target="_self" title="更多系所公告">
                                                <div className="BtnBox">
                                                    <span>VIEW MORE</span>
                                                    <span className="ml-2">
                                                        <i className="fas fa-chevron-circle-right" aria-hidden="true" />
                                                    </span>
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
        </>
    );
};



type NewsFetchMode = "top" | "normal";

/** ✅ 撈公告清單（mode: top / normal） */
const useNewsFetch = (
    pdvr: IDataProvider<AnnouncementSet>,
    lang: Lang,
    categoryId: string,
    mode: NewsFetchMode,
    pageSize: number = 5
) => {
    const condition = useMemo(() => {
        let cond = "";

        // ✅ mode 條件
        if (mode === "top") {
            cond = LibMerge(" And ", false, cond, `${AnnouncementFields.ContentStatus} & 1`);
        } else {
            cond = LibMerge(" And ", false, cond, `${AnnouncementFields.ContentStatus} !& 4`); // 排除隱藏
            cond = LibMerge(" And ", false, cond, `${AnnouncementFields.ContentStatus} !& 1`); // 排除置頂
        }

        // ✅ 類別
        cond = LibMerge(" And ", false, cond, `${AnnouncementFields.Categories} HasAll ${categoryId}`);

        // ✅ 明細語系/標題
        cond = LibMerge(
            " And ",
            false,
            cond,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang} = ${lang}`
        );
        cond = LibMerge(
            " And ",
            false,
            cond,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} != ''`
        );

        return cond;
    }, [categoryId, lang, mode]);

    return useFetchGridListData<AnnouncementSet>({
        getModelDisplayName: () => pdvr.getModelDisplayName(),
        fetchList: (cond) => pdvr.fetchList(cond),
        fetchListCount: (cond) => pdvr.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                AnnouncementFields.InternalId,
                AnnouncementFields.ContentStatus,
                AnnouncementFields.Validate_Start,
                AnnouncementFields.Validate_End,
                `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
                `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
            ],
            Condition: condition,
            OrderBy: [{ Col: `${AnnouncementFields.Validate_Start}`, Desc: true }],
            PageNumber: 1,
            PageSize: pageSize,
        }),
        enabled: true,
        deps: [categoryId, lang, mode],
    });
};

const takeTopThenFill = (
    top: AnnouncementSet[] | undefined,
    rest: AnnouncementSet[] | undefined,
    limit: number = 5
): AnnouncementSet[] => {
    const getKey = (x: AnnouncementSet) => x.Announcement?.InternalId ?? String(x.Announcement?.AnnouncementId ?? "");

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