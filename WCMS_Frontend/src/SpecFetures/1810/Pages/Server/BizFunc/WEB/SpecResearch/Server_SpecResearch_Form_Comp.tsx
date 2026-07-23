import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibCheckBox, LibDropList, LibTextArea, LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useFormModelField, useSetTableField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import { markPageStateMemoryEntry } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Navigation";
import type { components } from "@/types/api";
import { SpecResearchDetailFields, SpecResearchFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    type SpecResearchDetailTabItem,
    specResearchEmptyData,
    type SpecResearchFormRefs,
    type SpecResearchRowKeys,
    useSpecResearchDetailTabs,
    useSpecResearchFormTemplate,
} from "./Server_SpecResearch_Form_Hook";

// #region Property
type SpecResearchFormModel = components["schemas"]["SpecResearch"];

interface SpecResearchFormCompProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;
}

interface HeaderSectionProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<SpecResearchFormModel>;

    /** SpecResearch Hook 整理後的參照資料 */
    refs: SpecResearchFormRefs;
}

interface DetailSectionProps extends HeaderSectionProps
{
    /** 目前語系 */
    lang: Lang;
}

interface HeaderTabContentOptions extends HeaderSectionProps
{
    /** 欄位 binding helper */
    setField: ReturnType<typeof useFormModelField<SpecResearchFormModel>>;

    /** 類別下拉選項 */
    cateOpts: Map<string, string>;
}

interface DetailTabContentOptions
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<SpecResearchFormModel>;

    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<SpecResearchFormModel>>;

    /** Detail tabs */
    tabItems: SpecResearchDetailTabItem[];

    /** 依類別決定要顯示的欄位集合 */
    visibleCols: Set<string>;
}

interface DetailFieldBuildOptions
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<SpecResearchFormModel>>;

    /** Detail row keys，給 useSetTableField 綁定欄位 */
    rowKeys: SpecResearchRowKeys;
}

const specResearchDetailOrderedKeys = [
    SpecResearchDetailFields.Year,
    SpecResearchDetailFields.AcademicYear,
    SpecResearchDetailFields.Semester,
    SpecResearchDetailFields.ClassTime,
    SpecResearchDetailFields.Courses,
    SpecResearchDetailFields.TeachingStaffOfOurSchool,
    SpecResearchDetailFields.ProjectLeader,
    SpecResearchDetailFields.PlanAmount,
    SpecResearchDetailFields.ProjectName,
    SpecResearchDetailFields.PlanContent,
    SpecResearchDetailFields.Commissioned,
    SpecResearchDetailFields.Cohost1,
    SpecResearchDetailFields.Cohost2,
    SpecResearchDetailFields.ApprovalNumber,
    SpecResearchDetailFields.ApprovedAmount,
    SpecResearchDetailFields.DuringExecution,
    SpecResearchDetailFields.ContractPeriod,
    SpecResearchDetailFields.College,
    SpecResearchDetailFields.Department,
    SpecResearchDetailFields.Professor,
    SpecResearchDetailFields.Name,
    SpecResearchDetailFields.GraduationDegree,
    SpecResearchDetailFields.PaperTitle,
    SpecResearchDetailFields.CooperationProject,
    SpecResearchDetailFields.CooperatingUnits,
    SpecResearchDetailFields.Remark,
] as const;

type SpecResearchDetailFieldKey = (typeof specResearchDetailOrderedKeys)[number];
// #endregion

// #region Public
/** 研究計畫 Form，透過新版 Form Template 統一外框與資料流程。 */
export const Server_ResearchProjFormComp = (props: SpecResearchFormCompProps) =>
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
    const actionsOpt = useMemo(() =>
    {
        return { onBackToList };
    }, [onBackToList]);
    const template = useSpecResearchFormTemplate({
        lang: props.lang,
        theme: props.theme,
        internalId: internalId ?? "",
        emptyData: specResearchEmptyData,
        actionsOpt,
    });

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => (
                <>
                    <HeaderComp theme={props.theme} binding={vm.binding} refs={vm.refs} />
                    <DetailComp theme={props.theme} lang={props.lang} binding={vm.binding} refs={vm.refs} />
                </>
            )}
        />
    );
};
// #endregion

// #region Section
/** 研究計畫 Header 區塊，負責基本資料、狀態、標籤與系統資訊。 */
const HeaderComp = (props: HeaderSectionProps) =>
{
    const setField = useFormModelField<SpecResearchFormModel>(props.binding);
    const cateOpts = useMemo(() => new Map<string, string>(Object.entries(props.refs.categoryMap ?? {})), [props.refs.categoryMap]);
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { Basic: "基本", Status: "狀態", Tags: "標籤", System: "系統資訊" } };
    const tabContent = buildHeaderTabContent({ ...props, setField, cateOpts });

    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};

/** 研究計畫多語 Detail 區塊，依類別 ShowColumnItems 決定欄位顯示。 */
const DetailComp = (props: DetailSectionProps) =>
{
    const setField = useSetTableField<SpecResearchFormModel>(props.binding);
    const detailTabs = useSpecResearchDetailTabs({ binding: props.binding, lang: props.lang });
    const visibleCols = useSpecResearchVisibleColumns(props.binding, props.refs.categoryCols);
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: detailTabs.tabItems };
    const tabContent = buildDetailTabContent({ theme: props.theme, binding: props.binding, setField, tabItems: detailTabs.items, visibleCols });

    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};
// #endregion

// #region Private
/** 依目前選取類別取得 Detail 欄位顯示集合。 */
const useSpecResearchVisibleColumns = (
    binding: ServerFormBinding<SpecResearchFormModel>,
    categoryCols: Record<string, string[]>,
): Set<string> =>
{
    const selectedCateId = binding.data?.CategoryId ?? "";

    return useMemo(() =>
    {
        return new Set(categoryCols?.[selectedCateId] ?? []);
    }, [categoryCols, selectedCateId]);
};

/** 建立 Header 分頁欄位。 */
const buildHeaderTabContent = (opt: HeaderTabContentOptions): Record<string, ReactNode[]> =>
{
    return {
        Basic: buildBasicFields(opt),
        Status: buildStatusFields(opt),
        Tags: buildTagFields(opt),
        System: [<SystemInfoTabComp theme={opt.theme} formData={opt.binding} />],
    };
};

/** 建立基本資料欄位。 */
const buildBasicFields = (opt: HeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibDropList
            Style={opt.theme.DropList}
            Options={opt.cateOpts}
            {...opt.setField(SpecResearchFields.CategoryId, "string")}
        />,
    ];
};

/** 建立內容狀態欄位。 */
const buildStatusFields = (opt: HeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibCheckBox
            Style={opt.theme.CheckBox}
            options={opt.refs.statusOpts}
            {...opt.setField(SpecResearchFields.ContentStatus, "number", {
                strategy: "sum",
                sumKeys: Object.keys(opt.refs.statusOpts ?? {}).map(Number),
            })}
        />,
    ];
};

/** 建立標籤欄位。 */
const buildTagFields = (opt: HeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibCheckBox
            Style={opt.theme.CheckBox}
            options={opt.refs.tagMap}
            {...opt.setField(SpecResearchFields.Tags, "string", "csv")}
        />,
    ];
};

/** 建立 Detail 分頁內容。 */
const buildDetailTabContent = (opt: DetailTabContentOptions): Record<string, ReactNode[]> =>
{
    return opt.tabItems.reduce<Record<string, ReactNode[]>>((compMap, item) =>
    {
        const fieldNodes = buildDetailFieldNodes({ theme: opt.theme, setField: opt.setField, rowKeys: item.rowKeys });
        const showAll = opt.visibleCols.size === 0;
        compMap[item.key] = specResearchDetailOrderedKeys.filter(key => showAll || opt.visibleCols.has(key)).map(key => fieldNodes[key]);
        return compMap;
    }, {});
};

/** 建立 Detail 欄位節點對照表。 */
const buildDetailFieldNodes = (opt: DetailFieldBuildOptions): Record<SpecResearchDetailFieldKey, ReactNode> =>
{
    const t = opt.theme;

    return {
        [SpecResearchDetailFields.Year]: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.Year, "number", opt.rowKeys)} />,
        [SpecResearchDetailFields.AcademicYear]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.AcademicYear, "number", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.Semester]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.Semester, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.ClassTime]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.ClassTime, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.Courses]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.Courses, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.TeachingStaffOfOurSchool]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.TeachingStaffOfOurSchool, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.ProjectLeader]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.ProjectLeader, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.PlanAmount]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.PlanAmount, "number", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.ProjectName]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.ProjectName, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.PlanContent]: <LibTextArea Style={t.TextArea} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.PlanContent, "string", opt.rowKeys)} />,
        [SpecResearchDetailFields.Commissioned]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.Commissioned, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.Cohost1]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.Cohost1, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.Cohost2]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.Cohost2, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.ApprovalNumber]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.ApprovalNumber, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.ApprovedAmount]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.ApprovedAmount, "number", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.DuringExecution]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.DuringExecution, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.ContractPeriod]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.ContractPeriod, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.College]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.College, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.Department]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.Department, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.Professor]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.Professor, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.Name]: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.Name, "string", opt.rowKeys)} />,
        [SpecResearchDetailFields.GraduationDegree]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.GraduationDegree, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.PaperTitle]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.PaperTitle, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.CooperationProject]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.CooperationProject, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.CooperatingUnits]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.CooperatingUnits, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailFields.Remark]: <LibTextArea Style={t.TextArea} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchFields._SpecResearchDetail, SpecResearchDetailFields.Remark, "string", opt.rowKeys)} />,
    };
};
// #endregion
