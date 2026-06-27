import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { ModuleContent } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LibDate, LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { useMemo } from "react";
import { type ITimelineOptions, useTimelineFormData } from "./Client_Timeline_Form_Loader";

// #region Property
export type TimelineSet = components["schemas"]["TimelineSet_DTO"];
type TimelineItem = components["schemas"]["TimelineItem_DTO"];
type TimelineLangDetail = components["schemas"]["TimelineLangDetail_DTO"];
export interface ITimelineFormProps
{
    site: INormSite;
    node: INormNode;
    lang: Lang;
    theme?: IFETheme;
    options?: ITimelineOptions;
}
export interface TimelineFormViewProps extends ITimelineFormProps
{
    /** 畫面標題 */
    title: string;

    /** Timeline 資料清單 */
    listData: TimelineSet[];

    /** 是否倒序顯示 */
    isDesc?: boolean;

    /** 是否載入中 */
    isLoading: boolean;

    /** 錯誤訊息 */
    errorList: string[];
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
// #endregion

// #region Public
/** Timeline 前台 Form，資料流程統一走 Client_DataQueryTemplate。 */
export const Client_Timeline_Form = (props: ITimelineFormProps) =>
{
    const vm = useTimelineFormData({ lang: props.lang, opts: props.options });
    const title = useMemo(() => vm.title || props.node.title, [vm.title, props.node.title]);

    return (
        <TimelineFormView
            {...props}
            title={title}
            listData={vm.listData}
            isDesc={props.options?.IsDesc}
            isLoading={vm.isLoading}
            errorList={vm.errorList}
        />
    );
};

/** Timeline 純渲染 View，正式前台與預覽共用。 */
export const TimelineFormView = (props: TimelineFormViewProps) =>
{
    const blocks = useMemo(() => buildTimelineBlocksFromList(props.listData, props.lang, props.isDesc), [
        props.listData,
        props.lang,
        props.isDesc,
    ]);

    return (
        <ModuleContent nodeTitle={props.node.title} title={props.title} isLoading={props.isLoading} errorList={props.errorList} viewCountConfig={{ mode: "list" }}>
            <TimelineBlocks_Comp lang={props.lang} blocks={blocks} />
        </ModuleContent>
    );
};
// #endregion

// #region Section
/** Timeline 年份區塊列表 */
const TimelineBlocks_Comp = (props: { lang: Lang; blocks: ITimelineYearBlockVm[]; }) =>
{
    if (!props.blocks.length) return null;
    return (
        <>
            {props.blocks.map((block) => <TimelineYearBlock_Comp key={block.key} lang={props.lang} block={block} />)}
        </>
    );
};
/** Timeline 單一年份區塊 */
const TimelineYearBlock_Comp = (props: { lang: Lang; block: ITimelineYearBlockVm; }) =>
{
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
// #endregion

// #region EntityComp
/** Timeline 單筆事件內容 */
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
// #endregion

// #region Protected
/** 依 listData 組出年份區塊 */
const buildTimelineBlocksFromList = (listData: TimelineSet[], lang: Lang, isDesc?: boolean): ITimelineYearBlockVm[] =>
{
    const yearMap = new Map<string, ITimelineYearBlockVm>();
    listData.forEach((setData) => appendTimelineSetBlocks({ yearMap, setData, lang, isDesc }));
    return Array.from(yearMap.values());
};
// #endregion

// #region Private
/** 解析年份文字 */
const resolveYearText = (date: TimelineItem["Date"]): string =>
{
    const raw = LibText.safeTrim(date);
    const parsed = LibDate.toDateOrNull(raw);
    if (parsed) return `${parsed.getFullYear()}`;
    return raw.slice(0, 4);
};
/** 依時間順序排序 */
const sortTimelineItems = (items: TimelineItem[], isDescOverride?: boolean): TimelineItem[] =>
{
    const isDesc = Boolean(isDescOverride);
    return [...items].sort((a, b) =>
    {
        const aTime = LibDate.toDateOrNull(a.Date)?.getTime() ?? 0;
        const bTime = LibDate.toDateOrNull(b.Date)?.getTime() ?? 0;
        if (aTime === bTime) return Number(a.RowId ?? 0) - Number(b.RowId ?? 0);
        return isDesc ? bTime - aTime : aTime - bTime;
    });
};
/** 依 TimelineItem 取出目前語系明細 */
const getDetailRowsByItem = (item: TimelineItem, details: TimelineLangDetail[], lang: Lang): TimelineLangDetail[] =>
{
    return (details ?? [])
        .filter(p => Number(p.ParentRowId ?? 0) === Number(item.RowId ?? 0) && isSameTimelineLang(p.Lang, lang))
        .sort((a, b) => Number(a.RowId ?? 0) - Number(b.RowId ?? 0));
};
/** 判斷 Timeline 明細語系是否相同 */
const isSameTimelineLang = (source: string | null | undefined, lang: Lang): boolean =>
{
    return LibText.safeTrim(source).toLowerCase() === LibText.safeTrim(lang).toLowerCase();
};
/** 依年份取得或建立年份區塊 */
const getOrCreateYearBlock = (yearMap: Map<string, ITimelineYearBlockVm>, yearText: string): ITimelineYearBlockVm =>
{
    const current = yearMap.get(yearText);
    if (current) return current;
    const block = { key: `year-${yearText}`, yearText, rows: [] };
    yearMap.set(yearText, block);
    return block;
};
/** 依明細補入 Timeline row */
const appendDetailRows = (p: { block: ITimelineYearBlockVm; item: TimelineItem; details: TimelineLangDetail[]; }): void =>
{
    p.details.forEach((detail) =>
    {
        p.block.rows.push({
            key: `${p.item.TimelineId ?? ""}-${p.item.RowId ?? 0}-${detail.RowId ?? 0}`,
            title: LibText.safeTrim(detail.Title),
            content: LibText.safeTrim(detail.Content),
        });
    });
};
/** 依單筆 Timeline set 補入年份區塊 */
const appendTimelineSetBlocks = (p: { yearMap: Map<string, ITimelineYearBlockVm>; setData: TimelineSet; lang: Lang; isDesc?: boolean; }): void =>
{
    const items = sortTimelineItems(p.setData.TimelineItem ?? [], p.isDesc);
    const details = p.setData.TimelineLangDetail ?? [];
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
// #endregion
