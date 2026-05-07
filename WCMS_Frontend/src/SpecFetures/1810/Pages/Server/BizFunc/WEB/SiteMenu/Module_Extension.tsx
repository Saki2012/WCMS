import type { ModuleSettingTabExtension } from "@/Features/Pages/Server/BizFunc/WEB/SiteMenu/SubComponents/RightBox_Comp.tsx/Module_Comp";
import { DefaultLang } from "@/SysCore/i18n/lang";
import { PGID } from "@/types/SchemaFields";
import { Module_SpecResearch_Comp, Module_SpecUSR_Comp } from "./SpecModule_Comp";

const MODULE_ALLOW_KEYS: readonly string[] = [
    PGID.Announcement,
    PGID.FileArchive,
    PGID.Gallery,
    PGID.PageManagement,
    PGID.WebResource,
    PGID.SpecResearch,
    PGID.SpecUSR,
];

/** 1810 網站導覽模型功能擴充 */
export const useModuleSettingTabSpecExtension = (): ModuleSettingTabExtension =>
{
    // return
    return {
        moduleAllowKeys: MODULE_ALLOW_KEYS,
        moduleOptions: { [PGID.SpecResearch]: "研究計畫", [PGID.SpecUSR]: "計畫成果" },
        moduleRenderers: {
            [PGID.SpecResearch]: (ctx) => (
                <Module_SpecResearch_Comp
                    theme={ctx.theme}
                    formData={ctx.formData}
                    selectedItemEdit={ctx.selectedItemEdit}
                    lang={DefaultLang}
                    tagSets={ctx.tagSets}
                />
            ),
            [PGID.SpecUSR]: (ctx) => (
                <Module_SpecUSR_Comp
                    theme={ctx.theme}
                    formData={ctx.formData}
                    selectedItemEdit={ctx.selectedItemEdit}
                    lang={DefaultLang}
                    tagSets={ctx.tagSets}
                />
            ),
        },
    };
};
