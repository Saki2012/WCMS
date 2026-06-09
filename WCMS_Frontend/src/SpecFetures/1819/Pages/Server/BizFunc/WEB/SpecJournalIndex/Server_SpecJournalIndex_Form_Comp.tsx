import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type { IEditGridView_Style } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { type Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { SpecJournalIndexModelFields, SpecJournalIndexSetFields } from "@/types/SchemaFields";
import { useSpecJournalIndexDetailEditGrid, useSpecJournalIndexFormTemplate } from "./Server_SpecJournalIndex_Form_Hook";

// #region Property
type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];

const emptyData: SpecJournalIndexSet = {};


const editGridStyle: IEditGridView_Style = {
    TableStyle: "table table-striped table-bordered table-hover",
    ToolbarStyle: "d-flex align-items-center justify-content-between mb-2",
    ButtonStyle: "btn btn-custom btn-rounded btn-sm",
    DangerButtonStyle: "btn btn-danger btn-rounded btn-sm",
    ErrorStyle: "text-danger small mt-1",
};
// #endregion

// #region Public
/** 1819 期刊目次 Form，透過 Server_FormTemplate 統一外框與資料流程。 */
export const Server_SpecJournalIndex_Form_Comp = (prop: { theme: IBETheme; lang: Lang; }) =>
{
    // 宣告變數
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

    const template = useSpecJournalIndexFormTemplate({ lang: prop.lang, theme: prop.theme, internalId: internalId ?? "", emptyData, actionsOpt });

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => <MainFormComp theme={prop.theme} formData={vm.binding} />}
        />
    );
};
// #endregion

// #region Section
/** 期刊目次主表單頁籤，負責組合基本資料與系統資訊。 */
const MainFormComp = (prop: { theme: IBETheme; formData: ServerFormBinding<SpecJournalIndexSet>; }) =>
{
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { "Basic": "基本資料", "System": "系統資訊" } };
    const components: Record<string, React.ReactNode[]> = {
        Basic: [<BasicComp theme={prop.theme} formData={prop.formData} />],
        System: [<SystemInfoTabComp theme={prop.theme} formData={prop.formData} setKey={SpecJournalIndexSetFields.SpecJournalIndex} />],
    };
    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>;
};


const BasicComp = (props: { theme: IBETheme; formData: ServerFormBinding<SpecJournalIndexSet>; }) =>
{
    const setField = useSetTableField<SpecJournalIndexSet>(props.formData);

    return (
        <>
            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalIndexSetFields.SpecJournalIndex, SpecJournalIndexModelFields.IndexName, "string")}
                />
            </div>
            <DetailComp theme={props.theme} formData={props.formData} />
        </>
    );
};


const DetailComp = (props: { theme: IBETheme; formData: ServerFormBinding<SpecJournalIndexSet>; }) =>
{
    const detailGrid = useSpecJournalIndexDetailEditGrid({ binding: props.formData, style: editGridStyle });

    return (
        <div className="col-12 form-group mt-3">
            <EditGrid {...detailGrid.editGridProps} />
        </div>
    );
};
// #endregion
