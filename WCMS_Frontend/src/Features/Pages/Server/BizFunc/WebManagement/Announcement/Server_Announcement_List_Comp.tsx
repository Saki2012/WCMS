import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo, useState } from "react"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { useCategoryListData, useFormatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import AnnouncementProvider from "@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDate, FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
/** 公告列表
 * @returns 
 */
export const Server_AnnouncementListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const provider = useMemo(() => AnnouncementProvider(), []);
    const useCategory = useCategoryListData("Announcement", prop.lang);
    const useAnnounceList = useAnnouncementList(provider, prop.lang, kw);
    const actions = useActions(dirUrl, provider, undefined, undefined, useAnnounceList.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(useAnnounceList.gridProps, useAnnounceList.rawData, useCategory.rawData, actions); }, [useAnnounceList.gridProps, useAnnounceList.rawData, useCategory.rawData, actions]);
    const isLoading = useMemo(() => [useAnnounceList.isLoading, useCategory.isLoading], [useAnnounceList.isLoading, useCategory.isLoading]);
    const errors = useMemo(() => [useAnnounceList.error, useCategory.error], [useAnnounceList.error, useCategory.error]);
    const searchCompProp: SearchBarProps = { title: "公告搜尋", subTitle: "搜尋公告 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), };
    return (<ListComp Title={prop.title} Theme={prop.theme} LoadingList={isLoading} ErrorList={errors} Actions={actions} GridData={adjustedGrid} SearchBar={searchCompProp}></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: AnnouncementSet[], categoryData: CategoryDataSet[],
    actions: UseActionsResult
): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const statusCell = row.cells.find(cell => cell.col.key === SchemaFields.AnnouncementFields.ContentStatus);
        if (statusCell && typeof statusCell.content === 'number') { statusCell.content = GetDataStatusContent(statusCell.content); }
        const categoryCell = row.cells.find(p => p.col.key === SchemaFields.AnnouncementFields.Categories);
        const rawCatId = rawData?.[index]?.Announcement?.Categories ?? categoryCell?.content?.toString() ?? "";
        if (categoryCell) { categoryCell.content = useFormatCategoriesName(rawCatId, categoryData); }
        const internalId = rawData?.[index]?.Announcement?.InternalId ?? "";
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

const useAnnouncementList = (provider: IDataProvider<AnnouncementSet>, lang: Lang, query: string) => {
    let condition: string = `${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Lang} = ${lang}`;
    if (!!query) condition = LibMerge(" And ", false, condition, `${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Title} Like ${query}`)
    return useFetchGridListData<AnnouncementSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.Categories],
            [SchemaFields.AnnouncementSetFields.AnnouncementDetail, SchemaFields.AnnouncementDetailFields.Title],
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.ContentStatus],
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.Validate_Start],
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.CreateTime],
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.ModifyUserId],
            [SchemaFields.AnnouncementFields.ModifyUser, SchemaFields.UserModelFields.UserName],
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.AnnouncementFields.AnnouncementId,
                SchemaFields.AnnouncementFields.Categories,
                SchemaFields.AnnouncementFields.ContentStatus,
                `${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Lang}`,
                `${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Title}`,
                SchemaFields.AnnouncementFields.Validate_Start,
                SchemaFields.AnnouncementFields.ModifyUserId,
                `${SchemaFields.AnnouncementFields.ModifyUser}.${SchemaFields.UserModelFields.UserName}`,
                SchemaFields.AnnouncementFields.CreateTime,
                SchemaFields.AnnouncementFields.ModifyTime,
                SchemaFields.AnnouncementFields.InternalId,
            ],
            Condition: condition,
            OrderBy: [
                { Col: SchemaFields.AnnouncementFields.CreateTime, Desc: true },
            ],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const data = item.Announcement ?? {};
            const cells: RowCell[] = columns.map(col => {
                let content = "";

                switch (col.key) {
                    case SchemaFields.AnnouncementDetailFields.Title:
                        content = item.AnnouncementDetail?.find(d => d.Lang === "zh-tw")?.Title ?? "";
                        break;
                    case SchemaFields.AnnouncementFields.Validate_Start:
                        content = FormatDate((data as any)[col.key]);
                        break;
                    case SchemaFields.AnnouncementFields.CreateTime:
                    case SchemaFields.AnnouncementFields.ModifyTime:
                        content = FormatDateTime((data as any)[col.key]);
                        break;

                    case SchemaFields.AnnouncementFields.ModifyUserId:
                        content = item.Announcement?.ModifyUser?.UserName ?? "";
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
