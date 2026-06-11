import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";

// #region Property
type HomePageModel = components["schemas"]["SpecHomePage1821Model_DTO"];
type RelatedLinkModel = components["schemas"]["SpecHomePage1821_RelatedLink_DTO"];
// #endregion

// #region Public
/** Section4：相關連結清單 */
export const Section4 = (props: { lang: Lang; header: HomePageModel; data: RelatedLinkModel[]; }) =>
{
    const links = props.data ?? [];
    if (links.length === 0) return null;

    return (
        <section className="spec1821-links" aria-labelledby="spec1821-links-title">
            <HeaderSection header={props.header} />
            <div className="spec1821-links__list">
                {links.map((item) => <RelatedLinkItem key={`${item.HomePageId}-${item.RowId}`} item={item} lang={props.lang} />)}
            </div>
        </section>
    );
};
// #endregion

// #region Section
/** 相關連結標題區塊 */
const HeaderSection = (props: { header: HomePageModel; }) =>
{
    return (
        <div className="spec1821-section-title">
            <h2 id="spec1821-links-title">{props.header.Section4Title || "相關連結"}</h2>
            <span>{props.header.Section4SubTitle || "Links"}</span>
        </div>
    );
};
// #endregion

// #region EntityComp
/** 相關連結項目 */
const RelatedLinkItem = (props: { item: RelatedLinkModel; lang: Lang; }) =>
{
    const content = <RelatedLinkContent item={props.item} />;
    if (!LibText.isNonEmptyString(props.item.Link)) return <div className="spec1821-links__item">{content}</div>;

    return (
        <LangLink to={props.item.Link ?? ""} lang={props.lang} className="spec1821-links__item" title={props.item.Title ?? ""}>
            {content}
        </LangLink>
    );
};

/** 相關連結內容 */
const RelatedLinkContent = (props: { item: RelatedLinkModel; }) =>
{
    return (
        <>
            {props.item.PictureId && <img src={FileManagementAPI.get_Public_Preview_Url(props.item.PictureId)} alt={props.item.PictureDescription || props.item.Title || ""} />}
            <span>{props.item.Title}</span>
        </>
    );
};
// #endregion
