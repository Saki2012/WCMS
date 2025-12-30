
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useEffect, useMemo, useState } from "react"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { components } from "@/types/api";
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import { AccountFields, RoleDataModelFields, RolePermissionSetFields } from "@/types/SchemaFields";
import RolePermissionProvider, { usePermissionCatalog } from "@/Features/Hooks/BizFunc/AccountManage/RolePermission/RolePermission_Api";
type RolePermissionSet = components["schemas"]["RolePermissionSet_DTO"]
/** 公告列表
 * @returns 
 */
export const Server_RolePermission_Comp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const provider = useMemo(() => RolePermissionProvider(), []);



    const useRolePermissionList = useList(provider, prop.lang, kw);
    const actions = useActions(dirUrl, provider, undefined, undefined, useRolePermissionList.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(useRolePermissionList.gridProps, useRolePermissionList.rawData, actions); }, [useRolePermissionList.gridProps, useRolePermissionList.rawData, actions]);
    const isLoading = useMemo(() => [useRolePermissionList.isLoading], [useRolePermissionList.isLoading]);
    const errors = useMemo(() => [useRolePermissionList.error], [useRolePermissionList.error]);
    const searchCompProp: SearchBarProps = { title: "公告搜尋", subTitle: "搜尋公告 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), };
    return (<ListComp Title={prop.title} Theme={prop.theme} LoadingList={isLoading} ErrorList={errors} Actions={actions} GridData={adjustedGrid} SearchBar={searchCompProp}></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: RolePermissionSet[], actions: UseActionsResult): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const curData = rawData?.[index]
        const internalId = curData?.RoleData?.InternalId ?? "";
        const newCell: RowCell = { col: adjustCol, content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />) };
        return { ...row, cells: [...row.cells, newCell] };
    });
    return { ...gridProps, columns: newColumns, rows: newRows };
};

const useList = (provider: IDataProvider<RolePermissionSet>, lang: Lang, query: string) => {
    let condition: string = ``;
    if (!!query) condition = LibMerge(" And ", false, condition, `${RoleDataModelFields.RoleName} Like ${query}`)
    return useFetchGridListData<RolePermissionSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [RolePermissionSetFields.RoleData, RoleDataModelFields.RoleName],
            [RolePermissionSetFields.RoleData, RoleDataModelFields.CreateTime],
            [RolePermissionSetFields.RoleData, RoleDataModelFields.ModifyUserId],
            [RoleDataModelFields.ModifyUser, AccountFields.AccountName],
            [RolePermissionSetFields.RoleData, RoleDataModelFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                RoleDataModelFields.InternalId,
                RoleDataModelFields.RoleName,
                RoleDataModelFields.ModifyUserId,
                `${RoleDataModelFields.ModifyUser}.${AccountFields.AccountName}`,
                RoleDataModelFields.CreateTime,
                RoleDataModelFields.ModifyTime,
                RoleDataModelFields.RoleName,
            ],
            Condition: condition,
            OrderBy: [
                { Col: RoleDataModelFields.CreateTime, Desc: true },
            ],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const data = item.RoleData ?? {};
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                switch (col.key) {
                    case RoleDataModelFields.CreateTime:
                    case RoleDataModelFields.ModifyTime:
                        content = FormatDateTime((data as any)[col.key]);
                        break;
                    case RoleDataModelFields.ModifyUserId:
                        content = data?.ModifyUser?.AccountName ?? "";
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
