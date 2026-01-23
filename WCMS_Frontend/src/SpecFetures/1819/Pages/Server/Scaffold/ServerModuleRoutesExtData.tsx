import type { IModuleMeta } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import { SpecPGID } from "@/SpecFetures/1819/Hooks/Common/SpecProgId";
import { Server_SpecJournalIndex_List_Comp } from "@/SpecFetures/1819/Pages/Server/BizFunc/SpecModule/SpecJournalIndex/Server_SpecJournalIndex_List_Comp";
import { Server_SpecJournalIndex_Form_Comp } from "@/SpecFetures/1819/Pages/Server/BizFunc/SpecModule/SpecJournalIndex/Server_SpecJournalIndex_Form_Comp";
import { TagListFormComp } from "@/Features/Pages/Server/BizFunc/WebManagement/Tags/Server_Tag_ListForm_Comp";
import { Server_SpecJournal_List_Comp } from "@/SpecFetures/1819/Pages/Server/BizFunc/SpecModule/SpecJournal/Server_SpecJournal_List_Comp";
import { Server_SpecJournal_Form_Comp } from "@/SpecFetures/1819/Pages/Server/BizFunc/SpecModule/SpecJournal/Server_SpecJournal_Form_Comp";

const extendServerModuleRoutes = (modules: IModuleMeta[]): IModuleMeta[] => {
    const web = modules.find((m) => m.ModuleCode === "WebManagement");
    if (!web) return modules;
    const exists = web.Progs.some((p) => p.ProgId === SpecPGID.SpecJournalIndex);
    if (exists) return modules;
    web.Progs.push(
        {
            ProgId: SpecPGID.SpecJournalIndex, Title: "期刊目次", DefaultActionCode: "List", IconClassName: "fas fa-stream",
            Actions: [
                {
                    ActionCode: "List", Title: "期刊目次列表", RoutePath: "List",
                    elementFactory: (ctx) => <Server_SpecJournalIndex_List_Comp title="期刊目次列表" theme={ctx.theme} lang={ctx.lang} />
                },
                {
                    ActionCode: "Form", Title: "新增資料", RoutePath: "Form/:internalId?",
                    elementFactory: (ctx) => <Server_SpecJournalIndex_Form_Comp theme={ctx.theme} lang={ctx.lang} />
                },
            ],
        },
        {
            ProgId: SpecPGID.SpecJournal, Title: "期刊", DefaultActionCode: "List", IconClassName: "fas fa-newspaper",
            Actions: [
                {
                    ActionCode: "List", Title: "期刊列表", RoutePath: "List",
                    elementFactory: (ctx) => <Server_SpecJournal_List_Comp title="期刊列表" theme={ctx.theme} lang={ctx.lang} />
                },
                {
                    ActionCode: "Form", Title: "新增期刊", RoutePath: "Form/:internalId?",
                    elementFactory: (ctx) => <Server_SpecJournal_Form_Comp theme={ctx.theme} lang={ctx.lang} />
                },
                {
                    ActionCode: "Tag", Title: "期刊類型", RoutePath: "Tag/:internalId?",
                    elementFactory: (ctx) => <TagListFormComp progId={SpecPGID.SpecJournal} title="期刊類型" theme={ctx.theme} lang={ctx.lang} />,
                },
            ],
        },
    );
    return modules;
};

export default extendServerModuleRoutes;
