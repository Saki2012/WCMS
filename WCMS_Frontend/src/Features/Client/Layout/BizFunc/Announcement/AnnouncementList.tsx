/**公告清單 */
import { useMemo } from "react";
import type { GridProps } from "../../../../../SysCore/Components/Grid/Grid_Data";
import type { components } from "../../../../../types/api";
import type { IFETheme } from "../../Theme/ITheme";
type AnnouncementSet = components["schemas"]["AnnouncementSet"];
import { Link, useLocation } from "react-router-dom";
import type { GridRow } from "../../../../../SysCore/Components/Grid/Grid_Data";
import type { RowCell } from "../../../../../SysCore/Components/Grid/Grid_Data";
import { useFetchGridListData } from "../../../../../SysCore/Utils/FetchGridListData";
import { FormatDateTime } from "../../../../../SysCore/Utils/LibData";
import * as SchemaFields from "../../../../../types/SchemaFields";
import AnnouncementProvider from "../../../../Server/Layout/BizFunc/WebManagement/Announcement/Announcement_Api";

import { GridViewContentComp } from "../../Scaffold/ContentViewMode/GridView/GridView/GridContent_Comp";

const useAnnouncementList = () =>
{
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
            Condition: "",
            PageNumber: page,
            PageSize: 10,
        }),
        parseRow: (item, columns) =>
        {
            const data = item.Announcement ?? {};
            const cells: RowCell[] = columns.map(col =>
            {
                let content = "";
                if (col.key === SchemaFields.AnnouncementDetailFields.Title)
                {
                    content = data.AnnouncementDetail?.find(d => d.Lang === "zh-tw")?.Title ?? "";
                } else if (col.key === SchemaFields.AnnouncementFields.ModifyTime)
                {
                    content = FormatDateTime((data as any)[col.key]);
                } else
                {
                    content = (data as any)[col.key] ?? "";
                }
                return { col, content };
            });
            return { cells };
        },
    });
};

export const AnnouncementList = ({ theme }: { theme: IFETheme; }) =>
{
    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);
    const useAnnounceList = useAnnouncementList();
    const adjustedGrid = useMemo(() =>
    {
        return SetAdjustFunction(dirUrl, useAnnounceList.gridProps, useAnnounceList.rawData);
    }, [useAnnounceList.gridProps, useAnnounceList.rawData]);
    const isLoading = [useAnnounceList.isLoading];
    const errors = [useAnnounceList.error];

    return <GridViewContentComp GridData={adjustedGrid} Theme={theme} LoadingList={isLoading} ErrorList={errors} />;
};

const SetAdjustFunction = (dirUrl: string, gridProps: GridProps, rawData: AnnouncementSet[]): GridProps =>
{
    const newRows: GridRow[] = gridProps.rows.map((row, index) =>
    {
        const internalId = rawData?.[index]?.Announcement?.InternalId ?? "";
        const title = rawData?.[index]?.Announcement?.AnnouncementDetail?.Title ?? "";
        const titleId = `title-${internalId}`;
        const newCells = row.cells.map((cell) =>
        {
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
