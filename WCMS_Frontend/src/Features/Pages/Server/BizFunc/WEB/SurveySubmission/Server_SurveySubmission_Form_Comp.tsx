import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { SurveyFields, SurveySubmissionsFields } from "@/types/SchemaFields";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { type SurveySubmissionFormRawData, useSurveySubmissionFormFetchData } from "./Server_SurveySubmission_Form_Hook";

type SurveySubmissionSet = components["schemas"]["SurveySubmissionsSet_DTO"];
type SurveySubmissionAnswerValue = string | number | boolean | null | (string | number | boolean | null)[];

interface SurveySubmissionFieldLang
{
    Lang?: string | null;
    FieldName?: string | null;
}

interface SurveySubmissionFieldSnapshot
{
    FieldId?: string | null;
    FieldName?: string | null;
    InputType?: string | null;
    IsRequired?: boolean | null;
    Options?: string | null;
    Langs?: SurveySubmissionFieldLang[] | null;
}

interface ReadonlyFieldItem
{
    key: string;
    label: string;
    value: string;
    parentClass?: string;
}

interface AnswerDisplayItem
{
    key: string;
    label: string;
    value: string;
}

// #region Public

/** 問卷回應查看表單 */
export const Server_SurveySubmission_Form_Comp = (props: { theme: IBETheme; lang: Lang; }) =>
{
    const { internalId } = useParams();
    const getData = useSurveySubmissionFormFetchData({ lang: props.lang, surveySubmissionId: internalId ?? "" });

    const formTitle = useMemo(() =>
    {
        const surveyName = getData.rawData.data?.SurveySubmissions?.Survey?.SurveyName;
        return surveyName ? `查看問卷回應：${surveyName}` : "查看問卷回應";
    }, [getData.rawData.data]);

    const propForm: FormCompProp = { Title: formTitle, Theme: props.theme, IsLoading: getData.isLoading, ErrorList: getData.errors };

    return (
        <FormComp prop={propForm}>
            {getData.rawData.data
                ? <SurveySubmissionReadonlyContent theme={props.theme} lang={props.lang} raw={getData.rawData} />
                : <div className="alert alert-warning mb-0">查無問卷回應資料</div>}
        </FormComp>
    );
};

// #endregion

// #region Protected

/** 問卷回應只讀內容 */
const SurveySubmissionReadonlyContent = (props: { theme: IBETheme; lang: Lang; raw: SurveySubmissionFormRawData; }) =>
{
    const tabInfo = useMemo<LibTabsProp>(() =>
    {
        return { Style: props.theme.Tabs, item: { Basic: "基本資料", Answers: "回覆內容", System: "系統資訊" } };
    }, [props.theme.Tabs]);

    const basicItems = useMemo(() => buildBasicItems(props.raw, props.lang), [props.raw, props.lang]);
    const answerItems = useMemo(() => buildAnswerItems(props.raw.data, props.lang), [props.raw.data, props.lang]);
    const systemItems = useMemo(() => buildSystemItems(props.raw), [props.raw]);

    const tabContent = useMemo<Record<string, React.ReactNode[]>>(() =>
    {
        return {
            Basic: renderReadonlyFields({ theme: props.theme, items: basicItems }),
            Answers: answerItems.length > 0
                ? renderAnswerFields({ theme: props.theme, items: answerItems })
                : [<div className="alert alert-secondary mb-0">沒有可顯示的回覆內容</div>],
            System: renderReadonlyFields({ theme: props.theme, items: systemItems }),
        };
    }, [props.theme, basicItems, answerItems, systemItems]);

    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};

/** 建立基本資料欄位 */
const buildBasicItems = (raw: SurveySubmissionFormRawData, lang: Lang): ReadonlyFieldItem[] =>
{
    const item = raw.data?.SurveySubmissions;

    return [
        {
            key: SurveyFields.SurveyName,
            label: getColumnTitle(raw, SurveyFields.SurveyName, "問卷名稱"),
            value: item?.Survey?.SurveyName ?? "",
            parentClass: "col-12",
        },
        {
            key: SurveySubmissionsFields.SurveySubmissionId,
            label: getColumnTitle(raw, SurveySubmissionsFields.SurveySubmissionId, "回應代碼"),
            value: item?.SurveySubmissionId ?? "",
        },
        { key: SurveySubmissionsFields.SurveyId, label: getColumnTitle(raw, SurveySubmissionsFields.SurveyId, "問卷代碼"), value: item?.SurveyId ?? "" },
        { key: SurveySubmissionsFields.UserName, label: getColumnTitle(raw, SurveySubmissionsFields.UserName, "姓名"), value: item?.UserName ?? "" },
        { key: SurveySubmissionsFields.Email, label: getColumnTitle(raw, SurveySubmissionsFields.Email, "Email"), value: item?.Email ?? "" },
        {
            key: SurveySubmissionsFields.ContactPhone,
            label: getColumnTitle(raw, SurveySubmissionsFields.ContactPhone, "聯絡電話"),
            value: item?.ContactPhone ?? "",
        },
        { key: SurveySubmissionsFields.Lang, label: getColumnTitle(raw, SurveySubmissionsFields.Lang, "語系"), value: item?.Lang ?? "" },
        {
            key: SurveySubmissionsFields.SubmitTime,
            label: getColumnTitle(raw, SurveySubmissionsFields.SubmitTime, "提交時間"),
            value: FormatDateTime(item?.SubmitTime),
        },
        {
            key: SurveySubmissionsFields.ReplyStatus,
            label: getColumnTitle(raw, SurveySubmissionsFields.ReplyStatus, "回覆狀態"),
            value: getReplyStatusText(item?.ReplyStatus, lang),
        },
    ];
};

/** 建立動態回覆欄位 */
const buildAnswerItems = (data: SurveySubmissionSet | null, lang: Lang): AnswerDisplayItem[] =>
{
    const item = data?.SurveySubmissions;
    const answerMap = parseAnswerMap(item?.FormDataJson);
    const snapshots = parseFieldSnapshots(item?.FieldSnapshotJson);

    return snapshots.map((field) =>
    {
        const fieldId = `${field.FieldId ?? ""}`.trim();
        const label = getSnapshotFieldName(field, lang);
        const value = formatAnswerValue(answerMap[fieldId]);

        return { key: fieldId, label, value };
    }).filter(p => Boolean(p.key));
};

/** 建立系統資訊欄位 */
const buildSystemItems = (raw: SurveySubmissionFormRawData): ReadonlyFieldItem[] =>
{
    const item = raw.data?.SurveySubmissions;

    return [
        {
            key: SurveySubmissionsFields.AcceptLanguage,
            label: getColumnTitle(raw, SurveySubmissionsFields.AcceptLanguage, "瀏覽器語系"),
            value: item?.AcceptLanguage ?? "",
        },
        { key: SurveySubmissionsFields.TimeZone, label: getColumnTitle(raw, SurveySubmissionsFields.TimeZone, "時區"), value: item?.TimeZone ?? "" },
        {
            key: SurveySubmissionsFields.ClientIpMasked,
            label: getColumnTitle(raw, SurveySubmissionsFields.ClientIpMasked, "IP"),
            value: item?.ClientIpMasked ?? "",
        },
        {
            key: SurveySubmissionsFields.ClientIpHash,
            label: getColumnTitle(raw, SurveySubmissionsFields.ClientIpHash, "IP Hash"),
            value: item?.ClientIpHash ?? "",
            parentClass: "col-12",
        },
        { key: SurveySubmissionsFields.BrowserName, label: getColumnTitle(raw, SurveySubmissionsFields.BrowserName, "瀏覽器"), value: item?.BrowserName ?? "" },
        {
            key: SurveySubmissionsFields.BrowserVersion,
            label: getColumnTitle(raw, SurveySubmissionsFields.BrowserVersion, "瀏覽器版本"),
            value: item?.BrowserVersion ?? "",
        },
        { key: SurveySubmissionsFields.OsName, label: getColumnTitle(raw, SurveySubmissionsFields.OsName, "作業系統"), value: item?.OsName ?? "" },
        { key: SurveySubmissionsFields.OsVersion, label: getColumnTitle(raw, SurveySubmissionsFields.OsVersion, "系統版本"), value: item?.OsVersion ?? "" },
        { key: SurveySubmissionsFields.DeviceType, label: getColumnTitle(raw, SurveySubmissionsFields.DeviceType, "裝置類型"), value: item?.DeviceType ?? "" },
        {
            key: SurveySubmissionsFields.UserAgent,
            label: getColumnTitle(raw, SurveySubmissionsFields.UserAgent, "User Agent"),
            value: item?.UserAgent ?? "",
            parentClass: "col-12",
        },
    ];
};

// #endregion

// #region Private

/** 渲染只讀欄位 */
const renderReadonlyFields = (p: { theme: IBETheme; items: ReadonlyFieldItem[]; }): React.ReactNode[] =>
{
    return p.items.map((item) => (
        <LibTextBox
            key={item.key}
            Style={p.theme.TextBox}
            ColumnDisplayName={item.label}
            DefaultInputDisplay=""
            InputValue={item.value}
            disabled={true}
            parentClass={item.parentClass ?? "col-xxl-6 col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12"}
        />
    ));
};

/** 渲染回覆欄位 */
const renderAnswerFields = (p: { theme: IBETheme; items: AnswerDisplayItem[]; }): React.ReactNode[] =>
{
    return p.items.map((item) => (
        <LibTextBox
            key={item.key}
            Style={p.theme.TextBox}
            ColumnDisplayName={item.label}
            DefaultInputDisplay=""
            InputValue={item.value}
            disabled={true}
            parentClass="col-12"
        />
    ));
};

/** 解析問卷回覆 JSON */
const parseAnswerMap = (json?: string | null): Record<string, SurveySubmissionAnswerValue> =>
{
    if (!json) return {};

    try
    {
        return JSON.parse(json) as Record<string, SurveySubmissionAnswerValue>;
    } catch
    {
        return {};
    }
};

/** 解析問卷欄位快照 JSON */
const parseFieldSnapshots = (json?: string | null): SurveySubmissionFieldSnapshot[] =>
{
    if (!json) return [];

    try
    {
        const result = JSON.parse(json) as SurveySubmissionFieldSnapshot[];
        return Array.isArray(result) ? result : [];
    } catch
    {
        return [];
    }
};

/** 取得欄位快照顯示名稱 */
const getSnapshotFieldName = (field: SurveySubmissionFieldSnapshot, lang: Lang): string =>
{
    const langName = field.Langs?.find(p => normalizeLang(p.Lang) === normalizeLang(lang))?.FieldName;
    return langName || field.FieldName || field.FieldId || "";
};

/** 格式化回覆值 */
const formatAnswerValue = (value: SurveySubmissionAnswerValue | undefined): string =>
{
    if (Array.isArray(value)) return value.map(p => `${p ?? ""}`.trim()).filter(Boolean).join("、");
    if (value === null || value === undefined) return "";
    if (typeof value === "boolean") return value ? "是" : "否";
    return `${value}`;
};

/** 取得欄位顯示名稱 */
const getColumnTitle = (raw: SurveySubmissionFormRawData, col: string, fallback: string): string =>
{
    const tables = raw.modelDisplayName?.Tables ?? [];
    const hit = tables.flatMap(p => p.Columns ?? []).find(p => p.ColumnId === col);
    return hit?.ColumnDisplayName ?? fallback;
};

/** 取得回覆狀態文字 */
const getReplyStatusText = (value: boolean | null | undefined, lang: Lang): string =>
{
    if (lang === "en") return value ? "Replied" : "Not replied";
    return value ? "已回覆" : "未回覆";
};

const normalizeLang = (value?: string | null): string => `${value ?? ""}`.replaceAll("-", "").replaceAll("_", "").toLowerCase();

// #endregion
