import type { IModuleMeta, IProgMeta } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import { SpecPGID } from "@/SpecFetures/1816/Hooks/Common/SpecProgId";
import { Server_ScheduleRule_Form_Comp } from "../BizFunc/SystemSetting/SpecOpenScheduleRule/Server_ScheduleRule_Form_Comp";
import { Server_ScheduleRule_List_Comp } from "../BizFunc/SystemSetting/SpecOpenScheduleRule/Server_ScheduleRule_List_Comp";

const extendServerModuleRoutes = (modules: IModuleMeta[]): IModuleMeta[] => {
    const web = modules.find((m) => m.ModuleCode === "WebManagement");
    if (!web) return modules;
    const exists = web.Progs.some((p) => p.ProgId === SpecPGID.SpecOpenScheduleRule);
    if (exists) return modules;

    const prog: IProgMeta =
    // 開館時間規則設定(Spec)
    {
        ProgId: SpecPGID.SpecOpenScheduleRule,
        Title: "開館時間規則設定",
        DefaultActionCode: "List",
        IconClassName: "fas fa-university",
        Actions: [
            {
                ActionCode: "List", Title: "列表", RoutePath: "List",
                elementFactory: (ctx) => <Server_ScheduleRule_List_Comp title="萬年曆" theme={ctx.theme} />
            },
            {
                ActionCode: "Form", Title: "新增規則", RoutePath: "Form/:internalId?",
                elementFactory: (ctx) => <Server_ScheduleRule_Form_Comp theme={ctx.theme} lang={ctx.lang} />,
            },

        ],
    };

    web.Progs.push(prog);
    return modules;
};

export default extendServerModuleRoutes;
