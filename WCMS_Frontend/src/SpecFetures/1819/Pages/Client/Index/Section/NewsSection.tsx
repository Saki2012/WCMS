import type { Lang } from "@/SysCore/i18n/lang";
import TitleLine from "@/SpecFetures/1819/Assets/Client/images/line_title.svg";
import type { components } from "@/types/api";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import { useMemo } from "react";
import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Announcement_Api";
import type { HomePageRawData } from "../HomePage_Loader";

type QueryListParam = components["schemas"]["QueryListParam"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

interface NewsSectionProps {
    lang: Lang;
    topParam: QueryListParam;
    listParam: QueryListParam;
    initialData: Pick<HomePageRawData, "newsTopList" | "newsList" | "newsMergedList">;
}

type InitialListCompat<TArgs, TItem> = {
    args: TArgs;
    apiRes: {
        IsSuccess: true;
        Data: TItem[];
        SysMessage: never[];
    };
};

const toListInitial = <TArgs, TItem>(args: TArgs, data: TItem[]): InitialListCompat<TArgs, TItem> => {
    // return：提供 adapter hook 的 initial 結構
    return {
        args,
        apiRes: {
            IsSuccess: true,
            Data: data,
            SysMessage: [],
        },
    };
};

const takeTopThenFill = (
    top: AnnouncementSet[] | undefined,
    rest: AnnouncementSet[] | undefined,
    limit: number = 5,
): AnnouncementSet[] => {
    // 宣告變數
    const getKey = (x: AnnouncementSet) => x.Announcement?.InternalId ?? String(x.Announcement?.AnnouncementId ?? "");
    const seen = new Set<string>();
    const out: AnnouncementSet[] = [];

    // 執行 function：先放置頂
    for (const it of top ?? []) {
        const key = getKey(it);
        if (seen.has(key) || out.length >= limit) continue;

        seen.add(key);
        out.push(it);
    }

    // 執行 function：再用一般資料補滿
    for (const it of rest ?? []) {
        const key = getKey(it);
        if (seen.has(key) || out.length >= limit) continue;

        seen.add(key);
        out.push(it);
    }

    // return
    return out;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const isWithinLastNDaysFromMD = (
    month1to12?: number,
    day1to31?: number,
    n: number = 8,
): boolean => {
    // 宣告變數
    if (!month1to12 || !day1to31) return false;

    const now = new Date();
    const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    let year = now.getUTCFullYear();
    let candidateUTC = Date.UTC(year, month1to12 - 1, day1to31);

    // 執行 function：若候選日在未來，代表跨年 → 改去年
    if (candidateUTC > nowUTC) {
        year -= 1;
        candidateUTC = Date.UTC(year, month1to12 - 1, day1to31);
    }

    const diffDays = Math.floor((nowUTC - candidateUTC) / DAY_MS);

    // return
    return diffDays >= 0 && diffDays <= n;
};

/** 最新消息（Prototype: .Newsii_section） */
export const NewsSection = (props: NewsSectionProps) => {
    // 宣告變數
    const adapter = useMemo(() => AnnouncementAdapter(), []);

    const topInitial = useMemo(() => {
        return toListInitial(props.topParam, props.initialData.newsTopList ?? []);
    }, [props.topParam, props.initialData.newsTopList]);

    const listInitial = useMemo(() => {
        return toListInitial(props.listParam, props.initialData.newsList ?? []);
    }, [props.listParam, props.initialData.newsList]);

    const useTopNews = adapter.hooks.useQueryList({
        condition: props.topParam,
        initial: topInitial,
        deps: [props.topParam.Condition ?? ""],
    });

    const useNormalNews = adapter.hooks.useQueryList({
        condition: props.listParam,
        initial: listInitial,
        deps: [props.listParam.Condition ?? ""],
    });

    const merged = useMemo(() => {
        return takeTopThenFill(useTopNews.data ?? [], useNormalNews.data ?? [], 5);
    }, [useTopNews.data, useNormalNews.data]);

    // 執行 function
    if (!merged || merged.length === 0) return null;

    // return
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
                                                            const internalId = data.Announcement?.InternalId;
                                                            const startRaw = data.Announcement?.Validate_Start;
                                                            const startDt = startRaw ? new Date(startRaw) : null;
                                                            const year = startDt ? String(startDt.getFullYear()) : "";
                                                            const month = startDt ? String(startDt.getMonth() + 1).padStart(2, "0") : "";
                                                            const day = startDt ? String(startDt.getDate()).padStart(2, "0") : "";
                                                            const detail = data.AnnouncementDetail?.find(p => p.Lang === props.lang);

                                                            return (
                                                                <li key={internalId} className="News_item">
                                                                    <LangNavLink to={`/news/${internalId}`} className="item-inner" target="_self" tabIndex={0}>
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
                                                                                                {Boolean((data.Announcement?.ContentStatus ?? 0) & 1) && (
                                                                                                    <div className="icon-small top-bg">置頂</div>
                                                                                                )}
                                                                                                {Boolean((data.Announcement?.ContentStatus ?? 0) & 2) && (
                                                                                                    <div className="icon-small hot-bg">熱門</div>
                                                                                                )}
                                                                                            </>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="card_titleDiv">
                                                                                <div className="card_title">
                                                                                    {detail?.Title}
                                                                                </div>
                                                                                <span className="link-arrow">
                                                                                    <i className="fas fa-long-arrow-alt-right" aria-hidden="true" />
                                                                                    <span className="sr-only">前往</span>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </LangNavLink>
                                                                </li>
                                                            );
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

export default NewsSection;