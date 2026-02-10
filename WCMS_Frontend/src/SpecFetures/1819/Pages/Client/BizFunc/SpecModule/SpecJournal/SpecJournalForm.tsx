import { getLangLabel, SUPPORTED_LANGS, type Lang } from "@/SysCore/i18n/lang";
import React, { useEffect, useMemo } from "react";
import parse from "html-react-parser";
import insightpointImg1 from "@/SpecFetures/1819/Assets/Client/images/links/150x32/InSight_Point_bt_150x32.svg";
import insightpointImg2 from "@/SpecFetures/1819/Assets/Client/images/links/150x32/InSight_Point_bt_W_150x32.svg";
import openPointImg from "@/SpecFetures/1819/Assets/Client/images/links/150x32/Open_Point_bt_190x40.svg";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import type { components } from "@/types/api";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import clsx from "clsx";
import { QrCodeWithLogo_Comp } from "@/SysCore/Components/LibQRCode/LibQRCode_Comp";
import QRCodeLogoImg from "@/SpecFetures/1819/Assets/Client/SpecImg/QRCodeLogo.png";
import { useResolveInternalIds } from "@/SysCore/Components/File/useResolveInternalIds";
import { useLocation, useParams } from "react-router";
import { useBreadcrumb } from "@/Features/Pages/Client/Scaffold/SubPages/Section/BreadCrumb_Comp";
import { SpecJournalKeywordSearch_Comp } from "@/SpecFetures/1819/Pages/Client/BizFunc/SpecModule/SpecJournal/SpecJournalKeywordSearchComp";
import { useSpecJournalSearchNav } from "./SpecJournalSearchUtils";
import { LangNavLink } from "@/SysCore/i18n/LangLink";

// ✅ 新架構：LoaderData initial + adapter hooks
import { useLoaderData } from "react-router-dom";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournal_Api";
import type { SpecJournalFormLoaderData } from "./SpecJournalForm_Loader";

type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

const joinPath = (base: string, path: string) => {
    // 宣告變數
    const b = (base ?? "").replace(/\/+$/, "");
    const p = (path ?? "").replace(/^\/+/, "");

    // return
    if (!b) return `/${p}`;
    return `${b}/${p}`;
};

export const SpecJournalForm_Comp = (props: { node: INormNode; lang: Lang }) => {
    // 宣告變數
    const { indexId, rowId } = useParams();
    const { setItems } = useBreadcrumb();
    const location = useLocation();

    const loaderData = useLoaderData() as SpecJournalFormLoaderData | null;
    const adapter = useMemo(() => SpecJournalAdapter(), []);

    const useDetail = useSpecJournalDetail(adapter, loaderData);
    const data = useMemo(() => useDetail.rawData?.[0], [useDetail.rawData]);

    const isLoading = [useDetail.isLoading];
    const errors = [useDetail.error];

    const title = useMemo(() => {
        const d = data?.SpecJournal?._JournalIndexDetail;
        return d ? `Vol.${d.Volume}, No.${d.Issue}` : "";
    }, [data?.SpecJournal?._JournalIndexDetail?.Volume, data?.SpecJournal?._JournalIndexDetail?.Issue]);

    const moduleBase = useMemo(() => {
        const raw = props.node.redirectTo ?? "";
        if (raw && raw !== "/") return raw;

        // fallback：從目前網址抓 module 段（處理 /en/Issue/... 或 /Issue/...）
        const segs = location.pathname.split("/").filter(Boolean);
        const s0 = segs[0]?.toLowerCase() ?? "";
        const hasLang = (SUPPORTED_LANGS as readonly string[]).includes(s0);
        const mod = hasLang ? segs[1] : segs[0];
        return mod ? `/${mod}` : "/";
    }, [props.node.redirectTo, location.pathname]);

    useEffect(() => {
        // ✅ 卷期：可點回 List
        const issueLabel = title;
        const issueTo = issueLabel && indexId && rowId ? joinPath(moduleBase, `List/${indexId}/${rowId}`) : undefined;

        // ✅ 文章：用 Title（不是 id）
        const articleLabel =
            data?.SpecJournal?.Title ?? data?.SpecJournal?.Title_en ?? (props.lang === "zh-tw" ? "文章" : "Article");

        const next: Array<{ label: string; to?: string }> = [];
        if (issueLabel) next.push({ label: issueLabel, to: issueTo });
        if (articleLabel) next.push({ label: articleLabel });

        setItems(next);

        // ✅ 離開頁面就清空
        return () => setItems([]);
    }, [title, data?.SpecJournal?.Title, data?.SpecJournal?.Title_en, indexId, rowId, props.lang, moduleBase, setItems]);

    // return
    return (
        <ModuleContent nodeTitle={title} title={title} loadingList={isLoading} errorList={errors}>
            <SpecJournalFormContent data={data} lang={props.lang} />
        </ModuleContent>
    );
};

const useSpecJournalDetail = (adapter: ReturnType<typeof SpecJournalAdapter>, loaderData: SpecJournalFormLoaderData | null) => {
    // 宣告變數
    const baseParam = useMemo<QueryListParam>(() => {
        if (!loaderData?.args?.baseParam) return { Fields: [], Condition: "1=0", PageNumber: 1, PageSize: 1 };
        return loaderData.args.baseParam;
    }, [loaderData]);

    const initialCount = useMemo<ApiLoaderData<QueryListParam, number> | null>(() => {
        if (!loaderData?.args?.baseParam) return null;

        return {
            args: loaderData.args.baseParam,
            apiRes: { IsSuccess: true, Data: loaderData.res.countRes ?? 0, SysMessage: [] },
        };
    }, [loaderData]);

    const initialList = useMemo<ApiLoaderData<QueryListParam, SpecJournalSet[]> | null>(() => {
        if (!loaderData?.args?.baseParam) return null;

        return {
            args: loaderData.args.baseParam,
            apiRes: { IsSuccess: true, Data: loaderData.res.listRes ?? [], SysMessage: [] },
        };
    }, [loaderData]);

    // 執行 function：count/list（預期 1 筆）
    const useCount = adapter.hooks.useQueryCount({
        condition: baseParam,
        initial: initialCount,
        deps: [loaderData?.args?.journalId],
    });

    const useList = adapter.hooks.usePagedQueryList({
        baseParam,
        count: useCount.data ?? 0,
        initial: initialList,
        deps: [loaderData?.args?.journalId],
    });

    // return
    return {
        rawData: useList.data ?? [],
        isLoading: useCount.isLoading || useList.isLoading,
        error: useCount.errorText ?? useList.errorText ?? null,
    };
};

const SpecJournalFormContent = (props: { lang: Lang; data?: SpecJournalSet }) => {
    useEffect(() => {
        const root = document.getElementById("ContentPlaceContent_ContentConentA");
        if (!root) return;

        // ✅ BS accordion keyboard support（CSR only）
        wireBsAccordion(root);

        // ✅ cleanup
        return () => unwireBsAccordion(root);
    }, []);

    return (
        <div className="Journal_List_content">
            <div className="row">
                <div className="CategoryBar w-100">
                    <SpecJournalKeywordSearch_Comp basePath="../List" />
                </div>
                <div className="col row-group">
                    <hr className="hr-my-4" />
                </div>

                {/* ✅ 不改 DOM 結構：子元件自行防呆 */}
                <JournalTitle_Comp {...props} />
                <BrowseCount_Comp />
                <Authors_Comp {...props} />
                <DOI_Comp {...props} />
                <JournalInfo_Comp {...props} />
                <FileDownload_Comp {...props} />
                <OpenPoint_Comp {...props} />
                <RefFile_Comp {...props} />
                <Accordion_Comp {...props} />
            </div>
        </div>
    );
};

/** 期刊標題 */
const JournalTitle_Comp = (props: { lang: Lang; data?: SpecJournalSet }) => {
    const { goExclusive } = useSpecJournalSearchNav("../List");

    const onPickArticleLang = (langCode: string) => {
        // 執行 function
        goExclusive({ articleLang: langCode });
    };

    const onPickTag = (tagId: string, tagName?: string) => {
        // 執行 function
        goExclusive({ tagId, tagName });
    };

    const langCode = props.data?.SpecJournal?.ArticleLang ?? "";
    const langLabel = getLangLabel(langCode);

    return (
        <>
            {/* 編者言 標題區 */}
            <div className="JJ_main_contentDIV">
                <div className="col row_item_group">
                    <div className="IItemBox_content">
                        <div className="card_catDiv">
                            <div className="wrap_box">
                                <div className="card_cat_item">
                                    <div className="card_cat_TxT">
                                        <span className="cat_title">
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    onPickArticleLang(langCode);
                                                }}
                                                aria-label={`依語言篩選：${langLabel}`}
                                                title="依語言篩選"
                                                style={{ color: "inherit", textDecoration: "none" }}
                                            >
                                                {langLabel}
                                            </a>
                                        </span>
                                    </div>
                                </div>

                                {props.data?.SpecJournalTypes?.map((t) => {
                                    const tagName = t.Tag?._TagDetail?.find((p) => p.Lang === props.lang)?.TagName;

                                    return (
                                        <div key={t.TagId} className="card_cat_item">
                                            <div className="card_cat_TxT">
                                                <span className="cat_title">
                                                    <a
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            onPickTag(t.TagId ?? "", tagName ?? "");
                                                        }}
                                                        aria-label={`依分類篩選：${tagName ?? ""}`}
                                                        title="依分類篩選"
                                                        style={{ color: "inherit", textDecoration: "none" }}
                                                    >
                                                        {tagName}
                                                    </a>
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="card_titleDiv">
                            <div className="card_title">{props.data?.SpecJournal?.Title}</div>
                            {!!props.data?.SpecJournal?.Title_en && <div className="card_title_en">{props.data?.SpecJournal?.Title_en}</div>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="col row-group">
                <hr className="hr-my-4" />
            </div>
        </>
    );
};

/** 瀏覽次數 */
const BrowseCount_Comp = () => {
    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="col row_item_group">
                    <div className="Div_All_BigTitle">
                        <i className="fas fa-eye me-1" aria-hidden="true"></i>
                        <span>瀏覽次數 :</span>
                        <span className="ms-2">{0}</span>
                    </div>
                </div>
            </div>

            <div className="col row-group">
                <hr className="hr-my-3" />
            </div>
        </>
    );
};

/** 作者列表 */
const Authors_Comp = (props: { lang: Lang; data?: SpecJournalSet }) => {
    const { goExclusive } = useSpecJournalSearchNav("../List");

    const onPickAuthor = (name: string) => {
        // 宣告變數
        const v = (name ?? "").trim();

        // 執行 function
        if (!v) return;
        goExclusive({ author: v });
    };

    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="col row_item_group">
                    <div className="Uncat">
                        <ul className="AuthorCardGrid" aria-label="作者清單">
                            {props.data?.SpecJournalAuthor?.map((a, idx) => {
                                return (
                                    <li key={`${a.ORCID ?? a.Email ?? "author"}-${idx}`} className="AuthorCardGrid__item">
                                        <div className="AuthorCard">
                                            <div className="AuthorCard__title">
                                                {(() => {
                                                    // 宣告變數
                                                    const zh = (a.AuthorName ?? "").trim();
                                                    const en = (a.AuthorName_en ?? "").trim();
                                                    const showZh = !!zh;
                                                    const showEn = !!en && !showZh;

                                                    // return
                                                    return (
                                                        <>
                                                            {showZh && (
                                                                <div className="AuthorCard__nameZh">
                                                                    <a
                                                                        href="#"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            onPickAuthor(zh);
                                                                        }}
                                                                        aria-label={`依作者篩選：${zh}${en ? ` (${en})` : ""}`}
                                                                        title="依作者篩選"
                                                                        style={{ color: "inherit", textDecoration: "none" }}
                                                                    >
                                                                        {zh}
                                                                    </a>
                                                                </div>
                                                            )}

                                                            {showZh && !!en && (
                                                                <div className="AuthorCard__nameEn ms-2">
                                                                    （
                                                                    <a
                                                                        href="#"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            onPickAuthor(en);
                                                                        }}
                                                                        aria-label={`依作者篩選：${en}`}
                                                                        title="依作者篩選"
                                                                        style={{ color: "inherit", textDecoration: "none" }}
                                                                    >
                                                                        {en}
                                                                    </a>
                                                                    ）
                                                                </div>
                                                            )}

                                                            {showEn && (
                                                                <div className="AuthorCard__nameEn">
                                                                    <a
                                                                        href="#"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            onPickAuthor(en);
                                                                        }}
                                                                        aria-label={`依作者篩選：${en}`}
                                                                        title="依作者篩選"
                                                                        style={{ color: "inherit", textDecoration: "none" }}
                                                                    >
                                                                        {en}
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>

                                            <div className="AuthorCard__rows">
                                                {[
                                                    { label: "ORCID :", value: a.ORCID },
                                                    { label: "職稱 :", value: a.JobTitle },
                                                    {
                                                        label: "電子郵件 :",
                                                        value: a.Email ? <a href={`mailto:${a.Email}`}>{a.Email}</a> : null,
                                                    },
                                                    { label: "地區 / 國家 :", value: a.Country },
                                                ]
                                                    .filter((x) => x.value)
                                                    .map((row) => (
                                                        <div key={row.label} className="Div_All_Ttext mb-1">
                                                            <span className="AuthorCard__label">{row.label}</span>
                                                            <span className="ms-2 AuthorCard__value">{row.value}</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="col row-group">
                <hr className="hr-my-4" />
            </div>
        </>
    );
};

/** DOI */
const DOI_Comp = (props: { lang: Lang; data?: SpecJournalSet }) => {
    const url = props.data?.SpecJournal?.DOIUrl ?? "";

    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="col row_item_group doiRow">
                    <div className="doiText">
                        <div className="Div_All_Ttext">
                            <span>DOI編號: </span>
                        </div>
                        <div className="Div_All_Ttext">
                            <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`DOI 連結，另開視窗：${url}`}>
                                {url}
                            </a>
                        </div>
                    </div>
                    <div className="doiQr">
                        {props.data?.SpecJournal?.DOIUrl ?
                            <QrCodeWithLogo_Comp value={props.data?.SpecJournal?.DOIUrl ?? ""} logoSrc={QRCodeLogoImg} size={200} ariaLabel="DOI QR Code" /> :
                            null
                        }
                    </div>
                </div>
            </div>
            <div className="col row-group">
                <hr className="hr-my-4" />
            </div>
        </>
    );
};

/** 期刊資訊 */
const JournalInfo_Comp = (props: { lang: Lang; data?: SpecJournalSet }) => {
    const { goExclusive } = useSpecJournalSearchNav("../List");

    const onPickKeyword = (kw: string) => {
        // 宣告變數
        const v = (kw ?? "").trim();

        // 執行 function
        if (!v) return;
        goExclusive({ keyword: v });
    };

    const publishDate = (props.data?.SpecJournal?._JournalIndexDetail?.PublishDate ?? "").toString();
    const publishLabel = publishDate.trim() ? publishDate.slice(0, 7) : "";

    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="col row_item_group">
                    <div className="Uncat_no_ls">
                        <ul>
                            <li>
                                <div className="Div_All_Ttext mb-1">
                                    {!!publishLabel && (
                                        <>
                                            <span>{publishLabel}</span>
                                            <span className="G_Vline">│</span>
                                        </>
                                    )}

                                    <span>
                                        {`${props.data?.SpecJournal?._JournalIndexDetail?.Volume ?? ""}卷${props.data?.SpecJournal?._JournalIndexDetail?.Issue ?? ""}期`}
                                    </span>
                                    <span className="G_Vline">│</span>
                                    <span>{`${props.data?.SpecJournal?.PageStart ?? ""}頁~${props.data?.SpecJournal?.PageEnd ?? ""}頁`}</span>
                                </div>
                            </li>

                            <li>
                                <div className="Div_All_Ttext mb-1">
                                    <span>中文關鍵詞 :</span>
                                    {props.data?.SpecJournalKeywords
                                        ?.filter((p) => p.LangCode === "zh-tw")
                                        .map((kw) => {
                                            return (
                                                <span key={`zh-${kw.RowId}`} className="ms-2">
                                                    <a
                                                        href="#"
                                                        className="ms-2"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            onPickKeyword(kw.Keyword ?? "");
                                                        }}
                                                        aria-label={`依關鍵詞篩選：${kw.Keyword ?? ""}`}
                                                        style={{ color: "inherit", textDecoration: "none" }}
                                                    >
                                                        {kw.Keyword}
                                                    </a>
                                                </span>
                                            );
                                        })}
                                </div>
                            </li>

                            <li>
                                <div className="Div_All_Ttext mb-1">
                                    <span>英文關鍵詞 :</span>
                                    {props.data?.SpecJournalKeywords
                                        ?.filter((p) => p.LangCode === "en")
                                        .map((kw) => {
                                            return (
                                                <span key={`en-${kw.RowId}`} className="ms-2">
                                                    <a
                                                        href="#"
                                                        className="ms-2"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            onPickKeyword(kw.Keyword ?? "");
                                                        }}
                                                        aria-label={`依關鍵詞篩選：${kw.Keyword ?? ""}`}
                                                        style={{ color: "inherit", textDecoration: "none" }}
                                                    >
                                                        {kw.Keyword}
                                                    </a>
                                                </span>
                                            );
                                        })}
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="col row-group">
                <hr className="hr-my-4" />
            </div>
        </>
    );
};

/** 檔案下載區 */
const FileDownload_Comp = (props: { lang: Lang; data?: SpecJournalSet }) => {
    const hasJournalFile = props.data?.SpecJournal?.JournalFileId
    const hasInsightPointFile = props.data?.SpecJournal?.InsightPointFileId
    if (!hasJournalFile && !hasInsightPointFile) return null;
    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="row">
                    <div className="col-12">
                        <ul className="fulllist-group">
                            {hasJournalFile ?
                                <li>
                                    <div className="DownItem_Box">
                                        <a className="page-item" href={`${FileManagementAPI.DOWNLOAD_URL}/${props.data?.SpecJournal?.JournalFileId}`} title={props.data?.SpecJournal?.JournalFileName ?? ""} onClick={preventHashOrVoidNav}
                                            target="_blank" rel="noopener noreferrer">
                                            <div className="icontxtbox">
                                                <span className="page_icon">
                                                    <i className="far fa-file-alt" aria-hidden="true"></i>
                                                </span>
                                                <span className="icontxt">{props.data?.SpecJournal?.JournalFileName}</span>
                                            </div>
                                        </a>
                                        <span className="G_Vline_Down">│</span>
                                        <span className="Div_All_Ttext views d-inline-flex flex-column align-items-start">
                                            {/* 第 1 行：標題 */}
                                            <span className="download-title">全文可下載</span>

                                            {/* 第 2 行：icon + 瀏覽次數 */}
                                            <span className="d-flex align-items-center">
                                                <i className="fas fa-download me-1" aria-hidden="true"></i>
                                                <span className="font-SW-normal">瀏覽次數 :</span>
                                                <span className="font-SW-normal ms-2">{0}</span>
                                            </span>
                                        </span>
                                    </div>
                                </li> : null}
                            {hasInsightPointFile ?
                                <li>
                                    <div className="DownItem_Box">
                                        <a className="page-item" href={`${FileManagementAPI.DOWNLOAD_URL}/${props.data?.SpecJournal?.InsightPointFileId}`} title={props.data?.SpecJournal?.InsightPointFileName ?? ""} onClick={preventHashOrVoidNav}
                                            target="_blank" rel="noopener noreferrer">
                                            <div className="icontxtbox">
                                                <img className="ii_image" src={insightpointImg1} alt="" />
                                                <img className="ii_image_hover" src={insightpointImg2} alt="" />
                                            </div>
                                        </a>
                                        <span className="G_Vline_Down">│</span>
                                        <span className="Div_All_Ttext + views">
                                            <i className="fas fa-download me-1" aria-hidden="true"></i>
                                            <span className="font-SW-normal">瀏覽次數 :</span>
                                            <span className="font-SW-normal + ms-2">{0}</span>
                                        </span>
                                    </div>
                                </li> : null}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="col row-group">
                <hr className="hr-my-4" />
            </div>
        </>
    );
};

/** 開放觀點 */
const OpenPoint_Comp = (props: { lang: Lang; data?: SpecJournalSet }) => {
    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="col row_item_group">
                    <div className="Div_All_BigTitle">
                        <i className="fas fa-file me-1" aria-hidden="true"></i>
                        <span>
                            <img className="iio_image" src={openPointImg} alt="" />
                        </span>
                    </div>
                </div>
            </div>

            <div className="col row-group">
                <hr className="hr-my-3" />
            </div>

            <div className="JJ_main_contentDIV">
                <div className="row">
                    <div className="col-12">
                        <ul className="openlist-group">
                            {props.data?.SpecJournalOpenPointFiles?.map((d, idx) => (
                                <li key={idx}>
                                    <div className="DownItem_Box + my-2">
                                        <a
                                            className="page-item"
                                            href={`${FileManagementAPI.DOWNLOAD_URL}/${d.OpenPointFileId}`}
                                            title={d.OpenPointFileName ?? ""}
                                            onClick={preventHashOrVoidNav}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <div className="icontxtbox">
                                                <span className="page_icon">
                                                    <i className="far fa-file-alt" aria-hidden="true"></i>
                                                </span>
                                                <span className="icontxt">{d.OpenPointFileName}</span>
                                            </div>
                                        </a>
                                        <span className="G_Vline_Down">│</span>
                                        <span className="Div_All_Ttext + views">
                                            <i className="fas fa-download me-1" aria-hidden="true"></i>
                                            <span className="font-SW-normal">瀏覽次數 :</span>
                                            <span className="font-SW-normal + ms-2">{0}</span>
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="col row-group">
                <hr className="hr-my-4" />
            </div>
        </>
    );
};

/** 相關檔案 */
const RefFile_Comp = (props: { lang: Lang; data?: SpecJournalSet }) => {
    return (
        <>
            {/* 相關檔案 標題 */}
            <div className="JJ_main_contentDIV">
                <div className="col row_item_group">
                    <div className="Div_All_BigTitle">
                        <i className="fas fa-file me-1" aria-hidden="true"></i>
                        <span>相關檔案</span>
                    </div>
                </div>
            </div>

            <div className="col row-group">
                <hr className="hr-my-4" />
            </div>

            <div className="JJ_main_contentDIV">
                <div className="row">
                    <div className="col-12">
                        <ul className="filelist-group">
                            {props.data?.SpecJournalRefFiles?.map((d, idx) => (
                                <li key={idx}>
                                    <div className="DownItem_Box + my-2">
                                        <a
                                            className="page-item"
                                            href={`${FileManagementAPI.DOWNLOAD_URL}/${d.RefFileId}`}
                                            title={d.RefFileName ?? ""}
                                            onClick={preventHashOrVoidNav}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <div className="icontxtbox">
                                                <span className="page_icon">
                                                    <i className="far fa-file-alt" aria-hidden="true"></i>
                                                </span>
                                                <span className="icontxt">{d.RefFileName}</span>
                                            </div>
                                        </a>

                                        <span className="G_Vline_Down">│</span>
                                        <span className="Div_All_Ttext + views">
                                            <i className="fas fa-download me-1" aria-hidden="true"></i>
                                            <span className="font-SW-normal">瀏覽次數 :</span>
                                            <span className="font-SW-normal + ms-2">{0}</span>
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="col row-group">
                <hr className="hr-my-4" />
            </div>
        </>
    );
};

/** 摘要 + 參考文獻 + 引文格式 */
const Accordion_Comp = (props: { lang: Lang; data?: SpecJournalSet }) => {
    const bodyHr = <div className="col row-group px-0"><hr className="hr-my-2" /></div>;

    let parseContent = useResolveInternalIds(props.data?.SpecJournal?.Memo ?? "", { locale: props.lang });
    const memoContent = parseContent.html ? parse(parseContent.html) : null;

    parseContent = useResolveInternalIds(props.data?.SpecJournal?.Memo_en ?? "", { locale: props.lang });
    const memo_enContent = parseContent.html ? parse(parseContent.html) : null;

    // 宣告：collapse 預設展開（show）
    const collapseClass = "collapse show";

    // return：render
    return (
        <>
            <div id="accordion" className="Expand_Close_Bar">
                <ul className="EC_info">
                    <li>
                        <div className={`EC-0 + card`}>
                            <div className="card-header">
                                <a href={`#99999999`} className="card-link" data-bs-toggle="collapse" type="button" role="button">
                                    <span className="Div_All_BigTitle">
                                        <i className={clsx("fas", "fa-list-ul", "me-1")} aria-hidden="true"></i>
                                        <span>摘要</span>
                                    </span>
                                </a>
                            </div>

                            {/* ✅ 預設展開 + ✅ 移除 data-bs-parent（互不影響） */}
                            <div id={"99999999"} className={collapseClass}>
                                <div className="card-body">{memoContent}{memo_enContent}</div>
                                {bodyHr}
                            </div>
                        </div>
                    </li>

                    <li>
                        <div className={`EC-0 + card`}>
                            <div className="card-header">
                                <a href={`#99999998`} className="card-link" data-bs-toggle="collapse" type="button" role="button">
                                    <span className="Div_All_BigTitle">
                                        <i className={clsx("fas", "fa-list-ul", "me-1")} aria-hidden="true"></i>
                                        <span>參考文獻</span>
                                    </span>
                                </a>
                            </div>

                            {/* ✅ 預設展開 + ✅ 移除 data-bs-parent（互不影響） */}
                            <div id={`99999998`} className={collapseClass}>
                                <div className="card-body">
                                    <ol className="bib-list">
                                        {props.data?.SpecJournalBibliography?.map((dt, idx) => {
                                            const title = (dt.Title ?? "").trim();
                                            const titleEn = (dt.Title_en ?? "").trim();
                                            const url = (dt.Url ?? "").trim();

                                            const hasZh = title.length > 0;
                                            const hasEn = titleEn.length > 0;
                                            const hasUrl = url.length > 0;

                                            if (!hasZh && !hasEn) return null;

                                            const key = `bib-${dt.RowId ?? idx}`;

                                            return (
                                                <li key={key} className="bib-item">
                                                    {hasZh && (
                                                        <p className="bib-zh">
                                                            {hasUrl ? (
                                                                <LangNavLink
                                                                    className="bib-link"
                                                                    to={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    aria-label="開啟參考文獻連結（另開新視窗）"
                                                                >
                                                                    {title}
                                                                </LangNavLink>
                                                            ) : (
                                                                title
                                                            )}
                                                        </p>
                                                    )}

                                                    {hasEn && (
                                                        <p className="bib-en">
                                                            {hasUrl ? (
                                                                <LangNavLink
                                                                    className="bib-link"
                                                                    to={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    aria-label="Open bibliography link (opens in a new tab)"
                                                                >
                                                                    {titleEn}
                                                                </LangNavLink>
                                                            ) : (
                                                                titleEn
                                                            )}
                                                        </p>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </div>

                                {bodyHr}
                            </div>
                        </div>
                    </li>

                    {props.data?.SpecJournalRefFormat?.map((sec, idx) => {
                        const cardClass = `EC-0${idx + 1} + card`;

                        const parsed = useResolveInternalIds(sec?.Content ?? "", { locale: props.lang });
                        const content = parsed.html ? parse(parsed.html) : null;

                        return (
                            <li key={sec.RowId}>
                                <div className={cardClass}>
                                    <div className="card-header">
                                        <a href={`#${sec.RowId}`} className="card-link" data-bs-toggle="collapse" type="button" role="button">
                                            <span className="Div_All_BigTitle">
                                                <i className={clsx("fas", "fa-list-ul", "me-1")} aria-hidden="true"></i>
                                                <span>{sec.Title}</span>
                                            </span>
                                        </a>
                                    </div>

                                    {/* ✅ 預設展開 + ✅ 移除 data-bs-parent（互不影響） */}
                                    <div id={`${sec.RowId}`} className={collapseClass}>
                                        <div className="card-body">{content}</div>
                                        {bodyHr}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </>
    );
};

//#region Func
const preventHashOrVoidNav = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 宣告變數
    const href = e.currentTarget.getAttribute("href") ?? "";
    const isFake = href === "" || href === "#" || href.startsWith("#");

    // 執行 function
    if (isFake) e.preventDefault();
};

const accordionKeydownMap = new WeakMap<HTMLElement, (e: KeyboardEvent) => void>();

const wireBsAccordion = (root: HTMLElement) => {
    // 宣告變數
    const toggles = root.querySelectorAll<HTMLElement>("[data-bs-toggle='collapse']");

    // 執行 function
    toggles.forEach((el) => {
        if (accordionKeydownMap.has(el)) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                e.preventDefault();
                el.click();
            }
        };

        accordionKeydownMap.set(el, onKeyDown);
        el.addEventListener("keydown", onKeyDown);
    });
};

const unwireBsAccordion = (root: HTMLElement) => {
    // 宣告變數
    const toggles = root.querySelectorAll<HTMLElement>("[data-bs-toggle='collapse']");

    // 執行 function
    toggles.forEach((el) => {
        const handler = accordionKeydownMap.get(el);
        if (!handler) return;

        el.removeEventListener("keydown", handler);
        accordionKeydownMap.delete(el);
    });
};
//#endregion
