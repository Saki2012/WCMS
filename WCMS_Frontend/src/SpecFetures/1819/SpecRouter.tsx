import { type INormNode, type INormSite, type ModuleEntry } from "@/Features/Pages/Client/Route/Site-Routing";
import SubPage from "@/Features/Pages/Client/Scaffold/SubPages/SubPage";
import { Classic_FETheme } from "@/Features/Pages/Client/Theme/ClassicTheme_Clsx";
import { SpecJournalForm_Comp } from "@/SpecFetures/1819/Pages/Client/BizFunc/WEB/SpecJournal/SpecJournalForm";
import { SpecJournalForm_Loader } from "@/SpecFetures/1819/Pages/Client/BizFunc/WEB/SpecJournal/SpecJournalForm_Loader";
import { SpecJournalIndex } from "@/SpecFetures/1819/Pages/Client/BizFunc/WEB/SpecJournal/SpecJournalIndex";
import { SpecJournalIndex_Loader } from "@/SpecFetures/1819/Pages/Client/BizFunc/WEB/SpecJournal/SpecJournalIndex_Loader";
import { SpecJournalList } from "@/SpecFetures/1819/Pages/Client/BizFunc/WEB/SpecJournal/SpecJournalList";
import { SpecJournalList_Loader } from "@/SpecFetures/1819/Pages/Client/BizFunc/WEB/SpecJournal/SpecJournalList_Loader";
import type { IHeaderMetaProps } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { AutoRedirect } from "@/SysCore/Utils/Route/AutoRedirect";

export const specClientEntries: Record<string, ModuleEntry> = {
    SpecJournal: {
        kind: "routes",
        element: (lang: Lang, site: INormSite, node: INormNode) => <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />,
        children: (_, lang, site, node) => [
            { index: true, element: <AutoRedirect to="Index" replace /> },

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
                loader: SpecJournalList_Loader({ pageSize: 10, pageTitle: "所有期刊" }),
                element: <SpecJournalList site={site} node={node} lang={lang} />,
                handle: { breadcrumb: "journal-issue" },
            },
            // 預刊列表
            {
                path: "Preprint",
                loader: SpecJournalList_Loader({ pageSize: 10, pageTitle: "預刊本", isPreprint: true }),
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
export const siteHeaderMeta: IHeaderMetaProps = { title: "淡江大學教育資料與圖書館學", description: "淡江大學教育資料與圖書館學" };
