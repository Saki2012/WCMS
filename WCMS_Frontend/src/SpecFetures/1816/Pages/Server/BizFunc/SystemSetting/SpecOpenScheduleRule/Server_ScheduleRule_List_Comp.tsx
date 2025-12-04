import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo, useState } from "react"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { components } from "@/types/api";
import { useFormatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDate, FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import SpecOpenScheduleRuleProvider from "@/SpecFetures/1816/Hooks/BizFunc/Calendar/SpecOpenScheduleRule_Api";
import { AccountFields, SpecCategoryModelFields, SpecOpenScheduleRuleModelFields, SpecOpenScheduleRuleSetFields } from "@/types/SchemaFields";
type SpecOpenScheduleRuleSet = components["schemas"]["SpecOpenScheduleRuleSet_DTO"]
/** 公告列表
 * @returns 
 */
export const Server_ScheduleRule_List_Comp = (prop: { title: string; theme: IBETheme; }) => {
    const [kw, setKw] = useState<string>("");
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const pvd = useMemo(() => SpecOpenScheduleRuleProvider(), []);
    const useScheduleData = useScheduleList(pvd, kw);
    const actions = useActions(dirUrl, pvd, undefined, undefined, useScheduleData.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(useScheduleData.gridProps, useScheduleData.rawData, actions); }, [useScheduleData.gridProps, useScheduleData.rawData, actions]);
    const isLoading = useMemo(() => [useScheduleData.isLoading], [useScheduleData.isLoading]);
    const errors = useMemo(() => [useScheduleData.error], [useScheduleData.error]);
    const searchCompProp: SearchBarProps = { title: "公告搜尋", subTitle: "搜尋公告 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), };
    return (<ListComp Title={prop.title} Theme={prop.theme} LoadingList={isLoading} ErrorList={errors} Actions={actions} GridData={adjustedGrid} SearchBar={searchCompProp}></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: SpecOpenScheduleRuleSet[], actions: UseActionsResult): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const curData = rawData?.[index]
        const internalId = curData?.SpecOpenScheduleRule?.InternalId ?? "";
        const newCell: RowCell = {
            col: adjustCol,
            content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />)
        };
        return { ...row, cells: [...row.cells, newCell] };
    });
    return { ...gridProps, columns: newColumns, rows: newRows };
};

const useScheduleList = (provider: IDataProvider<SpecOpenScheduleRuleSet>, query: string) => {
    let condition: string = '';
    if (!!query) condition = LibMerge(" And ", false, condition, `${SpecOpenScheduleRuleModelFields.AcademicYearId} Like ${query}`)
    return useFetchGridListData<SpecOpenScheduleRuleSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.AcademicYearId],
            [SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.AcademicStart],
            [SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.AcademicEnd],
            [SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.CreateTime],
            [SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.ModifyUserId],
            [SpecOpenScheduleRuleModelFields.ModifyUser, AccountFields.AccountName],
            [SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SpecOpenScheduleRuleModelFields.AcademicYearId,
                SpecOpenScheduleRuleModelFields.AcademicStart,
                SpecOpenScheduleRuleModelFields.AcademicEnd,
                SpecOpenScheduleRuleModelFields.CreateTime,
                SpecOpenScheduleRuleModelFields.ModifyUserId,
                `${SpecOpenScheduleRuleModelFields.ModifyUser}.${AccountFields.AccountName}`,
                SpecOpenScheduleRuleModelFields.CreateTime,
                SpecOpenScheduleRuleModelFields.ModifyTime,
                SpecOpenScheduleRuleModelFields.InternalId,
            ],
            Condition: condition,
            OrderBy: [
                { Col: SpecOpenScheduleRuleModelFields.CreateTime, Desc: true },
            ],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const data = item.SpecOpenScheduleRule ?? {};
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                switch (col.key) {
                    case SpecOpenScheduleRuleModelFields.CreateTime:
                    case SpecOpenScheduleRuleModelFields.ModifyTime:
                        content = FormatDateTime((data as any)[col.key]);
                        break;

                    case SpecOpenScheduleRuleModelFields.ModifyUserId:
                        content = item.SpecOpenScheduleRule?.ModifyUser?.AccountName ?? "";
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
        deps: [query],
    });
};
