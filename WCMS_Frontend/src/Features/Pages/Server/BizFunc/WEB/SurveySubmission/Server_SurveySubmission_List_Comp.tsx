import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { SurveyFields, SurveySubmissionsFields } from "@/types/SchemaFields";
import { useMemo, useState } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";
import { enhanceGridWithAdjustCell, type GridAdjustAction } from "../../../Scaffold/Content/GridAdjustCellEnhance";
import { type SurveySubmissionListRawData, useSurveySubmissionListFetchData } from "./Server_SurveySubmission_List_Hook";

type SurveySubmissionSet = components["schemas"]["SurveySubmissionsSet_DTO"];

// #region Public

/** 問卷提交清單 */
export const Server_SurveySubmission_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const [kw, setKw] = useState<string>("");
    const pathname = useLocation().pathname;
    const viewUrl = useMemo(() => pathname.replace(/\/SubmitList$/, "/SubmitForm"), [pathname]);
    const navigate = useNavigate();

    const searchCompProp: SearchBarProps = {
        title: "問卷回應搜尋",
        subTitle: "搜尋姓名、Email、電話或問卷代碼 ...",
        onSubmit: setKw,
        onReset: () => setKw(""),
    };

    const getData = useSurveySubmissionListFetchData({ lang: prop.lang, kw });

    const gridData = useMemo(() =>
    {
        return buildSurveySubmissionGridProps({ raw: getData.rawData, lang: prop.lang, view: { navigate, viewUrl } });
    }, [getData.rawData, prop.lang, navigate, viewUrl]);

    return (
        <ListComp
            Title={prop.title}
            Theme={prop.theme}
            isLoading={getData.isLoading}
            ErrorList={getData.errors}
            GridData={gridData}
            SearchBar={searchCompProp}
        />
    );
};

// #endregion

// #region Protected

type ViewDeps = { navigate: NavigateFunction; viewUrl: string; };

/** 建立問卷提交清單 Grid */
const buildSurveySubmissionGridProps = (opt: { raw: SurveySubmissionListRawData; lang: Lang; view: ViewDeps; }): GridProps =>
{
    const visibleCols = [
        SurveyFields.SurveyName,
        SurveySubmissionsFields.UserName,
        SurveySubmissionsFields.Email,
        SurveySubmissionsFields.ContactPhone,
        SurveySubmissionsFields.Lang,
        SurveySubmissionsFields.SubmitTime,
        SurveySubmissionsFields.ReplyStatus,
    ];

    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildSurveySubmissionRows(opt.raw, opt.lang, columns);

    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    const actions = buildViewActions<SurveySubmissionSet>(opt.view);

    return enhanceGridWithAdjustCell(baseGrid, {
        lang: opt.lang,
        rawList: opt.raw.list ?? [],
        actions,
        getInternalId: (set) => set.SurveySubmissions?.SurveySubmissionId ?? "",
    });
};

/** 建立查看動作 */
const buildViewActions = <TItem,>(deps: ViewDeps): GridAdjustAction<TItem>[] =>
{
    return [{
        id: "view",
        label: { "zh-tw": "查看", en: "View" },
        ariaLabel: { "zh-tw": "查看問卷回應", en: "View survey submission" },
        iconClassName: "fa-eye",
        getDisabledReason: (ctx) => ctx.internalId ? null : ctx.lang === "en" ? "Missing submission id" : "缺少回應代碼",
        onClick: (ctx) =>
        {
            deps.navigate(`${deps.viewUrl}/${ctx.internalId}`);
        },
    }];
};

/** 建立清單欄位 */
const buildColumns = (visibleCols: string[], raw: SurveySubmissionListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) =>
    {
        const tables = raw.modelDisplayName?.Tables ?? [];
        const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === col);
        return { key: col, title: hit?.ColumnDisplayName ?? getColumnFallbackTitle(col) };
    });
};

/** 建立清單資料列 */
const buildSurveySubmissionRows = (raw: SurveySubmissionListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set: SurveySubmissionSet) =>
    {
        const item = set.SurveySubmissions;
        const keyId = LibMerge("|", false, item?.SurveySubmissionId, item?.SurveyId);

        const cells: RowCell[] = [
            { col: columns[0], content: item?.Survey?.SurveyName ?? item?.SurveyId ?? "" },
            { col: columns[1], content: item?.UserName ?? "" },
            { col: columns[2], content: item?.Email ?? "" },
            { col: columns[3], content: item?.ContactPhone ?? "" },
            { col: columns[4], content: item?.Lang ?? "" },
            { col: columns[5], content: FormatDateTime(item?.SubmitTime) },
            { col: columns[6], content: getReplyStatusText(item?.ReplyStatus, lang) },
        ];

        return { keyId, cells };
    });
};

// #endregion

// #region Private

/** 取得欄位預設名稱 */
const getColumnFallbackTitle = (col: string): string =>
{
    const map: Record<string, string> = {
        [SurveyFields.SurveyName]: "問卷名稱",
        [SurveySubmissionsFields.UserName]: "姓名",
        [SurveySubmissionsFields.Email]: "Email",
        [SurveySubmissionsFields.ContactPhone]: "聯絡電話",
        [SurveySubmissionsFields.Lang]: "語系",
        [SurveySubmissionsFields.SubmitTime]: "提交時間",
        [SurveySubmissionsFields.ReplyStatus]: "回覆狀態",
    };

    return map[col] ?? `【${col}】`;
};

/** 取得回覆狀態文字 */
const getReplyStatusText = (value: boolean | null | undefined, lang: Lang): string =>
{
    if (lang === "en") return value ? "Replied" : "Not replied";
    return value ? "已回覆" : "未回覆";
};

// #endregion
