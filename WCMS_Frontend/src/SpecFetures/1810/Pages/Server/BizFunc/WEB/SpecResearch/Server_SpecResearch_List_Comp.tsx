import {
    createGridCrudActions,
    enhanceGridWithAdjustCell,
    type GridConfirmFn,
} from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { SpecResearchDetailModelFields, SpecResearchModelFields } from "@/types/SchemaFields";
import { type ReactNode, useMemo, useState } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";
import { useSpecResearchListFetchData } from "./Server_SpecResearch_List_Hook";
type SpecResearchSet = components["schemas"]["SpecResearchSet_DTO"];

/** 研究計畫清單 */
export const Server_ResearchProjListComp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = {
        title: "研究計畫搜尋",
        subTitle: "搜尋研究計畫 ...",
        onSubmit: setKw,
        onReset: () => setKw(""),
    };
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const navigate = useNavigate();
    const getData = useSpecResearchListFetchData({ lang: prop.lang, kw });
    const cudActions = getData.adapter.SpecResearch.hooks.useCudActions();
    const gridData = useMemo(() =>
    {
        return buildSpecResearchGridProps({
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
type SpecResearchListRawData = ReturnType<typeof useSpecResearchListFetchData>["rawData"];
type CrudDeps = {
    navigate: NavigateFunction;
    dirUrl: string;
    deleteAsync: (internalId: string) => Promise<ApiResponse<SpecResearchSet>>;
    afterDelete: () => Promise<void>;
};

/** ✅ SpecResearch 專用：rawData → GridProps（含 ActionCell / Delete confirm） */
const buildSpecResearchGridProps = (
    opt: {
        raw: SpecResearchListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [
        SpecResearchModelFields.CategoryId,
        SpecResearchModelFields.Tags,
        SpecResearchDetailModelFields.Year,
        SpecResearchDetailModelFields.AcademicYear,
        SpecResearchDetailModelFields.Semester,
        SpecResearchDetailModelFields.ProjectName,
        SpecResearchDetailModelFields.PaperTitle,
        SpecResearchDetailModelFields.CooperationProject,
        SpecResearchDetailModelFields.Courses,
        SpecResearchModelFields.CreateTime,
        SpecResearchModelFields.ModifyUserId,
        SpecResearchModelFields.ModifyTime,
    ];
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildSpecResearchRows(opt.raw, opt.lang, columns);
    const baseGrid: GridProps = {
        columns,
        rows,
        CurrentPage: opt.raw.pageNumber ?? 1,
        TotalPage: opt.raw.totalPages ?? 1,
        onPageChange: opt.raw.onPageChange,
    };
    const actions = createGridCrudActions<SpecResearchSet>({
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
        getInternalId: (set) => set.SpecResearch?.InternalId ?? "",
    });
};

/** 欄位定義（順序＝顯示順序） */
const buildColumns = (visibleCols: string[], raw: SpecResearchListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) =>
    {
        const tables = raw.modelDisplayName?.Tables ?? [];
        const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === col);
        return { key: col, title: hit?.ColumnDisplayName ?? `【${col}】` };
    });
};

/** 列資料（cells 順序必須跟 columns 對齊） */
const buildSpecResearchRows = (raw: SpecResearchListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) =>
    {
        // 宣告變數
        const keyId = LibMerge("|", false, set.SpecResearch?.ResearchId);
        const r = set.SpecResearch;
        const detail = (set.SpecResearchDetail ?? []).find((d) => d?.Lang === lang);
        // 執行 function：映射顯示文字
        const categoryText = mapIdToText(r?.CategoryId, raw.categoryMap);
        const tagsNode = mapIdsToText(r?.Tags, raw.tagMap);
        // return：cells（順序必須對齊 columns）
        const cells: RowCell[] = [
            { col: columns[0], content: categoryText },
            { col: columns[1], content: tagsNode },
            { col: columns[2], content: detail?.Year?.toString() ?? "" },
            { col: columns[3], content: detail?.AcademicYear?.toString() ?? "" },
            { col: columns[4], content: detail?.Semester?.toString() ?? "" },
            { col: columns[5], content: detail?.ProjectName ?? "" },
            { col: columns[6], content: detail?.PaperTitle ?? "" },
            { col: columns[7], content: detail?.CooperationProject ?? "" },
            { col: columns[8], content: detail?.Courses ?? "" },
            { col: columns[9], content: FormatDateTime(r?.CreateTime) },
            { col: columns[10], content: r?.ModifyUser?.AccountName ?? "" },
            { col: columns[11], content: FormatDateTime(r?.ModifyTime) },
        ];
        return { keyId, cells };
    });
};

/** 把單一 id 用 map 轉成顯示文字 */
const mapIdToText = (id: string | number | null | undefined, map: Record<string, string>): string =>
{
    const key = id === null || id === undefined ? "" : String(id);
    if (!key) return "";
    return map[key] ?? key;
};
/** 把 "a,b,c" 這種 id 字串，用 map 轉成顯示文字（li 版本、不跑版） */
const mapIdsToText = (ids: string | null | undefined, map: Record<string, string>): ReactNode =>
{
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
// #endregion
