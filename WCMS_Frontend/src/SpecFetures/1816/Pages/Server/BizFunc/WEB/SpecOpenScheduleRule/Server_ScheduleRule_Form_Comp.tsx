import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { LibDatetimeRange, type ILibDatetimeRangeProp, type LibDatetimeValueType } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibDatetimeRange_Comp";
import { LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useFormModelField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { DividerComp } from "@/SysCore/Components/Divider/Divider_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { markPageStateMemoryEntry } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Navigation";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import type { components } from "@/types/api";
import { SpecOpenScheduleRuleFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useScheduleRuleFormTemplate } from "./Server_ScheduleRule_Form_Hook";

// #region Property
type SpecOpenScheduleRuleFormModel = components["schemas"]["SpecOpenScheduleRule"];

type ScheduleRuleFieldKey = keyof SpecOpenScheduleRuleFormModel;

type ScheduleRuleFieldBinder = ReturnType<typeof useFormModelField<SpecOpenScheduleRuleFormModel>>;

type ScheduleRuleRangeBind = Omit<ILibDatetimeRangeProp, "Style" | "valueType" | "disabled">;

type ScheduleRuleRangeBinder = (startField: ScheduleRuleFieldKey, endField: ScheduleRuleFieldKey) => ScheduleRuleRangeBind;

interface ScheduleRuleFormCompProps
{
    /** 後台主題設定。 */
    theme: IBETheme;

    /** 目前語系，保留與後台 Route Factory 介面一致。 */
    lang: Lang;
}

interface ScheduleRuleContentProps
{
    /** 後台主題設定。 */
    theme: IBETheme;

    /** Form Template 提供的 FormModel binding。 */
    binding: ServerFormBinding<SpecOpenScheduleRuleFormModel>;

    /** 是否為新增模式。 */
    isAddNew: boolean;
}

interface ScheduleRulePeriodSectionProps
{
    /** 後台主題設定。 */
    theme: IBETheme;

    /** 根 FormModel 日期區間綁定器。 */
    setRangeField: ScheduleRuleRangeBinder;

    /** 學期或假期日期範圍。 */
    dateRange: ScheduleRuleRangeFieldProps;

    /** 平日開閉館時間。 */
    weekdayRange: ScheduleRuleRangeFieldProps;

    /** 週六開閉館時間。 */
    saturdayRange: ScheduleRuleRangeFieldProps;

    /** 週日開閉館時間。 */
    sundayRange: ScheduleRuleRangeFieldProps;
}

interface ScheduleRuleRangeFieldProps
{
    /** 起始欄位。 */
    startField: ScheduleRuleFieldKey;

    /** 結束欄位。 */
    endField: ScheduleRuleFieldKey;

    /** 日期或時間欄位類型。 */
    valueType: LibDatetimeValueType;
}

// #endregion

// #region Initialization
/** ScheduleRule 新增模式預設 FormModel。 */
const scheduleRuleEmptyData = {
    AcademicYearId: "",
    AcademicStart: null,
    AcademicEnd: null,
    Weekday_OpenTime: null,
    Weekday_CloseTime: null,
    Sat_OpenTime: null,
    Sat_CloseTime: null,
    Sun_OpenTime: null,
    Sun_CloseTime: null,
    WinterStart: null,
    WinterEnd: null,
    Winter_Weekday_OpenTime: null,
    Winter_Weekday_CloseTime: null,
    Winter_Sat_OpenTime: null,
    Winter_Sat_CloseTime: null,
    Winter_Sun_OpenTime: null,
    Winter_Sun_CloseTime: null,
    SummerStart: null,
    SummerEnd: null,
    Summer_Weekday_OpenTime: null,
    Summer_Weekday_CloseTime: null,
    Summer_Sat_OpenTime: null,
    Summer_Sat_CloseTime: null,
    Summer_Sun_OpenTime: null,
    Summer_Sun_CloseTime: null,
    ModifyMemo: "",
} as SpecOpenScheduleRuleFormModel;

/** 一般學期間的日期與開閉館欄位設定。 */
const regularPeriodFields: Omit<ScheduleRulePeriodSectionProps, "theme" | "setRangeField"> = {
    dateRange: { startField: SpecOpenScheduleRuleFields.AcademicStart, endField: SpecOpenScheduleRuleFields.AcademicEnd, valueType: "DateOnly" },
    weekdayRange: { startField: SpecOpenScheduleRuleFields.Weekday_OpenTime, endField: SpecOpenScheduleRuleFields.Weekday_CloseTime, valueType: "TimeOnly" },
    saturdayRange: { startField: SpecOpenScheduleRuleFields.Sat_OpenTime, endField: SpecOpenScheduleRuleFields.Sat_CloseTime, valueType: "TimeOnly" },
    sundayRange: { startField: SpecOpenScheduleRuleFields.Sun_OpenTime, endField: SpecOpenScheduleRuleFields.Sun_CloseTime, valueType: "TimeOnly" },
};

/** 寒假期間的日期與開閉館欄位設定。 */
const winterPeriodFields: Omit<ScheduleRulePeriodSectionProps, "theme" | "setRangeField"> = {
    dateRange: { startField: SpecOpenScheduleRuleFields.WinterStart, endField: SpecOpenScheduleRuleFields.WinterEnd, valueType: "DateOnly" },
    weekdayRange: { startField: SpecOpenScheduleRuleFields.Winter_Weekday_OpenTime, endField: SpecOpenScheduleRuleFields.Winter_Weekday_CloseTime, valueType: "TimeOnly" },
    saturdayRange: { startField: SpecOpenScheduleRuleFields.Winter_Sat_OpenTime, endField: SpecOpenScheduleRuleFields.Winter_Sat_CloseTime, valueType: "TimeOnly" },
    sundayRange: { startField: SpecOpenScheduleRuleFields.Winter_Sun_OpenTime, endField: SpecOpenScheduleRuleFields.Winter_Sun_CloseTime, valueType: "TimeOnly" },
};

/** 暑假期間的日期與開閉館欄位設定。 */
const summerPeriodFields: Omit<ScheduleRulePeriodSectionProps, "theme" | "setRangeField"> = {
    dateRange: { startField: SpecOpenScheduleRuleFields.SummerStart, endField: SpecOpenScheduleRuleFields.SummerEnd, valueType: "DateOnly" },
    weekdayRange: { startField: SpecOpenScheduleRuleFields.Summer_Weekday_OpenTime, endField: SpecOpenScheduleRuleFields.Summer_Weekday_CloseTime, valueType: "TimeOnly" },
    saturdayRange: { startField: SpecOpenScheduleRuleFields.Summer_Sat_OpenTime, endField: SpecOpenScheduleRuleFields.Summer_Sat_CloseTime, valueType: "TimeOnly" },
    sundayRange: { startField: SpecOpenScheduleRuleFields.Summer_Sun_OpenTime, endField: SpecOpenScheduleRuleFields.Summer_Sun_CloseTime, valueType: "TimeOnly" },
};
// #endregion

// #region Public
/** 開館時間設定 Form，透過新版 Form Template 使用根 FormModel。 */
export const Server_ScheduleRule_Form_Comp = (props: ScheduleRuleFormCompProps) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const onBackToList = useCallback(() =>
    {
        const listPath = LibRoutePath.buildServerBackToListPath(pathname);
        markPageStateMemoryEntry(listPath, "normalize");
        navigate(listPath, { replace: true });
    }, [navigate, pathname]);
    const actionsOpt = useMemo(() => ({ onBackToList }), [onBackToList]);
    const template = useScheduleRuleFormTemplate({
        theme: props.theme,
        internalId: internalId ?? "",
        emptyData: scheduleRuleEmptyData,
        actionsOpt,
    });

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => <ScheduleRuleContentComp theme={props.theme} binding={vm.binding} isAddNew={vm.mode === "new"} />}
        />
    );
};
// #endregion

// #region Section
/** 開館時間 FormModel 的主要欄位內容。 */
const ScheduleRuleContentComp = (props: ScheduleRuleContentProps) =>
{
    const setField = useFormModelField<SpecOpenScheduleRuleFormModel>(props.binding);
    const setRangeField = useScheduleRuleRangeField(setField);

    return (
        <>
            <AcademicYearSection {...props} setField={setField} />
            <ScheduleRulePeriodSection theme={props.theme} setRangeField={setRangeField} {...regularPeriodFields} />
            <DividerComp />
            <ScheduleRulePeriodSection theme={props.theme} setRangeField={setRangeField} {...winterPeriodFields} />
            <DividerComp />
            <ScheduleRulePeriodSection theme={props.theme} setRangeField={setRangeField} {...summerPeriodFields} />
        </>
    );
};

/** 學年度代碼欄位。 */
const AcademicYearSection = (props: ScheduleRuleContentProps & { setField: ScheduleRuleFieldBinder; }) =>
{
    return (
        <div className="form-group">
            <div className="row">
                <LibTextBox
                    Style={props.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    disabled={!props.isAddNew}
                    {...props.setField(SpecOpenScheduleRuleFields.AcademicYearId, "string")}
                />
            </div>
        </div>
    );
};

/** 單一學期或假期的日期與開閉館時間區塊。 */
const ScheduleRulePeriodSection = (props: ScheduleRulePeriodSectionProps) =>
{
    return (
        <>
            <div className="form-group">
                <div className="row">
                    <ScheduleRuleRangeField theme={props.theme} setRangeField={props.setRangeField} {...props.dateRange} />
                    <ScheduleRuleRangeField theme={props.theme} setRangeField={props.setRangeField} {...props.weekdayRange} />
                </div>
            </div>
            <div className="form-group">
                <div className="row">
                    <ScheduleRuleRangeField theme={props.theme} setRangeField={props.setRangeField} {...props.saturdayRange} />
                    <ScheduleRuleRangeField theme={props.theme} setRangeField={props.setRangeField} {...props.sundayRange} />
                </div>
            </div>
        </>
    );
};

/** 單組日期或時間區間欄位。 */
const ScheduleRuleRangeField = (props: ScheduleRuleRangeFieldProps & { theme: IBETheme; setRangeField: ScheduleRuleRangeBinder; }) =>
{
    return (
        <LibDatetimeRange
            Style={props.theme.TextBox3}
            valueType={props.valueType}
            {...props.setRangeField(props.startField, props.endField)}
        />
    );
};
// #endregion

// #region Private
/** 建立根 FormModel 日期區間綁定器。 */
const useScheduleRuleRangeField = (setField: ScheduleRuleFieldBinder): ScheduleRuleRangeBinder =>
{
    return useCallback((startField, endField) =>
    {
        const start = setField(startField, "datetime");
        const end = setField(endField, "datetime");
        return {
            ColumnDisplayName: start.ColumnDisplayName,
            StartValue: String(start.InputValue ?? ""),
            EndValue: String(end.InputValue ?? ""),
            onChangeStart: start.onChange,
            onChangeEnd: end.onChange,
        };
    }, [setField]);
};

// #endregion
