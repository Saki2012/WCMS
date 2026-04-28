import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { type ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { FileArchiveFields, FileArchiveInfoFields } from "@/types/SchemaFields";
import { type ReactNode, useMemo, useState } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";
import { GetDataStatusContent } from "../../../Scaffold/CommUnitComp/CommonComp";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "../../../Scaffold/Content/GridAdjustCellEnhance";
import { type FileArchiveListRawData, useFileArchiveListFetchData } from "./Server_FileArchive_List_Hook";
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];

export const Server_FileArchiveListComp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = {
        title: "檔案室搜尋",
        subTitle: "搜尋檔案室 ...",
        settingTitle: "搜尋設定",
        onSubmit: setKw,
        onReset: () => setKw(""),
    };
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const navigate = useNavigate();
    const getData = useFileArchiveListFetchData({ lang: prop.lang, kw: kw });
    const cudActions = getData.adapter.FileArchive.hooks.useCudActions();
    const gridData = useMemo(() =>
    {
        return buildFileArchiveGridProps({
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
    deleteAsync: (internalId: string) => Promise<ApiResponse<FileArchiveSet>>;
    afterDelete: () => Promise<void>;
};
/** ✅ Announcement 專用：rawData → GridProps（含 ActionCell / Delete confirm） */
const buildFileArchiveGridProps = (
    opt: {
        raw: FileArchiveListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [FileArchiveFields.CategoriesId, FileArchiveInfoFields.Title, FileArchiveFields.ModifyUserId, FileArchiveFields.ModifyTime];
    // 執行 function：Grid 基礎資料
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildAnnouncementRows(opt.raw, opt.lang, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };
    // 執行 function：動作按鈕（Edit/Delete）
    const actions = createGridCrudActions<FileArchiveSet>({
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
        getInternalId: (set) => set.FileArchive?.InternalId ?? "",
    });
};
/** 欄位定義（順序＝顯示順序） */
const buildColumns = (visibleCols: string[], raw: FileArchiveListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) =>
    {
        const tables = raw.modelDisplayName?.Tables ?? [];
        const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === col);
        return { key: col, title: hit?.ColumnDisplayName ?? `【${col}】` };
    });
};
/** 列資料（cells 順序必須跟 columns 對齊） */
const buildAnnouncementRows = (raw: FileArchiveListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) =>
    {
        const keyId = LibMerge("|", false, set.FileArchive?.FileArchiveId);
        const a = set.FileArchive;
        const title = (
            <>
                <span>{(set.FileArchiveInfo ?? []).find(d => d?.Lang === lang)?.Title ?? ""}</span>
                <span>{GetDataStatusContent(set.FileArchive?.ContentStatus ?? 0)}</span>
            </>
        );
        const cells: RowCell[] = [{ col: columns[0], content: mapIdsToText(a?.CategoriesId, raw.categoryMap) }, { col: columns[1], content: title }, {
            col: columns[2],
            content: a?.ModifyUser?.AccountName ?? "",
        }, { col: columns[3], content: FormatDateTime(a?.ModifyTime) }];
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
