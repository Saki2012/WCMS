import type {
    HomePageLinkViewModel,
    SpecHomePage1821Model,
} from "@/SpecFetures/1821/Hooks/WEB/HomePage_Types";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import { useId } from "react";

// #region Public
export const Section4 = (props: {
    lang: Lang;
    header: SpecHomePage1821Model;
    data: HomePageLinkViewModel[];
}) =>
{
    const links = props.data ?? [];
    const titleId = useId();
    if (links.length === 0) return null;

    return (
        <section className="spec1821-links" aria-labelledby={titleId}>
            <HeaderSection header={props.header} titleId={titleId} />
            <div className="spec1821-links__list">
                {links.map((item) => <RelatedLinkItem key={item.key} item={item} lang={props.lang} />)}
            </div>
            <MoreLink lang={props.lang} to={props.header.LinkViewMore} />
        </section>
    );
};
// #endregion

// #region Section
const HeaderSection = (props: {
    header: SpecHomePage1821Model;
    titleId: string;
}) =>
{
    return (
        <div className="spec1821-section-title">
            <h2 id={props.titleId}>{props.header.Section4Title || "相關連結"}</h2>
            {props.header.Section4SubTitle && <span>{props.header.Section4SubTitle}</span>}
        </div>
    );
};
// #endregion

// #region EntityComp
const RelatedLinkItem = (props: {
    item: HomePageLinkViewModel;
    lang: Lang;
}) =>
{
    const content = <RelatedLinkContent item={props.item} />;
    if (!LibText.isNonEmptyString(props.item.url))
    {
        return <div className="spec1821-links__item">{content}</div>;
    }

    return (
        <LangLink
            to={props.item.url}
            lang={props.lang}
            className="spec1821-links__item"
            title={props.item.title}
        >
            {content}
        </LangLink>
    );
};

const RelatedLinkContent = (props: { item: HomePageLinkViewModel; }) =>
{
    return (
        <>
            {props.item.pictureId && (
                <img
                    src={FileManagementAPI.get_Public_Preview_Url(props.item.pictureId)}
                    alt={props.item.pictureDescription || props.item.title}
                />
            )}
            <span>{props.item.title}</span>
        </>
    );
};

const MoreLink = (props: { lang: Lang; to?: string | null; }) =>
{
    if (!LibText.isNonEmptyString(props.to)) return null;
    return (
        <div className="spec1821-links__more">
            <LangLink
                to={props.to ?? ""}
                lang={props.lang}
                className="spec1821-more-link"
            >
                View More
            </LangLink>
        </div>
    );
};
// #endregion
