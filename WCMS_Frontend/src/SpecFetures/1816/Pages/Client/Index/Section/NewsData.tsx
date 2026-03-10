import type React from "react";
import type { components } from "@/types/api";
import { useCallback, useMemo, useState } from "react";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";

import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Announcement_Api";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tag_Api";

import more_d from "@/SpecFetures/1816/Assets/Client/images/svg_icon/more-d.svg";

type QueryListParam = components["schemas"]["QueryListParam"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];

export interface NewsDataProps {
  lang: Lang;

  listParam01: QueryListParam;
  listParam02: QueryListParam;
  listParam03: QueryListParam;
  listParam04: QueryListParam;
  cateParam: QueryListParam;
  tagParam: QueryListParam;

  initialList01: AnnouncementSet[];
  initialList02: AnnouncementSet[];
  initialList03: AnnouncementSet[];
  initialList04: AnnouncementSet[];
  initialCategories: CategoryDataSet[];
  initialTags: TagSet[];
}

const toListInitial = <TArgs, TItem>(args: TArgs, data: TItem[]) => {
  // return：符合 adapter hook 的 initial 型別
  return { args, apiRes: { IsSuccess: true, Data: data, SysMessage: [] } };
};

const useAnnouncementLists = (p: {
  listParam01: QueryListParam;
  listParam02: QueryListParam;
  listParam03: QueryListParam;
  listParam04: QueryListParam;
  initialList01: AnnouncementSet[];
  initialList02: AnnouncementSet[];
  initialList03: AnnouncementSet[];
  initialList04: AnnouncementSet[];
}) => {
  // 宣告變數
  const adapter = useMemo(() => AnnouncementAdapter(), []);

  const initial01 = useMemo(() => toListInitial(p.listParam01, p.initialList01 ?? []), [p.listParam01, p.initialList01]);
  const initial02 = useMemo(() => toListInitial(p.listParam02, p.initialList02 ?? []), [p.listParam02, p.initialList02]);
  const initial03 = useMemo(() => toListInitial(p.listParam03, p.initialList03 ?? []), [p.listParam03, p.initialList03]);
  const initial04 = useMemo(() => toListInitial(p.listParam04, p.initialList04 ?? []), [p.listParam04, p.initialList04]);

  // 執行 function：SSR 有 initial → hydration 不重抓
  const q01 = adapter.hooks.useQueryList({ condition: p.listParam01, initial: initial01, deps: [p.listParam01.Condition ?? ""] });
  const q02 = adapter.hooks.useQueryList({ condition: p.listParam02, initial: initial02, deps: [p.listParam02.Condition ?? ""] });
  const q03 = adapter.hooks.useQueryList({ condition: p.listParam03, initial: initial03, deps: [p.listParam03.Condition ?? ""] });
  const q04 = adapter.hooks.useQueryList({ condition: p.listParam04, initial: initial04, deps: [p.listParam04.Condition ?? ""] });

  // return
  return {
    list01: q01.data ?? [],
    list02: q02.data ?? [],
    list03: q03.data ?? [],
    list04: q04.data ?? [],
  };
};

const useCategoryTagDict = (p: {
  lang: Lang;
  cateParam: QueryListParam;
  tagParam: QueryListParam;
  initialCategories: CategoryDataSet[];
  initialTags: TagSet[];
}) => {
  // 宣告變數
  const cateAdapter = useMemo(() => CategoryAdapter(), []);
  const tagAdapter = useMemo(() => TagAdapter(), []);

  const cateInitial = useMemo(() => toListInitial(p.cateParam, p.initialCategories ?? []), [p.cateParam, p.initialCategories]);
  const tagInitial = useMemo(() => toListInitial(p.tagParam, p.initialTags ?? []), [p.tagParam, p.initialTags]);

  // 執行 function
  const cateQ = cateAdapter.hooks.useQueryList({ condition: p.cateParam, initial: cateInitial, deps: [p.cateParam.Condition ?? ""] });
  const tagQ = tagAdapter.hooks.useQueryList({ condition: p.tagParam, initial: tagInitial, deps: [p.tagParam.Condition ?? ""] });

  // 宣告變數：dict
  const categoryDict = useMemo(() => buildCategoryDict(cateQ.data ?? [], p.lang), [cateQ.data, p.lang]);
  const tagDict = useMemo(() => buildTagDict(tagQ.data ?? [], p.lang), [tagQ.data, p.lang]);

  // return
  return { categoryDict, tagDict };
};

export const NewsData = (props: NewsDataProps) => {
  // 宣告變數：資料（adapter hooks）
  const lists = useAnnouncementLists({
    listParam01: props.listParam01,
    listParam02: props.listParam02,
    listParam03: props.listParam03,
    listParam04: props.listParam04,
    initialList01: props.initialList01,
    initialList02: props.initialList02,
    initialList03: props.initialList03,
    initialList04: props.initialList04,
  });

  const dicts = useCategoryTagDict({
    lang: props.lang,
    cateParam: props.cateParam,
    tagParam: props.tagParam,
    initialCategories: props.initialCategories,
    initialTags: props.initialTags,
  });

  // 宣告變數：整理 list → view props
  const allNews1 = useMemo(() => {
    return getNewsDataProps(lists.list01, props.lang, "/News/News-01", "", dicts.categoryDict, dicts.tagDict);
  }, [lists.list01, props.lang, dicts.categoryDict, dicts.tagDict]);

  const allNews2 = useMemo(() => {
    return getNewsDataProps(lists.list02, props.lang, "/News/News-02", "", dicts.categoryDict, dicts.tagDict);
  }, [lists.list02, props.lang, dicts.categoryDict, dicts.tagDict]);

  const allNews3 = useMemo(() => {
    return getNewsDataProps(lists.list03, props.lang, "/News/News-03", "", dicts.categoryDict, dicts.tagDict);
  }, [lists.list03, props.lang, dicts.categoryDict, dicts.tagDict]);

  const allNews4 = useMemo(() => {
    return getNewsDataProps(lists.list04, props.lang, "/News/News-04", "", dicts.categoryDict, dicts.tagDict);
  }, [lists.list04, props.lang, dicts.categoryDict, dicts.tagDict]);

  const getMoreText = useCallback(
    (catName: string) => {
      // 宣告變數
      const base = props.lang === "en" ? "More " : "更多";
      // return
      return `${base}${catName ?? ""}`;
    },
    [props.lang],
  );

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

  // return：DOM 結構不動
  return (
    <div className="col-xxl-6 col-xl-c2 col-12 Newsii_section Layout_Padding_4_top Layout_Padding_5_bottom">
      <div className="Mask-DivBox">
        <div className="customizeBox">
          <div className="container-customize4 bg-layer p-3">
            <div className="row">
              <div className="col-12">
                <div className="headDiv mb-3 mt-1 d-flex justify-content-center">
                  <span className="headDiv-txt">{props.lang === "en" ? "News" : "最新消息"}</span>
                  <span className="headDiv-subtxt">{props.lang === "en" ? "" : "News"}</span>
                </div>
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
                        {dicts.categoryDict["1"] ?? ""}
                      </a>

                      <div className="tab-content" id="V-nav-tabContent">
                        <div aria-labelledby="V-Tabs__01" className={getPaneClass("01")} id="V-navTabs-01-content" role="tabpanel">
                          <div className="News_mainDIV">
                            <ul className="ListNews">
                              <GetData lang={props.lang} prop={allNews1}></GetData>
                            </ul>

                            <div className="btn-w100-wrapper w-100">
                              <div className="customize_btn w-100">
                                <LangLink
                                  to={"/News/News-01"}
                                  title={getMoreText(dicts.categoryDict["1"] ?? "")}
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
                                    <span>{getMoreText(dicts.categoryDict["1"] ?? "")}</span>
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
                        {dicts.categoryDict["2"] ?? ""}
                      </a>

                      <div className="tab-content" id="V-nav-tabContent">
                        <div aria-labelledby="V-Tabs__02" className={getPaneClass("02")} id="V-navTabs-02-content" role="tabpanel">
                          <div className="News_mainDIV">
                            <ul className="ListNews">
                              <GetData lang={props.lang} prop={allNews2}></GetData>
                            </ul>

                            <div className="btn-w100-wrapper w-100">
                              <div className="customize_btn w-100">
                                <LangLink
                                  to={"/News/News-02"}
                                  title={getMoreText(dicts.categoryDict["2"] ?? "")}
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
                                    <span>{getMoreText(dicts.categoryDict["2"] ?? "")}</span>
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
                        {dicts.categoryDict["3"] ?? ""}
                      </a>

                      <div className="tab-content" id="V-nav-tabContent">
                        <div aria-labelledby="V-Tabs__03" className={getPaneClass("03")} id="V-navTabs-03-content" role="tabpanel">
                          <div className="News_mainDIV">
                            <ul className="ListNews">
                              <GetData lang={props.lang} prop={allNews3}></GetData>
                            </ul>

                            <div className="btn-w100-wrapper w-100">
                              <div className="customize_btn w-100">
                                <LangLink
                                  to={"/News/News-03"}
                                  title={getMoreText(dicts.categoryDict["3"] ?? "")}
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
                                    <span>{getMoreText(dicts.categoryDict["3"] ?? "")}</span>
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
                        {dicts.categoryDict["4"] ?? ""}
                      </a>

                      <div className="tab-content" id="V-nav-tabContent">
                        <div aria-labelledby="V-Tabs__04" className={getPaneClass("04")} id="V-navTabs-04-content" role="tabpanel">
                          <div className="News_mainDIV">
                            <ul className="ListNews">
                              <GetData lang={props.lang} prop={allNews4}></GetData>
                            </ul>

                            <div className="btn-w100-wrapper w-100">
                              <div className="customize_btn w-100">
                                <LangLink
                                  to={"/News/News-04"}
                                  title={getMoreText(dicts.categoryDict["4"] ?? "")}
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
                                    <span>{getMoreText(dicts.categoryDict["4"] ?? "")}</span>
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
    </div>
  );
};

// =========================
// helpers（維持原本邏輯）
// =========================

const buildCategoryDict = (list: CategoryDataSet[], lang: Lang): Record<string, string> => {
  // 宣告變數
  const pairs = list.map((cat) => {
    const id = cat.Category?.CategoryId;
    const name = cat.CategoryDetail?.find((p) => p.Lang === lang)?.CategoryName ?? "";
    return [String(id ?? ""), name] as const;
  });

  // return
  return Object.fromEntries(pairs.filter(([id]) => Boolean(id)));
};

const buildTagDict = (list: TagSet[], lang: Lang): Record<string, string> => {
  // 宣告變數
  const pairs = list.map((t) => {
    const id = t.TagData?.TagId;
    const name = t.TagDetail?.find((p) => p.Lang === lang)?.TagName ?? "";
    return [String(id ?? ""), name] as const;
  });

  // return
  return Object.fromEntries(pairs.filter(([id]) => Boolean(id)));
};

interface GetDataProp {
  redir: string;
  announceInternalId: string;
  title: string;
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
  lang: Lang,
  redir: string,
  targetCategoryId: string,
  categoryDict: Record<string, string>,
  tagDict: Record<string, string>,
) => {
  // 宣告變數
  const top6 = pickNewsByCategories(newsData, targetCategoryId, 6, "any");
  const resultProps: GetDataProp[] = [];

  // 執行 function
  top6.map((item) => {
    const categoryIds = (item.Announcement?.Categories ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const categoryName = categoryIds.map((id) => categoryDict[id] ?? "").filter(Boolean).join(", ");

    const tags = (item.Announcement?.Tags ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const tagsName = tags.map((id) => tagDict[id] ?? "").filter(Boolean).join(", ");

    const contentStatus = item.Announcement?.ContentStatus ?? 0;
    const date = formatDate(item.Announcement?.Validate_Start ?? "");
    const monthNum = Number(new Date(item.Announcement?.Validate_Start ?? "").getUTCMonth() + 1);
    const internalId = item.Announcement?.InternalId ?? "";

    resultProps.push({
      redir,
      announceInternalId: internalId,
      title: item.AnnouncementDetail?.find((p) => p.Lang === lang)?.Title ?? "",
      date: date.day,
      month: date.month,
      year: date.year,
      monthNum,
      contentStatus,
      tagName: tagsName,
      categoryName,
      internalId,
    });
  });

  // return
  return resultProps;
};

const pickNewsByCategories = <T extends { Announcement?: { Categories?: string | null | undefined } }>(
  newsData: T[] | undefined,
  categories: string | string[],
  take: number = 6,
  mode: "any" | "all" = "any",
): T[] => {
  const target = new Set((Array.isArray(categories) ? categories : String(categories).split(",")).map((s) => s.trim()).filter(Boolean));
  if (!newsData || target.size === 0) return (newsData ?? []).slice(0, take);

  const result = newsData.filter((item) => {
    const tokens = (item.Announcement?.Categories ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (tokens.length === 0) return false;
    return mode === "all" ? [...target].every((t) => tokens.includes(t)) : tokens.some((t) => target.has(t));
  });

  return result.slice(0, take);
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString();
  return { day, month, year };
};

type TagKey = "top" | "new" | "hot";

const GetData = (props: { lang: Lang; prop: GetDataProp[] }) => {
  // 宣告變數
  const list = props.prop ?? [];

  // return：保持原本 News_item DOM
  return (
    <>
      {list.map((p, idx) => {
        const isTop = Boolean(p.contentStatus & 1);
        const isNew = Boolean(p.contentStatus & 2);
        const isHot = isWithinLastNDaysFromMD(Number(p.month), Number(p.date));

        const tagText: Record<TagKey, string> =
          props.lang === "zh-tw"
            ? { top: "置頂", new: "最新", hot: "熱門" }
            : { top: "TOP", new: "NEW", hot: "HOT" };

        const tagEnabled: Record<TagKey, boolean> = {
          top: isTop,
          new: isHot,
          hot: isNew,
        };

        const tagKeys = (["top", "new", "hot"] as const).filter((k) => tagEnabled[k]).slice(0, 2);
        const href = `${p.redir}/${p.announceInternalId}`;

        return (
          <li key={`${p.announceInternalId}-${idx}`} className="News_item">
            <LangLink to={href} className="item-inner" tabIndex={0} title={p.title}>
              <div className="rightBox">
                <div className="card_catDiv">
                  <div className="a-left order-1">
                    <div className="card_time">{`${p.year}-${String(p.month).padStart(2, "0")}-${String(p.date).padStart(2, "0")}`}</div>
                  </div>

                  <div className="card_titleDiv order-xl-2 order-3">
                    <div className="card_title">{p.title}</div>
                  </div>

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
              </div>
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

  if (candidateUTC > nowUTC) {
    y -= 1;
    candidateUTC = Date.UTC(y, month1to12 - 1, day1to31);
  }

  const diffDays = Math.floor((nowUTC - candidateUTC) / DAY_MS);
  return diffDays >= 0 && diffDays <= n;
};