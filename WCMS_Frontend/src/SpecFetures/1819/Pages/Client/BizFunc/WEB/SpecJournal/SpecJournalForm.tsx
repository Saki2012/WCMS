import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { ModuleContent, type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import { useBreadcrumb } from "@/Features/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp";
import insightpointImg1 from "@/SpecFetures/1819/Assets/Client/images/links/150x32/InSight_Point_bt_150x32.svg";
import insightpointImg2 from "@/SpecFetures/1819/Assets/Client/images/links/150x32/InSight_Point_bt_W_150x32.svg";
import openPointImg from "@/SpecFetures/1819/Assets/Client/images/links/150x32/Open_Point_bt_190x40.svg";
import QRCodeLogoImg from "@/SpecFetures/1819/Assets/Client/SpecImg/QRCodeLogo.png";
import { SpecJournalKeywordSearch_Comp } from "@/SpecFetures/1819/Pages/Client/BizFunc/WEB/SpecJournal/SpecJournalKeywordSearchComp";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import { QrCodeWithLogo_Comp } from "@/SysCore/Components/LibQRCode/LibQRCode_Comp";
import { DefaultLang, getLangLabel, type Lang, SUPPORTED_LANGS } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import clsx from "clsx";
import React, { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router";
import { useSpecJournalFormData } from "./SpecJournalForm_Loader";
import { useSpecJournalSearchNav } from "./SpecJournalSearchUtils";

// #region Property
type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];

interface PreviewSectionItem
{
    id: string;
    title: string;
    content: ReactNode;
}

const PREVIEW_LINE_COUNT = 10;

const PREVIEW_FALLBACK_LINE_PX = 28;

type SpecJournalDocumentItem = NonNullable<SpecJournalSet["SpecJournalDocument"]>[number];

interface DocumentGroup
{
    typeKey: string;
    title: string;
    items: SpecJournalDocumentItem[];
}

const DOCUMENT_TYPE_ORDER = ["Errata", "Correction", "Announcements", "Ethics_Statement", "Other", "1", "2", "3", "4", "0"];
// #endregion

// #region Public
export const SpecJournalForm_Comp = (props: { site: INormSite; node: INormNode; lang: Lang; }) =>
{
    const { indexId, rowId } = useParams();
    const { setItems } = useBreadcrumb();
    const location = useLocation();
    const useDetail = useSpecJournalFormData();
    const data = useDetail.data;
    const errors = useDetail.errorList;
    const title = useMemo(() =>
    {
        const d = data?.SpecJournal?._JournalIndexDetail;
        return d ? buildIssueText(props.lang, d.Volume, d.Issue) : "";
    }, [props.lang, data?.SpecJournal?._JournalIndexDetail?.Volume, data?.SpecJournal?._JournalIndexDetail?.Issue]);

    const moduleBase = useMemo(() =>
    {
        const raw = props.node.redirectTo ?? "";
        if (raw && raw !== "/") return raw;

        const segs = location.pathname.split("/").filter(Boolean);
        const s0 = segs[0]?.toLowerCase() ?? "";
        const hasLang = (SUPPORTED_LANGS as readonly string[]).includes(s0);
        const mod = hasLang ? segs[1] : segs[0];

        return mod ? `/${mod}` : "/";
    }, [props.node.redirectTo, location.pathname]);

    useEffect(() =>
    {
        const issueLabel = title;
        const issueTo = issueLabel && indexId && rowId ? joinPath(moduleBase, `List/${indexId}/${rowId}`) : undefined;
        const articleLabel = data?.SpecJournal?.Title ?? data?.SpecJournal?.Title_en ?? getSpecJournalLangText(props.lang).article;
        const next: Array<{ label: string; to?: string; }> = [];

        if (issueLabel) next.push({ label: issueLabel, to: issueTo });
        if (articleLabel) next.push({ label: articleLabel });

        setItems(next);

        return () => setItems([]);
    }, [title, data?.SpecJournal?.Title, data?.SpecJournal?.Title_en, indexId, rowId, props.lang, moduleBase, setItems]);

    const viewCountConfig = useMemo<ModuleViewCountConfig>(() =>
    {
        const request: TryCountDetailViewRequest = {
            SiteIndex: props.site.siteIndex,
            ProgId: PGID.SpecJournal,
            InternalId: data?.SpecJournal?.InternalId ?? "",
        };

        return { mode: "form", contentKey: data?.SpecJournal?.InternalId ?? "", request };
    }, [props.site.siteIndex, data?.SpecJournal?.InternalId]);

    return (
        <ModuleContent nodeTitle={title} title={title} isLoading={useDetail.isLoading} errorList={errors} viewCountConfig={viewCountConfig}>
            <SpecJournalFormContent data={data} lang={props.lang} pageViewCount={useDetail.pageViewCount} />
        </ModuleContent>
    );
};
// #endregion

// #region Section
/** 期刊標題 */
const JournalTitle_Comp = (props: { lang: Lang; data?: SpecJournalSet; }) =>
{
    const { goExclusive } = useSpecJournalSearchNav("../List");

    const onPickArticleLang = (langCode: string) =>
    {
        // 執行 function
        goExclusive({ articleLang: langCode });
    };

    const onPickTag = (tagId: string, tagName?: string) =>
    {
        // 執行 function
        goExclusive({ tagId, tagName });
    };

    const langCode = props.data?.SpecJournal?.ArticleLang ?? "";
    const langLabel = getLangLabel(langCode);
    const text = getSpecJournalLangText(props.lang);

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
                                                aria-label={text.filterByLanguage(langLabel)}
                                                title={text.filterByLanguageTitle}
                                                style={{ color: "inherit", textDecoration: "none" }}
                                                onClick={(e) =>
                                                {
                                                    e.preventDefault();
                                                    onPickArticleLang(langCode);
                                                }}
                                            >
                                                {langLabel}
                                            </a>
                                        </span>
                                    </div>
                                </div>

                                {props.data?.SpecJournalTypes?.map((t) =>
                                {
                                    const tagName = t.Tag?._TagDetail?.find((p) => p.Lang === props.lang)?.TagName;
                                    return (
                                        <div key={t.TagId} className="card_cat_item">
                                            <div className="card_cat_TxT">
                                                <span className="cat_title">
                                                    <a
                                                        href="#"
                                                        aria-label={text.filterByCategory(tagName ?? "")}
                                                        title={text.filterByCategoryTitle}
                                                        style={{ color: "inherit", textDecoration: "none" }}
                                                        onClick={(e) =>
                                                        {
                                                            e.preventDefault();
                                                            onPickTag(t.TagId ?? "", tagName ?? "");
                                                        }}
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
const BrowseCount_Comp = (props: { lang: Lang; pageViewCount: number; }) =>
{
    const text = getSpecJournalLangText(props.lang);

    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="col row_item_group">
                    <div className="Div_All_BigTitle">
                        <i className="fas fa-eye me-1" aria-hidden="true"></i>
                        <span>{text.viewCountLabel}</span>
                        <span className="ms-2">{props.pageViewCount}</span>
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
const Authors_Comp = (props: { lang: Lang; data?: SpecJournalSet; }) =>
{
    const { goExclusive } = useSpecJournalSearchNav("../List");
    const text = getSpecJournalLangText(props.lang);

    const onPickAuthor = (name: string) =>
    {
        const v = (name ?? "").trim();
        if (!v) return;
        goExclusive({ author: v });
    };
    if (!props.data?.SpecJournalAuthor || props.data.SpecJournalAuthor.length === 0) return null;
    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="col row_item_group">
                    <div className="Uncat">
                        <ul className="AuthorCardGrid" aria-label={text.authorListAriaLabel}>
                            {props.data?.SpecJournalAuthor?.map((a, idx) =>
                            {
                                return (
                                    <li key={`${a.ORCID ?? a.Email ?? "author"}-${idx}`} className="AuthorCardGrid__item">
                                        <div className="AuthorCard">
                                            <div className="AuthorCard__title">
                                                {(() =>
                                                {
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
                                                                        onClick={(e) =>
                                                                        {
                                                                            e.preventDefault();
                                                                            onPickAuthor(zh);
                                                                        }}
                                                                        aria-label={text.filterByAuthor(`${zh}${en ? ` (${en})` : ""}`)}
                                                                        title={text.filterByAuthorTitle}
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
                                                                        onClick={(e) =>
                                                                        {
                                                                            e.preventDefault();
                                                                            onPickAuthor(en);
                                                                        }}
                                                                        aria-label={text.filterByAuthor(en)}
                                                                        title={text.filterByAuthorTitle}
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
                                                                        onClick={(e) =>
                                                                        {
                                                                            e.preventDefault();
                                                                            onPickAuthor(en);
                                                                        }}
                                                                        aria-label={text.filterByAuthor(en)}
                                                                        title={text.filterByAuthorTitle}
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
                                                    {
                                                        key: "orcid",
                                                        label: "ORCID :",
                                                        value: a.ORCID
                                                            ? (
                                                                <LangLink
                                                                    to={`https://orcid.org/${encodeURIComponent(a.ORCID)}`}
                                                                    title={text.orcidLinkTitle(a.ORCID)}
                                                                >
                                                                    {a.ORCID}
                                                                    <span className="visually-hidden">{text.openInNewWindow}</span>
                                                                </LangLink>
                                                            )
                                                            : null,
                                                    },
                                                    { key: "jobTitle", label: text.jobTitleLabel, value: a.JobTitle },
                                                    {
                                                        key: "email",
                                                        label: a.AuthorType === 0 ? text.emailLabel : (
                                                            <>
                                                                <i className="far fa-envelope me-1" aria-hidden="true"></i> :
                                                            </>
                                                        ),
                                                        value: a.Email ? <a href={`mailto:${a.Email}`}>{a.Email}</a> : null,
                                                    },
                                                    { key: "country", label: text.countryLabel, value: a.Country },
                                                ].filter((x) => x.value).map((row) => (
                                                    <div key={row.key} className="Div_All_Ttext mb-1">
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
const DOI_Comp = (props: { lang: Lang; data?: SpecJournalSet; }) =>
{
    const url = props.data?.SpecJournal?.DOIUrl ?? "";
    const text = getSpecJournalLangText(props.lang);
    if (!url) return null;
    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="d-flex flex-sm-row flex-column">
                    <div className="doiText">
                        <div className="Div_All_Ttext">
                            <span>{text.doiNoLabel}</span>
                        </div>
                        <div className="Div_All_Ttext">
                            <LangLink to={url} title={text.doiLinkTitle(url)}>{url}</LangLink>
                        </div>
                    </div>
                    <div className="doiQr">
                        {props.data?.SpecJournal?.DOIUrl
                            ? <QrCodeWithLogo_Comp value={props.data?.SpecJournal?.DOIUrl ?? ""} logoSrc={QRCodeLogoImg} size={200} ariaLabel="DOI QR Code" />
                            : null}
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
const JournalInfo_Comp = (props: { lang: Lang; data?: SpecJournalSet; }) =>
{
    const { goExclusive } = useSpecJournalSearchNav("../List");
    const text = getSpecJournalLangText(props.lang);

    const onPickKeyword = (kw: string) =>
    {
        const v = (kw ?? "").trim();
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
                                        {buildIssueText(props.lang, props.data?.SpecJournal?._JournalIndexDetail?.Volume, props.data?.SpecJournal?._JournalIndexDetail?.Issue)}
                                    </span>
                                    <span className="G_Vline">│</span>
                                    <span>{buildPageText(props.lang, props.data?.SpecJournal?.PageStart, props.data?.SpecJournal?.PageEnd)}</span>
                                </div>
                            </li>

                            <li>
                                <div className="Div_All_Ttext mb-1 d-flex flex-wrap">
                                    <span>{text.zhKeywordLabel}</span>
                                    {props.data?.SpecJournalKeywords?.filter((p) => p.LangCode === "zh-tw").map((kw) =>
                                    {
                                        return (
                                            <span key={`zh-${kw.RowId}`} className="ms-2">
                                                <a
                                                    href="#"
                                                    className="ms-2"
                                                    onClick={(e) =>
                                                    {
                                                        e.preventDefault();
                                                        onPickKeyword(kw.Keyword ?? "");
                                                    }}
                                                    aria-label={text.filterByKeyword(kw.Keyword ?? "")}
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
                                <div className="Div_All_Ttext mb-1 d-flex flex-wrap">
                                    <span>{text.enKeywordLabel}</span>
                                    {props.data?.SpecJournalKeywords?.filter((p) => p.LangCode === "en").map((kw) =>
                                    {
                                        return (
                                            <span key={`en-${kw.RowId}`} className="ms-2">
                                                <a
                                                    href="#"
                                                    className="ms-2"
                                                    onClick={(e) =>
                                                    {
                                                        e.preventDefault();
                                                        onPickKeyword(kw.Keyword ?? "");
                                                    }}
                                                    aria-label={text.filterByKeyword(kw.Keyword ?? "")}
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
const FileDownload_Comp = (props: { lang: Lang; data?: SpecJournalSet; }) =>
{
    const text = getSpecJournalLangText(props.lang);
    const hasJournalFile = props.data?.SpecJournal?.JournalFileId;
    const hasInsightPointFile = props.data?.SpecJournal?.InsightPointFileId;
    if (!hasJournalFile && !hasInsightPointFile) return null;
    const journalFileIsPdf = props.data?.SpecJournal?.JournalFile?.FileExtension?.toLowerCase() === "pdf";
    const journalFileName = props.data?.SpecJournal?.JournalFileName ?? "";
    const journalFileUrl = journalFileIsPdf
        ? FileManagementAPI.get_Public_Preview_Url(props.data?.SpecJournal?.JournalFileId, journalFileName)
        : FileManagementAPI.get_Public_Download_Url(props.data?.SpecJournal?.JournalFileId, journalFileName);
    const journalDownloadCount = props.data?.SpecJournal?.JournalFile?.PublicDownloadCount ?? 0;
    const insightPointFileIsPdf = props.data?.SpecJournal?.InsightPointFile?.FileExtension?.toLowerCase() === "pdf";
    const insightPointFileName = props.data?.SpecJournal?.InsightPointFileName ?? "";
    const insightPointFileUrl = insightPointFileIsPdf
        ? FileManagementAPI.get_Public_Preview_Url(props.data?.SpecJournal?.InsightPointFileId, insightPointFileName)
        : FileManagementAPI.get_Public_Download_Url(props.data?.SpecJournal?.InsightPointFileId, insightPointFileName);
    const insightPointDownloadCount = props.data?.SpecJournal?.InsightPointFile?.PublicDownloadCount ?? 0;
    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="row">
                    <div className="col-12">
                        <ul className="fulllist-group">
                            {hasJournalFile
                                ? (
                                    <li>
                                        <div className="DownItem_Box">
                                            <LangLink className="page-item" to={journalFileUrl} title={journalFileName} onClick={preventHashOrVoidNav}>
                                                <div className="icontxtbox">
                                                    <span className="page_icon">
                                                        <i className="far fa-file-alt" aria-hidden="true"></i>
                                                    </span>
                                                    <span className="icontxt">{journalFileName}</span>
                                                </div>
                                            </LangLink>
                                            <span className="G_Vline_Down">│</span>
                                            <span className="Div_All_Ttext views d-inline-flex flex-column align-items-start">
                                                {/* 第 1 行：標題 */}
                                                <span className="download-title">{text.fullTextDownloadable}</span>
                                                {/* 第 2 行：icon + 瀏覽次數 */}
                                                <span className="d-flex align-items-center">
                                                    <i className="fas fa-download me-1" aria-hidden="true"></i>
                                                    <span className="font-SW-normal">{text.downloadCountLabel}</span>
                                                    <span className="font-SW-normal ms-2">{journalDownloadCount}</span>
                                                </span>
                                            </span>
                                        </div>
                                    </li>
                                )
                                : null}
                            {hasInsightPointFile
                                ? (
                                    <li>
                                        <div className="DownItem_Box">
                                            <LangLink
                                                className="page-item"
                                                to={insightPointFileUrl}
                                                title={insightPointFileName}
                                                onClick={preventHashOrVoidNav}
                                            >
                                                <div className="icontxtbox">
                                                    <img className="ii_image" src={insightpointImg1} alt="" />
                                                    <img className="ii_image_hover" src={insightpointImg2} alt="" />
                                                </div>
                                            </LangLink>
                                            <span className="G_Vline_Down">│</span>
                                            <span className="Div_All_Ttext + views">
                                                <i className="fas fa-download me-1" aria-hidden="true"></i>
                                                <span className="font-SW-normal">{text.downloadCountLabel}</span>
                                                <span className="font-SW-normal + ms-2">{insightPointDownloadCount}</span>
                                            </span>
                                        </div>
                                    </li>
                                )
                                : null}
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
const OpenPoint_Comp = (props: { lang: Lang; data?: SpecJournalSet; }) =>
{
    if (!props.data?.SpecJournalOpenPointFiles || props.data?.SpecJournalOpenPointFiles.length === 0) return null;

    const text = getSpecJournalLangText(props.lang);

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
                            {props.data?.SpecJournalOpenPointFiles?.map((d, idx) =>
                            {
                                const isPdf = d.OpenPointFile?.FileExtension?.toLowerCase() === "pdf";
                                const openPointFileName = d.OpenPointFileName ?? "";
                                const openPointFileUrl = isPdf
                                    ? FileManagementAPI.get_Public_Preview_Url(d.OpenPointFileId, d.OpenPointFileName)
                                    : FileManagementAPI.get_Public_Download_Url(d.OpenPointFileId, d.OpenPointFileName);
                                const openPointDownloadCount = d.OpenPointFile?.PublicDownloadCount ?? 0;
                                return (
                                    <li key={idx}>
                                        <div className="DownItem_Box + my-2">
                                            <LangLink className="page-item" to={openPointFileUrl} title={openPointFileName} onClick={preventHashOrVoidNav}>
                                                <div className="icontxtbox">
                                                    <span className="page_icon">
                                                        <i className="far fa-file-alt" aria-hidden="true"></i>
                                                    </span>
                                                    <span className="icontxt">{openPointFileName}</span>
                                                </div>
                                            </LangLink>
                                            <span className="G_Vline_Down">│</span>
                                            <span className="Div_All_Ttext + views">
                                                <i className="fas fa-download me-1" aria-hidden="true"></i>
                                                <span className="font-SW-normal">{text.downloadCountLabel}</span>
                                                <span className="font-SW-normal + ms-2">{openPointDownloadCount}</span>
                                            </span>
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

/** 相關檔案 */
const RefFile_Comp = (props: { lang: Lang; data?: SpecJournalSet; }) =>
{
    if (!props.data?.SpecJournalRefFiles || props.data?.SpecJournalRefFiles.length === 0) return null;

    const text = getSpecJournalLangText(props.lang);

    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="col row_item_group">
                    <div className="Div_All_BigTitle">
                        <i className="fas fa-file me-1" aria-hidden="true"></i>
                        <span>{text.relatedFilesTitle}</span>
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
                            {props.data?.SpecJournalRefFiles?.map((d, idx) =>
                            {
                                const isPdf = d.RefFile?.FileExtension?.toLowerCase() === "pdf";
                                const refFileName = d.RefFileName ?? "";
                                const refFileUrl = isPdf
                                    ? FileManagementAPI.get_Public_Preview_Url(d.RefFileId, refFileName)
                                    : FileManagementAPI.get_Public_Download_Url(d.RefFileId, refFileName);
                                const refFileDownloadCount = d.RefFile?.PublicDownloadCount ?? 0;
                                return (
                                    <li key={idx}>
                                        <div className="DownItem_Box + my-2">
                                            <LangLink className="page-item" to={refFileUrl} title={refFileName} onClick={preventHashOrVoidNav}>
                                                <div className="icontxtbox">
                                                    <span className="page_icon">
                                                        <i className="far fa-file-alt" aria-hidden="true"></i>
                                                    </span>
                                                    <span className="icontxt">{refFileName}</span>
                                                </div>
                                            </LangLink>
                                            <span className="G_Vline_Down">│</span>
                                            <span className="Div_All_Ttext + views">
                                                <i className="fas fa-download me-1" aria-hidden="true"></i>
                                                <span className="font-SW-normal">{text.downloadCountLabel}</span>
                                                <span className="font-SW-normal + ms-2">{refFileDownloadCount}</span>
                                            </span>
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

/** 可預覽前 10 行的展開區塊 */
const PreviewSectionCard_Comp = (props: { lang: Lang; item: PreviewSectionItem; isExpanded: boolean; onToggle: (id: string) => void; }) =>
{
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const [maxHeight, setMaxHeight] = useState<string>("none");
    const [canToggle, setCanToggle] = useState(false);
    const bodyId = `${props.item.id}-body`;
    const text = getSpecJournalLangText(props.lang);
    const applyBodyHeight = useCallback(() =>
    {
        const el = bodyRef.current;
        if (!el || typeof window === "undefined") return;
        const { previewHeight, fullHeight, canToggle: nextCanToggle } = getBodyHeights(el);
        const nextHeight = props.isExpanded ? `${fullHeight}px` : `${previewHeight}px`;
        setCanToggle(nextCanToggle);
        setMaxHeight(nextCanToggle ? nextHeight : "none");
    }, [props.isExpanded]);
    useEffect(() =>
    {
        applyBodyHeight();
    }, [applyBodyHeight, props.item.content]);
    useEffect(() =>
    {
        if (typeof window === "undefined") return;
        const onResize = () =>
        {
            applyBodyHeight();
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [applyBodyHeight]);
    const onClickToggle = () =>
    {
        props.onToggle(props.item.id);
    };
    return (
        <li>
            <div className="EC-0 card SpecJournalPreviewCard">
                <div className="card-header SpecJournalPreviewCard__header">
                    <a
                        type="button"
                        className={clsx("SpecJournalPreviewCard__button", { "is-expanded": props.isExpanded })}
                        onClick={onClickToggle}
                        aria-expanded={props.isExpanded}
                        aria-controls={bodyId}
                    >
                        <span className="Div_All_BigTitle SpecJournalPreviewCard__title">
                            <i className={clsx("fas", "fa-list-ul", "me-1")} aria-hidden="true"></i>
                            <span>{props.item.title}</span>
                        </span>

                        <span className="SpecJournalPreviewCard__icon" aria-hidden="true">
                            <i className={clsx("fas", props.isExpanded ? "fa-minus" : "fa-plus")}></i>
                        </span>
                    </a>
                </div>

                <div className="SpecJournalPreviewCard__contentWrap">
                    <div id={bodyId} ref={bodyRef} className="card-body SpecJournalPreviewCard__body" style={{ maxHeight }}>{props.item.content}</div>

                    {!props.isExpanded && canToggle && <div className="SpecJournalPreviewCard__fade" aria-hidden="true"></div>}

                    {canToggle && (
                        <div className="SpecJournalPreviewCard__footer">
                            <button
                                type="button"
                                className="SpecJournalPreviewCard__toggle"
                                onClick={onClickToggle}
                                aria-expanded={props.isExpanded}
                                aria-controls={bodyId}
                            >
                                <i className={clsx("fas", props.isExpanded ? "fa-chevron-up" : "fa-chevron-down", "me-1")} aria-hidden="true"></i>
                                <span>{props.isExpanded ? text.collapsePreview : text.expandFullText}</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="col row-group px-0">
                    <hr className="hr-my-2" />
                </div>
            </div>
        </li>
    );
};

/** 摘要 + 參考文獻 + 引文格式 */
const Accordion_Comp = (props: { lang: Lang; data?: SpecJournalSet; }) =>
{
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const text = getSpecJournalLangText(props.lang);

    const memoHtml = props.data?.SpecJournal?.Memo ?? "";
    const memoEnHtml = props.data?.SpecJournal?.Memo_en ?? "";
    const bibliographyHtml = props.data?.SpecJournal?.Bibliography ?? "";
    const memoContent = memoHtml ? <CmsHtml_Comp html={memoHtml} lang={props.lang} /> : null;
    const memoEnContent = memoEnHtml ? <CmsHtml_Comp html={memoEnHtml} lang={props.lang} /> : null;
    const bibliographyContent = bibliographyHtml ? <CmsHtml_Comp html={bibliographyHtml} lang={props.lang} /> : null;

    const sections: PreviewSectionItem[] = [];

    if (memoContent || memoEnContent)
    {
        sections.push({ id: "journal-abstract", title: text.abstractTitle, content: <>{memoContent} {memoEnContent}</> });
    }

    if (bibliographyContent)
    {
        sections.push({ id: "journal-bibliography", title: text.bibliographyTitle, content: bibliographyContent });
    }

    props.data?.SpecJournalRefFormat?.forEach((sec) =>
    {
        const html = sec?.Content ?? "";
        if (!html.trim()) return;

        sections.push({ id: `journal-ref-format-${sec.RowId}`, title: sec.Title ?? "", content: <CmsHtml_Comp html={html} lang={props.lang} /> });
    });

    if (sections.length === 0) return null;

    const onToggleSection = (id: string) =>
    {
        // 宣告變數
        const nextId = expandedId === id ? null : id;

        // 執行 function
        setExpandedId(nextId);
    };

    return (
        <>
            <div id="accordion" className="Expand_Close_Bar">
                <ul className="EC_info">
                    {sections.map((item) => (
                        <PreviewSectionCard_Comp
                            key={item.id}
                            lang={props.lang}
                            item={item}
                            isExpanded={expandedId === item.id}
                            onToggle={onToggleSection}
                        />
                    ))}
                </ul>
            </div>

            {
                /* <div className="col row-group">
                <hr className="hr-my-4" />
            </div> */
            }
        </>
    );
};

/** 說明檔案區塊 */
const Documents_Comp = (props: { lang: Lang; data?: SpecJournalSet; }) =>
{
    const documentGroups = useMemo(() => buildDocumentGroups(props.data?.SpecJournalDocument, props.lang), [props.data?.SpecJournalDocument, props.lang]);
    const text = getSpecJournalLangText(props.lang);
    if (documentGroups.length === 0) return null;
    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="col row_item_group">
                    <div className="Div_All_BigTitle">
                        <i className="fas fa-file me-1" aria-hidden="true"></i>
                        <span>{text.documentsTitle}</span>
                    </div>
                </div>
            </div>
            <div className="col row-group">
                <hr className="hr-my-4" />
            </div>
            <div className="JJ_main_contentDIV">
                <div className="row">
                    <div className="col-12">
                        {documentGroups.map((group) => (
                            <div key={group.typeKey} className="mb-4">
                                <div className="fw-bold mb-2">{group.title}</div>

                                <ul className="filelist-group">
                                    {group.items.map((d, idx) =>
                                    {
                                        const isPdf = d.Document?.FileExtension?.toLowerCase() === "pdf";
                                        const documentName = d.DocumentName ?? "";
                                        const documentUrl = isPdf
                                            ? FileManagementAPI.get_Public_Preview_Url(d.DocumentId, documentName)
                                            : FileManagementAPI.get_Public_Download_Url(d.DocumentId, documentName);
                                        const documentDownloadCount = d.Document?.PublicDownloadCount ?? 0;
                                        return (
                                            <li key={d.DocumentId ?? `${group.typeKey}-${idx}`}>
                                                <div className="DownItem_Box my-2">
                                                    <LangLink className="page-item" to={documentUrl} title={documentName} onClick={preventHashOrVoidNav}>
                                                        <div className="icontxtbox">
                                                            <span className="page_icon">
                                                                <i className="far fa-file-alt" aria-hidden="true"></i>
                                                            </span>
                                                            <span className="icontxt">{documentName}</span>
                                                        </div>
                                                    </LangLink>
                                                    <span className="G_Vline_Down">│</span>
                                                    <span className="Div_All_Ttext views">
                                                        <i className="fas fa-download me-1" aria-hidden="true"></i>
                                                        <span className="font-SW-normal">{text.downloadCountLabel}</span>
                                                        <span className="font-SW-normal ms-2">{documentDownloadCount}</span>
                                                    </span>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};
// #endregion

// #region Protected
/** 將文件依 DocumentType 分組 */
const buildDocumentGroups = (documents?: SpecJournalDocumentItem[] | null, lang: Lang = "zh-tw"): DocumentGroup[] =>
{
    // 宣告變數
    const groupMap = new Map<string, DocumentGroup>();
    // 執行 function
    (documents ?? []).forEach((doc) =>
    {
        const typeKey = getDocumentTypeKey(doc);
        const existedGroup = groupMap.get(typeKey);
        if (existedGroup)
        {
            existedGroup.items.push(doc);
            return;
        }
        groupMap.set(typeKey, { typeKey, title: getDocumentTypeTitle(typeKey, lang), items: [doc] });
    });

    // return
    return sortDocumentGroups(Array.from(groupMap.values()));
};
// #endregion

// #region Private
const joinPath = (base: string, path: string) =>
{
    const b = (base ?? "").replace(/\/+$/, "");
    const p = (path ?? "").replace(/^\/+/, "");
    if (!b) return `/${p}`;
    return `${b}/${p}`;
};

const SpecJournalFormContent = (props: { lang: Lang; data?: SpecJournalSet; pageViewCount: number; }) =>
{
    return (
        <div className="Journal_List_content">
            <div className="row">
                <div className="CategoryBar w-100">
                    <SpecJournalKeywordSearch_Comp basePath="../List" />
                </div>
                <div className="col row-group">
                    <hr className="hr-my-4" />
                </div>
                <JournalTitle_Comp {...props} />
                <BrowseCount_Comp lang={props.lang} pageViewCount={props.pageViewCount} />
                <Authors_Comp {...props} />
                <DOI_Comp {...props} />
                <JournalInfo_Comp {...props} />
                <FileDownload_Comp {...props} />
                <OpenPoint_Comp {...props} />
                <RefFile_Comp {...props} />
                <Accordion_Comp {...props} />
                <Documents_Comp {...props} />
            </div>
        </div>
    );
};

/** 取得 line-height px */
const getLineHeightPx = (value: string) =>
{
    // 宣告變數
    const px = Number.parseFloat(value ?? "0");

    // return
    return Number.isFinite(px) && px > 0 ? px : PREVIEW_FALLBACK_LINE_PX;
};

/** 計算預覽高度 */
const getPreviewHeight = (el: HTMLElement) =>
{
    // 宣告變數
    const style = window.getComputedStyle(el);
    const lineHeight = getLineHeightPx(style.lineHeight);
    const paddingTop = Number.parseFloat(style.paddingTop || "0");
    const paddingBottom = Number.parseFloat(style.paddingBottom || "0");

    // return
    return Math.ceil(lineHeight * PREVIEW_LINE_COUNT + paddingTop + paddingBottom);
};

/** 計算內容高度 */
const getBodyHeights = (el: HTMLDivElement) =>
{
    // 宣告變數
    const previewHeight = getPreviewHeight(el);
    const fullHeight = Math.ceil(el.scrollHeight);
    const canToggle = fullHeight > previewHeight + 4;

    // return
    return { previewHeight, fullHeight, canToggle };
};

const preventHashOrVoidNav = (e: React.MouseEvent<HTMLAnchorElement>) =>
{
    // 宣告變數
    const href = e.currentTarget.getAttribute("href") ?? "";
    const isFake = href === "" || href === "#" || href.startsWith("#");
    // 執行 function
    if (isFake) e.preventDefault();
};

/** 取得文件分類 key */
const getDocumentTypeKey = (doc: SpecJournalDocumentItem): string =>
{
    // 宣告變數
    const rawType = doc.DocumentType;

    // return
    return String(rawType ?? "").trim() || "Other";
};

/** 取得文件分類標題 */
const getDocumentTypeTitle = (typeKey: string, lang: Lang): string =>
{
    // return
    return getSpecJournalLangText(lang).documentTypeTitles[typeKey] ?? getSpecJournalLangText(lang).documentTypeTitles.Other;
};

/** 依既定順序排序分類 */
const sortDocumentGroups = (groups: DocumentGroup[]): DocumentGroup[] =>
{
    // 宣告變數
    const getSortIndex = (typeKey: string): number =>
    {
        const index = DOCUMENT_TYPE_ORDER.indexOf(typeKey);
        return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
    };
    // return
    return [...groups].sort((a, b) => getSortIndex(a.typeKey) - getSortIndex(b.typeKey));
};
// #endregion

// #region LangText
interface SpecJournalLangText
{
    article: string;
    abstractTitle: string;
    authorListAriaLabel: string;
    bibliographyTitle: string;
    collapsePreview: string;
    countryLabel: string;
    documentsTitle: string;
    doiNoLabel: string;
    downloadCountLabel: string;
    emailLabel: string;
    enKeywordLabel: string;
    expandFullText: string;
    filterByAuthorTitle: string;
    filterByCategoryTitle: string;
    filterByLanguageTitle: string;
    fullTextDownloadable: string;
    jobTitleLabel: string;
    openInNewWindow: string;
    relatedFilesTitle: string;
    viewCountLabel: string;
    zhKeywordLabel: string;
    documentTypeTitles: Record<string, string>;
    doiLinkTitle: (url: string) => string;
    filterByAuthor: (value: string) => string;
    filterByCategory: (value: string) => string;
    filterByKeyword: (value: string) => string;
    filterByLanguage: (value: string) => string;
    orcidLinkTitle: (orcid: string) => string;
}

const SPEC_JOURNAL_LANG_TEXT_MAP: Record<string, SpecJournalLangText> = {
    "zh-tw": {
        article: "文章",
        abstractTitle: "摘要",
        authorListAriaLabel: "作者清單",
        bibliographyTitle: "參考文獻",
        collapsePreview: "收回預覽",
        countryLabel: "地區 / 國家 :",
        documentsTitle: "說明檔案",
        doiNoLabel: "DOI編號:",
        downloadCountLabel: "下載次數 :",
        emailLabel: "電子郵件 :",
        enKeywordLabel: "英文關鍵詞 :",
        expandFullText: "展開全文",
        filterByAuthorTitle: "依作者篩選",
        filterByCategoryTitle: "依分類篩選",
        filterByLanguageTitle: "依語言篩選",
        fullTextDownloadable: "全文可下載",
        jobTitleLabel: "職稱 :",
        openInNewWindow: "（另開新視窗）",
        relatedFilesTitle: "相關檔案",
        viewCountLabel: "瀏覽次數 :",
        zhKeywordLabel: "中文關鍵詞 :",
        documentTypeTitles: {
            None: "其他",
            Errata: "勘誤",
            Correction: "校正",
            Announcements: "公告事項",
            Ethics_Statement: "倫理聲明",
            Other: "其他",
            "0": "其他",
            "1": "勘誤",
            "2": "校正",
            "3": "公告事項",
            "4": "倫理聲明",
        },
        doiLinkTitle: (url: string) => `DOI 連結：${url}`,
        filterByAuthor: (value: string) => `依作者篩選：${value}`,
        filterByCategory: (value: string) => `依分類篩選：${value}`,
        filterByKeyword: (value: string) => `依關鍵詞篩選：${value}`,
        filterByLanguage: (value: string) => `依語言篩選：${value}`,
        orcidLinkTitle: (orcid: string) => `前往 ORCID：${orcid}`,
    },
    en: {
        article: "Article",
        abstractTitle: "Abstract",
        authorListAriaLabel: "Author list",
        bibliographyTitle: "References",
        collapsePreview: "Collapse Preview",
        countryLabel: "Region / Country :",
        documentsTitle: "Documents",
        doiNoLabel: "DOI No.:",
        downloadCountLabel: "Downloads :",
        emailLabel: "Email :",
        enKeywordLabel: "English Keywords :",
        expandFullText: "Show Full Text",
        filterByAuthorTitle: "Filter by author",
        filterByCategoryTitle: "Filter by category",
        filterByLanguageTitle: "Filter by language",
        fullTextDownloadable: "Full Text Downloadable",
        jobTitleLabel: "Job Title :",
        openInNewWindow: "(opens in a new window)",
        relatedFilesTitle: "Related Files",
        viewCountLabel: "Views :",
        zhKeywordLabel: "Chinese Keywords :",
        documentTypeTitles: {
            None: "Other",
            Errata: "Errata",
            Correction: "Correction",
            Announcements: "Announcements",
            Ethics_Statement: "Ethics Statement",
            Other: "Other",
            "0": "Other",
            "1": "Errata",
            "2": "Correction",
            "3": "Announcements",
            "4": "Ethics Statement",
        },
        doiLinkTitle: (url: string) => `DOI link: ${url}`,
        filterByAuthor: (value: string) => `Filter by author: ${value}`,
        filterByCategory: (value: string) => `Filter by category: ${value}`,
        filterByKeyword: (value: string) => `Filter by keyword: ${value}`,
        filterByLanguage: (value: string) => `Filter by language: ${value}`,
        orcidLinkTitle: (orcid: string) => `Open ORCID: ${orcid}`,
    },
};
/** 取得期刊詳細頁文字設定 */
const getSpecJournalLangText = (lang: Lang): SpecJournalLangText =>
{
    return SPEC_JOURNAL_LANG_TEXT_MAP[lang] ?? SPEC_JOURNAL_LANG_TEXT_MAP[DefaultLang];
};
/** 建立卷期文字 */
const buildIssueText = (lang: Lang, volume?: string | number | null, issue?: string | number | null): string =>
{
    const volumeText = `${volume ?? ""}`.trim();
    const issueText = `${issue ?? ""}`.trim();
    return lang === "en" ? `Vol. ${volumeText}, No. ${issueText}` : `${volumeText}卷${issueText}期`;
};
/** 建立頁碼文字 */
const buildPageText = (lang: Lang, start?: string | number | null, end?: string | number | null): string =>
{
    const startText = `${start ?? ""}`.trim();
    const endText = `${end ?? ""}`.trim();
    const rangeText = endText ? `${startText}-${endText}` : startText;
    return lang === "en" ? `p. ${rangeText}` : `${startText}頁~${endText}頁`;
};
// #endregion
