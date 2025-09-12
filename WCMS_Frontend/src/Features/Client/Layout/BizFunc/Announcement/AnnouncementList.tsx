/**公告清單 */
import { useMemo, useState } from "react";
import type { GridProps } from "../../../../../SysCore/Components/Grid/Grid_Data";
import type { components } from "../../../../../types/api";
import type { IFETheme } from "../../Theme/ITheme";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
import { Link, useLocation } from "react-router-dom";
import type { GridRow } from "../../../../../SysCore/Components/Grid/Grid_Data";
import type { RowCell } from "../../../../../SysCore/Components/Grid/Grid_Data";
import { useFetchGridListData } from "../../../../../SysCore/Utils/API/FetchGridListData";
import * as SchemaFields from "../../../../../types/SchemaFields";
import AnnouncementProvider from "../../../../Server/Layout/BizFunc/WebManagement/Announcement/Announcement_Api";
import { GridViewContentComp } from "../../Scaffold/ContentViewMode/GridView/GridView/GridContent_Comp";
import { Merge } from "../../../../../SysCore/Utils/Library/LibMergeData";
import type { Lang } from "../../../../../SysCore/i18n/lang";
import { FormatDate } from "../../../../../SysCore/Utils/Library/LibData";
import { SearchBarComp, type ISearchQuery } from "../../../../../SysCore/Components/SearchBar/SearchBar_Comp";
import { useTagListData } from "../../../../Server/Layout/BizFunc/WebManagement/Tags/Tag_Hook";
import { PictureList_Comp } from "../../Scaffold/ContentViewMode/GridView/PictureList/PictureList_Comp";
import { useCategoryListData } from "../../../../Server/Layout/BizFunc/WebManagement/Category/Category_Hook";

const useAnnouncementList = (lang: string, categoryIds: string, tagIds: string, query: ISearchQuery) => {
    var condition: string = "";
    if (query.keyword) condition = Merge(" And ", false, condition, `${SchemaFields.AnnouncementSetFields.AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Title} Like ${query.keyword}`)
    if (query.tag) condition = Merge(" And ", false, condition, `${SchemaFields.AnnouncementFields.Tags} HasAny ${query.tag}`)
    if (categoryIds) condition = Merge(" And ", false, condition, `${SchemaFields.AnnouncementFields.Categories} In (${categoryIds})`)
    if (tagIds) condition = Merge(" And ", false, condition, `${SchemaFields.AnnouncementFields.Tags} In (${tagIds})`)
    condition = Merge(" And ", false, condition, `${SchemaFields.AnnouncementFields.ContentStatus} !& 4`)//不包含隱藏的資料

    const provider = AnnouncementProvider();
    return useFetchGridListData<AnnouncementSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.Validate_Start],
            [SchemaFields.AnnouncementSetFields.AnnouncementDetail, SchemaFields.AnnouncementDetailFields.Title],
            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.ViewCount],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.AnnouncementFields.AnnouncementId,
                SchemaFields.AnnouncementFields.InternalId,
                SchemaFields.AnnouncementFields.PictureId,
                SchemaFields.AnnouncementFields.PicDescription,
                SchemaFields.AnnouncementFields.Categories,
                SchemaFields.AnnouncementFields.Validate_Start,
                `${SchemaFields.AnnouncementSetFields.AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Lang}`,
                `${SchemaFields.AnnouncementSetFields.AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Title}`,
                SchemaFields.AnnouncementFields.ViewCount,
            ],
            Condition: condition,
            OrderBy: [{ Col: SchemaFields.AnnouncementFields.Validate_Start, Desc: true }],
            PageNumber: page,
            PageSize: 12,
        }),
        parseRow: (item, columns) => {
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                switch (col.key) {
                    case SchemaFields.AnnouncementDetailFields.Title:
                        {
                            content = item.AnnouncementDetail?.find(d => d.Lang === lang)?.Title ?? "";
                            break;
                        }
                    case SchemaFields.AnnouncementFields.Validate_Start:
                        {
                            content = FormatDate(item.Announcement?.Validate_Start) ?? ""
                            break;
                        }
                    default:
                        {
                            content = (item.Announcement as any)[col.key] ?? "";
                            break;
                        }
                }
                return { col, content };
            });
            return { cells };
        },
        enabled: true,
        deps: [lang, categoryIds, tagIds, query],
    });
};

export interface IAnnouncementListOptions { Category?: string; Tag?: string; Style?: number; }
interface IAnnouncementListProps { Theme: IFETheme; Lang: string | Lang; Options?: IAnnouncementListOptions; }

export const AnnouncementList = (props: IAnnouncementListProps) => {

    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);
    const [queryDraft, setQueryDraft] = useState<ISearchQuery>({});
    const [query, setQuery] = useState<ISearchQuery>({});
    const useAnnounceList = useAnnouncementList(props.Lang, props.Options?.Category ?? "", props.Options?.Tag ?? "", query);
    const useTagData = useTagListData("Announcement", props.Lang);

    const tags = (useTagData.rawData ?? []).map(t => ({ id: t.TagData?.TagId ?? "", name: t.TagDetail?.find(p => p.Lang === props.Lang)?.TagName ?? "" }));

    const searchSlot = (
        <SearchBarComp value={queryDraft} tags={tags} onChange={(k, v) => setQueryDraft(prev => ({ ...prev, [k]: v }))}
            onSubmit={() => setQuery(queryDraft)} onReset={() => { setQueryDraft({}); setQuery({}); }} />);

    const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, useAnnounceList.gridProps, useAnnounceList.rawData); }, [useAnnounceList.gridProps, useAnnounceList.rawData]);
    const isLoading = [useAnnounceList.isLoading, useTagData.isLoading];
    const errors = [useAnnounceList.error, useTagData.error];


    switch (props.Options?.Style) {
        case 2://圖文式
            return <PictureList_Comp searchSlot={searchSlot} GridData={adjustedGrid} Theme={props.Theme} LoadingList={isLoading} ErrorList={errors} />
        case 1://清單式
        default:
            return <GridViewContentComp searchSlot={searchSlot} GridData={adjustedGrid} Theme={props.Theme} LoadingList={isLoading} ErrorList={errors} />;
    }
};

const SetAdjustFunction = (dirUrl: string, gridProps: GridProps, rawData: AnnouncementSet[]): GridProps => {
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const internalId = rawData?.[index]?.Announcement?.InternalId ?? "";
        // const title = rawData?.[index]?.Announcement?.AnnouncementDetail?.Title ?? "";
        const titleId = `title-${internalId}`;
        const newCells = row.cells.map((cell) => {
            const isTitle = cell.col.key === SchemaFields.AnnouncementDetailFields.Title;
            return {
                ...cell,
                content: (
                    <Link to={`${dirUrl}/${internalId}`} className="link-cell" id={isTitle ? titleId : undefined}
                        // aria-label={isTitle ? `前往 ${title} 的詳細頁面` : undefined}
                        aria-labelledby={isTitle ? undefined : titleId}>
                        <span aria-hidden={!isTitle}>{cell.content}</span>
                    </Link>
                ),
            };
        });
        return { ...row, cells: newCells };
    });
    return { ...gridProps, rows: newRows };
};
