import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import type { components } from "@/types/api";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { BannerDetailFields, BannerFields, SpecJournalIndexDetailFields, SpecJournalIndexModelFields } from "@/types/SchemaFields";
import { useMemo } from "react";
import SpecJournalIndexProvider from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecMusical/SpecJournalIndex_Api";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
type PublishStatus = components["schemas"]["PublishStatus"];
type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];
type BannerSet = components["schemas"]["BannerSet_DTO"];
const PublishStatusEnum = { Unpublished: 0, Published: 1, } as const;

/** 最新卷期（Prototype: .LatestIssue_section） */
export const LatestIssueSection = () => {
    const pdvr = useMemo(() => { return { Banner: BannerSliderProvider(), JournalIndex: SpecJournalIndexProvider() } }, [])
    const useBgInnerImg = bannerFetch(pdvr.Banner, "Banner20260113002");
    const useIssue01Img = bannerFetch(pdvr.Banner, "Banner20260113001");
    const bgPicId = useBgInnerImg.rawData?.[0]?.BannerDetail?.[0]?.PicSrcId;
    const issuePicId = useIssue01Img.rawData?.[0]?.BannerDetail?.[0]?.PicSrcId;
    const { BgInnerImg, IssueImg } = useMemo(() => {
        return {
            BgInnerImg: bgPicId ? `${FileManagementAPI.PREVIEW_URL}/${bgPicId}` : "",
            IssueImg: issuePicId ? `${FileManagementAPI.PREVIEW_URL}/${issuePicId}` : "",
        };
    }, [bgPicId, issuePicId]);

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
                                                <LastIssueComp pdvr={pdvr.JournalIndex} />
                                                <PreprintComp pdvr={pdvr.JournalIndex} />
                                                <SearchComp />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6 col-sm-12 col-12 + Right_Imgbox + order-md-2 + order-sm-1 + order-1">
                                        <div className="Background_IMG_DIV">
                                            <div className="IMG_wrapperBOX">
                                                <div className="inner_body" style={{ backgroundImage: `url(${BgInnerImg})` }}>
                                                    <div className="Journal-content">
                                                        <div className="card_figure">
                                                            <div className="img-wrapper">
                                                                <img className="card_image" src={IssueImg} alt="" />
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
/** 最新期刊 */
const LastIssueComp = (props: { pdvr: IDataProvider<SpecJournalIndexSet> }) => {
    const useData = indexFetch(props.pdvr, PublishStatusEnum.Published);
    const data: SpecJournalIndexSet = useData.rawData?.[0];
    const title = buildIssueTitle(data);
    const issueTo = buildIssueTo(data);                 // ✅ 站內卷期連結（暫用 query）
    const downloadHref = buildSummaryDownloadHref(data); // ✅ 下載連結（SummaryFileId）
    const fileName = data?.SpecJournalIndexDetail?.[0].SummaryFileName;
    if (!data) return null;
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
                    <LangNavLink to={issueTo} style={{ color: "inherit", textDecoration: "none" }}>
                        {title}
                    </LangNavLink>
                </div>
                {!!downloadHref && (
                    <div className="EN-file + my-1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <i className="fas fa-file-pdf + me-2" aria-hidden="true" />
                        <a href={downloadHref} target="_blank" rel="noopener noreferrer" title={fileName ?? "下載檔案"} aria-label={`下載檔案：${fileName ?? "PDF"}`}
                            style={{ color: "inherit", textDecoration: "none", display: "inline" }}>
                            <span>{fileName ?? "Download"}</span>
                        </a>
                    </div>
                )}
            </div>
        </>
    );
};
/** 預刊本 */
const PreprintComp = (props: { pdvr: IDataProvider<SpecJournalIndexSet> }) => {
    const useData = indexFetch(props.pdvr, PublishStatusEnum.Unpublished);
    const data: SpecJournalIndexSet = useData.rawData?.[0];
    const title = buildIssueTitle(data);
    const issueTo = buildIssueTo(data);                 // ✅ 站內卷期連結（暫用 query）
    const downloadHref = buildSummaryDownloadHref(data); // ✅ 下載連結（SummaryFileId）
    const fileName = data?.SpecJournalIndexDetail?.[0].SummaryFileName;
    if (!data) return null;
    return (
        <>
            <div className="DOWN_TXT">
                <div className="HD-txt">先知先覺</div>
                <div className="TW-file + my-1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="fas fa-link" aria-hidden="true" />
                    <LangNavLink to={issueTo} style={{ color: "inherit", textDecoration: "none" }}>
                        {title}
                    </LangNavLink>
                </div>
                {!!downloadHref && (
                    <div className="EN-file + my-1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <i className="fas fa-file-pdf + me-2" aria-hidden="true" />
                        <a href={downloadHref} target="_blank" rel="noopener noreferrer" title={fileName ?? "下載檔案"} aria-label={`下載檔案：${fileName ?? "PDF"}`}
                            style={{ color: "inherit", textDecoration: "none", display: "inline" }}>
                            <span>{fileName ?? "Download"}</span>
                        </a>
                    </div>
                )}
            </div>
        </>
    )
}

const SearchComp = () => {
    return (
        <div className="SEARCH_DIV">
            <div className="input-group mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="請輸入檢索查詢 ..."
                    aria-label="請輸入檢索查詢 ..."
                />
                <button type="button" className="btn-CCsearch" aria-label="搜尋">
                    <i className="far fa-search" aria-hidden="true" />
                </button>
            </div>

            <div className="form-check">
                <input className="form-check-input" type="checkbox" id="includeRef" />
                <label className="form-check-label" htmlFor="includeRef">
                    包含參考文獻（ 51卷1期至今 ）
                </label>
            </div>
        </div>
    )
}


//#region Func
/** 組卷期顯示字串 */
const buildIssueTitle = (data?: SpecJournalIndexSet): string => {
    if (!data) return "";
    const vol = data.SpecJournalIndexDetail?.[0].Volume ?? "";
    const iss = data.SpecJournalIndexDetail?.[0].Issue ?? "";
    const dateText = data.SpecJournalIndexDetail?.[0].PublishDate ? formatYyyyMm(data.SpecJournalIndexDetail?.[0].PublishDate) : "預刊本";
    const special = data.SpecJournalIndexDetail?.[0].IsSpecial ? " - 特刊" : "";
    return `${vol}卷${iss}期 ( ${dateText} )${special}`;
};

/** 站內卷期連結：先用 query 帶 index/volume/issue，後續你要換成 /.../.../ 再改這裡即可 */
const buildIssueTo = (data?: SpecJournalIndexSet): string => {
    const index = data?.SpecJournalIndexDetail?.[0]?.IndexId ?? "";
    const rowId = data?.SpecJournalIndexDetail?.[0]?.RowId ?? "";
    return `/Issues/List/${index}/${rowId}`;
};

/** Summary 檔案下載連結（後端已有 Download endpoint） */
const buildSummaryDownloadHref = (data?: SpecJournalIndexSet): string => {
    const id = data?.SpecJournalIndexDetail?.[0]?.SummaryFileId;
    if (!id) return "";
    return `${FileManagementAPI.DOWNLOAD_URL}/${encodeURIComponent(id)}`;
};

/** 只取 yyyy/MM（PublishDate 可能是 string/Date，這邊用最保險處理） */
const formatYyyyMm = (publishDate: unknown): string => {
    if (!publishDate) return "";
    const d = new Date(String(publishDate));
    if (Number.isNaN(d.getTime())) return String(publishDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy} / ${mm}`;
};
//#endregion

const indexFetch = (pdvr: IDataProvider<SpecJournalIndexSet>, isPublish: PublishStatus) => {
    var condition: string = `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.PublishStatus} = ${isPublish}`;
    return useFetchGridListData<SpecJournalIndexSet>({
        getModelDisplayName: () => pdvr.getModelDisplayName(),
        fetchList: (cond) => pdvr.fetchList(cond),
        fetchListCount: (cond) => pdvr.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.IndexId}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.RowId}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileId}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileName}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.PublishDate}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.IsSpecial}`,
            ],
            Condition: condition,
            OrderBy: [{ Col: `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.PublishDate}`, Desc: true }],
            PageNumber: 1,
            PageSize: 5,
        }),
        enabled: true,
        deps: [isPublish],
    });
};


const bannerFetch = (pdvr: IDataProvider<BannerSet>, bannerId: string) => {
    var condition: string = `${BannerFields.BannerId} = ${bannerId}`;
    return useFetchGridListData<BannerSet>({
        getModelDisplayName: () => pdvr.getModelDisplayName(),
        fetchList: (cond) => pdvr.fetchList(cond),
        fetchListCount: (cond) => pdvr.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                `${BannerFields._BannerDetail}.${BannerDetailFields.BannerId}`,
                `${BannerFields._BannerDetail}.${BannerDetailFields.PicSrcId}`,
            ],
            Condition: condition,
            PageNumber: 1,
            PageSize: 1,
        }),
        enabled: true,
        deps: [bannerId],
    });
};