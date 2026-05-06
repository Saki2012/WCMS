import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { type ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { SurveyFields } from "@/types/SchemaFields";
import { useMemo, useState } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "../../../Scaffold/Content/GridAdjustCellEnhance";
import { type SurveyListRawData, useSurveyListFetchData } from "./Server_Survey_List_Hook";
type SurveySet = components["schemas"]["SurveySet_DTO"];

/** 頁面清單 */
export const Server_Survey_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = { title: "問卷搜尋", subTitle: "問卷頁面 ...", onSubmit: setKw, onReset: () => setKw("") };
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const navigate = useNavigate();
    const getData = useSurveyListFetchData({ lang: prop.lang, kw: kw });
    const cudActions = getData.adapter.Survey.hooks.useCudActions();
    const gridData = useMemo(() =>
    {
        return buildGalleryGridProps({
            raw: getData.rawData,
            lang: prop.lang,
            crud: { navigate, dirUrl, deleteAsync: cudActions.deleteAsync, afterDelete: getData.refetchData },
        });
    }, [getData.rawData, prop.lang, navigate, dirUrl, cudActions.deleteAsync, getData.refetchData]);
    return (
        <ListComp Title={prop.title} Theme={prop.theme} isLoading={getData.isLoading} ErrorList={getData.errors} GridData={gridData} SearchBar={searchCompProp}>
        </ListComp>
    );
};

// #region GridProps
type CrudDeps = {
    navigate: NavigateFunction;
    dirUrl: string;
    deleteAsync: (internalId: string) => Promise<ApiResponse<SurveySet>>;
    afterDelete: () => Promise<void>;
};
const buildGalleryGridProps = (
    opt: {
        raw: SurveyListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [SurveyFields.SurveyName, SurveyFields.ModifyUserId, SurveyFields.ModifyTime];
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildGalleryRows(opt.raw, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };
    const actions = createGridCrudActions<SurveySet>({
        onEdit: (internalId) => opt.crud.navigate(`${opt.crud.dirUrl}/${internalId}`),
        deleteAsync: opt.crud.deleteAsync,
        afterDelete: opt.crud.afterDelete,
    });
    return enhanceGridWithAdjustCell(baseGrid, {
        lang: opt.lang,
        rawList: opt.raw.list ?? [],
        actions,
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
        getInternalId: (set) => set.Survey?.InternalId ?? "",
    });
};
/** 欄位定義（順序＝顯示順序） */
const buildColumns = (visibleCols: string[], raw: SurveyListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) =>
    {
        const tables = raw.modelDisplayName?.Tables ?? [];
        const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === col);
        return { key: col, title: hit?.ColumnDisplayName ?? `【${col}】` };
    });
};
/** 列資料（cells 順序必須跟 columns 對齊） */
const buildGalleryRows = (raw: SurveyListRawData, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) =>
    {
        const keyId = LibMerge("|", false, set.Survey?.SurveyId);
        const a = set.Survey;
        const title = set.Survey?.SurveyName;
        const cells: RowCell[] = [{ col: columns[0], content: title }, { col: columns[1], content: a?.ModifyUser?.AccountName ?? "" }, {
            col: columns[2],
            content: FormatDateTime(a?.ModifyTime),
        }];
        return { keyId, cells };
    });
};
// #endregion
