import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo, useState } from "react"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { components } from "@/types/api"
import { useFormatSpecCategoriesName, useSpecCateListData } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Hook"
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions"
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp"
import SpecResearchProvider from "@/SpecFetures/1810/Hooks/SpecResearch/SpecResearch_Api"
import type { Lang } from "@/SysCore/i18n/lang";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { SpecResearchDetailModelFields, SpecResearchModelFields, SpecResearchSetFields } from "@/types/SchemaFields";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { SpecPGID } from "@/SpecFetures/1810/Hooks/Common/SpecProgId";
import { useFormatTagsName, useTagListData } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
type SpecResearchSet = components["schemas"]["SpecResearchSet_DTO"]
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]


/** 研究計畫清單
 * @returns 
 */
export const Server_ResearchProjListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = { title: "研究計畫搜尋", subTitle: "搜尋研究計畫 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), };
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const provider = useMemo(() => SpecResearchProvider(), []);
    const useDataList = useSpecResearchList(provider, prop.lang, kw);
    const useCategory = useSpecCateListData(SpecPGID.SpecResearch, prop.lang);
    const useTagData = useTagListData(SpecPGID.SpecResearch, prop.lang);
    const actions = useActions(dirUrl, provider, undefined, undefined, useDataList.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(prop.lang, useDataList.gridProps, useDataList.rawData, useCategory.rawData, useTagData.rawData, actions); }, [useDataList.gridProps, useDataList.rawData, useCategory.rawData, actions]);
    const isLoading = [useDataList.isLoading, useCategory.isLoading];
    const errors = [useDataList.error, useCategory.error];
    return (<ListComp Title={prop.title} Theme={prop.theme} LoadingList={isLoading} ErrorList={errors} Actions={actions} GridData={adjustedGrid} SearchBar={searchCompProp}></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (lang: Lang, gridProps: GridProps, rawData: SpecResearchSet[], cateData: SpecCategorySet[], tagData: TagSet[], actions: UseActionsResult): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const statusCell = row.cells.find(cell => cell.col.key === SpecResearchModelFields.ContentStatus);
        if (statusCell && typeof statusCell.content === 'number') { statusCell.content = GetDataStatusContent(statusCell.content); }
        const categoryCell = row.cells.find(p => p.col.key === SpecResearchModelFields.CategoryId);
        const rawCatId = rawData?.[index]?.SpecResearch?.CategoryId ?? categoryCell?.content?.toString() ?? "";
        if (categoryCell) { categoryCell.content = useFormatSpecCategoriesName(rawCatId, cateData, lang); }
        const tagCell = row.cells.find(p => p.col.key === SpecResearchModelFields.Tags);
        const rawtagId = rawData?.[index]?.SpecResearch?.Tags ?? tagCell?.content?.toString() ?? "";
        if (tagCell) { tagCell.content = useFormatTagsName(rawtagId, tagData, lang); }
        const internalId = rawData?.[index]?.SpecResearch?.InternalId ?? "";
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

const useSpecResearchList = (provider: IDataProvider<SpecResearchSet>, lang: Lang, query: string) => {
    let condition: string = `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Lang} = ${lang}`;
    if (!!query) {
        let queryCdt = ''
        if (/^\d+$/.test(query.trim())) {//如果純數字，就增加條件
            queryCdt = LibMerge(" Or ", false, queryCdt, `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Year} = ${query}`)
            queryCdt = LibMerge(" Or ", false, queryCdt, `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.AcademicYear} = ${query}`)
        }
        queryCdt = LibMerge(" Or ", false, queryCdt, `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.ProjectName} Like ${query}`)
        queryCdt = LibMerge(" Or ", false, queryCdt, `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.PaperTitle} Like ${query}`)
        queryCdt = LibMerge(" Or ", false, queryCdt, `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.CooperationProject} Like ${query}`)
        queryCdt = LibMerge(" Or ", false, queryCdt, `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Courses} Like ${query}`)
        condition = LibMerge(" And ", false, condition, `(${queryCdt})`)
    }


    return useFetchGridListData<SpecResearchSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SpecResearchSetFields.SpecResearch, SpecResearchModelFields.CategoryId],
            [SpecResearchSetFields.SpecResearch, SpecResearchModelFields.Tags],
            [SpecResearchSetFields.SpecResearch, SpecResearchModelFields.ContentStatus],
            [SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Year],
            [SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.AcademicYear],
            [SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.ProjectName],
            [SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.PaperTitle],
            [SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.CooperationProject],
            [SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Courses],
            [SpecResearchSetFields.SpecResearch, SpecResearchModelFields.CreateTime],
            [SpecResearchSetFields.SpecResearch, SpecResearchModelFields.ModifyUserId],
            [SpecResearchSetFields.SpecResearch, SpecResearchModelFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SpecResearchModelFields.ResearchId,
                SpecResearchModelFields.InternalId,
                SpecResearchModelFields.CategoryId,
                SpecResearchModelFields.Tags,
                SpecResearchModelFields.ContentStatus,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Lang}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Year}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.AcademicYear}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.ProjectName}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.PaperTitle}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.CooperationProject}`,
                `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Courses}`,
                SpecResearchModelFields.CreateTime,
                SpecResearchModelFields.ModifyUserId,
                SpecResearchModelFields.ModifyTime,
            ],
            Condition: condition,
            OrderBy: [{ Col: SpecResearchModelFields.CreateTime, Desc: true }],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const data = item.SpecResearch ?? {};
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                switch (col.key) {
                    case SpecResearchDetailModelFields.Year:
                        {
                            content = item.SpecResearchDetail?.find(p => p.Lang === lang)?.Year?.toString() ?? "";
                            break;
                        }
                    case SpecResearchDetailModelFields.AcademicYear:
                        {
                            content = item.SpecResearchDetail?.find(p => p.Lang === lang)?.AcademicYear?.toString()
                                ?? "";
                            break;
                        }
                    case SpecResearchDetailModelFields.ProjectName:
                        {
                            content = item.SpecResearchDetail?.find(p => p.Lang === lang)?.ProjectName ?? "";
                            break;
                        }
                    case SpecResearchDetailModelFields.PaperTitle:
                        {
                            content = item.SpecResearchDetail?.find(p => p.Lang === lang)?.PaperTitle ?? "";
                            break;
                        }
                    case SpecResearchDetailModelFields.CooperationProject:
                        {
                            content = item.SpecResearchDetail?.find(p => p.Lang === lang)?.CooperationProject ?? "";
                            break;
                        }
                    case SpecResearchDetailModelFields.Courses:
                        {
                            content = item.SpecResearchDetail?.find(p => p.Lang === lang)?.Courses ?? "";
                            break;
                        }
                    case SpecResearchModelFields.CreateTime:
                    case SpecResearchModelFields.ModifyTime:
                        {
                            content = FormatDateTime((data as any)[col.key]);
                            break;
                        }
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
