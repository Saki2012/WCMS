import type { IModuleMeta, IProgMeta } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import { PGID } from "@/types/SchemaFields";
import { Server_HomePage1821_Form_Comp } from "../BizFunc/WEB/HomePageSetting/Server_HomePageSetting_Form_Comp";

// #region Private
const HomePageSettingProgId = PGID.SpecHomePageApi;

export const extendServerModuleRoutes = (modules: IModuleMeta[]): IModuleMeta[] =>
{
    const web = modules.find((m) => m.ModuleCode === "WebManagement");
    if (!web) return modules;

    const exists = web.Progs.some((p) => p.ProgId === HomePageSettingProgId);
    if (exists) return modules;

    const homePageProg: IProgMeta = {
        ProgId: HomePageSettingProgId,
        Title: "招生首頁設定",
        DefaultActionCode: "Form",
        IconClassName: "fas fa-home",
        Actions: [{
            ActionCode: "Form",
            Title: "招生首頁設定",
            RoutePath: "Form",
            elementFactory: (ctx) => <Server_HomePage1821_Form_Comp theme={ctx.theme} lang={ctx.lang} />,
        }],
    };

    web.Progs.unshift(homePageProg);
    return modules;
};
// #endregion
