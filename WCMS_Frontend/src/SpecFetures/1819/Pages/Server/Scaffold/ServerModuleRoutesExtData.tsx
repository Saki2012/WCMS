import { Server_Tag_ListForm_Comp } from "@/Features/Pages/Server/BizFunc/COMM/Tags/Server_Tag_ListForm_Comp";
import type { IModuleMeta } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import { Server_SpecJournal_Form_Comp } from "@/SpecFetures/1819/Pages/Server/BizFunc/WEB/SpecJournal/Server_SpecJournal_Form_Comp";
import { Server_SpecJournal_List_Comp } from "@/SpecFetures/1819/Pages/Server/BizFunc/WEB/SpecJournal/Server_SpecJournal_List_Comp";
import { Server_SpecJournalIndex_Form_Comp } from "@/SpecFetures/1819/Pages/Server/BizFunc/WEB/SpecJournalIndex/Server_SpecJournalIndex_Form_Comp";
import { Server_SpecJournalIndex_List_Comp } from "@/SpecFetures/1819/Pages/Server/BizFunc/WEB/SpecJournalIndex/Server_SpecJournalIndex_List_Comp";
import { PGID } from "@/types/SchemaFields";

const extendServerModuleRoutes = (modules: IModuleMeta[]): IModuleMeta[] =>
{
    const web = modules.find((m) => m.ModuleCode === "WebManagement");
    if (!web) return modules;
    const exists = web.Progs.some((p) => p.ProgId === PGID.SpecJournalIndex);
    if (exists) return modules;
    web.Progs.push(
        {
            ProgId: PGID.SpecJournalIndex,
            Title: "期刊目次",
            DefaultActionCode: "List",
            IconClassName: "fas fa-stream",
            Actions: [
                {
                    ActionCode: "List",
                    Title: "期刊目次列表",
                    RoutePath: "List",
                    elementFactory: (ctx) => (
                        <Server_SpecJournalIndex_List_Comp title="期刊目次列表" theme={ctx.theme} lang={ctx.lang} />
                    ),
                },
                {
                    ActionCode: "Form",
                    Title: "新增資料",
                    RoutePath: "Form/:internalId?",
                    elementFactory: (ctx) => <Server_SpecJournalIndex_Form_Comp theme={ctx.theme} lang={ctx.lang} />,
                },
            ],
        },
        {
            ProgId: PGID.SpecJournal,
            Title: "預刊本",
            DefaultActionCode: "Preprint/List",
            IconClassName: "fas fa-newspaper",
            Actions: [
                {
                    ActionCode: "Preprint/List",
                    Title: "預刊本列表",
                    RoutePath: "Preprint/List",
                    elementFactory: (ctx) => (
                        <Server_SpecJournal_List_Comp
                            title="預刊本列表"
                            theme={ctx.theme}
                            lang={ctx.lang}
                            mode="preprint"
                        />
                    ),
                },
                {
                    ActionCode: "Preprint/Form",
                    Title: "新增預刊本",
                    RoutePath: "Preprint/Form/:internalId?",
                    elementFactory: (ctx) => (
                        <Server_SpecJournal_Form_Comp theme={ctx.theme} lang={ctx.lang} mode="preprint" />
                    ),
                },
                {
                    ActionCode: "Tag",
                    Title: "期刊類型",
                    RoutePath: "Preprint/Tag/:internalId?",
                    elementFactory: (ctx) => (
                        <Server_Tag_ListForm_Comp
                            progId={PGID.SpecJournal}
                            title="期刊類型"
                            theme={ctx.theme}
                            lang={ctx.lang}
                        />
                    ),
                },
            ],
        },
        {
            ProgId: PGID.SpecJournal,
            Title: "期刊",
            DefaultActionCode: "List",
            IconClassName: "fas fa-newspaper",
            Actions: [
                {
                    ActionCode: "List",
                    Title: "期刊列表",
                    RoutePath: "List",
                    elementFactory: (ctx) => (
                        <Server_SpecJournal_List_Comp
                            title="期刊列表"
                            theme={ctx.theme}
                            lang={ctx.lang}
                            mode="journal"
                        />
                    ),
                },
                {
                    ActionCode: "Form",
                    Title: "新增期刊",
                    RoutePath: "Form/:internalId?",
                    elementFactory: (ctx) => (
                        <Server_SpecJournal_Form_Comp theme={ctx.theme} lang={ctx.lang} mode="journal" />
                    ),
                },
                {
                    ActionCode: "Tag",
                    Title: "期刊類型",
                    RoutePath: "Tag/:internalId?",
                    elementFactory: (ctx) => (
                        <Server_Tag_ListForm_Comp
                            progId={PGID.SpecJournal}
                            title="期刊類型"
                            theme={ctx.theme}
                            lang={ctx.lang}
                        />
                    ),
                },
            ],
        },
    );
    return modules;
};

export default extendServerModuleRoutes;
