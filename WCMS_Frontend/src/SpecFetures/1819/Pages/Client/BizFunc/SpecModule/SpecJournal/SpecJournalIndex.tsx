import { useEffect, useMemo } from "react";
import { LangLink } from "@/SysCore/i18n/LangLink";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import type { components } from "@/types/api";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import clsx from "clsx";
import type { Lang } from "@/SysCore/i18n/lang";
import { SpecJournalKeywordSearch_Comp } from "@/SpecFetures/1819/Pages/Client/BizFunc/SpecModule/SpecJournal/SpecJournalKeywordSearchComp";

// ✅ 新架構：LoaderData initial + adapter hooks
import { useLoaderData } from "react-router-dom";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { SpecJournalIndexAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournalIndex_Api";
import type { SpecJournalIndexLoaderData } from "./SpecJournalIndex_Loader";

type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

/** ===== Helpers (放 component 外面，方便 code review 後續整理) ===== */

const buildCollapseIds = (year: string) => {
    // 宣告變數
    const collapseId = `collapse-${year}`;
    const headerId = `heading-${year}`;
    // return
    return { collapseId, headerId };
};

const wireBsAccordion = (root: HTMLElement) => {
    // NOTE: 讓 data-bs-* 走既有 bootstrap collapse 行為；這裡只補鍵盤可用性
    const toggles = root.querySelectorAll<HTMLElement>("[data-bs-toggle='collapse']");
    toggles.forEach((el) => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                e.preventDefault();
                el.click();
            }
        };
        el.addEventListener("keydown", onKeyDown);
        (el as unknown as { __wcms_onKeyDown?: (e: KeyboardEvent) => void }).__wcms_onKeyDown = onKeyDown;
    });
};

const unwireBsAccordion = (root: HTMLElement) => {
    const toggles = root.querySelectorAll<HTMLElement>("[data-bs-toggle='collapse']");
    toggles.forEach((el) => {
        const handler = (el as unknown as { __wcms_onKeyDown?: (e: KeyboardEvent) => void }).__wcms_onKeyDown;
        if (handler) el.removeEventListener("keydown", handler);
    });
};

export const SpecJournalIndex = (props: { node: INormNode; lang: Lang; }) => {
    const pageSize = 10;
    const loaderData = useLoaderData() as SpecJournalIndexLoaderData | null;
    const adapter = useMemo(() => SpecJournalIndexAdapter(), []);
    const useIndex = useSpecJournalIndex(adapter, pageSize, loaderData);
    const loadingList = useIndex.isLoading;
    const errorList = [useIndex.error];
    const paginprops: PaginatorProps =
    {
        currentPage: useIndex.pageNumber,
        totalPages: useIndex.totalPages,
        onPageChange: useIndex.onPageChange,
    };
    return (
        <ModuleContent nodeTitle={props.node.title} title={props.node.title} isLoading={loadingList} errorList={errorList} paginatorProps={paginprops} >
            <SpecJournalIndexContent title={props.node.title} data={useIndex.rawData} lang={props.lang} />
        </ModuleContent>
    )
};

const useSpecJournalIndex = (adapter: ReturnType<typeof SpecJournalIndexAdapter>,pageSize: number,loaderData: SpecJournalIndexLoaderData | null,) => {
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
    const initialList = useMemo<ApiLoaderData<QueryListParam, SpecJournalIndexSet[]> | null>(() => {
        if (!loaderData?.args?.baseParam) return null;
        if (loaderData.args.pageSize !== pageSize) return null;
        return {
            args: loaderData.args.baseParam,
            apiRes: { IsSuccess: true, Data: loaderData.res.listRes ?? [], SysMessage: [] },
        };
    }, [loaderData, pageSize]);
    // 執行 function：count/list
    const useCount = adapter.hooks.useQueryCount({
        condition: baseParam,
        initial: initialCount,
        deps: [pageSize],
    });
    const useList = adapter.hooks.usePagedQueryList({
        baseParam,
        count: useCount.data ?? 0,
        initial: initialList,
        deps: [pageSize],
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

const SpecJournalIndexContent = (props: { title?: string; data?: SpecJournalIndexSet[]; lang: Lang; }) => {
    useEffect(() => {
        // NOTE: 綁定 bootstrap accordion 的鍵盤行為（CSR only）
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
                {/* Journal Accordion */}
                <div className="col row-group">
                    <div id="accordion" className="JournalBar">
                        <div className="row_box">
                            <ul className="Journal_info">
                                {props.data?.map((group) => {
                                    const masterData = group.SpecJournalIndex;
                                    const DetailDatas = group.SpecJournalIndexDetail;
                                    const indexTitle = `${masterData?.IndexName}${props.lang === "zh-tw" ? " 年" : ""}`;
                                    const volTitle = `(Vol.${DetailDatas?.[0]?.Volume})`;
                                    const { collapseId, headerId } = buildCollapseIds(masterData?.IndexId ?? "");

                                    const toSortNum = (v: string | number | null | undefined): number => {
                                        const n = typeof v === "number" ? v : Number.parseInt(String(v ?? ""), 10);
                                        if (Number.isFinite(n)) return n;
                                        return Number.MAX_SAFE_INTEGER;
                                    };
                                    // 宣告：依 Volume、Issue 正排序（升冪）
                                    const sortedDetailDatas = [...(DetailDatas ?? [])].sort((a, b) => {
                                        const av = toSortNum(a.Volume);
                                        const bv = toSortNum(b.Volume);
                                        if (av !== bv) return av - bv;
                                        const ai = toSortNum(a.Issue);
                                        const bi = toSortNum(b.Issue);
                                        return ai - bi;
                                    });

                                    return (
                                        <li key={masterData?.IndexId}>
                                            <div className={clsx("card", `JL-${masterData?.IndexId}`)}>
                                                <div className="card-header" id={headerId}>
                                                    <a
                                                        href={`#${collapseId}`}
                                                        className="card-link collapsed"
                                                        data-bs-toggle="collapse"
                                                        type="button"
                                                        role="button"
                                                        aria-expanded="false"
                                                        aria-controls={collapseId}
                                                        title={indexTitle}
                                                    >
                                                        <span className="fs-5">
                                                            <i className={clsx("fas", "fa-folder-open", "me-3")} aria-hidden="true"></i>
                                                            {indexTitle} {volTitle}
                                                        </span>
                                                    </a>
                                                </div>

                                                <div id={collapseId} className="collapse" data-bs-parent="#accordion" aria-labelledby={headerId}>
                                                    <div className="card-body">
                                                        <ul className="Journallist-group">
                                                            {sortedDetailDatas.map((dt) => {
                                                                const volumeTitle = `Vol.${dt.Volume}, No.${dt.Issue}`;
                                                                return (
                                                                    <li key={dt.RowId}>
                                                                        <LangLink
                                                                            className="list-group-item"
                                                                            to={`../List/${masterData?.IndexId}/${dt.RowId}`}
                                                                            title={volumeTitle}
                                                                            aria-label={`前往 ${volumeTitle} 期刊列表`}
                                                                        >
                                                                            <div className="icontxtbox">
                                                                                <span className="page_icon">
                                                                                    <i className="far fa-file-alt" aria-hidden="true"></i>
                                                                                </span>
                                                                                <span className="icontxt">{volumeTitle}</span>
                                                                            </div>
                                                                        </LangLink>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};
