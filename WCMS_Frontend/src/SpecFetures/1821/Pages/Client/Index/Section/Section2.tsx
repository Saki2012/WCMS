import { applyGridColumnWidths, readGridColumnWidths, writeGridColumnWidths } from "@/SysCore/Components/Grid/Grid_ColumnWidth";
import { ColRender, RowRender } from "@/SysCore/Components/Grid/Grid_Comp";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { formatDate, LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { type ReactNode, useEffect, useState } from "react";

// #region Property
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
type FileArchiveDetail = components["schemas"]["FileArchiveDetail_DTO"];
type FileArchiveUrlDetail = components["schemas"]["FileArchiveUrlDetail_DTO"];
type SpecHomePage1821Shortcut = components["schemas"]["SpecHomePage1821_Shortcut_DTO"];
type SpecHomePage1821ShortcutModuleItem = components["schemas"]["SpecHomePage1821_ShortcutModuleItem_DTO"];
type SpecHomePageModuleType = components["schemas"]["SpecHomePageModuleType"];
type HomePageModuleTypeValue = Exclude<SpecHomePageModuleType, 0>;

interface HomePageShortcutModuleViewModel
{
    setting: SpecHomePage1821ShortcutModuleItem;
    moduleType: HomePageModuleTypeValue;
    announcementList: AnnouncementSet[];
    fileArchiveList: FileArchiveSet[];
}

interface HomePageShortcutViewModel
{
    shortcut: SpecHomePage1821Shortcut;
    modules: HomePageShortcutModuleViewModel[];
}

interface DownloadLinkViewModel
{
    url: string;
    title: string;
    ext: string;
    target?: "_blank" | "_self";
}

const HomePageModuleType = {
    Announcement: 1,
    FileArchive: 2,
} as const satisfies Record<string, HomePageModuleTypeValue>;
const FileArchiveGridColumnKey = {
    Category: "__Category__",
    Sort: "__Sort__",
    Title: "__Title__",
    Download: "__Download__",
    DownloadCount: "__DownloadCount__",
    UploadDate: "__UploadDate__",
} as const;
const FILE_ARCHIVE_GRID_COLUMN_WIDTH_STORAGE_KEY = "client-homepage-1821-filearchive-grid-column-widths";
// #endregion

// #region Public
/** Section2：對標 prototype 的第一層 / 第二層招生資訊頁籤 DOM。 */
export const Section2 = (props: { lang: Lang; data: HomePageShortcutViewModel[]; }) =>
{
    const shortcuts = props.data ?? [];
    const activeTopIndex = getFirstPanelIndex(shortcuts);
    if (shortcuts.length === 0) return null;

    return (
        <section className="Tabs_section Layout_Padding_0">
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize-100">
                        <div id="Horizontal" className="H-nav-tabs-content-box">
                            <TopTabList lang={props.lang} shortcuts={shortcuts} activeIndex={activeTopIndex} />
                            <TopTabContent lang={props.lang} shortcuts={shortcuts} activeIndex={activeTopIndex} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
// #endregion

// #region Section
/** 第一層快捷頁籤清單。 */
const TopTabList = (props: { lang: Lang; shortcuts: HomePageShortcutViewModel[]; activeIndex: number; }) =>
{
    return (
        <div className="Horizontal nav-tabs-list">
            <ul className="nav nav-tabs nav-fill" role="tablist" id="TOP_Tab">
                {props.shortcuts.map((item, index) => <TopTabItem key={`${item.shortcut.HomePageId}-${item.shortcut.RowId}`} lang={props.lang} item={item.shortcut} index={index} active={index === props.activeIndex} />)}
            </ul>
        </div>
    );
};

/** 第一層頁籤內容區。 */
const TopTabContent = (props: { lang: Lang; shortcuts: HomePageShortcutViewModel[]; activeIndex: number; }) =>
{
    return (
        <div className="tab-content" id="H-First-DisplayTabContent">
            {props.shortcuts.map((item, index) => <TopTabPane key={`${item.shortcut.HomePageId}-${item.shortcut.RowId}`} lang={props.lang} item={item} index={index} active={index === props.activeIndex} />)}
        </div>
    );
};

/** 第二層頁籤清單。 */
const SecondLevelTabList = (props: { modules: HomePageShortcutModuleViewModel[]; topIndex: number; }) =>
{
    return (
        <div className="Second_BG_area">
            <div className="container-customize0">
                <ul className="nav nav-tabs second-level-nav" role="tablist" id={getSecondTabListId(props.topIndex)}>
                    {props.modules.map((module, index) => <SecondLevelTabButton key={`${module.setting.ParentRowId}-${module.setting.RowId}`} module={module} topIndex={props.topIndex} index={index} />)}
                </ul>
            </div>
        </div>
    );
};

/** 第二層頁籤內容區。 */
const SecondLevelContent = (props: { lang: Lang; modules: HomePageShortcutModuleViewModel[]; topIndex: number; }) =>
{
    return (
        <div className="three_BG_display_area">
            <div className="container-customize0">
                <div className="tab-content" id={getSecondContentId(props.topIndex)}>
                    {props.modules.map((module, index) => <SecondLevelPane key={`${module.setting.ParentRowId}-${module.setting.RowId}`} lang={props.lang} module={module} topIndex={props.topIndex} index={index} />)}
                </div>
            </div>
        </div>
    );
};
// #endregion

// #region EntityComp
/** 第一層單一頁籤項目。 */
const TopTabItem = (props: { lang: Lang; item: SpecHomePage1821Shortcut; index: number; active: boolean; }) =>
{
    return (
        <li className="nav-item" role="presentation">
            {props.item.IsLink === true && LibText.isNonEmptyString(props.item.Link)
                ? <TopLinkTab lang={props.lang} item={props.item} index={props.index} />
                : <TopButtonTab item={props.item} index={props.index} active={props.active} />}
        </li>
    );
};

/** 第一層外連頁籤。 */
const TopLinkTab = (props: { lang: Lang; item: SpecHomePage1821Shortcut; index: number; }) =>
{
    return (
        <LangLink id={getTopTabId(props.index)} to={props.item.Link ?? ""} lang={props.lang} className="nav-link" role="button" aria-selected={false} title={getShortcutTitle(props.item)}>
            <TopTabContentInner item={props.item} />
        </LangLink>
    );
};

/** 第一層內頁籤按鈕。 */
const TopButtonTab = (props: { item: SpecHomePage1821Shortcut; index: number; active: boolean; }) =>
{
    return (
        <button
            id={getTopTabId(props.index)}
            className={`nav-link${props.active ? " active" : ""}`}
            data-bs-toggle="tab"
            data-bs-target={`#${getTopPaneId(props.index)}`}
            type="button"
            role="tab"
            aria-selected={props.active}
            title={getShortcutTitle(props.item)}
        >
            <TopTabContentInner item={props.item} />
        </button>
    );
};

/** 第一層頁籤圖文內容。 */
const TopTabContentInner = (props: { item: SpecHomePage1821Shortcut; }) =>
{
    return (
        <div className="icon_wrapper">
            <ShortcutIcon item={props.item} />
            <div className="tit_area">
                <div className="icons_title">{props.item.Title}</div>
                {props.item.SubTitle && <div className="icons_small">{props.item.SubTitle}</div>}
            </div>
        </div>
    );
};

/** 第一層頁籤圖示。 */
const ShortcutIcon = (props: { item: SpecHomePage1821Shortcut; }) =>
{
    if (!props.item.IconFileId) return null;
    const src = FileManagementAPI.get_Public_Preview_Url(props.item.IconFileId);
    return (
        <div className="icon_area">
            <div className="icon_image">
                <img className="ii01_img" src={src} alt="" />
            </div>
        </div>
    );
};

/** 第一層單一內容面板。 */
const TopTabPane = (props: { lang: Lang; item: HomePageShortcutViewModel; index: number; active: boolean; }) =>
{
    if (props.item.shortcut.IsLink === true) return null;
    return (
        <div id={getTopPaneId(props.index)} className={`tab-pane fade${props.active ? " show active" : ""}`} role="tabpanel" aria-labelledby={getTopTabId(props.index)}>
            <div className="Second-Level-DivBox">
                <SecondLevelTabList modules={props.item.modules} topIndex={props.index} />
                <SecondLevelContent lang={props.lang} modules={props.item.modules} topIndex={props.index} />
            </div>
        </div>
    );
};

/** 第二層單一頁籤按鈕。 */
const SecondLevelTabButton = (props: { module: HomePageShortcutModuleViewModel; topIndex: number; index: number; }) =>
{
    const active = props.index === 0;
    return (
        <li className="nav-item" role="presentation">
            <button
                className={`nav-link w-100${active ? " active" : ""}`}
                id={getSecondTabId(props.topIndex, props.index)}
                data-bs-toggle="tab"
                data-bs-target={`#${getSecondPaneId(props.topIndex, props.index)}`}
                type="button"
                role="tab"
                aria-selected={active}
            >
                <span className="d-itemsBox">
                    <span className="tab-number me-lg-5 me-md-4 me-sm-3 me-2">{formatTwoDigits(props.index + 1)}</span>
                    <span className="Titletxt-bold">{props.module.setting.Title}</span>
                </span>
                <div className="card_arrow">
                    <i className="fas fa-chevron-right" aria-hidden="true"></i>
                </div>
            </button>
        </li>
    );
};

/** 第二層單一內容面板。 */
const SecondLevelPane = (props: { lang: Lang; module: HomePageShortcutModuleViewModel; topIndex: number; index: number; }) =>
{
    const active = props.index === 0;
    return (
        <div className={`tab-pane fade${active ? " show active" : ""}`} id={getSecondPaneId(props.topIndex, props.index)} role="tabpanel" aria-labelledby={getSecondTabId(props.topIndex, props.index)}>
            <div className="content-display-box">
                <ModuleContent lang={props.lang} module={props.module} />
            </div>
        </div>
    );
};

/** 第二層模組內容。 */
const ModuleContent = (props: { lang: Lang; module: HomePageShortcutModuleViewModel; }) =>
{
    if (props.module.moduleType === HomePageModuleType.FileArchive) return <FileArchiveModule lang={props.lang} module={props.module} />;
    return <AnnouncementModule lang={props.lang} module={props.module} />;
};

/** 公告模組內容。 */
const AnnouncementModule = (props: { lang: Lang; module: HomePageShortcutModuleViewModel; }) =>
{
    return (
        <div className="row mx-0">
            <ModuleTitle module={props.module} subTitle="Admissions News" />
            <div className="col-12">
                <div className="News_mainDIV">
                    <ul className="ListNews row row-cols-1 row-cols-sm-1 row-cols-md-1 row-cols-lg-2">
                        {props.module.announcementList.map((item) => <AnnouncementItem key={item.Announcement?.InternalId ?? item.Announcement?.AnnouncementId} lang={props.lang} item={item} moreViewLink={props.module.setting.MoreViewLink} />)}
                    </ul>
                </div>
                <MoreButton lang={props.lang} to={props.module.setting.MoreViewLink} title={`更多${props.module.setting.Title ?? "公告"}`} />
            </div>
        </div>
    );
};

/** 檔案下載模組內容。 */
const FileArchiveModule = (props: { lang: Lang; module: HomePageShortcutModuleViewModel; }) =>
{
    const gridData = buildFileArchiveGridProps(props.lang, props.module.fileArchiveList);
    return (
        <div className="row mx-0">
            <ModuleTitle module={props.module} subTitle="Admissions Download Files" />
            <div className="col-12">
                <div className="ALL_tTable_Display_Area">
                    <GridList_Comp gridData={gridData} title={props.module.setting.Title ?? "檔案下載列表"} />
                    <MoreButton lang={props.lang} to={props.module.setting.MoreViewLink} title={`更多${props.module.setting.Title ?? "檔案"}`} />
                </div>
            </div>
        </div>
    );
};

/** 公版 Grid 表格。 */
const GridList_Comp = (props: { title: string; gridData: GridProps; }) =>
{
    const [columns, setColumns] = useState<ColumnConfig[]>(props.gridData.columns);
    useEffect(() =>
    {
        const widths = readGridColumnWidths(FILE_ARCHIVE_GRID_COLUMN_WIDTH_STORAGE_KEY);
        const nextColumns = Object.keys(widths).length > 0 ? applyGridColumnWidths(props.gridData.columns, widths) : props.gridData.columns;
        setColumns(nextColumns);
    }, [props.gridData.columns]);
    const handleResize = (index: number, width: number): void =>
    {
        setColumns((prev) =>
        {
            const updated = prev.map((col, idx) => idx === index ? { ...col, width } : col);
            writeGridColumnWidths(FILE_ARCHIVE_GRID_COLUMN_WIDTH_STORAGE_KEY, updated);
            return updated;
        });
    };
    return (
        <table className="table table-striped table-bordered table-hover Files_table table-rwd" summary={props.title}>
            <caption>{props.title}</caption>
            <ColRender columns={columns} onResize={handleResize} />
            <RowRender rows={props.gridData.rows} />
        </table>
    );
};

/** 模組標題。 */
const ModuleTitle = (props: { module: HomePageShortcutModuleViewModel; subTitle: string; }) =>
{
    return (
        <div className="col-12">
            <div className="headDiv headDiv-left mb-sm-5 mb-4">
                <span className="headDiv-txt">{props.module.setting.Title}</span>
                <span className="diagonal-line mx-2">/</span>
                <span className="headDiv-subtxt">{props.module.setting.SubTitle || props.subTitle}</span>
            </div>
        </div>
    );
};

/** 公告列表項目。 */
const AnnouncementItem = (props: { lang: Lang; item: AnnouncementSet; moreViewLink?: string | null; }) =>
{
    const detail = getCurrentAnnouncementDetail(props.item, props.lang);
    const title = detail?.Title ?? "";
    const link = buildDetailLink(props.moreViewLink, props.item.Announcement?.InternalId);
    return (
        <li className="News_item">
            <LangLink to={link} lang={props.lang} className="d-block" title={title}>
                <div className="item-inner">
                    <NewsDate value={props.item.Announcement?.Validate_Start} />
                    <NewsText title={title} item={props.item} />
                </div>
            </LangLink>
        </li>
    );
};

/** 公告日期。 */
const NewsDate = (props: { value?: string | null; }) =>
{
    const date = getDateParts(props.value);
    return (
        <div className="leftBox">
            <div className="news-date-box">
                <div className="year">{date.yearMonth}</div>
                <div className="mm-dd">{date.day}</div>
            </div>
        </div>
    );
};

/** 公告文字。 */
const NewsText = (props: { title: string; item: AnnouncementSet; }) =>
{
    return (
        <div className="rightBox">
            <div className="card_catDiv">
                <div className="a-left">
                    <NewsState item={props.item} />
                    <div className="card_cat">
                        <div className="card_cat_link">
                            <span className="cat_title">系所公告</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card_titleDiv">
                <div className="card_title">{props.title}</div>
            </div>
        </div>
    );
};

/** 公告狀態標籤。 */
const NewsState = (props: { item: AnnouncementSet; }) =>
{
    const status = Number(props.item.Announcement?.ContentStatus ?? 0);
    return <div className="CustomState">{Boolean(status & 1) && <div className="icon-small top-bg">置頂</div>}{Boolean(status & 2) && <div className="icon-small hot-bg">熱門</div>}{Boolean(status & 4) && <div className="icon-small new-bg">最新</div>}</div>;
};

/** 檔案標題欄位。 */
const FileArchiveTitleCell = (props: { lang: Lang; item: FileArchiveSet; }) =>
{
    const info = getCurrentFileInfo(props.item, props.lang);
    return (
        <>
            <span>{info?.Title ?? ""}</span>
            <FileArchiveState item={props.item} />
        </>
    );
};

/** 檔案下載欄位。 */
const FileArchiveDownloadCell = (props: { lang: Lang; item: FileArchiveSet; }) =>
{
    const downloads = getDownloadLinks(props.item, props.lang);
    return <div className="Standard_btnDiv">{downloads.map((item) => <DownloadButton key={`${item.url}-${item.ext}`} item={item} />)}</div>;
};

/** 檔案狀態標籤。 */
const FileArchiveState = (props: { item: FileArchiveSet; }) =>
{
    const status = Number(props.item.FileArchive?.ContentStatus ?? 0);
    return (
        <div className="CustomState">
            {Boolean(status & 1) && <span className="label icon-small label-success">置頂</span>}
            {Boolean(status & 2) && <span className="label icon-small label-danger">熱門</span>}
            {Boolean(status & 4) && <span className="label icon-small label-warning">最新</span>}
        </div>
    );
};

/** 單一下載按鈕。 */
const DownloadButton = (props: { item: DownloadLinkViewModel; }) =>
{
    const ext = props.item.ext.toLowerCase();
    return (
        <a
            href={props.item.url}
            role="button"
            className={`btn btn-default bg_${ext}`}
            target={props.item.target ?? "_self"}
            rel={props.item.target === "_blank" ? "noopener noreferrer" : undefined}
            title={`${props.item.title || ext}${props.item.target === "_blank" ? " [ 另開新視窗 ]" : ""}`}
        >
            <span className={ext}>{ext}</span>
        </a>
    );
};

/** 更多按鈕。 */
const MoreButton = (props: { lang: Lang; to?: string | null; title: string; }) =>
{
    if (!LibText.isNonEmptyString(props.to)) return null;
    return (
        <div className="btn-w100-wrapper justify-content-center">
            <div className="customize_btn mt-md-3 mt-2">
                <LangLink to={props.to ?? ""} lang={props.lang} className="Btn_a" role="button" title={props.title}>
                    <div className="BtnBox">
                        <span>More View</span>
                        <span className="ml-2">+</span>
                    </div>
                </LangLink>
            </div>
        </div>
    );
};
// #endregion

// #region Private
/** 取得第一個可顯示內容的頁籤索引。 */
const getFirstPanelIndex = (items: HomePageShortcutViewModel[]) =>
{
    const index = items.findIndex((item) => item.shortcut.IsLink !== true);
    return index >= 0 ? index : 0;
};

/** 取得快捷標題。 */
const getShortcutTitle = (item: SpecHomePage1821Shortcut) =>
{
    return item.SubTitle ? `${item.Title ?? ""}${item.SubTitle}` : item.Title ?? "";
};

/** 格式化兩位數。 */
const formatTwoDigits = (value: number) =>
{
    return String(value).padStart(2, "0");
};

/** 取得第一層頁籤 ID。 */
const getTopTabId = (index: number) =>
{
    return `H-first-level-${formatTwoDigits(index + 1)}`;
};

/** 取得第一層內容 ID。 */
const getTopPaneId = (index: number) =>
{
    return `H-First-${formatTwoDigits(index + 1)}`;
};

/** 取得第二層代號。 */
const getSecondCode = (topIndex: number) =>
{
    return String.fromCharCode("A".charCodeAt(0) + topIndex);
};

/** 取得第二層頁籤清單 ID。 */
const getSecondTabListId = (topIndex: number) =>
{
    return `CENTER_${getSecondCode(topIndex)}0_SubTab`;
};

/** 取得第二層內容清單 ID。 */
const getSecondContentId = (topIndex: number) =>
{
    return `H-${getSecondCode(topIndex)}0-Second-DisplayTabContent`;
};

/** 取得第二層頁籤 ID。 */
const getSecondTabId = (topIndex: number, index: number) =>
{
    const code = getSecondCode(topIndex);
    return `Sub-${code}${code}${formatTwoDigits(index + 1)}`;
};

/** 取得第二層內容 ID。 */
const getSecondPaneId = (topIndex: number, index: number) =>
{
    const code = getSecondCode(topIndex);
    return `SubTabs-${code}${code}${formatTwoDigits(index + 1)}`;
};

/** 建立明細連結。 */
const buildDetailLink = (moreViewLink?: string | null, internalId?: string | null) =>
{
    const base = String(moreViewLink ?? "").trim();
    const id = String(internalId ?? "").trim();
    if (!base || !id) return base || "#";
    if (/^https?:\/\//i.test(base)) return base;
    return `${base.replace(/\/$/, "")}/${encodeURIComponent(id)}`;
};

/** 取得目前語系公告明細。 */
const getCurrentAnnouncementDetail = (item: AnnouncementSet, lang: Lang) =>
{
    return item.AnnouncementDetail?.find((row) => row.Lang === lang) ?? item.AnnouncementDetail?.[0];
};

/** 建立檔案下載 Grid 資料。 */
const buildFileArchiveGridProps = (lang: Lang, rows: FileArchiveSet[]): GridProps =>
{
    const columns = buildFileArchiveColumns();
    const gridRows = rows.map((item, index) => buildFileArchiveGridRow(lang, item, columns, index));
    return { columns, rows: gridRows, CurrentPage: 1, TotalPage: 1, onPageChange: () => undefined };
};

/** 建立檔案下載 Grid 欄位。 */
const buildFileArchiveColumns = (): ColumnConfig[] =>
{
    return [
        { key: FileArchiveGridColumnKey.Category, title: "檔案類別", width: 120 },
        { key: FileArchiveGridColumnKey.Title, title: "標題名稱", width: 320 },
        { key: FileArchiveGridColumnKey.Download, title: "檔案下載", width: 220 },
        { key: FileArchiveGridColumnKey.DownloadCount, title: "下載數", width: 90 },
        { key: FileArchiveGridColumnKey.UploadDate, title: "上傳日期", width: 120 },
    ];
};

/** 建立檔案下載 Grid 單列。 */
const buildFileArchiveGridRow = (lang: Lang, item: FileArchiveSet, columns: ColumnConfig[], index: number): GridRow =>
{
    const cells = columns.map((col) => buildFileArchiveGridCell(lang, item, col));
    const keyId = item.FileArchive?.InternalId ?? item.FileArchive?.FileArchiveId ?? `filearchive-${index}`;
    return { keyId, cells };
};

/** 建立檔案下載 Grid 欄位內容。 */
const buildFileArchiveGridCell = (lang: Lang, item: FileArchiveSet, col: ColumnConfig): RowCell =>
{
    return { col, content: getFileArchiveGridCellContent(lang, item, col.key) };
};

/** 取得檔案下載 Grid 欄位內容。 */
const getFileArchiveGridCellContent = (lang: Lang, item: FileArchiveSet, key: string): ReactNode =>
{
    if (key === FileArchiveGridColumnKey.Category) return "檔案室";
    if (key === FileArchiveGridColumnKey.Sort) return "0";
    if (key === FileArchiveGridColumnKey.Title) return <FileArchiveTitleCell lang={lang} item={item} />;
    if (key === FileArchiveGridColumnKey.Download) return <FileArchiveDownloadCell lang={lang} item={item} />;
    if (key === FileArchiveGridColumnKey.DownloadCount) return String(getDownloadCount(item));
    if (key === FileArchiveGridColumnKey.UploadDate) return formatDate(item.FileArchive?.CreateTime) ?? "";
    return "";
};

/** 取得目前語系檔案資訊。 */
const getCurrentFileInfo = (item: FileArchiveSet, lang: Lang) =>
{
    return item.FileArchiveInfo?.find((row) => row.Lang === lang) ?? item.FileArchiveInfo?.[0];
};

/** 取得目前語系檔案資訊 RowId。 */
const getCurrentFileInfoRowId = (item: FileArchiveSet, lang: Lang) =>
{
    return getCurrentFileInfo(item, lang)?.RowId;
};

/** 取得檔案下載項目。 */
const getFileDownloadLinks = (rows: FileArchiveDetail[]) =>
{
    return rows.filter((row) => !!row.FileSrcId).map((row) =>
    {
        const ext = row.FileSrc?.FileExtension ?? "file";
        const fileName = row.FileName ?? "";
        const url = ext.toLowerCase() === "pdf" ? FileManagementAPI.get_Public_Preview_Url(row.FileSrcId, fileName) : FileManagementAPI.get_Public_Download_Url(row.FileSrcId, fileName);
        return { url, title: fileName, ext, target: "_blank" as const };
    });
};

/** 取得外部下載項目。 */
const getUrlDownloadLinks = (rows: FileArchiveUrlDetail[]) =>
{
    return rows.filter((row) => !!row.Url).map((row) => ({ url: row.Url ?? "", title: row.UrlDescription ?? "", ext: "link", target: row.WindowTarget === 1 ? "_blank" as const : "_self" as const }));
};

/** 取得所有下載項目。 */
const getDownloadLinks = (item: FileArchiveSet, lang: Lang) =>
{
    const rowId = getCurrentFileInfoRowId(item, lang);
    const files = item.FileArchiveDetail?.filter((row) => row.ParentRowId === rowId) ?? item.FileArchiveDetail ?? [];
    const urls = item.FileArchiveUrlDetail?.filter((row) => row.ParentRowId === rowId) ?? item.FileArchiveUrlDetail ?? [];
    return [...getFileDownloadLinks(files), ...getUrlDownloadLinks(urls)];
};

/** 取得總下載數。 */
const getDownloadCount = (item: FileArchiveSet) =>
{
    return (item.FileArchiveDetail ?? []).reduce((sum, row) => sum + Number(row.FileSrc?.PublicDownloadCount ?? 0), 0);
};

/** 取得日期拆分。 */
const getDateParts = (value?: string | null) =>
{
    const text = formatDate(value) ?? "";
    const parts = text.replace(/\//g, ".").replace(/-/g, ".").split(".");
    return { yearMonth: parts.length >= 2 ? `${parts[0]}.${parts[1]}` : text, day: parts[2] ?? "" };
};

// #endregion
