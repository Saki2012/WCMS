/**公告清單 */
import { useMemo, useState } from "react";
import type { GridProps } from "@/SysCore/Components/Grid/Grid_Data";
import type { components } from "@/types/api";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { Link, useLocation } from "react-router-dom";
import type { GridRow } from "@/SysCore/Components/Grid/Grid_Data";
import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import * as SchemaFields from "@/types/SchemaFields";
import AnnouncementProvider from "@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { Lang } from "@/SysCore/i18n/lang";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import { SearchBarComp, type ISearchQuery } from "@/SysCore/Components/SearchBar/SearchBar_Comp";
import { useTagListData } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { useCategoryListData, useFormatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { Paginator } from "@/SysCore/Components/Paginator/Paginator_Comp";
import DefaultEventImg from "@/Assets/1810/DefaultEventPic_940x1330.jpg"
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { Grid } from "@/SysCore/Components/Grid/Grid_Comp";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

const useAnnouncementList = (lang: string, categoryIds: string, tagIds: string, query: ISearchQuery) => {
    var condition: string = "";
    if (query.keyword) condition = LibMerge(" And ", false, condition, `${SchemaFields.AnnouncementSetFields.AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Title} Like ${query.keyword}`)
    if (query.tag) condition = LibMerge(" And ", false, condition, `${SchemaFields.AnnouncementFields.Tags} HasAny ${query.tag}`)
    if (categoryIds) condition = LibMerge(" And ", false, condition, `${SchemaFields.AnnouncementFields.Categories} In (${categoryIds})`)
    if (tagIds) condition = LibMerge(" And ", false, condition, `${SchemaFields.AnnouncementFields.Tags} In (${tagIds})`)
    condition = LibMerge(" And ", false, condition, `${SchemaFields.AnnouncementFields.ContentStatus} !& 4`)//不包含隱藏的資料

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
                `${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Lang}`,
                `${SchemaFields.AnnouncementFields._AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Title}`,
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
interface IAnnouncementListProps { Theme: IFETheme; Lang: Lang; Options?: IAnnouncementListOptions; }

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
            return (
                <>
                    {searchSlot}
                    <LoadingErrorHandler loadingList={isLoading} errorList={errors} >
                        <Grid gridData={adjustedGrid} style={props.Theme.GridView} pageStyle={props.Theme.Paginator}></Grid>
                    </LoadingErrorHandler>
                </>
            )
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



interface ListCompProp {
    // Title:string
    Theme: IFETheme
    LoadingList: boolean[],
    ErrorList: (string | null | undefined)[],
    // SearchBar:SearchBarProps,
    // SearchBar:SearchBarProps
    // GridType?:string
    GridData: GridProps
}

interface GridViewContentSlots extends ListCompProp {
    searchSlot?: React.ReactNode;
}
/**圖文式公告 */
const PictureList_Comp = (prop: GridViewContentSlots) => {

    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);
    const useCateData = useCategoryListData("Announcement", 'zh-tw');

    return (
        <>
            {prop.searchSlot}
            <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList} >
                <div className="articles_itemBoxs">
                    {prop.GridData && prop.GridData.rawData.map((row: AnnouncementSet) => {
                        const internalId = `${dirUrl}/${row.Announcement?.InternalId ?? ""}`
                        const picUrl = row.Announcement?.PictureId ? `${FileManagementAPI.PREVIEW_URL}/${row.Announcement?.PictureId ?? ""}` : DefaultEventImg
                        const picDesc = row.Announcement?.PicDescription ?? ""
                        const title = row.AnnouncementDetail?.find(p => p.Lang === 'zh-tw')?.Title ?? ""
                        const date = FormatDate(row.Announcement?.Validate_Start) ?? ""
                        const catName = useFormatCategoriesName(row.Announcement?.Categories ?? "", useCateData.rawData)
                        return (
                            <div key={internalId} className="articles_item col-xl-4 col-lg-4 col-md-6 col-sm-12 col-12">
                                <article className="cardbox">
                                    <div className="card_content">
                                        <figure className="card_figure">
                                            <Link to={internalId} className="card_image_link" title={title}>
                                                <picture>
                                                    <img className="card_image" src={picUrl} alt={picDesc} />
                                                </picture>
                                            </Link>
                                        </figure>
                                        <div className="card_catDiv">
                                            <div className="card_cat">
                                                <div className="card_cat_link">
                                                    <span className="s-line">▍</span>
                                                    <span className="s-tle">{catName}</span>
                                                </div>
                                            </div>
                                            <div className="card_time">{date}</div>
                                        </div>
                                        <div className="card_titleDiv">
                                            <Link to={internalId} className="card_title" title={title}>{title}</Link>
                                        </div>
                                        <div className="customize_btn mr-auto mt-2">
                                            <Link to={internalId} className="Btn_s1">VIEW ALL<span className="ml-2">+</span></Link>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        );
                    })}

                </div>
                {(prop.GridData.TotalPage > 1) && (<Paginator currentPage={prop.GridData.CurrentPage} totalPages={prop.GridData.TotalPage} onPageChange={prop.GridData.onPageChange} style={prop.Theme.Paginator} ></Paginator>)}
            </LoadingErrorHandler>
        </>
    );
}