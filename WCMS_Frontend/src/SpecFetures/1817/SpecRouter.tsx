import { type INormNode, type INormSite, type ModuleEntry } from "@/Features/Pages/Client/Route/Site-Routing";

import { SubPage } from "@/Features/Pages/Client/Route/ClientComponentResolver";
import { Classic_FETheme } from "@/Features/Pages/Client/Theme/ClassicTheme_Clsx";
import SpecMusicalForm from "@/SpecFetures/1817/Pages/Client/BizFunc/WEB/SpecMusical/SpecMusicalForm";
import type { IHeaderMetaProps } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { SpecMusicalForm_Loader } from "./Pages/Client/BizFunc/WEB/SpecMusical/SpecMusicalForm_Loader";
import SpecMusicalList, { type ISpecMusicalOptions } from "./Pages/Client/BizFunc/WEB/SpecMusical/SpecMusicalList";
import { SpecMusicalList_Loader } from "./Pages/Client/BizFunc/WEB/SpecMusical/SpecMusicalList_Loader";

// #region Public
export const specClientEntries: Record<string, ModuleEntry> = {
    SpecMusical: {
        kind: "routes",
        element: (lang: Lang, site: INormSite, node: INormNode) => <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />,
        children: (opts, lang, site: INormSite, node: INormNode) =>
        {
            const musicalOpts = (opts as ISpecMusicalOptions) ?? {};
            return [{
                index: true,
                loader: SpecMusicalList_Loader({ categoryIds: musicalOpts.Category ?? "", pageSize: 9 }),
                element: <SpecMusicalList options={musicalOpts} site={site} node={node} />,
            }, { path: ":internalId", loader: SpecMusicalForm_Loader(), element: <SpecMusicalForm site={site} node={node} /> }];
        },
    },
};


export const siteHeaderMeta: IHeaderMetaProps = { title: "國立臺北藝術大學_傳統音樂學系", description: "國立臺北藝術大學_傳統音樂學系" };
// #endregion
