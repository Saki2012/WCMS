import { useMemo } from "react";
import type { ModuleSettingTabExtension } from "@/Features/Pages/Server/BizFunc/Dashboard/SiteMenu/SubComponents/RightBox_Comp.tsx/Module_Comp";

/** 1810 SiteMenu 模型擴充入口 */
export const useModuleSettingTabSpecExtension = (): ModuleSettingTabExtension => {
  // 宣告變數
  const extension = useMemo<ModuleSettingTabExtension>(() => {
    return {
      moduleOptions: {
        SpecResearch: "研究成果",
        SpecUSR: "USR",
        SpecMusical: "音樂專區",
      },
      moduleRenderers: {},
    };
  }, []);

  // return
  return extension;
};