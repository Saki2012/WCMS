import type { Lang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { useMemo } from "react";

import { SpecJournalKeywordSearch_Comp } from "../../BizFunc/WEB/SpecJournal/SpecJournalKeywordSearchComp";
import type { HomePageRawData } from "../HomePage_Loader";

type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];
type BannerSet = components["schemas"]["BannerSet_DTO"];

interface LatestIssueSectionProps
{
    lang: Lang;
    initialData: Pick<HomePageRawData, "latestIssueBgBanner" | "latestIssueCoverBanner" | "latestIssuePublishedList" | "latestIssueUnpublishedList">;
}

/** 取得 Banner 圖片網址 */
const getBannerImageUrl = (banner: BannerSet | null): string =>
{
    return FileManagementAPI.get_Public_Preview_Url(banner?.BannerDetail?.[0]?.PicSrcId);
};

/** 取第一筆卷期資料 */
const getFirstIssue = (list: SpecJournalIndexSet[] | undefined): SpecJournalIndexSet | null =>
{
    return list?.[0] ?? null;
};

/** 組卷期顯示字串 */
const buildIssueTitle = (data?: SpecJournalIndexSet | null): string =>
{
    if (!data) return "";
    const detail = data.SpecJournalIndexDetail?.[0];
    const vol = detail?.Volume ?? "";
    const iss = detail?.Issue ?? "";
    const dateText = detail?.PublishDate ? formatYyyyMm(detail.PublishDate) : "預刊本";
    const special = detail?.IsSpecial ? " - 特刊" : "";
    return `${vol}卷${iss}期 ( ${dateText} )${special}`;
};

/** 站內卷期連結 */
const buildIssueTo = (data?: SpecJournalIndexSet | null): string =>
{
    // 宣告變數
    const index = data?.SpecJournalIndexDetail?.[0]?.IndexId ?? "";
    const rowId = data?.SpecJournalIndexDetail?.[0]?.RowId ?? "";

    // return
    return `/Issues/List/${index}/${rowId}`;
};

/** Summary 檔案下載連結 */
const buildSummaryDownloadHref = (data?: SpecJournalIndexSet | null): string =>
{
    return FileManagementAPI.get_Public_Preview_Url(data?.SpecJournalIndexDetail?.[0]?.SummaryFileId, data?.SpecJournalIndexDetail?.[0]?.SummaryFileName);
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

/** 最新期刊 */
const LastIssueComp = (props: { data: SpecJournalIndexSet | null; }) =>
{
    // 宣告變數
    const data = props.data;
    const title = buildIssueTitle(data);
    const issueTo = buildIssueTo(data);
    const downloadHref = buildSummaryDownloadHref(data);
    const fileName = data?.SpecJournalIndexDetail?.[0]?.SummaryFileName ?? "";
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
                <div className="HD-txt">最新卷期</div>
                <div className="TW-file + my-1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="fas fa-link" aria-hidden="true" />
                    <LangNavLink to={issueTo} style={{ color: "inherit", textDecoration: "none" }}>{title}</LangNavLink>
                </div>
                {!!downloadHref && (
                    <div className="EN-file + my-1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <i className="fas fa-file-pdf + me-2" aria-hidden="true" />
                        <a
                            href={downloadHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={fileName || "下載檔案"}
                            aria-label={`下載檔案：${fileName || "PDF"}`}
                            style={{ color: "inherit", textDecoration: "none", display: "inline" }}
                        >
                            <span>{fileName || "Download"}</span>
                        </a>
                    </div>
                )}
            </div>
        </>
    );
};

/** 預刊本 */
const PreprintComp = () =>
{
    const issueTo = "/Issues/Preprint"; // 寫死，針對預刊本路徑
    return (
        <div className="DOWN_TXT">
            <div className="HD-txt">先知先覺</div>
            <div className="TW-file + my-1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <i className="fas fa-link" aria-hidden="true" />
                <LangNavLink to={issueTo} style={{ color: "inherit", textDecoration: "none" }}>預刊本</LangNavLink>
            </div>
        </div>
    );
};

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
                                                <LastIssueComp data={latestPublished} />
                                                <PreprintComp />
                                                <SpecJournalKeywordSearch_Comp basePath="/Issues/List" />
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

export default LatestIssueSection;
