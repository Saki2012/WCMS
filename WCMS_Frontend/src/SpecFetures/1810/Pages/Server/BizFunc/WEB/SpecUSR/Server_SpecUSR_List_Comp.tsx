import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { SpecUSRDetailFields, SpecUSRModelFields } from "@/types/SchemaFields";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";
import { type SpecUSRListRawData, useSpecUSRListFetchData } from "./Server_SpecUSR_List_Hook";

type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"];

/** USR計畫清單 */
export const Server_SpecUSR_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    // 宣告變數
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = { title: "計畫成果搜尋", subTitle: "搜尋計畫成果 ...", onSubmit: setKw, onReset: () => setKw("") };
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const navigate = useNavigate();
    const getData = useSpecUSRListFetchData({ lang: prop.lang, kw: kw });
    const cudActions = getData.adapter.SpecUSR.hooks.useCudActions();
    const gridData = useMemo(() =>
    {
        return buildSpecUSRGridProps({
            raw: getData.rawData,
            lang: prop.lang,
            crud: { navigate, dirUrl, deleteAsync: cudActions.deleteAsync, afterDelete: getData.refetchData },
        });
    }, [getData.rawData, prop.lang, navigate, dirUrl, cudActions.deleteAsync, getData.refetchData]);
    // ✅ 保留 List「新建資料」按鈕（不依賴 provider）
    const listActions = useSpecUSRListToolbarActions(dirUrl);
    // return
    return (
        <ListComp
            Title={prop.title}
            Theme={prop.theme}
            isLoading={getData.isLoading}
            ErrorList={getData.errors}
            Actions={listActions}
            GridData={gridData}
            SearchBar={searchCompProp}
        />
    );
};

// #region List Toolbar Actions（只為了保留「新建資料」DOM）
const useSpecUSRListToolbarActions = (dirUrl: string): UseActionsResult =>
{
    // 宣告變數
    const navigate = useNavigate();
    const onAddNew = useCallback(() =>
    {
        // 執行 function：前往新增
        navigate(dirUrl);
    }, [navigate, dirUrl]);
    const onEdit = useCallback((internalId: string) =>
    {
        // 執行 function：前往編輯
        navigate(`${dirUrl}/${internalId}`);
    }, [navigate, dirUrl]);
    const onCancelBack = useCallback(() =>
    {
        // 執行 function：回清單
        navigate(dirUrl.replace(/\/Form$/, "/List"));
    }, [navigate, dirUrl]);
    // return（維持 UseActionsResult 形狀；List toolbar 只會用到 onAddNew）
    return useMemo(() => ({
        isExecuting: false,
        onSave: async () => false,
        onDelete: async () =>
        {/* list toolbar 不用 */},
        onInvalid: () =>
        {/* list toolbar 不用 */},
        onCancelBack,
        onAddNew,
        onEdit,
        onPreview: () =>
        {/* list toolbar 不用 */},
    }), [onCancelBack, onAddNew, onEdit]);
};
// #endregion

// #region GridProps
type CrudDeps = {
    navigate: NavigateFunction;
    dirUrl: string;
    deleteAsync: (internalId: string) => Promise<ApiResponse<SpecUSRSet>>;
    afterDelete: () => Promise<void>;
};

/** ✅ SpecUSR 專用：rawData → GridProps（含 ActionCell / Delete confirm） */
const buildSpecUSRGridProps = (
    opt: {
        raw: SpecUSRListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    // 宣告變數：顯示欄位順序（對標舊版 visibleKeys）
    const visibleCols = [
        SpecUSRModelFields.CategoryId,
        SpecUSRModelFields.Tags,
        SpecUSRDetailFields.Year,
        SpecUSRDetailFields.AcademicYear,
        SpecUSRDetailFields.ProjectName,
        SpecUSRDetailFields.ProjectConcept,
        SpecUSRModelFields.CreateTime,
        SpecUSRModelFields.ModifyUserId,
        SpecUSRModelFields.ModifyTime,
    ];
    // 執行 function：Grid 基礎資料
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildSpecUSRRows(opt.raw, opt.lang, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };
    // 執行 function：動作按鈕（Edit/Delete）
    const actions = createGridCrudActions<SpecUSRSet>({
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
        getInternalId: (set) => set.SpecUSR?.InternalId ?? "",
    });
};

/** 欄位定義（順序＝顯示順序） */
const buildColumns = (visibleCols: string[], raw: SpecUSRListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) =>
    {
        const tables = raw.modelDisplayName?.Tables ?? [];
        const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === col);
        return { key: col, title: hit?.ColumnDisplayName ?? `【${col}】` };
    });
};

/** 列資料（cells 順序必須跟 columns 對齊） */
const buildSpecUSRRows = (raw: SpecUSRListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) =>
    {
        const keyId = LibMerge("|", false, set.SpecUSR?.USRId);
        const a = set.SpecUSR;
        const d = (set.SpecUSRDetail ?? []).find((x) => x?.Lang === lang);

        const cells: RowCell[] = [
            { col: columns[0], content: mapIdToText(a?.CategoryId, raw.categoryMap) },
            { col: columns[1], content: mapIdsToText(a?.Tags, raw.tagMap) },
            { col: columns[2], content: d?.Year ?? "" },
            { col: columns[3], content: d?.AcademicYear?.toString() ?? "" },
            { col: columns[4], content: d?.ProjectName ?? "" },
            { col: columns[5], content: d?.ProjectConcept ?? "" },
            { col: columns[6], content: FormatDateTime(a?.CreateTime) },
            { col: columns[7], content: a?.ModifyUser?.AccountName ?? "" },
            { col: columns[8], content: FormatDateTime(a?.ModifyTime) },
        ];

        return { keyId, cells };
    });
};

const mapIdToText = (id: string | number | null | undefined, map: Record<string, string>): string =>
{
    const key = id == null ? "" : String(id);
    return key ? (map[key] ?? key) : "";
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
