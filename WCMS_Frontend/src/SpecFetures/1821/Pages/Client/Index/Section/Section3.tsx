import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";

// #region Property
type HomePageModel = components["schemas"]["SpecHomePage1821Model_DTO"];
type FeatureCardModel = components["schemas"]["SpecHomePage1821_FeatureCard_DTO"];

const MAX_FEATURE_CARD_COUNT = 2;
// #endregion

// #region Public
/** Section3：兩張招生特色卡片 */
export const Section3 = (props: { lang: Lang; header: HomePageModel; data: FeatureCardModel[]; }) =>
{
    const cards = (props.data ?? []).slice(0, MAX_FEATURE_CARD_COUNT);
    if (cards.length === 0) return null;

    return (
        <section className="spec1821-feature" aria-labelledby="spec1821-feature-title">
            {renderHeader(props.header)}
            <div className="spec1821-feature__list">{cards.map((item, index) => renderFeatureCard(item, index, props.lang))}</div>
        </section>
    );
};
// #endregion

// #region EntityComp
/** 渲染標題 */
const renderHeader = (header: HomePageModel) =>
{
    if (!header.Section3Title && !header.Section3SubTitle) return null;

    return (
        <div className="spec1821-section-title">
            <h2 id="spec1821-feature-title">{header.Section3Title}</h2>
            {header.Section3SubTitle && <span>{header.Section3SubTitle}</span>}
        </div>
    );
};

/** 渲染招生特色卡片 */
const renderFeatureCard = (item: FeatureCardModel, index: number, lang: Lang) =>
{
    const content = renderCardContent(item, index);
    if (!hasLink(item.Link)) return <div key={`${item.HomePageId}-${item.RowId}`} className="spec1821-feature__card">{content}</div>;

    return (
        <LangLink key={`${item.HomePageId}-${item.RowId}`} to={item.Link ?? ""} lang={lang} className="spec1821-feature__card" title={item.Title ?? ""}>
            {content}
        </LangLink>
    );
};

/** 渲染卡片內容 */
const renderCardContent = (item: FeatureCardModel, index: number) =>
{
    return (
        <>
            <img src={FileManagementAPI.get_Public_Preview_Url(item.PictureId)} alt={item.PictureDescription || item.Title || ""} />
            <div className="spec1821-feature__caption">
                <span className="spec1821-feature__number">{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.Title}</strong>
                {item.SubTitle && <span>{item.SubTitle}</span>}
            </div>
        </>
    );
};
// #endregion

// #region Private
/** 判斷是否有連結 */
const hasLink = (link?: string | null) =>
{
    return !!link?.trim();
};
// #endregion
