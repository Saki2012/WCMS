import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { useMemo } from "react";
import { type ITimelineOptions, useTimelineFormFetchData } from "./Client_Timeline_Form_Loader";
type TimelineSet = components["schemas"]["TimelineSet_DTO"];
type TimelineItem = components["schemas"]["TimelineItem_DTO"];
type TimelineLangDetail = components["schemas"]["TimelineLangDetail_DTO"];

interface ITimelineFormProps
{
    site: INormSite;
    node: INormNode;
    lang: Lang;
    theme?: IFETheme;
    options?: ITimelineOptions;
}

interface ITimelineEntryVm
{
    key: string;
    title: string;
    content: string;
}

interface ITimelineYearBlockVm
{
    key: string;
    yearText: string;
    rows: ITimelineEntryVm[];
}

/** 解析年份文字 */
const resolveYearText = (date: TimelineItem["Date"]): string =>
{
    const raw = `${date ?? ""}`.trim();
    if (!raw) return "";
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return `${parsed.getFullYear()}`;
    return raw.slice(0, 4);
};

/** 依時間順序排序 */
const sortTimelineItems = (items: TimelineItem[], isDescOverride?: boolean): TimelineItem[] =>
{
    const isDesc = isDescOverride;
    return [...items].sort((a, b) =>
    {
        const aTime = new Date(`${a.Date ?? ""}`).getTime();
        const bTime = new Date(`${b.Date ?? ""}`).getTime();
        if (aTime === bTime) return Number(a.RowId ?? 0) - Number(b.RowId ?? 0);
        return isDesc ? bTime - aTime : aTime - bTime;
    });
};

/** 依 TimelineItem 取出目前語系明細 */
const getDetailRowsByItem = (item: TimelineItem, details: TimelineLangDetail[], lang: Lang): TimelineLangDetail[] =>
{
    return (details ?? []).filter(p => Number(p.ParentRowId ?? 0) === Number(item.RowId ?? 0) && `${p.Lang ?? ""}` === `${lang}`).sort((a, b) =>
        Number(a.RowId ?? 0) - Number(b.RowId ?? 0)
    );
};

/** 依 listData 組出年份區塊 */
const buildTimelineBlocksFromList = (listData: TimelineSet[], lang: Lang, isDescOverride?: boolean): ITimelineYearBlockVm[] =>
{
    const yearMap = new Map<string, ITimelineYearBlockVm>();
    listData.forEach((setData) =>
    {
        const items = sortTimelineItems(setData.TimelineItem ?? [], isDescOverride);
        const details = setData.TimelineLangDetail ?? [];
        items.forEach((item) =>
        {
            const yearText = resolveYearText(item.Date);
            if (!yearText) return;
            const matched = getDetailRowsByItem(item, details, lang);
            if (matched.length === 0) return;
            if (!yearMap.has(yearText))
            {
                yearMap.set(yearText, { key: `year-${yearText}`, yearText, rows: [] });
            }
            const block = yearMap.get(yearText);
            if (!block) return;
            matched.forEach((detail) =>
            {
                block.rows.push({
                    key: `${item.TimelineId ?? ""}-${item.RowId ?? 0}-${detail.RowId ?? 0}`,
                    title: `${detail.Title ?? ""}`.trim(),
                    content: `${detail.Content ?? ""}`.trim(),
                });
            });
        });
    });
    return Array.from(yearMap.values());
};

/** 建立分頁設定 */
const usePaginatorProps = (vm: { pageNumber: number; totalPages: number; onPageChange?: (page: number) => void; }) =>
{
    return useMemo(() =>
    {
        if (!vm.onPageChange) return undefined;

        return { currentPage: vm.pageNumber, totalPages: vm.totalPages, onPageChange: vm.onPageChange };
    }, [vm.onPageChange, vm.pageNumber, vm.totalPages]);
};
/** 註:2026/04/23，目前後端還沒有開放可透過detail(即某model)直接搜尋的功能，故暫時還沒得做分頁
 * 就算能做也是先把所有資料撈回來，不符合我們讓資料少量使用的原則
 * 後續開了再來重構這一塊
 */
const TimelineForm = (props: ITimelineFormProps) =>
{
    const vm = useTimelineFormFetchData({ lang: props.lang, opts: props.options });

    const blocks = useMemo(() =>
    {
        return buildTimelineBlocksFromList(vm.listData, props.lang, props.options?.IsDesc);
    }, [vm.listData, props.lang, props.options?.IsDesc]);

    const paginatorProps = usePaginatorProps(vm);

    const title = useMemo(() =>
    {
        return vm.title || props.node.title;
    }, [vm.title, props.node.title]);

    return (
        <ModuleContent
            nodeTitle={props.node.title}
            title={title}
            isLoading={vm.isLoading}
            errorList={vm.errorList}
            paginatorProps={paginatorProps}
            viewCountConfig={{ mode: "list" }}
        >
            <TimelineBlocks_Comp lang={props.lang} blocks={blocks} />
        </ModuleContent>
    );
};

export default TimelineForm;

const TimelineBlocks_Comp = (props: { lang: Lang; blocks: ITimelineYearBlockVm[]; }) =>
{
    if (!props.blocks.length) return null;

    return (
        <>
            {props.blocks.map((block) =>
            {
                return (
                    <div key={block.key} className="SubInfoDivBox_Style + Layout_Padding_4">
                        <div className="row w-100">
                            <div className="col-xl-2 col-lg-2 col-md-12 col-sm-12 col-12">
                                <div className="heading">
                                    <div className="title_box_c">
                                        <div className="title_hl_tw font-wt-lg">{block.yearText}</div>
                                        <div className="year_hl font-wt-lg">年</div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-xl-10 col-lg-10 col-md-12 col-sm-12 col-12">
                                <div className="content">
                                    <div className="Info_All_Content">
                                        {block.rows.length > 1
                                            ? (
                                                <ul>
                                                    {block.rows.map((row) =>
                                                    {
                                                        return <TimelineRow_Comp key={row.key} lang={props.lang} row={row} />;
                                                    })}
                                                </ul>
                                            )
                                            : (
                                                <>
                                                    {block.rows.map((row) =>
                                                    {
                                                        return <TimelineRow_Comp key={row.key} lang={props.lang} row={row} />;
                                                    })}
                                                </>
                                            )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </>
    );
};

const TimelineRow_Comp = (props: { lang: Lang; row: ITimelineEntryVm; }) =>
{
    const hasTitle = props.row.title.length > 0;
    const hasContent = props.row.content.length > 0;
    return (
        <li className="li_row">
            <div className="col-12">
                {hasTitle && <div className="mb-2 fw-bold">{props.row.title}</div>}
                {hasContent && <CmsHtml_Comp html={props.row.content} lang={props.lang} />}
                {!hasTitle && !hasContent && null}
            </div>
        </li>
    );
};
