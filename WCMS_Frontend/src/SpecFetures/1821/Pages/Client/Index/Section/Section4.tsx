import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
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
            {renderHeader(props.header)}
            <div className="spec1821-links__list">{links.map((item) => renderRelatedLink(item, props.lang))}</div>
        </section>
    );
};
// #endregion

// #region EntityComp
/** 渲染標題 */
const renderHeader = (header: HomePageModel) =>
{
    return (
        <div className="spec1821-section-title">
            <h2 id="spec1821-links-title">{header.Section4Title || "相關連結"}</h2>
            <span>{header.Section4SubTitle || "Links"}</span>
        </div>
    );
};

/** 渲染相關連結 */
const renderRelatedLink = (item: RelatedLinkModel, lang: Lang) =>
{
    const content = renderRelatedLinkContent(item);
    if (!hasLink(item.Link)) return <div key={`${item.HomePageId}-${item.RowId}`} className="spec1821-links__item">{content}</div>;

    return (
        <LangLink key={`${item.HomePageId}-${item.RowId}`} to={item.Link ?? ""} lang={lang} className="spec1821-links__item" title={item.Title ?? ""}>
            {content}
        </LangLink>
    );
};

/** 渲染相關連結內容 */
const renderRelatedLinkContent = (item: RelatedLinkModel) =>
{
    return (
        <>
            {item.PictureId && <img src={FileManagementAPI.get_Public_Preview_Url(item.PictureId)} alt={item.PictureDescription || item.Title || ""} />}
            <span>{item.Title}</span>
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
