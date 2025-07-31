import type{SearchBarProps} from "../../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type {IBETheme} from "../../../../../../Features/Server/Layout/Theme/ITheme"
import type { GridProps,ColumnConfig,GridRow,RowCell } from "../../../../../../SysCore/Components/Grid/Grid_Data"
import { useMemo } from "react"
import { Link } from "react-router"
import { useLocation } from 'react-router-dom';
import { ListComp } from "../../../Scaffold/Content/List_Comp"
import type { ListCompProp } from "../../../Scaffold/Content/Content_Data"
import * as React from "react";
import  type { components } from "../../../../../../types/api";
import { handleDelete } from "./Announcement_Hook"
type AnnouncementSet = components["schemas"]["AnnouncementSet"]

import { useListToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import AnnouncementProvider from "./Announcement_Api"
import { useFetchGridListData } from "../../../../../../SysCore/Utils/FetchGridListData"

import * as SchemaFields from "../../../../../../types/SchemaFields";
import { FormatDateTime } from "../../../../../../SysCore/Utils/LibData"



const useAnnouncementList = () => {
  const provider = AnnouncementProvider();
  return useFetchGridListData<AnnouncementSet>({
    getModelDisplayName: () => provider.getModelDisplayName(),
    fetchList: (cond) => provider.fetchList(cond),
    fetchListCount: (cond) => provider.fetchListCount(cond),
    visibleKeys: [
      [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.Categories],
      [SchemaFields.AnnouncementSetFields.AnnouncementDetail, SchemaFields.AnnouncementDetailFields.Title],
      [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.DataStatus],
      [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.ModifyUserId],
      [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.ModifyTime]
    ],
    buildQueryCondition: (page) => ({
      Fields: [
        SchemaFields.AnnouncementFields.AnnouncementId,
        SchemaFields.AnnouncementFields.Categories,
        `${SchemaFields.AnnouncementSetFields.AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Lang}`,
        `${SchemaFields.AnnouncementSetFields.AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Title}`,
        SchemaFields.PageManagementFields.ModifyUserId,
        SchemaFields.PageManagementFields.ModifyTime,
        SchemaFields.PageManagementFields.InternalId
      ],
      Condition: "",
      PageNumber: page,
      PageSize: 10
    }),
    parseRow: (item, columns) => {
      const data = item.Announcement ?? {};
      const cells: RowCell[] = columns.map(col => {
        let content = "";
        if (col.key === SchemaFields.AnnouncementDetailFields.Title) {
          content = data.AnnouncementDetail?.find(d => d.Lang === "zh-tw")?.Title ?? "";
        } else if (col.key === SchemaFields.AnnouncementFields.ModifyTime) {
          content = FormatDateTime((data as any)[col.key]);
        } else {
          content = (data as any)[col.key] ?? "";
        }
        return { col, content };
      });
      return { cells };
    }
  });
};



/** 公告列表
 * @returns 
 */
export const AnnouncementListComp = ({title,theme}:{title:string;theme:IBETheme}) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);


    const useAnnounceList = useAnnouncementList();


    const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, useAnnounceList.gridProps, useAnnounceList.rawData);}, [useAnnounceList.gridProps, useAnnounceList.rawData]);
    const useToolbar = useListToolbarActions(dirUrl)
    const isLoading=[useAnnounceList.isLoading];
    const errors=[useAnnounceList.error];
    const searchCompProp:SearchBarProps={
            title:"公告搜尋",
            subTitle:"搜尋公告 ...",
            settingTitle: "搜尋設定",
        }
    const prop:ListCompProp={ Title:title, Theme:theme, LoadingList:isLoading, ErrorList:errors, Toolbar:useToolbar.toolbarActions,GridData:adjustedGrid, SearchBar:searchCompProp}

    return (
            <ListComp prop={prop}></ListComp>
    );
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (dirUrl: string, gridProps: GridProps, rawData: AnnouncementSet[]): GridProps => {
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    // if (gridProps.rows.length === 0) return gridProps;

    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];

    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const statusCell = row.cells.find(cell => cell.col.key === "DataStatus");
        if (statusCell && typeof statusCell.content === 'number') {
            statusCell.content = GetDataStatusContent(statusCell.content);
        }

        const internalId = rawData?.[index]?.Announcement?.InternalId ?? "";

        const newCell: RowCell = {
            col: adjustCol,
            content: (
                <div className="all-btn Edit Icon">
                    <Link id="edit" className="icon" to={`${dirUrl}/${internalId}`} target="_self">
                        <button type="button" className="Ipencil btn btn-ctm btn-ctm-rounded" data-bs-toggle="tooltip" title="內容編輯">
                            <i className="far fa-edit"></i>
                        </button>
                    </Link>
                    <a id="trash" className="icon" onClick={() => handleDelete(internalId)} data-bs-toggle="modal" data-bs-target="#All_Delete">
                        <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" data-bs-toggle="tooltip" title="刪除頁面">
                            <i className="far fa-trash-alt"></i>
                        </button>
                    </a>
                </div>
            )
        };

        return { ...row, cells: [...row.cells, newCell] };
    });

    return { ...gridProps, columns: newColumns, rows: newRows };
};

/** 目前說只有公告/檔案室/網路資源/相簿會用到 */
const GetDataStatusContent = (datastatus: number): React.ReactNode => {
  switch (datastatus) {
    case 0:
        return <div className="CustomState">
                    <div className="icon-small top-bg">置頂</div>
                </div>;
    case 1:
        return  <div className="CustomState">
                    <div className="icon-small hot-bg">熱門</div>
                </div>;
    case 2:
      return    <div className="CustomState">
                    <div className="icon-small new-bg">最新</div>
                </div>;
    case 3:
        return  <div className="CustomState">
                    <div className="icon-small hide-bg">隱藏</div>
                </div>;
    default:
      return <span>未知狀態</span>;
  }
};