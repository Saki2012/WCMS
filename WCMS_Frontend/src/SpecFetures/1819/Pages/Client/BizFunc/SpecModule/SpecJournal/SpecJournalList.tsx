import { useEffect, useMemo } from "react";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { getLangLabel, type Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import { useParams } from "react-router";
import { useBreadcrumb } from "@/Features/Pages/Client/Scaffold/SubPages/Section/BreadCrumb_Comp";
import { SpecJournalKeywordSearch_Comp } from "./SpecJournalKeywordSearchComp";
import { useSpecJournalSearchNav } from "./SpecJournalSearchUtils";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useLoaderData } from "react-router-dom";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournal_Api";
import type { SpecJournalListLoaderData } from "./SpecJournalList_Loader";
type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

/** SpecJournal：用 ModuleContent 包住 Journal_List_content（你指定的輸出格式） */
export const SpecJournalList = (props: { node: INormNode; lang: Lang; }) => {
    // 宣告變數
    const { indexId, rowId } = useParams();
    const { setItems } = useBreadcrumb();

    const loaderData = useLoaderData() as SpecJournalListLoaderData | null;
    const adapter = useMemo(() => SpecJournalAdapter(), []);

    const pageSize = 10;

    const useVolume = useSpecJournalVolume(adapter, pageSize, loaderData);

    const filters = loaderData?.args?.filters ?? {
        q: "", articleLang: "", tagId: "", tagName: "", author: "", keyword: "", includeRef: "",
    };

    const issueLabel = useMemo(() => {
        const isSearchMode = !!filters.q || !!filters.articleLang || !!filters.tagId || !!filters.author || !!filters.keyword;
        if (isSearchMode) return "";
        if (!indexId || !rowId) return "";
        const detail = useVolume.rawData?.[0]?.SpecJournal?._JournalIndexDetail;
        if (!detail) return "";
        return `Vol.${detail.Volume}, No.${detail.Issue}`;
    }, [filters.q, filters.articleLang, filters.tagId, filters.author, filters.keyword, indexId, rowId, useVolume.rawData]);

    const issueSummary = useMemo(() => {
        const isSearchMode = !!filters.q || !!filters.articleLang || !!filters.tagId || !!filters.author || !!filters.keyword;
        if (isSearchMode) return { fileId: "", fileName: "" };

        const detail = useVolume.rawData?.[0]?.SpecJournal?._JournalIndexDetail;
        return {
            fileId: detail?.SummaryFileId ?? "",
            fileName: detail?.SummaryFileName ?? "",
        };
    }, [filters.q, filters.articleLang, filters.tagId, filters.author, filters.keyword, useVolume.rawData]);

    useEffect(() => {
        // ✅ 設定：第二層（卷期）
        if (issueLabel) setItems([{ label: issueLabel }]);
        else setItems([]);

        // ✅ 離開頁面就清空，避免殘留到其他 module
        return () => setItems([]);
    }, [issueLabel, setItems]);

    const loadingList = [useVolume.isLoading];
    const errorList = [useVolume.error];

    const paginprops: PaginatorProps =
    {
        currentPage: useVolume.pageNumber,
        totalPages: useVolume.totalPages,
        onPageChange: useVolume.onPageChange,
    };

    // return（DOM 不改）
    return (
        <ModuleContent nodeTitle={issueLabel} title={issueLabel} loadingList={loadingList} errorList={errorList} paginatorProps={paginprops} >
            <SpecJournalListContent lang={props.lang} rawData={useVolume.rawData} queryFilters={filters} issueSummary={issueSummary} />
        </ModuleContent>
    );
};

/** ✅ hooks：SSR loaderData initial → CSR 分頁接手 */
const useSpecJournalVolume = (
    adapter: ReturnType<typeof SpecJournalAdapter>,
    pageSize: number,
    loaderData: SpecJournalListLoaderData | null,
) => {
    // 宣告變數
    const baseParam = useMemo<QueryListParam>(() => {
        if (!loaderData?.args?.baseParam) return { Fields: [], Condition: "1=0", PageNumber: 1, PageSize: pageSize };
        if (loaderData.args.pageSize !== pageSize) return { Fields: [], Condition: "1=0", PageNumber: 1, PageSize: pageSize };
        return loaderData.args.baseParam;
    }, [loaderData, pageSize]);

    const initialCount = useMemo<ApiLoaderData<QueryListParam, number> | null>(() => {
        if (!loaderData?.args?.baseParam) return null;
        if (loaderData.args.pageSize !== pageSize) return null;

        return {
            args: loaderData.args.baseParam,
            apiRes: { IsSuccess: true, Data: loaderData.res.countRes ?? 0, SysMessage: [] },
        };
    }, [loaderData, pageSize]);

    const initialList = useMemo<ApiLoaderData<QueryListParam, SpecJournalSet[]> | null>(() => {
        if (!loaderData?.args?.baseParam) return null;
        if (loaderData.args.pageSize !== pageSize) return null;

        return {
            args: loaderData.args.baseParam,
            apiRes: { IsSuccess: true, Data: loaderData.res.listRes ?? [], SysMessage: [] },
        };
    }, [loaderData, pageSize]);

    // 執行 function：count/list（SSR initial → CSR 接手）
    const useCount = adapter.hooks.useQueryCount({
        condition: baseParam,
        initial: initialCount,
        deps: [pageSize, loaderData?.args?.indexId, loaderData?.args?.rowId, loaderData?.args?.filters],
    });

    const useList = adapter.hooks.usePagedQueryList({
        baseParam,
        count: useCount.data ?? 0,
        initial: initialList,
        deps: [pageSize, loaderData?.args?.indexId, loaderData?.args?.rowId, loaderData?.args?.filters],
    });

    // return
    return {
        rawData: useList.data ?? [],
        isLoading: useCount.isLoading || useList.isLoading,
        error: useCount.errorText ?? useList.errorText ?? null,
        pageNumber: useList.pageNumber,
        totalPages: useList.totalPages,
        onPageChange: useList.onPageChange,
    };
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
                                                                                {showZh && (
                                                                                    <div className="AuthorCard__nameZh">
                                                                                        <a href="#" onClick={onPick(zh)} aria-label={`依作者篩選：${zh}${en ? ` (${en})` : ""}`} style={{ color: "inherit", textDecoration: "none" }}>
                                                                                            {zh}
                                                                                        </a>
                                                                                    </div>
                                                                                )}
                                                                                {showZh && !!en && (
                                                                                    <div className="AuthorCard__nameEn ms-2">
                                                                                        <a href="#" onClick={onPick(en)} aria-label={`依作者篩選：${en}`} style={{ color: "inherit", textDecoration: "none" }}>
                                                                                            ({en})
                                                                                        </a>
                                                                                    </div>
                                                                                )}
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
                        const tagName = type.Tag?._TagDetail?.find(p => p.Lang === props.lang)?.TagName;

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

    // return（DOM 不改）
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
