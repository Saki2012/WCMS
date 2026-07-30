import type { ModuleSettingTabExtension } from "@/Features/Pages/Server/BizFunc/WEB/SiteMenu/SubComponents/RightBox/Module_Comp";
import { PGID } from "@/types/SchemaFields";

// #region Property
const MODULE_ALLOW_KEYS: readonly PGID[] = [
    PGID.Announcement,
    PGID.FileArchive,
    PGID.Gallery,
    PGID.PageManagement,
    PGID.WebResource,
];
// #endregion

// #region Public
export const useModuleSettingTabSpecExtension = (): ModuleSettingTabExtension =>
{
    // return
    return {
        moduleAllowKeys: MODULE_ALLOW_KEYS,
    };
};
// #endregion
