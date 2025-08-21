/**公告清單 */
import { useMemo } from "react";
import type { GridProps } from "../../../../../SysCore/Components/Grid/Grid_Data";
import type { components } from "../../../../../types/api";
import type { IFETheme } from "../../Theme/ITheme";
type AnnouncementSet = components["schemas"]["AnnouncementSet"];
type AnnouncementDetail = components["schemas"]["AnnouncementDetail"];
import { Link, useLocation } from "react-router-dom";
import type { GridRow } from "../../../../../SysCore/Components/Grid/Grid_Data";
import type { RowCell } from "../../../../../SysCore/Components/Grid/Grid_Data";
import { useFetchGridListData } from "../../../../../SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "../../../../../SysCore/Utils/Library/LibData";
import * as SchemaFields from "../../../../../types/SchemaFields";
import AnnouncementProvider from "../../../../Server/Layout/BizFunc/WebManagement/Announcement/Announcement_Api";

import { GridViewContentComp } from "../../Scaffold/ContentViewMode/GridView/GridView/GridContent_Comp";
import { Merge } from "../../../../../SysCore/Utils/Library/LibMergeData";
import type { Lang } from "../../../../../SysCore/i18n/lang";

const useAnnouncementList = (lang: string, categoryIds: string, tagIds: string) => {

    var condition: string = "";
    // if (categoryIds) condition = Merge(" And ", false, condition, `${SchemaFields.AnnouncementFields.Categories} In ('${categoryIds}')`)
    // if (tagIds) condition = Merge(" And ", false, condition, `${SchemaFields.AnnouncementFields.Tags} In ('${tagIds}')`)
    console.log(condition)
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
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.ModifyTime],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.AnnouncementFields.AnnouncementId,
                SchemaFields.AnnouncementFields.Categories,
                `${SchemaFields.AnnouncementSetFields.AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Lang}`,
                `${SchemaFields.AnnouncementSetFields.AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Title}`,
                SchemaFields.PageManagementFields.ModifyUserId,
                SchemaFields.PageManagementFields.ModifyTime,
                SchemaFields.PageManagementFields.InternalId,
            ],
            Condition: condition,
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) => {
            const data = item.Announcement ?? {};
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                if (col.key === SchemaFields.AnnouncementDetailFields.Title) {
                    content = data.AnnouncementDetail?.find(d => d.Lang === lang)?.Title ?? "";
                } else if (col.key === SchemaFields.AnnouncementFields.ModifyTime) {
                    content = FormatDateTime((data as any)[col.key]);
                } else {
                    content = (data as any)[col.key] ?? "";
                }
                return { col, content };
            });
            return { cells };
        },
    });
};


export interface IAnnouncementListOptions { Category?: string; Tag?: string; Style: number; }
interface IAnnouncementListProps { Theme: IFETheme; Lang: string | Lang; Options?: IAnnouncementListOptions; }

export const AnnouncementList = (props: IAnnouncementListProps) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);
    const useAnnounceList = useAnnouncementList(props.Lang, props.Options?.Category ?? "", props.Options?.Tag ?? "");
    const adjustedGrid = useMemo(() => {
        return SetAdjustFunction(dirUrl, useAnnounceList.gridProps, useAnnounceList.rawData);
    }, [useAnnounceList.gridProps, useAnnounceList.rawData]);
    const isLoading = [useAnnounceList.isLoading];
    const errors = [useAnnounceList.error];
    return <GridViewContentComp GridData={adjustedGrid} Theme={props.Theme} LoadingList={isLoading} ErrorList={errors} />;
};

const SetAdjustFunction = (dirUrl: string, gridProps: GridProps, rawData: AnnouncementSet[]): GridProps => {
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const internalId = rawData?.[index]?.Announcement?.InternalId ?? "";
        const title = rawData?.[index]?.Announcement?.AnnouncementDetail?.Title ?? "";
        const titleId = `title-${internalId}`;
        const newCells = row.cells.map((cell) => {
            const isTitle = cell.col.key === SchemaFields.AnnouncementDetailFields.Title;
            return {
                ...cell,
                content: (
                    <Link
                        to={`${dirUrl}/${internalId}`}
                        className="link-cell"
                        id={isTitle ? titleId : undefined}
                        aria-label={isTitle ? `前往 ${title} 的詳細頁面` : undefined}
                        aria-labelledby={isTitle ? undefined : titleId}
                    >
                        <span aria-hidden={!isTitle}>
                            {cell.content}
                        </span>
                    </Link>
                ),
            };
        });
        return { ...row, cells: newCells };
    });
    return { ...gridProps, rows: newRows };
};
