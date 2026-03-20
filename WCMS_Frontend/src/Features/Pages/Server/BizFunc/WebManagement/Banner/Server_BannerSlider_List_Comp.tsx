import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import {  useMemo, useState } from "react";
import { useLocation, useNavigate, type NavigateFunction } from "react-router-dom";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { components } from "@/types/api";
import {  BannerFields, BannerDetailFields } from "@/types/SchemaFields";
import type { Lang } from "@/SysCore/i18n/lang";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import {  FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { useBannerSliderListFetchData, type BannerSliderListRawData } from "./Server_BannerSlider_List_Hook";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "../../../Scaffold/Content/GridAdjustCellEnhance";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
type BannerSet = components["schemas"]["BannerSet_DTO"];

export const BannerSliderListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = {title: "廣告輪播搜尋",subTitle: "搜尋廣告輪播 ...",onSubmit: setKw,onReset: () => setKw(""),};
    const pathname = useLocation().pathname;
    const navigate = useNavigate();
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const getData = useBannerSliderListFetchData({ lang: prop.lang, kw: kw });
    const cudActions = getData.adapter.BannerSlider.hooks.useCudActions();
    const gridData = useMemo(() => { return buildBannerSliderGridProps({raw: getData.rawData,lang: prop.lang, crud: {navigate,dirUrl,deleteAsync: cudActions.deleteAsync,afterDelete: getData.refetchData,},});
    }, [getData.rawData, prop.lang, navigate, dirUrl, cudActions.deleteAsync, getData.refetchData]);
    return <ListComp Title={prop.title} Theme={prop.theme} isLoading={getData.isLoading} ErrorList={getData.errors} GridData={gridData} SearchBar={searchCompProp} />
};

type CrudDeps = {navigate: NavigateFunction;dirUrl: string;deleteAsync: (internalId: string) => Promise<ApiResponse<BannerSet>>;afterDelete: () => Promise<void>;};
/** ✅ BannerSlider 專用：rawData → GridProps（含 ActionCell / Delete confirm） */
const buildBannerSliderGridProps = (opt: {raw: BannerSliderListRawData; lang: Lang;
    crud: CrudDeps; can?: (mask: number) => boolean; notifyNoPermission?: (msg: string) => void;confirm?: GridConfirmFn;}): GridProps => {
    const visibleCols = [BannerDetailFields.PicSrcId,BannerFields.BannerCategoryName,BannerFields.ModifyTime,BannerFields.ModifyUserId];
    // 執行 function：Grid 基礎資料
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildBannerSliderRows(opt.raw, columns);
    const baseGrid: GridProps = {columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange,};
    // 執行 function：動作按鈕（Edit/Delete）
    const actions = createGridCrudActions<BannerSet>({onEdit: (internalId) => opt.crud.navigate(`${opt.crud.dirUrl}/${internalId}`),deleteAsync: opt.crud.deleteAsync,afterDelete: opt.crud.afterDelete,});
    // return：enhance 注入 __adjust__
    return enhanceGridWithAdjustCell(baseGrid, {lang: opt.lang,rawList: opt.raw.list ?? [],actions,
        can: opt.can,notifyNoPermission: opt.notifyNoPermission,confirm: opt.confirm,
        getInternalId: (set) => set.Banner?.InternalId ?? "",
    });
};
/** 欄位定義（順序＝顯示順序） */
const buildColumns = (visibleCols: string[], raw: BannerSliderListRawData): ColumnConfig[] => {
    return visibleCols.map((col) => { 
      const tables = raw.modelDisplayName?.Tables ?? [];
      const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === col);
      return { key: col, title: hit?.ColumnDisplayName ?? `【${col}】` };
     });
};
/** 列資料（cells 順序必須跟 columns 對齊） */
const buildBannerSliderRows = (raw: BannerSliderListRawData, columns: ColumnConfig[]): GridRow[] => {
    return (raw.list ?? []).map((set) => {
        const keyId = LibMerge("|", false, set.Banner?.BannerId);
        const a = set.Banner;
        const picNode =(set.BannerDetail?.[0].PicSrcId?<img src={FileManagementAPI.get_Server_Preview_Url(set.BannerDetail?.[0].PicSrcId)} style={{ width: "145px", height: "80px", objectFit: "fill" }} />:null)
        const cells: RowCell[] = [
            { col: columns[0], content: picNode },
            { col: columns[1], content: a?.BannerCategoryName },
            { col: columns[2], content: a?.ModifyUser?.AccountName ?? "" },
            { col: columns[3], content: FormatDateTime(a?.ModifyTime) },
        ];
        return { keyId, cells };
    });
};