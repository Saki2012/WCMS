import type { ModuleSettingTabExtension } from "@/Features/Pages/Server/BizFunc/WEB/SiteMenu/SubComponents/RightBox_Comp.tsx/Module_Comp";
import { DefaultLang } from "@/SysCore/i18n/lang";
import { Module_SpecMusical_Comp } from "./SpecModule_Comp";

// #region Public
export const useModuleSettingTabSpecExtension = (): ModuleSettingTabExtension =>
{
    // 宣告變數

    // return
    return {
        moduleOptions: { SpecMusical: "琵琶介紹" },
        moduleRenderers: {
            SpecMusical: (ctx) => (
                <Module_SpecMusical_Comp
                    theme={ctx.theme}
                    formData={ctx.formData}
                    selectedItemEdit={ctx.selectedItemEdit}
                    styleDict={ctx.moduleDisplayStyle}
                    lang={DefaultLang}
                    categorySets={ctx.categorySets}
                />
            ),
        },
    };
};
// #endregion
