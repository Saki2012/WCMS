import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useCallback, useMemo, useState } from "react"
import { useLocation, useNavigate } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { components } from "@/types/api";
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { AccountFields, PGID, SpecMusicalModelFields, SpecMusicalSetFields } from "@/types/SchemaFields";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { SpecMusicalAdapter } from "@/SpecFetures/1817/Hooks/BizFunc/SpecModule/SpecMusical/SpecMusical_Api";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"]
type QueryListParam = components["schemas"]["QueryListParam"];

/** 公告列表
 * @returns 
 */
export const Server_SpecMusical_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);



    const adapter = useMemo(() => SpecMusicalAdapter(), []);
    const catAdapter = useMemo(() => CategoryAdapter(), []);
    const useCategory = catAdapter.hooks.useMapByProgId({ progId: PGID.SpecMusical, lang: prop.lang });
    const useData = useSpecMusicalList(adapter, prop.lang, kw);
    const actions = useAnnouncementActionsFromAdapter(dirUrl, adapter, useData.refetchAll);


    const adjustedGrid = useMemo(() => { return SetAdjustFunction(useData.gridProps, useData.rawData, actions); }, [useData.gridProps, useData.rawData, useCategory.map, actions]);
    const isLoading = useMemo(() => [useData.isLoading, useCategory.isLoading], [useData.isLoading, useCategory.isLoading]);
    const errors = useMemo(() => [useData.error, useCategory.errorText], [useData.error, useCategory.errorText]);
    const searchCompProp: SearchBarProps = { title: "搜尋", subTitle: "搜尋 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), };
    return (<ListComp Title={prop.title} Theme={prop.theme} LoadingList={isLoading} ErrorList={errors} Actions={actions} GridData={adjustedGrid} SearchBar={searchCompProp}></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: SpecMusicalSet[], actions: UseActionsResult): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const curData = rawData?.[index]


        const pic = row.cells.find(cell => cell.col.key === SpecMusicalModelFields.CoverPicId);
        if (pic) { pic.content = <img src={`${FileManagementAPI.PREVIEW_URL}/${curData.SpecMusical?.CoverPicId}`} style={{ width: "80px", height: "80px", objectFit: "cover" }} />; }
        // const titleCell = row.cells.find(cell => cell.col.key === AnnouncementDetailFields.Title)
        // if (titleCell) { titleCell.content = (<>{titleCell.content}{GetDataStatusContent(curData?.Announcement?.ContentStatus ?? 0)}</>); }
        // const categoryCell = row.cells.find(p => p.col.key === AnnouncementFields.Categories);
        // const rawCatId = curData?.Announcement?.Categories ?? categoryCell?.content?.toString() ?? "";
        // if (categoryCell) { categoryCell.content = useFormatCategoriesName(rawCatId, categoryData); }

        const internalId = curData?.SpecMusical?.InternalId ?? "";

        const newCell: RowCell = { col: adjustCol, content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />) };
        return { ...row, cells: [...row.cells, newCell] };
    });
    return { ...gridProps, columns: newColumns, rows: newRows };
};



/** 用 Adapter 取得 SpecMusical 列表（含 Count + 分頁） */
const useSpecMusicalList = (
    adapter: ReturnType<typeof SpecMusicalAdapter>,
    lang: Lang,
    query: string,
) => {
    // 宣告變數
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) => {
        // 執行 function
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const model = adapter.hooks.useModelDisplayName({ deps: [lang], onError });

    const baseCondition = useMemo(() => {
        // 宣告變數
        let condition = ``;

        if (!!query) {
            condition = LibMerge(
                " And ",
                false,
                condition,
                `${SpecMusicalModelFields.MusicalName} Like ${query}`,
            );
        }

        // return
        return condition;
    }, [query]);

    const baseParam = useMemo<QueryListParam>(() => {
        // return
        return {
            Fields: [
                SpecMusicalModelFields.MusicalId,
                SpecMusicalModelFields.MusicalName,
                SpecMusicalModelFields.CoverPicId,
                SpecMusicalModelFields.Specification,
                SpecMusicalModelFields.ModifyUserId,
                `${SpecMusicalModelFields.ModifyUser}.${AccountFields.AccountName}`,
                SpecMusicalModelFields.CreateTime,
                SpecMusicalModelFields.ModifyTime,
                SpecMusicalModelFields.InternalId,
            ],
            Condition: baseCondition,
            OrderBy: [{ Col: SpecMusicalModelFields.CreateTime, Desc: true }],
            PageNumber: 1,
            PageSize: 10,
        };
    }, [baseCondition]);

    const count = adapter.hooks.useQueryCount({
        condition: baseParam,
        deps: [baseParam.Condition ?? ""],
        onError,
    });

    const paged = adapter.hooks.usePagedQueryList({
        baseParam,
        count: count.data ?? 0,
        deps: [baseParam.Condition ?? ""],
        onError,
    });

    const visibleKeys = useMemo<ReadonlyArray<readonly [string, string]>>(() => ([
        [SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.CoverPicId],
        [SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.MusicalName],
        [SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.CreateTime],
        [SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.ModifyUserId],
        [SpecMusicalModelFields.ModifyUser, AccountFields.AccountName],
        [SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.ModifyTime],
    ] as const), []);

    const columns = useMemo<ColumnConfig[]>(() => {
        // return
        return BuildVisibleColumnsFromSchema(model.data, visibleKeys);
    }, [model.data, visibleKeys]);

    const rows = useMemo<GridRow[]>(() => {
        // return
        return (paged.data ?? []).map((item) => {
            // 宣告變數
            const data = item.SpecMusical ?? {};
            const dataDict = data as Record<string, string | number | boolean | null | undefined>;

            // 執行 function：依欄位輸出 cell
            const cells: RowCell[] = columns.map((col) => {
                // 宣告變數
                let content = "";

                switch (col.key) {
                    case SpecMusicalModelFields.CreateTime:
                    case SpecMusicalModelFields.ModifyTime:
                        content = FormatDateTime(String(dataDict[col.key]));
                        break;

                    case SpecMusicalModelFields.ModifyUserId:
                        content = item.SpecMusical?.ModifyUser?.AccountName ?? "";
                        break;

                    default:
                        content = String(dataDict[col.key] ?? "");
                        break;
                }

                // return
                return { col, content };
            });

            // return
            return { cells };
        });
    }, [paged.data, columns]);

    const gridProps: GridProps = useMemo(() => {
        // return
        return {
            columns,
            rows,
            rawData: paged.data ?? [],
            CurrentPage: paged.pageNumber,
            TotalPage: paged.totalPages,
            onPageChange: (page: number) => paged.onPageChange(page),
        };
    }, [columns, rows, paged.data, paged.pageNumber, paged.totalPages, paged.onPageChange]);

    const refetchAll = useCallback(async () => {
        // 執行 function：刪除/新增後 count 會變，先抓 count 再抓 list
        await count.refetch();
        await paged.refetch();
    }, [count, paged]);

    const isLoading = Boolean(model.isLoading || count.isLoading || paged.isLoading);
    const error = model.errorText ?? count.errorText ?? paged.errorText ?? null;

    // return
    return { rawData: paged.data ?? [], gridProps, isLoading, error, refetchAll };
};


/** 從 ModelDisplaySchema + visibleKeys 產生 columns */
const BuildVisibleColumnsFromSchema = (
    schema: ModelDisplaySchema | null,
    visibleKeys: ReadonlyArray<readonly [string, string]>,
): ColumnConfig[] => {
    // 宣告變數
    if (!schema?.Tables?.length) return [];
    if (!visibleKeys || visibleKeys.length === 0) return [];

    // return
    return visibleKeys
        .map(([tableId, columnId]) => {
            const table = schema.Tables.find(t => t.TableId === tableId);
            const col = table?.Columns?.find(c => c.ColumnId === columnId);
            if (!col) return null;
            return { key: col.ColumnId, title: col.ColumnDisplayName } as ColumnConfig;
        })
        .filter((x): x is ColumnConfig => !!x);
};

/** 後台 actions：直接用 Adapter CUD（不再用 useActions.ts） */
const useAnnouncementActionsFromAdapter = (
    dirUrl: string,
    adapter: ReturnType<typeof SpecMusicalAdapter>,
    afterChanged: () => Promise<void>,
): UseActionsResult => {
    // 宣告變數
    const navigate = useNavigate();
    const { publish } = useToast();

    const cud = adapter.hooks.useCudActions({
        onError: (e) => publish({ level: MessageStatus.Error, title: e.messageText }),
    });

    const onAddNew = useCallback(() => {
        // 執行 function
        navigate(dirUrl);
    }, [navigate, dirUrl]);

    const onEdit = useCallback((internalId: string) => {
        // 執行 function
        navigate(`${dirUrl}/${internalId}`);
    }, [navigate, dirUrl]);

    const onCancelBack = useCallback(() => {
        // 執行 function：List 通常不會用到，但保持介面完整
        navigate(dirUrl.replace(/\/Form$/, "/List"));
    }, [navigate, dirUrl]);

    const onDelete = useCallback(async (internalId: string) => {
        // 宣告變數
        const ok = window.confirm("確定要刪除嗎？");
        if (!ok) return;

        // 執行 function
        const res = await cud.deleteAsync(internalId);
        (res.SysMessage ?? []).forEach(m => publish({ level: m.Status, code: m.MessageCode, title: m.Message }));
        if (res.IsSuccess) await afterChanged();
    }, [cud, publish, afterChanged]);

    // return
    return useMemo(() => ({
        isExecuting: cud.isSaving,
        onSave: async () => false,
        onDelete,
        onInvalid: () => { /* List row 失效目前不做 */ },
        onCancelBack,
        onAddNew,
        onEdit,
        onPreview: () => { /* List 不用 */ },
    }), [cud.isSaving, onDelete, onCancelBack, onAddNew, onEdit]);
};
