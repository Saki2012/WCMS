import { useMemo } from "react";
import { DefaultLang } from "@/SysCore/i18n/lang";
import { PGID } from "@/types/SchemaFields";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tag_Api";
import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Api";
import type { ModuleSettingTabExtension } from "@/Features/Pages/Server/BizFunc/Dashboard/SiteMenu/SubComponents/RightBox_Comp.tsx/Module_Comp";
import { Module_SpecMusical_Comp, Module_SpecResearch_Comp, Module_SpecUSR_Comp } from "./SpecModule_Comp";


export const useModuleSettingTabSpecExtension = (): ModuleSettingTabExtension => {
  // 宣告變數
  const specCategoryAdapter = useMemo(() => SpecCategoryAdapter(), []);
  const tagAdapter = useMemo(() => TagAdapter(), []);
  const specResearchCategory = specCategoryAdapter.hooks.useMapByProgId({progId: PGID.SpecResearch,lang: DefaultLang,});
  const specUsrCategory = specCategoryAdapter.hooks.useMapByProgId({progId: PGID.SpecUSR,lang: DefaultLang,});
  const specResearchTag = tagAdapter.hooks.useMapByProgId({progId: PGID.SpecResearch,lang: DefaultLang,});
  const specUsrTag = tagAdapter.hooks.useMapByProgId({progId: PGID.SpecUSR,lang: DefaultLang,});
  // return
  return {
    moduleOptions: {SpecResearch: "研究成果",SpecUSR: "USR",SpecMusical: "音樂專區",},
    moduleRenderers: {
      SpecResearch: (ctx) => (<Module_SpecResearch_Comp theme={ctx.theme} formData={ctx.formData} selectedItemEdit={ctx.selectedItemEdit} styleDict={ctx.moduleDisplayStyle} lang={DefaultLang} categoryDatas={specResearchCategory.data} tagSets={specResearchTag.data} />),
      SpecUSR: (ctx) => (<Module_SpecUSR_Comp theme={ctx.theme} formData={ctx.formData} selectedItemEdit={ctx.selectedItemEdit} styleDict={ctx.moduleDisplayStyle} lang={DefaultLang} categoryDatas={specUsrCategory.data} tagSets={specUsrTag.data}/>),
      SpecMusical: (ctx) => (<Module_SpecMusical_Comp theme={ctx.theme} formData={ctx.formData} selectedItemEdit={ctx.selectedItemEdit} styleDict={ctx.moduleDisplayStyle} lang={DefaultLang} categorySets={ctx.categorySets}/>
      ),
    },
  };
};