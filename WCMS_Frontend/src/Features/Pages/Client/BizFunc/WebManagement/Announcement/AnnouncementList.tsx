/**公告清單 */
import { useMemo, useState } from "react";
import type { GridProps } from "@/SysCore/Components/Grid/Grid_Data";
import type { components } from "@/types/api";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { Link, useLocation } from "react-router-dom";
import type { GridRow } from "@/SysCore/Components/Grid/Grid_Data";
import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import parse from 'html-react-parser';
import { AnnouncementFields, AnnouncementDetailFields, AnnouncementSetFields } from "@/types/SchemaFields";
import AnnouncementProvider from "@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { Lang } from "@/SysCore/i18n/lang";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import { SearchBarComp, type ISearchQuery } from "@/SysCore/Components/SearchBar/SearchBar_Comp";
import { useFormatTagsName, useTagListData } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { useCategoryListData, useFormatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { Paginator } from "@/SysCore/Components/Paginator/Paginator_Comp";
import DefaultEventImg from "@/Assets/1810/DefaultEventPic_940x1330.jpg"
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { Grid } from "@/SysCore/Components/Grid/Grid_Comp";
import { useResolveInternalIds } from "@/SysCore/Components/File/useResolveInternalIds";
import { ProgId } from "@/Features/Hooks/Common/ProgId";
import { useNow } from "@/SysCore/Utils/Library/LibHook";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];

const useAnnouncementList = (lang: string, categoryIds: string, tagIds: string, query: ISearchQuery) => {
    const now = useNow({ startPaused: true });
    var condition: string = "";
    //因時程關係，暫時用前端來判斷有效日期時間，多少會有客戶端修改時間的風險。之後再改到後端開新的api寫死抓系統時間為依據。
    if (now.isoLocal) condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Validate_Start} <= ${now.isoLocal}`);
    if (query.keyword) condition = LibMerge(" And ", false, condition, `${AnnouncementSetFields.AnnouncementDetail}.${AnnouncementDetailFields.Title} Like ${query.keyword}`)
    if (query.tag) condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Tags} HasAny ${query.tag}`)
    if (categoryIds) condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Categories} HasAny (${categoryIds})`)
    if (tagIds) condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Tags} HasAny (${tagIds})`)
    condition = LibMerge(" And ", false, condition, `${AnnouncementFields.ContentStatus} !& 4`)//不包含隱藏的資料

    const provider = AnnouncementProvider();
    return useFetchGridListData<AnnouncementSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [AnnouncementSetFields.Announcement, AnnouncementFields.Validate_Start],
            [AnnouncementSetFields.Announcement, AnnouncementFields.Categories],
            [AnnouncementSetFields.Announcement, AnnouncementFields.Tags],
            [AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.Title],
            [AnnouncementSetFields.Announcement, AnnouncementFields.ViewCount],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                AnnouncementFields.AnnouncementId,
                AnnouncementFields.InternalId,
                AnnouncementFields.ContentStatus,
                AnnouncementFields.PictureId,
                AnnouncementFields.PicDescription,
                AnnouncementFields.Categories,
                AnnouncementFields.Tags,
                AnnouncementFields.Validate_Start,
                `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
                `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
                `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Content}`,
                AnnouncementFields.ViewCount,
            ],
            Condition: condition,
            OrderBy: [{ Col: AnnouncementFields.Validate_Start, Desc: true }, { Col: AnnouncementFields.CreateTime, Desc: true }],
            PageNumber: page,
            PageSize: 12,
        }),
        parseRow: (item, columns) => {
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                switch (col.key) {
                    case AnnouncementDetailFields.Title:
                        {
                            content = item.AnnouncementDetail?.find(d => d.Lang === lang)?.Title ?? "";
                            break;
                        }
                    case AnnouncementFields.Validate_Start:
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
        deps: [lang, categoryIds, tagIds, query, condition],
    });
};

export interface IAnnouncementListOptions { Category?: string; Tag?: string; Style?: number; }
interface IAnnouncementListProps { Theme: IFETheme; Lang: Lang; Options?: IAnnouncementListOptions; }

export const AnnouncementList = (props: IAnnouncementListProps) => {

    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);
    const [queryDraft, setQueryDraft] = useState<ISearchQuery>({});
    const [query, setQuery] = useState<ISearchQuery>({});
    const useAnnounceList = useAnnouncementList(props.Lang, props.Options?.Category ?? "", props.Options?.Tag ?? "", query);
    const useCategory = useCategoryListData(ProgId.Announcement, props.Lang);

    const useTagData = useTagListData(ProgId.Announcement, props.Lang);
    const tags = (useTagData.rawData ?? []).map(t => ({ id: t.TagData?.TagId ?? "", name: t.TagDetail?.find(p => p.Lang === props.Lang)?.TagName ?? "" }));
    const searchSlot = <SearchBarComp value={queryDraft} tags={tags} onChange={(k, v) => setQueryDraft(prev => ({ ...prev, [k]: v }))} onSubmit={() => setQuery(queryDraft)} onReset={() => { setQueryDraft({}); setQuery({}); }} />;

    const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, useAnnounceList.gridProps, useAnnounceList.rawData, useCategory.rawData, useTagData.rawData); }, [useAnnounceList.gridProps, useAnnounceList.rawData, useCategory.rawData, useTagData.rawData]);
    const isLoading = [useAnnounceList.isLoading, useTagData.isLoading];
    const errors = [useAnnounceList.error, useTagData.error];

    const content: React.ReactElement | null = useMemo(() => {
        switch (props.Options?.Style) {
            case 3:
                return <QAList_Comp key="qa" GridData={adjustedGrid} Theme={props.Theme} />;
            case 2:
                return <PictureList_Comp key="picture" GridData={adjustedGrid} Theme={props.Theme} />;
            case 1:
            default: // 含 case 1
                return <GridList_Comp key="grid" GridData={adjustedGrid} Theme={props.Theme} />
        }
    }, [props.Options?.Style, searchSlot, adjustedGrid, props.Theme, isLoading, errors]);

    return (
        <>
            {searchSlot}
            <LoadingErrorHandler loadingList={isLoading} errorList={errors}>
                {content}
            </LoadingErrorHandler>
        </>

    )
};
const SetAdjustFunction = (dirUrl: string, gridProps: GridProps, rawData: AnnouncementSet[], catData: CategorySet[], tagData: TagSet[]): GridProps => {
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const curRow = rawData?.[index];
        const internalId = curRow.Announcement?.InternalId ?? "";
        const contentStatus = curRow.Announcement?.ContentStatus ?? 0;
        const titleId = `title-${internalId}`;
        const newCells = row.cells.map((cell) => {
            const isTitle = cell.col.key === AnnouncementDetailFields.Title;

            switch (cell.col.key) {
                case AnnouncementFields.Categories:
                    cell.content = useFormatCategoriesName(curRow.Announcement?.Categories ?? "", catData)
                    break;
                case AnnouncementFields.Tags:
                    cell.content = useFormatTagsName(curRow.Announcement?.Tags ?? "", tagData)
                    break;
            }

            return {
                ...cell,
                content: (
                    <>
                        <Link to={`${dirUrl}/${internalId}`} className="link-cell" id={isTitle ? titleId : undefined}
                            aria-labelledby={isTitle ? undefined : titleId}>
                            <span aria-hidden={!isTitle}>{cell.content}</span>
                        </Link>

                        {isTitle &&
                            <>
                                {isWithinLastNDaysFromString(curRow.Announcement?.Validate_Start ?? "") && (
                                    <span className="label label-warning">最新</span>
                                )}
                                {Boolean(contentStatus & 1) && (<span className="label label-success">置頂</span>)}
                                {Boolean(contentStatus & 2) && (<span className="label label-danger">熱門</span>)}
                            </>
                        }
                    </>
                ),
            };
        });
        return { ...row, cells: newCells };
    });
    return { ...gridProps, rows: newRows };
};


/** 圖文式公告 */
const PictureList_Comp = (prop: { Theme: IFETheme; GridData: GridProps }) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);
    const useCateData = useCategoryListData("Announcement", 'zh-tw');
    return (
        <>
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
                                        {
                                            <>
                                                {isWithinLastNDaysFromString(row.Announcement?.Validate_Start ?? "") && (<span className="label label-warning">最新</span>)}
                                                {Boolean((row.Announcement?.ContentStatus ?? 0) & 1) && (<span className="label label-success">置頂</span>)}
                                                {Boolean((row.Announcement?.ContentStatus ?? 0) & 2) && (<span className="label label-danger">熱門</span>)}
                                            </>
                                        }
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
        </>
    );
}
/** 清單式公告 */
const GridList_Comp = (prop: { Theme: IFETheme; GridData: GridProps }) => {
    return (<Grid gridData={prop.GridData} style={prop.Theme.GridView} pageStyle={prop.Theme.Paginator}></Grid>)
}
/** QA列表式 */
const QAList_Comp = (prop: { Theme: IFETheme; GridData: GridProps }) => {
    return (
        <>
            <div className="faq_content">
                <div className="row">
                    <div className="col-12">
                        <div id="accordion" className="FAQBar">
                            {prop.GridData && prop.GridData.rawData.map((row: AnnouncementSet, idx: number) => {
                                const parseContent = useResolveInternalIds(row.AnnouncementDetail?.find(p => p.Lang === 'zh-tw')?.Content ?? "", { locale: 'zh-tw' });
                                const content = parseContent.html ? parse(parseContent.html) : null;
                                return (
                                    <div className={`QA${idx} card`}>
                                        <div className="card-header">
                                            <a className="card-link darkcolor collapsed" data-bs-toggle="collapse" href={`#collapse${idx}`} aria-expanded="false">
                                                {`${(idx + 1).toString().padStart(2, '0')}. ${row.AnnouncementDetail?.find(p => p.Lang === 'zh-tw')?.Title}`}
                                            </a>
                                        </div>
                                        <div id={`collapse${idx}`} className="collapse" data-bs-parent="#accordion">
                                            <div className="card-body">
                                                {content}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            {(prop.GridData.TotalPage > 1) && (<Paginator currentPage={prop.GridData.CurrentPage} totalPages={prop.GridData.TotalPage} onPageChange={prop.GridData.onPageChange} style={prop.Theme.Paginator} ></Paginator>)}
        </>
    )
}


interface WithinLastOptions {
    /** 當字串沒有時區資訊時，假定的時區位移（單位：分鐘）。預設 0 = 當成 UTC。例：台北(+08:00)傳 480 */
    assumeOffsetMinutes?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDateTimeToEpochMs = (input: string, assumeOffsetMinutes: number = 0): number | null => {
    if (!input) return null;
    const s = input.trim();

    // 1) .NET /Date(1696540800000)/ 格式
    const msMatch = /\/Date\((\d+)\)\//.exec(s);
    if (msMatch) return Number(msMatch[1]);

    // 2) ISO 8601（含 Z 或 ±HH:mm）
    //    例如：2025-10-28T14:30:00Z、2025-10-28T14:30:00+08:00
    const hasTZ = /[zZ]|[+\-]\d{2}:\d{2}$/.test(s);
    if (hasTZ) {
        const t = Date.parse(s);
        return Number.isNaN(t) ? null : t;
    }

    // 3) 無時區資訊的常見格式：
    //    YYYY-MM-DD[ |T]HH:mm[:ss[.fff]]   或   YYYY/MM/DD[ ...]
    //    以及只有日期：YYYY-MM-DD / YYYY/MM/DD
    const m = /^(\d{4})[-/](\d{2})[-/](\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/.exec(s);
    if (m) {
        const [_, y, mo, d, hh = "0", mm = "0", ss = "0", fff = "0"] = m;
        const ms = parseInt(fff.padEnd(3, "0"), 10);
        // 先組成「該時區的牆上時間」對應的 UTC 時間
        // 假設輸入代表的是「本地 assumeOffsetMinutes 的時間」
        // 例如 assumeOffsetMinutes=480 (台北 +08:00)，那 2025-10-28 14:30 代表 UTC=14:30-8h
        const asUTC = Date.UTC(+y, +mo - 1, +d, +hh, +mm, +ss, ms) - assumeOffsetMinutes * 60 * 1000;
        return asUTC;
    }

    // 4) 其他能被 Date.parse 吃到的情況（不保證所有環境一致）
    const fallback = Date.parse(s);
    return Number.isNaN(fallback) ? null : fallback;
};

const isWithinLastNDaysFromString = (dateTimeStr?: string, n: number = 8, opts?: WithinLastOptions): boolean => {
    if (!dateTimeStr) return false;

    const assumeOffsetMinutes = opts?.assumeOffsetMinutes ?? 0;
    const targetMs = parseDateTimeToEpochMs(dateTimeStr, assumeOffsetMinutes);
    if (targetMs == null) return false;

    const nowMs = Date.now();
    const diffMs = nowMs - targetMs;

    // 僅計算「過去 n 天內」，未來時間回傳 false
    return diffMs >= 0 && diffMs <= n * DAY_MS;
};