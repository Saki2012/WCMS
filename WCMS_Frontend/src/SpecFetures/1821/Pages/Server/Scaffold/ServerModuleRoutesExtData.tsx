import type { IModuleMeta, IProgMeta } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import { PGID } from "@/types/SchemaFields";
import { Server_HomePage1821_Form_Comp } from "../BizFunc/WEB/HomePageSetting/Server_HomePageSetting_Form_Comp";

// #region Property
interface PermissionCatalogProgLike
{
    ProgId: string;
    ProgTitle: string;
    SupportMask: number;
}

interface PermissionCatalogModuleLike
{
    ModuleCode: string;
    ModuleTitle: string;
    Progs: PermissionCatalogProgLike[];
}

const HomePageSettingProgId = PGID.SpecHomePageApi;
const HiddenModuleCodeSet = new Set<string>(["MAT"]);
const HiddenWebProgIdSet = new Set<string>([PGID.Timeline, PGID.Survey]);
const HiddenPermissionProgIdSet = new Set<string>([
    PGID.Timeline,
    PGID.Survey,
    PGID.SurveySubmission,
]);
// #endregion

// #region Public
/** 1821 後台路由擴充：隱藏未開放功能並加入招生首頁設定。 */
export const extendServerModuleRoutes = (modules: IModuleMeta[]): IModuleMeta[] =>
{
    // 宣告變數
    const nextModules = cloneModules(modules);

    // 執行 function
    const visibleModules = filterHiddenModules(nextModules);
    filterHiddenWebProgs(visibleModules);
    appendHomePageSettingProg(visibleModules);

    // return
    return visibleModules;
};

/** 讓角色維護的權限目錄同步套用 1821 後台功能顯示規則。 */
export const filterRolePermissionCatalog = (
    modules: PermissionCatalogModuleLike[],
): PermissionCatalogModuleLike[] =>
{
    // 宣告變數
    const visibleModules = modules
        .filter(module => !HiddenModuleCodeSet.has(module.ModuleCode))
        .map(filterPermissionModuleProgs);

    // 執行 function / return
    return visibleModules.filter(module => module.Progs.length > 0);
};
// #endregion

// #region Private
/** 複製 Module 與 Prog 陣列，避免直接修改 Feature 共用設定。 */
const cloneModules = (modules: IModuleMeta[]): IModuleMeta[] =>
{
    return modules.map(module => ({
        ...module,
        Progs: [...module.Progs],
    }));
};

/** 移除 1821 不開放的完整後台模組。 */
const filterHiddenModules = (modules: IModuleMeta[]): IModuleMeta[] =>
{
    return modules.filter(module => !HiddenModuleCodeSet.has(module.ModuleCode));
};

/** 移除網站功能管理中不開放的 Timeline 與 Survey。 */
const filterHiddenWebProgs = (modules: IModuleMeta[]): void =>
{
    const web = modules.find(module => module.ModuleCode === "WebManagement");
    if (!web) return;

    web.Progs = web.Progs.filter(prog => !HiddenWebProgIdSet.has(prog.ProgId));
};

/** 將角色權限模組中的未開放功能移除。 */
const filterPermissionModuleProgs = (
    module: PermissionCatalogModuleLike,
): PermissionCatalogModuleLike =>
{
    return {
        ...module,
        Progs: module.Progs.filter(prog => !HiddenPermissionProgIdSet.has(prog.ProgId)),
    };
};

/** 將 1821 招生首頁設定加入網站功能管理。 */
const appendHomePageSettingProg = (modules: IModuleMeta[]): void =>
{
    const web = modules.find(module => module.ModuleCode === "WebManagement");
    if (!web || web.Progs.some(prog => prog.ProgId === HomePageSettingProgId)) return;

    web.Progs.unshift(buildHomePageSettingProg());
};

/** 建立 1821 招生首頁設定功能資料。 */
const buildHomePageSettingProg = (): IProgMeta =>
{
    return {
        ProgId: HomePageSettingProgId,
        Title: "招生首頁設定",
        DefaultActionCode: "Form",
        IconClassName: "fas fa-home",
        Actions: [{
            ActionCode: "Form",
            Title: "招生首頁設定",
            RoutePath: "Form",
            elementFactory: ctx => <Server_HomePage1821_Form_Comp theme={ctx.theme} lang={ctx.lang} />,
        }],
    };
};
// #endregion
