import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import {  useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate, type NavigateFunction } from "react-router-dom";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { components } from "@/types/api";
import type { Lang } from "@/SysCore/i18n/lang";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { type ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { usePageManagementListFetchData, type PageManagementListRawData } from "./Server_PageManagement_List_Hook";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "../../../Scaffold/Content/GridAdjustCellEnhance";
import { PageManagementDetailFields, PageManagementFields } from "@/types/SchemaFields";
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];

/** 頁面清單 */
export const PageListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = {title: "頁面搜尋",subTitle: "搜尋頁面 ...",settingTitle: "搜尋設定",onSubmit: setKw,onReset: () => setKw(""),};
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const navigate = useNavigate();
    const getData = usePageManagementListFetchData({ lang: prop.lang, kw: kw });
    const cudActions = getData.adapter.PageManagement.hooks.useCudActions();
    const gridData = useMemo(() => { return buildGalleryGridProps({raw: getData.rawData,lang: prop.lang, crud: {navigate,dirUrl,deleteAsync: cudActions.deleteAsync,afterDelete: getData.refetchData,},});
    }, [getData.rawData, prop.lang, navigate, dirUrl, cudActions.deleteAsync, getData.refetchData]);
    return <ListComp Title={prop.title} Theme={prop.theme} isLoading={getData.isLoading} ErrorList={getData.errors} GridData={gridData} SearchBar={searchCompProp}></ListComp>
};

//#region GridProps
type CrudDeps = {navigate: NavigateFunction;dirUrl: string;deleteAsync: (internalId: string) => Promise<ApiResponse<PageManagementSet>>;afterDelete: () => Promise<void>;};
const buildGalleryGridProps = (opt: {raw: PageManagementListRawData; lang: Lang;
    crud: CrudDeps; can?: (mask: number) => boolean; notifyNoPermission?: (msg: string) => void;confirm?: GridConfirmFn;}): GridProps => {
    const visibleCols = [PageManagementFields.CategoryId,PageManagementDetailFields.Title,PageManagementFields.ModifyUserId,PageManagementFields.ModifyTime,];
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildGalleryRows(opt.raw, opt.lang, columns);
    const baseGrid: GridProps = {columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange,};
    const actions = createGridCrudActions<PageManagementSet>({onEdit: (internalId) => opt.crud.navigate(`${opt.crud.dirUrl}/${internalId}`),deleteAsync: opt.crud.deleteAsync,afterDelete: opt.crud.afterDelete,});
    return enhanceGridWithAdjustCell(baseGrid, {lang: opt.lang,rawList: opt.raw.list ?? [],actions,
        can: opt.can,notifyNoPermission: opt.notifyNoPermission,confirm: opt.confirm,
        getInternalId: (set) => set.PageManagement?.InternalId ?? "",
    });
};
/** 欄位定義（順序＝顯示順序） */
const buildColumns = (visibleCols: string[], raw: PageManagementListRawData): ColumnConfig[] => {
    return visibleCols.map((col) => { 
      const tables = raw.modelDisplayName?.Tables ?? [];
      const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === col);
      return { key: col, title: hit?.ColumnDisplayName ?? `【${col}】` };
     });
};
/** 列資料（cells 順序必須跟 columns 對齊） */
const buildGalleryRows = (raw: PageManagementListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] => {
    return (raw.list ?? []).map((set) => {
        const keyId = LibMerge("|", false, set.PageManagement?.PageId);
        const a = set.PageManagement;
        const title = (set.PageManagementDetail ?? []).find(d => d?.Lang === lang)?.Title ?? "";
        const cells: RowCell[] = [
            { col: columns[0], content: mapIdsToText(a?.CategoryId, raw.categoryMap) },
            { col: columns[1], content: title },
            { col: columns[2], content: a?.ModifyUser?.AccountName ?? "" },
            { col: columns[3], content: FormatDateTime(a?.ModifyTime) },
        ];
        return { keyId, cells };
    });
};
const mapIdsToText = (ids: string | null | undefined, map: Record<string, string>): ReactNode => {
    const raw = ids ?? "";
    const parts = raw.split(",").map((x) => x.trim()).filter(Boolean);
    const names = parts.map((id) => map[id] ?? id);
    return (
        <ul className="m-0 p-0" style={{ listStylePosition: "inside" }}>
            {names.map((line, i) => (
                <li key={`${line}-${i}`} className="m-0 p-0">
                    {line}
                </li>
            ))}
        </ul>
    );
};
//#endregion
