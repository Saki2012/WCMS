import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibText } from "@/SysCore/Utils/Library/LibData";
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
            <HeaderSection header={props.header} />
            <div className="spec1821-feature__list">
                {cards.map((item, index) => <FeatureCard key={`${item.HomePageId}-${item.RowId}`} item={item} index={index} lang={props.lang} />)}
            </div>
        </section>
    );
};
// #endregion

// #region Section
/** 招生特色標題區塊 */
const HeaderSection = (props: { header: HomePageModel; }) =>
{
    if (!props.header.Section3Title && !props.header.Section3SubTitle) return null;

    return (
        <div className="spec1821-section-title">
            <h2 id="spec1821-feature-title">{props.header.Section3Title}</h2>
            {props.header.Section3SubTitle && <span>{props.header.Section3SubTitle}</span>}
        </div>
    );
};
// #endregion

// #region EntityComp
/** 招生特色卡片 */
const FeatureCard = (props: { item: FeatureCardModel; index: number; lang: Lang; }) =>
{
    const content = <FeatureCardContent item={props.item} index={props.index} />;
    if (!LibText.isNonEmptyString(props.item.Link)) return <div className="spec1821-feature__card">{content}</div>;

    return (
        <LangLink to={props.item.Link ?? ""} lang={props.lang} className="spec1821-feature__card" title={props.item.Title ?? ""}>
            {content}
        </LangLink>
    );
};

/** 招生特色卡片內容 */
const FeatureCardContent = (props: { item: FeatureCardModel; index: number; }) =>
{
    return (
        <>
            <img src={FileManagementAPI.get_Public_Preview_Url(props.item.PictureId)} alt={props.item.PictureDescription || props.item.Title || ""} />
            <div className="spec1821-feature__caption">
                <span className="spec1821-feature__number">{String(props.index + 1).padStart(2, "0")}</span>
                <strong>{props.item.Title}</strong>
                {props.item.SubTitle && <span>{props.item.SubTitle}</span>}
            </div>
        </>
    );
};
// #endregion
