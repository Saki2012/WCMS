import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo, useState } from "react"
import { useLocation } from 'react-router-dom';
import { GallerySetFields, GalleryFields, GalleryInfoFields } from "@/types/SchemaFields"
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient"
import type { components } from "@/types/api";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions";
import GalleryProvider from "@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
type GallerySet = components["schemas"]["GallerySet_DTO"]

/** 相簿清單
 * @returns 
 */
export const Server_GalleryListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const provider = useMemo(() => GalleryProvider(), []);
    const useGalleryList = useGalleryListData(provider, prop.lang, kw);
    const actions = useActions(dirUrl, GalleryProvider(), undefined, undefined, useGalleryList.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(useGalleryList.gridProps, useGalleryList.rawData, actions); }, [useGalleryList.gridProps, useGalleryList.rawData, actions]);
    const searchCompProp: SearchBarProps = { title: "相簿搜尋", subTitle: "搜尋相簿 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), };
    const isLoading = [useGalleryList.isLoading];
    const errors = [useGalleryList.error];
    return (<ListComp Title={prop.title} Theme={prop.theme} LoadingList={isLoading} ErrorList={errors} Actions={actions} GridData={adjustedGrid} SearchBar={searchCompProp}></ListComp>);
}
/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: GallerySet[], actions: UseActionsResult): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const internalId = rawData?.[index]?.Gallery?.InternalId ?? "";
        const pic = row.cells.find(cell => cell.col.key === GalleryFields.CoverPicSrcId);
        const title = row.cells.find(cell => cell.col.key === GalleryInfoFields.Title)?.content?.toString();
        if (pic) {
            const coverPicId = pic.content?.toString(); // 轉成字串
            pic.content = (
                <>
                    <img src={`${FileManagementAPI.PREVIEW_URL}/${coverPicId}`} alt={title} style={{ width: "80px", height: "80px", objectFit: "cover" }} />
                </>
            );
        }
        const newCell: RowCell = {
            col: adjustCol,
            content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />)
        };
        return { ...row, cells: [...row.cells, newCell] };
    });
    return { ...gridProps, columns: newColumns, rows: newRows };
}

const useGalleryListData = (provider: IDataProvider<GallerySet>, lang: Lang, query: string) => {
    let condition: string = `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang} = ${lang}`;
    if (!!query) condition = LibMerge(" And ", false, condition, `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title} Like ${query}`)
    return useFetchGridListData<GallerySet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [GallerySetFields.Gallery, GalleryFields.CoverPicSrcId],
            [GallerySetFields.GalleryInfo, GalleryInfoFields.Title],
            [GallerySetFields.Gallery, GalleryFields.CreateTime],
            [GallerySetFields.Gallery, GalleryFields.ModifyTime],
            [GallerySetFields.Gallery, GalleryFields.ModifyUserId],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                GalleryFields.InternalId,
                GalleryFields.GalleryId,
                GalleryFields.CoverPicSrcId,
                `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title}`,
                `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang}`,
                GalleryFields.CreateTime,
                GalleryFields.ModifyTime,
                GalleryFields.ModifyUserId,
            ],
            Condition: condition,
            OrderBy: [
                { Col: GalleryFields.CreateTime, Desc: true },
            ],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const data = item.Gallery ?? {};
            const dt = item.GalleryInfo?.find(p => p.Lang === "zh-tw");
            const cells: RowCell[] = columns.map(col => {
                let content: any = "";
                switch (col.key) {
                    case GalleryInfoFields.Title:
                        content = dt?.Title;
                        break;
                    case GalleryFields.CreateTime:
                    case GalleryFields.ModifyTime:
                        content = FormatDateTime((data as any)[col.key]);
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
