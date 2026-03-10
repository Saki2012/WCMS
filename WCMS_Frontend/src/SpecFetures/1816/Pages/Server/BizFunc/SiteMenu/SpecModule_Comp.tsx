
import { LibCheckBox, LibDropList } from "@/SysCore/Components/FormField/LibFormField";
import { useSetJsonField} from "@/SysCore/Components/FormField/useSetTableField";
import { PGID, SiteMenu_Item_ModuleFields, SiteMenuSetFields } from "@/types/SchemaFields";
import type { components } from "@/types/api";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { SiteMenuItem } from "@/Features/Pages/Server/BizFunc/Dashboard/SiteMenu/SiteMenu_Hook";
import { type Lang } from "@/SysCore/i18n/lang";
import { useMemo } from "react";

type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"]
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];

interface ModuleOptionsJson {
  PageId: string;
  Category: string;
  Tag: string;
  Style: number;
}

const moduleOptionsDefaults: ModuleOptionsJson = {
  PageId: "",
  Category: "",
  Tag: "",
  Style: 1
};

export const Module_SpecResearch_Comp = (prop: {theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: SiteMenuItem | null; styleDict: Record<string, string>;lang: Lang; categoryDatas: SpecCategorySet[]; tagSets: TagSet[];}): React.ReactNode => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.menuItem.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.menuItem.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(prop.formData,SiteMenuSetFields.SiteMenu_Item_Module,SiteMenu_Item_ModuleFields.ModuleOptions,curRowKeys,moduleOptionsDefaults);
  const catBind = binder.bind("Category", "string");
  const tagBind = binder.bind("Tag", "csv");
  const {cateDic,tagDic} = useGetCategoryTagDict(PGID.SpecResearch,prop.lang,prop.categoryDatas,prop.tagSets)
  return <>
    <LibDropList Style={prop.theme.DropList} ColumnDisplayName="類別" Options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} AutoDefaultFirst={false} />
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />
  </>
}
export const Module_SpecUSR_Comp = (prop: {theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: SiteMenuItem | null; styleDict: Record<string, string>;lang: Lang; categoryDatas: SpecCategorySet[]; tagSets: TagSet[];}): React.ReactNode => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.menuItem.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.menuItem.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(prop.formData,SiteMenuSetFields.SiteMenu_Item_Module,SiteMenu_Item_ModuleFields.ModuleOptions,curRowKeys,moduleOptionsDefaults);
  const catBind = binder.bind("Category", "string");
  const tagBind = binder.bind("Tag", "csv");
  const {cateDic,tagDic} = useGetCategoryTagDict(PGID.SpecUSR,prop.lang,prop.categoryDatas,prop.tagSets)
  return <>
    <LibDropList Style={prop.theme.DropList} ColumnDisplayName="類別" Options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} AutoDefaultFirst={false} />
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />
  </>
}
const useGetCategoryTagDict=(progId:PGID,lang:Lang,categorySets:SpecCategorySet[],tagSets:TagSet[])=>{
  const cateDic = useMemo<Record<string, string>>(() => {
      const src = categorySets.filter(p=>p.SpecCategory?.ProgId===progId) ?? [];
      return src.reduce<Record<string, string>>((acc, item: SpecCategorySet) => {
      const key = item.SpecCategory?.CategoryId?.toString?.();
      if (!key) return acc;
      acc[key] = item.SpecCategoryDetail?.find(p=>p.Lang===lang)?.CategoryName ?? "";
      return acc;},{});},[progId,lang,categorySets])
  const tagDic = useMemo<Record<string, string>>(() => {
      const src = tagSets.filter(p=>p.TagData?.ProgId===progId) ?? [];
      return src.reduce<Record<string, string>>((acc, item: TagSet) => {
      const key = item.TagData?.TagId?.toString?.();
      if (!key) return acc;
      acc[key] = item.TagDetail?.find(p=>p.Lang===lang)?.TagName ?? "";
      return acc;},{});},[progId,lang,tagSets])
    return {cateDic,tagDic}
}




export const Module_SpecMusical_Comp = (prop: {theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: SiteMenuItem | null; styleDict: Record<string, string>;lang: Lang; categorySets: CategorySet[]}): React.ReactNode => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.menuItem.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.menuItem.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(prop.formData,SiteMenuSetFields.SiteMenu_Item_Module,SiteMenu_Item_ModuleFields.ModuleOptions,curRowKeys,moduleOptionsDefaults);
  const catBind = binder.bind("Category", "string");
  const cateDic = useGetCategoryDict(PGID.SpecMusical,prop.lang,prop.categorySets)
  return <LibDropList Style={prop.theme.DropList} ColumnDisplayName="類別" Options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} AutoDefaultFirst={false} />
}

const useGetCategoryDict=(progId:PGID,lang:Lang,categorySets:CategorySet[])=>{
  const cateDic = useMemo<Record<string, string>>(() => {
      const src = categorySets.filter(p=>p.Category?.ProgId===progId) ?? [];
      return src.reduce<Record<string, string>>((acc, item: CategorySet) => {
      const key = item.Category?.CategoryId?.toString?.();
      if (!key) return acc;
      acc[key] = item.CategoryDetail?.find(p=>p.Lang===lang)?.CategoryName ?? "";
      return acc;},{});},[progId,lang,categorySets])
    return cateDic
}

