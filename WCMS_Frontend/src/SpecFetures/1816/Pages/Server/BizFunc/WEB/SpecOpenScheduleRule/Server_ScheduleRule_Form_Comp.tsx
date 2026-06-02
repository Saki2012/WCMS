import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { DividerComp } from "@/SysCore/Components/Divider/Divider_Comp";
import LibDatetimeRange from "@/SysCore/Components/FormField/FieldComponets/LibDatetimeRange_Comp";
import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { useSetDateRangeField, useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { SpecOpenScheduleRuleModelFields, SpecOpenScheduleRuleSetFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useScheduleRuleFormTemplate } from "./Server_ScheduleRule_Form_Hook";

// #region Property
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
// #endregion

// #region Public
/** 開館時間設定 Form，外框與資料流程交由 Server_FormTemplate 控制 */
export const Server_ScheduleRule_Form_Comp = (prop: { theme: IBETheme; lang: Lang; }) =>
{
    // 宣告變數
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;

    // 執行 function：回列表（對標 Announcement Form）
    const onBackToList = useCallback(() =>
    {
        navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));
    }, [navigate, pathname]);

    // 宣告變數：提供 Template 使用的動作設定
    const actionsOpt = useMemo(() =>
    {
        return { onBackToList };
    }, [onBackToList]);

    // 執行 function：以 Spec timing 建立 Form Template
    const template = useScheduleRuleFormTemplate({ theme: prop.theme, internalId: internalId ?? "", emptyData: emptySet, actionsOpt });

    // return：Form 外框改交由 Server_FormTemplate_Comp
    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => <HeaderComp theme={prop.theme} formData={vm.binding} isAddNew={vm.mode === "new"} />}
        />
    );
};
// #endregion

// #region Section
/** 基本資料與開館時間欄位區塊 */
const HeaderComp = (props: { theme: IBETheme; formData: ServerFormBinding<SpecOpenScheduleRuleSet>; isAddNew: boolean; }) =>
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
// #endregion
