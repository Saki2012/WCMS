import type { ModuleSettingTabExtension } from "@/Features/Pages/Server/BizFunc/WEB/SiteMenu/SubComponents/RightBox_Comp.tsx/Module_Comp";
import { DefaultLang } from "@/SysCore/i18n/lang";
import { Module_SpecProduction_Comp } from "./SpecModule_Comp";

// #region Public
export const useModuleSettingTabSpecExtension = (): ModuleSettingTabExtension =>
{
    return {
        moduleOptions: { SpecProductionList: "情境圖文導覽" },
        moduleRenderers: {
            SpecProductionList: (ctx) => (
                <Module_SpecProduction_Comp
                    theme={ctx.theme}
                    formData={ctx.formData}
                    selectedItemEdit={ctx.selectedItemEdit}
                    lang={DefaultLang}
                    categorySets={ctx.categorySets}
                    tagSets={ctx.tagSets}
                    pageSets={ctx.pageSets}
                />
            ),
        },
    };
};
// #endregion
