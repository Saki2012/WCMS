import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibCheckBox, LibDropList, LibTextArea, LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useSetTableField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import type { components } from "@/types/api";
import { SpecResearchDetailModelFields, SpecResearchModelFields, SpecResearchSetFields } from "@/types/SchemaFields";
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
type SpecResearchSet = components["schemas"]["SpecResearchSet_DTO"];

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
    binding: ServerFormBinding<SpecResearchSet>;

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
    setField: ReturnType<typeof useSetTableField<SpecResearchSet>>;

    /** 類別下拉選項 */
    cateOpts: Map<string, string>;
}

interface DetailTabContentOptions
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<SpecResearchSet>;

    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<SpecResearchSet>>;

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
    setField: ReturnType<typeof useSetTableField<SpecResearchSet>>;

    /** Detail row keys，給 useSetTableField 綁定欄位 */
    rowKeys: SpecResearchRowKeys;
}

const specResearchDetailOrderedKeys = [
    SpecResearchDetailModelFields.Year,
    SpecResearchDetailModelFields.AcademicYear,
    SpecResearchDetailModelFields.Semester,
    SpecResearchDetailModelFields.ClassTime,
    SpecResearchDetailModelFields.Courses,
    SpecResearchDetailModelFields.TeachingStaffOfOurSchool,
    SpecResearchDetailModelFields.ProjectLeader,
    SpecResearchDetailModelFields.PlanAmount,
    SpecResearchDetailModelFields.ProjectName,
    SpecResearchDetailModelFields.PlanContent,
    SpecResearchDetailModelFields.Commissioned,
    SpecResearchDetailModelFields.Cohost1,
    SpecResearchDetailModelFields.Cohost2,
    SpecResearchDetailModelFields.ApprovalNumber,
    SpecResearchDetailModelFields.ApprovedAmount,
    SpecResearchDetailModelFields.DuringExecution,
    SpecResearchDetailModelFields.ContractPeriod,
    SpecResearchDetailModelFields.College,
    SpecResearchDetailModelFields.Department,
    SpecResearchDetailModelFields.Professor,
    SpecResearchDetailModelFields.Name,
    SpecResearchDetailModelFields.GraduationDegree,
    SpecResearchDetailModelFields.PaperTitle,
    SpecResearchDetailModelFields.CooperationProject,
    SpecResearchDetailModelFields.CooperatingUnits,
    SpecResearchDetailModelFields.Remark,
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
        navigate(LibRoutePath.buildServerBackToListPath(pathname));
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
    const setField = useSetTableField<SpecResearchSet>(props.binding);
    const cateOpts = useMemo(() => new Map<string, string>(Object.entries(props.refs.categoryMap ?? {})), [props.refs.categoryMap]);
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { Basic: "基本", Status: "狀態", Tags: "標籤", System: "系統資訊" } };
    const tabContent = buildHeaderTabContent({ ...props, setField, cateOpts });

    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};

/** 研究計畫多語 Detail 區塊，依類別 ShowColumnItems 決定欄位顯示。 */
const DetailComp = (props: DetailSectionProps) =>
{
    const setField = useSetTableField<SpecResearchSet>(props.binding);
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
    binding: ServerFormBinding<SpecResearchSet>,
    categoryCols: Record<string, string[]>,
): Set<string> =>
{
    const selectedCateId = binding.data?.SpecResearch?.CategoryId ?? "";

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
        System: [<SystemInfoTabComp theme={opt.theme} formData={opt.binding} setKey={SpecResearchSetFields.SpecResearch} />],
    };
};

/** 建立基本資料欄位。 */
const buildBasicFields = (opt: HeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibDropList
            Style={opt.theme.DropList}
            Options={opt.cateOpts}
            {...opt.setField(SpecResearchSetFields.SpecResearch, SpecResearchModelFields.CategoryId, "string")}
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
            {...opt.setField(SpecResearchSetFields.SpecResearch, SpecResearchModelFields.ContentStatus, "number", undefined, {
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
            {...opt.setField(SpecResearchSetFields.SpecResearch, SpecResearchModelFields.Tags, "string", undefined, "csv")}
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
        [SpecResearchDetailModelFields.Year]: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Year, "number", opt.rowKeys)} />,
        [SpecResearchDetailModelFields.AcademicYear]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.AcademicYear, "number", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.Semester]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Semester, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.ClassTime]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.ClassTime, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.Courses]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Courses, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.TeachingStaffOfOurSchool]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.TeachingStaffOfOurSchool, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.ProjectLeader]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.ProjectLeader, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.PlanAmount]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.PlanAmount, "number", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.ProjectName]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.ProjectName, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.PlanContent]: <LibTextArea Style={t.TextArea} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.PlanContent, "string", opt.rowKeys)} />,
        [SpecResearchDetailModelFields.Commissioned]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Commissioned, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.Cohost1]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Cohost1, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.Cohost2]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Cohost2, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.ApprovalNumber]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.ApprovalNumber, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.ApprovedAmount]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.ApprovedAmount, "number", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.DuringExecution]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.DuringExecution, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.ContractPeriod]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.ContractPeriod, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.College]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.College, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.Department]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Department, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.Professor]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Professor, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.Name]: <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Name, "string", opt.rowKeys)} />,
        [SpecResearchDetailModelFields.GraduationDegree]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.GraduationDegree, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.PaperTitle]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.PaperTitle, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.CooperationProject]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.CooperationProject, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.CooperatingUnits]: (
            <LibTextBox parentClass="col-md-6 col-12" Style={t.TextBox2} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.CooperatingUnits, "string", opt.rowKeys)} />
        ),
        [SpecResearchDetailModelFields.Remark]: <LibTextArea Style={t.TextArea} DefaultInputDisplay="請輸入" {...opt.setField(SpecResearchSetFields.SpecResearchDetail, SpecResearchDetailModelFields.Remark, "string", opt.rowKeys)} />,
    };
};
// #endregion
