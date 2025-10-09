import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useMemo } from "react"
import { useLocation } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { ListCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data"
import type { components } from "@/types/api";
type BannerSet = components["schemas"]["BannerSet_DTO"]
import { useBannerListData } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Hook"
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions"
import { GridCol_Toolbar } from "../../../Scaffold/Toolbar/Toolbar_Comp"
import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api"

/** 廣告輪播清單
 * @returns 
 */
export const BannerSliderListComp = ({ title, theme }: { title: string; theme: IBETheme }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);
    const bannerList = useBannerListData();
    const actions = useActions(dirUrl, BannerSliderProvider(), undefined, undefined, bannerList.refetchCurrent)
    const adjustedGrid = useMemo(() => { return SetAdjustFunction(bannerList.gridProps, bannerList.rawData, actions); }, [bannerList.gridProps, bannerList.rawData, actions]);
    const searchCompProp: SearchBarProps = { title: "廣告輪播搜尋", subTitle: "搜尋廣告輪播 ...", settingTitle: "搜尋設定", }
    const isLoading = [bannerList.isLoading];
    const errors = [bannerList.error];
    const prop: ListCompProp = { Title: title, Theme: theme, LoadingList: isLoading, ErrorList: errors, Actions: actions, GridData: adjustedGrid, SearchBar: searchCompProp }
    return (<ListComp prop={prop}></ListComp>);
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
