import { getLangLabel, SUPPORTED_LANGS, type Lang } from "@/SysCore/i18n/lang";
import React, { useEffect, useMemo } from "react";
import parse from 'html-react-parser';
import insightpointImg1 from '@/SpecFetures/1819/Assets/Client/images/links/150x32/InSight_Point_bt_150x32.svg'
import insightpointImg2 from '@/SpecFetures/1819/Assets/Client/images/links/150x32/InSight_Point_bt_W_150x32.svg'
import openPointImg from '@/SpecFetures/1819/Assets/Client/images/links/150x32/Open_Point_bt_190x40.svg'
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import type { components } from '@/types/api';
import SpecJournalProvider from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecMusical/SpecJournal_Api";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import clsx from "clsx";
import { QrCodeWithLogo_Comp } from "@/SysCore/Components/LibQRCode/LibQRCode_Comp";
import QRCodeLogoImg from '@/SpecFetures/1819/Assets/Client/SpecImg/QRCodeLogo.png'
import { useResolveInternalIds } from "@/SysCore/Components/File/useResolveInternalIds";
import { useLocation, useParams } from "react-router";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { SpecJournalAuthorFields, SpecJournalBibliographyFields, SpecJournalIndexDetailFields, SpecJournalKeywordsFields, SpecJournalModelFields, SpecJournalOpenPointFilesFields, SpecJournalRefFilesFields, SpecJournalRefFormatFields, SpecJournalTypesFields, TagDataFields, TagDetailFields } from "@/types/SchemaFields";
import { useBreadcrumb } from "@/Features/Pages/Client/Scaffold/SubPages/Section/BreadCrumb_Comp";
import { SpecJournalKeywordSearch_Comp } from "@/SpecFetures/1819/Pages/Client/BizFunc/SpecModule/SpecJournal/SpecJournalKeywordSearchComp";
import { useSpecJournalSearchNav } from "./SpecJournalSearchUtils";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"]

const joinPath = (base: string, path: string) => {
    const b = (base ?? "").replace(/\/+$/, "");     // 去尾端 /
    const p = (path ?? "").replace(/^\/+/, "");     // 去開頭 /
    if (!b) return `/${p}`;                         // base 空就用 /xxx（不會變 //）
    return `${b}/${p}`;
};
export const SpecJournalForm_Comp = (props: { node: INormNode; lang: Lang; }) => {
    const { indexId, rowId, journalId } = useParams()
    const { setItems } = useBreadcrumb();

    const pvdr = useMemo(() => { return SpecJournalProvider() }, [])
    const useJournalData = dataFetch(pvdr, journalId ?? "");
    const data = useMemo(() => useJournalData?.rawData?.[0], [useJournalData.rawData])
    const isLoading = [useJournalData.isLoading];
    const errors = [useJournalData.error];
    const title = useMemo(() => data?.SpecJournal?._JournalIndexDetail ? `Vol.${data.SpecJournal._JournalIndexDetail.Volume}, No.${data.SpecJournal._JournalIndexDetail.Issue}` : "", [data?.SpecJournal?._JournalIndexDetail?.Volume, data?.SpecJournal?._JournalIndexDetail?.Issue,]);
    const location = useLocation();

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
        const articleLabel = data?.SpecJournal?.Title ?? data?.SpecJournal?.Title_en ?? (props.lang === "zh-tw" ? "文章" : "Article");
        const next = [];
        if (issueLabel) next.push({ label: issueLabel, to: issueTo });
        if (articleLabel) next.push({ label: articleLabel });
        setItems(next);
        // ✅ 離開頁面就清空
        return () => setItems([]);
    }, [title, data?.SpecJournal?.Title, data?.SpecJournal?.Title_en, indexId, rowId, props.lang, setItems]);
    return (
        <ModuleContent nodeTitle={title} title={title} loadingList={isLoading} errorList={errors} >
            <SpecJournalFormContent data={data} lang={props.lang} />
        </ModuleContent>
    );
};

const SpecJournalFormContent = (props: { lang: Lang; data: SpecJournalSet }) => {
    useEffect(() => {
        const root = document.getElementById("ContentPlaceContent_ContentConentA");
        if (!root) return;
        wireBsAccordion(root);
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
    )
}
/**期刊標題 */
const JournalTitle_Comp = (props: { lang: Lang; data: SpecJournalSet }) => {
    const { goExclusive } = useSpecJournalSearchNav("../List")
    const onPickArticleLang = (langCode: string) => { goExclusive({ articleLang: langCode }); };
    const onPickTag = (tagId: string, tagName?: string) => { goExclusive({ tagId, tagName }); };
    const langCode = props.data.SpecJournal?.ArticleLang ?? "";
    const langLabel = getLangLabel(langCode);
    return (<>
        {/* 編者言 標題區 */}
        <div className="JJ_main_contentDIV">
            <div className="col row_item_group">
                <div className="IItemBox_content">
                    <div className="card_catDiv">
                        <div className="wrap_box">

                            <div className="card_cat_item">
                                <div className="card_cat_TxT">
                                    <span className="cat_title">
                                        <a href="#" onClick={(e) => { e.preventDefault(); onPickArticleLang(langCode); }}
                                            aria-label={`依語言篩選：${langLabel}`} title="依語言篩選" style={{ color: "inherit", textDecoration: "none" }}>
                                            {langLabel}
                                        </a>
                                    </span>
                                </div>
                            </div>

                            {props.data?.SpecJournalTypes?.map((t) => {
                                const tagName = t.Tag?._TagDetail?.find(p => p.Lang === props.lang)?.TagName;
                                return (
                                    <div key={t.TagId} className="card_cat_item">
                                        <div className="card_cat_TxT">
                                            <span className="cat_title">
                                                <a href="#" onClick={(e) => { e.preventDefault(); onPickTag(t.TagId ?? "", tagName ?? ""); }}
                                                    aria-label={`依分類篩選：${tagName}`} title="依分類篩選" style={{ color: "inherit", textDecoration: "none" }}>
                                                    {tagName}
                                                </a>
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="card_titleDiv">
                        <div className="card_title">{props.data?.SpecJournal?.Title}</div>
                        {!!props.data?.SpecJournal?.Title_en && (<div className="card_title_en">{props.data?.SpecJournal?.Title_en}</div>)}
                    </div>
                </div>
            </div>
        </div>
        <div className="col row-group">
            <hr className="hr-my-4" />
        </div>
    </>)
}
/**瀏覽次數 */
const BrowseCount_Comp = () => {
    return (<>
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
    </>)
}
/** 作者列表 */
const Authors_Comp = (props: { lang: Lang; data: SpecJournalSet }) => {
    const { goExclusive } = useSpecJournalSearchNav("../List");
    const onPickAuthor = (name: string) => { const v = (name ?? "").trim(); if (!v) return; goExclusive({ author: v }); };


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
                                            {/* 作者姓名（卡片標題） */}
                                            <div className="AuthorCard__title">
                                                {(() => {
                                                    // 變數宣告
                                                    const zh = (a.AuthorName ?? "").trim();
                                                    const en = (a.AuthorName_en ?? "").trim();
                                                    const showZh = !!zh;
                                                    const showEn = !!en && !showZh; // ✅ 只有英文（沒有中文）才單獨顯示英文
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
                                                            {/* ✅ 中英都有：英文顯示在第二個 div，用括號包起來 */}
                                                            {showZh && !!en && (
                                                                <div className="AuthorCard__nameEn ms-2">
                                                                    （
                                                                    <a href="#" onClick={(e) => { e.preventDefault(); onPickAuthor(en); }} aria-label={`依作者篩選：${en}`} title="依作者篩選" style={{ color: "inherit", textDecoration: "none" }}>
                                                                        {en}
                                                                    </a>
                                                                    ）
                                                                </div>
                                                            )}
                                                            {/* ✅ 只有英文：只顯示英文（不加括號） */}
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

                                            {/* 欄位清單 */}
                                            <div className="AuthorCard__rows">
                                                {[
                                                    { label: "ORCID :", value: a.ORCID },
                                                    { label: "職稱 :", value: a.JobTitle },
                                                    {
                                                        label: "電子郵件 :",
                                                        value: a.Email ? (<a href={`mailto:${a.Email}`}>{a.Email}</a>) : null,
                                                    },
                                                    { label: "地區 / 國家 :", value: a.Country },

                                                ]
                                                    .filter((x) => x.value) // 沒值就不顯示
                                                    .map((row) => (
                                                        <div key={row.label} className="Div_All_Ttext mb-1">
                                                            <span className="AuthorCard__label">{row.label}</span>
                                                            <span className="ms-2 AuthorCard__value">{row.value}</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="col row-group">
                <hr className="hr-my-4" />
            </div>
        </>
    )
}
/** DOI */
const DOI_Comp = (props: { lang: Lang; data: SpecJournalSet }) => {
    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="col row_item_group doiRow">
                    <div className="doiText">
                        <div className="Div_All_Ttext">
                            <span>DOI編號: </span>
                        </div>
                        <div className="Div_All_Ttext">
                            <a href={props.data?.SpecJournal?.DOIUrl ?? ""} target="_blank" rel="noopener noreferrer" aria-label={`DOI 連結，另開視窗：${props.data?.SpecJournal?.DOIUrl}`}>
                                {props.data?.SpecJournal?.DOIUrl}
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
    )
}
/** 期刊資訊 */
const JournalInfo_Comp = (props: { lang: Lang; data: SpecJournalSet }) => {
    const { goExclusive } = useSpecJournalSearchNav("../List");
    const onPickKeyword = (kw: string) => { const v = (kw ?? "").trim(); if (!v) return; goExclusive({ keyword: v }); };
    return (<>
        <div className="JJ_main_contentDIV">
            <div className="col row_item_group">
                <div className="Uncat_no_ls">
                    <ul>
                        <li>
                            <div className="Div_All_Ttext mb-1">

                                {!!(props.data?.SpecJournal?._JournalIndexDetail?.PublishDate ?? "").toString().trim() && (
                                    <>
                                        <span>{(props.data?.SpecJournal?._JournalIndexDetail?.PublishDate ?? "").toString().slice(0, 7)}</span>
                                        <span className="G_Vline">│</span>
                                    </>
                                )}


                                <span>{`${props.data?.SpecJournal?._JournalIndexDetail?.Volume}卷${props.data?.SpecJournal?._JournalIndexDetail?.Issue}期`}</span>
                                <span className="G_Vline">│</span>
                                <span>{`${props.data?.SpecJournal?.PageStart}頁~${props.data?.SpecJournal?.PageEnd}頁`}</span>
                            </div>
                        </li>

                        <li>
                            <div className="Div_All_Ttext mb-1">
                                <span>中文關鍵詞 :</span>
                                {props.data?.SpecJournalKeywords?.filter(p => p.LangCode === 'zh-tw').map((kw) => {
                                    return (
                                        <span className="ms-2">
                                            <a href="#" className="ms-2" onClick={(e) => { e.preventDefault(); onPickKeyword(kw.Keyword ?? ""); }}
                                                aria-label={`依關鍵詞篩選：${kw.Keyword ?? ""}`} style={{ color: "inherit", textDecoration: "none" }}>
                                                {kw.Keyword}
                                            </a>
                                        </span>
                                    )
                                })}
                            </div>
                        </li>

                        <li>
                            <div className="Div_All_Ttext mb-1">
                                <span>英文關鍵詞 :</span>
                                {props.data?.SpecJournalKeywords?.filter(p => p.LangCode === 'en').map((kw) => {
                                    return (
                                        <span className="ms-2">
                                            <a href="#" className="ms-2" onClick={(e) => { e.preventDefault(); onPickKeyword(kw.Keyword ?? ""); }}
                                                aria-label={`依關鍵詞篩選：${kw.Keyword ?? ""}`} style={{ color: "inherit", textDecoration: "none" }}>
                                                {kw.Keyword}
                                            </a>
                                        </span>
                                    )
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
    </>)
}
/** 檔案下載區 */
const FileDownload_Comp = (props: { lang: Lang; data: SpecJournalSet }) => {
    const hasJournalFile = props.data.SpecJournal?.JournalFileId
    const hasInsightPointFile = props.data.SpecJournal?.InsightPointFileId
    if (!hasJournalFile && !hasInsightPointFile) return null;
    return (
        <>
            {/* 全文可取得 下載按鈕 */}
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
    )
}
/** 開放觀點 */
const OpenPoint_Comp = (props: { lang: Lang; data: SpecJournalSet }) => {
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
                                        <a className="page-item" href={`${FileManagementAPI.DOWNLOAD_URL}/${d.OpenPointFileId}`} title={d.OpenPointFileName ?? ""} onClick={preventHashOrVoidNav}
                                            target="_blank" rel="noopener noreferrer">
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
    )
}
/** 相關檔案 */
const RefFile_Comp = (props: { lang: Lang; data: SpecJournalSet }) => {
    return (<>
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
                                    <a className="page-item" href={`${FileManagementAPI.DOWNLOAD_URL}/${d.RefFileId}`} title={d.RefFileName ?? ""} onClick={preventHashOrVoidNav}
                                        target="_blank" rel="noopener noreferrer">
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
    </>)
}
/** 摘要+參考文獻+引文格式（預設全展開、互不互斥） */
const Accordion_Comp = (props: { lang: Lang; data: SpecJournalSet }) => {
    // 宣告：分隔線
    const bodyHr = (<div className="col row-group px-0"><hr className="hr-my-2" /></div>);

    // 宣告：摘要內容
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
                                                            ) : (title)}
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
                                                            ) : (titleEn)}
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

                        parseContent = useResolveInternalIds(sec?.Content ?? "", { locale: props.lang });
                        const content = parseContent.html ? parse(parseContent.html) : null;

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
    // ✅ 只有在「假連結」才阻止，避免 SPA 因為 # 或空 href 跳動
    const href = e.currentTarget.getAttribute("href") ?? "";
    const isFake = href === "" || href === "#" || href.startsWith("#");
    if (isFake) e.preventDefault();
};
const wireBsAccordion = (root: HTMLElement) => {
    const toggles = root.querySelectorAll<HTMLElement>("[data-bs-toggle='collapse']");
    toggles.forEach((el) => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                e.preventDefault();
                el.click();
            }
        };
        el.addEventListener("keydown", onKeyDown);
        (el as any).__wcms_onKeyDown = onKeyDown;
    });
};
const unwireBsAccordion = (root: HTMLElement) => {
    const toggles = root.querySelectorAll<HTMLElement>("[data-bs-toggle='collapse']");
    toggles.forEach((el) => {
        const handler = (el as any).__wcms_onKeyDown as ((e: KeyboardEvent) => void) | undefined;
        if (handler) el.removeEventListener("keydown", handler);
    });
};
//#endregion

//#region Hooks
const dataFetch = (provider: IDataProvider<SpecJournalSet>, journalId: string) => {
    let condition: string = `${SpecJournalModelFields.JournalId} = ${journalId}`;
    return useFetchGridListData<SpecJournalSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                //Header
                SpecJournalModelFields.InternalId, SpecJournalModelFields.Title, SpecJournalModelFields.Title_en,
                SpecJournalModelFields.PageStart, SpecJournalModelFields.PageEnd, SpecJournalModelFields.DOIUrl,
                SpecJournalModelFields.DOIUrl, SpecJournalModelFields.JournalFileId, SpecJournalModelFields.JournalFileName,
                SpecJournalModelFields.InsightPointFileId, SpecJournalModelFields.InsightPointFileName, SpecJournalModelFields.ArticleLang,
                SpecJournalModelFields.Memo, SpecJournalModelFields.Memo_en,
                `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`, `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
                `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileId}`, `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileName}`,
                `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.PublishDate}`,
                //Author
                `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.RowId}`, `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName}`,
                `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en}`, `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.JobTitle}`,
                `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.Unit}`, `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.Unit_en}`,
                `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.Email}`, `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.Country}`,
                //Bibliography
                `${SpecJournalModelFields._SpecJournalBibliography}.${SpecJournalBibliographyFields.Title}`, `${SpecJournalModelFields._SpecJournalBibliography}.${SpecJournalBibliographyFields.Title_en}`,
                `${SpecJournalModelFields._SpecJournalBibliography}.${SpecJournalBibliographyFields.Url}`,
                //RefFormat
                `${SpecJournalModelFields._SpecJournalRefFormat}.${SpecJournalRefFormatFields.RowId}`, `${SpecJournalModelFields._SpecJournalRefFormat}.${SpecJournalRefFormatFields.Title}`,
                `${SpecJournalModelFields._SpecJournalRefFormat}.${SpecJournalRefFormatFields.Content}`,
                //OpenPoint
                `${SpecJournalModelFields._SpecJournalOpenPointFiles}.${SpecJournalOpenPointFilesFields.RowId}`, `${SpecJournalModelFields._SpecJournalOpenPointFiles}.${SpecJournalOpenPointFilesFields.OpenPointFileId}`,
                `${SpecJournalModelFields._SpecJournalOpenPointFiles}.${SpecJournalOpenPointFilesFields.OpenPointFileName}`,
                //RefFiles
                `${SpecJournalModelFields._SpecJournalRefFiles}.${SpecJournalRefFilesFields.RowId}`, `${SpecJournalModelFields._SpecJournalRefFiles}.${SpecJournalRefFilesFields.RefFileId}`,
                `${SpecJournalModelFields._SpecJournalRefFiles}.${SpecJournalRefFilesFields.RefFileName}`,
                //Types
                `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.RowId}`, `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.TagId}`,
                `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}.${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
                `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}.${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,
                //Keywords
                `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.RowId}`,
                `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.LangCode}`, `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.Keyword}`,
            ],
            Condition: condition,
        }),
        enabled: true,
        deps: [journalId],
    });
};
//#endregion