import { SurveySubmissionAdapter } from "@/Features/Hooks/BizFunc/WEB/SurveySubmission_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { enhanceGridWithAdjustCell, type GridAdjustAction } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValue, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID, SurveyFields, SurveySubmissionsFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type SurveySubmissionSet = components["schemas"]["SurveySubmissionsSet_DTO"];
type SurveySubmissionApiAdapter = ReturnType<typeof SurveySubmissionAdapter>;

export const SURVEY_SUBMISSION_SURVEY_NAME_SEARCH_KEY = "surveyName";
export const SURVEY_SUBMISSION_USER_NAME_SEARCH_KEY = "userName";
export const SURVEY_SUBMISSION_EMAIL_SEARCH_KEY = "email";

export interface SurveySubmissionSearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 問卷名稱搜尋關鍵字 */
    surveyName?: string;

    /** 填寫人姓名搜尋關鍵字 */
    userName?: string;

    /** 填寫人 Email 搜尋關鍵字 */
    email?: string;
}

export interface SurveySubmissionListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 問卷回應列表資料 */
    list: SurveySubmissionSet[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;
}

export interface SurveySubmissionListAdapter
{
    /** 問卷回應 API adapter */
    SurveySubmission: SurveySubmissionApiAdapter;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的查看頁路徑 */
    viewUrl: string;
}

export type SurveySubmissionListGridTemplate = ServerListGridTemplate<SurveySubmissionSearchParams, SurveySubmissionListRawData, SurveySubmissionListAdapter, QueryListParam>;

/** 建立問卷回應後台 ListGridTemplate 設定 */
export const useSurveySubmissionListGridTemplate = (opt: { lang: Lang; }): SurveySubmissionListGridTemplate =>
{
    return useMemo<SurveySubmissionListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.SurveySubmission,
            feature: {
                buildSearchFields: ({ rawData }) => buildSurveySubmissionSearchFields(rawData),
                toSearchParams: (values) => toSurveySubmissionSearchParams(values, opt.lang),
                buildSearchConditions: buildSurveySubmissionSearchConditions,
                buildQueryParam: buildSurveySubmissionQueryParam,
                useDataSource: useSurveySubmissionListGridDataSource,
                buildGridProps: (ctx) => buildSurveySubmissionGridProps({ raw: ctx.rawData, lang: ctx.searchParams.lang, adapter: ctx.adapter }),
            },
        };
    }, [opt.lang]);
};

/** 執行問卷回應列表資料來源 Hook */
const useSurveySubmissionListGridDataSource = (
    ctx: ServerListGridDataSourceContext<SurveySubmissionSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<SurveySubmissionListRawData, SurveySubmissionListAdapter> =>
{
    const { publish } = useToast();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const viewUrl = useMemo(() => pathname.replace(/\/SubmitList$/, "/SubmitForm"), [pathname]);

    const onError = useCallback((e: ApiAdapterError): void =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const apiAdapter = useMemo(() =>
    {
        return { SurveySubmission: SurveySubmissionAdapter() };
    }, []);

    const grid = apiAdapter.SurveySubmission.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });

    const isLoading = Boolean(grid.isLoading);
    const errors = useMemo(() => (grid.errors ?? []).filter((x): x is string => Boolean(x)), [grid.errors]);
    const rawData = useMemo<SurveySubmissionListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count ?? 0,
            list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            param: grid.param,
        };
    }, [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param]);

    const refetchData = useCallback(async (): Promise<void> =>
    {
        await grid.refetchData();
    }, [grid]);

    return { adapter: { ...apiAdapter, navigate, viewUrl }, rawData, isLoading, errors, refetchData };
};

/** 建立問卷回應搜尋欄位設定 */
const buildSurveySubmissionSearchFields = (rawData: SurveySubmissionListRawData): SearchFieldConfig[] =>
{
    const surveyName = getColumnTitle(rawData.modelDisplayName, SurveyFields.SurveyName, "問卷名稱");
    const userName = getColumnTitle(rawData.modelDisplayName, SurveySubmissionsFields.UserName, "姓名");
    const email = getColumnTitle(rawData.modelDisplayName, SurveySubmissionsFields.Email, "Email");

    return [
        { key: SURVEY_SUBMISSION_SURVEY_NAME_SEARCH_KEY, title: surveyName, type: "text", placeholder: `請輸入${surveyName}` },
        { key: SURVEY_SUBMISSION_USER_NAME_SEARCH_KEY, title: userName, type: "text", placeholder: `請輸入${userName}` },
        { key: SURVEY_SUBMISSION_EMAIL_SEARCH_KEY, title: email, type: "text", placeholder: `請輸入${email}` },
    ];
};

/** 將 SearchValues 轉為問卷回應列表查詢參數 */
const toSurveySubmissionSearchParams = (values: SearchValues, lang: Lang): SurveySubmissionSearchParams =>
{
    return {
        lang,
        surveyName: getSearchStringValue(values[SURVEY_SUBMISSION_SURVEY_NAME_SEARCH_KEY]),
        userName: getSearchStringValue(values[SURVEY_SUBMISSION_USER_NAME_SEARCH_KEY]),
        email: getSearchStringValue(values[SURVEY_SUBMISSION_EMAIL_SEARCH_KEY]),
    };
};

/** 建立問卷回應搜尋條件 */
const buildSurveySubmissionSearchConditions = (ctx: { searchParams: SurveySubmissionSearchParams; }): string[] =>
{
    const conditions: string[] = [];

    if (ctx.searchParams.surveyName)
    {
        conditions.push(`${SurveySubmissionsFields.Survey}.${SurveyFields.SurveyName} Like ${ctx.searchParams.surveyName}`);
    }

    if (ctx.searchParams.userName)
    {
        conditions.push(`${SurveySubmissionsFields.UserName} Like ${ctx.searchParams.userName}`);
    }

    if (ctx.searchParams.email)
    {
        conditions.push(`${SurveySubmissionsFields.Email} Like ${ctx.searchParams.email}`);
    }

    return conditions;
};

/** 建立問卷回應列表完整 QueryParam */
const buildSurveySubmissionQueryParam = (ctx: { searchParams: SurveySubmissionSearchParams; searchCondition: string; }): QueryListParam =>
{
    const fields = buildSurveySubmissionQueryFields();
    const langCondition = `${SurveySubmissionsFields.Lang} = ${ctx.searchParams.lang}`;
    const condition = LibMerge(" And ", false, langCondition, ctx.searchCondition);

    return { Fields: fields, Condition: condition, OrderBy: [{ Col: SurveySubmissionsFields.SubmitTime, Desc: true }], PageNumber: 1, PageSize: 10 };
};

/** 建立問卷回應列表查詢欄位 */
const buildSurveySubmissionQueryFields = (): string[] =>
{
    return [
        SurveySubmissionsFields.SurveySubmissionId,
        SurveySubmissionsFields.SurveyId,
        SurveySubmissionsFields.UserName,
        SurveySubmissionsFields.ContactPhone,
        SurveySubmissionsFields.Email,
        SurveySubmissionsFields.FormDataJson,
        SurveySubmissionsFields.FieldSnapshotJson,
        SurveySubmissionsFields.Lang,
        SurveySubmissionsFields.SubmitTime,
        SurveySubmissionsFields.ReplyStatus,
        SurveySubmissionsFields.UserAgent,
        SurveySubmissionsFields.AcceptLanguage,
        SurveySubmissionsFields.ClientIpMasked,
        SurveySubmissionsFields.BrowserName,
        SurveySubmissionsFields.BrowserVersion,
        SurveySubmissionsFields.OsName,
        SurveySubmissionsFields.OsVersion,
        SurveySubmissionsFields.DeviceType,
        SurveySubmissionsFields.TimeZone,
        `${SurveySubmissionsFields.Survey}.${SurveyFields.SurveyName}`,
    ];
};

/** 將問卷回應資料轉為 GridProps */
const buildSurveySubmissionGridProps = (opt: { raw: SurveySubmissionListRawData; lang: Lang; adapter?: SurveySubmissionListAdapter; }): GridProps =>
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

    if (!opt.adapter) return baseGrid;

    return enhanceGridWithAdjustCell(baseGrid, {
        lang: opt.lang,
        rawList: opt.raw.list ?? [],
        actions: buildViewActions<SurveySubmissionSet>(opt.adapter),
        getInternalId: (set) => set.SurveySubmissions?.SurveySubmissionId ?? "",
    });
};

/** 建立查看動作 */
const buildViewActions = <TItem,>(adapter: SurveySubmissionListAdapter): GridAdjustAction<TItem>[] =>
{
    return [{
        id: "view",
        label: { "zh-tw": "查看", en: "View" },
        ariaLabel: { "zh-tw": "查看問卷回應", en: "View survey submission" },
        iconClassName: "fa-eye",
        getDisabledReason: (ctx) => ctx.internalId ? null : ctx.lang === "en" ? "Missing submission id" : "缺少回應代碼",
        onClick: (ctx) =>
        {
            adapter.navigate(`${adapter.viewUrl}/${ctx.internalId}`);
        },
    }];
};

/** 建立問卷回應列表欄位 */
const buildColumns = (visibleCols: string[], raw: SurveySubmissionListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) => ({ key: col, title: getColumnTitle(raw.modelDisplayName, col, getColumnFallbackTitle(col)) }));
};

/** 建立問卷回應列表列資料 */
const buildSurveySubmissionRows = (raw: SurveySubmissionListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) =>
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

/** 依欄位代碼取得 ModelDisplayName 顯示文字 */
const getColumnTitle = (modelDisplayName: ModelDisplaySchema | null, columnId: string, fallback: string): string =>
{
    const tables = modelDisplayName?.Tables ?? [];
    const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === columnId);
    return hit?.ColumnDisplayName ?? fallback;
};

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

/** 取得 SearchValue 的文字值 */
const getSearchStringValue = (value: SearchValue): string | undefined =>
{
    if (typeof value !== "string") return undefined;

    const text = value.trim();
    return text.length > 0 ? text : undefined;
};

/** 取得回覆狀態文字 */
const getReplyStatusText = (value: boolean | null | undefined, lang: Lang): string =>
{
    if (lang === "en") return value ? "Replied" : "Not replied";
    return value ? "已回覆" : "未回覆";
};
