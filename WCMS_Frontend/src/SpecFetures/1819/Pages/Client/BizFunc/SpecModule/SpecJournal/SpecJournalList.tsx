import { useEffect, useMemo } from "react";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { getLangLabel, type Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import { SpecJournalAuthorFields, SpecJournalBibliographyFields, SpecJournalIndexDetailFields, SpecJournalKeywordsFields, SpecJournalModelFields, SpecJournalTypesFields, TagDataFields, TagDetailFields } from "@/types/SchemaFields";
import SpecJournalProvider from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecMusical/SpecJournal_Api";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import { useParams } from "react-router";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useBreadcrumb } from "@/Features/Pages/Client/Scaffold/SubPages/Section/BreadCrumb_Comp";
import { SpecJournalKeywordSearch_Comp } from "./SpecJournalKeywordSearchComp";
import { useSearchParams } from "react-router-dom";
import { useSpecJournalSearchNav } from "./SpecJournalSearchUtils";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";

type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];

/** SpecJournal：用 ModuleContent 包住 Journal_List_content（你指定的輸出格式） */
export const SpecJournalList = (props: { node: INormNode; lang: Lang; }) => {
    // ✅ 目前先照你範例：loading/error 用 array（未接 API 時先給空/false）
    const { indexId, rowId } = useParams();
    const { setItems } = useBreadcrumb();

    const [sp] = useSearchParams();

    const filters = useMemo(() => {
        return {
            q: (sp.get("q") ?? "").trim(),
            articleLang: (sp.get("articleLang") ?? "").trim(),
            tagId: (sp.get("tagId") ?? "").trim(),
            tagName: (sp.get("tagName") ?? "").trim(),
            author: (sp.get("author") ?? "").trim(),
            keyword: (sp.get("keyword") ?? "").trim(),
            includeRef: (sp.get("includeRef") ?? "").trim(),
        };
    }, [sp]);


    const pageSize = 10;
    const pvdr = useMemo(() => { return SpecJournalProvider() }, [])
    const volumeData = volumeFetch(pvdr, indexId ?? "", rowId ?? "", pageSize, filters);


    const issueLabel = useMemo(() => {
        const isSearchMode = !!filters.q || !!filters.articleLang || !!filters.tagId || !!filters.author || !!filters.keyword;
        if (isSearchMode) return "";
        if (!indexId || !rowId) return "";
        const detail = volumeData.rawData?.[0]?.SpecJournal?._JournalIndexDetail;
        if (!detail) return "";
        return `Vol.${detail.Volume}, No.${detail.Issue}`;
    }, [filters.q, filters.articleLang, filters.tagId, filters.author, filters.keyword, indexId, rowId, volumeData.rawData]);

    const issueSummary = useMemo(() => {
        const isSearchMode = !!filters.q || !!filters.articleLang || !!filters.tagId || !!filters.author || !!filters.keyword;
        if (isSearchMode) return { fileId: "", fileName: "" };

        const detail = volumeData.rawData?.[0]?.SpecJournal?._JournalIndexDetail;
        return {
            fileId: detail?.SummaryFileId ?? "",
            fileName: detail?.SummaryFileName ?? "",
        };
    }, [filters.q, filters.articleLang, filters.tagId, filters.author, filters.keyword, volumeData.rawData]);

    useEffect(() => {
        // ✅ 設定：第二層（卷期）
        if (issueLabel) setItems([{ label: issueLabel }]);
        else setItems([]);
        // ✅ 離開頁面就清空，避免殘留到其他 module
        return () => setItems([]);
    }, [issueLabel, setItems]);
    const loadingList = [volumeData.isLoading];
    const errorList = [volumeData.error];
    const paginprops: PaginatorProps = { currentPage: volumeData.gridProps.CurrentPage, totalPages: volumeData.gridProps.TotalPage, onPageChange: volumeData.gridProps.onPageChange };
    return (
        <ModuleContent nodeTitle={issueLabel} title={issueLabel} loadingList={loadingList} errorList={errorList} paginatorProps={paginprops} >
            <SpecJournalListContent lang={props.lang} rawData={volumeData.rawData} queryFilters={filters} issueSummary={issueSummary} />
        </ModuleContent>
    );
};

/** SpecJournalListContent：對齊 prototype 的 Journal_List_content DOM 結構 */
const SpecJournalListContent = (props: {
    lang: Lang; rawData: SpecJournalSet[]; issueSummary: { fileId?: string; fileName?: string };
    queryFilters: { q?: string; articleLang?: string; tagId?: string; tagName?: string; author?: string; keyword?: string; includeRef?: string }
}) => {
    const filters = props.queryFilters;
    const { goExclusive } = useSpecJournalSearchNav(".");
    const handlePickArticleLang = (langCode: string) => { goExclusive({ articleLang: langCode }); };
    const handlePickTypeTag = (tagId: string, tagName?: string) => { goExclusive({ tagId, tagName }); };
    const handlePickAuthor = (authorName: string) => { goExclusive({ author: authorName }); };
    // function：是否要顯示「搜尋：...」
    const hasSearch = useMemo(() => {
        return !!filters.q || !!filters.articleLang || !!filters.tagId || !!filters.author || !!filters.keyword;
    }, [filters]);

    const buildFilterLabel = useMemo(() => {
        const parts: string[] = [];
        if (filters.q) parts.push(`搜尋：${filters.q}`);
        if (filters.articleLang) parts.push(`語言：${getLangLabel(filters.articleLang)}`);
        if (filters.tagId) parts.push(`類型：${filters.tagName || filters.tagId}`);
        if (filters.author) parts.push(`作者：${filters.author}`);
        if (filters.keyword) parts.push(`關鍵詞：${filters.keyword}`);
        return parts.join("；") || "未選擇條件";
    }, [filters]);

    return (
        <div className="Journal_List_content">
            <div className="row">
                <div className="CategoryBar w-100">
                    {hasSearch && (
                        <div className="page-TitleName">
                            <div className="Div_TitleName">
                                <div className="custom_Name" aria-label="custom_Name">
                                    {buildFilterLabel}
                                </div>
                            </div>
                        </div>
                    )}
                    <SpecJournalKeywordSearch_Comp basePath="." />
                </div>
                <div className="col row-group">
                    <hr className="hr-my-4" />
                </div>
                <IssueSummaryDownload fileId={props.issueSummary?.fileId} fileName={props.issueSummary?.fileName} />
                {/* // 列表內容 */}
                <div className="JJ_main_contentDIV">
                    <ul className="ListInfo">
                        {props.rawData.map((it) => (
                            <li key={it.SpecJournal?.JournalId} className="JInfo_item">
                                <div className="row__group">
                                    <LangLink className="Jitem-inner"
                                        to={`../Form/${it.SpecJournal?._JournalIndexDetail?.IndexId}/${it.SpecJournal?._JournalIndexDetail?.RowId}/${it.SpecJournal?.JournalId ?? ""}`}
                                        target="_self" title={it.SpecJournal?.Title ?? ""} tabIndex={0}>
                                        <JournalCard item={it} lang={props.lang} onPickArticleLang={handlePickArticleLang} onPickTypeTag={handlePickTypeTag} />
                                    </LangLink>
                                    <div className="card_authorDiv">
                                        <div className="card_author">
                                            <span className="me-3">作者 : </span>
                                            <div className="authorName" aria-label="authorName">
                                                <ul className="authorName_list">
                                                    {it.SpecJournalAuthor?.map((au) => {

                                                        return (
                                                            <li key={`${it.SpecJournal?.JournalId}-au-${au.RowId}`} className="authorlist-item">
                                                                <LangLink
                                                                    to={`../Form/${it.SpecJournal?._JournalIndexDetail?.IndexId}/${it.SpecJournal?._JournalIndexDetail?.RowId}/${it.SpecJournal?.JournalId ?? ""}`} tabIndex={0}>
                                                                    {(() => {
                                                                        const zh = (au.AuthorName ?? "").trim();
                                                                        const en = (au.AuthorName_en ?? "").trim();
                                                                        const showZh = !!zh;
                                                                        const showEnOnly = !!en && !showZh;
                                                                        // 執行 function：點擊作者查詢（保持原本行為）
                                                                        const onPick = (v: string) => (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); handlePickAuthor(v); };
                                                                        return (
                                                                            <>
                                                                                {/* ✅ 有中文：顯示中文 */}
                                                                                {showZh && (
                                                                                    <div className="AuthorCard__nameZh">
                                                                                        <a href="#" onClick={onPick(zh)} aria-label={`依作者篩選：${zh}${en ? ` (${en})` : ""}`} style={{ color: "inherit", textDecoration: "none" }}>
                                                                                            {zh}
                                                                                        </a>
                                                                                    </div>
                                                                                )}
                                                                                {/* ✅ 中英都有：英文顯示括號 */}
                                                                                {showZh && !!en && (
                                                                                    <div className="AuthorCard__nameEn ms-2">
                                                                                        <a href="#" onClick={onPick(en)} aria-label={`依作者篩選：${en}`} style={{ color: "inherit", textDecoration: "none" }}>
                                                                                            ({en})
                                                                                        </a>
                                                                                    </div>
                                                                                )}
                                                                                {/* ✅ 只有英文：只顯示英文（不加括號） */}
                                                                                {showEnOnly && (
                                                                                    <div className="AuthorCard__nameEn">
                                                                                        <a href="#" onClick={onPick(en)} aria-label={`依作者篩選：${en}`} style={{ color: "inherit", textDecoration: "none" }}>
                                                                                            {en}
                                                                                        </a>
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </LangLink>
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

/** JournalCard：拆小塊，保持每個 function 不要太長 */
const JournalCard = (props: { item: SpecJournalSet; lang: Lang; onPickArticleLang: (langCode: string) => void; onPickTypeTag: (tagId: string, tagName?: string) => void; }) => {
    const langCode = props.item.SpecJournal?.ArticleLang ?? "";
    const langLabel = getLangLabel(langCode);
    const pStart = props.item.SpecJournal?.PageStart ?? 0
    const pEnd = props.item.SpecJournal?.PageEnd ?? 0
    const pageTitle = pStart < pEnd ? `(p.${pStart} - ${pEnd})` : `(p.${pStart})`;
    return (
        <div className="IItemBox">
            <div className="card_catDiv">
                <div className="wrap_box">
                    <div className="card_cat_item">
                        <div className="card_cat_TxT">
                            <a href="#" className="cat_title cat_link"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); props.onPickArticleLang(langCode); }}
                                aria-label={`依語言篩選：${langLabel}`} style={{ color: "inherit", textDecoration: "none" }}>
                                {langLabel}
                            </a>
                        </div>
                    </div>
                    {props.item.SpecJournalTypes?.map((type) => {
                        const tagName = type.Tag?._TagDetail?.find(p => p.Lang === props.lang)?.TagName
                        return (
                            <div className="card_cat_item">
                                <div className="card_cat_TxT">
                                    <a href="#" className="cat_title cat_link"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            props.onPickTypeTag(type.TagId ?? "", tagName ?? "");
                                        }}
                                        aria-label={`依分類篩選：${tagName ?? ""}`}
                                        style={{ color: "inherit", textDecoration: "none" }}
                                    >
                                        {tagName}
                                    </a>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className="card_titleDiv">
                <div className="card_title">{props.item.SpecJournal?.ArticleLang === "zh-tw" ? props.item.SpecJournal?.Title : props.item.SpecJournal?.Title_en} {pageTitle}</div>
                <div className="card_title_en">{props.item.SpecJournal?.ArticleLang === "en" ? props.item.SpecJournal?.Title : props.item.SpecJournal?.Title_en}</div>
            </div>
            <div className="line-my-2"></div>
        </div>
    );
};

const IssueSummaryDownload = (props: { fileId?: string; fileName?: string }) => {
    // 變數宣告
    const fileId = (props.fileId ?? "").trim();
    const fileName = (props.fileName ?? "").trim();
    const href = fileId ? `${FileManagementAPI.DOWNLOAD_URL}/${fileId}` : "";
    // 執行 function
    const canShow = !!fileId && !!fileName;
    if (!canShow) return null;
    // return
    return (
        <>
            <div className="JJ_main_contentDIV">

                <div className="DownItem_Box">
                    <a className="page-item" href={href} title={fileName}
                        target="_blank" rel="noopener noreferrer">
                        <div className="icontxtbox">
                            <span className="page_icon">
                                <i className="far fa-file-alt" aria-hidden="true"></i>
                            </span>
                            <span className="icontxt">{fileName}</span>
                        </div>
                    </a>
                    <span className="G_Vline_Down">│</span>
                    <span className="Div_All_Ttext + views">
                        <i className="fas fa-download me-1" aria-hidden="true"></i>
                        <span className="font-SW-normal">瀏覽次數 :</span>
                        <span className="font-SW-normal + ms-2">{0}</span>
                    </span>
                </div>

            </div>
            <p />
        </>
    );
};
//
const volumeFetch = (provider: IDataProvider<SpecJournalSet>, indexId: string, rowId: string, pageSize: number,
    filters: { q?: string; articleLang?: string; tagId?: string; author?: string; keyword?: string; includeRef?: string }
) => {
    // 變數宣告
    let condition = "";
    const isSearchMode = !!filters.q || !!filters.articleLang || !!filters.tagId || !!filters.author || !!filters.keyword;
    // ✅ 非搜尋模式才套卷期條件；搜尋模式就全站查
    if (!isSearchMode) {
        if (indexId) condition = LibMerge(" And ", false, condition, `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.IndexId} = ${indexId}`);
        if (rowId) condition = LibMerge(" And ", false, condition, `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.RowId} = ${rowId}`);
    }
    // ✅ 關鍵字：Title / Title_en like（不加 %）
    if (filters.q) {
        const kw = filters.q.replace(/'/g, "''");
        const baseCond = `(${SpecJournalModelFields.Title} like '${kw}' Or ${SpecJournalModelFields.Title_en} like '${kw}')`;
        const includeRef = (filters.includeRef ?? "").trim() === "1" || (filters.includeRef ?? "").toLowerCase() === "true";
        if (!includeRef) {
            condition = LibMerge(" And ", false, condition, baseCond);
        } else {
            const bibCond = `(${SpecJournalModelFields._SpecJournalBibliography}.${SpecJournalBibliographyFields.Title} like '${kw}' Or ${SpecJournalModelFields._SpecJournalBibliography}.${SpecJournalBibliographyFields.Title_en} like '${kw}')`;
            condition = LibMerge(" And ", false, condition, `(${baseCond} Or ${bibCond})`);
        }
    }
    // ✅ 語言：字串要加單引號
    if (filters.articleLang) {
        const v = filters.articleLang.replace(/'/g, "''");
        condition = LibMerge(" And ", false, condition, `${SpecJournalModelFields.ArticleLang} = '${v}'`);
    }
    // ✅ 分類 TagId：通常也是字串（你資料看起來是字串 id）
    if (filters.tagId) {
        const v = filters.tagId.replace(/'/g, "''");
        condition = LibMerge(" And ", false, condition, `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.TagId} = '${v}'`);
    }
    // ✅ 作者：你指定用 = 精準比對（純文字）
    if (filters.author) {
        const v = filters.author.replace(/'/g, "''");
        condition = LibMerge(" And ", false, condition, `(${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName} = '${v}' Or ${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en} = '${v}')`);
    }
    // ✅ 關鍵詞：明細 Keyword =（你這裡要的是點 keyword 查全部）
    if (filters.keyword) {
        const v = filters.keyword.replace(/'/g, "''");
        condition = LibMerge(" And ", false, condition, `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.Keyword} = '${v}'`);
    }
    // return
    return useFetchGridListData<SpecJournalSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: (page) => ({
            Fields: [
                SpecJournalModelFields.InternalId, SpecJournalModelFields.JournalId,
                SpecJournalModelFields.Title, SpecJournalModelFields.Title_en, SpecJournalModelFields.ArticleLang,
                SpecJournalModelFields.PageStart, SpecJournalModelFields.PageEnd,
                `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.IndexId}`,
                `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.RowId}`,
                `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
                `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
                `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileId}`,
                `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileName}`,
                `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.TagId}`,
                `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}`,
                `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}.${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
                `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}.${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,
                `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName}`,
                `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en}`,
            ],
            Condition: condition,
            OrderBy: [{ Col: SpecJournalModelFields.PageStart, Desc: false }],
            PageNumber: page,
            PageSize: pageSize,
        }),
        enabled: true,
        deps: [indexId, rowId, pageSize, filters],
    });
};