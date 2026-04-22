import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibCalendar, LibTextBox, LibTinyMCE } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { TimelineFields, TimelineItemFields, TimelineLangDetailFields, TimelineSetFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTimelineFormFetchData } from "./Server_Timeline_Form_Hook";
type TimelineSet = components["schemas"]["TimelineSet_DTO"];
type TimelineItem = components["schemas"]["TimelineItem_DTO"];

const emptyData: TimelineSet = {
    Timeline: {},
    TimelineItem: [{ RowId: 1, Date: null }],
    TimelineLangDetail: [],
};
export const Server_Timeline_Form_Comp = (props: { theme: IBETheme; lang: Lang; }) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const onBackToList = useCallback(() =>
    {
        navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));
    }, [navigate, pathname]);
    const actionsOpt = useMemo(() =>
    {
        return { onBackToList };
    }, [onBackToList]);
    const getData = useTimelineFormFetchData({
        lang: props.lang,
        internalId: internalId ?? "",
        emptyData,
        actionsOpt,
    });
    useEnsureLangDetails(getData.rawData.formData, {
        headerName: TimelineSetFields.TimelineItem,
        detailName: TimelineSetFields.TimelineLangDetail,
        parentKeys: [TimelineLangDetailFields.TimelineId, TimelineLangDetailFields.ParentRowId],
        preferFirstLang: props.lang,
    });
    const propForm: FormCompProp = {
        Title: internalId ? "修改紀事" : "新增紀事",
        Theme: props.theme,
        IsLoading: getData.isLoading,
        ErrorList: getData.errors,
        Actions: getData.rawData.actions,
    };

    // return（不動 div/DOM 結構）
    return (
        <FormComp prop={propForm}>
            <HeaderComp
                theme={props.theme}
                formData={getData.rawData.formData}
                cateOpts={getData.rawData.categoryMap}
                statusOpts={getData.rawData.statusOpts}
                tagOpts={getData.rawData.tagMap}
            />
            <DetailComp
                theme={props.theme}
                lang={props.lang}
                formData={getData.rawData.formData}
                isCreateMode={!internalId}
            />
        </FormComp>
    );
};
const HeaderComp = (
    prop: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<TimelineSet>;
        cateOpts: Record<string, string>;
        statusOpts: Record<string, string>;
        tagOpts: Record<string, string>;
    },
) =>
{
    // 宣告變數
    const setField = useSetTableField<TimelineSet>(prop.formData);
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { Basic: "基本", System: "系統資訊" } };
    const tabContent: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(TimelineSetFields.Timeline, TimelineFields.TimelineName, "string")}
            />,
        ],
        System: [
            <SystemInfoTabComp theme={prop.theme} formData={prop.formData} setKey={TimelineSetFields.Timeline} />,
        ],
    };
    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};

const DetailComp = (
    props: { theme: IBETheme; lang: Lang; formData: UseFetchFormDataResult<TimelineSet>; isCreateMode: boolean; },
) =>
{
    // 宣告變數
    const setField = useSetTableField<TimelineSet>(props.formData);
    const details = props.formData.data?.TimelineItem ?? [];

    const handleAdd = () =>
    {
        const cur = props.formData.data;
        if (!cur) return;

        const allItems = cur.TimelineItem ?? [];
        const maxRowId = allItems.reduce<number>((max, item) =>
        {
            const id = item.RowId ?? 0;
            return id > max ? id : max;
        }, 0);

        const newRowId = maxRowId + 1;
        const newItem: TimelineItem = {
            TimelineId: cur.Timeline?.TimelineId,
            RowId: newRowId,
            Date: null,
        };

        const subNewItems = [
            {
                TimelineId: cur.Timeline?.TimelineId,
                ParentRowId: newRowId,
                RowId: 1,
                Lang: "zh-tw" as Lang,
                Title: "",
                Content: "",
            },
            {
                TimelineId: cur.Timeline?.TimelineId,
                ParentRowId: newRowId,
                RowId: 2,
                Lang: "en" as Lang,
                Title: "",
                Content: "",
            },
        ];

        const updated: TimelineSet = {
            ...cur,
            TimelineItem: [...allItems, newItem],
            TimelineLangDetail: [...(cur.TimelineLangDetail ?? []), ...subNewItems],
        };

        props.formData.setFormData(updated);
    };

    const removeOne = (rowKey: number | string): void =>
    {
        const keyStr = String(rowKey);
        props.formData.setFormData(prev =>
        {
            if (!prev) return prev;
            const allItems = prev.TimelineItem ?? [];
            const target = allItems.find((item, idx) => String(item.RowId ?? idx) === keyStr);
            if (!target) return prev;

            const nextItems = allItems.filter((item, idx) =>
            {
                const itemKey = String(item.RowId ?? idx);
                return itemKey !== keyStr;
            });

            const nextLangDetails = (prev.TimelineLangDetail ?? []).filter(info =>
            {
                return !(info.TimelineId === target.TimelineId && info.ParentRowId === target.RowId);
            });

            return {
                ...prev,
                TimelineItem: nextItems,
                TimelineLangDetail: nextLangDetails,
            };
        });
    };

    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: details.reduce<Record<string, string>>((acc, item, idx) =>
        {
            const key = String(item.RowId ?? idx);
            acc[key] = formatTabDate(item.Date);
            return acc;
        }, {}),
        onAddTab: handleAdd,
        onRemoveTab: key => removeOne(Number(key)),
    };

    const tabContent: Record<string, React.ReactNode[]> = details.reduce<Record<string, React.ReactNode[]>>(
        (acc, item, idx) =>
        {
            const detailRowId = item.RowId ?? idx;
            const rowKeys = {
                [TimelineItemFields.TimelineId]: item.TimelineId,
                [TimelineItemFields.RowId]: item.RowId,
            };

            acc[String(detailRowId)] = [
                <LibCalendar
                    {...setField(
                        TimelineSetFields.TimelineItem,
                        TimelineItemFields.Date,
                        "datetime",
                        rowKeys,
                    )}
                />,
                <SubDetailComp theme={props.theme} formData={props.formData} parentRowId={detailRowId} />,
            ];
            return acc;
        },
        {},
    );

    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};
const SubDetailComp = (
    props: { theme: IBETheme; formData: UseFetchFormDataResult<TimelineSet>; parentRowId: number; },
) =>
{
    const setField = useSetTableField<TimelineSet>(props.formData);
    const rawDetails = props.formData.data?.TimelineLangDetail?.filter(p => p.ParentRowId === props.parentRowId) ?? [];
    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) =>
        {
            const langKey = LibMerge("_", true, info.TimelineId, info.ParentRowId, info.RowId, info.Lang);
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {}),
    };
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) =>
        {
            const langKey = LibMerge("_", true, info.TimelineId, info.ParentRowId, info.RowId, info.Lang);
            const rowKeys = {
                [TimelineLangDetailFields.TimelineId]: info.TimelineId,
                [TimelineLangDetailFields.ParentRowId]: info.ParentRowId,
                [TimelineLangDetailFields.RowId]: info.RowId,
            };
            compMap[langKey] = [
                <LibTextBox
                    Style={props.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        TimelineSetFields.TimelineLangDetail,
                        TimelineLangDetailFields.Title,
                        "string",
                        rowKeys,
                    )}
                />,
                <LibTinyMCE
                    Style={props.theme.TinyMCE}
                    {...setField(
                        TimelineSetFields.TimelineLangDetail,
                        TimelineLangDetailFields.Content,
                        "string",
                        rowKeys,
                    )}
                />,
            ];

            return compMap;
        },
        {},
    );

    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};

// #region Function
const pad2 = (value: number): string =>
{
    return String(value).padStart(2, "0");
};
const formatTabDate = (value?: string | Date | null): string =>
{
    if (!value) return "未設定日期";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "未設定日期";
    return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;
};
// #endregion
