import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { createGridCrudActions, enhanceGridWithAdjustCell } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import { DefaultLang } from "@/SysCore/i18n/lang";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FormatDate, FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { SpecOpenScheduleRuleModelFields } from "@/types/SchemaFields";
import { useMemo, useState } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";
import { type ScheduleRuleListRawData, useScheduleRuleListFetchData } from "./Server_ScheduleRule_List_Hook";
type SpecOpenScheduleRuleSet = components["schemas"]["SpecOpenScheduleRuleSet_DTO"];

/** 學年度開放規則列表 */
export const Server_ScheduleRule_List_Comp = (prop: { title: string; theme: IBETheme; }) =>
{
    // 宣告變數
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = { title: "規則搜尋", subTitle: "搜尋學年度 ...", onSubmit: setKw, onReset: () => setKw("") };
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const navigate = useNavigate();
    // 執行 function：集中取資料（Adapter）
    const getData = useScheduleRuleListFetchData({ kw });
    const cudActions = getData.adapter.ScheduleRule.hooks.useCudActions();
    // 執行 function：GridProps（含 __adjust__ actions）
    const gridData = useMemo(() =>
    {
        return buildScheduleRuleGridProps({
            raw: getData.rawData,
            crud: { navigate, dirUrl, deleteAsync: cudActions.deleteAsync, afterDelete: getData.refetchData },
        });
    }, [getData.rawData, navigate, dirUrl, cudActions.deleteAsync, getData.refetchData]);
    // 宣告變數：保留原本 ListComp 的 Actions（讓「新建資料」按鈕仍存在）
    const actions = useMemo<UseActionsResult>(() =>
    {
        return createLegacyListActions({ navigate, dirUrl });
    }, [navigate, dirUrl]);
    return (
        <ListComp
            Title={prop.title}
            Theme={prop.theme}
            isLoading={getData.isLoading}
            ErrorList={getData.errors}
            Actions={actions}
            GridData={gridData}
            SearchBar={searchCompProp}
        />
    );
};

// #region GridProps
type CrudDeps = {
    navigate: NavigateFunction;
    dirUrl: string;
    deleteAsync: (internalId: string) => Promise<ApiResponse<SpecOpenScheduleRuleSet>>;
    afterDelete: () => Promise<void>;
};

/** ✅ ScheduleRule 專用：rawData → GridProps（含 ActionCell / Delete confirm） */
const buildScheduleRuleGridProps = (opt: { raw: ScheduleRuleListRawData; crud: CrudDeps; }): GridProps =>
{
    // 宣告變數
    const visibleCols = [
        SpecOpenScheduleRuleModelFields.AcademicYearId,
        SpecOpenScheduleRuleModelFields.AcademicStart,
        SpecOpenScheduleRuleModelFields.AcademicEnd,
        SpecOpenScheduleRuleModelFields.CreateTime,
        SpecOpenScheduleRuleModelFields.ModifyUserId,
        SpecOpenScheduleRuleModelFields.ModifyTime,
    ];

    // 執行 function：Grid 基礎資料
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildScheduleRuleRows(opt.raw, columns);

    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    // 執行 function：動作按鈕（Edit/Delete）
    const actions = createGridCrudActions<SpecOpenScheduleRuleSet>({
        onEdit: (internalId) => opt.crud.navigate(`${opt.crud.dirUrl}/${internalId}`),
        deleteAsync: opt.crud.deleteAsync,
        afterDelete: opt.crud.afterDelete,
    });

    // return：enhance 注入 __adjust__
    return enhanceGridWithAdjustCell(baseGrid, {
        lang: DefaultLang,
        rawList: opt.raw.list ?? [],
        actions,
        getInternalId: (set) => set.SpecOpenScheduleRule?.InternalId ?? "",
    });
};

const buildColumns = (visibleCols: string[], raw: ScheduleRuleListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) =>
    {
        const tables = raw.modelDisplayName?.Tables ?? [];
        const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === col);
        return { key: col, title: hit?.ColumnDisplayName ?? `【${col}】` };
    });
};

const buildScheduleRuleRows = (raw: ScheduleRuleListRawData, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) =>
    {
        const s = set.SpecOpenScheduleRule;
        const keyId = s?.InternalId ?? `${s?.AcademicYearId ?? ""}`;

        const cells: RowCell[] = columns.map((c) =>
        {
            return { col: c, content: getCellContent(c.key, set) };
        });

        return { keyId, cells };
    });
};

const getCellContent = (key: string, set: SpecOpenScheduleRuleSet): string =>
{
    const s = set.SpecOpenScheduleRule;

    switch (key)
    {
        case SpecOpenScheduleRuleModelFields.AcademicYearId:
            return s?.AcademicYearId ?? "";
        case SpecOpenScheduleRuleModelFields.AcademicStart:
            return FormatDate(s?.AcademicStart);
        case SpecOpenScheduleRuleModelFields.AcademicEnd:
            return FormatDate(s?.AcademicEnd);
        case SpecOpenScheduleRuleModelFields.CreateTime:
            return FormatDateTime(s?.CreateTime);
        case SpecOpenScheduleRuleModelFields.ModifyUserId:
            return s?.ModifyUser?.AccountName ?? "";
        case SpecOpenScheduleRuleModelFields.ModifyTime:
            return FormatDateTime(s?.ModifyTime);
        default:
            return "";
    }
};
// #endregion

// #region Legacy toolbar actions
const createLegacyListActions = (p: { navigate: NavigateFunction; dirUrl: string; }): UseActionsResult =>
{
    const noopAsync = async () =>
    {/* noop */};
    const noopVoid = () =>
    {/* noop */};

    return {
        isExecuting: false,
        onSave: async () => false,
        onDelete: noopAsync,
        onInvalid: noopVoid,
        onCancelBack: () => p.navigate(-1),
        onAddNew: () => p.navigate(p.dirUrl),
        onEdit: (internalId: string) => p.navigate(`${p.dirUrl}/${internalId}`),
        onPreview: noopVoid,
    };
};
// #endregion
