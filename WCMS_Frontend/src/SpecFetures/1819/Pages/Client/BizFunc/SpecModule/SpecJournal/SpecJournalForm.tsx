import { getLangLabel, SUPPORTED_LANGS, type Lang } from "@/SysCore/i18n/lang";
import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import parse from "html-react-parser";
import insightpointImg1 from "@/SpecFetures/1819/Assets/Client/images/links/150x32/InSight_Point_bt_150x32.svg";
import insightpointImg2 from "@/SpecFetures/1819/Assets/Client/images/links/150x32/InSight_Point_bt_W_150x32.svg";
import openPointImg from "@/SpecFetures/1819/Assets/Client/images/links/150x32/Open_Point_bt_190x40.svg";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent, { type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { components } from "@/types/api";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import clsx from "clsx";
import { QrCodeWithLogo_Comp } from "@/SysCore/Components/LibQRCode/LibQRCode_Comp";
import QRCodeLogoImg from "@/SpecFetures/1819/Assets/Client/SpecImg/QRCodeLogo.png";
import { useResolveInternalIds } from "@/SysCore/Components/File/useResolveInternalIds";
import { useLocation, useParams } from "react-router";
import { useBreadcrumb } from "@/Features/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp";
import { SpecJournalKeywordSearch_Comp } from "@/SpecFetures/1819/Pages/Client/BizFunc/SpecModule/SpecJournal/SpecJournalKeywordSearchComp";
import { useSpecJournalSearchNav } from "./SpecJournalSearchUtils";
import { useSpecJournalFormData } from "./SpecJournalForm_Loader";
import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/SystemSetting/SiteInfo/SiteViewCount/SiteViewCount_Api";
import { PGID } from "@/types/SchemaFields";
type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];

const joinPath = (base: string, path: string) => {
    const b = (base ?? "").replace(/\/+$/, "");
    const p = (path ?? "").replace(/^\/+/, "");
    if (!b) return `/${p}`;
    return `${b}/${p}`;
};

export const SpecJournalForm_Comp = (props: { site: INormSite; node: INormNode; lang: Lang }) => {
    const { indexId, rowId } = useParams();
    const { setItems } = useBreadcrumb();
    const location = useLocation();
    const useDetail = useSpecJournalFormData();
    const data = useDetail.data;
    const errors = useDetail.errorList;
    const title = useMemo(() => {
        const d = data?.SpecJournal?._JournalIndexDetail;
        return d ? `Vol.${d.Volume}, No.${d.Issue}` : "";
    }, [data?.SpecJournal?._JournalIndexDetail?.Volume, data?.SpecJournal?._JournalIndexDetail?.Issue]);

    const moduleBase = useMemo(() => {
        const raw = props.node.redirectTo ?? "";
        if (raw && raw !== "/") return raw;

        const segs = location.pathname.split("/").filter(Boolean);
        const s0 = segs[0]?.toLowerCase() ?? "";
        const hasLang = (SUPPORTED_LANGS as readonly string[]).includes(s0);
        const mod = hasLang ? segs[1] : segs[0];

        return mod ? `/${mod}` : "/";
    }, [props.node.redirectTo, location.pathname]);

    useEffect(() => {
        const issueLabel = title;
        const issueTo = issueLabel && indexId && rowId ? joinPath(moduleBase, `List/${indexId}/${rowId}`) : undefined;
        const articleLabel = data?.SpecJournal?.Title ?? data?.SpecJournal?.Title_en ?? (props.lang === "zh-tw" ? "文章" : "Article");
        const next: Array<{ label: string; to?: string }> = [];

        if (issueLabel) next.push({ label: issueLabel, to: issueTo });
        if (articleLabel) next.push({ label: articleLabel });

        setItems(next);

        return () => setItems([]);
    }, [title, data?.SpecJournal?.Title, data?.SpecJournal?.Title_en, indexId, rowId, props.lang, moduleBase, setItems]);

    const viewCountConfig = useMemo<ModuleViewCountConfig>(() => {
        const request: TryCountDetailViewRequest = {
            SiteIndex: props.site.siteIndex,
            ProgId: PGID.SpecJournal,
            InternalId: data?.SpecJournal?.InternalId ?? "",
        };

        return {
            mode: "form",
            contentKey: data?.SpecJournal?.InternalId ?? "",
            request,
        };
    }, [props.site.siteIndex, data?.SpecJournal?.InternalId]);

    return (
        <ModuleContent
            nodeTitle={title}
            title={title}
            isLoading={useDetail.isLoading}
            errorList={errors}
            viewCountConfig={viewCountConfig}
        >
            <SpecJournalFormContent
                data={data}
                lang={props.lang}
                pageViewCount={useDetail.pageViewCount}
            />
        </ModuleContent>
    );
};


const SpecJournalFormContent = (props: { lang: Lang; data?: SpecJournalSet; pageViewCount: number }) => {
    
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
                <BrowseCount_Comp pageViewCount={props.pageViewCount} />
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
                                            <a href="#" aria-label={`依語言篩選：${langLabel}`} title="依語言篩選" style={{ color: "inherit", textDecoration: "none" }}
                                                onClick={(e) => { e.preventDefault(); onPickArticleLang(langCode);}}>
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
                                                    <a href="#" aria-label={`依分類篩選：${tagName ?? ""}`} title="依分類篩選" style={{ color: "inherit", textDecoration: "none" }}
                                                        onClick={(e) => { e.preventDefault(); onPickTag(t.TagId ?? "", tagName ?? "");}}>
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
const BrowseCount_Comp = (props: { pageViewCount: number }) => {
    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="col row_item_group">
                    <div className="Div_All_BigTitle">
                        <i className="fas fa-eye me-1" aria-hidden="true"></i>
                        <span>瀏覽次數 :</span>
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
const Authors_Comp = (props: { lang: Lang; data?: SpecJournalSet }) => {
    const { goExclusive } = useSpecJournalSearchNav("../List");
    const onPickAuthor = (name: string) => {const v = (name ?? "").trim(); if (!v) return; goExclusive({ author: v });};
    if(!props.data?.SpecJournalAuthor||props.data.SpecJournalAuthor.length===0) return null;
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
                                                    const zh = (a.AuthorName ?? "").trim();
                                                    const en = (a.AuthorName_en ?? "").trim();
                                                    const showZh = !!zh;
                                                    const showEn = !!en && !showZh;

                                                    // return
                                                    return (
                                                        <>
                                                            {showZh && (
                                                                <div className="AuthorCard__nameZh">
                                                                    <a href="#" onClick={(e) => { e.preventDefault(); onPickAuthor(zh); }} aria-label={`依作者篩選：${zh}${en ? ` (${en})` : ""}`} title="依作者篩選" style={{ color: "inherit", textDecoration: "none" }}>
                                                                        {zh}
                                                                    </a>
                                                                </div>
                                                            )}
                                                            {showZh && !!en && (
                                                                <div className="AuthorCard__nameEn ms-2">
                                                                    （
                                                                    <a href="#" onClick={(e) => { e.preventDefault(); onPickAuthor(en); }} aria-label={`依作者篩選：${en}`} title="依作者篩選" style={{ color: "inherit", textDecoration: "none" }} >
                                                                        {en}
                                                                    </a>
                                                                    ）
                                                                </div>
                                                            )}
                                                            {showEn && (
                                                                <div className="AuthorCard__nameEn">
                                                                    <a href="#" onClick={(e) => { e.preventDefault(); onPickAuthor(en); }} aria-label={`依作者篩選：${en}`} title="依作者篩選" style={{ color: "inherit", textDecoration: "none" }}>
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
                                                    { label: "電子郵件 :", value: a.Email ? <a href={`mailto:${a.Email}`}>{a.Email}</a> : null,},
                                                    { label: "地區 / 國家 :", value: a.Country },
                                                ].filter((x) => x.value).map((row) => (
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
    if(!url) return null;
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
    const onPickKeyword = (kw: string) => {const v = (kw ?? "").trim(); if (!v) return; goExclusive({ keyword: v });};
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
                                    {props.data?.SpecJournalKeywords?.filter((p) => p.LangCode === "zh-tw").map((kw) => {
                                        return (
                                            <span key={`zh-${kw.RowId}`} className="ms-2">
                                                <a href="#" className="ms-2" onClick={(e) => { e.preventDefault(); onPickKeyword(kw.Keyword ?? "");}} aria-label={`依關鍵詞篩選：${kw.Keyword ?? ""}`} style={{ color: "inherit", textDecoration: "none" }}>
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
                                    {props.data?.SpecJournalKeywords?.filter((p) => p.LangCode === "en").map((kw) => {
                                        return (
                                            <span key={`en-${kw.RowId}`} className="ms-2">
                                                <a href="#" className="ms-2" onClick={(e) => {e.preventDefault(); onPickKeyword(kw.Keyword ?? ""); }} aria-label={`依關鍵詞篩選：${kw.Keyword ?? ""}`} style={{ color: "inherit", textDecoration: "none" }}>
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
    const journalFileIsPdf = props.data?.SpecJournal?.JournalFile?.FileExtension?.toLowerCase()==="pdf"
    const journalFileName = props.data?.SpecJournal?.JournalFileName??"";
    const journalFileUrl = journalFileIsPdf ? FileManagementAPI.get_Public_Preview_Url(props.data?.SpecJournal?.JournalFileId,journalFileName): FileManagementAPI.get_Public_Download_Url(props.data?.SpecJournal?.JournalFileId,journalFileName);
    const journalDownloadCount = props.data?.SpecJournal?.JournalFile?.PublicDownloadCount ?? 0
    const insightPointFileIsPdf = props.data?.SpecJournal?.InsightPointFile?.FileExtension?.toLowerCase()==="pdf"
    const insightPointFileName = props.data?.SpecJournal?.InsightPointFileName??"";
    const insightPointFileUrl = insightPointFileIsPdf ? FileManagementAPI.get_Public_Preview_Url(props.data?.SpecJournal?.InsightPointFileId,insightPointFileName): FileManagementAPI.get_Public_Download_Url(props.data?.SpecJournal?.InsightPointFileId,insightPointFileName);
    const insightPointDownloadCount = props.data?.SpecJournal?.InsightPointFile?.PublicDownloadCount ?? 0
    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="row">
                    <div className="col-12">
                        <ul className="fulllist-group">
                            {hasJournalFile ?
                                <li>
                                    <div className="DownItem_Box">
                                        <a className="page-item" href={journalFileUrl} title={journalFileName} onClick={preventHashOrVoidNav} target="_blank" rel="noopener noreferrer">
                                            <div className="icontxtbox">
                                                <span className="page_icon">
                                                    <i className="far fa-file-alt" aria-hidden="true"></i>
                                                </span>
                                                <span className="icontxt">{journalFileName}</span>
                                            </div>
                                        </a>
                                        <span className="G_Vline_Down">│</span>
                                        <span className="Div_All_Ttext views d-inline-flex flex-column align-items-start">
                                            {/* 第 1 行：標題 */}
                                            <span className="download-title">全文可下載</span>
                                            {/* 第 2 行：icon + 瀏覽次數 */}
                                            <span className="d-flex align-items-center">
                                                <i className="fas fa-download me-1" aria-hidden="true"></i>
                                                <span className="font-SW-normal">下載次數 :</span>
                                                <span className="font-SW-normal ms-2">{journalDownloadCount}</span>
                                            </span>
                                        </span>
                                    </div>
                                </li> : null}
                            {hasInsightPointFile ?
                                <li>
                                    <div className="DownItem_Box">
                                        <a className="page-item" href={insightPointFileUrl} title={insightPointFileName} onClick={preventHashOrVoidNav} target="_blank" rel="noopener noreferrer">
                                            <div className="icontxtbox">
                                                <img className="ii_image" src={insightpointImg1} alt="" />
                                                <img className="ii_image_hover" src={insightpointImg2} alt="" />
                                            </div>
                                        </a>
                                        <span className="G_Vline_Down">│</span>
                                        <span className="Div_All_Ttext + views">
                                            <i className="fas fa-download me-1" aria-hidden="true"></i>
                                            <span className="font-SW-normal">下載次數 :</span>
                                            <span className="font-SW-normal + ms-2">{insightPointDownloadCount}</span>
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
    if(!props.data?.SpecJournalOpenPointFiles||props.data?.SpecJournalOpenPointFiles.length===0) return null


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
                            {props.data?.SpecJournalOpenPointFiles?.map((d, idx) => {
                                const isPdf = d.OpenPointFile?.FileExtension?.toLowerCase()==="pdf"
                                const openPointFileName = d.OpenPointFileName??"";
                                const openPointFileUrl = isPdf? FileManagementAPI.get_Public_Preview_Url(d.OpenPointFileId,d.OpenPointFileName) : FileManagementAPI.get_Public_Download_Url(d.OpenPointFileId,d.OpenPointFileName)
                                const openPointDownloadCount = d.OpenPointFile?.PublicDownloadCount??0
                                return (
                                    <li key={idx}>
                                        <div className="DownItem_Box + my-2">
                                            <a className="page-item" href={openPointFileUrl} title={openPointFileName} onClick={preventHashOrVoidNav} target="_blank" rel="noopener noreferrer">
                                                <div className="icontxtbox">
                                                    <span className="page_icon">
                                                        <i className="far fa-file-alt" aria-hidden="true"></i>
                                                    </span>
                                                    <span className="icontxt">{openPointFileName}</span>
                                                </div>
                                            </a>
                                            <span className="G_Vline_Down">│</span>
                                            <span className="Div_All_Ttext + views">
                                                <i className="fas fa-download me-1" aria-hidden="true"></i>
                                                <span className="font-SW-normal">下載次數 :</span>
                                                <span className="font-SW-normal + ms-2">{openPointDownloadCount}</span>
                                            </span>
                                        </div>
                                    </li>
                            )})}
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
    if(!props.data?.SpecJournalRefFiles||props.data?.SpecJournalRefFiles.length===0) return null
    return (
        <>
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
                            {props.data?.SpecJournalRefFiles?.map((d, idx) => 
                            {
                                const isPdf = d.RefFile?.FileExtension?.toLowerCase()==="pdf"
                                const refFileName = d.RefFileName??""
                                const refFileUrl =isPdf ? FileManagementAPI.get_Public_Preview_Url(d.RefFileId,refFileName) : FileManagementAPI.get_Public_Download_Url(d.RefFileId,refFileName)
                                const refFileDownloadCount = d.RefFile?.PublicDownloadCount??0;
                                return (
                                <li key={idx}>
                                    <div className="DownItem_Box + my-2">
                                        <a className="page-item" href={refFileUrl} title={refFileName} onClick={preventHashOrVoidNav} target="_blank" rel="noopener noreferrer">
                                            <div className="icontxtbox">
                                                <span className="page_icon">
                                                    <i className="far fa-file-alt" aria-hidden="true"></i>
                                                </span>
                                                <span className="icontxt">{refFileName}</span>
                                            </div>
                                        </a>
                                        <span className="G_Vline_Down">│</span>
                                        <span className="Div_All_Ttext + views">
                                            <i className="fas fa-download me-1" aria-hidden="true"></i>
                                            <span className="font-SW-normal">下載次數 :</span>
                                            <span className="font-SW-normal + ms-2">{refFileDownloadCount}</span>
                                        </span>
                                    </div>
                                </li>
                            )})}
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

interface PreviewSectionItem {
    id: string;
    title: string;
    content: ReactNode;
}

const PREVIEW_LINE_COUNT = 10;
const PREVIEW_FALLBACK_LINE_PX = 28;

/** 取得 line-height px */
const getLineHeightPx = (value: string) => {
    // 宣告變數
    const px = Number.parseFloat(value ?? "0");

    // return
    return Number.isFinite(px) && px > 0 ? px : PREVIEW_FALLBACK_LINE_PX;
};

/** 計算預覽高度 */
const getPreviewHeight = (el: HTMLElement) => {
    // 宣告變數
    const style = window.getComputedStyle(el);
    const lineHeight = getLineHeightPx(style.lineHeight);
    const paddingTop = Number.parseFloat(style.paddingTop || "0");
    const paddingBottom = Number.parseFloat(style.paddingBottom || "0");

    // return
    return Math.ceil(lineHeight * PREVIEW_LINE_COUNT + paddingTop + paddingBottom);
};

/** 計算內容高度 */
const getBodyHeights = (el: HTMLDivElement) => {
    // 宣告變數
    const previewHeight = getPreviewHeight(el);
    const fullHeight = Math.ceil(el.scrollHeight);
    const canToggle = fullHeight > previewHeight + 4;

    // return
    return { previewHeight, fullHeight, canToggle };
};

/** 可預覽前 10 行的展開區塊 */
const PreviewSectionCard_Comp = (props: {item: PreviewSectionItem; isExpanded: boolean; onToggle: (id: string) => void;}) => {
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const [maxHeight, setMaxHeight] = useState<string>("none");
    const [canToggle, setCanToggle] = useState(false);
    const bodyId = `${props.item.id}-body`;
    const applyBodyHeight = useCallback(() => {
        const el = bodyRef.current;
        if (!el || typeof window === "undefined") return;
        const { previewHeight, fullHeight, canToggle: nextCanToggle } = getBodyHeights(el);
        const nextHeight = props.isExpanded ? `${fullHeight}px` : `${previewHeight}px`;
        setCanToggle(nextCanToggle);
        setMaxHeight(nextCanToggle ? nextHeight : "none");
    }, [props.isExpanded]);
    useEffect(() => {applyBodyHeight(); }, [applyBodyHeight, props.item.content]);
    useEffect(() => {
        if (typeof window === "undefined") return;
        const onResize = () => {applyBodyHeight();};
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [applyBodyHeight]);
    const onClickToggle = () => {props.onToggle(props.item.id);};
    return (
        <li>
            <div className="EC-0 card SpecJournalPreviewCard">
                <div className="card-header SpecJournalPreviewCard__header">
                    <a
                        type="button"
                        className={clsx("SpecJournalPreviewCard__button", {
                            "is-expanded": props.isExpanded,
                        })}
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
                    <div
                        id={bodyId}
                        ref={bodyRef}
                        className="card-body SpecJournalPreviewCard__body"
                        style={{ maxHeight }}
                    >
                        {props.item.content}
                    </div>

                    {!props.isExpanded && canToggle && (
                        <div className="SpecJournalPreviewCard__fade" aria-hidden="true"></div>
                    )}

                    {canToggle && (
                        <div className="SpecJournalPreviewCard__footer">
                            <button
                                type="button"
                                className="SpecJournalPreviewCard__toggle"
                                onClick={onClickToggle}
                                aria-expanded={props.isExpanded}
                                aria-controls={bodyId}
                            >
                                <i
                                    className={clsx(
                                        "fas",
                                        props.isExpanded ? "fa-chevron-up" : "fa-chevron-down",
                                        "me-1"
                                    )}
                                    aria-hidden="true"
                                ></i>
                                <span>{props.isExpanded ? "收回預覽" : "展開全文"}</span>
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
const Accordion_Comp = (props: { lang: Lang; data?: SpecJournalSet }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    let parseContent = useResolveInternalIds(props.data?.SpecJournal?.Memo ?? "", { locale: props.lang });
    const memoContent = parseContent.html ? parse(parseContent.html) : null;

    parseContent = useResolveInternalIds(props.data?.SpecJournal?.Memo_en ?? "", { locale: props.lang });
    const memoEnContent = parseContent.html ? parse(parseContent.html) : null;

    parseContent = useResolveInternalIds(props.data?.SpecJournal?.Bibliography ?? "", { locale: props.lang });
    const bibliographyContent = parseContent.html ? parse(parseContent.html) : null;

    const sections: PreviewSectionItem[] = [];

    if (memoContent || memoEnContent) {
        sections.push({
            id: "journal-abstract",
            title: "摘要",
            content: (
                <>
                    {memoContent}
                    {memoEnContent}
                </>
            ),
        });
    }

    if (bibliographyContent) {
        sections.push({
            id: "journal-bibliography",
            title: "參考文獻",
            content: bibliographyContent,
        });
    }

    props.data?.SpecJournalRefFormat?.forEach((sec) => {
        const parsed = useResolveInternalIds(sec?.Content ?? "", { locale: props.lang });
        const content = parsed.html ? parse(parsed.html) : null;
        if (!content) return;

        sections.push({
            id: `journal-ref-format-${sec.RowId}`,
            title: sec.Title ?? "",
            content,
        });
    });

    if (sections.length === 0) return null;

    const onToggleSection = (id: string) => {
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
                            item={item}
                            isExpanded={expandedId === item.id}
                            onToggle={onToggleSection}
                        />
                    ))}
                </ul>
            </div>

            <div className="col row-group">
                <hr className="hr-my-4" />
            </div>
        </>
    );
};
/** 說明檔案區塊 */
const Documents_Comp = (props: { lang: Lang; data?: SpecJournalSet }) => {
    const documentGroups = useMemo(() => buildDocumentGroups(props.data?.SpecJournalDocument),[props.data?.SpecJournalDocument],);
    if (documentGroups.length === 0) return null;
    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="col row_item_group">
                    <div className="Div_All_BigTitle">
                        <i className="fas fa-file me-1" aria-hidden="true"></i>
                        <span>說明檔案</span>
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
                                <div className="fw-bold mb-2">
                                    {group.title}
                                </div>

                                <ul className="filelist-group">
                                    {group.items.map((d, idx) => {
                                        const isPdf = d.Document?.FileExtension?.toLowerCase()==="pdf"
                                        const documentName = d.DocumentName??"";
                                        const documentUrl = isPdf ? FileManagementAPI.get_Public_Preview_Url(d.DocumentId,documentName): FileManagementAPI.get_Public_Download_Url(d.DocumentId,documentName)
                                        const documentDownloadCount = d.Document?.PublicDownloadCount??0
                                        return(
                                            <li key={d.DocumentId ?? `${group.typeKey}-${idx}`}>
                                                <div className="DownItem_Box my-2">
                                                    <a className="page-item" href={documentUrl} title={documentName} onClick={preventHashOrVoidNav} target="_blank" rel="noopener noreferrer">
                                                        <div className="icontxtbox">
                                                            <span className="page_icon">
                                                                <i className="far fa-file-alt" aria-hidden="true"></i>
                                                            </span>
                                                            <span className="icontxt">
                                                                {documentName}
                                                            </span>
                                                        </div>
                                                    </a>
                                                    <span className="G_Vline_Down">│</span>
                                                    <span className="Div_All_Ttext views">
                                                        <i className="fas fa-download me-1" aria-hidden="true"></i>
                                                        <span className="font-SW-normal">下載次數 :</span>
                                                        <span className="font-SW-normal ms-2">{documentDownloadCount}</span>
                                                    </span>
                                                </div>
                                            </li>
                                        )})}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
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

type SpecJournalDocumentItem = NonNullable<SpecJournalSet["SpecJournalDocument"]>[number];

interface DocumentGroup {
    typeKey: string;
    title: string;
    items: SpecJournalDocumentItem[];
}

const DOCUMENT_TYPE_TITLE_MAP: Record<string, string> = {
    // enum 名稱
    None: "其他",
    Errata: "勘誤",
    Correction: "校正",
    Announcements: "公告事項",
    Ethics_Statement: "倫理聲明",
    Other: "其他",

    // enum 數值
    "0": "其他",
    "1": "勘誤",
    "2": "校正",
    "3": "公告事項",
    "4": "倫理聲明",
};


const DOCUMENT_TYPE_ORDER = [
    "Errata",
    "Correction",
    "Announcements",
    "Ethics_Statement",
    "Other",
    "1",
    "2",
    "3",
    "4",
    "0",
];
/** 取得文件分類 key */
const getDocumentTypeKey = (doc: SpecJournalDocumentItem): string => {
    // 宣告變數
    const rawType = doc.DocumentType;

    // return
    return String(rawType ?? "").trim() || "Other";
};

/** 取得文件分類標題 */
const getDocumentTypeTitle = (typeKey: string): string => {
    // return
    return DOCUMENT_TYPE_TITLE_MAP[typeKey] ?? "其他";
};

/** 依既定順序排序分類 */
const sortDocumentGroups = (groups: DocumentGroup[]): DocumentGroup[] => {
    // 宣告變數
    const getSortIndex = (typeKey: string): number => {
        const index = DOCUMENT_TYPE_ORDER.indexOf(typeKey);
        return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
    };
    // return
    return [...groups].sort((a, b) => getSortIndex(a.typeKey) - getSortIndex(b.typeKey));
};

/** 將文件依 DocumentType 分組 */
const buildDocumentGroups = (documents?: SpecJournalDocumentItem[] | null): DocumentGroup[] => {
    // 宣告變數
    const groupMap = new Map<string, DocumentGroup>();
    // 執行 function
    (documents ?? []).forEach((doc) => {
        const typeKey = getDocumentTypeKey(doc);
        const existedGroup = groupMap.get(typeKey);
        if (existedGroup) {
            existedGroup.items.push(doc);
            return;
        }
        groupMap.set(typeKey, {
            typeKey,
            title: getDocumentTypeTitle(typeKey),
            items: [doc],
        });
    });

    // return
    return sortDocumentGroups(Array.from(groupMap.values()));
};

//#endregion
