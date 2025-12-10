import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo, useState } from "react"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { components } from "@/types/api";
import { WebResourceSetFields, WebResourceFields, WebResourceInfoFields } from "@/types/SchemaFields";
import { useCategoryListData, useFormatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook"
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions"
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp"
import WebResourceProvider from "@/Features/Hooks/BizFunc/WebManagement/WebResource/WebResource_Api";
import { PGID } from "@/Features/Hooks/Common/ProgId";
import type { Lang } from "@/SysCore/i18n/lang";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]

/** 網路資源清單
 * @returns 
 */
export const WebResourceListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const provider = useMemo(() => WebResourceProvider(), []);
    const useListData = useWebResourceListData(provider, prop.lang, kw);
    const useCategory = useCategoryListData(PGID.WebResource, prop.lang);
    const actions = useActions(dirUrl, WebResourceProvider(), undefined, undefined, useListData.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(useListData.gridProps, useListData.rawData, useCategory.rawData, actions); }, [useListData.gridProps, useListData.rawData, useCategory.rawData, actions]);
    const searchCompProp: SearchBarProps = { title: "網路資源搜尋", subTitle: "搜尋網路資源 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), };
    const isLoading = [useListData.isLoading];
    const errors = [useListData.error];
    return (<ListComp Title={prop.title} Theme={prop.theme} LoadingList={isLoading} ErrorList={errors} Actions={actions} GridData={adjustedGrid} SearchBar={searchCompProp}></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: WebResourceSet[], categoryData: CategoryDataSet[], actions: UseActionsResult): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const curData = rawData?.[index];
        const titleCell = row.cells.find(cell => cell.col.key === WebResourceInfoFields.Title);
        if (titleCell) { titleCell.content = (<>{titleCell.content}{GetDataStatusContent(curData?.WebResource?.ContentStatus ?? 0)}</>); }
        const categoryCell = row.cells.find(p => p.col.key === WebResourceFields.Categories);
        const rawCatId = rawData?.[index]?.WebResource?.Categories ?? categoryCell?.content?.toString() ?? "";
        if (categoryCell) { categoryCell.content = useFormatCategoriesName(rawCatId, categoryData); }
        const internalId = rawData?.[index]?.WebResource?.InternalId ?? "";
        const newCell: RowCell = {
            col: adjustCol,
            content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />)
        };
        return { ...row, cells: [...row.cells, newCell] };
    });
    return { ...gridProps, columns: newColumns, rows: newRows };
};

/** 目前說只有公告/檔案室/網路資源/相簿會用到 */
const GetDataStatusContent = (contentStatus: number): React.ReactNode => {
    const statusItems: React.ReactNode[] = [];
    if (contentStatus & 1) { statusItems.push(<div className="icon-small top-bg">置頂</div>); }
    if (contentStatus & 2) { statusItems.push(<div className="icon-small hot-bg">熱門</div>); }
    if (contentStatus & 4) { statusItems.push(<div className="icon-small hide-bg">隱藏</div>); }
    return <div className="CustomState">{statusItems}</div>
};

const useWebResourceListData = (provider: IDataProvider<WebResourceSet>, lang: Lang, query: string) => {
    let condition: string = `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang} = ${lang}`;
    if (!!query) condition = LibMerge(" And ", false, condition, `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title} Like ${query}`)
    return useFetchGridListData<WebResourceSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [WebResourceSetFields.WebResource, WebResourceFields.Categories],
            [WebResourceSetFields.WebResourceInfo, WebResourceInfoFields.Title],
            [WebResourceSetFields.WebResource, WebResourceFields.CreateTime],
            [WebResourceSetFields.WebResource, WebResourceFields.ModifyUserId],
            [WebResourceSetFields.WebResource, WebResourceFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                WebResourceFields.InternalId,
                WebResourceFields.WebResourceId,
                WebResourceFields.Categories,
                WebResourceFields.ContentStatus,
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang}`,
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title}`,
                WebResourceFields.ModifyUserId,
                WebResourceFields.CreateTime,
                WebResourceFields.ModifyTime,
                WebResourceFields.InternalId,
            ],
            Condition: condition,
            OrderBy: [
                { Col: WebResourceFields.CreateTime, Desc: true },
            ],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const data = item.WebResource ?? {};
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                switch (col.key) {
                    case WebResourceInfoFields.Title:
                        {
                            content = item.WebResourceInfo?.find(d => d.Lang === "zh-tw")?.Title ?? "";
                            break;
                        }
                    case WebResourceFields.CreateTime:
                    case WebResourceFields.ModifyTime:
                        {
                            content = FormatDateTime((data as any)[col.key]);
                            break;
                        }
                    default:
                        {
                            content = (data as any)[col.key] ?? "";
                            break;
                        }
                }
                return { col, content };
            });
            return { cells };
        },
        enabled: true,
        deps: [lang, query],
    });
};