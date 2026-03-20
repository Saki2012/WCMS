import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { loadClientChildren } from "@/Features/Pages/Client/Route/ClientRouter";
import { BackendRouteModule } from "@/Features/Pages/Server/Scaffold/Routes/ServerRouter";
import type { RouteObject } from "react-router-dom";
import { type INormNode, type INormSite, type ModuleEntry } from "@/Features/Pages/Client/Route/Site-Routing";
import type { IHeaderMetaProps } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import SubPage from "@/Features/Pages/Client/Scaffold/SubPages/SubPage";
import { Classic_FETheme } from "@/Features/Pages/Client/Theme/ClassicTheme_Clsx";
import { AutoRedirect } from "@/SysCore/Utils/Route/AutoRedirect";

import { SpecJournalIndex } from "@/SpecFetures/1819/Pages/Client/BizFunc/SpecModule/SpecJournal/SpecJournalIndex";
import { SpecJournalList } from "@/SpecFetures/1819/Pages/Client/BizFunc/SpecModule/SpecJournal/SpecJournalList";
import { SpecJournalForm_Comp } from "@/SpecFetures/1819/Pages/Client/BizFunc/SpecModule/SpecJournal/SpecJournalForm";

import { SpecJournalIndex_Loader } from "@/SpecFetures/1819/Pages/Client/BizFunc/SpecModule/SpecJournal/SpecJournalIndex_Loader";
import { PublishStatusEnum, SpecJournalList_Loader } from "@/SpecFetures/1819/Pages/Client/BizFunc/SpecModule/SpecJournal/SpecJournalList_Loader";
import { SpecJournalForm_Loader } from "@/SpecFetures/1819/Pages/Client/BizFunc/SpecModule/SpecJournal/SpecJournalForm_Loader";

export class SpecRouteModule implements IRouteModule {
    async getRoutes(): Promise<RouteObject[]> {
        // 宣告變數
        const frontendRoutes = await loadClientChildren();
        const backendRoutes = new BackendRouteModule().getRoutes();
        const customRoutes: RouteObject[] = [];

        // return
        return [...frontendRoutes, ...backendRoutes, ...customRoutes];
    }
}

export const specClientEntries: Record<string, ModuleEntry> = {
    SpecJournal: {
        kind: "routes",
        element: (lang: Lang, site: INormSite, node: INormNode) => (
            <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />
        ),
        children: (opts, lang, site, node) => [
            {
                index: true,
                element: <AutoRedirect to="Index" replace />,
            },

            // Index：年份 / 卷期索引
            {
                path: "Index",
                loader: SpecJournalIndex_Loader({ pageSize: 10 }),
                element: <SpecJournalIndex site={site} node={node} lang={lang} />,
                handle: { breadcrumb: "journal-index" },
            },

            // List：某一期
            {
                path: "List/:indexId?/:rowId?",
                loader: SpecJournalList_Loader({ pageSize: 10, publishStatus: PublishStatusEnum.Published, forceGlobal: false, pageTitle: "所有期刊",}),
                element: <SpecJournalList site={site} node={node} lang={lang} />,
                handle: { breadcrumb: "journal-issue" },
            },
            // 預刊列表
            {
                path: "Preprint",
                loader: SpecJournalList_Loader({ pageSize: 10, publishStatus: PublishStatusEnum.Unpublished, forceGlobal: true, pageTitle: "預刊本", }),
                element: <SpecJournalList site={site} node={node} lang={lang} />,
                handle: { breadcrumb: "journal-preprint" },
            },
            // Form：某一篇
            {
                path: "Form/:indexId/:rowId/:journalId?",
                loader: SpecJournalForm_Loader(),
                element: <SpecJournalForm_Comp site={site} node={node} lang={lang} />,
                handle: { breadcrumb: "journal-article" },
            },
        ],
    },
};

// 暫時先這樣做，之後將會把這些資訊改從後端設定回傳回來處理
export const siteHeaderMeta: IHeaderMetaProps = {
    title: "淡江大學教育資料與圖書館學",
    description: "淡江大學教育資料與圖書館學",
};