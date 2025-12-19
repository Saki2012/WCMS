import type { IModuleMeta, IProgMeta } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import { SpecPGID } from "@/SpecFetures/1817/Hooks/Common/SpecProgId";
import { Server_SpecMusical_List_Comp } from "../BizFunc/SpecModule/SpecMusical/Server_SpecMusical_List_Comp";
import { Server_SpecMusical_Form_Comp } from "../BizFunc/SpecModule/SpecMusical/Server_SpecMusical_Form_Comp";
import { Server_CategoryListFormComp } from "@/Features/Pages/Server/BizFunc/WebManagement/Category/Category_ListForm_Comp";

const extendServerModuleRoutes = (modules: IModuleMeta[]): IModuleMeta[] => {
    const web = modules.find((m) => m.ModuleCode === "WebManagement");
    if (!web) return modules;
    const exists = web.Progs.some((p) => p.ProgId === SpecPGID.SpecMusical);
    if (exists) return modules;
    const prog: IProgMeta = {
        ProgId: SpecPGID.SpecMusical, Title: "琵琶介紹", DefaultActionCode: "List", IconClassName: "fas fa-music",
        Actions: [
            {
                ActionCode: "List", Title: "琵琶列表", RoutePath: "List",
                elementFactory: (ctx) => <Server_SpecMusical_List_Comp title="琵琶介紹列表" theme={ctx.theme} lang={ctx.lang} />
            },
            {
                ActionCode: "Form", Title: "新增資料", RoutePath: "Form/:internalId?",
                elementFactory: (ctx) => <Server_SpecMusical_Form_Comp theme={ctx.theme} lang={ctx.lang} />
            },
            {
                ActionCode: "Category", Title: "類別", RoutePath: "Category/:internalId?",
                elementFactory: (ctx) => <Server_CategoryListFormComp progId={SpecPGID.SpecMusical} title="類別" theme={ctx.theme} lang={ctx.lang} />
            },
        ],
    };
    web.Progs.push(prog);
    return modules;
};

export default extendServerModuleRoutes;
