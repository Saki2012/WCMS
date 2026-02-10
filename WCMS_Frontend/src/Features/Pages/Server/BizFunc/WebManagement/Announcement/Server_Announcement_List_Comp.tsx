import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo, useState } from "react"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { components } from "@/types/api";
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
import { PGID } from "@/Features/Hooks/Common/ProgId";
import { AnnouncementDetailFields, AnnouncementFields, AnnouncementSetFields, AccountFields } from "@/types/SchemaFields";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
/** 公告列表
 * @returns 
 */
export const Server_AnnouncementListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = { title: "公告搜尋", subTitle: "搜尋公告 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), };
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const provider = useMemo(() => AnnouncementProvider(), []);
    const useCategory = useCategoryListData(PGID.Announcement, prop.lang);
    const useAnnounceList = useAnnouncementList(provider, prop.lang, kw);
    const actions = useActions(dirUrl, provider, undefined, undefined, useAnnounceList.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(prop.lang, useAnnounceList.gridProps, useAnnounceList.rawData, useCategory.rawData, actions); }, [useAnnounceList.gridProps, useAnnounceList.rawData, useCategory.rawData, actions]);
    const isLoading = useMemo(() => [useAnnounceList.isLoading, useCategory.isLoading], [useAnnounceList.isLoading, useCategory.isLoading]);
    const errors = useMemo(() => [useAnnounceList.error, useCategory.error], [useAnnounceList.error, useCategory.error]);
    return (<ListComp Title={prop.title} Theme={prop.theme} LoadingList={isLoading} ErrorList={errors} Actions={actions} GridData={adjustedGrid} SearchBar={searchCompProp}></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (lang: Lang, gridProps: GridProps, rawData: AnnouncementSet[], categoryData: CategoryDataSet[],
    actions: UseActionsResult
): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const curData = rawData?.[index]
        const titleCell = row.cells.find(cell => cell.col.key === AnnouncementDetailFields.Title)
        if (titleCell) {
            const titleText = curData.AnnouncementDetail?.find(p => p.Lang === lang)?.Title
            titleCell.content = (<>{titleText}{GetDataStatusContent(curData?.Announcement?.ContentStatus ?? 0)}</>);
        }
        const categoryCell = row.cells.find(p => p.col.key === AnnouncementFields.Categories);
        const rawCatId = curData?.Announcement?.Categories ?? categoryCell?.content?.toString() ?? "";
        if (categoryCell) { categoryCell.content = useFormatCategoriesName(rawCatId, categoryData, lang); }
        const internalId = curData?.Announcement?.InternalId ?? "";
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
    if (contentStatus & 1) { statusItems.push(<div key="top" className="icon-small top-bg">置頂</div>); }
    if (contentStatus & 2) { statusItems.push(<div key="hot" className="icon-small hot-bg">熱門</div>); }
    if (contentStatus & 4) { statusItems.push(<div key="hide" className="icon-small hide-bg">隱藏</div>); }
    return <div className="CustomState">{statusItems}</div>
};

const useAnnouncementList = (provider: IDataProvider<AnnouncementSet>, lang: Lang, query: string) => {
    let condition: string = `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang} = ${lang}`;
    if (!!query) condition = LibMerge(" And ", false, condition, `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} Like ${query}`)
    return useFetchGridListData<AnnouncementSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [AnnouncementSetFields.Announcement, AnnouncementFields.Categories],
            [AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.Title],
            [AnnouncementSetFields.Announcement, AnnouncementFields.Validate_Start],
            [AnnouncementSetFields.Announcement, AnnouncementFields.CreateTime],
            [AnnouncementSetFields.Announcement, AnnouncementFields.ModifyUserId],
            [AnnouncementFields.ModifyUser, AccountFields.AccountName],
            [AnnouncementSetFields.Announcement, AnnouncementFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                AnnouncementFields.AnnouncementId,
                AnnouncementFields.Categories,
                AnnouncementFields.ContentStatus,
                `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
                `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
                AnnouncementFields.Validate_Start,
                AnnouncementFields.ModifyUserId,
                `${AnnouncementFields.ModifyUser}.${AccountFields.AccountName}`,
                AnnouncementFields.CreateTime,
                AnnouncementFields.ModifyTime,
                AnnouncementFields.InternalId,
            ],
            Condition: condition,
            RankGroups: [{ Condition: `${AnnouncementFields.ContentStatus} & 1` }],
            OrderBy: [
                { Col: AnnouncementFields.CreateTime, Desc: true },
            ],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const data = item.Announcement ?? {};
            const cells: RowCell[] = columns.map(col => {
                let content = "";

                switch (col.key) {
                    case AnnouncementDetailFields.Title:
                        content = item.AnnouncementDetail?.find(d => d.Lang === lang)?.Title ?? "";
                        break;
                    case AnnouncementFields.Validate_Start:
                        content = FormatDate((data as any)[col.key]);
                        break;
                    case AnnouncementFields.CreateTime:
                    case AnnouncementFields.ModifyTime:
                        content = FormatDateTime((data as any)[col.key]);
                        break;

                    case AnnouncementFields.ModifyUserId:
                        content = item.Announcement?.ModifyUser?.AccountName ?? "";
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
