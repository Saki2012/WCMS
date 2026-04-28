import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FormatDate, FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { AnnouncementDetailFields, AnnouncementFields } from "@/types/SchemaFields";
import { type ReactNode, useMemo, useState } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";
import { GetDataStatusContent } from "../../../Scaffold/CommUnitComp/CommonComp";
import { type AnnouncementListRawData, useAnnouncementListFetchData } from "./Server_Announcement_List_Hook";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

/** 公告列表 */
export const Server_AnnouncementListComp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = { title: "公告搜尋", subTitle: "搜尋公告 ...", onSubmit: setKw, onReset: () => setKw("") };
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const getData = useAnnouncementListFetchData({ lang: prop.lang, kw: kw });
    const navigate = useNavigate();
    const cudActions = getData.adapter.Announcement.hooks.useCudActions();
    const gridData = useMemo(() =>
    {
        return buildAnnouncementGridProps({
            raw: getData.rawData,
            lang: prop.lang,
            crud: { navigate, dirUrl, deleteAsync: cudActions.deleteAsync, afterDelete: getData.refetchData },
        });
    }, [getData.rawData, prop.lang, navigate, dirUrl, cudActions.deleteAsync, getData.refetchData]);
    return (
        <ListComp
            Title={prop.title}
            Theme={prop.theme}
            isLoading={getData.isLoading}
            ErrorList={getData.errors}
            GridData={gridData}
            SearchBar={searchCompProp}
        />
    );
};
// #region GridProps
type CrudDeps = {
    navigate: NavigateFunction;
    dirUrl: string;
    deleteAsync: (internalId: string) => Promise<ApiResponse<AnnouncementSet>>;
    afterDelete: () => Promise<void>;
};
/** ✅ Announcement 專用：rawData → GridProps（含 ActionCell / Delete confirm） */
const buildAnnouncementGridProps = (
    opt: {
        raw: AnnouncementListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [
        AnnouncementFields.Categories,
        AnnouncementDetailFields.Title,
        AnnouncementFields.Validate_Start,
        AnnouncementFields.Validate_End,
        AnnouncementFields.ModifyUserId,
        AnnouncementFields.ModifyTime,
    ];
    // 執行 function：Grid 基礎資料
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildAnnouncementRows(opt.raw, opt.lang, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };
    // 執行 function：動作按鈕（Edit/Delete）
    const actions = createGridCrudActions<AnnouncementSet>({
        onEdit: (internalId) => opt.crud.navigate(`${opt.crud.dirUrl}/${internalId}`),
        deleteAsync: opt.crud.deleteAsync,
        afterDelete: opt.crud.afterDelete,
    });
    // return：enhance 注入 __adjust__
    return enhanceGridWithAdjustCell(baseGrid, {
        lang: opt.lang,
        rawList: opt.raw.list ?? [],
        actions,
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
        getInternalId: (set) => set.Announcement?.InternalId ?? "",
    });
};
/** 欄位定義（順序＝顯示順序） */
const buildColumns = (visibleCols: string[], raw: AnnouncementListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) =>
    {
        const tables = raw.modelDisplayName?.Tables ?? [];
        const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === col);
        return { key: col, title: hit?.ColumnDisplayName ?? `【${col}】` };
    });
};
/** 列資料（cells 順序必須跟 columns 對齊） */
const buildAnnouncementRows = (raw: AnnouncementListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) =>
    {
        const keyId = LibMerge("|", false, set.Announcement?.AnnouncementId);
        const a = set.Announcement;
        const detail = (
            <>
                <span>{(set.AnnouncementDetail ?? []).find(d => d?.Lang === lang)?.Title ?? ""}</span>
                <span>{GetDataStatusContent(set.Announcement?.ContentStatus ?? 0)}</span>
            </>
        );
        const cells: RowCell[] = [
            { col: columns[0], content: mapIdsToText(a?.Categories, raw.categoryMap) },
            { col: columns[1], content: detail },
            { col: columns[2], content: FormatDate(a?.Validate_Start) },
            { col: columns[3], content: FormatDate(a?.Validate_End) },
            { col: columns[4], content: a?.ModifyUser?.AccountName ?? "" },
            { col: columns[5], content: FormatDateTime(a?.ModifyTime) },
        ];
        return { keyId, cells };
    });
};
/** 把 "a,b,c" 這種 id 字串，用 map 轉成顯示文字（li 版本、不跑版） */
const mapIdsToText = (ids: string | null | undefined, map: Record<string, string>): ReactNode =>
{
    const raw = ids ?? "";
    const parts = raw.split(",").map((x) => x.trim()).filter(Boolean);
    const names = parts.map((id) => map[id] ?? id);
    return (
        <ul className="m-0 p-0" style={{ listStylePosition: "inside" }}>{names.map((line, i) => <li key={`${line}-${i}`} className="m-0 p-0">{line}</li>)}</ul>
    );
};
// #endregion
