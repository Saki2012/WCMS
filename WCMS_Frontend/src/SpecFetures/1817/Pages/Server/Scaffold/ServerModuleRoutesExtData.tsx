import { Server_CategoryListFormComp } from "@/Features/Pages/Server/BizFunc/COMM/Category/Server_Category_ListForm_Comp";
import type { IModuleMeta, IProgMeta } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import { PGID } from "@/types/SchemaFields";
import { Server_SpecMusical_Form_Comp } from "../BizFunc/WEB/SpecMusical/Server_SpecMusical_Form_Comp";
import { Server_SpecMusical_List_Comp } from "../BizFunc/WEB/SpecMusical/Server_SpecMusical_List_Comp";

// #region Private
const extendServerModuleRoutes = (modules: IModuleMeta[]): IModuleMeta[] =>
{
    const web = modules.find((m) => m.ModuleCode === "WebManagement");
    if (!web) return modules;
    const exists = web.Progs.some((p) => p.ProgId === PGID.SpecMusical);
    if (exists) return modules;
    const prog: IProgMeta = {
        ProgId: PGID.SpecMusical,
        Title: "琵琶介紹",
        DefaultActionCode: "List",
        IconClassName: "fas fa-music",
        Actions: [{
            ActionCode: "List",
            Title: "琵琶列表",
            RoutePath: "List",
            elementFactory: (ctx) => <Server_SpecMusical_List_Comp title="琵琶介紹列表" theme={ctx.theme} lang={ctx.lang} />,
        }, {
            ActionCode: "Form",
            Title: "新增資料",
            RoutePath: "Form/:internalId?",
            elementFactory: (ctx) => <Server_SpecMusical_Form_Comp theme={ctx.theme} lang={ctx.lang} />,
        }, {
            ActionCode: "Category",
            Title: "類別",
            RoutePath: "Category/:internalId?",
            elementFactory: (ctx) => <Server_CategoryListFormComp progId={PGID.SpecMusical} title="類別" theme={ctx.theme} lang={ctx.lang} />,
        }],
    };
    web.Progs.push(prog);
    return modules;
};


export default extendServerModuleRoutes;
// #endregion
