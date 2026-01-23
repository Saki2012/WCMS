import { CarouselData } from '@/SpecFetures/1818/Pages/Client/Index/Section/CarouselData'
import { LinkData } from '@/SpecFetures/1818/Pages/Client/Index/Section/LinkData'
import { AboutPage } from '@/SpecFetures/1818/Pages/Client/Index/Section/AboutPage'
import { NewsData } from '@/SpecFetures/1818/Pages/Client/Index/Section/NewsData'
import { ActivityPhotoData } from '@/SpecFetures/1818/Pages/Client/Index/Section/ActivityPhotoData'
import { type Lang } from '@/SysCore/i18n/lang'

const HomePage = (props: { lang: Lang }) => {
  return (
    <main id="Site-Main" className="ALL_Main_DivBar main-fullpage-wraper">
      <div className="background_area">
        <div className="iMG-Shape-3" />
        {/* // 輪播BANNER //  */}
        <CarouselData lang={props.lang} />
        <section className="accesskey_C_H">
          <div className="container-customize3">
            <a accessKey="C" className="accesskey_main C" href="#C" id="content" tabIndex={0} title="中央主要內容區(C)">
              :::
            </a>
          </div>
        </section>
        {/* // 相關連結 //  */}
        <LinkData lang={props.lang} />
        {/* // 關於我們 //  */}
        <AboutPage lang={props.lang} />
        {/* // 最新消息 //  */}
        <NewsData lang={props.lang} />
        {/* // 活動相簿 //  */}
        <ActivityPhotoData lang={props.lang} />
      </div>
    </main>
  );
};

export default HomePage;