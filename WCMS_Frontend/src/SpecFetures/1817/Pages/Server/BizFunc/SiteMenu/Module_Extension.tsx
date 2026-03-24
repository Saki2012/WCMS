import { DefaultLang } from "@/SysCore/i18n/lang";

import type { ModuleSettingTabExtension } from "@/Features/Pages/Server/BizFunc/Dashboard/SiteMenu/SubComponents/RightBox_Comp.tsx/Module_Comp";
import { Module_SpecMusical_Comp} from "./SpecModule_Comp";


export const useModuleSettingTabSpecExtension = (): ModuleSettingTabExtension => {
  // 宣告變數

  // return
  return {
    moduleOptions: {SpecMusical: "琵琶介紹",},
    moduleRenderers: {
      SpecMusical: (ctx) => (<Module_SpecMusical_Comp theme={ctx.theme} formData={ctx.formData} selectedItemEdit={ctx.selectedItemEdit} styleDict={ctx.moduleDisplayStyle} lang={DefaultLang} categorySets={ctx.categorySets}/>
      ),
    },
  };
};