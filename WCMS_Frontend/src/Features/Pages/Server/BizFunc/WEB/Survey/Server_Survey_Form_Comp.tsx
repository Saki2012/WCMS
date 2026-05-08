import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibCheckBox, LibTextArea, LibTextBox, LibTinyMCE } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { SurveyFields, SurveyItemFields, SurveyItemLangFields, SurveySetFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { SystemInfoTabComp } from "../../../Scaffold/SystemTab/SystemTab";
import { useSurveyFormFetchData } from "./Server_Survey_Form_Hook";
type SurveySet = components["schemas"]["SurveySet_DTO"];
type SurveyItem = components["schemas"]["SurveyItem_DTO"];
type SurveyItemLang = components["schemas"]["SurveyItemLang_DTO"];

const emptyData: SurveySet = { Survey: {}, SurveyItem: [], SurveyItemLang: [] };
// #region Components
export const Server_Survey_Form_Comp = (props: { theme: IBETheme; lang: Lang; }) =>
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
    const getData = useSurveyFormFetchData({ lang: props.lang, internalId: internalId ?? "", emptyData, actionsOpt });

    useEnsureLangDetails(getData.rawData.formData, {
        headerName: SurveySetFields.SurveyItem,
        detailName: SurveySetFields.SurveyItemLang,
        parentKeys: [SurveyItemLangFields.SurveyId, SurveyItemLangFields.ParentRowId],
        preferFirstLang: props.lang,
    });
    const formProp: FormCompProp = {
        Title: internalId ? "修改問卷" : "新增問卷",
        Theme: props.theme,
        IsLoading: getData.isLoading,
        ErrorList: getData.errors,
        Actions: getData.rawData.actions,
    };
    return (
        <FormComp prop={formProp}>
            <HeaderComp theme={props.theme} formData={getData.rawData.formData} />
            <DetailComp theme={props.theme} formData={getData.rawData.formData} inputOpts={getData.rawData.inputOpts} />
        </FormComp>
    );
};
const HeaderComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SurveySet>; }) =>
{
    const setField = useSetTableField<SurveySet>(props.formData);
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { Basic: "基本", System: "系統資訊" } };
    const components: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibTextBox DefaultInputDisplay="請輸入" Style={props.theme.TextBox} {...setField(SurveySetFields.Survey, SurveyFields.SurveyName, "string")} />,
            <LibTinyMCE Style={props.theme.TinyMCE} {...setField(SurveySetFields.Survey, SurveyFields.SurveyDescription, "string")} />,
            <LibTinyMCE Style={props.theme.TinyMCE} {...setField(SurveySetFields.Survey, SurveyFields.SurveySuccessContent, "string")} />,
        ],
        System: [<SystemInfoTabComp theme={props.theme} formData={props.formData} setKey={SurveySetFields.Survey} />],
    };
    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>;
};
const DetailComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SurveySet>; inputOpts: Record<string, string>; }) =>
{
    const setField = useSetTableField<SurveySet>(props.formData);
    const details = props.formData.data?.SurveyItem ?? [];
    const handleAdd = () =>
    {
        const cur = props.formData.data;
        if (!cur) return;
        const maxRowId = details.reduce<number>((max, d) =>
        {
            const id = d.RowId ?? 0;
            return id > max ? id : max;
        }, 0);
        const newRowId = maxRowId + 1;
        const newItem: SurveyItem = { SurveyId: cur.Survey?.SurveyId, RowId: newRowId };
        const subNewItem: SurveyItemLang[] = [{ SurveyId: cur.Survey?.SurveyId, ParentRowId: newRowId, RowId: 1, Lang: "zh-tw" }, {
            SurveyId: cur.Survey?.SurveyId,
            ParentRowId: newRowId,
            RowId: 2,
            Lang: "en",
        }];
        const updated: SurveySet = { ...cur, SurveyItem: [...(cur.SurveyItem ?? []), newItem], SurveyItemLang: [...(cur.SurveyItemLang ?? []), ...subNewItem] };
        props.formData.setFormData(updated);
    };

    const removeOne = (rowKey: number | string): void =>
    {
        const keyStr = String(rowKey);
        props.formData.setFormData(prev =>
        {
            if (!prev) return prev;
            const allDetails = prev.SurveyItem ?? [];
            const target = allDetails.find((d, i) => String(d.RowId ?? i) === keyStr);
            if (!target) return prev;
            let nextDetails: typeof allDetails;
            if (target.RowId != null)
            {
                nextDetails = allDetails.filter(d => !(d.SurveyId === target.SurveyId && d.RowId === target.RowId));
            } else
            {
                const hitIdx = allDetails.findIndex((d, i) => String(d.RowId ?? i) === keyStr);
                nextDetails = allDetails.filter((_, i) => i !== hitIdx);
            }
            // 子明細一併清掉
            const allInfos = prev.SurveyItemLang ?? [];
            const nextInfos = target.RowId != null
                ? allInfos.filter(info => !(info.SurveyId === target.SurveyId && info.ParentRowId === target.RowId))
                : allInfos;
            return { ...prev, SurveyItem: nextDetails, SurveyItemLang: nextInfos };
        });
    };

    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: details.reduce<Record<string, string>>((acc, d, idx) =>
        {
            const key = String(d.RowId ?? idx);
            // acc[key] = d.FieldId ?? "";
            acc[key] = d.FieldId?.trim() ? d.FieldId.trim() : "...Field";

            return acc;
        }, {}),
        onAddTab: () =>
        {
            handleAdd();
        },
        onRemoveTab: key => removeOne(Number(key)),
    };

    const tabContent: Record<string, React.ReactNode[]> = details.reduce<Record<string, React.ReactNode[]>>((acc, d, idx) =>
    {
        const detailRowId = d.RowId ?? idx;
        const rowKeys = { [SurveyItemFields.SurveyId]: d.SurveyId, [SurveyItemFields.RowId]: d.RowId };
        const showOptions = shouldShowOptions({ inputType: d.InputType, inputOpts: props.inputOpts });
        acc[String(detailRowId)] = [
            <LibTextBox
                Style={props.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(SurveySetFields.SurveyItem, SurveyItemFields.FieldId, "string", rowKeys)}
            />,
            <DetailLangComp theme={props.theme} formData={props.formData} parentRowId={detailRowId} />,
            <LibCheckBox
                Style={props.theme.CheckBox}
                options={{ [SurveyItemFields.IsRequired]: "必填" }}
                {...setField(SurveySetFields.SurveyItem, SurveyItemFields.IsRequired, "boolean", rowKeys)}
            />,
            <LibCheckBox
                Style={props.theme.RadioBox}
                options={props.inputOpts}
                {...setField(SurveySetFields.SurveyItem, SurveyItemFields.InputType, "number", rowKeys)}
            />,
            ...(showOptions
                ? [
                    <LibTextArea
                        Style={props.theme.TextBox}
                        DefaultInputDisplay="請輸入"
                        {...setField(SurveySetFields.SurveyItem, SurveyItemFields.Options, "string", rowKeys)}
                    />,
                ]
                : []),
        ];
        return acc;
    }, {});
    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};
const DetailLangComp = (props: { theme: IBETheme; parentRowId: number; formData: UseFetchFormDataResult<SurveySet>; }) =>
{
    const setField = useSetTableField<SurveySet>(props.formData);
    const rawDetails = props.formData.data?.SurveyItemLang?.filter(p => p.ParentRowId === props.parentRowId) ?? [];
    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) =>
        {
            const langKey = LibMerge("_", true, info.SurveyId, info.ParentRowId, info.RowId, info.Lang);
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {}),
    };
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>((compMap, info) =>
    {
        const langKey = LibMerge("_", true, info.SurveyId, info.ParentRowId, info.RowId, info.Lang);
        const rowKeys = {
            [SurveyItemLangFields.SurveyId]: info.SurveyId,
            [SurveyItemLangFields.ParentRowId]: info.ParentRowId,
            [SurveyItemLangFields.RowId]: info.RowId,
        };
        compMap[langKey] = [
            <LibTextBox
                Style={props.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(SurveySetFields.SurveyItemLang, SurveyItemLangFields.FieldName, "string", rowKeys)}
            />,
        ];
        return compMap;
    }, {});
    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};
// #endregion

// #region Private Func
/** 需要顯示 Options 的輸入型別 */
const OPTION_JSON_INPUT_TYPE_NAMES = new Set(["10", "11", "20"]);
/** 轉成穩定比對用文字 */
const normalizeInputTypeText = (value: string): string =>
{
    // 將輸入型別文字轉成小寫，避免大小寫造成判斷失敗
    return value.trim().toLowerCase();
};
/** 判斷目前輸入型別是否需要選項設定 */
const shouldShowOptions = (p: { inputType?: string | number | null; inputOpts: Record<string, string>; }): boolean =>
{
    const key = String(p.inputType ?? "");
    if (!key) return false;
    const label = p.inputOpts[key] ?? key;
    const keyText = normalizeInputTypeText(key);
    const labelText = normalizeInputTypeText(label);
    return OPTION_JSON_INPUT_TYPE_NAMES.has(keyText) || OPTION_JSON_INPUT_TYPE_NAMES.has(labelText);
};
// #endregion
