import type { IModuleMeta, IProgMeta } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import { SpecPGID } from "@/SpecFetures/1810/Hooks/Common/SpecProgId";
import { Server_ResearchProjListComp } from "@/SpecFetures/1810/Pages/Server/BizFunc/SpecModule/SpecResearch/Server_SpecResearch_List_Comp";
import { Server_ResearchProjFormComp } from "../BizFunc/SpecModule/SpecResearch/Server_SpecResearch_Form_Comp";
import { Server_SpecCategoryListFormComp } from "../BizFunc/SpecModule/SpecCategory/Server_SpecCategory_ListForm_Comp";
import { TagListFormComp } from "@/Features/Pages/Server/BizFunc/WebManagement/Tags/Server_Tag_ListForm_Comp";
import { Server_USRProjFormComp } from "../BizFunc/SpecModule/SpecUSR/Server_SpecUSR_Form_Comp";
import { Server_SpecUSR_List_Comp } from "../BizFunc/SpecModule/SpecUSR/Server_SpecUSR_List_Comp";

const extendServerModuleRoutes = (modules: IModuleMeta[]): IModuleMeta[] => {
    const web = modules.find((m) => m.ModuleCode === "WebManagement");
    if (!web) return modules;
    const exists = web.Progs.some((p) => p.ProgId === SpecPGID.SpecUSR);
    if (exists) return modules;

    const prog: IProgMeta[] = [
        {
            ProgId: SpecPGID.SpecResearch, Title: "研究計畫", DefaultActionCode: "List", IconClassName: "fas fa-search",
            Actions: [
                {
                    ActionCode: "List", Title: "研究計畫列表", RoutePath: "List",
                    elementFactory: (ctx) => <Server_ResearchProjListComp title="研究計劃列表" theme={ctx.theme} lang={ctx.lang} />,
                },
                {
                    ActionCode: "Form", Title: "研究計畫維護", RoutePath: "Form/:internalId?",
                    elementFactory: (ctx) => <Server_ResearchProjFormComp theme={ctx.theme} lang={ctx.lang} />,
                },
                {
                    ActionCode: SpecPGID.SpecCategory, Title: "研究計畫類別", RoutePath: `${SpecPGID.SpecCategory}/:internalId?`,
                    elementFactory: (ctx) => <Server_SpecCategoryListFormComp progId={SpecPGID.SpecResearch} title="類別" theme={ctx.theme} lang={ctx.lang} />,
                },
                {
                    ActionCode: "Tag", Title: "研究計畫標籤", RoutePath: "Tag/:internalId?",
                    elementFactory: (ctx) => <TagListFormComp progId={SpecPGID.SpecResearch} title="標籤" theme={ctx.theme} lang={ctx.lang} />,
                },
            ],
        },
        {
            ProgId: SpecPGID.SpecUSR, Title: "USR", DefaultActionCode: "List", IconClassName: "fas fa-university",
            Actions: [
                {
                    ActionCode: "List", Title: "研究計畫列表", RoutePath: "List",
                    elementFactory: (ctx) => <Server_SpecUSR_List_Comp title="研究計劃列表" theme={ctx.theme} lang={ctx.lang} />,
                },
                {
                    ActionCode: "Form", Title: "研究計畫維護", RoutePath: "Form/:internalId?",
                    elementFactory: (ctx) => <Server_USRProjFormComp theme={ctx.theme} lang={ctx.lang} />,
                },
                {
                    ActionCode: SpecPGID.SpecCategory, Title: "研究計畫類別", RoutePath: `${SpecPGID.SpecCategory}/:internalId?`,
                    elementFactory: (ctx) => <Server_SpecCategoryListFormComp progId={SpecPGID.SpecUSR} title="類別" theme={ctx.theme} lang={ctx.lang} />,
                },
                {
                    ActionCode: "Tag", Title: "研究計畫標籤", RoutePath: "Tag/:internalId?",
                    elementFactory: (ctx) => <TagListFormComp progId={SpecPGID.SpecUSR} title="標籤" theme={ctx.theme} lang={ctx.lang} />,
                },
            ],
        },
    ];

    web.Progs.push(...prog);
    return modules;
};

export default extendServerModuleRoutes;
