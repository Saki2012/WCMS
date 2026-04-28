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

import { CategoryDetailFields, CategoryFields } from "@/types/SchemaFields";
import { type ReactNode, useMemo, useState } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";
import { type MatCategoryListRawData, useMatCategoryListFetchData } from "./Server_MatCategory_List_Hook";

type MatCategorySet = components["schemas"]["MatCategoryDataSet_DTO"];

/** 物件類別列表 */
export const Server_MatCategory_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    // 宣告變數
    const [kw, setKw] = useState<string>("");
    const pathname = useLocation().pathname;
    const navigate = useNavigate();
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, "/Form"), [pathname]);
    const getData = useMatCategoryListFetchData({ lang: prop.lang, kw });
    const cudActions = getData.adapter.MatCategory.hooks.useCudActions();

    const searchCompProp: SearchBarProps = { title: "物件類別搜尋", subTitle: "輸入關鍵字搜尋物件類別", onSubmit: setKw, onReset: () => setKw("") };

    const gridData = useMemo(() =>
    {
        return buildMatCategoryGridProps({
            raw: getData.rawData,
            lang: prop.lang,
            crud: { navigate, dirUrl, deleteAsync: cudActions.deleteAsync, afterDelete: getData.refetchData },
        });
    }, [getData.rawData, prop.lang, navigate, dirUrl, cudActions.deleteAsync, getData.refetchData]);

    // return
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
    deleteAsync: (internalId: string) => Promise<ApiResponse<MatCategorySet>>;
    afterDelete: () => Promise<void>;
};

/** 建立 MatCategory Grid 資料 */
const buildMatCategoryGridProps = (
    opt: {
        raw: MatCategoryListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    // 宣告變數
    const visibleCols = [CategoryDetailFields.CategoryName, "自定義欄位資訊", CategoryFields.ModifyUserId, CategoryFields.ModifyTime];
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildMatCategoryRows(opt.raw, opt.lang, columns);

    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    const actions = createGridCrudActions<MatCategorySet>({
        onEdit: (internalId) => opt.crud.navigate(`${opt.crud.dirUrl}/${internalId}`),
        deleteAsync: opt.crud.deleteAsync,
        afterDelete: opt.crud.afterDelete,
    });

    // return
    return enhanceGridWithAdjustCell(baseGrid, {
        lang: opt.lang,
        rawList: opt.raw.list ?? [],
        actions,
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
        getInternalId: (set) => set.Category?.InternalId ?? "",
    });
};

/** 取得 model display tables */
const getModelTables = (raw: MatCategoryListRawData): Array<{ Columns?: Array<{ ColumnId?: string | null; ColumnDisplayName?: string | null; }>; }> =>
{
    // 宣告變數
    const model = raw.modelDisplayName as unknown;

    // 執行 function
    if (!model) return [];
    if (Array.isArray(model)) return model.flatMap((x) => x?.Tables ?? []);
    if (typeof model === "object" && "Tables" in (model as object))
    {
        return ((model as { Tables?: Array<{ Columns?: Array<{ ColumnId?: string | null; ColumnDisplayName?: string | null; }>; }>; }).Tables ?? []);
    }

    // return
    return [];
};

/** 建立欄位定義 */
const buildColumns = (visibleCols: string[], raw: MatCategoryListRawData): ColumnConfig[] =>
{
    // 宣告變數
    const tables = getModelTables(raw);

    // return
    return visibleCols.map((col) =>
    {
        const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === col);
        return { key: col, title: hit?.ColumnDisplayName ?? `【${col}】` };
    });
};

/** 建立標題欄內容 */
const buildDetailContent = (set: MatCategorySet, lang: Lang): ReactNode =>
{
    const infoDt = (set.MatCategoryInfoFieldDisplay ?? []).filter((d) => d?.Lang === lang);
    return (
        <div className="d-flex flex-column gap-1">
            <ul>
                {infoDt.map((dt) =>
                {
                    return <li>{dt.FieldDisplayName}</li>;
                })}
            </ul>
        </div>
    );
};

/** 建立單列資料 */
const buildMatCategoryRow = (set: MatCategorySet, raw: MatCategoryListRawData, lang: Lang, columns: ColumnConfig[]): GridRow =>
{
    // 宣告變數
    const a = set.Category;
    const keyId = LibMerge("|", false, a?.InternalId, a?.CategoryId);

    const catName = (set.CategoryDetail ?? []).find((d) => d?.Lang === lang)?.CategoryName ?? "";

    const cells: RowCell[] = [{ col: columns[0], content: catName }, { col: columns[1], content: buildDetailContent(set, lang) }, {
        col: columns[2],
        content: a?.ModifyUser?.AccountName ?? "",
    }, { col: columns[3], content: FormatDateTime(a?.ModifyTime) }];

    // return
    return { keyId, cells };
};

/** 建立列資料 */
const buildMatCategoryRows = (raw: MatCategoryListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    // return
    return (raw.list ?? []).map((set) => buildMatCategoryRow(set, raw, lang, columns));
};

// #endregion
