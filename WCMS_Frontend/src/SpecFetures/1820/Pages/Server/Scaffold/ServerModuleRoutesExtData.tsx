import type { IModuleMeta, IProgMeta } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import { PGID } from "@/types/SchemaFields";
import { Server_HomePage1820_Form_Comp } from "../BizFunc/WEB/HomePageSetting/Server_HomePageSetting_Form_Comp";

// #region Private
export const extendServerModuleRoutes = (modules: IModuleMeta[]): IModuleMeta[] =>
{
    const web = modules.find((m) => m.ModuleCode === "WebManagement");
    if (!web) return modules;
    const exists = web.Progs.some((p) => p.ProgId === PGID.SpecHomePageApi);
    if (exists) return modules;
    const homePageProg: IProgMeta = {
        ProgId: PGID.SpecHomePageApi,
        Title: "首頁設定",
        DefaultActionCode: "Form",
        IconClassName: "fas fa-home",
        Actions: [{
            ActionCode: "Form",
            Title: "首頁設定",
            RoutePath: "Form",
            elementFactory: (ctx) => <Server_HomePage1820_Form_Comp theme={ctx.theme} lang={ctx.lang} />,
        }],
    };
    // 建立首頁設定 prog
    // const prog: IProgMeta = {
    //     ProgId: PGID.SpecHomePageApi,
    //     Title: "",
    //     DefaultActionCode: "Form",
    //     IconClassName: "fas fa-music",
    //     Actions: [
    //         {
    //             ActionCode: "Form",
    //             Title: "",
    //             RoutePath: "Form",
    //             elementFactory: (ctx) => <Server_HomePage1820_Form_Comp theme={ctx.theme} lang={ctx.lang} />,
    //         },
    //     ],
    // };
    // 插到最前面，讓首頁設定固定在最上方
    web.Progs.unshift(homePageProg);
    // web.Progs.push(prog);
    return modules;
};
// #endregion
