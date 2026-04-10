// SpecFeatures/1810/Router.ts
import { withRequestLang } from "@/Features/Pages/Client/Route/ClientRouter";
import { type INormNode, type INormSite, type ModuleEntry } from "@/Features/Pages/Client/Route/Site-Routing";
import { Classic_FETheme } from "@/Features/Pages/Client/Theme/ClassicTheme_Clsx";
import {
    type ISpecResearchListOptions,
    SpecResearchListComp,
} from "@/SpecFetures/1810/Pages/Client/BizFunc/WebManagement/SpecResearch/SpecResearch_List_Comp";
import { SpecUSRFormComp } from "@/SpecFetures/1810/Pages/Client/BizFunc/WebManagement/SpecUSR/SpecUSR_Form_Comp";
import { SpecUSRListComp } from "@/SpecFetures/1810/Pages/Client/BizFunc/WebManagement/SpecUSR/SpecUSR_List";
import SubPage from "@/SpecFetures/1810/Pages/Client/Scaffold/SubPages/SubPage";
import type { IHeaderMetaProps } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import type { Lang } from "@/SysCore/i18n/lang";

import { SpecResearchList_Loader } from "./Pages/Client/BizFunc/WebManagement/SpecResearch/SpecResearch_List_Loader";
import { SpecUSRForm_Loader } from "./Pages/Client/BizFunc/WebManagement/SpecUSR/SpecUSR_Form_Loader";
import {
    type ISpecUSRListOptions,
    SpecUSRList_Loader,
} from "./Pages/Client/BizFunc/WebManagement/SpecUSR/SpecUSR_List_Loader";

export const specClientEntries: Record<string, ModuleEntry> = {
    SpecUSR: {
        kind: "routes",
        element: (lang: Lang, site: INormSite, node: INormNode) => (
            <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />
        ),
        children: (opts: unknown, lang: Lang) => [
            {
                index: true,
                loader: withRequestLang((reqLang) =>
                    SpecUSRList_Loader({ lang: reqLang, opts: opts as ISpecUSRListOptions })
                ),
                element: <SpecUSRListComp Theme={Classic_FETheme} Lang={lang} Options={opts as ISpecUSRListOptions} />,
            },
            {
                path: ":internalId",
                loader: SpecUSRForm_Loader(),
                element: <SpecUSRFormComp Theme={Classic_FETheme} Lang={lang} />,
            },
        ],
    },
    SpecResearch: {
        kind: "routes",
        element: (lang: Lang, site: INormSite, node: INormNode) => (
            <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />
        ),
        children: (opts: unknown, lang: Lang) => [
            {
                index: true,
                loader: withRequestLang((reqLang) =>
                    SpecResearchList_Loader({ lang: reqLang, opts: opts as ISpecResearchListOptions })
                ),
                element: (
                    <SpecResearchListComp
                        Theme={Classic_FETheme}
                        Lang={lang}
                        Options={opts as ISpecResearchListOptions}
                    />
                ),
            },
        ],
    },
};

export const siteHeaderMeta: IHeaderMetaProps = {
    title: "國立臺灣藝術大學_研究發展處",
    description: "國立臺灣藝術大學_研究發展處",
};
