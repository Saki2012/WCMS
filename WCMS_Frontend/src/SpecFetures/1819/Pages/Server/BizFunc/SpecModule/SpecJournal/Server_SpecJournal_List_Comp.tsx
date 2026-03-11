import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate, type NavigateFunction } from "react-router-dom";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { 
    createGridCrudActions,
    enhanceGridWithAdjustCell,
    type GridConfirmFn,
} from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import {
    SpecJournalModelFields,
} from "@/types/SchemaFields";
import {
    useSpecJournalListFetchData,
    type SpecJournalListRawData,
} from "./Server_SpecJournal_List_Hooks";

type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];

/** 後台期刊列表 */
export const Server_SpecJournal_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang }) =>
{
    // 宣告變數
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = {
        title: "搜尋",
        subTitle: "搜尋 ...",
        settingTitle: "搜尋設定",
        onSubmit: setKw,
        onReset: () => setKw(""),
    };

    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);

    const getData = useSpecJournalListFetchData({ lang: prop.lang, kw });
    const navigate = useNavigate();
    const cudActions = getData.adapter.SpecJournal.hooks.useCudActions();

    const gridData = useMemo(() =>
    {
        // return
        return buildSpecJournalGridProps({
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

//#region GridProps
type CrudDeps = {
    navigate: NavigateFunction;
    dirUrl: string;
    deleteAsync: (internalId: string) => Promise<ApiResponse<SpecJournalSet>>;
    afterDelete: () => Promise<void>;
};

/** SpecJournal 專用：rawData → GridProps */
const buildSpecJournalGridProps = (
    opt: {
        raw: SpecJournalListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    // 宣告變數
    const columns = buildColumns(opt.raw);
    const rows = buildSpecJournalRows(opt.raw, columns);
    const baseGrid: GridProps = {
        columns,
        rows,
        CurrentPage: opt.raw.pageNumber ?? 1,
        TotalPage: opt.raw.totalPages ?? 1,
        onPageChange: opt.raw.onPageChange,
    };

    const actions = createGridCrudActions<SpecJournalSet>({
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
        getInternalId: (set) => set.SpecJournal?.InternalId ?? "",
    });
};

/** 建立欄位清單 */
const buildColumns = (raw: SpecJournalListRawData): ColumnConfig[] =>
{
    // return
    return [
        { key: "__volIssue__", title: "卷期" },
        buildSchemaColumn(SpecJournalModelFields.Title, raw),
        buildSchemaColumn(SpecJournalModelFields.CreateTime, raw),
        buildSchemaColumn(SpecJournalModelFields.ModifyUserId, raw),
        buildSchemaColumn(SpecJournalModelFields.ModifyTime, raw),
    ];
};

/** 依 schema 找對應欄位標題 */
const buildSchemaColumn = (colId: string, raw: SpecJournalListRawData): ColumnConfig =>
{
    // 宣告變數
    const tables = raw.modelDisplayName?.Tables ?? [];
    const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === colId);

    // return
    return { key: colId, title: hit?.ColumnDisplayName ?? `【${colId}】` };
};

/** 建立 Grid rows */
const buildSpecJournalRows = (raw: SpecJournalListRawData, columns: ColumnConfig[]): GridRow[] =>
{
    // return
    return (raw.list ?? []).map((set) =>
    {
        // 宣告變數
        const keyId = LibMerge("|", false, set.SpecJournal?.JournalId, set.SpecJournal?.InternalId);
        const cells: RowCell[] = [
            { col: columns[0], content: renderVolIssue(set) },
            { col: columns[1], content: renderTitle(set) },
            { col: columns[2], content: FormatDateTime(set.SpecJournal?.CreateTime) },
            { col: columns[3], content: set.SpecJournal?.ModifyUser?.AccountName ?? "" },
            { col: columns[4], content: FormatDateTime(set.SpecJournal?.ModifyTime) },
        ];

        // return
        return { keyId, cells };
    });
};

/** 顯示卷期文字 */
const renderVolIssue = (set: SpecJournalSet): string =>
{
    // 宣告變數
    const detail = set.SpecJournal?._JournalIndexDetail;
    const volume = detail?.Volume ?? "";
    const issue = detail?.Issue ?? "";
    const hasValue = Boolean(volume) || Boolean(issue);

    // return
    return hasValue ? `${volume}卷${issue}期` : "";
};

/** 顯示中英文標題 */
const renderTitle = (set: SpecJournalSet): ReactNode =>
{
    // 宣告變數
    const title = set.SpecJournal?.Title ?? "";
    const titleEn = set.SpecJournal?.Title_en ?? "";

    // return
    return (
        <>
            <p className="mb-0">{title}</p>
            <p className="mb-0">{titleEn}</p>
        </>
    );
};
//#endregion