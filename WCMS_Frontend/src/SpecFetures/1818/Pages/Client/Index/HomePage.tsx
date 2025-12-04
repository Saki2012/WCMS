import { CarouselData } from '@/SpecFetures/1818/Pages/Client/Index/Section/CarouselData'
import { LinkData } from '@/SpecFetures/1818/Pages/Client/Index/Section/LinkData'
import { AboutPage } from '@/SpecFetures/1818/Pages/Client/Index/Section/AboutPage'
import { NewsData } from '@/SpecFetures/1818/Pages/Client/Index/Section/NewsData'
import { ActivityPhotoData } from '@/SpecFetures/1818/Pages/Client/Index/Section/ActivityPhotoData'
import { DefaultLang } from '@/SysCore/i18n/lang'

const HomePage = () => {
  return (
    <main id="Site-Main" className="ALL_Main_DivBar main-fullpage-wraper">
      <div className="background_area">
        <div className="iMG-Shape-3" />
        {/* // 輪播BANNER //  */}
        <CarouselData lang={DefaultLang} />
        <section className="accesskey_C_H">
          <div className="container-customize3">
            <a accessKey="C" className="accesskey_main C" href="#C" id="content" tabIndex={0} title="中央主要內容區(C)">
              :::
            </a>
          </div>
        </section>
        {/* // 相關連結 //  */}
        <LinkData lang={DefaultLang} />
        {/* // 關於我們 //  */}
        <AboutPage lang={DefaultLang} />
        {/* // 最新消息 //  */}
        <NewsData lang={DefaultLang} />
        {/* // 活動相簿 //  */}
        <ActivityPhotoData lang={DefaultLang} />
      </div>
    </main>
  );
};

export default HomePage;