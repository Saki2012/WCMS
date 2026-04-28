import { GetDataStatusContent } from "@/Features/Pages/Server/Scaffold/CommUnitComp/CommonComp";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { GalleryFields, GalleryInfoFields } from "@/types/SchemaFields";
import { useMemo, useState } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";
import { type GalleryListRawData, useGalleryListFetchData } from "./Server_Gallery_List_Hook";

type GallerySet = components["schemas"]["GallerySet_DTO"];

/** 相簿清單 */
export const Server_GalleryListComp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = { title: "相簿搜尋", subTitle: "搜尋相簿 ...", onSubmit: setKw, onReset: () => setKw("") };
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const navigate = useNavigate();
    const getData = useGalleryListFetchData({ lang: prop.lang, kw: kw });
    const cudActions = getData.adapter.Gallery.hooks.useCudActions();
    const gridData = useMemo(() =>
    {
        return buildGalleryGridProps({
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
    deleteAsync: (internalId: string) => Promise<ApiResponse<GallerySet>>;
    afterDelete: () => Promise<void>;
};
const buildGalleryGridProps = (
    opt: {
        raw: GalleryListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [GalleryFields.CoverPicSrcId, GalleryInfoFields.Title, GalleryFields.ModifyUserId, GalleryFields.ModifyTime];
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildGalleryRows(opt.raw, opt.lang, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };
    const actions = createGridCrudActions<GallerySet>({
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
        getInternalId: (set) => set.Gallery?.InternalId ?? "",
    });
};
/** 欄位定義（順序＝顯示順序） */
const buildColumns = (visibleCols: string[], raw: GalleryListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) =>
    {
        const tables = raw.modelDisplayName?.Tables ?? [];
        const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === col);
        return { key: col, title: hit?.ColumnDisplayName ?? `【${col}】` };
    });
};
/** 列資料（cells 順序必須跟 columns 對齊） */
const buildGalleryRows = (raw: GalleryListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) =>
    {
        const keyId = LibMerge("|", false, set.Gallery?.GalleryId);
        const a = set.Gallery;
        const title = (set.GalleryInfo ?? []).find(d => d?.Lang === lang)?.Title ?? "";
        const coverPicNode = (
            <img src={FileManagementAPI.get_Server_Preview_Url(a?.CoverPicSrcId)} alt={title} style={{ width: "80px", height: "80px", objectFit: "cover" }} />
        );
        const titleNode = (
            <>
                <span>{(set.GalleryInfo ?? []).find(d => d?.Lang === lang)?.Title ?? ""}</span>
                <span>{GetDataStatusContent(set.Gallery?.ContentStatus ?? 0)}</span>
            </>
        );
        const cells: RowCell[] = [{ col: columns[0], content: coverPicNode }, { col: columns[1], content: titleNode }, {
            col: columns[2],
            content: a?.ModifyUser?.AccountName ?? "",
        }, { col: columns[3], content: FormatDateTime(a?.ModifyTime) }];
        return { keyId, cells };
    });
};
// #endregion
