import { useEffect, useMemo } from "react";
import { LangLink } from "@/SysCore/i18n/LangLink";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import type { components } from "@/types/api";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { SpecJournalIndexDetailFields, SpecJournalIndexModelFields, SpecJournalIndexSetFields } from "@/types/SchemaFields";
import SpecJournalIndexProvider from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecMusical/SpecJournalIndex_Api";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import clsx from "clsx";
import type { Lang } from "@/SysCore/i18n/lang";
import { SpecJournalKeywordSearch_Comp } from "@/SpecFetures/1819/Pages/Client/BizFunc/SpecModule/SpecJournal/SpecJournalKeywordSearchComp";
type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];



/** ===== Helpers (放 component 外面，方便 code review 後續整理) ===== */

const buildCollapseIds = (year: string) => {
    const collapseId = `collapse-${year}`;
    const headerId = `heading-${year}`;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (el as any).__wcms_onKeyDown = onKeyDown;
    });
};

const unwireBsAccordion = (root: HTMLElement) => {
    const toggles = root.querySelectorAll<HTMLElement>("[data-bs-toggle='collapse']");
    toggles.forEach((el) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handler = (el as any).__wcms_onKeyDown as ((e: KeyboardEvent) => void) | undefined;
        if (handler) el.removeEventListener("keydown", handler);
    });
};


export const SpecJournalIndex = (props: { node: INormNode; lang: Lang; }) => {
    const pageSize = 10;
    const pvdr = useMemo(() => { return SpecJournalIndexProvider() }, [])
    const indexData = indexFetch(pvdr, pageSize);
    const loadingList: any = [indexData.isLoading];
    const errorList: any = [indexData.error];
    const paginprops: PaginatorProps = { currentPage: indexData.gridProps.CurrentPage, totalPages: indexData.gridProps.TotalPage, onPageChange: indexData.gridProps.onPageChange };
    return (
        <ModuleContent nodeTitle={props.node.title} title={props.node.title} loadingList={loadingList} errorList={errorList} paginatorProps={paginprops} >
            <SpecJournalIndexContent title={props.node.title} data={indexData.rawData} lang={props.lang} />
        </ModuleContent>
    )
}

const SpecJournalIndexContent = (props: { title?: string; data?: SpecJournalIndexSet[]; lang: Lang; }) => {
    // ===== effects =====
    useEffect(() => {
        // NOTE: 綁定 bootstrap accordion 的鍵盤行為
        const root = document.getElementById("ContentPlaceContent_ContentConentA");
        if (!root) return;
        wireBsAccordion(root);
        return () => unwireBsAccordion(root);
    }, []);


    // ===== render =====
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
                                    const DetailDatas = group.SpecJournalIndexDetail
                                    const indexTitle = `${masterData?.IndexName}${props.lang === 'zh-tw' ? " 年" : ""}`
                                    const volTitle = `(Vol.${DetailDatas?.[0]?.Volume})`
                                    const { collapseId, headerId } = buildCollapseIds(masterData?.IndexId ?? "");

                                    const toSortNum = (v: string | number | null | undefined): number => {
                                        const n = typeof v === "number" ? v : Number.parseInt(String(v ?? ""), 10);
                                        if (Number.isFinite(n)) return n;
                                        return Number.MAX_SAFE_INTEGER;
                                    };
                                    // 宣告：依 Volume、Issue 正排序（升冪）
                                    const sortedDetailDatas = useMemo(() => {
                                        const list = DetailDatas ?? [];
                                        return [...list].sort((a, b) => {
                                            const av = toSortNum(a.Volume);
                                            const bv = toSortNum(b.Volume);
                                            if (av !== bv) return av - bv;
                                            const ai = toSortNum(a.Issue);
                                            const bi = toSortNum(b.Issue);
                                            return ai - bi;
                                        });
                                    }, [DetailDatas]);

                                    return (
                                        <li key={masterData?.IndexId}>
                                            <div className={clsx("card", `JL-${masterData?.IndexId}`)}>
                                                <div className="card-header" id={headerId}>
                                                    <a href={`#${collapseId}`} className="card-link collapsed" data-bs-toggle="collapse" type="button"
                                                        role="button" aria-expanded="false" aria-controls={collapseId} title={indexTitle}>
                                                        <span className="fs-5">
                                                            <i className={clsx("fas", "fa-folder-open", "me-3")} aria-hidden="true"></i>
                                                            {indexTitle} {volTitle}
                                                        </span>
                                                    </a>
                                                </div>

                                                <div id={collapseId} className="collapse" data-bs-parent="#accordion" aria-labelledby={headerId}>
                                                    <div className="card-body">
                                                        <ul className="Journallist-group">
                                                            {sortedDetailDatas?.map((dt) => {
                                                                const volumeTitle = `Vol.${dt.Volume}, No.${dt.Issue}`
                                                                return (
                                                                    <li key={dt.RowId}>
                                                                        <LangLink className="list-group-item" to={`../List/${masterData?.IndexId}/${dt.RowId}`} title={volumeTitle} aria-label={`前往 ${volumeTitle} 期刊列表`}>
                                                                            <div className="icontxtbox">
                                                                                <span className="page_icon">
                                                                                    <i className="far fa-file-alt" aria-hidden="true"></i>
                                                                                </span>
                                                                                <span className="icontxt">{volumeTitle}</span>
                                                                            </div>
                                                                        </LangLink>
                                                                    </li>
                                                                )
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

const indexFetch = (provider: IDataProvider<SpecJournalIndexSet>, pageSize: number) => {
    var condition: string = "";
    return useFetchGridListData<SpecJournalIndexSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: (page) => ({
            Fields: [
                SpecJournalIndexModelFields.IndexId,
                SpecJournalIndexModelFields.IndexName,
                SpecJournalIndexModelFields.InternalId,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.RowId}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileId}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileName}`,
            ],
            Condition: condition,
            OrderBy: [
                { Col: SpecJournalIndexModelFields.IndexName, Desc: true },
                { Col: `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`, Desc: false },
                { Col: `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`, Desc: false },
            ],
            PageNumber: page,
            PageSize: pageSize,
        }),
        enabled: true,
        deps: [pageSize],
    });
};