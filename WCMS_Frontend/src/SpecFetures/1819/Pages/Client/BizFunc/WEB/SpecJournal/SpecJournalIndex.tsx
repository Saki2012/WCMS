import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent, {
    type ModuleViewCountConfig,
} from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import { SpecJournalKeywordSearch_Comp } from "@/SpecFetures/1819/Pages/Client/BizFunc/WEB/SpecJournal/SpecJournalKeywordSearchComp";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import type { components } from "@/types/api";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";

// ✅ 新架構：LoaderData initial + adapter hooks
import { SpecJournalIndexAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/WEB/SpecJournalIndex_Api";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { useLoaderData } from "react-router-dom";
import type { SpecJournalIndexLoaderData } from "./SpecJournalIndex_Loader";

type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

/** ===== Helpers (放 component 外面，方便 code review 後續整理) ===== */

const buildCollapseIds = (year: string) =>
{
    // 宣告變數
    const collapseId = `collapse-${year}`;
    const headerId = `heading-${year}`;
    // return
    return { collapseId, headerId };
};

export const SpecJournalIndex = (props: { site: INormSite; node: INormNode; lang: Lang; }) =>
{
    const pageSize = 10;
    const loaderData = useLoaderData() as SpecJournalIndexLoaderData | null;
    const adapter = useMemo(() => SpecJournalIndexAdapter(), []);
    const useIndex = useSpecJournalIndex(adapter, pageSize, loaderData);
    const loadingList = useIndex.isLoading;
    const errorList = [useIndex.error];
    const paginprops: PaginatorProps = {
        currentPage: useIndex.pageNumber,
        totalPages: useIndex.totalPages,
        onPageChange: useIndex.onPageChange,
    };
    const viewCountConfig: ModuleViewCountConfig = { mode: "list" };
    return (
        <ModuleContent
            nodeTitle={props.node.title}
            title={props.node.title}
            isLoading={loadingList}
            errorList={errorList}
            paginatorProps={paginprops}
            viewCountConfig={viewCountConfig}
        >
            <SpecJournalIndexContent title={props.node.title} data={useIndex.rawData} lang={props.lang} />
        </ModuleContent>
    );
};

const handleAccordionKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>, onToggle: () => void): void =>
{
    if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
    e.preventDefault();
    onToggle();
};

const ACCORDION_ANIMATION_MS = 280;

const stopAccordionTimer = (el: HTMLDivElement): void =>
{
    // 宣告變數：取出 timer id
    const timerId = Number(el.dataset.timerId ?? "0");
    if (timerId > 0) window.clearTimeout(timerId);

    // 執行 function：清掉暫存 timer
    delete el.dataset.timerId;
};

const syncAccordionPanel = (el: HTMLDivElement, isOpen: boolean): void =>
{
    // 執行 function：先停止前一次動畫
    stopAccordionTimer(el);

    // 執行 function：同步到最終狀態
    el.style.transition = "";
    el.style.overflow = "";
    el.style.height = "";
    el.style.opacity = "";
    el.style.display = isOpen ? "block" : "none";
};

const animateAccordionPanel = (el: HTMLDivElement, isOpen: boolean): void =>
{
    // 執行 function：先停止前一次動畫
    stopAccordionTimer(el);

    if (isOpen)
    {
        // 執行 function：先顯示，並把起點固定在 0 高度
        el.style.display = "block";
        el.style.transition = "";
        el.style.overflow = "hidden";
        el.style.height = "0px";
        el.style.opacity = "0";

        // 宣告變數：抓展開後的目標高度
        const toHeight = el.scrollHeight;

        // 執行 function：強制 reflow，讓 0px 起點生效
        void el.offsetHeight;

        // 執行 function：開始展開動畫
        el.style.transition = `height ${ACCORDION_ANIMATION_MS}ms ease, opacity 220ms ease`;
        el.style.height = `${toHeight}px`;
        el.style.opacity = "1";

        const timerId = window.setTimeout(() =>
        {
            // 執行 function：動畫結束後還原自然高度
            el.style.transition = "";
            el.style.overflow = "";
            el.style.height = "";
            el.style.opacity = "";
            el.style.display = "block";
            delete el.dataset.timerId;
        }, ACCORDION_ANIMATION_MS);

        el.dataset.timerId = String(timerId);
        return;
    }

    // 宣告變數：收合動畫的起點高度
    el.style.display = "block";
    const fromHeight = el.getBoundingClientRect().height || el.scrollHeight;

    // 執行 function：設定收合起點
    el.style.transition = "";
    el.style.overflow = "hidden";
    el.style.height = `${fromHeight}px`;
    el.style.opacity = "1";

    // 執行 function：強制 reflow
    void el.offsetHeight;

    // 執行 function：開始收合動畫
    el.style.transition = `height ${ACCORDION_ANIMATION_MS}ms ease, opacity 180ms ease`;
    el.style.height = "0px";
    el.style.opacity = "0";

    const timerId = window.setTimeout(() =>
    {
        // 執行 function：動畫結束後完全隱藏
        el.style.transition = "";
        el.style.overflow = "";
        el.style.height = "";
        el.style.opacity = "";
        el.style.display = "none";
        delete el.dataset.timerId;
    }, ACCORDION_ANIMATION_MS);

    el.dataset.timerId = String(timerId);
};

const useSpecJournalIndex = (
    adapter: ReturnType<typeof SpecJournalIndexAdapter>,
    pageSize: number,
    loaderData: SpecJournalIndexLoaderData | null,
) =>
{
    // 宣告變數
    const baseParam = useMemo<QueryListParam>(() =>
    {
        if (!loaderData?.args?.baseParam)
        {
            return { Fields: [], Condition: "1=0", PageNumber: 1, PageSize: pageSize };
        }

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

    const initialList = useMemo<ApiLoaderData<QueryListParam, SpecJournalIndexSet[]> | null>(() =>
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
            condition: baseParam.Condition ?? "",
            pageSize,
        });
    }, [baseParam.Condition, pageSize]);

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
const SpecJournalIndexContent = (props: { title?: string; data?: SpecJournalIndexSet[]; lang: Lang; }) =>
{
    // 宣告變數：目前開啟中的 IndexId
    const [openIndexId, setOpenIndexId] = useState<string | null>(null);
    const panelRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const panelStateRef = useRef<Record<string, boolean>>({});
    const hasInitRef = useRef<boolean>(false);

    const handleToggle = (indexId: string): void =>
    {
        // 執行 function：同一個再點一次就收回，不同的就切換過去
        setOpenIndexId((prev) => (prev === indexId ? null : indexId));
    };

    const setPanelRef = (indexId: string, el: HTMLDivElement | null): void =>
    {
        // 執行 function：保存 panel ref
        panelRefs.current[indexId] = el;
    };

    useEffect(() =>
    {
        // 宣告變數：目前頁面上的所有 panel id
        const panelIds = (props.data ?? [])
            .map((group) => group.SpecJournalIndex?.IndexId ?? "")
            .filter((id): id is string => id !== "");

        panelIds.forEach((panelId) =>
        {
            const el = panelRefs.current[panelId];
            if (!el) return;

            const nextOpen = openIndexId === panelId;
            const prevOpen = panelStateRef.current[panelId] ?? false;

            if (!hasInitRef.current)
            {
                // 執行 function：首次 render 直接同步，不做動畫
                syncAccordionPanel(el, nextOpen);
                panelStateRef.current[panelId] = nextOpen;
                return;
            }

            if (prevOpen === nextOpen) return;

            // 執行 function：狀態改變才跑動畫
            animateAccordionPanel(el, nextOpen);
            panelStateRef.current[panelId] = nextOpen;
        });

        hasInitRef.current = true;
    }, [openIndexId, props.data]);

    useEffect(() =>
    {
        return () =>
        {
            // 執行 function：unmount 時清掉 timer
            Object.values(panelRefs.current).forEach((el) =>
            {
                if (!el) return;
                stopAccordionTimer(el);
            });
        };
    }, []);

    const toSortNum = (v: string | number | null | undefined): number =>
    {
        // 宣告變數：將字串/數字轉成排序用 number
        const n = typeof v === "number" ? v : Number.parseInt(String(v ?? ""), 10);
        // return
        return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
    };

    return (
        <div className="Journal_List_content">
            <div className="row">
                <div className="CategoryBar w-100">
                    <SpecJournalKeywordSearch_Comp basePath="../List" />
                </div>

                <div className="col row-group">
                    <hr className="hr-my-4" />
                </div>

                <div className="col row-group">
                    <div id="accordion" className="JournalBar">
                        <div className="row_box">
                            <div className={clsx("card", `JL-Preprint`)}>
                                <div className="card-header">
                                    <LangNavLink
                                        to="/Issues/Preprint"
                                        className={clsx("card-link", "collapsed")}
                                        role="button"
                                        aria-expanded={false}
                                        title={"預刊本"}
                                    >
                                        <span className="fs-5">
                                            <i className={clsx("fas", "fa-folder-open", "me-3")} aria-hidden="true" />
                                            預刊本
                                        </span>
                                    </LangNavLink>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr className="hr-my-4" />
                </div>
                {/* Journal Accordion */}
                <div className="col row-group">
                    <div id="accordion" className="JournalBar">
                        <div className="row_box">
                            <ul className="Journal_info">
                                {props.data?.map((group) =>
                                {
                                    const masterData = group.SpecJournalIndex;
                                    const detailDatas = group.SpecJournalIndexDetail ?? [];
                                    const indexId = masterData?.IndexId ?? "";
                                    const indexTitle = `${masterData?.IndexName}${props.lang === "zh-tw" ? " 年" : ""}`;
                                    const volTitle = `(Vol.${detailDatas[0]?.Volume ?? ""})`;
                                    const { collapseId, headerId } = buildCollapseIds(indexId);
                                    const isOpen = openIndexId === indexId;

                                    const sortedDetailDatas = [...detailDatas].sort((a, b) =>
                                    {
                                        const av = toSortNum(a.Volume);
                                        const bv = toSortNum(b.Volume);
                                        if (av !== bv) return av - bv;

                                        const ai = toSortNum(a.Issue);
                                        const bi = toSortNum(b.Issue);
                                        return ai - bi;
                                    });

                                    return (
                                        <li key={indexId}>
                                            <div className={clsx("card", `JL-${indexId}`)}>
                                                <div className="card-header" id={headerId}>
                                                    <a
                                                        href={`#${collapseId}`}
                                                        className={clsx("card-link", !isOpen && "collapsed")}
                                                        role="button"
                                                        aria-expanded={isOpen}
                                                        aria-controls={collapseId}
                                                        title={indexTitle}
                                                        onClick={(e) =>
                                                        {
                                                            // 阻止 href 跳頁，只交給 React 控狀態
                                                            e.preventDefault();
                                                            handleToggle(indexId);
                                                        }}
                                                        onKeyDown={(e) =>
                                                        {
                                                            handleAccordionKeyDown(e, () => handleToggle(indexId));
                                                        }}
                                                    >
                                                        <span className="fs-5">
                                                            <i
                                                                className={clsx("fas", "fa-folder-open", "me-3")}
                                                                aria-hidden="true"
                                                            >
                                                            </i>
                                                            {indexTitle} {volTitle}
                                                        </span>
                                                    </a>
                                                </div>

                                                <div
                                                    id={collapseId}
                                                    ref={(el) =>
                                                    {
                                                        setPanelRef(indexId, el);
                                                    }}
                                                    className="collapse"
                                                    aria-labelledby={headerId}
                                                    aria-hidden={!isOpen}
                                                >
                                                    <div className="card-body">
                                                        <ul className="Journallist-group">
                                                            {sortedDetailDatas.map((dt) =>
                                                            {
                                                                const volumeTitle = `Vol.${dt.Volume}, No.${dt.Issue}`;
                                                                return (
                                                                    <li key={dt.RowId}>
                                                                        <LangLink
                                                                            className="list-group-item"
                                                                            to={`../List/${indexId}/${dt.RowId}`}
                                                                            title={volumeTitle}
                                                                            aria-label={`前往 ${volumeTitle} 期刊列表`}
                                                                        >
                                                                            <div className="icontxtbox">
                                                                                <span className="page_icon">
                                                                                    <i
                                                                                        className="far fa-file-alt"
                                                                                        aria-hidden="true"
                                                                                    >
                                                                                    </i>
                                                                                </span>
                                                                                <span className="icontxt">
                                                                                    {volumeTitle}
                                                                                </span>
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
        </div>
    );
};
