import type { ModuleSettingTabExtension } from "@/Features/Pages/Server/BizFunc/Dashboard/SiteMenu/SubComponents/RightBox_Comp.tsx/Module_Comp";

export const useModuleSettingTabSpecExtension = (): ModuleSettingTabExtension =>
{
    // 宣告變數

    // return
    return {
        moduleOptions: { SpecJournal: "期刊" },
        moduleRenderers: {
            // SpecResearch: (ctx) => (<Module_SpecResearch_Comp theme={ctx.theme} formData={ctx.formData} selectedItemEdit={ctx.selectedItemEdit} styleDict={ctx.moduleDisplayStyle} lang={DefaultLang} categoryDatas={specResearchCategory.data} tagSets={specResearchTag.data} />),
        },
    };
};
