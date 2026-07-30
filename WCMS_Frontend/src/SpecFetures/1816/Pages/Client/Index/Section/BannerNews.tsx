import { type Lang } from "@/SysCore/i18n/lang";
import { CarouselData, type CarouselDataProps } from "./CarouselData";
import { NewsData, type NewsDataProps } from "./NewsData";

// #region Property
export type BannerNewsProps = CarouselDataProps & NewsDataProps & { lang: Lang; };
// #endregion

// #region Public
export const BannerNews = (props: BannerNewsProps) =>
{
    return (
        <section className="container-customize4">
            <div className="row">
                <CarouselData lang={props.lang} internalId={props.internalId} initialBanner={props.initialBanner} />
                <NewsData
                    lang={props.lang}
                    listParam01={props.listParam01}
                    listParam02={props.listParam02}
                    listParam03={props.listParam03}
                    listParam04={props.listParam04}
                    cateParam={props.cateParam}
                    tagParam={props.tagParam}
                    initialList01={props.initialList01}
                    initialList02={props.initialList02}
                    initialList03={props.initialList03}
                    initialList04={props.initialList04}
                    initialCategories={props.initialCategories}
                    initialTags={props.initialTags}
                />
            </div>
        </section>
    );
};
// #endregion
