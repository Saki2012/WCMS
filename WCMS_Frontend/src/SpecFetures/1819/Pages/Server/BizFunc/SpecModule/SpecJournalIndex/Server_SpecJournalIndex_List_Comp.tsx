import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo, useState } from "react"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { components } from "@/types/api";
import { useCategoryListData } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import { SpecPGID } from "@/SpecFetures/1817/Hooks/Common/SpecProgId";
import SpecJournalIndexProvider from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecMusical/SpecJournalIndex_Api";
import { AccountFields, SpecJournalIndexDetailFields, SpecJournalIndexModelFields, SpecJournalIndexSetFields } from "@/types/SchemaFields";
type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"]


export const Server_SpecJournalIndex_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = { title: "搜尋", subTitle: "搜尋 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), };
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const provider = useMemo(() => SpecJournalIndexProvider(), []);
    const useCategory = useCategoryListData(SpecPGID.SpecMusical, prop.lang);
    const useData = useSpecJournalIndexList(provider, prop.lang, kw);
    const actions = useActions(dirUrl, provider, undefined, undefined, useData.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(useData.gridProps, useData.rawData, actions); }, [useData.gridProps, useData.rawData, useCategory.rawData, actions]);
    const isLoading = useMemo(() => [useData.isLoading, useCategory.isLoading], [useData.isLoading, useCategory.isLoading]);
    const errors = useMemo(() => [useData.error, useCategory.error], [useData.error, useCategory.error]);
    return (<ListComp Title={prop.title} Theme={prop.theme} LoadingList={isLoading} ErrorList={errors} Actions={actions} GridData={adjustedGrid} SearchBar={searchCompProp}></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: SpecJournalIndexSet[], actions: UseActionsResult): GridProps => {
    const hasAdjust = gridProps.columns.some(col => col.key === '__adjust__');
    const hasVolIssue = gridProps.columns.some(col => col.key === '__volIssue__');
    if (hasAdjust && hasVolIssue) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const volIssueCol: ColumnConfig = { key: '__volIssue__', title: '卷期' };


    const newColumns: ColumnConfig[] = (() => {
        const cols = [...gridProps.columns];
        if (!hasVolIssue) {
            const idx = cols.findIndex(c => c.key === SpecJournalIndexModelFields.IndexName);
            const insertAt = idx >= 0 ? idx + 1 : cols.length;
            cols.splice(insertAt, 0, volIssueCol);
        }
        if (!hasAdjust) cols.push(adjustCol);
        return cols;
    })();

    // 執行：重建 rows cells（依照 newColumns 的順序補齊對應 cell）
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const curData = rawData?.[index];
        const internalId = curData?.SpecJournalIndex?.InternalId ?? "";
        // 先用「原本 cells」當底，後續補新欄位
        const cells = [...row.cells];
        // 卷期：插在 IndexName cell 後面（content 你之後再補）
        if (!hasVolIssue) {
            const idx = cells.findIndex(c => c.col.key === SpecJournalIndexModelFields.IndexName);
            const insertAt = idx >= 0 ? idx + 1 : cells.length;
            const volume = (<ul>
                {curData.SpecJournalIndexDetail?.map((dt) => {
                    return (<li>
                        {`${dt.Volume}卷${dt.Issue}期`}
                    </li>)
                })}
            </ul>)

            const volIssueCell: RowCell = {
                col: volIssueCol,
                content: volume, // TODO: 你之後自行補內容
            };
            cells.splice(insertAt, 0, volIssueCell);
        }
        // 動作：固定在最後
        if (!hasAdjust) {
            const adjustCell: RowCell = { col: adjustCol, content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />) };
            cells.push(adjustCell);
        }
        return { ...row, cells };
    });

    return { ...gridProps, columns: newColumns, rows: newRows };
};

const useSpecJournalIndexList = (provider: IDataProvider<SpecJournalIndexSet>, lang: Lang, query: string) => {
    let condition: string = ``;
    if (!!query) condition = LibMerge(" And ", false, condition, `${SpecJournalIndexModelFields.IndexName} Like ${query}`)
    return useFetchGridListData<SpecJournalIndexSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SpecJournalIndexSetFields.SpecJournalIndex, SpecJournalIndexModelFields.IndexName],
            [SpecJournalIndexSetFields.SpecJournalIndex, SpecJournalIndexModelFields.CreateTime],
            [SpecJournalIndexSetFields.SpecJournalIndex, SpecJournalIndexModelFields.ModifyUserId],
            [SpecJournalIndexModelFields.ModifyUser, AccountFields.AccountName],
            [SpecJournalIndexSetFields.SpecJournalIndex, SpecJournalIndexModelFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SpecJournalIndexModelFields.IndexId, SpecJournalIndexModelFields.IndexName, SpecJournalIndexModelFields.ModifyUserId,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
                `${SpecJournalIndexModelFields.ModifyUser}.${AccountFields.AccountName}`, SpecJournalIndexModelFields.CreateTime,
                SpecJournalIndexModelFields.ModifyTime, SpecJournalIndexModelFields.InternalId,
            ],
            Condition: condition,
            OrderBy: [{ Col: SpecJournalIndexModelFields.CreateTime, Desc: true },],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const data = item.SpecJournalIndex ?? {};
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                switch (col.key) {
                    case SpecJournalIndexModelFields.CreateTime:
                    case SpecJournalIndexModelFields.ModifyTime:
                        content = FormatDateTime((data as any)[col.key]);
                        break;
                    case SpecJournalIndexModelFields.ModifyUserId:
                        content = item.SpecJournalIndex?.ModifyUser?.AccountName ?? "";
                        break;
                    default:
                        content = (data as any)[col.key] ?? "";
                        break;
                }
                return { col, content };
            });
            return { cells };
        },
        enabled: true,
        deps: [lang, query],
    });
};
