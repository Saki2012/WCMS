import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { useMemo } from "react";

import { SpecJournalKeywordSearch_Comp } from "../../BizFunc/WEB/SpecJournal/SpecJournalKeywordSearchComp";
import type { HomePageRawData } from "../HomePage_Loader";

// #region Property
type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];

type SpecJournalIndexDetail = components["schemas"]["SpecJournalIndexDetail_DTO"];

type BannerFormModel = components["schemas"]["Banner"];

interface LatestIssueSectionProps
{
    lang: Lang;
    initialData: Pick<HomePageRawData, "latestIssueBgBanner" | "latestIssueCoverBanner" | "latestIssuePublishedList" | "latestIssueUnpublishedList">;
}
// #endregion

// #region Public
/** 最新卷期 */
export const LatestIssueSection = (props: LatestIssueSectionProps) =>
{
    const bgBanner = props.initialData.latestIssueBgBanner;
    const coverBanner = props.initialData.latestIssueCoverBanner;
    const publishedList = props.initialData.latestIssuePublishedList ?? [];
    const bgInnerImg = useMemo(() => getBannerImageUrl(bgBanner), [bgBanner]);
    const issueImg = useMemo(() => getBannerImageUrl(coverBanner), [coverBanner]);
    const latestPublished = useMemo(() => getFirstIssue(publishedList), [publishedList]);
    return (
        <section className="LatestIssue_section">
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="Issue_Div">
                        <div className="Issue_inner">
                            <div className="Issue_wrapper">
                                <div className="customize_row">
                                    <div className="col-md-6 col-sm-12 col-12 + Left_Textbox + order-md-1 + order-sm-2 + order-2">
                                        <div className="FV_Box">
                                            <div className="TS_wrapper">
                                                <LastIssueComp data={latestPublished} lang={props.lang} />
                                                <PreprintComp lang={props.lang} />
                                                <SpecJournalKeywordSearch_Comp basePath="/Issues/List" lang={props.lang} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6 col-sm-12 col-12 + Right_Imgbox + order-md-2 + order-sm-1 + order-1">
                                        <div className="Background_IMG_DIV">
                                            <div className="IMG_wrapperBOX">
                                                <div className="inner_body" style={bgInnerImg ? { backgroundImage: `url(${bgInnerImg})` } : undefined}>
                                                    <div className="Journal-content">
                                                        <div className="card_figure">
                                                            <div className="img-wrapper">
                                                                <img className="card_image" src={issueImg} alt="" />
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
                </div>
            </div>
        </section>
    );
};
// #endregion

// #region Section
/** 最新期刊 */
const LastIssueComp = (props: { data: SpecJournalIndexSet | null; lang: Lang; }) =>
{
    // 宣告變數
    const getPublishDateTime = (publishDate?: string | null): number =>
    {
        return publishDate ? new Date(publishDate).getTime() : 0;
    };
    const detailData = [...(props.data?.SpecJournalIndexDetail ?? [])].sort((a, b) => getPublishDateTime(b.PublishDate) - getPublishDateTime(a.PublishDate))[0]
        ?? null;
    const title = buildIssueTitle(detailData, props.lang);
    const issueTo = buildIssueTo(detailData);
    const sectionTitle = getLatestIssueText(props.lang);
    const downloadHref = buildSummaryDownloadHref(detailData);
    const fileName = detailData?.SummaryFileName ?? "";
    return (
        <>
            <div className="TOP_TXT">
                <div className="TTLeft_Box">
                    <div className="ttl-Big">Latest</div>
                </div>
                <div className="TTRight_Box">
                    <div className="ttl-small">issue</div>
                </div>
            </div>
            <div className="CENTER_FILE + CENTER_After">
                <div className="HD-txt">{sectionTitle}</div>
                <div className="TW-file + my-1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="fas fa-link" aria-hidden="true" />
                    <LangNavLink to={issueTo} title={title} style={{ color: "inherit", textDecoration: "none" }}>{title}</LangNavLink>
                </div>
                {!!downloadHref && (
                    <div className="EN-file + my-1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <i className="fas fa-file-pdf + me-2" aria-hidden="true" />
                        <LangLink
                            to={downloadHref}
                            title={fileName || "下載檔案"}
                            aria-label={`下載檔案：${fileName || "PDF"}`}
                            style={{ color: "inherit", textDecoration: "none", display: "inline" }}
                        >
                            <span>{fileName || "Download"}</span>
                        </LangLink>
                    </div>
                )}
            </div>
        </>
    );
};

/** 預刊本 */
const PreprintComp = (props: { lang: Lang; }) =>
{
    const issueTo = "/Issues/Preprint"; // 寫死，針對預刊本路徑
    const sectionTitle = getForesightText(props.lang);
    const linkText = getArticleInPressText(props.lang);
    return (
        <div className="DOWN_TXT">
            <div className="HD-txt">{sectionTitle}</div>
            <div className="TW-file + my-1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <i className="fas fa-link" aria-hidden="true" />
                <LangNavLink to={issueTo} style={{ color: "inherit", textDecoration: "none" }} title={linkText}>{linkText}</LangNavLink>
            </div>
        </div>
    );
};
// #endregion

// #region Protected
/** 組卷期顯示字串 */
const buildIssueTitle = (detail: SpecJournalIndexDetail | undefined, lang: Lang): string =>
{
    if (!detail) return "";
    const vol = detail.Volume ?? "";
    const iss = detail.Issue ?? "";
    const dateText = detail.PublishDate ? formatYyyyMm(detail.PublishDate) : getArticleInPressText(lang);
    const special = detail.IsSpecial ? getSpecialIssueText(lang) : "";
    if (lang === "en") return `Vol. ${vol}, No. ${iss} ( ${dateText} )${special}`;
    return `${vol}卷${iss}期 ( ${dateText} )${special}`;
};

/** 取得最新卷期標題文字 */
const getLatestIssueText = (lang: Lang): string =>
{
    return lang === "en" ? "Latest Issue" : "最新卷期";
};

/** 取得先知先覺標題文字 */
const getForesightText = (lang: Lang): string =>
{
    return lang === "en" ? "Foresight" : "先知先覺";
};

/** 取得預刊本連結文字 */
const getArticleInPressText = (lang: Lang): string =>
{
    return lang === "en" ? "Article in Press" : "預刊本";
};

/** 取得特刊顯示文字 */
const getSpecialIssueText = (lang: Lang): string =>
{
    return lang === "en" ? " - Special Issue" : " - 特刊";
};

/** 站內卷期連結 */
const buildIssueTo = (detail?: SpecJournalIndexDetail): string =>
{
    // 宣告變數
    const index = detail?.IndexId ?? "";
    const rowId = detail?.RowId ?? "";
    // return
    return `/Issues/List/${index}/${rowId}`;
};

/** Summary 檔案下載連結 */
const buildSummaryDownloadHref = (detail?: SpecJournalIndexDetail): string =>
{
    return FileManagementAPI.get_Public_Preview_Url(detail?.SummaryFileId, detail?.SummaryFileName);
};
// #endregion

// #region Private
/** 取得 Banner 圖片網址 */
const getBannerImageUrl = (banner: BannerFormModel | null): string =>
{
    return FileManagementAPI.get_Public_Preview_Url(banner?._BannerDetail?.[0]?.PicSrcId);
};

/** 取第一筆卷期資料 */
const getFirstIssue = (list: SpecJournalIndexSet[] | undefined): SpecJournalIndexSet | null =>
{
    return list?.[0] ?? null;
};

/** 只取 yyyy/MM */
const formatYyyyMm = (publishDate: unknown): string =>
{
    // 宣告變數
    if (!publishDate) return "";

    const d = new Date(String(publishDate));
    if (Number.isNaN(d.getTime())) return String(publishDate);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");

    // return
    return `${yyyy} / ${mm}`;
};
// #endregion
