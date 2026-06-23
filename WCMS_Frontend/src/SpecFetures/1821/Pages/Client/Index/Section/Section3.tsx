import type {
    HomePageFeatureCardViewModel,
    SpecHomePage1821Model,
} from "@/SpecFetures/1821/Hooks/WEB/HomePage_Types";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useId } from "react";

// #region Public
export const Section3 = (props: {
    lang: Lang;
    header: SpecHomePage1821Model;
    data: HomePageFeatureCardViewModel[];
}) =>
{
    const cards = props.data ?? [];
    const titleId = useId();
    if (cards.length === 0) return null;

    return (
        <section className="spec1821-feature" aria-labelledby={titleId}>
            <HeaderSection header={props.header} titleId={titleId} />
            <div className="spec1821-feature__list">
                {cards.map((item, index) => <FeatureCard key={item.key} item={item} index={index} />)}
            </div>
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
    if (!props.header.Section3Title && !props.header.Section3SubTitle)
    {
        return null;
    }

    return (
        <div className="spec1821-section-title">
            <h2 id={props.titleId}>{props.header.Section3Title}</h2>
            {props.header.Section3SubTitle && <span>{props.header.Section3SubTitle}</span>}
        </div>
    );
};
// #endregion

// #region EntityComp
const FeatureCard = (props: {
    item: HomePageFeatureCardViewModel;
    index: number;
}) =>
{
    return (
        <article className="spec1821-feature__card">
            {props.item.pictureId && (
                <img
                    src={FileManagementAPI.get_Public_Preview_Url(props.item.pictureId)}
                    alt={props.item.pictureDescription || props.item.title}
                />
            )}
            <div className="spec1821-feature__caption">
                <span className="spec1821-feature__number">
                    {String(props.index + 1).padStart(2, "0")}
                </span>
                <strong>{props.item.title}</strong>
            </div>
        </article>
    );
};
// #endregion
