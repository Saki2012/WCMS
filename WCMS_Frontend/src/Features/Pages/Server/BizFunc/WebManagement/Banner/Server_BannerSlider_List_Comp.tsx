import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo, useState } from "react"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { components } from "@/types/api";
import { BannerSetFields, BannerFields, BannerDetailFields, AccountFields } from "@/types/SchemaFields";
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions"
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp"
import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api"
import type { Lang } from "@/SysCore/i18n/lang";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import type { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
type BannerSet = components["schemas"]["BannerSet_DTO"]

/** 廣告輪播清單
 * @returns 
 */
export const BannerSliderListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const provider = useMemo(() => BannerSliderProvider(), []);
    const bannerList = useBannerListData(provider, kw);
    const actions = useActions(dirUrl, provider, undefined, undefined, bannerList.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(bannerList.gridProps, bannerList.rawData, actions); }, [bannerList.gridProps, bannerList.rawData, actions]);
    const searchCompProp: SearchBarProps = { title: "廣告輪播搜尋", subTitle: "搜尋廣告輪播 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), };
    const isLoading = [bannerList.isLoading];
    const errors = [bannerList.error];
    return (<ListComp Title={prop.title} Theme={prop.theme} LoadingList={isLoading} ErrorList={errors} Actions={actions} GridData={adjustedGrid} SearchBar={searchCompProp}></ListComp>);
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: BannerSet[], actions: UseActionsResult): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const internalId = rawData?.[index]?.Banner?.InternalId ?? "";
        const newCell: RowCell = {
            col: adjustCol,
            content: (
                <GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />
            )
        };
        return { ...row, cells: [...row.cells, newCell] };
    });
    return { ...gridProps, columns: newColumns, rows: newRows };
};

const useBannerListData = (provider: IDataProvider<BannerSet>, query: string) => {
    let condition: string = "";
    if (!!query) condition = LibMerge(" And ", false, condition, `${BannerFields.BannerCategoryName} Like ${query}`)
    return useFetchGridListData<BannerSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [BannerDetailFields.PicSrcId, BannerDetailFields.PicSrcId],
            [BannerSetFields.Banner, BannerFields.BannerCategoryName],
            [BannerSetFields.Banner, BannerFields.CreateTime],
            [BannerSetFields.Banner, BannerFields.ModifyUserId],
            [BannerFields.ModifyUser, AccountFields.AccountName],
            [BannerSetFields.Banner, BannerFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                BannerFields.InternalId,
                BannerFields.BannerId,
                BannerFields.BannerCategoryName,
                // 缺Name
                BannerFields.ModifyUserId,
                // 缺Name
                BannerFields.CreateTime,
                BannerFields.ModifyTime,
            ],
            Condition: condition,
            OrderBy: [
                { Col: BannerFields.CreateTime, Desc: true },
            ],
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                switch (col.key) {
                    case BannerFields.CreateTime:
                    case BannerFields.ModifyTime:
                        {
                            content = FormatDateTime(item.Banner?.ModifyTime) ?? "";
                            break;
                        }
                    default:
                        {
                            content = (item.Banner as any)[col.key] ?? "";
                            break;
                        }
                }
                return { col, content };
            });
            return { cells };
        },
        enabled: true,
        deps: [query],
    });
};
