import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibTextArea, LibTextBox, LibTinyMCE } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import type { useSetTableField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { SiteMenu_IndexFields, SiteMenu_IndexInfoFields, SiteMenuSetFields } from "@/types/SchemaFields";
import { useMemo } from "react";

// #region Property
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];

type SiteMenu_IndexInfo = components["schemas"]["SiteMenu_IndexInfo_DTO"];

interface SiteInfoCompProps
{
    theme: IBETheme;
    formData: UseFetchFormDataResult<SiteMenuSet>;
    setField: ReturnType<typeof useSetTableField<SiteMenuSet>>;
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
            system: [<SystemInfoTabComp key="system" theme={prop.theme} formData={prop.formData} setKey={SiteMenuSetFields.SiteMenu_Index} />],
        };
    }, [prop.formData, prop.setField, prop.theme]);
    return <TabContentComp key="site-info-tabs" tabInfos={tabInfos} components={components} />;
};
// #endregion

// #region Section
const SiteTitle_Comp = (prop: BasicSettingTabProps) =>
{
    const siteIndex = prop.formData.data?.SiteMenu_Index?.SiteIndex ?? "";
    const rawDetails = prop.formData.data?.SiteMenu_IndexInfo?.filter((item: SiteMenu_IndexInfo) =>
    {
        return item.SiteIndex === siteIndex;
    }) ?? [];
    const dedupDetails = useMemo(() =>
    {
        const seen = new Set<string>();
        const out: SiteMenu_IndexInfo[] = [];
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
                {...prop.setField(SiteMenuSetFields.SiteMenu_IndexInfo, SiteMenu_IndexInfoFields.Title, "string", rowKeys)}
            />,
            <LibTextArea
                key={`${langKey}_desc`}
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...prop.setField(SiteMenuSetFields.SiteMenu_IndexInfo, SiteMenu_IndexInfoFields.Description, "string", rowKeys)}
            />,
            <LibTinyMCE
                key={`${langKey}_footer`}
                Style={prop.theme.CheckBox}
                {...prop.setField(SiteMenuSetFields.SiteMenu_IndexInfo, SiteMenu_IndexInfoFields.SiteFooter, "string", rowKeys)}
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
                {...prop.setField(SiteMenuSetFields.SiteMenu_Index, SiteMenu_IndexFields.GoogleAnalytics, "string")}
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
            {
                /* <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="" disabled={true} {...prop.setField(SiteMenuSetFields.SiteMenu_Index, SiteMenu_IndexFields.SiteIndex, "string")}/>
      <LibCheckBox Style={prop.theme.CheckBox} options={{ [SiteMenu_IndexFields.Enable]: "" }} {...prop.setField(SiteMenuSetFields.SiteMenu_Index, SiteMenu_IndexFields.Enable, "boolean")}      />
      <LibCheckBox Style={prop.theme.CheckBox} options={{}} {...prop.setField(SiteMenuSetFields.SiteMenu_Index, SiteMenu_IndexFields.SupportLangs, "string", undefined,"csv")}/>
      <LibTextBox Style={prop.theme.TextBox} {...prop.setField(SiteMenuSetFields.SiteMenu_Index, SiteMenu_IndexFields.DefaultLang, "boolean")}/> */
            }
            <SiteTitle_Comp theme={prop.theme} formData={prop.formData} setField={prop.setField} />
        </>
    );
};
// #endregion
