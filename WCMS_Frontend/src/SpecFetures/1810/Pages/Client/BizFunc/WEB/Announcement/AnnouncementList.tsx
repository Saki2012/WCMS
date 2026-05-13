/**公告清單 */
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import { Grid } from "@/SysCore/Components/Grid/Grid_Comp";
import type { GridProps } from "@/SysCore/Components/Grid/Grid_Data";
import type { GridRow } from "@/SysCore/Components/Grid/Grid_Data";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { NewPaginatorCanInputPage } from "@/SysCore/Components/Paginator/Paginator_Comp";
import { type ISearchQuery, SearchBarComp } from "@/SysCore/Components/SearchBar/SearchBar_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { AnnouncementDetailFields, AnnouncementFields } from "@/types/SchemaFields";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { formatCategoriesName } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { formatTagsName } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import type { IAnnouncementListProps } from "@/Features/Pages/Client/BizFunc/WEB/Announcement/AnnouncementList";
import { useAnnouncementListData } from "@/Features/Pages/Client/BizFunc/WEB/Announcement/AnnouncementList_Loader";
import DefaultEventImg from "@/SpecFetures/1810/Assets/Custom/DefaultEventPic_940x1330.jpg";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import { LangLink } from "@/SysCore/i18n/LangLink";

type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];

const AnnouncementList = (props: IAnnouncementListProps) =>
{
    // 宣告變數
    const dirUrl = useLocation().pathname.replace(/\/List$/, "");
    const [queryDraft, setQueryDraft] = useState<ISearchQuery>({});
    const [query, setQuery] = useState<ISearchQuery>({});

    const effectiveOptions = useMemo(() =>
    {
        const searchTag = `${query.tag ?? ""}`.trim();
        return { ...props.options, Tag: searchTag || props.options?.Tag };
    }, [props.options, query.tag]);

    // 執行 function：1810 list 資料統一改由 feature 提供
    const vm = useAnnouncementListData({ lang: props.lang, opts: effectiveOptions, kw: `${query.keyword ?? ""}`.trim() || undefined });

    const tags = useMemo(() =>
    {
        return (vm.tagData ?? []).map(t => ({ id: t.TagData?.TagId ?? "", name: t.TagDetail?.find(p => p.Lang === props.lang)?.TagName ?? "" }));
    }, [vm.tagData, props.lang]);

    const searchSlot = (
        <SearchBarComp
            value={queryDraft}
            tags={tags}
            onChange={(k, v) => setQueryDraft(prev => ({ ...prev, [k]: v }))}
            onSubmit={() => setQuery(queryDraft)}
            onReset={() =>
            {
                setQueryDraft({});
                setQuery({});
            }}
        />
    );

    const adjustedGrid = useMemo(() =>
    {
        return SetAdjustFunction(props.lang, dirUrl, vm.gridPropsFromList, vm.listData, vm.categoryData, vm.tagData);
    }, [props.lang, dirUrl, vm.gridPropsFromList, vm.listData, vm.categoryData, vm.tagData]);

    const content: React.ReactElement | null = useMemo(() =>
    {
        switch (props.options?.Style)
        {
            case 3:
                return (
                    <QAList_Comp
                        key="qa"
                        lang={props.lang}
                        Theme={props.theme}
                        rawData={vm.listData}
                        currentPage={vm.pageNumber}
                        totalPages={vm.totalPages}
                        onPageChange={vm.onPageChange}
                    />
                );
            case 2:
                return (
                    <PictureList_Comp
                        key="picture"
                        lang={props.lang}
                        Theme={props.theme}
                        rawData={vm.listData}
                        categoryData={vm.categoryData}
                        currentPage={vm.pageNumber}
                        totalPages={vm.totalPages}
                        onPageChange={vm.onPageChange}
                    />
                );
            case 1:
            default:
                return <GridList_Comp key="grid" lang={props.lang} Theme={props.theme} GridData={adjustedGrid} />;
        }
    }, [props.options?.Style, props.lang, props.theme, vm.listData, vm.pageNumber, vm.totalPages, vm.onPageChange, vm.categoryData, adjustedGrid]);

    // return
    return (
        <>
            {searchSlot}
            <LoadingErrorHandler isLoading={vm.isLoading} errorList={vm.errorList}>{content}</LoadingErrorHandler>
        </>
    );
};

export default AnnouncementList;

const SetAdjustFunction = (
    lang: Lang,
    dirUrl: string,
    gridProps: GridProps,
    rawData: AnnouncementSet[],
    catData: CategorySet[],
    tagData: TagSet[],
): GridProps =>
{
    // 宣告變數
    const newRows: GridRow[] = gridProps.rows.map((row, index) =>
    {
        const curRow = rawData?.[index];
        const internalId = curRow.Announcement?.InternalId ?? "";
        const contentStatus = curRow.Announcement?.ContentStatus ?? 0;
        const titleId = `title-${internalId}`;

        const newCells = row.cells.map((cell) =>
        {
            const isTitle = cell.col.key === AnnouncementDetailFields.Title;

            switch (cell.col.key)
            {
                case AnnouncementFields.Categories:
                    cell.content = formatCategoriesName(curRow.Announcement?.Categories ?? "", catData, lang);
                    break;
                case AnnouncementFields.Tags:
                    cell.content = formatTagsName(curRow.Announcement?.Tags ?? "", tagData, lang);
                    break;
            }

            return {
                ...cell,
                content: (
                    <>
                        <LangLink
                            to={`${dirUrl}/${internalId}`}
                            className="link-cell"
                            id={isTitle ? titleId : undefined}
                            aria-labelledby={isTitle ? undefined : titleId}
                        >
                            <span aria-hidden={!isTitle}>{cell.content}</span>
                        </LangLink>

                        {isTitle && (
                            <>
                                {isWithinLastNDaysFromString(curRow.Announcement?.Validate_Start ?? "") && <span className="label label-warning">最新</span>}
                                {Boolean(contentStatus & 1) && <span className="label label-success">置頂</span>}
                                {Boolean(contentStatus & 2) && <span className="label label-danger">熱門</span>}
                            </>
                        )}
                    </>
                ),
            };
        });

        return { ...row, cells: newCells };
    });

    // return
    return { ...gridProps, rows: newRows };
};

/** 圖文式公告 */
const PictureList_Comp = (
    prop: {
        lang: Lang;
        Theme: IFETheme;
        rawData: AnnouncementSet[];
        categoryData: CategorySet[];
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    },
) =>
{
    // 宣告變數
    const dirUrl = useLocation().pathname.replace(/\/List$/, "");

    // return
    return (
        <>
            <div className="articles_itemBoxs">
                {prop.rawData.map((row) =>
                {
                    const internalId = `${dirUrl}/${row.Announcement?.InternalId ?? ""}`;
                    const picDesc = row.Announcement?.PicDescription ?? "";
                    const picUrl = FileManagementAPI.get_Public_Preview_Url(row.Announcement?.PictureId, picDesc) ?? DefaultEventImg;
                    const title = row.AnnouncementDetail?.find(p => p.Lang === prop.lang)?.Title ?? "";
                    const date = FormatDate(row.Announcement?.Validate_Start) ?? "";
                    const catName = formatCategoriesName(row.Announcement?.Categories ?? "", prop.categoryData, prop.lang);

                    return (
                        <div key={internalId} className="articles_item col-xl-4 col-lg-4 col-md-6 col-sm-12 col-12">
                            <article className="cardbox">
                                <div className="card_content">
                                    <figure className="card_figure">
                                        <LangLink to={internalId} className="card_image_link" title={title}>
                                            <picture>
                                                <img className="card_image" src={picUrl} alt={picDesc} />
                                            </picture>
                                        </LangLink>
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
                                        <LangLink to={internalId} className="card_title" title={title}>{title}</LangLink>
                                        <>
                                            {isWithinLastNDaysFromString(row.Announcement?.Validate_Start ?? "") && (
                                                <span className="label label-warning">最新</span>
                                            )}
                                            {Boolean((row.Announcement?.ContentStatus ?? 0) & 1) && <span className="label label-success">置頂</span>}
                                            {Boolean((row.Announcement?.ContentStatus ?? 0) & 2) && <span className="label label-danger">熱門</span>}
                                        </>
                                    </div>
                                    <div className="customize_btn mr-auto mt-2">
                                        <LangLink to={internalId} className="Btn_s1">
                                            VIEW ALL<span className="ml-2">+</span>
                                        </LangLink>
                                    </div>
                                </div>
                            </article>
                        </div>
                    );
                })}
            </div>
            {(prop.totalPages > 1) && (
                <NewPaginatorCanInputPage
                    currentPage={prop.currentPage}
                    totalPages={prop.totalPages}
                    onPageChange={prop.onPageChange}
                    style={prop.Theme.Paginator}
                />
            )}
        </>
    );
};

/** 清單式公告 */
const GridList_Comp = (prop: { lang: Lang; Theme: IFETheme; GridData: GridProps; }) =>
{
    // return
    return (
        <>
            <OperationGuideHelp_Comp lang={prop.lang} />
            <Grid gridData={prop.GridData} style={prop.Theme.GridView} pageStyle={prop.Theme.Paginator} />
        </>
    );
};

const QAItem_Comp = (prop: { idx: number; row: AnnouncementSet; lang: Lang; }) =>
{
    const content = <CmsHtml_Comp html={prop.row.AnnouncementDetail?.find(p => p.Lang === prop.lang)?.Content ?? ""} lang={prop.lang} />;

    // return
    return (
        <div className={`QA${prop.idx} card`}>
            <div className="card-header">
                <a className="card-link darkcolor collapsed" data-bs-toggle="collapse" href={`#collapse${prop.idx}`} aria-expanded="false">
                    {`${(prop.idx + 1).toString().padStart(2, "0")}. ${prop.row.AnnouncementDetail?.find(p => p.Lang === prop.lang)?.Title}`}
                </a>
            </div>
            <div id={`collapse${prop.idx}`} className="collapse" data-bs-parent="#accordion">
                <div className="card-body">{content}</div>
            </div>
        </div>
    );
};

/** QA列表式 */
const QAList_Comp = (
    prop: { lang: Lang; Theme: IFETheme; rawData: AnnouncementSet[]; currentPage: number; totalPages: number; onPageChange: (page: number) => void; },
) =>
{
    // return
    return (
        <>
            <div className="faq_content">
                <div className="row">
                    <div className="col-12">
                        <div id="accordion" className="FAQBar">
                            {prop.rawData.map((row, idx) => <QAItem_Comp
                                key={row.Announcement?.InternalId ?? `${idx}`}
                                idx={idx}
                                row={row}
                                lang={prop.lang}
                            />)}
                        </div>
                    </div>
                </div>
            </div>
            {(prop.totalPages > 1) && (
                <NewPaginatorCanInputPage
                    currentPage={prop.currentPage}
                    totalPages={prop.totalPages}
                    onPageChange={prop.onPageChange}
                    style={prop.Theme.Paginator}
                />
            )}
        </>
    );
};

interface WithinLastOptions
{
    /** 當字串沒有時區資訊時，假定的時區位移（單位：分鐘）。預設 0 = 當成 UTC。例：台北(+08:00)傳 480 */
    assumeOffsetMinutes?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDateTimeToEpochMs = (input: string, assumeOffsetMinutes: number = 0): number | null =>
{
    // 宣告變數
    if (!input) return null;
    const s = input.trim();

    // 1) .NET /Date(1696540800000)/ 格式
    const msMatch = /\/Date\((\d+)\)\//.exec(s);
    if (msMatch) return Number(msMatch[1]);

    // 2) ISO 8601（含 Z 或 ±HH:mm）
    const hasTZ = /[zZ]|[+\-]\d{2}:\d{2}$/.test(s);
    if (hasTZ)
    {
        const t = Date.parse(s);
        return Number.isNaN(t) ? null : t;
    }

    // 3) 無時區資訊的常見格式
    const m = /^(\d{4})[-/](\d{2})[-/](\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/.exec(s);
    if (m)
    {
        const [_, y, mo, d, hh = "0", mm = "0", ss = "0", fff = "0"] = m;
        const ms = parseInt(fff.padEnd(3, "0"), 10);
        const asUTC = Date.UTC(+y, +mo - 1, +d, +hh, +mm, +ss, ms) - assumeOffsetMinutes * 60 * 1000;
        return asUTC;
    }

    // 4) fallback
    const fallback = Date.parse(s);
    return Number.isNaN(fallback) ? null : fallback;
};

export const isWithinLastNDaysFromString = (dateTimeStr?: string, n: number = 8, opts?: WithinLastOptions): boolean =>
{
    // 宣告變數
    if (!dateTimeStr) return false;

    const assumeOffsetMinutes = opts?.assumeOffsetMinutes ?? 0;
    const targetMs = parseDateTimeToEpochMs(dateTimeStr, assumeOffsetMinutes);
    if (targetMs == null) return false;

    const nowMs = Date.now();
    const diffMs = nowMs - targetMs;

    // return
    return diffMs >= 0 && diffMs <= n * DAY_MS;
};
