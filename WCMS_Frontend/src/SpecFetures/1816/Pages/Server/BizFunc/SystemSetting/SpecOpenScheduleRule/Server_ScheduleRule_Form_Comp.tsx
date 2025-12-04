import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useLocation, useParams } from "react-router-dom";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { components } from "@/types/api";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { useSetDateRangeField, useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import type { Lang } from "@/SysCore/i18n/lang";
import { DividerComp } from "@/SysCore/Components/Divider/Divider_Comp";
import LibDatetimeRange from "@/SysCore/Components/FormField/FieldComponets/LibDatetimeRange_Comp";
import { useMemo } from "react";
import SpecOpenScheduleRuleProvider from "@/SpecFetures/1816/Hooks/BizFunc/Calendar/SpecOpenScheduleRule_Api";
import { useActions } from "@/Features/Hooks/Common/useActions";
import { SpecOpenScheduleRuleModelFields, SpecOpenScheduleRuleSetFields } from "@/types/SchemaFields";

type SpecOpenScheduleRuleSet = components["schemas"]["SpecOpenScheduleRuleSet_DTO"]
const emptySet: SpecOpenScheduleRuleSet = {
    SpecOpenScheduleRule: {
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
    }
}



export const Server_ScheduleRule_Form_Comp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const dirUrl = useLocation().pathname.replace(/\/Form$/, `/Form`);
    const pvd = useMemo(() => { return SpecOpenScheduleRuleProvider() }, []);
    const formData = useFetchFormData<SpecOpenScheduleRuleSet>(pvd, internalId, emptySet);
    const isLoading = [formData.isLoading];
    const errors = [formData.error];
    const actions = useActions(dirUrl, pvd, formData.data, internalId as string, undefined)
    const formProp: FormCompProp = { Title: "開館時間設定", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions }
    return (
        <FormComp prop={formProp}>
            <HeaderComp theme={prop.theme} formData={formData} />
        </FormComp>
    )
}
const HeaderComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecOpenScheduleRuleSet> }) => {
    const setField = useSetTableField<SpecOpenScheduleRuleSet>(props.formData);
    const setDateRangeField = useSetDateRangeField<SpecOpenScheduleRuleSet>(props.formData);
    return (
        <>
            <div className="form-group">
                <div className="row">
                    {/* 學年度 */}
                    <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.AcademicYearId, "string")} />
                </div>
            </div>
            <div className="form-group">
                <div className="row">
                    {/* 學年度起迄 */}
                    <LibDatetimeRange Style={props.theme.TextBox3} {...setDateRangeField(SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.AcademicStart, SpecOpenScheduleRuleModelFields.AcademicEnd, "datetime")} />
                    <LibDatetimeRange Style={props.theme.TextBox3} valueType={"TimeOnly"} {...setDateRangeField(SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.Weekday_OpenTime, SpecOpenScheduleRuleModelFields.Weekday_CloseTime, "datetime")} />
                </div>
            </div>
            <div className="form-group">
                <div className="row">
                    {/* 平日開閉館時間/週六開閉館時間/周日開閉館時間 */}
                    <LibDatetimeRange Style={props.theme.TextBox3} valueType={"TimeOnly"} {...setDateRangeField(SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.Sat_OpenTime, SpecOpenScheduleRuleModelFields.Sat_CloseTime, "datetime")} />
                    <LibDatetimeRange Style={props.theme.TextBox3} valueType={"TimeOnly"} {...setDateRangeField(SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.Sun_OpenTime, SpecOpenScheduleRuleModelFields.Sun_CloseTime, "datetime")} />
                </div>
            </div>

            <DividerComp />

            <div className="form-group">
                <div className="row">
                    {/* 寒假起迄 */}
                    <LibDatetimeRange Style={props.theme.TextBox3} {...setDateRangeField(SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.WinterStart, SpecOpenScheduleRuleModelFields.WinterEnd, "datetime")} />
                    <LibDatetimeRange Style={props.theme.TextBox3} valueType={"TimeOnly"} {...setDateRangeField(SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.Winter_Weekday_OpenTime, SpecOpenScheduleRuleModelFields.Winter_Weekday_CloseTime, "datetime")} />
                </div>
            </div>
            <div className="form-group">
                <div className="row">
                    {/* 寒假開閉館時間/週六開閉館時間/周日開閉館時間 */}
                    <LibDatetimeRange Style={props.theme.TextBox3} valueType={"TimeOnly"} {...setDateRangeField(SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.Winter_Sat_OpenTime, SpecOpenScheduleRuleModelFields.Winter_Sat_CloseTime, "datetime")} />
                    <LibDatetimeRange Style={props.theme.TextBox3} valueType={"TimeOnly"} {...setDateRangeField(SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.Winter_Sun_OpenTime, SpecOpenScheduleRuleModelFields.Winter_Sun_CloseTime, "datetime")} />
                </div>
            </div>

            <DividerComp />

            <div className="form-group">
                <div className="row">
                    {/* 暑假起迄 */}
                    <LibDatetimeRange Style={props.theme.TextBox3} {...setDateRangeField(SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.SummerStart, SpecOpenScheduleRuleModelFields.SummerEnd, "datetime")} />
                    <LibDatetimeRange Style={props.theme.TextBox3} valueType={"TimeOnly"} {...setDateRangeField(SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.Summer_Weekday_OpenTime, SpecOpenScheduleRuleModelFields.Summer_Weekday_CloseTime, "datetime")} />
                </div>
            </div>
            <div className="form-group">
                <div className="row">
                    {/* 暑假開閉館時間/週六開閉館時間/周日開閉館時間 */}
                    <LibDatetimeRange Style={props.theme.TextBox3} valueType={"TimeOnly"} {...setDateRangeField(SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.Summer_Sat_OpenTime, SpecOpenScheduleRuleModelFields.Summer_Sat_CloseTime, "datetime")} />
                    <LibDatetimeRange Style={props.theme.TextBox3} valueType={"TimeOnly"} {...setDateRangeField(SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.Summer_Sun_OpenTime, SpecOpenScheduleRuleModelFields.Summer_Sun_CloseTime, "datetime")} />
                </div>
            </div>
        </>
    )
}
