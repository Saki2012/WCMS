import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibTextArea, LibTextBox, LibTinyMCE } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import { SiteMenu_IndexFields, SiteMenu_IndexInfoFields } from "@/types/SchemaFields";
import { useMemo } from "react";
import { type SiteMenuFormModel, type SiteMenuGraphField, type SiteMenuIndexInfo } from "../../SiteMenu_FormModel_Hook";

// #region Property
interface SiteInfoCompProps
{
    theme: IBETheme;
    formData: UseFetchFormDataResult<SiteMenuFormModel>;
    setField: SiteMenuGraphField;
}

interface BasicSettingTabProps extends SiteInfoCompProps
{}
// #endregion

// #region Public
export const SiteInfo_Comp = (prop: SiteInfoCompProps) =>
{
    const tabInfos: LibTabsProp = { Style: prop.theme.Tabs, item: { basic: "基本資訊", SEO: "SEO設定", system: "系統資訊" } };
    const components = useMemo<Record<string, React.ReactNode[]>>(() =>
    {
        return {
            basic: [<BasicSettingTab key="basic" theme={prop.theme} formData={prop.formData} setField={prop.setField} />],
            SEO: [<SEO_Comp key="seo" theme={prop.theme} formData={prop.formData} setField={prop.setField} />],
            system: [<SystemInfoTabComp key="system" theme={prop.theme} formData={prop.formData}  />],
        };
    }, [prop.formData, prop.setField, prop.theme]);
    return <TabContentComp key="site-info-tabs" tabInfos={tabInfos} components={components} />;
};
// #endregion

// #region Section
const SiteTitle_Comp = (prop: BasicSettingTabProps) =>
{
    const siteIndex = prop.formData.data?.SiteIndex ?? "";
    const rawDetails = prop.formData.data?._SiteMenu_IndexInfo?.filter((item: SiteMenuIndexInfo) =>
    {
        return item.SiteIndex === siteIndex;
    }) ?? [];
    const dedupDetails = useMemo(() =>
    {
        const seen = new Set<string>();
        const out: SiteMenuIndexInfo[] = [];
        for (const item of rawDetails)
        {
            const langKey = String(item?.Lang ?? "").toLowerCase();
            if (seen.has(langKey)) continue;
            seen.add(langKey);
            out.push(item);
        }
        return out;
    }, [rawDetails]);
    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: dedupDetails.reduce<Record<string, string>>((tabItems, info) =>
        {
            const langKey = LibText.Merge("_", true, info.SiteIndex, info.RowId, info.Lang);
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {}),
    };
    const tabContent = dedupDetails.reduce<Record<string, React.ReactNode[]>>((compMap, info) =>
    {
        const langKey = LibText.Merge("_", true, info.SiteIndex, info.RowId, info.Lang);
        const rowKeys = { [SiteMenu_IndexInfoFields.SiteIndex]: info.SiteIndex, [SiteMenu_IndexInfoFields.RowId]: info.RowId };
        compMap[langKey] = [
            <LibTextBox
                key={`${langKey}_title`}
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...prop.setField(SiteMenu_IndexFields._SiteMenu_IndexInfo, SiteMenu_IndexInfoFields.Title, "string", rowKeys)}
            />,
            <LibTextArea
                key={`${langKey}_desc`}
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...prop.setField(SiteMenu_IndexFields._SiteMenu_IndexInfo, SiteMenu_IndexInfoFields.Description, "string", rowKeys)}
            />,
            <LibTinyMCE
                key={`${langKey}_footer`}
                Style={prop.theme.CheckBox}
                {...prop.setField(SiteMenu_IndexFields._SiteMenu_IndexInfo, SiteMenu_IndexInfoFields.SiteFooter, "string", rowKeys)}
            />,
        ];
        return compMap;
    }, {});
    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};

const SEO_Comp = (prop: BasicSettingTabProps) =>
{
    return (
        <>
            <LibTextArea
                key="SEO"
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...prop.setField("SiteMenu_Index", SiteMenu_IndexFields.GoogleAnalytics, "string")}
            />
        </>
    );
};
// #endregion

// #region Private
const BasicSettingTab = (prop: BasicSettingTabProps) =>
{
    return (
        <>
            <SiteTitle_Comp theme={prop.theme} formData={prop.formData} setField={prop.setField} />
        </>
    );
};
// #endregion
