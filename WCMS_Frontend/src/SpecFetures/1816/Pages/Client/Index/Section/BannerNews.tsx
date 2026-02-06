import { CarouselData } from "./CarouselData";
import { NewsData } from "./NewsData";
import { type Lang } from "@/SysCore/i18n/lang";

export const BannerNews = (props: { lang: Lang }) => {
    return (
        <section className="container-customize4">
            <div className="row">
                <CarouselData lang={props.lang} />
                <NewsData lang={props.lang} />
            </div>
        </section>
    );
};
