
import { useEffect, useMemo, type Dispatch, type SetStateAction } from "react";
import { LibCheckBox, LibDropList, LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { type Lang } from "@/SysCore/i18n/lang";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { SiteMenu_Item_UrlFields, SiteMenuSetFields } from "@/types/SchemaFields";
import type { SiteMenuItem } from "../../SiteMenu_Hook";

type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];
type SiteMenu_Item_Url = components["schemas"]["SiteMenu_Item_Url_DTO"];
type MenuUrlType = components["schemas"]["MenuUrlType"];

interface HyperlinkSettingTabProps {
  theme: IBETheme;
  selectedItemEdit: SiteMenuItem | null;
  setField: ReturnType<typeof useSetTableField<SiteMenuSet>>;
  navType: MenuUrlType;
  formData: UseFetchFormDataResult<SiteMenuSet>;
  siteMenuItems:SiteMenuItem[];
  menuUrlType: Record<string, string>;
  lang: Lang;
  setNavType: Dispatch<SetStateAction<MenuUrlType>>;
}
/** 超連結設定頁籤：外部連結 / 內部連結切換與綁定 */
export const HyperlinkSettingTab = (prop: HyperlinkSettingTabProps) => {
  const selectedMenuItem = prop.selectedItemEdit?.menuItem;
  const siteIndex = selectedMenuItem?.SiteIndex;
  const rowId = selectedMenuItem?.RowId;
  const curRowKeys = useMemo(() => ({ [SiteMenu_Item_UrlFields.SiteIndex]: siteIndex, [SiteMenu_Item_UrlFields.ItemRowId]: rowId,}),[siteIndex, rowId],);
  const internalUrlOptions = useMemo(() => {return buildInternalUrlOptions(prop.siteMenuItems, rowId ?? null);}, [prop.siteMenuItems, rowId]);
  /** 確保目前選取項目一定有對應的 Url 設定列 */
  useEffect(() => {
    if (!siteIndex || !rowId) return;
    prop.formData.setFormData((prev) => {
      const data = (prev ?? {}) as SiteMenuSet;
      const list = [...(data.SiteMenu_Item_Url ?? [])];
      const exists = list.some((item) => item.SiteIndex === siteIndex && item.ItemRowId === rowId,);
      if (exists) return prev;
      const nextItem: SiteMenu_Item_Url = {SiteIndex: siteIndex,ItemRowId: rowId,RedirectType: 1,RedirectUrl: "",};
      return {...data, SiteMenu_Item_Url: [...list, nextItem],};
    });
  }, [siteIndex, rowId, prop.formData]);
  const redirectTypeBind = prop.setField(SiteMenuSetFields.SiteMenu_Item_Url, SiteMenu_Item_UrlFields.RedirectType, "number", curRowKeys,);
  const redirectUrlBind = prop.setField(SiteMenuSetFields.SiteMenu_Item_Url, SiteMenu_Item_UrlFields.RedirectUrl, "string", curRowKeys,);
  return (
    <>
      <LibCheckBox options={prop.menuUrlType} Style={prop.theme.RadioBox} ColumnDisplayName={redirectTypeBind.ColumnDisplayName} InputValue={redirectTypeBind.InputValue} onChange={(v) => { redirectTypeBind.onChange?.(v); prop.setNavType(Number(v) as MenuUrlType); }}/>
      {prop.navType === 1 ?
        <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入數字或英文，不可使用空白的" {...redirectUrlBind}/> : 
        <LibDropList Style={prop.theme.DropList} Options={internalUrlOptions} AutoDefaultFirst={false} {...redirectUrlBind} />
      }
    </>
  );
};

/** 建立內部連結下拉選單 */
const buildInternalUrlOptions = (items: SiteMenuItem[],currentRowId: number | null,): Record<string, string> => {
  const options: Record<string, string> = {};
  const thinSpace = "\u2009";
  const walk = (nodes: SiteMenuItem[] | undefined, depth: number) => {
    if (!nodes?.length) return;
    for (const node of nodes) {
      const fullUrl = String(node.menuItem?.FullUrl ?? "").trim();
      const redirectType = Number(node.menuItem?._SiteMenu_Item_Url?.RedirectType ?? 0);
      const isExternal = redirectType === 1;
      const isCurrentItem = Number(node.menuItem?.RowId ?? 0) === Number(currentRowId ?? 0);
      if (fullUrl && !isExternal && !isCurrentItem) {
        const indent = depth > 0 ? thinSpace.repeat(depth * 2) : "";
        options[fullUrl] = `${indent}${node.name}`;
      }
      walk(node.children, depth + 1);
    }
  };
  walk(items, 0);
  return options;
};
//#endregion