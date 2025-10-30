import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo, useState } from "react"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { components } from "@/types/api"
import { SpecUSRSetFields, SpecUSRModelFields, SpecUSRDetailFields } from "@/types/SchemaFields";
import { useFormatSpecCategoriesName, useSpecCateListData } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Hook"
import { useFormatTagsName, useTagListData } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook"
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions"
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp"
import SpecUSRProvider from "@/SpecFetures/1810/Hooks/SpecUSR/SpecUSR_Api"
import type { Lang } from "@/SysCore/i18n/lang";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { SpecProgId } from "@/SpecFetures/1810/Hooks/Common/SpecProgId";
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"]
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]
/** USR計畫清單
 * @returns 
 */
export const USRProjListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const provider = useMemo(() => SpecUSRProvider(), []);
    const usePageList = useSpecUSRProjList(provider, prop.lang, kw);
    const useCategory = useSpecCateListData(SpecProgId.SpecUSR, prop.lang);
    const useTag = useTagListData(SpecProgId.SpecUSR, prop.lang);
    const actions = useActions(dirUrl, provider, undefined, undefined, usePageList.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(usePageList.gridProps, usePageList.rawData, useCategory.rawData, useTag.rawData, actions); }, [usePageList.gridProps, usePageList.rawData, useCategory.rawData, useTag.rawData, actions]);
    const searchCompProp: SearchBarProps = { title: "USR計畫搜尋", subTitle: "搜尋USR計畫 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), };
    const isLoading = [usePageList.isLoading, useCategory.isLoading, useTag.isLoading];
    const errors = [usePageList.error, useCategory.error, useTag.error];
    return (<ListComp Title={prop.title} Theme={prop.theme} LoadingList={isLoading} ErrorList={errors} Actions={actions} GridData={adjustedGrid} ></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: SpecUSRSet[], cateData: SpecCategorySet[], tagData: TagSet[], actions: UseActionsResult): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const statusCell = row.cells.find(cell => cell.col.key === SpecUSRModelFields.ContentStatus);
        if (statusCell && typeof statusCell.content === 'number') { statusCell.content = GetDataStatusContent(statusCell.content); }
        const categoryCell = row.cells.find(p => p.col.key === SpecUSRModelFields.CategoryId);
        const rawCatId = rawData?.[index]?.SpecUSR?.CategoryId ?? categoryCell?.content?.toString() ?? "";
        if (categoryCell) { categoryCell.content = useFormatSpecCategoriesName(rawCatId, cateData); }
        const tagCell = row.cells.find(p => p.col.key === SpecUSRModelFields.Tags);
        const rawTagId = rawData?.[index]?.SpecUSR?.Tags ?? tagCell?.content?.toString() ?? "";
        if (tagCell) { tagCell.content = useFormatTagsName(rawTagId, tagData); }
        const internalId = rawData?.[index]?.SpecUSR?.InternalId ?? "";
        const newCell: RowCell = { col: adjustCol, content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />) };
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

const useSpecUSRProjList = (provider: IDataProvider<SpecUSRSet>, lang: Lang, query: string) => {
    // let condition: string = `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Lang} = ${lang}`;
    // if (!!query) condition = LibMerge(" And ", false, condition, `${AnnouncementFields._AnnouncementDetail}.${SpecUSRDetailFields.Title} Like ${query}`)
    return useFetchGridListData<SpecUSRSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SpecUSRSetFields.SpecUSR, SpecUSRModelFields.CategoryId],
            [SpecUSRSetFields.SpecUSR, SpecUSRModelFields.Tags],
            [SpecUSRSetFields.SpecUSR, SpecUSRModelFields.ContentStatus],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Year],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.AcademicYear],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectName],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectConcept],
            [SpecUSRSetFields.SpecUSR, SpecUSRModelFields.CreateTime],
            [SpecUSRSetFields.SpecUSR, SpecUSRModelFields.ModifyUserId],
            [SpecUSRSetFields.SpecUSR, SpecUSRModelFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SpecUSRModelFields.CategoryId,
                SpecUSRModelFields.Tags,
                SpecUSRModelFields.ContentStatus,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.RowId}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Lang}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Year}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.AcademicYear}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectName}`,
                `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectConcept}`,
                SpecUSRModelFields.CreateTime,
                SpecUSRModelFields.ModifyUserId,
                SpecUSRModelFields.ModifyTime,
                SpecUSRModelFields.InternalId,
            ],
            Condition: "",
            OrderBy: [{ Col: SpecUSRModelFields.CreateTime, Desc: true }],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const data = item.SpecUSR ?? {};
            const cells: RowCell[] = columns.map(col => {
                let content = "";

                switch (col.key) {
                    case SpecUSRDetailFields.Year:
                        {
                            content = item.SpecUSRDetail?.find(p => p.Lang === lang)?.Year ?? "";
                            break;
                        }
                    case SpecUSRDetailFields.AcademicYear:
                        {
                            content = item.SpecUSRDetail?.find(p => p.Lang === lang)?.AcademicYear?.toString() ?? "";
                            break;
                        }
                    case SpecUSRDetailFields.ProjectName:
                        {
                            content = item.SpecUSRDetail?.find(p => p.Lang === lang)?.ProjectName ?? "";
                            break;
                        }
                    case SpecUSRDetailFields.ProjectConcept:
                        {
                            content = item.SpecUSRDetail?.find(p => p.Lang === lang)?.ProjectConcept ?? "";
                            break;
                        }
                    case SpecUSRModelFields.CreateTime:
                    case SpecUSRModelFields.ModifyTime:
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
