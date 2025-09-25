import { LibCheckBox, LibTextBox, LibTextArea, LibDropList } from "@/SysCore/Components/FormField/LibFormField";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useParams } from "react-router-dom";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import SpecResearchProvider from "@/SpecFetures/1810/Hooks/SpecResearch/SpecResearch_Api";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { useGetSpecCategoryListByProgId } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Hook";
import { useGetTagListByProgId } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { useFormToolbarActions } from "@/SysCore/Components/Toolbar/Toolbar_Hook";
import * as SchemaFields from "@/types/SchemaFields";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { useMemo } from "react";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
type SpecResearchSet = components["schemas"]["SpecResearchSet_DTO"]
const emptyData: SpecResearchSet = { SpecResearch: {}, SpecResearchDetail: [], }

/** 網路資源表單
 * @returns 
 */
export const Server_ResearchProjFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const formData = useFetchFormData<SpecResearchSet>(SpecResearchProvider(), internalId, emptyData)
    const useCategory = useGetSpecCategoryListByProgId("SpecResearch", prop.lang);
    const useTag = useGetTagListByProgId("SpecResearch", prop.lang);
    const useContentStatus = useFetchEnumOptions("ContentStatus")
    const status = useMemo(() => { const src = useContentStatus.data ?? {}; const { ["0"]: _drop, ...rest } = src; return rest as Record<string, string>; }, [useContentStatus.data]);
    const useToolbar = useFormToolbarActions(SpecResearchProvider(), formData.data as SpecResearchSet, internalId as string, () => formData.refetch())
    useEnsureLangDetails(formData, { headerName: SchemaFields.SpecResearchSetFields.SpecResearch, detailName: SchemaFields.SpecResearchSetFields.SpecResearchDetail, parentKeys: [SchemaFields.SpecResearchModelFields.ResearchId], preferFirstLang: prop.lang });
    const isLoading = [formData.isLoading, useCategory.isLoading, useTag.isLoading, useContentStatus.isLoading]
    const errors = [formData.error, useCategory.error, useTag.error, useContentStatus.error]
    const formProp: FormCompProp = { Title: "新增研究計畫", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.action }

    return (
        <FormComp prop={formProp}>
            <HeaderComp theme={prop.theme} formData={formData} cateOpts={useCategory.data} statusOpts={status} tagOpts={useTag.data} />
            <DetailComp theme={prop.theme} formData={formData} />
        </FormComp>
    )
}

const HeaderComp = (prop: {
    theme: IBETheme; formData: UseFetchFormDataResult<SpecResearchSet>;
    cateOpts: Record<string, string>; statusOpts: Record<string, string>; tagOpts: Record<string, string>;
}) => {
    const setField = useSetTableField<SpecResearchSet>(prop.formData);
    const LibTabsPropA: LibTabsProp = { Style: prop.theme.Tabs, item: { "Basic": "基本", "Status": "狀態", "Tags": "標籤" } }
    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [<LibDropList Style={prop.theme.DropList} Options={prop.cateOpts} {...setField(SchemaFields.SpecResearchSetFields.SpecResearch, SchemaFields.SpecResearchModelFields.CategoryId, 'string')} />],
        Status: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.statusOpts} {...setField(SchemaFields.SpecResearchSetFields.SpecResearch, SchemaFields.SpecResearchModelFields.ContentStatus, 'number', undefined, { strategy: 'sum', sumKeys: Object.keys(prop.statusOpts ?? {}).map(Number) })} />],
        Tags: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.tagOpts} {...setField(SchemaFields.SpecResearchSetFields.SpecResearch, SchemaFields.SpecResearchModelFields.Tags, 'string', undefined, 'csv')} />]
    }
    return <TabContentComp tabInfos={LibTabsPropA} components={componentsA}></TabContentComp>
}

const DetailComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecResearchSet>; }) => {
    const setField = useSetTableField<SpecResearchSet>(prop.formData);
    const rawDetails = prop.formData.data?.SpecResearchDetail ?? [];
    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.ResearchId, info.RowId, info.Lang)
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    }
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.ResearchId, info.RowId, info.Lang)
            const rowKeys = { [SchemaFields.SpecResearchDetailModelFields.ResearchId]: info.ResearchId, [SchemaFields.SpecResearchDetailModelFields.RowId]: info.RowId, }
            compMap[langKey] = [
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.Year, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.AcademicYear, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.Semester, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.ClassTime, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.Courses, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.TeachingStaffOfOurSchool, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.ProjectLeader, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.PlanAmount, "number", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.ProjectName, "string", rowKeys)} />,
                <LibTextArea Style={prop.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.PlanContent, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.Commissioned, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.Cohost1, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.Cohost2, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.ApprovalNumber, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.ApprovedAmount, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.DuringExecution, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.ContractPeriod, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.College, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.Department, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.Name, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.GraduationDegree, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.PaperTitle, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.CooperationProject, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.CooperatingUnits, "string", rowKeys)} />,
                <LibTextArea Style={prop.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecResearchSetFields.SpecResearchDetail, SchemaFields.SpecResearchDetailModelFields.Remark, "string", rowKeys)} />,
            ]
            return compMap;
        }, {}
    );
    return (
        <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>
    )
}