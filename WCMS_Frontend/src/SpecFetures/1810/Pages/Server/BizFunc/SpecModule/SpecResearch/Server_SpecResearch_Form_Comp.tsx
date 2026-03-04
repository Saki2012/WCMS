import { LibCheckBox, LibTextBox, LibTextArea, LibDropList } from "@/SysCore/Components/FormField/LibFormField";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { useCallback, useMemo } from "react";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import {SpecResearchDetailModelFields, SpecResearchModelFields, SpecResearchSetFields,} from "@/types/SchemaFields";
import { useSpecResearchFormFetchData } from "./Server_SpecResearch_Form_Hook";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";

type SpecResearchSet = components["schemas"]["SpecResearchSet_DTO"];
const emptyData: SpecResearchSet = { SpecResearch: {}, SpecResearchDetail: [] };

/** 網路資源表單 */
export const Server_ResearchProjFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const onBackToList = useCallback(() => { navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List")); }, [navigate, pathname]);
    const actionsOpt = useMemo(() => { return { onBackToList }; }, [onBackToList]);
    const getData = useSpecResearchFormFetchData({lang: prop.lang, internalId: internalId ?? "", emptyData, actionsOpt, });
    // 執行 function：確保語系明細存在（避免 Tab 缺資料）
    useEnsureLangDetails(getData.rawData.formData, {
        headerName: SpecResearchSetFields.SpecResearch,
        detailName: SpecResearchSetFields.SpecResearchDetail,
        parentKeys: [SpecResearchDetailModelFields.ResearchId],
        preferFirstLang: prop.lang,
    });
    // 宣告變數：依選到的分類，決定明細要顯示哪些欄位（ShowColumnItems）
    const selectedCateId = getData.rawData.formData?.data?.SpecResearch?.CategoryId ?? "";
    const visibleCols = useMemo(() => {
        const list = getData.rawData.categoryCols?.[selectedCateId] ?? [];
        return new Set(list);
    }, [selectedCateId, getData.rawData.categoryCols]);

    const propForm: FormCompProp = { Title: internalId ? "修改研究計畫" : "新增研究計畫", Theme: prop.theme, IsLoading: getData.isLoading, ErrorList: getData.errors, Actions: getData.rawData.actions, };

    return (
        <FormComp prop={propForm}>
            <HeaderComp theme={prop.theme} formData={getData.rawData.formData} 
                cateOpts={getData.rawData.categoryMap} statusOpts={getData.rawData.statusOpts} 
                tagOpts={getData.rawData.tagMap}/>
            <DetailComp theme={prop.theme} formData={getData.rawData.formData} visibleCols={visibleCols} />
        </FormComp>
    );
};

const HeaderComp = (prop: {theme: IBETheme; formData: { data?: SpecResearchSet; setFormData: (updater: (prev: SpecResearchSet) => SpecResearchSet) => void };
    cateOpts: Record<string, string>; statusOpts: Record<string, string>; tagOpts: Record<string, string>; }) => 
{
    const setField = useSetTableField<SpecResearchSet>(prop.formData as any);
    const LibTabsPropA: LibTabsProp = { Style: prop.theme.Tabs, item: { Basic: "基本", Status: "狀態", Tags: "標籤",System:"系統資訊" } };
    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [ <LibDropList Style={prop.theme.DropList} Options={prop.cateOpts} {...setField(SpecResearchSetFields.SpecResearch, SpecResearchModelFields.CategoryId, "string")}/>,],
        Status: [ <LibCheckBox Style={prop.theme.CheckBox} options={prop.statusOpts} {...setField(SpecResearchSetFields.SpecResearch, SpecResearchModelFields.ContentStatus, "number", undefined,{ strategy: "sum", sumKeys: Object.keys(prop.statusOpts ?? {}).map(Number) },)}/>,],
        Tags: [ <LibCheckBox Style={prop.theme.CheckBox} options={prop.tagOpts} {...setField(SpecResearchSetFields.SpecResearch, SpecResearchModelFields.Tags, "string", undefined, "csv")} />,],
        System: [<SystemInfoTabComp theme={prop.theme} formData={prop.formData} setKey={SpecResearchSetFields.SpecResearch} />]
    };
    return <TabContentComp tabInfos={LibTabsPropA} components={componentsA}></TabContentComp>;
};

const DetailComp = (prop: { theme: IBETheme; formData: { data?: SpecResearchSet; setFormData: (updater: (prev: SpecResearchSet) => SpecResearchSet) => void }; visibleCols: Set<string>;}) => 
{
    const setField = useSetTableField<SpecResearchSet>(prop.formData as any);
    const rawDetails = prop.formData.data?.SpecResearchDetail ?? [];

    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = `${info.ResearchId ?? ""}_${info.RowId ?? ""}_${info.Lang ?? ""}`;
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {}),
    };

    const orderedKeys = [
        SpecResearchDetailModelFields.Year, SpecResearchDetailModelFields.AcademicYear, SpecResearchDetailModelFields.Semester,
        SpecResearchDetailModelFields.ClassTime, SpecResearchDetailModelFields.Courses, SpecResearchDetailModelFields.TeachingStaffOfOurSchool,
        SpecResearchDetailModelFields.ProjectLeader, SpecResearchDetailModelFields.PlanAmount, SpecResearchDetailModelFields.ProjectName,
        SpecResearchDetailModelFields.PlanContent, SpecResearchDetailModelFields.Commissioned, SpecResearchDetailModelFields.Cohost1,
        SpecResearchDetailModelFields.Cohost2, SpecResearchDetailModelFields.ApprovalNumber, SpecResearchDetailModelFields.ApprovedAmount,
        SpecResearchDetailModelFields.DuringExecution, SpecResearchDetailModelFields.ContractPeriod, SpecResearchDetailModelFields.College,
        SpecResearchDetailModelFields.Department, SpecResearchDetailModelFields.Professor, SpecResearchDetailModelFields.Name,
        SpecResearchDetailModelFields.GraduationDegree, SpecResearchDetailModelFields.PaperTitle, SpecResearchDetailModelFields.CooperationProject,
        SpecResearchDetailModelFields.CooperatingUnits, SpecResearchDetailModelFields.Remark,
    ] as const;

    type FieldKey = (typeof orderedKeys)[number];
    type RowKeys = Record<string, string | number | null | undefined>;

    const makeNodes = (rowKeys: RowKeys) => {
        const t = prop.theme;
        const nodes: Record<FieldKey, React.ReactNode> = {
            Year: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Year, "number", rowKeys)}
                />
            ),
            AcademicYear: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.AcademicYear,
                        "number",
                        rowKeys,
                    )}
                />
            ),
            Semester: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.Semester,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            ClassTime: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.ClassTime,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            Courses: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.Courses,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            TeachingStaffOfOurSchool: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.TeachingStaffOfOurSchool,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            ProjectLeader: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.ProjectLeader,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            PlanAmount: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.PlanAmount,
                        "number",
                        rowKeys,
                    )}
                />
            ),
            ProjectName: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.ProjectName,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            PlanContent: (
                <LibTextArea
                    Style={t.TextArea}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.PlanContent,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            Commissioned: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.Commissioned,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            Cohost1: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Cohost1, "string", rowKeys)}
                />
            ),
            Cohost2: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Cohost2, "string", rowKeys)}
                />
            ),
            ApprovalNumber: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.ApprovalNumber,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            ApprovedAmount: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.ApprovedAmount,
                        "number",
                        rowKeys,
                    )}
                />
            ),
            DuringExecution: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.DuringExecution,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            ContractPeriod: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.ContractPeriod,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            College: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.College, "string", rowKeys)}
                />
            ),
            Department: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.Department,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            Professor: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.Professor,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            Name: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Name, "string", rowKeys)}
                />
            ),
            GraduationDegree: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.GraduationDegree,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            PaperTitle: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.PaperTitle,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            CooperationProject: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.CooperationProject,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            CooperatingUnits: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={t.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecResearchSetFields.SpecResearchDetail,
                        SpecResearchDetailModelFields.CooperatingUnits,
                        "string",
                        rowKeys,
                    )}
                />
            ),
            Remark: (
                <LibTextArea
                    Style={t.TextArea}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Remark, "string", rowKeys)}
                />
            ),
        };
        return nodes;
    };
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>((compMap, info) => {
        const langKey = `${info.ResearchId ?? ""}_${info.RowId ?? ""}_${info.Lang ?? ""}`;
        const rowKeys: RowKeys = {
            [SpecResearchDetailModelFields.ResearchId]: info.ResearchId,
            [SpecResearchDetailModelFields.RowId]: info.RowId,
        };
        const nodes = makeNodes(rowKeys);
        const showAll = prop.visibleCols.size === 0;
        compMap[langKey] = orderedKeys.filter((k) => showAll || prop.visibleCols.has(k)).map((k) => nodes[k]);
        return compMap;
    }, {});
    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};