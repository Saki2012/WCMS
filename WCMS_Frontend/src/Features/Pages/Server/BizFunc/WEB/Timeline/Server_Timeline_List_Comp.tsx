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
import { TimelineFields } from "@/types/SchemaFields";
import { useMemo, useState } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";
import { type TimelineListRawData, useTimelineListFetchData } from "./Server_Timeline_List_Hook";
type TimelineSet = components["schemas"]["TimelineSet_DTO"];

/** 公告列表 */
export const Server_Timeline_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = { title: "紀事表搜尋", subTitle: "搜尋紀事表 ...", onSubmit: setKw, onReset: () => setKw("") };
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const getData = useTimelineListFetchData({ lang: prop.lang, kw: kw });
    const navigate = useNavigate();
    const cudActions = getData.adapter.Timeline.hooks.useCudActions();
    const gridData = useMemo(() =>
    {
        return buildTimelineGridProps({
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
    deleteAsync: (internalId: string) => Promise<ApiResponse<TimelineSet>>;
    afterDelete: () => Promise<void>;
};
/** ✅ Timeline 專用：rawData → GridProps（含 ActionCell / Delete confirm） */
const buildTimelineGridProps = (
    opt: {
        raw: TimelineListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [TimelineFields.TimelineName, "事件", TimelineFields.ModifyUserId, TimelineFields.ModifyTime];
    // 執行 function：Grid 基礎資料
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildTimelineRows(opt.raw, opt.lang, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };
    // 執行 function：動作按鈕（Edit/Delete）
    const actions = createGridCrudActions<TimelineSet>({
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
        getInternalId: (set) => set.Timeline?.InternalId ?? "",
    });
};
/** 欄位定義（順序＝顯示順序） */
const buildColumns = (visibleCols: string[], raw: TimelineListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) =>
    {
        const tables = raw.modelDisplayName?.Tables ?? [];
        const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === col);
        return { key: col, title: hit?.ColumnDisplayName ?? `【${col}】` };
    });
};
/** 列資料（cells 順序必須跟 columns 對齊） */
const buildTimelineRows = (raw: TimelineListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) =>
    {
        const keyId = LibMerge("|", false, set.Timeline?.InternalId);
        const detail = (
            <ul className="m-0 p-0" style={{ listStylePosition: "inside" }}>
                {(() =>
                {
                    const items = set.TimelineItem?.flatMap((item) =>
                        item._TimelineLangDetail?.filter((p) => p.Lang === lang).map((dt) => (
                            <li key={`${dt.ParentRowId}-${dt.RowId}-${dt.Lang}`} className="m-0 p-0">【{FormatDate(item.Date)}】{dt.Title}</li>
                        )) ?? []
                    ) ?? [];
                    const showItems = items.slice(0, 5);
                    const hasMore = items.length > 5;
                    return <>{showItems} {hasMore && <li className="m-0 p-0">...</li>}</>;
                })()}
            </ul>
        );
        const cells: RowCell[] = [{ col: columns[0], content: set.Timeline?.TimelineName }, { col: columns[1], content: detail }, {
            col: columns[2],
            content: set.Timeline?.ModifyUser?.AccountName ?? "",
        }, { col: columns[3], content: FormatDateTime(set.Timeline?.ModifyTime) }];
        return { keyId, cells };
    });
};

// #endregion
