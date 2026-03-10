//#region 模型配置

import { LibCheckBox, LibDropList, LibSelectCard } from "@/SysCore/Components/FormField/LibFormField";
import { useSetJsonField, useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { PGID, SiteMenu_Item_ModuleFields, SiteMenuSetFields } from "@/types/SchemaFields";
import { useEffect, useMemo, type ReactNode } from "react";
import type { components } from "@/types/api";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { SiteMenuItem } from "../../SiteMenu_Hook";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import type { ModelKey } from "../RenderRightBox_Comp";
import { useModuleSettingTabSpecExtension } from "SpecFeature/Pages/Server/BizFunc/SiteMenu/Module_Extension";
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"]
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
type SiteMenu_Item_Module = components["schemas"]["SiteMenu_Item_Module_DTO"]

/** 乾脆這個開在後端?也比較好擴充，但是這樣前端還是一樣要特別去寫 */
const BaseModuleOpts: Record<ModelKey|any, string> = {
  Announcement: "公告",
  FileArchive: "檔案室",
  Gallery: "相簿",
  PageManagement: "頁面",
  WebResource: "網路資源",
  // "": "",
  // Account: "",
  // Auth: "",
  // Banner: "",
  // Calendar: "",
  // Category: "",
  // FileManagement: "",
  // Person: "",
  // RolePermission: "",
  // SiteMenu: "",
  // SpecCategory: "",
  // SpecJournal: "",
  // SpecJournalIndex: "",
  // SpecMusical: "",
  // SpecOpenScheduleRule: "",
  // SpecResearch: "",
  // SpecUSR: "",
  // SystemAPI: "",
  // Tag: ""
};

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

interface ModuleSettingTabExtensionContext {
  theme: IBETheme;
  formData: UseFetchFormDataResult<SiteMenuSet>;
  selectedItemEdit: SiteMenuItem | null;
  setField: ReturnType<typeof useSetTableField<SiteMenuSet>>;
  modelKey: ModelKey;
  setModelKey: React.Dispatch<React.SetStateAction<ModelKey>>;
  moduleDisplayStyle: Record<string, string>;
  categorySets: CategorySet[];
  tagSets: TagSet[];
  pageMap: Record<string, string>;
}
export interface ModuleSettingTabExtension {
  moduleOptions?: Partial<Record<ModelKey, string>>;
  moduleRenderers?: Partial<Record<ModelKey, ModuleRenderFactory>>;
}
type ModuleRenderFactory = (
  ctx: ModuleSettingTabExtensionContext
) => ReactNode;

interface ModuleSettingTabProps {
  theme: IBETheme;
  selectedItemEdit: SiteMenuItem | null;
  modelKey: ModelKey;
  formData: UseFetchFormDataResult<SiteMenuSet>;
  setField: ReturnType<typeof useSetTableField<SiteMenuSet>>;
  setModelKey: React.Dispatch<React.SetStateAction<ModelKey>>;
  modulePageType: Record<string, string>;
  windowTarget: Record<string, string>;
  bannerDict: Record<string, string>;
  moduleDisplayStyle: Record<string, string>;
  categorySets: CategorySet[];
  tagSets: TagSet[];
  pageMap: Record<string, string>;
}


export const ModuleSettingTab = (prop: ModuleSettingTabProps) => {
  const siteIndex = prop.selectedItemEdit?.menuItem.SiteIndex;
  const rowId = prop.selectedItemEdit?.menuItem.RowId;
  const specExtension = useModuleSettingTabSpecExtension();
  const curRowKeys = useMemo(() => ({[SiteMenu_Item_ModuleFields.SiteIndex]: siteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: rowId}), [siteIndex, rowId]);
  useEffect(() => {
    if (!siteIndex || !rowId) return;
    prop.formData.setFormData((prev) => {
      const data = { ...(prev ?? {}) } as SiteMenuSet;
      const list = [...(data.SiteMenu_Item_Module ?? [])];
      const exists = list.some((r) => r.SiteIndex === siteIndex && r.ItemRowId === rowId,);
      if (exists) return prev;
      list.push({SiteIndex: siteIndex,ItemRowId: rowId,PageType: 0,ModuleProgId: "",} as SiteMenu_Item_Module);
      return { ...data, SiteMenu_Item_Module: list };
    });
  }, [siteIndex, rowId, prop.formData]);
  const moduleKeyBind = prop.setField(SiteMenuSetFields.SiteMenu_Item_Module,SiteMenu_Item_ModuleFields.ModuleProgId,"string",curRowKeys,);
  const moduleOpts = useMemo<Record<string, string>>(() => {return { ...BaseModuleOpts, ...(specExtension.moduleOptions??{}),};}, [specExtension.moduleOptions]);
  const extensionContext = useMemo<ModuleSettingTabExtensionContext>(() => {
    return {theme: prop.theme,formData: prop.formData,selectedItemEdit: prop.selectedItemEdit,
      setField: prop.setField,modelKey: prop.modelKey,setModelKey: prop.setModelKey,
      moduleDisplayStyle: prop.moduleDisplayStyle,categorySets: prop.categorySets,
      tagSets: prop.tagSets,pageMap: prop.pageMap,
    };
  }, [prop.theme,prop.formData,prop.selectedItemEdit,prop.setField,prop.modelKey,prop.setModelKey,prop.moduleDisplayStyle,prop.categorySets,prop.tagSets,prop.pageMap,]);
  const baseRendererMap = useMemo<Record<string, ModuleRenderFactory>>(() => {
    return {
      Announcement: (ctx) => (<Module_Announcement_Comp theme={ctx.theme} formData={ctx.formData} selectedItemEdit={ctx.selectedItemEdit} styleDict={ctx.moduleDisplayStyle} categorySets={ctx.categorySets} tagSets={ctx.tagSets} lang={DefaultLang}/>),
      PageManagement: (ctx) => (<Module_Pagemanagement_Comp theme={ctx.theme} formData={ctx.formData} selectedItemEdit={ctx.selectedItemEdit} pageMap={ctx.pageMap} lang={DefaultLang} />),
      Gallery: (ctx) => (<Module_Gallery_Comp theme={ctx.theme} formData={ctx.formData} selectedItemEdit={ctx.selectedItemEdit} styleDict={ctx.moduleDisplayStyle} categorySets={ctx.categorySets} tagSets={ctx.tagSets} lang={DefaultLang} />),
      FileArchive: (ctx) => (<Module_FileArchive_Comp theme={ctx.theme} formData={ctx.formData} selectedItemEdit={ctx.selectedItemEdit} styleDict={ctx.moduleDisplayStyle} categorySets={ctx.categorySets} tagSets={ctx.tagSets} lang={DefaultLang}/>),
      WebResource: (ctx) => (<Module_WebResource_Comp theme={ctx.theme} formData={ctx.formData} selectedItemEdit={ctx.selectedItemEdit} styleDict={ctx.moduleDisplayStyle} categorySets={ctx.categorySets} tagSets={ctx.tagSets} lang={DefaultLang} />),
    };
  }, []);
  const moduleRendererMap = useMemo<Record<string, ModuleRenderFactory>>(() => { return {...baseRendererMap, ...(specExtension.moduleRenderers ?? {}),};}, [baseRendererMap, specExtension.moduleRenderers]);
  const activeModelKey = useMemo<ModelKey>(() => {
    const bindValue = String(moduleKeyBind.InputValue ?? "") as ModelKey;
    return bindValue || prop.modelKey;
  }, [moduleKeyBind.InputValue, prop.modelKey]);
  const activeModuleNode = useMemo(() => {
    const renderer = moduleRendererMap[activeModelKey];
    if (!renderer) return null;
    return renderer(extensionContext);
  }, [activeModelKey, extensionContext, moduleRendererMap]);
  return (
    <>
        <LibSelectCard key="basic_Setting" ColDisplayName="基礎設定">
          <LibCheckBox Style={prop.theme.RadioBox} options={prop.modulePageType} {...prop.setField(SiteMenuSetFields.SiteMenu_Item_Module, SiteMenu_Item_ModuleFields.PageType, "number", curRowKeys,)}/>
          <Module_Banner_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={prop.selectedItemEdit} bannerDict={prop.bannerDict} />
          <LibDropList key="model" Style={prop.theme.DropList} Options={moduleOpts} ColumnDisplayName={moduleKeyBind.ColumnDisplayName} InputValue={moduleKeyBind.InputValue} AutoDefaultFirst={false} onChange={(v) => {moduleKeyBind.onChange?.(v); prop.setModelKey(v as ModelKey);}}/>
        </LibSelectCard>

        <LibSelectCard key="onlyOne" ColDisplayName="模型功能參數">
          {activeModuleNode}
        </LibSelectCard>
    </>
  );
}







const Module_Banner_Comp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: SiteMenuItem | null; bannerDict: Record<string, string> }): React.ReactNode[] => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.menuItem.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.menuItem.RowId }
  const setField = useSetTableField<SiteMenuSet>(prop.formData);
  return ([<LibDropList Style={prop.theme.DropList} Options={prop.bannerDict} AutoDefaultFirst={false} {...setField(SiteMenuSetFields.SiteMenu_Item_Module, SiteMenu_Item_ModuleFields.BannerId, "string", curRowKeys)} />])
}
const Module_Announcement_Comp = (prop: {theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: SiteMenuItem | null; styleDict: Record<string, string>;lang: Lang; categorySets: CategorySet[]; tagSets: TagSet[];}) => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.menuItem.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.menuItem.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(prop.formData, SiteMenuSetFields.SiteMenu_Item_Module, SiteMenu_Item_ModuleFields.ModuleOptions, curRowKeys, moduleOptionsDefaults);
  const catBind = binder.bind("Category", "csv");
  const tagBind = binder.bind("Tag", "csv");
  const styleBind = binder.bind("Style", "number");
  const {cateDic,tagDic} = useGetCategoryTagDict(PGID.Announcement,prop.lang,prop.categorySets,prop.tagSets)
  return (
    <>
      <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} />
      <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />
      <LibDropList Style={prop.theme.DropList} ColumnDisplayName="清單樣式" Options={prop.styleDict} InputValue={styleBind.value} onChange={styleBind.onChange} AutoDefaultFirst={false} />
    </>
  )
}
const Module_Pagemanagement_Comp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: SiteMenuItem | null; pageMap: Record<string,string>; lang: Lang }): React.ReactNode => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.menuItem.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.menuItem.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(prop.formData,SiteMenuSetFields.SiteMenu_Item_Module,SiteMenu_Item_ModuleFields.ModuleOptions,curRowKeys,moduleOptionsDefaults);
  const pageBind = binder.bind("PageId", "string");
  return <LibDropList Style={prop.theme.DropList} ColumnDisplayName="頁面選擇" Options={prop.pageMap} AutoDefaultFirst={false} InputValue={pageBind.value} onChange={pageBind.onChange} />
}
const Module_Gallery_Comp = (prop: {theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: SiteMenuItem | null; styleDict: Record<string, string>;lang: Lang; categorySets: CategorySet[]; tagSets: TagSet[];}): React.ReactNode => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.menuItem.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.menuItem.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(prop.formData,SiteMenuSetFields.SiteMenu_Item_Module,SiteMenu_Item_ModuleFields.ModuleOptions,curRowKeys,moduleOptionsDefaults);
  const catBind = binder.bind("Category", "csv");
  const tagBind = binder.bind("Tag", "csv");
  const styleBind = binder.bind("Style", "number");
  const {cateDic,tagDic} = useGetCategoryTagDict(PGID.Gallery,prop.lang,prop.categorySets,prop.tagSets)
  return <>
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} />
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />
    <LibDropList Style={prop.theme.DropList} ColumnDisplayName="清單樣式" Options={prop.styleDict} InputValue={styleBind.value} onChange={styleBind.onChange} AutoDefaultFirst={false} />
  </>
}
const Module_FileArchive_Comp = (prop: {theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: SiteMenuItem | null; styleDict: Record<string, string>;lang: Lang; categorySets: CategorySet[]; tagSets: TagSet[];}): React.ReactNode => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.menuItem.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.menuItem.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(prop.formData,SiteMenuSetFields.SiteMenu_Item_Module,SiteMenu_Item_ModuleFields.ModuleOptions,curRowKeys,moduleOptionsDefaults);
  const catBind = binder.bind("Category", "csv");
  const tagBind = binder.bind("Tag", "csv");
  const styleBind = binder.bind("Style", "number");
  const {cateDic,tagDic} = useGetCategoryTagDict(PGID.FileArchive,prop.lang,prop.categorySets,prop.tagSets)
  return <>
      <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} />
      <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />
      <LibDropList Style={prop.theme.DropList} ColumnDisplayName="清單樣式" Options={prop.styleDict} InputValue={styleBind.value} onChange={styleBind.onChange} AutoDefaultFirst={false} />
    </>
  
}
const Module_WebResource_Comp = (prop: {theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: SiteMenuItem | null; styleDict: Record<string, string>;lang: Lang; categorySets: CategorySet[]; tagSets: TagSet[];}): React.ReactNode => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.menuItem.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.menuItem.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(prop.formData,SiteMenuSetFields.SiteMenu_Item_Module,SiteMenu_Item_ModuleFields.ModuleOptions,curRowKeys,moduleOptionsDefaults);
  const catBind = binder.bind("Category", "csv");
  const tagBind = binder.bind("Tag", "csv");
  const styleBind = binder.bind("Style", "number");
  const {cateDic,tagDic} = useGetCategoryTagDict(PGID.WebResource,prop.lang,prop.categorySets,prop.tagSets)
  return <>
      <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} />
      <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />
      <LibDropList Style={prop.theme.DropList} ColumnDisplayName="清單樣式" Options={prop.styleDict} InputValue={styleBind.value} onChange={styleBind.onChange} AutoDefaultFirst={false} />
    </>
  
}

const useGetCategoryTagDict=(progId:PGID,lang:Lang,categorySets:CategorySet[],tagSets:TagSet[])=>{
  const cateDic = useMemo<Record<string, string>>(() => {
      const src = categorySets.filter(p=>p.Category?.ProgId===progId) ?? [];
      return src.reduce<Record<string, string>>((acc, item: CategorySet) => {
      const key = item.Category?.CategoryId?.toString?.();
      if (!key) return acc;
      acc[key] = item.CategoryDetail?.find(p=>p.Lang===lang)?.CategoryName ?? "";
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

//#endregion