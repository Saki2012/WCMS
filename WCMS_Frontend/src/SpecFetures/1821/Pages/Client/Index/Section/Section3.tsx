import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";

// #region Property
type SpecHomePage1821Model = components["schemas"]["SpecHomePage1821Model_DTO"];

interface HomePageFeatureCardViewModel
{
    key: string;
    title: string;
    link: string;
    pictureId: string;
    pictureDescription: string;
}
// #endregion

// #region Public
/** Section3：對標 prototype 的專區連結 DOM。 */
export const Section3 = (props: { lang: Lang; header: SpecHomePage1821Model; data: HomePageFeatureCardViewModel[]; }) =>
{
    const cards = (props.data ?? []).slice(0, 2);
    if (cards.length === 0) return null;

    return (
        <section className="SpecialZone_section Layout_Padding_1_top">
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize-100">
                        <div className="row mx-0">
                            {cards.map((item, index) => <FeatureCard key={item.key} lang={props.lang} item={item} index={index} />)}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
// #endregion

// #region EntityComp
/** 專區連結卡片。 */
const FeatureCard = (props: { lang: Lang; item: HomePageFeatureCardViewModel; index: number; }) =>
{
    return (
        <div className="col-md-6 col-12 my-0 px-0">
            <div className={`SZ_card bg-item-${formatTwoDigits(props.index + 1)}`} style={getCardStyle(props.item)}>
                <FeatureCardLink lang={props.lang} item={props.item} />
                <div className="SZ_badge"><span className="CC_number">{formatTwoDigits(props.index + 1)}</span></div>
            </div>
        </div>
    );
};

/** 專區連結可點擊區。 */
const FeatureCardLink = (props: { lang: Lang; item: HomePageFeatureCardViewModel; }) =>
{
    const link = getFeatureCardLink(props.item);
    const content = <FeatureCardContent title={props.item.title} />;
    if (!LibText.isNonEmptyString(link)) return <div className="a-href">{content}</div>;
    return <LangLink to={link} lang={props.lang} className="a-href" title={props.item.title}>{content}</LangLink>;
};

/** 專區連結文字外框。 */
const FeatureCardContent = (props: { title: string; }) =>
{
    return <div className="Outer_frame"><div className="Inner_frame"><div className="Center_title">{props.title}</div></div></div>;
};
// #endregion

// #region Private
/** 取得卡片背景樣式。 */
const getCardStyle = (item: HomePageFeatureCardViewModel) =>
{
    if (!item.pictureId) return undefined;
    return { backgroundImage: `url(${FileManagementAPI.get_Public_Preview_Url(item.pictureId, item.pictureDescription)})` };
};

/** 取得卡片連結。 */
const getFeatureCardLink = (item: HomePageFeatureCardViewModel) =>
{
    return item.link;
};

/** 格式化兩位數。 */
const formatTwoDigits = (value: number) =>
{
    return String(value).padStart(2, "0");
};
// #endregion
