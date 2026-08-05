import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import type { Lang } from "@/SysCore/i18n/lang";

// #region Property
interface HomePageProps
{
    lang: Lang;
}

interface HomePageText
{
    title: string;
    description: string;
}
// #endregion

// #region Public
/** 建立 Feature 公版首頁範例內容。 */
export const HomePage = (props: HomePageProps) =>
{
    const text = getHomePageText(props.lang);

    return (
        <main id="Site-Main" className="feature-home-main">
            <div className="container">
                <Accesskey type="C" lang={props.lang} />
                <section className="feature-home-placeholder" aria-labelledby="feature-home-title">
                    <h2 id="feature-home-title">{text.title}</h2>
                    <p>{text.description}</p>
                </section>
            </div>
        </main>
    );
};
// #endregion

// #region Private
/** 取得公版首頁範例文字。 */
const getHomePageText = (lang: Lang): HomePageText =>
{
    const isEn = lang === "en";
    return isEn
        ? { title: "WCMS Feature Homepage", description: "Homepage sections can be extended later by a site specification or CMS content." }
        : { title: "WCMS 公版首頁", description: "首頁內容可於後續由各站台 Spec 或後台資料進一步擴充。" };
};
// #endregion
