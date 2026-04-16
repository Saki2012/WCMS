import type { ModuleSettingTabExtension } from "@/Features/Pages/Server/BizFunc/WEB/SiteMenu/SubComponents/RightBox_Comp.tsx/Module_Comp";
import { useMemo } from "react";

/** 1810 SiteMenu 模型擴充入口 */
export const useModuleSettingTabSpecExtension = (): ModuleSettingTabExtension =>
{
    // 宣告變數
    const extension = useMemo<ModuleSettingTabExtension>(() =>
    {
        return {
            moduleOptions: {
                SpecResearch: "研究成果",
                SpecUSR: "USR",
            },
            moduleRenderers: {},
        };
    }, []);
    // return
    return extension;
};
