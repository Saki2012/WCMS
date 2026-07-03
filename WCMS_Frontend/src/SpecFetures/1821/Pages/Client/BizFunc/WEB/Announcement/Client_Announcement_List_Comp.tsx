import { formatCategoriesName } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { formatTagsName } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import type {
    AnnouncementListCompSpecSlot,
    AnnouncementListViewProps,
} from "@/Features/Pages/Client/BizFunc/WEB/Announcement/Client_Announcement_List_Comp";
import { useSpec1821AnnouncementArchiveListData } from "@/SpecFetures/1821/Pages/Client/BizFunc/WEB/Announcement/Client_Announcement_List_Loader";
import { ColRender, RowRender } from "@/SysCore/Components/Grid/Grid_Comp";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { NewPaginatorCanInputPage } from "@/SysCore/Components/Paginator/Paginator_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { components } from "@/types/api";
import { AnnouncementDetailFields, AnnouncementFields } from "@/types/SchemaFields";
import { useMemo, useState } from "react";

// #region Property
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
const SPEC1821_LATEST_TITLE_MAP: Record<string, string> = { "zh-tw": "最新消息", "zh-cn": "最新消息", en: "News" };
const SPEC1821_ARCHIVE_TITLE_MAP: Record<string, string> = { "zh-tw": "歷年消息", "zh-cn": "历年消息", en: "Archive News" };
interface Spec1821ArchiveGridBuildParam
{
    lang: Lang;
    dirUrl: string;
    gridProps: GridProps;
    rawData: AnnouncementSet[];
    categoryData: AnnouncementListViewProps["vm"]["categoryData"];
    tagData: AnnouncementListViewProps["vm"]["tagData"];
}
// #endregion

// #region Public
/** SPEC1821 公告清單 Comp 擴充：追加最新消息標題與歷年消息第二個 Grid。 */
export const extendAnnouncementListCompSpec: AnnouncementListCompSpecSlot = {
    BeforeListContent: (props: AnnouncementListViewProps) => <Spec1821LatestNewsTitle {...props} />,
    AfterListContent: (props: AnnouncementListViewProps) => <Spec1821ArchiveNewsSection {...props} />,
};
// #endregion

// #region Section
/** SPEC1821 最新消息標題區塊。 */
const Spec1821LatestNewsTitle = (props: AnnouncementListViewProps) =>
{
    if (props.options?.Style !== 1) return null;
    return <h2 className="h4 mb-3">{resolveSpec1821LatestTitle(props.lang)}</h2>;
};
/** SPEC1821 歷年消息區塊，使用第二組查詢與第二組分頁。 */
const Spec1821ArchiveNewsSection = (props: AnnouncementListViewProps) =>
{
    const archiveVm = useSpec1821AnnouncementArchiveListData({ lang: props.lang, opts: props.options, searchValues: props.vm.searchBar?.values });
    const archiveGrid = useMemo(() =>
        buildSpec1821ArchiveGrid({
            lang: props.lang,
            dirUrl: props.dirUrl,
            gridProps: archiveVm.gridPropsFromList,
            rawData: archiveVm.listData,
            categoryData: props.vm.categoryData,
            tagData: props.vm.tagData,
        }), [props.lang, props.dirUrl, archiveVm.gridPropsFromList, archiveVm.listData, props.vm.categoryData, props.vm.tagData]);
    if (props.options?.Style !== 1) return null;
    return (
        <section className="spec1821-archive-news-section">
            <h2 className="h4 mb-3">{resolveSpec1821ArchiveTitle(props.lang)}</h2>
            <Spec1821ArchiveGrid title={resolveSpec1821ArchiveTitle(props.lang)} gridData={archiveGrid} />
            {archiveVm.paginatorProps && <NewPaginatorCanInputPage {...archiveVm.paginatorProps} lang={props.lang} />}
        </section>
    );
};
/** SPEC1821 歷年消息 Grid，不顯示欄寬操作提醒。 */
const Spec1821ArchiveGrid = (props: { title: string; gridData: GridProps; }) =>
{
    const [columns, setColumns] = useState<ColumnConfig[]>(props.gridData.columns);
    const handleResize = (index: number, width: number): void =>
    {
        setColumns((prev) => prev.map((col, idx) => idx === index ? { ...col, width } : col));
    };
    return (
        <table className="table table-striped table-bordered table-hover table-rwd" summary={props.title}>
            <caption>{props.title}</caption>
            <ColRender columns={columns} onResize={handleResize} />
            <RowRender rows={props.gridData.rows} />
        </table>
    );
};
/** SPEC1821 分類與標籤 Cell 清單。 */
const Spec1821TermCellList = (props: { items: string[]; }) =>
{
    if (props.items.length === 0) return <span></span>;
    return (
        <ul className="mb-0 pl-3">
            {props.items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
        </ul>
    );
};
// #endregion

// #region Private
/** 取得最新消息標題文字。 */
const resolveSpec1821LatestTitle = (lang: Lang): string =>
{
    return SPEC1821_LATEST_TITLE_MAP[lang] ?? SPEC1821_LATEST_TITLE_MAP["zh-tw"];
};
/** 取得歷年消息標題文字。 */
const resolveSpec1821ArchiveTitle = (lang: Lang): string =>
{
    return SPEC1821_ARCHIVE_TITLE_MAP[lang] ?? SPEC1821_ARCHIVE_TITLE_MAP["zh-tw"];
};
/** 建立 SPEC1821 歷年消息 Grid，補上標題連結與分類標籤清單。 */
const buildSpec1821ArchiveGrid = (p: Spec1821ArchiveGridBuildParam): GridProps =>
{
    const columns = p.gridProps.columns;
    const rows = p.gridProps.rows.map((row, index) => buildSpec1821ArchiveGridRow({ ...p, row, rowData: p.rawData[index], rowIndex: index, columns }));
    return { ...p.gridProps, columns, rows };
};
/** 建立 SPEC1821 歷年消息單列資料。 */
const buildSpec1821ArchiveGridRow = (p: Spec1821ArchiveGridBuildParam & { row: GridRow; rowData?: AnnouncementSet; rowIndex: number; columns: ColumnConfig[]; }): GridRow =>
{
    const cells = p.row.cells.map(cell => buildSpec1821ArchiveGridCell({ ...p, cell }));
    return { ...p.row, cells };
};
/** 建立 SPEC1821 歷年消息 Cell。 */
const buildSpec1821ArchiveGridCell = (p: Spec1821ArchiveGridBuildParam & { cell: RowCell; rowData?: AnnouncementSet; rowIndex: number; columns: ColumnConfig[]; }): RowCell =>
{
    const internalId = p.rowData?.Announcement?.InternalId ?? "";
    const rowTitle = p.rowData?.AnnouncementDetail?.find(item => item.Lang === p.lang)?.Title?.trim() ?? "";
    const displayText = resolveSpec1821ArchiveCellText({ colKey: p.cell.col.key, rawContent: String(p.cell.content ?? ""), rowTitle, rowData: p.rowData, lang: p.lang, categoryData: p.categoryData, tagData: p.tagData });
    const content = buildSpec1821ArchiveCellContent({ colKey: p.cell.col.key, dirUrl: p.dirUrl, internalId, displayText });
    return { ...p.cell, content };
};
/** 解析 SPEC1821 歷年消息 Cell 文字。 */
const resolveSpec1821ArchiveCellText = (
    p: { colKey: string; rawContent: string; rowTitle: string; rowData?: AnnouncementSet; lang: Lang; categoryData: AnnouncementListViewProps["vm"]["categoryData"]; tagData: AnnouncementListViewProps["vm"]["tagData"]; },
): string =>
{
    if (p.colKey === AnnouncementDetailFields.Title) return p.rowTitle;
    if (p.colKey === AnnouncementFields.Categories) return formatCategoriesName(p.rowData?.Announcement?.Categories ?? "", p.categoryData, p.lang);
    if (p.colKey === AnnouncementFields.Tags) return formatTagsName(p.rowData?.Announcement?.Tags ?? "", p.tagData, p.lang);
    return p.rawContent;
};
/** 建立 SPEC1821 歷年消息 Cell JSX。 */
const buildSpec1821ArchiveCellContent = (p: { colKey: string; dirUrl: string; internalId: string; displayText: string; }): JSX.Element =>
{
    if (p.colKey === AnnouncementDetailFields.Title)
    {
        return (
            <LangLink to={`${p.dirUrl}/${p.internalId}`} className="link-cell">
                <span>{p.displayText}</span>
            </LangLink>
        );
    }
    if (p.colKey === AnnouncementFields.Categories || p.colKey === AnnouncementFields.Tags) return <Spec1821TermCellList items={splitSpec1821TermText(p.displayText)} />;
    return <span>{p.displayText}</span>;
};
/** 分割分類與標籤顯示文字。 */
const splitSpec1821TermText = (text: string): string[] =>
{
    return text.split("、").map(item => item.trim()).filter(Boolean);
};
// #endregion
