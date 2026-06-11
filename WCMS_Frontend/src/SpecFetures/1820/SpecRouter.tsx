import { Client_Material_Form_Comp } from "@/Features/Pages/Client/BizFunc/MAT/Material/Client_Material_Form_Comp";
import { Client_Material_Form_Loader } from "@/Features/Pages/Client/BizFunc/MAT/Material/Client_Material_Form_Loader";
import { withRequestLang } from "@/Features/Pages/Client/Route/ClientRouter";
import { type INormNode, type INormSite, type ModuleEntry } from "@/Features/Pages/Client/Route/Site-Routing";
import { SubPage } from "@/Features/Pages/Client/Scaffold/SubPages/SubPage";
import { Classic_FETheme } from "@/Features/Pages/Client/Theme/ClassicTheme_Clsx";
import type { IHeaderMetaProps } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { Client_SpecProduction_List_Comp } from "./Pages/Client/BizFunc/MAT/SpecProduction/Client_SpecProduction_List_Comp";
import { Client_SpecProduction_List_Loader } from "./Pages/Client/BizFunc/MAT/SpecProduction/Client_SpecProduction_List_Loader";
import type { Module_SpecProduction_OptionsJson } from "./Pages/Server/BizFunc/WEB/SiteMenu/SpecModule_Comp";

// #region Public
export const specClientEntries: Record<string, ModuleEntry> = {
    "SpecProductionList": {
        kind: "routes",
        element: (lang: Lang, site: INormSite, node: INormNode) => <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />,
        children: (opts, lang, site, node) => [
            // 客製商品列表模板
            {
                index: true,
                loader: withRequestLang((lang) => Client_SpecProduction_List_Loader({ lang: lang, opts: opts as Module_SpecProduction_OptionsJson })),
                element: <Client_SpecProduction_List_Comp site={site} node={node} lang={lang} opts={opts as Module_SpecProduction_OptionsJson} />,
            },
            {
                path: ":internalId",
                loader: withRequestLang((lang) => Client_Material_Form_Loader({ lang })),
                element: <Client_Material_Form_Comp site={site} node={node} theme={Classic_FETheme} lang={lang} />,
            },
        ],
    },
};

export const siteHeaderMeta: IHeaderMetaProps = { title: "新化林場", description: "新化林場" };
// #endregion
