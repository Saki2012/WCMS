import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent, {
    type ModuleViewCountConfig,
} from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import { useBreadcrumb } from "@/Features/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp";
import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournal_Api";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import { getLangLabel, type Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { useLoaderData } from "react-router-dom";
import { SpecJournalKeywordSearch_Comp } from "./SpecJournalKeywordSearchComp";
import { type SpecJournalListLoaderData } from "./SpecJournalList_Loader";
import { useSpecJournalSearchNav } from "./SpecJournalSearchUtils";

type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

type SpecJournalFilters = {
    q: string;
    articleLang: string;
    tagId: string;
    tagName: string;
    author: string;
    keyword: string;
    includeRef: string;
};

/** SpecJournal：用 ModuleContent 包住 Journal_List_content */
export const SpecJournalList = (props: { site: INormSite; node: INormNode; lang: Lang; }) =>
{
    // 宣告變數
    const params = useParams();
    const { setItems } = useBreadcrumb();
    const loaderData = useLoaderData() as SpecJournalListLoaderData | null;
    const adapter = useMemo(() => SpecJournalAdapter(), []);
    const pageSize = 10;

    const routeIndexId = (loaderData?.args?.indexId ?? params.indexId ?? "").trim();
    const routeRowId = (loaderData?.args?.rowId ?? params.rowId ?? "").trim();
    const pageTitle = (loaderData?.args?.pageTitle ?? "").trim();
    const forceGlobal = loaderData?.args?.forceGlobal ?? false;

    const filters: SpecJournalFilters = loaderData?.args?.filters ?? {
        q: "",
        articleLang: "",
        tagId: "",
        tagName: "",
        author: "",
        keyword: "",
        includeRef: "",
    };

    const useVolume = useSpecJournalVolume(adapter, pageSize, loaderData);

    const isSearchMode = useMemo(() =>
    {
        return !!filters.q || !!filters.articleLang || !!filters.tagId || !!filters.author || !!filters.keyword;
    }, [filters.q, filters.articleLang, filters.tagId, filters.author, filters.keyword]);

    const issueLabel = useMemo(() =>
    {
        // 宣告變數：預刊 / global 模式直接顯示 loader title
        if (forceGlobal) return pageTitle;

        // 宣告變數：搜尋模式也維持 pageTitle，不要空掉
        if (isSearchMode) return pageTitle;

        // 宣告變數：沒有卷期參數就回 pageTitle
        if (!routeIndexId || !routeRowId) return pageTitle;

        // 執行 function：有卷期就優先顯示 Vol / No
        const detail = useVolume.rawData?.[0]?.SpecJournal?._JournalIndexDetail;
        if (!detail) return pageTitle;

        // return
        return `Vol.${detail.Volume}, No.${detail.Issue}`;
    }, [forceGlobal, isSearchMode, routeIndexId, routeRowId, pageTitle, useVolume.rawData]);

    const issueSummary = useMemo(() =>
    {
        // 宣告變數：預刊 / global / 搜尋模式都不顯示摘要下載
        if (forceGlobal) return { fileId: "", fileName: "" };
        if (isSearchMode) return { fileId: "", fileName: "" };

        // 執行 function：一般卷期模式才抓摘要
        const detail = useVolume.rawData?.[0]?.SpecJournal?._JournalIndexDetail;
        return {
            fileId: detail?.SummaryFileId ?? "",
            fileName: detail?.SummaryFileName ?? "",
            downloadCount: detail?.SummaryFile?.PublicDownloadCount ?? 0,
            isPdf: detail?.SummaryFile?.FileExtension?.toLowerCase() === "pdf",
        };
    }, [forceGlobal, isSearchMode, useVolume.rawData]);

    useEffect(() =>
    {
        // 宣告變數：只有卷期頁才掛第二層 breadcrumb，避免預刊 / 搜尋把 breadcrumb 弄亂
        const shouldShowIssueCrumb = !forceGlobal && !isSearchMode && !!routeIndexId && !!routeRowId && !!issueLabel
            && issueLabel !== pageTitle;

        // 執行 function
        if (shouldShowIssueCrumb) setItems([{ label: issueLabel }]);
        else setItems([]);

        // return cleanup
        return () => setItems([]);
    }, [forceGlobal, isSearchMode, routeIndexId, routeRowId, issueLabel, pageTitle, setItems]);

    const loadingList = useVolume.isLoading;
    const errorList = [useVolume.error];
    const moduleTitle = issueLabel || pageTitle;

    const paginprops: PaginatorProps = {
        currentPage: useVolume.pageNumber,
        totalPages: useVolume.totalPages,
        onPageChange: useVolume.onPageChange,
    };
    const viewCountConfig: ModuleViewCountConfig = { mode: "list" };
    return (
        <ModuleContent
            nodeTitle={moduleTitle}
            title={moduleTitle}
            isLoading={loadingList}
            errorList={errorList}
            paginatorProps={paginprops}
            viewCountConfig={viewCountConfig}
        >
            <SpecJournalListContent
                lang={props.lang}
                rawData={useVolume.rawData}
                queryFilters={filters}
                issueSummary={issueSummary}
            />
        </ModuleContent>
    );
};

/** hooks：SSR loaderData initial → CSR 分頁接手 */
const useSpecJournalVolume = (
    adapter: ReturnType<typeof SpecJournalAdapter>,
    pageSize: number,
    loaderData: SpecJournalListLoaderData | null,
) =>
{
    // 宣告變數
    const baseParam = useMemo<QueryListParam>(() =>
    {
        if (!loaderData?.args?.baseParam) return { Fields: [], Condition: "1=0", PageNumber: 1, PageSize: pageSize };
        if (loaderData.args.pageSize !== pageSize)
        {
            return { Fields: [], Condition: "1=0", PageNumber: 1, PageSize: pageSize };
        }
        return loaderData.args.baseParam;
    }, [loaderData, pageSize]);

    const initialCount = useMemo<ApiLoaderData<QueryListParam, number> | null>(() =>
    {
        if (!loaderData?.args?.baseParam) return null;
        if (loaderData.args.pageSize !== pageSize) return null;

        return {
            args: loaderData.args.baseParam,
            apiRes: { IsSuccess: true, Data: loaderData.res.countRes ?? 0, SysMessage: [] },
        };
    }, [loaderData, pageSize]);

    const initialList = useMemo<ApiLoaderData<QueryListParam, SpecJournalSet[]> | null>(() =>
    {
        if (!loaderData?.args?.baseParam) return null;
        if (loaderData.args.pageSize !== pageSize) return null;

        return {
            args: loaderData.args.baseParam,
            apiRes: { IsSuccess: true, Data: loaderData.res.listRes ?? [], SysMessage: [] },
        };
    }, [loaderData, pageSize]);

    const queryKey = useMemo(() =>
    {
        return JSON.stringify({
            indexId: loaderData?.args?.indexId ?? "",
            rowId: loaderData?.args?.rowId ?? "",
            forceGlobal: loaderData?.args?.forceGlobal ?? false,
            q: loaderData?.args?.filters?.q ?? "",
            articleLang: loaderData?.args?.filters?.articleLang ?? "",
            tagId: loaderData?.args?.filters?.tagId ?? "",
            author: loaderData?.args?.filters?.author ?? "",
            keyword: loaderData?.args?.filters?.keyword ?? "",
            includeRef: loaderData?.args?.filters?.includeRef ?? "",
            condition: baseParam.Condition ?? "",
            pageSize,
        });
    }, [
        loaderData?.args?.indexId,
        loaderData?.args?.rowId,
        loaderData?.args?.forceGlobal,
        loaderData?.args?.filters?.q,
        loaderData?.args?.filters?.articleLang,
        loaderData?.args?.filters?.tagId,
        loaderData?.args?.filters?.author,
        loaderData?.args?.filters?.keyword,
        loaderData?.args?.filters?.includeRef,
        baseParam.Condition,
        pageSize,
    ]);

    const [hasPaged, setHasPaged] = useState<boolean>(false);

    useEffect(() =>
    {
        setHasPaged(false);
    }, [queryKey]);

    // 執行 function：count
    const useCount = adapter.hooks.useQueryCount({
        condition: baseParam,
        initial: initialCount,
        deps: [
            queryKey,
            baseParam.Condition,
            baseParam.PageSize,
        ],
    });

    // 執行 function：list
    const useList = adapter.hooks.usePagedQueryList({
        baseParam,
        count: useCount.data ?? 0,
        initial: hasPaged ? null : initialList,
        deps: [
            queryKey,
            baseParam.Condition,
            baseParam.PageSize,
        ],
    });

    const handlePageChange = (page: number): void =>
    {
        setHasPaged(true);
        useList.onPageChange(page);
    };

    // return
    return {
        rawData: useList.data ?? [],
        isLoading: useCount.isLoading || useList.isLoading,
        error: useCount.errorText ?? useList.errorText ?? null,
        pageNumber: useList.pageNumber,
        totalPages: useList.totalPages,
        onPageChange: handlePageChange,
    };
};

/** SpecJournalListContent：對齊 prototype 的 Journal_List_content DOM 結構 */
const SpecJournalListContent = (props: {
    lang: Lang;
    rawData: SpecJournalSet[];
    issueSummary: { fileId?: string; fileName?: string; downloadCount?: number; isPdf?: boolean; };
    queryFilters: {
        q?: string;
        articleLang?: string;
        tagId?: string;
        tagName?: string;
        author?: string;
        keyword?: string;
        includeRef?: string;
    };
}) =>
{
    // 宣告變數
    const filters = props.queryFilters;
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
        if (filters.q) parts.push(`搜尋：${filters.q}`);
        if (filters.articleLang) parts.push(`語言：${getLangLabel(filters.articleLang)}`);
        if (filters.tagId) parts.push(`類型：${filters.tagName || filters.tagId}`);
        if (filters.author) parts.push(`作者：${filters.author}`);
        if (filters.keyword) parts.push(`關鍵詞：${filters.keyword}`);
        return parts.join("；") || "未選擇條件";
    }, [filters.q, filters.articleLang, filters.tagId, filters.tagName, filters.author, filters.keyword]);

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

                <IssueSummaryDownload {...props.issueSummary} />

                <div className="JJ_main_contentDIV">
                    <ul className="ListInfo">
                        {props.rawData.map((it) => (
                            <li key={it.SpecJournal?.JournalId} className="JInfo_item">
                                <div className="row__group">
                                    <LangLink
                                        className="Jitem-inner"
                                        to={`../Form/${it.SpecJournal?._JournalIndexDetail?.IndexId}/${it.SpecJournal?._JournalIndexDetail?.RowId}/${
                                            it.SpecJournal?.JournalId ?? ""
                                        }`}
                                        target="_self"
                                        title={it.SpecJournal?.Title ?? ""}
                                    >
                                        <JournalCard
                                            item={it}
                                            lang={props.lang}
                                            onPickArticleLang={handlePickArticleLang}
                                            onPickTypeTag={handlePickTypeTag}
                                        />
                                    </LangLink>

                                    <div className="card_authorDiv">
                                        <div className="card_author">
                                            <span className="me-3">作者 :</span>
                                            <div className="authorName" aria-label="authorName">
                                                <ul className="authorName_list">
                                                    {it.SpecJournalAuthor?.map((au) =>
                                                    {
                                                        return (
                                                            <li
                                                                key={`${it.SpecJournal?.JournalId}-au-${au.RowId}`}
                                                                className="authorlist-item"
                                                            >
                                                                <LangLink
                                                                    to={`../Form/${it.SpecJournal?._JournalIndexDetail?.IndexId}/${it.SpecJournal?._JournalIndexDetail?.RowId}/${
                                                                        it.SpecJournal?.JournalId ?? ""
                                                                    }`}
                                                                >
                                                                    {(() =>
                                                                    {
                                                                        const zh = (au.AuthorName ?? "").trim();
                                                                        const en = (au.AuthorName_en ?? "").trim();
                                                                        const showZh = !!zh;
                                                                        const showEnOnly = !!en && !showZh;

                                                                        const onPick =
                                                                            (v: string) => (e: React.MouseEvent) =>
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
                                                                                            aria-label={`依作者篩選：${zh}${
                                                                                                en ? ` (${en})` : ""
                                                                                            }`}
                                                                                            style={{
                                                                                                color: "inherit",
                                                                                                textDecoration: "none",
                                                                                            }}
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
                                                                                            aria-label={`依作者篩選：${en}`}
                                                                                            style={{
                                                                                                color: "inherit",
                                                                                                textDecoration: "none",
                                                                                            }}
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
                                                                                            aria-label={`依作者篩選：${en}`}
                                                                                            style={{
                                                                                                color: "inherit",
                                                                                                textDecoration: "none",
                                                                                            }}
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
                                    <DocumentList data={it} />
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
const JournalCard = (props: {
    item: SpecJournalSet;
    lang: Lang;
    onPickArticleLang: (langCode: string) => void;
    onPickTypeTag: (tagId: string, tagName?: string) => void;
}) =>
{
    // 宣告變數
    const langCode = props.item.SpecJournal?.ArticleLang ?? "";
    const langLabel = getLangLabel(langCode);
    const pStart = props.item.SpecJournal?.PageStart ?? 0;
    const pEnd = props.item.SpecJournal?.PageEnd ?? 0;
    const pageTitle = pStart < pEnd ? `(p.${pStart} - ${pEnd})` : `(p.${pStart})`;

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
                                aria-label={`依語言篩選：${langLabel}`}
                                style={{ color: "inherit", textDecoration: "none" }}
                            >
                                {langLabel}
                            </a>
                        </div>
                    </div>

                    {props.item.SpecJournalTypes?.map((type) =>
                    {
                        const tagName = type.Tag?._TagDetail?.find((p) => p.Lang === props.lang)?.TagName;

                        return (
                            <div
                                key={`${props.item.SpecJournal?.JournalId}-type-${type.RowId ?? type.TagId ?? ""}`}
                                className="card_cat_item"
                            >
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
                                        aria-label={`依分類篩選：${tagName ?? ""}`}
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
                    {props.item.SpecJournal?.ArticleLang === "zh-tw"
                        ? props.item.SpecJournal?.Title
                        : props.item.SpecJournal?.Title_en} {pageTitle}
                </div>
                <div className="card_title_en">
                    {props.item.SpecJournal?.ArticleLang === "en"
                        ? props.item.SpecJournal?.Title
                        : props.item.SpecJournal?.Title_en}
                </div>
            </div>

            <div className="line-my-2"></div>
        </div>
    );
};

const IssueSummaryDownload = (
    props: { fileId?: string; fileName?: string; downloadCount?: number; isPdf?: boolean; },
) =>
{
    const fileId = (props.fileId ?? "").trim();
    const fileName = (props.fileName ?? "").trim();
    const href = props.isPdf
        ? FileManagementAPI.get_Public_Preview_Url(fileId, fileName)
        : FileManagementAPI.get_Public_Download_Url(fileId, fileName);
    const canShow = !!fileId && !!fileName;
    if (!canShow) return null;
    return (
        <>
            <div className="JJ_main_contentDIV">
                <div className="DownItem_Box">
                    <a className="page-item" href={href} title={fileName} target="_blank" rel="noopener noreferrer">
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
                        <span className="font-SW-normal">下載次數 :</span>
                        <span className="font-SW-normal + ms-2">{props.downloadCount}</span>
                    </span>
                </div>
            </div>
            <p />
        </>
    );
};

type Document = { key: string; fileId: string; fileName: string; };

const buildDocuments = (data: SpecJournalSet): Document[] =>
{
    const files: Document[] = [];
    data?.SpecJournalDocument?.slice().sort((a, b) => (a.DocumentType ?? 0) - (b.DocumentType ?? 0)).forEach(
        (item, idx) =>
        {
            files.push({
                key: `document-${idx}`,
                fileId: item.DocumentId ?? "",
                fileName: item.DocumentName || item.DocumentId || "",
            });
        },
    );
    return files;
};
const DocumentList = (props: { data: SpecJournalSet; }) =>
{
    // 宣告變數
    const MAX_PREVIEW_FILES = 4; // 最多顯示檔案數量
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
                                <a
                                    className="w-100 border rounded bg-white text-decoration-none d-flex align-items-center px-2 py-2"
                                    href={fileUrl}
                                    title={fileName}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span
                                        className="d-inline-flex align-items-center justify-content-center rounded flex-shrink-0 me-3"
                                        style={{
                                            width: "34px",
                                            height: "34px",
                                            backgroundColor: "#bca33a",
                                            color: "#ffffff",
                                        }}
                                    >
                                        <i className="far fa-file-alt" aria-hidden="true" />
                                    </span>
                                    <span
                                        className="text-dark fw-semibold text-break"
                                        style={{ lineHeight: "1.35", wordBreak: "break-word" }}
                                    >
                                        {file.fileName}
                                    </span>
                                </a>
                            </li>
                        );
                    })}
                </ul>
                {hasMoreFiles && (
                    <div className="small text-muted mt-1" aria-label="更多說明檔案請進入詳細頁查看">
                        ...
                    </div>
                )}
            </div>
        </div>
    );
};
