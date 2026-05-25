import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { useMemo } from "react";
import { type ITimelineOptions, useTimelineFormData } from "./Client_Timeline_Form_Loader";

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
    // 宣告變數
    const raw = `${date ?? ""}`.trim();
    if (!raw) return "";

    // 執行 function
    const parsed = new Date(raw);

    // return
    if (!Number.isNaN(parsed.getTime())) return `${parsed.getFullYear()}`;
    return raw.slice(0, 4);
};

/** 依時間順序排序 */
const sortTimelineItems = (items: TimelineItem[], isDescOverride?: boolean): TimelineItem[] =>
{
    // 宣告變數
    const isDesc = Boolean(isDescOverride);

    // return
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
    // return
    return (details ?? [])
        .filter(p => Number(p.ParentRowId ?? 0) === Number(item.RowId ?? 0) && `${p.Lang ?? ""}` === `${lang}`)
        .sort((a, b) => Number(a.RowId ?? 0) - Number(b.RowId ?? 0));
};

/** 依年份取得或建立年份區塊 */
const getOrCreateYearBlock = (yearMap: Map<string, ITimelineYearBlockVm>, yearText: string): ITimelineYearBlockVm =>
{
    // 執行 function
    if (!yearMap.has(yearText))
    {
        yearMap.set(yearText, { key: `year-${yearText}`, yearText, rows: [] });
    }

    // return
    return yearMap.get(yearText) as ITimelineYearBlockVm;
};

/** 依明細補入 Timeline row */
const appendDetailRows = (p: { block: ITimelineYearBlockVm; item: TimelineItem; details: TimelineLangDetail[]; }): void =>
{
    // 執行 function
    p.details.forEach((detail) =>
    {
        p.block.rows.push({
            key: `${p.item.TimelineId ?? ""}-${p.item.RowId ?? 0}-${detail.RowId ?? 0}`,
            title: `${detail.Title ?? ""}`.trim(),
            content: `${detail.Content ?? ""}`.trim(),
        });
    });
};

/** 依單筆 Timeline set 補入年份區塊 */
const appendTimelineSetBlocks = (p: { yearMap: Map<string, ITimelineYearBlockVm>; setData: TimelineSet; lang: Lang; isDesc?: boolean; }): void =>
{
    // 宣告變數
    const items = sortTimelineItems(p.setData.TimelineItem ?? [], p.isDesc);
    const details = p.setData.TimelineLangDetail ?? [];

    // 執行 function
    items.forEach((item) =>
    {
        const yearText = resolveYearText(item.Date);
        if (!yearText) return;

        const matched = getDetailRowsByItem(item, details, p.lang);
        if (matched.length === 0) return;

        const block = getOrCreateYearBlock(p.yearMap, yearText);
        appendDetailRows({ block, item, details: matched });
    });
};

/** 依 listData 組出年份區塊 */
const buildTimelineBlocksFromList = (listData: TimelineSet[], lang: Lang, isDesc?: boolean): ITimelineYearBlockVm[] =>
{
    // 宣告變數
    const yearMap = new Map<string, ITimelineYearBlockVm>();

    // 執行 function
    listData.forEach((setData) => appendTimelineSetBlocks({ yearMap, setData, lang, isDesc }));

    // return
    return Array.from(yearMap.values());
};

/** Timeline 前台 Form，資料流程統一走 Client_DataQueryTemplate */
const TimelineForm = (props: ITimelineFormProps) =>
{
    // 宣告變數
    const vm = useTimelineFormData({ lang: props.lang, opts: props.options });

    const blocks = useMemo(() =>
    {
        return buildTimelineBlocksFromList(vm.listData, props.lang, props.options?.IsDesc);
    }, [vm.listData, props.lang, props.options?.IsDesc]);

    const title = useMemo(() =>
    {
        return vm.title || props.node.title;
    }, [vm.title, props.node.title]);

    // return
    return (
        <ModuleContent nodeTitle={props.node.title} title={title} isLoading={vm.isLoading} errorList={vm.errorList} viewCountConfig={{ mode: "list" }}>
            <TimelineBlocks_Comp lang={props.lang} blocks={blocks} />
        </ModuleContent>
    );
};

export default TimelineForm;

/** Timeline 年份區塊列表 */
const TimelineBlocks_Comp = (props: { lang: Lang; blocks: ITimelineYearBlockVm[]; }) =>
{
    // 執行 function
    if (!props.blocks.length) return null;

    // return
    return (
        <>
            {props.blocks.map((block) => <TimelineYearBlock_Comp key={block.key} lang={props.lang} block={block} />)}
        </>
    );
};

/** Timeline 單一年份區塊 */
const TimelineYearBlock_Comp = (props: { lang: Lang; block: ITimelineYearBlockVm; }) =>
{
    // return
    return (
        <div className="SubInfoDivBox_Style first_Padding_4_top Layout_Padding_4_bottom">
            <div className="row w-100">
                <TimelineYearTitle_Comp yearText={props.block.yearText} />
                <TimelineYearContent_Comp lang={props.lang} rows={props.block.rows} />
            </div>
        </div>
    );
};

/** Timeline 左側年份標題 */
const TimelineYearTitle_Comp = (props: { yearText: string; }) =>
{
    // return
    return (
        <div className="col-xl-2 col-lg-2 col-md-12 col-sm-12 col-12">
            <div className="heading">
                <div className="title_box_c">
                    <div className="title_hl_tw font-wt-lg">{props.yearText}</div>
                    <div className="year_hl font-wt-lg">年</div>
                </div>
            </div>
        </div>
    );
};

/** Timeline 右側事件內容 */
const TimelineYearContent_Comp = (props: { lang: Lang; rows: ITimelineEntryVm[]; }) =>
{
    // return
    return (
        <div className="col-xl-10 col-lg-10 col-md-12 col-sm-12 col-12">
            <div className="content">
                <div className="Info_All_Content">
                    <ul>
                        {props.rows.map((row) => <TimelineRow_Comp key={row.key} lang={props.lang} row={row} />)}
                    </ul>
                </div>
            </div>
        </div>
    );
};

/** Timeline 單筆事件內容 */
const TimelineRow_Comp = (props: { lang: Lang; row: ITimelineEntryVm; }) =>
{
    // 宣告變數
    const hasTitle = props.row.title.length > 0;
    const hasContent = props.row.content.length > 0;

    // return
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
