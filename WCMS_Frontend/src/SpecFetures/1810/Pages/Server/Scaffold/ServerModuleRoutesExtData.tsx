import { Server_Tag_ListForm_Comp } from "@/Features/Pages/Server/BizFunc/COMM/Tags/Server_Tag_ListForm_Comp";
import type { IModuleMeta, IProgMeta } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import { Server_ResearchProjListComp } from "@/SpecFetures/1810/Pages/Server/BizFunc/WEB/SpecResearch/Server_SpecResearch_List_Comp";
import { PGID } from "@/types/SchemaFields";
import { Server_SpecCategoryListFormComp } from "../BizFunc/WEB/SpecCategory/Server_SpecCategory_ListForm_Comp";
import { Server_ResearchProjFormComp } from "../BizFunc/WEB/SpecResearch/Server_SpecResearch_Form_Comp";
import { Server_USRProjFormComp } from "../BizFunc/WEB/SpecUSR/Server_SpecUSR_Form_Comp";
import { Server_SpecUSR_List_Comp } from "../BizFunc/WEB/SpecUSR/Server_SpecUSR_List_Comp";

// #region Property
const FEATURE_WEB_PROG_LIMIT = 6;


const KEEP_MODULE_CODE_SET = new Set<string>(["Dashboard", "WebManagement", "AccountManage", "Logout"]);
// #endregion

// #region EntityComp
/** 建立 1810 客製 WebManagement Prog */
const buildSpecWebProgs = (): IProgMeta[] =>
{
    return [{
        ProgId: PGID.SpecResearch,
        Title: "研究計畫",
        DefaultActionCode: "List",
        IconClassName: "fas fa-search",
        Actions: [{
            ActionCode: "List",
            Title: "研究計畫列表",
            RoutePath: "List",
            elementFactory: (ctx) => <Server_ResearchProjListComp title="研究計劃列表" theme={ctx.theme} lang={ctx.lang} />,
        }, {
            ActionCode: "Form",
            Title: "研究計畫維護",
            RoutePath: "Form/:internalId?",
            elementFactory: (ctx) => <Server_ResearchProjFormComp theme={ctx.theme} lang={ctx.lang} />,
        }, {
            ActionCode: PGID.SpecCategory,
            Title: "研究計畫類別",
            RoutePath: `${PGID.SpecCategory}/:internalId?`,
            elementFactory: (ctx) => <Server_SpecCategoryListFormComp progId={PGID.SpecResearch} title="類別" theme={ctx.theme} lang={ctx.lang} />,
        }, {
            ActionCode: "Tag",
            Title: "研究計畫標籤",
            RoutePath: "Tag/:internalId?",
            elementFactory: (ctx) => <Server_Tag_ListForm_Comp progId={PGID.SpecResearch} title="標籤" theme={ctx.theme} lang={ctx.lang} />,
        }],
    }, {
        ProgId: PGID.SpecUSR,
        Title: "計畫成果版型",
        DefaultActionCode: "List",
        IconClassName: "fas fa-university",
        Actions: [{
            ActionCode: "List",
            Title: "計畫成果列表",
            RoutePath: "List",
            elementFactory: (ctx) => <Server_SpecUSR_List_Comp title="研究計劃列表" theme={ctx.theme} lang={ctx.lang} />,
        }, {
            ActionCode: "Form",
            Title: "計畫成果維護",
            RoutePath: "Form/:internalId?",
            elementFactory: (ctx) => <Server_USRProjFormComp theme={ctx.theme} lang={ctx.lang} />,
        }, {
            ActionCode: PGID.SpecCategory,
            Title: "計畫成果類別",
            RoutePath: `${PGID.SpecCategory}/:internalId?`,
            elementFactory: (ctx) => <Server_SpecCategoryListFormComp progId={PGID.SpecUSR} title="類別" theme={ctx.theme} lang={ctx.lang} />,
        }, {
            ActionCode: "Tag",
            Title: "計畫成果標籤",
            RoutePath: "Tag/:internalId?",
            elementFactory: (ctx) => <Server_Tag_ListForm_Comp progId={PGID.SpecUSR} title="標籤" theme={ctx.theme} lang={ctx.lang} />,
        }],
    }];
};
// #endregion

// #region Private
/** 複製 module，避免直接污染 Feature 原始資料 */
const cloneModule = (module: IModuleMeta): IModuleMeta =>
{
    return { ...module, Progs: [...module.Progs] };
};


/** 只保留 1810 需要的後台主模組 */
const filterModulesFor1810 = (modules: IModuleMeta[]): IModuleMeta[] =>
{
    return modules.filter((m) => KEEP_MODULE_CODE_SET.has(m.ModuleCode)).map(cloneModule);
};


/** 只保留 Feature WebManagement 前六個 Prog */
const trimFeatureWebProgs = (modules: IModuleMeta[]): IModuleMeta[] =>
{
    const web = modules.find((m) => m.ModuleCode === "WebManagement");
    if (!web) return modules;

    web.Progs = web.Progs.slice(0, FEATURE_WEB_PROG_LIMIT);
    return modules;
};


/** 將 1810 客製 Prog 掛回 WebManagement */
const appendSpecWebProgs = (modules: IModuleMeta[]): IModuleMeta[] =>
{
    const web = modules.find((m) => m.ModuleCode === "WebManagement");
    if (!web) return modules;
    web.Progs = [...web.Progs, ...buildSpecWebProgs()];
    return modules;
};


/** 1810 後台選單：保留指定主模組、裁切 Web Prog、加入客製功能 */
const extendServerModuleRoutes = (modules: IModuleMeta[]): IModuleMeta[] =>
{
    const filtered = filterModulesFor1810(modules);
    const trimmed = trimFeatureWebProgs(filtered);
    return appendSpecWebProgs(trimmed);
};


export default extendServerModuleRoutes;
// #endregion
