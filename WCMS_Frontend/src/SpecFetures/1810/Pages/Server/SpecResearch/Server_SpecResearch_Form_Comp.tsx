import { LibCheckBox, LibTextBox, LibTextArea, LibDropList } from "@/SysCore/Components/FormField/LibFormField";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useLocation, useParams } from "react-router-dom";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import SpecResearchProvider from "@/SpecFetures/1810/Hooks/SpecResearch/SpecResearch_Api";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { useGetSpecCategoryListByProgId } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Hook";
import { useGetTagListByProgId } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { useActions } from "@/Features/Hooks/Common/useActions";
import * as SchemaFields from "@/types/SchemaFields";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { useMemo } from "react";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { SpecResearchDetailModelFields, SpecResearchModelFields, SpecResearchSetFields } from "@/types/SchemaFields";
type SpecResearchSet = components["schemas"]["SpecResearchSet_DTO"]
const emptyData: SpecResearchSet = { SpecResearch: {}, SpecResearchDetail: [], }

/** 網路資源表單
 * @returns 
 */
export const Server_ResearchProjFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const dirUrl = useLocation().pathname.replace(/\/Form$/, `/Form`);
    const formData = useFetchFormData<SpecResearchSet>(SpecResearchProvider(), internalId, emptyData)
    const useCategory = useGetSpecCategoryListByProgId("SpecResearch", prop.lang);
    const useTag = useGetTagListByProgId("SpecResearch", prop.lang);
    const useContentStatus = useFetchEnumOptions("ContentStatus")
    const status = useMemo(() => { const src = useContentStatus.data ?? {}; const { ["0"]: _drop, ...rest } = src; return rest as Record<string, string>; }, [useContentStatus.data]);
    const actions = useActions(dirUrl, SpecResearchProvider(), formData.data as SpecResearchSet, internalId as string)
    useEnsureLangDetails(formData, { headerName: SpecResearchSetFields.SpecResearch, detailName: SpecResearchSetFields.SpecResearchDetail, parentKeys: [SpecResearchModelFields.ResearchId], preferFirstLang: prop.lang });
    const isLoading = [formData.isLoading, useCategory.isLoading, useTag.isLoading, useContentStatus.isLoading]
    const errors = [formData.error, useCategory.error, useTag.error, useContentStatus.error]
    const selectedCateId = formData?.data?.SpecResearch?.CategoryId ?? "";
    const visibleCols = useMemo(() => {
        const list = useCategory.cols?.[selectedCateId] ?? [];
        return new Set(list);
    }, [selectedCateId, useCategory.cols]);
    const formProp: FormCompProp = { Title: "新增研究計畫", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions }
    return (
        <FormComp prop={formProp}>
            <HeaderComp theme={prop.theme} formData={formData} cateOpts={useCategory.data} statusOpts={status} tagOpts={useTag.data} />
            <DetailComp theme={prop.theme} formData={formData} visibleCols={visibleCols} />
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
        Basic: [<LibDropList Style={prop.theme.DropList} Options={prop.cateOpts} {...setField(SpecResearchSetFields.SpecResearch, SpecResearchModelFields.CategoryId, 'string')} />],
        Status: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.statusOpts} {...setField(SpecResearchSetFields.SpecResearch, SpecResearchModelFields.ContentStatus, 'number', undefined, { strategy: 'sum', sumKeys: Object.keys(prop.statusOpts ?? {}).map(Number) })} />],
        Tags: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.tagOpts} {...setField(SpecResearchSetFields.SpecResearch, SpecResearchModelFields.Tags, 'string', undefined, 'csv')} />]
    }
    return <TabContentComp tabInfos={LibTabsPropA} components={componentsA}></TabContentComp>
}

const DetailComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecResearchSet>; visibleCols: Set<string> }) => {
    const setField = useSetTableField<SpecResearchSet>(prop.formData);
    const rawDetails = prop.formData.data?.SpecResearchDetail ?? [];

    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.ResearchId, info.RowId, info.Lang);
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    };

    // ★ 1) 欄位代碼順序（要與 ShowColumnItems 內的字串一致）
    const orderedKeys = [SpecResearchDetailModelFields.Year, SpecResearchDetailModelFields.AcademicYear, SpecResearchDetailModelFields.Semester, SpecResearchDetailModelFields.ClassTime, SpecResearchDetailModelFields.Courses, SpecResearchDetailModelFields.TeachingStaffOfOurSchool, SpecResearchDetailModelFields.ProjectLeader, SpecResearchDetailModelFields.PlanAmount, SpecResearchDetailModelFields.ProjectName, SpecResearchDetailModelFields.PlanContent, SpecResearchDetailModelFields.Commissioned, SpecResearchDetailModelFields.Cohost1, SpecResearchDetailModelFields.Cohost2, SpecResearchDetailModelFields.ApprovalNumber, SpecResearchDetailModelFields.ApprovedAmount, SpecResearchDetailModelFields.DuringExecution, SpecResearchDetailModelFields.ContractPeriod, SpecResearchDetailModelFields.College, SpecResearchDetailModelFields.Department, SpecResearchDetailModelFields.Name, SpecResearchDetailModelFields.GraduationDegree, SpecResearchDetailModelFields.PaperTitle, SpecResearchDetailModelFields.CooperationProject, SpecResearchDetailModelFields.CooperatingUnits, SpecResearchDetailModelFields.Remark,] as const;
    type FieldKey = typeof orderedKeys[number];

    // ★ 2) 為每個欄位建立 node（維持你原本的元件用法）
    const makeNodes = (rowKeys: Record<string, any>) => {
        const t = prop.theme;
        const nodes: Record<FieldKey, React.ReactNode> = {
            Year: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Year, "string", rowKeys)} />,
            AcademicYear: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.AcademicYear, "string", rowKeys)} />,
            Semester: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Semester, "string", rowKeys)} />,
            ClassTime: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.ClassTime, "string", rowKeys)} />,
            Courses: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Courses, "string", rowKeys)} />,
            TeachingStaffOfOurSchool: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.TeachingStaffOfOurSchool, "string", rowKeys)} />,
            ProjectLeader: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.ProjectLeader, "string", rowKeys)} />,
            PlanAmount: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.PlanAmount, "number", rowKeys)} />,
            ProjectName: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.ProjectName, "string", rowKeys)} />,
            PlanContent: <LibTextArea Style={t.TextArea} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.PlanContent, "string", rowKeys)} />,
            Commissioned: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Commissioned, "string", rowKeys)} />,
            Cohost1: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Cohost1, "string", rowKeys)} />,
            Cohost2: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Cohost2, "string", rowKeys)} />,
            ApprovalNumber: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.ApprovalNumber, "string", rowKeys)} />,
            ApprovedAmount: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.ApprovedAmount, "string", rowKeys)} />,
            DuringExecution: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.DuringExecution, "string", rowKeys)} />,
            ContractPeriod: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.ContractPeriod, "string", rowKeys)} />,
            College: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.College, "string", rowKeys)} />,
            Department: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Department, "string", rowKeys)} />,
            Name: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Name, "string", rowKeys)} />,
            GraduationDegree: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.GraduationDegree, "string", rowKeys)} />,
            PaperTitle: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.PaperTitle, "string", rowKeys)} />,
            CooperationProject: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.CooperationProject, "string", rowKeys)} />,
            CooperatingUnits: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.CooperatingUnits, "string", rowKeys)} />,
            Remark: <LibTextArea Style={t.TextArea} DefaultInputDisplay="請輸入" {...setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Remark, "string", rowKeys)} />,
        };
        return nodes;
    };

    // ★ 3) 依集合篩選要渲染的欄位；若集合為空 → 顯示全部
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.ResearchId, info.RowId, info.Lang);
            const rowKeys = {
                [SpecResearchDetailModelFields.ResearchId]: info.ResearchId,
                [SpecResearchDetailModelFields.RowId]: info.RowId,
            };
            const nodes = makeNodes(rowKeys);
            const showAll = prop.visibleCols.size === 0;

            compMap[langKey] = orderedKeys
                .filter((k) => showAll || prop.visibleCols.has(k))
                .map((k) => nodes[k]);

            return compMap;
        },
        {}
    );

    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};