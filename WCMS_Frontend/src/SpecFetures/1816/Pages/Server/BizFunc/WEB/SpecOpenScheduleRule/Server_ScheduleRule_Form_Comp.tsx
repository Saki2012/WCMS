import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { DividerComp } from "@/SysCore/Components/Divider/Divider_Comp";
import LibDatetimeRange from "@/SysCore/Components/FormField/FieldComponets/LibDatetimeRange_Comp";
import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { useSetDateRangeField, useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import type { Lang } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { SpecOpenScheduleRuleModelFields, SpecOpenScheduleRuleSetFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useScheduleRuleFormFetchData } from "./Server_ScheduleRule_Form_Hook";

type SpecOpenScheduleRuleSet = components["schemas"]["SpecOpenScheduleRuleSet_DTO"];

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
    },
};

export const Server_ScheduleRule_Form_Comp = (prop: { theme: IBETheme; lang: Lang; }) =>
{
    // 宣告變數
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const isAddNew = !internalId;

    // 執行 function：回列表（對標 Announcement Form）
    const onBackToList = useCallback(() =>
    {
        navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));
    }, [navigate, pathname]);

    // 執行 function：集中取資料（Adapter）
    const getData = useScheduleRuleFormFetchData({ internalId: internalId ?? "", emptyData: emptySet, onBackToList });

    const formProp: FormCompProp = useMemo(() =>
    {
        return { Title: "開館時間設定", Theme: prop.theme, IsLoading: getData.isLoading, ErrorList: getData.errors, Actions: getData.rawData.actions };
    }, [prop.theme, getData.isLoading, getData.errors, getData.rawData.actions]);

    // return（DOM 結構不變）
    return (
        <FormComp prop={formProp}>
            <HeaderComp theme={prop.theme} formData={getData.rawData.formData} isAddNew={isAddNew} />
        </FormComp>
    );
};

const HeaderComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecOpenScheduleRuleSet>; isAddNew: boolean; }) =>
{
    const setField = useSetTableField<SpecOpenScheduleRuleSet>(props.formData);
    const setDateRangeField = useSetDateRangeField<SpecOpenScheduleRuleSet>(props.formData);
    return (
        <>
            <div className="form-group">
                <div className="row">
                    {/* 學年度 */}
                    <LibTextBox
                        Style={props.theme.TextBox}
                        DefaultInputDisplay="請輸入"
                        disabled={!props.isAddNew}
                        {...setField(SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule, SpecOpenScheduleRuleModelFields.AcademicYearId, "string")}
                    />
                </div>
            </div>
            <div className="form-group">
                <div className="row">
                    {/* 學年度起迄 */}
                    <LibDatetimeRange
                        Style={props.theme.TextBox3}
                        {...setDateRangeField(
                            SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
                            SpecOpenScheduleRuleModelFields.AcademicStart,
                            SpecOpenScheduleRuleModelFields.AcademicEnd,
                            "datetime",
                        )}
                    />
                    <LibDatetimeRange
                        Style={props.theme.TextBox3}
                        valueType={"TimeOnly"}
                        {...setDateRangeField(
                            SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
                            SpecOpenScheduleRuleModelFields.Weekday_OpenTime,
                            SpecOpenScheduleRuleModelFields.Weekday_CloseTime,
                            "datetime",
                        )}
                    />
                </div>
            </div>
            <div className="form-group">
                <div className="row">
                    {/* 平日開閉館時間/週六開閉館時間/周日開閉館時間 */}
                    <LibDatetimeRange
                        Style={props.theme.TextBox3}
                        valueType={"TimeOnly"}
                        {...setDateRangeField(
                            SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
                            SpecOpenScheduleRuleModelFields.Sat_OpenTime,
                            SpecOpenScheduleRuleModelFields.Sat_CloseTime,
                            "datetime",
                        )}
                    />
                    <LibDatetimeRange
                        Style={props.theme.TextBox3}
                        valueType={"TimeOnly"}
                        {...setDateRangeField(
                            SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
                            SpecOpenScheduleRuleModelFields.Sun_OpenTime,
                            SpecOpenScheduleRuleModelFields.Sun_CloseTime,
                            "datetime",
                        )}
                    />
                </div>
            </div>

            <DividerComp />

            <div className="form-group">
                <div className="row">
                    {/* 寒假起迄 */}
                    <LibDatetimeRange
                        Style={props.theme.TextBox3}
                        {...setDateRangeField(
                            SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
                            SpecOpenScheduleRuleModelFields.WinterStart,
                            SpecOpenScheduleRuleModelFields.WinterEnd,
                            "datetime",
                        )}
                    />
                    <LibDatetimeRange
                        Style={props.theme.TextBox3}
                        valueType={"TimeOnly"}
                        {...setDateRangeField(
                            SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
                            SpecOpenScheduleRuleModelFields.Winter_Weekday_OpenTime,
                            SpecOpenScheduleRuleModelFields.Winter_Weekday_CloseTime,
                            "datetime",
                        )}
                    />
                </div>
            </div>
            <div className="form-group">
                <div className="row">
                    {/* 寒假開閉館時間/週六開閉館時間/周日開閉館時間 */}
                    <LibDatetimeRange
                        Style={props.theme.TextBox3}
                        valueType={"TimeOnly"}
                        {...setDateRangeField(
                            SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
                            SpecOpenScheduleRuleModelFields.Winter_Sat_OpenTime,
                            SpecOpenScheduleRuleModelFields.Winter_Sat_CloseTime,
                            "datetime",
                        )}
                    />
                    <LibDatetimeRange
                        Style={props.theme.TextBox3}
                        valueType={"TimeOnly"}
                        {...setDateRangeField(
                            SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
                            SpecOpenScheduleRuleModelFields.Winter_Sun_OpenTime,
                            SpecOpenScheduleRuleModelFields.Winter_Sun_CloseTime,
                            "datetime",
                        )}
                    />
                </div>
            </div>

            <DividerComp />

            <div className="form-group">
                <div className="row">
                    {/* 暑假起迄 */}
                    <LibDatetimeRange
                        Style={props.theme.TextBox3}
                        {...setDateRangeField(
                            SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
                            SpecOpenScheduleRuleModelFields.SummerStart,
                            SpecOpenScheduleRuleModelFields.SummerEnd,
                            "datetime",
                        )}
                    />
                    <LibDatetimeRange
                        Style={props.theme.TextBox3}
                        valueType={"TimeOnly"}
                        {...setDateRangeField(
                            SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
                            SpecOpenScheduleRuleModelFields.Summer_Weekday_OpenTime,
                            SpecOpenScheduleRuleModelFields.Summer_Weekday_CloseTime,
                            "datetime",
                        )}
                    />
                </div>
            </div>
            <div className="form-group">
                <div className="row">
                    {/* 暑假開閉館時間/週六開閉館時間/周日開閉館時間 */}
                    <LibDatetimeRange
                        Style={props.theme.TextBox3}
                        valueType={"TimeOnly"}
                        {...setDateRangeField(
                            SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
                            SpecOpenScheduleRuleModelFields.Summer_Sat_OpenTime,
                            SpecOpenScheduleRuleModelFields.Summer_Sat_CloseTime,
                            "datetime",
                        )}
                    />
                    <LibDatetimeRange
                        Style={props.theme.TextBox3}
                        valueType={"TimeOnly"}
                        {...setDateRangeField(
                            SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
                            SpecOpenScheduleRuleModelFields.Summer_Sun_OpenTime,
                            SpecOpenScheduleRuleModelFields.Summer_Sun_CloseTime,
                            "datetime",
                        )}
                    />
                </div>
            </div>
        </>
    );
};
