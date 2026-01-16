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
import SpecJournalProvider from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecMusical/SpecJournal_Api";
import { AccountFields, SpecJournalModelFields, SpecJournalSetFields } from "@/types/SchemaFields";
type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"]


export const Server_SpecJournal_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = { title: "搜尋", subTitle: "搜尋 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), };
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const provider = useMemo(() => SpecJournalProvider(), []);
    const useCategory = useCategoryListData(SpecPGID.SpecMusical, prop.lang);
    const useData = useSpecJournalList(provider, prop.lang, kw);
    const actions = useActions(dirUrl, provider, undefined, undefined, useData.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(useData.gridProps, useData.rawData, actions); }, [useData.gridProps, useData.rawData, useCategory.rawData, actions]);
    const isLoading = useMemo(() => [useData.isLoading, useCategory.isLoading], [useData.isLoading, useCategory.isLoading]);
    const errors = useMemo(() => [useData.error, useCategory.error], [useData.error, useCategory.error]);
    return (<ListComp Title={prop.title} Theme={prop.theme} LoadingList={isLoading} ErrorList={errors} Actions={actions} GridData={adjustedGrid} SearchBar={searchCompProp}></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: SpecJournalSet[], actions: UseActionsResult): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, idx) => {
        const curData = rawData?.[idx]
        const internalId = curData?.SpecJournal?.InternalId ?? "";
        const newCell: RowCell = { col: adjustCol, content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />) };
        return { ...row, cells: [...row.cells, newCell] };
    });
    return { ...gridProps, columns: newColumns, rows: newRows };
};

const useSpecJournalList = (provider: IDataProvider<SpecJournalSet>, lang: Lang, query: string) => {
    let condition: string = ``;
    if (!!query) condition = LibMerge(" And ", false, condition, `${SpecJournalModelFields.Title} Like ${query}`)
    return useFetchGridListData<SpecJournalSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SpecJournalSetFields.SpecJournal, SpecJournalModelFields.Title],
            [SpecJournalSetFields.SpecJournal, SpecJournalModelFields.CreateTime],
            [SpecJournalSetFields.SpecJournal, SpecJournalModelFields.ModifyUserId],
            [SpecJournalModelFields.ModifyUser, AccountFields.AccountName],
            [SpecJournalSetFields.SpecJournal, SpecJournalModelFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SpecJournalModelFields.JournalId, SpecJournalModelFields.Title, SpecJournalModelFields.ModifyUserId,
                `${SpecJournalModelFields.ModifyUser}.${AccountFields.AccountName}`, SpecJournalModelFields.CreateTime,
                SpecJournalModelFields.ModifyTime, SpecJournalModelFields.InternalId,
            ],
            Condition: condition,
            OrderBy: [{ Col: SpecJournalModelFields.CreateTime, Desc: true },],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const data = item.SpecJournal ?? {};
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                switch (col.key) {
                    case SpecJournalModelFields.CreateTime:
                    case SpecJournalModelFields.ModifyTime:
                        content = FormatDateTime((data as any)[col.key]);
                        break;
                    case SpecJournalModelFields.ModifyUserId:
                        content = item.SpecJournal?.ModifyUser?.AccountName ?? "";
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
