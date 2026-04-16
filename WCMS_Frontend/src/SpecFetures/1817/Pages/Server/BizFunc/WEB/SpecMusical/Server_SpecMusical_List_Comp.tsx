import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useMemo, useState } from "react";
import { useLocation, useNavigate, type NavigateFunction } from "react-router-dom";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import {
    useSpecMusicalListFetchData,
    type SpecMusicalListRawData,
} from "./Server_SpecMusical_List_Hook";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import {
    createGridCrudActions,
    enhanceGridWithAdjustCell,
    type GridConfirmFn,
} from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import { SpecMusicalModelFields } from "@/types/SchemaFields";

type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"];

/** SpecMusical 列表頁 */
export const Server_SpecMusical_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");

    /** 搜尋列設定 */
    const searchCompProp: SearchBarProps = {
        title: "搜尋",
        subTitle: "搜尋 ...",
        onSubmit: setKw,
        onReset: () => setKw(""),
    };

    /** 依目前路由推導 Form 路徑 */
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);

    /** 集中從 Hook 取資料 */
    const getData = useSpecMusicalListFetchData({ lang: prop.lang, kw });
    const navigate = useNavigate();
    const cudActions = getData.adapter.SpecMusical.hooks.useCudActions();

    /** 組出 GridData */
    const gridData = useMemo(() => {
        return buildSpecMusicalGridProps({
            raw: getData.rawData,
            lang: prop.lang,
            crud: {
                navigate,
                dirUrl,
                deleteAsync: cudActions.deleteAsync,
                afterDelete: getData.refetchData,
            },
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

//#region GridProps
type CrudDeps = {
    navigate: NavigateFunction;
    dirUrl: string;
    deleteAsync: (internalId: string) => Promise<ApiResponse<SpecMusicalSet>>;
    afterDelete: () => Promise<void>;
};

/** SpecMusical 專用 GridProps */
const buildSpecMusicalGridProps = (opt: {
    raw: SpecMusicalListRawData;
    lang: Lang;
    crud: CrudDeps;
    confirm?: GridConfirmFn;
}): GridProps => {
    /** 定義列表欄位順序 */
    const visibleCols = [
        SpecMusicalModelFields.CoverPicId,
        SpecMusicalModelFields.MusicalName,
        SpecMusicalModelFields.CreateTime,
        SpecMusicalModelFields.ModifyUserId,
        SpecMusicalModelFields.ModifyTime,
    ];

    /** 先組欄位與列資料 */
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildSpecMusicalRows(opt.raw, columns);

    /** 組基礎 Grid */
    const baseGrid: GridProps = {
        columns,
        rows,
        CurrentPage: opt.raw.pageNumber ?? 1,
        TotalPage: opt.raw.totalPages ?? 1,
        onPageChange: opt.raw.onPageChange,
    };

    /** 建立 CRUD action */
    const actions = createGridCrudActions<SpecMusicalSet>({
        onEdit: (internalId) => opt.crud.navigate(`${opt.crud.dirUrl}/${internalId}`),
        deleteAsync: opt.crud.deleteAsync,
        afterDelete: opt.crud.afterDelete,
    });

    /** 注入 __adjust__ 動作欄 */
    return enhanceGridWithAdjustCell(baseGrid, {
        lang: opt.lang,
        rawList: opt.raw.list ?? [],
        actions,
        confirm: opt.confirm,
        getInternalId: (set) => set.SpecMusical?.InternalId ?? "",
    });
};

/** 依 ModelDisplaySchema 組欄位 */
const buildColumns = (
    visibleCols: string[],
    raw: SpecMusicalListRawData,
): ColumnConfig[] => {
    return visibleCols.map((col) => {
        const tables = raw.modelDisplayName?.Tables ?? [];
        const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === col);

        return {
            key: col,
            title: hit?.ColumnDisplayName ?? `【${col}】`,
        };
    });
};

/** 組出每一列資料 */
const buildSpecMusicalRows = (
    raw: SpecMusicalListRawData,
    columns: ColumnConfig[],
): GridRow[] => {
    return (raw.list ?? []).map((set) => {
        const item = set.SpecMusical;
        const keyId = item?.InternalId ?? item?.MusicalId ?? "";

        const cells: RowCell[] = [
            { col: columns[0], content: buildCoverContent(item?.CoverPicId) },
            { col: columns[1], content: item?.MusicalName ?? "" },
            { col: columns[2], content: FormatDateTime(item?.CreateTime) },
            { col: columns[3], content: item?.ModifyUser?.AccountName ?? "" },
            { col: columns[4], content: FormatDateTime(item?.ModifyTime) },
        ];

        return { keyId, cells };
    });
};

/** 封面圖顯示內容 */
const buildCoverContent = (fileId: string | null | undefined) => {
    if (!fileId) return "";

    return (
        <img
            src={FileManagementAPI.get_Server_Preview_Url(fileId)}
            style={{ width: "80px", height: "80px", objectFit: "cover" }}
            alt=""
        />
    );
};
//#endregion