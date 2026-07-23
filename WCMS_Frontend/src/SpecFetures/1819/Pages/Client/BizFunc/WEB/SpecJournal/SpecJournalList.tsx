import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { ModuleContent, type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import { useBreadcrumb } from "@/Features/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp";
import { DefaultLang, getLangLabel, type Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { useEffect, useMemo } from "react";
import { useParams } from "react-router";
import { useLoaderData } from "react-router-dom";
import { SpecJournalKeywordSearch_Comp } from "./SpecJournalKeywordSearchComp";
import { type SpecJournalListLoaderData, useSpecJournalListData } from "./SpecJournalList_Loader";
import { useSpecJournalSearchNav } from "./SpecJournalSearchUtils";

// #region Property
type SpecJournalFormModel = components["schemas"]["SpecJournal"];

type SpecJournalFilters = { q: string; articleLang: string; tagId: string; tagName: string; author: string; keyword: string; includeRef: string; };

type Document = { key: string; fileId: string; fileName: string; };
// #endregion

// #region Public
/** SpecJournal：用 ModuleContent 包住 Journal_List_content */

export const SpecJournalList = (props: { site: INormSite; node: INormNode; lang: Lang; }) =>
{
    // 宣告變數
    const params = useParams();
    const { setItems } = useBreadcrumb();
    const loaderData = useLoaderData() as SpecJournalListLoaderData | null;
    const pageSize = 10;

    const routeIndexId = (loaderData?.args?.indexId ?? params.indexId ?? "").trim();
    const routeRowId = (loaderData?.args?.rowId ?? params.rowId ?? "").trim();
    const pageTitle = (loaderData?.args?.pageTitle ?? "").trim();

    const filters: SpecJournalFilters = loaderData?.args?.filters
        ?? { q: "", articleLang: "", tagId: "", tagName: "", author: "", keyword: "", includeRef: "" };

    const useVolume = useSpecJournalListData({ pageSize });

    const isSearchMode = useMemo(() =>
    {
        return !!filters.q || !!filters.articleLang || !!filters.tagId || !!filters.author || !!filters.keyword;
    }, [filters.q, filters.articleLang, filters.tagId, filters.author, filters.keyword]);

    const issueLabel = useMemo(() =>
    {
        // 宣告變數：搜尋模式也維持 pageTitle，不要空掉
        if (isSearchMode) return pageTitle;

        // 宣告變數：沒有卷期參數就回 pageTitle
        if (!routeIndexId || !routeRowId) return pageTitle;

        // 執行 function：有卷期就優先顯示 Vol / No
        const detail = useVolume.rawData?.[0]?._JournalIndexDetail;
        if (!detail) return pageTitle;

        // return
        return buildIssueText(props.lang, detail.Volume, detail.Issue);
    }, [isSearchMode, routeIndexId, routeRowId, pageTitle, props.lang, useVolume.rawData]);

    const issueSummary = useMemo(() =>
    {
        // 宣告變數：預刊 / global / 搜尋模式都不顯示摘要下載
        if (isSearchMode) return { fileId: "", fileName: "" };

        // 執行 function：一般卷期模式才抓摘要
        const detail = useVolume.rawData?.[0]?._JournalIndexDetail;
        return {
            fileId: detail?.SummaryFileId ?? "",
            fileName: detail?.SummaryFileName ?? "",
            downloadCount: detail?.SummaryFile?.PublicDownloadCount ?? 0,
            isPdf: detail?.SummaryFile?.FileExtension?.toLowerCase() === "pdf",
        };
    }, [isSearchMode, useVolume.rawData]);

    useEffect(() =>
    {
        // 宣告變數：只有卷期頁才掛第二層 breadcrumb，避免預刊 / 搜尋把 breadcrumb 弄亂
        const shouldShowIssueCrumb = !isSearchMode && !!routeIndexId && !!routeRowId && !!issueLabel && issueLabel !== pageTitle;

        // 執行 function
        if (shouldShowIssueCrumb) setItems([{ label: issueLabel }]);
        else setItems([]);

        // return cleanup
        return () => setItems([]);
    }, [isSearchMode, routeIndexId, routeRowId, issueLabel, pageTitle, setItems]);

    const loadingList = useVolume.isLoading;
    const errorList = useVolume.errorList;
    const text = getSpecJournalListLangText(props.lang);
    const moduleTitle = isSearchMode ? text.searchResultTitle : (issueLabel || pageTitle);

    const viewCountConfig: ModuleViewCountConfig = { mode: "list" };
    return (
        <ModuleContent
            nodeTitle={moduleTitle}
            title={moduleTitle}
            isLoading={loadingList}
            errorList={errorList}
            paginatorProps={useVolume.paginatorProps}
            viewCountConfig={viewCountConfig}
        >
            <SpecJournalListContent
                lang={props.lang}
                rawData={useVolume.rawData}
                totalCount={useVolume.totalCount}
                queryFilters={filters}
                issueSummary={issueSummary}
            />
        </ModuleContent>
    );
};
// #endregion

// #region Protected
const buildDocuments = (data: SpecJournalFormModel): Document[] =>
{
    const files: Document[] = [];
    data?._SpecJournalDocument?.slice().sort((a, b) => (a.DocumentType ?? 0) - (b.DocumentType ?? 0)).forEach((item, idx) =>
    {
        files.push({ key: `document-${idx}`, fileId: item.DocumentId ?? "", fileName: item.DocumentName || item.DocumentId || "" });
    });
    return files;
};
// #endregion

// #region Private

/** SpecJournalListContent：對齊 prototype 的 Journal_List_content DOM 結構 */

const SpecJournalListContent = (
    props: {
        lang: Lang;
        rawData: SpecJournalFormModel[];
        totalCount: number;
        issueSummary: { fileId?: string; fileName?: string; downloadCount?: number; isPdf?: boolean; };
        queryFilters: { q?: string; articleLang?: string; tagId?: string; tagName?: string; author?: string; keyword?: string; includeRef?: string; };
    },
) =>
{
    // 宣告變數
    const filters = props.queryFilters;
    const text = getSpecJournalListLangText(props.lang);
    const { goExclusive } = useSpecJournalSearchNav(".");

    // 執行 function
    const handlePickArticleLang = (langCode: string) =>
    {
        goExclusive({ articleLang: langCode });
    };
    const handlePickTypeTag = (tagId: string, tagName?: string) =>
    {
        goExclusive({ tagId, tagName });
    };
    const handlePickAuthor = (authorName: string) =>
    {
        goExclusive({ author: authorName });
    };

    const hasSearch = useMemo(() =>
    {
        return !!filters.q || !!filters.articleLang || !!filters.tagId || !!filters.author || !!filters.keyword;
    }, [filters.q, filters.articleLang, filters.tagId, filters.author, filters.keyword]);

    const buildFilterLabel = useMemo(() =>
    {
        const parts: string[] = [];
        if (filters.q) parts.push(text.searchFilter(filters.q));
        if (filters.articleLang) parts.push(text.languageFilter(getLangLabel(filters.articleLang)));
        if (filters.tagId) parts.push(text.typeFilter(filters.tagName || filters.tagId));
        if (filters.author) parts.push(text.authorFilter(filters.author));
        if (filters.keyword) parts.push(text.keywordFilter(filters.keyword));
        const label = parts.join(text.filterSeparator) || text.noFilterSelected;
        return text.resultCount(label, props.totalCount);
    }, [filters.q, filters.articleLang, filters.tagId, filters.tagName, filters.author, filters.keyword, props.totalCount, text]);

    return (
        <div className="Journal_List_content">
            <div className="row">
                <div className="CategoryBar w-100">
                    {hasSearch && (
                        <div className="page-TitleName">
                            <div className="Div_TitleName">
                                <div className="custom_Name" aria-label="custom_Name">{buildFilterLabel}</div>
                            </div>
                        </div>
                    )}
                    <SpecJournalKeywordSearch_Comp basePath="." lang={props.lang} />
                </div>

                <div className="col row-group">
                    <hr className="hr-my-4" />
                </div>

                <IssueSummaryDownload lang={props.lang} {...props.issueSummary} />

                <div className="JJ_main_contentDIV">
                    <ul className="ListInfo">
                        {props.rawData.map((it) => (
                            <li key={it.JournalId} className="JInfo_item">
                                <div className="row__group">
                                    <LangLink
                                        className="Jitem-inner"
                                        to={`../Form/${it._JournalIndexDetail?.IndexId}/${it._JournalIndexDetail?.RowId}/${it.JournalId ?? ""}`}
                                        target="_self"
                                        title={it.Title ?? ""}
                                    >
                                        <JournalCard item={it} lang={props.lang} onPickArticleLang={handlePickArticleLang} onPickTypeTag={handlePickTypeTag} />
                                    </LangLink>

                                    <div className="card_authorDiv">
                                        <div className="card_author">
                                            <span className="me-3">{text.authorLabel}</span>
                                            <div className="authorName" aria-label="authorName">
                                                <ul className="authorName_list">
                                                    {it._SpecJournalAuthor?.map((au) =>
                                                    {
                                                        return (
                                                            <li key={`${it.JournalId}-au-${au.RowId}`} className="authorlist-item">
                                                                <LangLink
                                                                    to={`../Form/${it._JournalIndexDetail?.IndexId}/${it._JournalIndexDetail?.RowId}/${it.JournalId ?? ""}`}
                                                                >
                                                                    {(() =>
                                                                    {
                                                                        const zh = (au.AuthorName ?? "").trim();
                                                                        const en = (au.AuthorName_en ?? "").trim();
                                                                        const showZh = !!zh;
                                                                        const showEnOnly = !!en && !showZh;

                                                                        const onPick = (v: string) => (e: React.MouseEvent) =>
                                                                        {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            handlePickAuthor(v);
                                                                        };

                                                                        return (
                                                                            <>
                                                                                {showZh && (
                                                                                    <div className="AuthorCard__nameZh">
                                                                                        <a
                                                                                            href="#"
                                                                                            onClick={onPick(zh)}
                                                                                            aria-label={text.filterByAuthor(`${zh}${en ? ` (${en})` : ""}`)}
                                                                                            style={{ color: "inherit", textDecoration: "none" }}
                                                                                        >
                                                                                            {zh}
                                                                                        </a>
                                                                                    </div>
                                                                                )}

                                                                                {showZh && !!en && (
                                                                                    <div className="AuthorCard__nameEn ms-2">
                                                                                        <a
                                                                                            href="#"
                                                                                            onClick={onPick(en)}
                                                                                            aria-label={text.filterByAuthor(en)}
                                                                                            style={{ color: "inherit", textDecoration: "none" }}
                                                                                        >
                                                                                            ({en})
                                                                                        </a>
                                                                                    </div>
                                                                                )}

                                                                                {showEnOnly && (
                                                                                    <div className="AuthorCard__nameEn">
                                                                                        <a
                                                                                            href="#"
                                                                                            onClick={onPick(en)}
                                                                                            aria-label={text.filterByAuthor(en)}
                                                                                            style={{ color: "inherit", textDecoration: "none" }}
                                                                                        >
                                                                                            {en}
                                                                                        </a>
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </LangLink>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <DocumentList data={it} lang={props.lang} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

/** JournalCard：拆小塊，保持 function 不要太長 */

const JournalCard = (
    props: { item: SpecJournalFormModel; lang: Lang; onPickArticleLang: (langCode: string) => void; onPickTypeTag: (tagId: string, tagName?: string) => void; },
) =>
{
    // 宣告變數
    const langCode = props.item.ArticleLang ?? "";
    const langLabel = getLangLabel(langCode);
    const text = getSpecJournalListLangText(props.lang);
    // return
    return (
        <div className="IItemBox">
            <div className="card_catDiv">
                <div className="wrap_box">
                    <div className="card_cat_item">
                        <div className="card_cat_TxT">
                            <a
                                href="#"
                                className="cat_title cat_link"
                                onClick={(e) =>
                                {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    props.onPickArticleLang(langCode);
                                }}
                                aria-label={text.filterByLanguage(langLabel)}
                                style={{ color: "inherit", textDecoration: "none" }}
                            >
                                {langLabel}
                            </a>
                        </div>
                    </div>

                    {props.item._SpecJournalTypes?.map((type) =>
                    {
                        const tagName = type.Tag?._TagDetail?.find((p) => p.Lang === props.lang)?.TagName;

                        return (
                            <div key={`${props.item.JournalId}-type-${type.RowId ?? type.TagId ?? ""}`} className="card_cat_item">
                                <div className="card_cat_TxT">
                                    <a
                                        href="#"
                                        className="cat_title cat_link"
                                        onClick={(e) =>
                                        {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            props.onPickTypeTag(type.TagId ?? "", tagName ?? "");
                                        }}
                                        aria-label={text.filterByCategory(tagName ?? "")}
                                        style={{ color: "inherit", textDecoration: "none" }}
                                    >
                                        {tagName}
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="card_titleDiv">
                <div className="card_title">
                    {props.item.ArticleLang === "zh-tw" ? props.item.Title : props.item.Title_en}
                </div>
                <div className="card_title_en">
                    {props.item.ArticleLang === "en" ? props.item.Title : props.item.Title_en}
                </div>
            </div>

            <div className="line-my-2"></div>
        </div>
    );
};

const IssueSummaryDownload = (props: { lang: Lang; fileId?: string; fileName?: string; downloadCount?: number; isPdf?: boolean; }) =>
{
    const fileId = (props.fileId ?? "").trim();
    const fileName = (props.fileName ?? "").trim();
    const href = props.isPdf ? FileManagementAPI.get_Public_Preview_Url(fileId, fileName) : FileManagementAPI.get_Public_Download_Url(fileId, fileName);
    const canShow = !!fileId && !!fileName;
    const text = getSpecJournalListLangText(props.lang);
    if (!canShow) return null;
    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="DownItem_Box">
                    <LangLink className="page-item" to={href} title={fileName}>
                        <div className="icontxtbox">
                            <span className="page_icon">
                                <i className="far fa-file-alt" aria-hidden="true"></i>
                            </span>
                            <span className="icontxt">{fileName}</span>
                        </div>
                    </LangLink>
                    <span className="G_Vline_Down">│</span>
                    <span className="Div_All_Ttext + views">
                        <i className="fas fa-download me-1" aria-hidden="true"></i>
                        <span className="font-SW-normal">{text.downloadCountLabel}</span>
                        <span className="font-SW-normal + ms-2">{props.downloadCount}</span>
                    </span>
                </div>
            </div>
            <p />
        </>
    );
};

const DocumentList = (props: { lang: Lang; data: SpecJournalFormModel; }) =>
{
    // 宣告變數
    const MAX_PREVIEW_FILES = 4;
    const text = getSpecJournalListLangText(props.lang);
    const files = useMemo(() => buildDocuments(props.data), [props.data]);
    const previewFiles = useMemo(() => files.slice(0, MAX_PREVIEW_FILES), [files]);
    const hasMoreFiles = files.length > MAX_PREVIEW_FILES;
    // 執行 function
    if (files.length === 0) return null;
    // return
    return (
        <div className="row mt-2">
            <div className="col-12">
                <ul className="row g-2 list-unstyled m-0 p-0">
                    {previewFiles.map((file) =>
                    {
                        const fileName = file.fileName ?? "";
                        const fileUrl = FileManagementAPI.get_Public_Download_Url(file.fileId, fileName);
                        return (
                            <li key={file.key} className="col-12 col-sm-6 col-lg-3 d-flex">
                                <LangLink
                                    className="w-100 border rounded bg-white text-decoration-none d-flex align-items-center px-2 py-2"
                                    to={fileUrl}
                                    title={fileName}
                                >
                                    <span
                                        className="d-inline-flex align-items-center justify-content-center rounded flex-shrink-0 me-3"
                                        style={{ width: "34px", height: "34px", backgroundColor: "#bca33a", color: "#ffffff" }}
                                    >
                                        <i className="far fa-file-alt" aria-hidden="true" />
                                    </span>
                                    <span className="text-dark fw-semibold text-break" style={{ lineHeight: "1.35", wordBreak: "break-word" }}>
                                        {file.fileName}
                                    </span>
                                </LangLink>
                            </li>
                        );
                    })}
                </ul>
                {hasMoreFiles && <div className="small text-muted mt-1" aria-label={text.moreDocumentsAriaLabel}>...</div>}
            </div>
        </div>
    );
};
// #endregion

// #region LangText
interface SpecJournalListLangText
{
    authorLabel: string;
    downloadCountLabel: string;
    filterSeparator: string;
    moreDocumentsAriaLabel: string;
    noFilterSelected: string;
    searchResultTitle: string;
    authorFilter: (value: string) => string;
    filterByAuthor: (value: string) => string;
    filterByCategory: (value: string) => string;
    filterByLanguage: (value: string) => string;
    keywordFilter: (value: string) => string;
    languageFilter: (value: string) => string;
    resultCount: (label: string, totalCount: number) => string;
    searchFilter: (value: string) => string;
    typeFilter: (value: string) => string;
}
const SPEC_JOURNAL_LIST_LANG_TEXT_MAP: Record<string, SpecJournalListLangText> = {
    "zh-tw": {
        authorLabel: "作者 :",
        downloadCountLabel: "下載次數 :",
        filterSeparator: "；",
        moreDocumentsAriaLabel: "更多說明檔案請進入詳細頁查看",
        noFilterSelected: "未選擇條件",
        searchResultTitle: "搜尋結果",
        authorFilter: (value: string) => `作者：${value}`,
        filterByAuthor: (value: string) => `依作者篩選：${value}`,
        filterByCategory: (value: string) => `依分類篩選：${value}`,
        filterByLanguage: (value: string) => `依語言篩選：${value}`,
        keywordFilter: (value: string) => `關鍵詞：${value}`,
        languageFilter: (value: string) => `語言：${value}`,
        resultCount: (label: string, totalCount: number) => `${label}（共 ${totalCount} 筆）`,
        searchFilter: (value: string) => `搜尋：${value}`,
        typeFilter: (value: string) => `類型：${value}`,
    },
    en: {
        authorLabel: "Author :",
        downloadCountLabel: "Downloads :",
        filterSeparator: "; ",
        moreDocumentsAriaLabel: "View the detail page for more documents",
        noFilterSelected: "No filters selected",
        searchResultTitle: "Search Results",
        authorFilter: (value: string) => `Author: ${value}`,
        filterByAuthor: (value: string) => `Filter by author: ${value}`,
        filterByCategory: (value: string) => `Filter by category: ${value}`,
        filterByLanguage: (value: string) => `Filter by language: ${value}`,
        keywordFilter: (value: string) => `Keyword: ${value}`,
        languageFilter: (value: string) => `Language: ${value}`,
        resultCount: (label: string, totalCount: number) => `${label} (${totalCount} result${totalCount === 1 ? "" : "s"})`,
        searchFilter: (value: string) => `Search: ${value}`,
        typeFilter: (value: string) => `Type: ${value}`,
    },
};
/** 取得期刊列表頁文字設定 */
const getSpecJournalListLangText = (lang: Lang): SpecJournalListLangText =>
{
    return SPEC_JOURNAL_LIST_LANG_TEXT_MAP[lang] ?? SPEC_JOURNAL_LIST_LANG_TEXT_MAP[DefaultLang];
};
/** 建立卷期文字 */
const buildIssueText = (lang: Lang, volume?: string | number | null, issue?: string | number | null): string =>
{
    const volumeText = `${volume ?? ""}`.trim();
    const issueText = `${issue ?? ""}`.trim();
    return lang === "en" ? `Vol. ${volumeText}, No. ${issueText}` : `${volumeText}卷${issueText}期`;
};
// #endregion
