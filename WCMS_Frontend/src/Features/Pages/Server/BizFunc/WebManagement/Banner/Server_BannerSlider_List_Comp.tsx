import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { components } from "@/types/api";
import { BannerSetFields, BannerFields, BannerDetailFields, AccountFields } from "@/types/SchemaFields";
import type { Lang } from "@/SysCore/i18n/lang";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
type BannerSet = components["schemas"]["BannerSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

/** 廣告輪播清單 */
export const BannerSliderListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    // 宣告變數
    const [kw, setKw] = useState<string>("");
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);

    const adapter = useMemo(() => BannerSliderAdapter(), []);
    const bannerList = useBannerListDataByAdapter(adapter, kw);
    const actions = useBannerListActionsByAdapter(dirUrl, adapter, bannerList.refetchCurrent);
    const adjustedGrid = useMemo(
        () => SetAdjustFunction(bannerList.gridProps, bannerList.rawData, actions),
        [bannerList.gridProps, bannerList.rawData, actions],
    );

    const searchCompProp: SearchBarProps = {
        title: "廣告輪播搜尋",
        subTitle: "搜尋廣告輪播 ...",
        settingTitle: "搜尋設定",
        onSubmit: setKw,
        onReset: () => setKw(""),
    };

    const isLoading = [bannerList.isLoading];
    const errors = [bannerList.error];

    // return（不動 DOM 結構）
    return (
        <ListComp
            Title={prop.title}
            Theme={prop.theme}
            isLoading={isLoading}
            ErrorList={errors}
            Actions={actions}
            GridData={adjustedGrid}
            SearchBar={searchCompProp}
        ></ListComp>
    );
};

/** 動態添加每行的動作功能（不動既有欄位，只追加一欄） */
const SetAdjustFunction = (gridProps: GridProps, rawData: BannerSet[], actions: UseActionsResult): GridProps => {
    // 宣告變數
    if (gridProps.columns.some(col => col.key === "__adjust__")) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;

    const adjustCol: ColumnConfig = { key: "__adjust__", title: "動作" };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];

    // 執行 function：逐 row 補上 toolbar cell
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const internalId = rawData?.[index]?.Banner?.InternalId ?? "";
        const newCell: RowCell = {
            col: adjustCol,
            content: <GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />,
        };
        return { ...row, cells: [...row.cells, newCell] };
    });

    // return
    return { ...gridProps, columns: newColumns, rows: newRows };
};

/** List 用 Actions：不再使用 useActions，改用 adapter.useServerActions */
const useBannerListActionsByAdapter = (
    dirUrl: string,
    adapter: ReturnType<typeof BannerSliderAdapter>,
    onAfterDelete: () => Promise<void>,
): UseActionsResult => {
    // 宣告變數
    const nav = useNavigate();
    const { publish } = useToast();

    const server = adapter.useServerActions({
        onSuccessByMode: {
            delete: () => onAfterDelete(),
        },
    });

    const onAddNew = useCallback(() => {
        // 執行 function
        nav(dirUrl);
    }, [nav, dirUrl]);

    const onEdit = useCallback(
        (internalId: string) => {
            // 執行 function
            nav(`${dirUrl}/${internalId}`);
        },
        [nav, dirUrl],
    );

    const onDelete = useCallback(
        async (internalId: string) => {
            // 執行 function：維持舊行為（confirm + toast）
            if (!internalId) return;

            const ok = window.confirm("確定要刪除嗎？");
            if (!ok) return;

            const res = await server.deleteAsync(internalId);
            (res.SysMessage ?? []).forEach(m =>
                publish({ level: m.Status, code: m.MessageCode, title: m.Message, text: m.Message }),
            );
        },
        [server, publish],
    );

    // return：維持 ListComp / Toolbar 需要的介面（不做 save/preview/invalid）
    return {
        isExecuting: server.isSaving,
        onSave: async () => false,
        onDelete,
        onInvalid: async () => { },
        onCancelBack: () => { },
        onAddNew,
        onEdit,
        onPreview: () => { },
    };
};

/** 轉換欄位 schema → grid columns（不依賴 provider） */
const buildColumnsFromSchema = (schema: ModelDisplaySchema | null, visibleKeys: [string, string][]): ColumnConfig[] => {
    // 宣告變數
    if (!schema?.Tables?.length) return [];
    if (!visibleKeys.length) return [];

    // 執行 function
    const columns = visibleKeys
        .map(([tableId, columnId]) => {
            const table = schema.Tables.find(t => t.TableId === tableId);
            const col = table?.Columns.find(c => c.ColumnId === columnId);
            if (!col) return null;
            return { key: col.ColumnId, title: col.ColumnDisplayName } as ColumnConfig;
        })
        .filter((x): x is ColumnConfig => !!x);

    // return
    return columns;
};

const getCellContent = (item: BannerSet, key: string): string => {
    // 宣告變數
    const b = item.Banner;

    // 執行 function：明確處理，避免 any
    switch (key) {
        case BannerDetailFields.PicSrcId:
            return item.BannerDetail?.[0]?.PicSrcId ?? "";
        case BannerFields.BannerCategoryName:
            return b?.BannerCategoryName ?? "";
        case BannerFields.CreateTime:
            return FormatDateTime(b?.CreateTime) ?? "";
        case BannerFields.ModifyTime:
            return FormatDateTime(b?.ModifyTime) ?? "";
        case BannerFields.ModifyUserId:
            return b?.ModifyUser?.AccountName ?? "";
        default:
            return "";
    }
};

/** BannerSlider List Data：改用 adapter.hooks 查詢 + 組 GridProps（不使用 useFetchGridListData/provider） */
const useBannerListDataByAdapter = (adapter: ReturnType<typeof BannerSliderAdapter>, query: string) => {
    // 宣告變數
    const visibleKeys: [string, string][] = useMemo(
        () => [
            [BannerDetailFields.PicSrcId, BannerDetailFields.PicSrcId],
            [BannerSetFields.Banner, BannerFields.BannerCategoryName],
            [BannerSetFields.Banner, BannerFields.CreateTime],
            [BannerSetFields.Banner, BannerFields.ModifyUserId],
            [BannerFields.ModifyUser, AccountFields.AccountName],
            [BannerSetFields.Banner, BannerFields.ModifyTime],
        ],
        [],
    );

    const conditionText = useMemo(() => {
        // 宣告變數
        let cond = "";
        if (!!query) cond = LibMerge(" And ", false, cond, `${BannerFields.BannerCategoryName} Like ${query}`);
        return cond;
    }, [query]);

    const baseParam = useMemo<QueryListParam>(() => {
        // return
        return {
            Fields: [
                BannerFields.InternalId,
                BannerFields.BannerId,
                BannerFields.BannerCategoryName,
                BannerFields.ModifyUserId,
                `${BannerFields.ModifyUser}.${AccountFields.AccountName}`,
                BannerFields.CreateTime,
                BannerFields.ModifyTime,
            ],
            Condition: conditionText,
            OrderBy: [{ Col: BannerFields.CreateTime, Desc: true }],
            PageNumber: 1,
            PageSize: 10,
        };
    }, [conditionText]);

    const model = adapter.hooks.useModelDisplayName({ deps: [] });
    const count = adapter.hooks.useQueryCount({ condition: baseParam, deps: [conditionText] });
    const list = adapter.hooks.usePagedQueryList({ baseParam, deps: [conditionText], count: count.data });

    const columns = useMemo(() => buildColumnsFromSchema(model.data ?? null, visibleKeys), [model.data, visibleKeys]);

    const rows = useMemo<GridRow[]>(() => {
        // 宣告變數
        const cols = columns;

        // 執行 function
        return (list.data ?? []).map(item => {
            const cells: RowCell[] = cols.map(col => ({
                col,
                content: getCellContent(item, col.key),
            }));
            return { cells };
        });
    }, [list.data, columns]);

    const gridProps: GridProps = useMemo(() => {
        // return
        return {
            columns,
            rows,
            rawData: list.data ?? [],
            CurrentPage: list.pageNumber,
            TotalPage: list.totalPages,
            onPageChange: (p: number) => list.onPageChange(p),
        };
    }, [columns, rows, list.data, list.pageNumber, list.totalPages, list.onPageChange]);

    const refetchCurrent = useCallback(async () => {
        // 執行 function：重抓目前頁（沿用 adapter hook 的 refetch）
        await list.refetch();
        await count.refetch();
    }, [list, count]);

    // return
    return {
        rawData: list.data ?? [],
        gridProps,
        isLoading: Boolean(model.isLoading || list.isLoading || count.isLoading),
        error: model.errorText ?? list.errorText ?? count.errorText ?? null,
        refetchCurrent,
    };
};
