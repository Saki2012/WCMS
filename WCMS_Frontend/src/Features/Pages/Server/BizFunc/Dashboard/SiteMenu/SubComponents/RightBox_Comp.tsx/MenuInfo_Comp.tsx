import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import type { components } from "@/types/api";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { useMemo } from "react";
import { SiteMenu_Item_TitleFields, SiteMenu_ItemFields, SiteMenuSetFields } from "@/types/SchemaFields";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibCheckBox, LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { LangLabelMap, type Lang } from "@/SysCore/i18n/lang";
import type { SiteMenuItem } from "../../SiteMenu_Hook";
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"]
type MenuUrlType = components["schemas"]["MenuUrlType"]

interface BasicSettingTab_Props {
  theme: IBETheme;
  selectedItemEdit: SiteMenuItem | null;
  formData: UseFetchFormDataResult<SiteMenuSet>;
  setField: ReturnType<typeof useSetTableField<SiteMenuSet>>;
  itemType: Record<string, string>;
  windowTarget: Record<string, string>;
  setLinkType: React.Dispatch<React.SetStateAction<MenuUrlType>>;
}
export const BasicSettingTab = (prop: BasicSettingTab_Props) => {
  const selectedMenuItem = prop.selectedItemEdit?.menuItem;
  const curRowKeys = {[SiteMenu_ItemFields.SiteIndex]: selectedMenuItem?.SiteIndex, [SiteMenu_ItemFields.RowId]: selectedMenuItem?.RowId,};
  const itemTypeBind = prop.setField(SiteMenuSetFields.SiteMenu_Item, SiteMenu_ItemFields.ItemType, "number", curRowKeys, );
  return (
    <>
      <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入數字或英文，不可使用空白的" {...prop.setField(SiteMenuSetFields.SiteMenu_Item, SiteMenu_ItemFields.ItemSiteUrl, "string", curRowKeys,)}/>
      <LibTextBox disabled={true} Style={prop.theme.TextBox} DefaultInputDisplay="" {...prop.setField(SiteMenuSetFields.SiteMenu_Item, SiteMenu_ItemFields.FullUrl, "string", curRowKeys, )}/>
      <LibCheckBox Style={prop.theme.RadioBox} options={prop.itemType} ColumnDisplayName={itemTypeBind.ColumnDisplayName} InputValue={itemTypeBind.InputValue} onChange={(v) => { itemTypeBind.onChange?.(v); prop.setLinkType(Number(v) as MenuUrlType); }}/>
      <LibCheckBox Style={prop.theme.RadioBox} options={prop.windowTarget} {...prop.setField(SiteMenuSetFields.SiteMenu_Item, SiteMenu_ItemFields.WindowTarget, "number", curRowKeys, )}/>
      <MenuTitle_Comp {...prop} />
    </>
  );
};

const MenuTitle_Comp = (prop: BasicSettingTab_Props) => {
  // 宣告變數
  const selectedMenuItem = prop.selectedItemEdit?.menuItem;
  const rawDetails = prop.formData.data?.SiteMenu_Item_Title?.filter((p) => p.SiteIndex === selectedMenuItem?.SiteIndex && p.ItemRowId === selectedMenuItem?.RowId,) ?? [];
  const dedupDetails = useMemo(() => {
    const seen = new Set<string>();
    const out: typeof rawDetails = [];
    for (const d of rawDetails) {
      const langKey = String(d?.Lang ?? "").toLowerCase();
      if (seen.has(langKey)) continue;
      seen.add(langKey);
      out.push(d);
    }
    return out;
  }, [rawDetails]);
  const tabInfo: LibTabsProp = {
    Style: prop.theme.Tabs,
    item: dedupDetails.reduce<Record<string, string>>((tabItems, info) => {
      const langKey = LibMerge("_", true, info.SiteIndex, info.ItemRowId, info.RowId, info.Lang, );
      tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
      return tabItems;
    }, {}),
  };
  const tabContent = dedupDetails.reduce<Record<string, React.ReactNode[]>>((compMap, info) => {
      const langKey = LibMerge("_", true, info.SiteIndex, info.ItemRowId, info.RowId, info.Lang,);
      const rowKeys = {
        [SiteMenu_Item_TitleFields.SiteIndex]: info.SiteIndex,
        [SiteMenu_Item_TitleFields.ItemRowId]: info.ItemRowId,
        [SiteMenu_Item_TitleFields.RowId]: info.RowId,
      };
      compMap[langKey] = [
        <LibTextBox key={`${langKey}_title`} Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...prop.setField(SiteMenuSetFields.SiteMenu_Item_Title, SiteMenu_Item_TitleFields.Title, "string", rowKeys,)}/>,
        <LibCheckBox key={`${langKey}_show`} Style={prop.theme.CheckBox} options={{ [SiteMenu_Item_TitleFields.IsShowOnMenu]: "" }}{...prop.setField(SiteMenuSetFields.SiteMenu_Item_Title, SiteMenu_Item_TitleFields.IsShowOnMenu, "boolean", rowKeys,)}/>,
      ];
      return compMap;
    },{},
  );

  // return
  return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};