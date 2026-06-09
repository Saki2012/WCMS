import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import { formatDateTime } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { SurveyFields, SurveySubmissionsFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    type SurveySubmissionFormRawData,
    useSurveySubmissionFormTemplate,
} from "./Server_SurveySubmission_Form_Hook";

// #region Property
type SurveySubmissionSet = components["schemas"]["SurveySubmissionsSet_DTO"];

type SurveySubmissionAnswerValue = string | number | boolean | null | (string | number | boolean | null)[];


interface SurveySubmissionFormCompProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;
}


interface SurveySubmissionReadonlyContentProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;

    /** Form Template 整理後的只讀資料 */
    rawData: SurveySubmissionFormRawData;
}


interface SurveySubmissionFieldLang
{
    /** 欄位語系 */
    Lang?: string | null;

    /** 該語系欄位名稱 */
    FieldName?: string | null;
}


interface SurveySubmissionFieldSnapshot
{
    /** 欄位代碼 */
    FieldId?: string | null;

    /** 欄位預設名稱 */
    FieldName?: string | null;

    /** 輸入型別 */
    InputType?: string | null;

    /** 是否必填 */
    IsRequired?: boolean | null;

    /** 選項 JSON */
    Options?: string | null;

    /** 欄位語系名稱快照 */
    Langs?: SurveySubmissionFieldLang[] | null;
}


interface ReadonlyFieldItem
{
    /** 欄位 key */
    key: string;

    /** 顯示名稱 */
    label: string;

    /** 顯示值 */
    value: string;

    /** 欄位外層 class */
    parentClass?: string;
}


interface AnswerDisplayItem
{
    /** 欄位 key */
    key: string;

    /** 回覆欄位名稱 */
    label: string;

    /** 回覆內容 */
    value: string;
}
// #endregion

// #region Public
/** 問卷回應查看表單，只讀模式不提供 Save / Delete。 */
export const Server_SurveySubmission_Form_Comp = (
    props: SurveySubmissionFormCompProps,
) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;

    const onBackToList = useCallback(() =>
    {
        navigate(buildBackToListPath(pathname));
    }, [navigate, pathname]);

    const actionsOpt = useMemo(() =>
    {
        return { onBackToList };
    }, [onBackToList]);

    const template = useSurveySubmissionFormTemplate({
        lang: props.lang,
        theme: props.theme,
        surveySubmissionId: internalId ?? "",
        actionsOpt,
    });

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => (
                vm.rawData.data
                    ? <SurveySubmissionReadonlyContent theme={props.theme} lang={props.lang} rawData={vm.rawData} />
                    : <div className="alert alert-warning mb-0">查無問卷回應資料</div>
            )}
        />
    );
};
// #endregion

// #region Section
/** 渲染回覆內容區塊，沒有快照時顯示提示。 */
const renderAnswerSection = (p: { theme: IBETheme; items: AnswerDisplayItem[]; }): ReactNode[] =>
{
    if (p.items.length <= 0) return [<div key="empty-answer" className="alert alert-secondary mb-0">沒有可顯示的回覆內容</div>];
    return renderAnswerFields(p);
};
// #endregion

// #region EntityComp
/** 渲染只讀欄位，維持舊版 Header input 外觀但全部 disabled。 */
const renderReadonlyFields = (p: { theme: IBETheme; items: ReadonlyFieldItem[]; }): ReactNode[] =>
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


/** 渲染問卷動態欄位回覆內容，全部以只讀文字呈現。 */
const renderAnswerFields = (p: { theme: IBETheme; items: AnswerDisplayItem[]; }): ReactNode[] =>
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


/** 建立基本資料欄位。 */
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
            value: formatDateTime(item?.SubmitTime),
        },
        {
            key: SurveySubmissionsFields.ReplyStatus,
            label: getColumnTitle(raw, SurveySubmissionsFields.ReplyStatus, "回覆狀態"),
            value: getReplyStatusText(item?.ReplyStatus, lang),
        },
    ];
};


/** 建立動態回覆欄位。 */
const buildAnswerItems = (data: SurveySubmissionSet | null, lang: Lang): AnswerDisplayItem[] =>
{
    const item = data?.SurveySubmissions;
    const answerMap = parseAnswerMap(item?.FormDataJson);
    const snapshots = parseFieldSnapshots(item?.FieldSnapshotJson);

    return snapshots.map((field) => buildAnswerItem(field, answerMap, lang)).filter((item): item is AnswerDisplayItem => Boolean(item?.key));
};


/** 建立單一動態回覆欄位。 */
const buildAnswerItem = (
    field: SurveySubmissionFieldSnapshot,
    answerMap: Record<string, SurveySubmissionAnswerValue>,
    lang: Lang,
): AnswerDisplayItem | null =>
{
    const fieldId = `${field.FieldId ?? ""}`.trim();
    if (!fieldId) return null;

    return { key: fieldId, label: getSnapshotFieldName(field, lang), value: formatAnswerValue(answerMap[fieldId]) };
};


/** 建立系統資訊欄位。 */
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


/** 建立返回列表頁路徑。 */
const buildBackToListPath = (pathname: string): string =>
{
    return pathname.replace(/\/Form(\/[^\/]*)?$/, "/List");
};
// #endregion

// #region Private
/** 問卷回應只讀內容，依照基本資料、回覆內容、系統資訊分頁呈現。 */
const SurveySubmissionReadonlyContent = (props: SurveySubmissionReadonlyContentProps) =>
{
    const tabInfo = useMemo<LibTabsProp>(() =>
    {
        return { Style: props.theme.Tabs, item: { Basic: "基本資料", Answers: "回覆內容", System: "系統資訊" } };
    }, [props.theme.Tabs]);

    const basicItems = useMemo(() => buildBasicItems(props.rawData, props.lang), [props.rawData, props.lang]);
    const answerItems = useMemo(() => buildAnswerItems(props.rawData.data, props.lang), [props.rawData.data, props.lang]);
    const systemItems = useMemo(() => buildSystemItems(props.rawData), [props.rawData]);
    const tabContent = useMemo<Record<string, ReactNode[]>>(() =>
    {
        return {
            Basic: renderReadonlyFields({ theme: props.theme, items: basicItems }),
            Answers: renderAnswerSection({ theme: props.theme, items: answerItems }),
            System: renderReadonlyFields({ theme: props.theme, items: systemItems }),
        };
    }, [props.theme, basicItems, answerItems, systemItems]);

    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};


/** 解析問卷回覆 JSON。 */
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


/** 解析問卷欄位快照 JSON。 */
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


/** 取得欄位快照顯示名稱。 */
const getSnapshotFieldName = (field: SurveySubmissionFieldSnapshot, lang: Lang): string =>
{
    const langName = field.Langs?.find(p => normalizeLang(p.Lang) === normalizeLang(lang))?.FieldName;
    return langName || field.FieldName || field.FieldId || "";
};


/** 格式化回覆值。 */
const formatAnswerValue = (value: SurveySubmissionAnswerValue | undefined): string =>
{
    if (Array.isArray(value)) return value.map(p => `${p ?? ""}`.trim()).filter(Boolean).join("、");
    if (value === null || value === undefined) return "";
    if (typeof value === "boolean") return value ? "是" : "否";
    return `${value}`;
};


/** 取得欄位顯示名稱。 */
const getColumnTitle = (raw: SurveySubmissionFormRawData, col: string, fallback: string): string =>
{
    const tables = raw.modelDisplayName?.Tables ?? [];
    const hit = tables.flatMap(p => p.Columns ?? []).find(p => p.ColumnId === col);
    return hit?.ColumnDisplayName ?? fallback;
};


/** 取得回覆狀態文字。 */
const getReplyStatusText = (value: boolean | null | undefined, lang: Lang): string =>
{
    if (lang === "en") return value ? "Replied" : "Not replied";
    return value ? "已回覆" : "未回覆";
};


/** 正規化語系字串，讓 zh-TW / zh_tw 可以正確比對。 */
const normalizeLang = (value?: string | null): string => `${value ?? ""}`.replaceAll("-", "").replaceAll("_", "").toLowerCase();
// #endregion
