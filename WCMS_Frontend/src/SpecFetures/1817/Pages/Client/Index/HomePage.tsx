import { CarouselData } from '@/SpecFetures/1817/Pages/Client/Index/Section/CarouselData'
import { NewsData } from '@/SpecFetures/1817/Pages/Client/Index/Section/NewsData'
import { ExhibitionNewsData } from '@/SpecFetures/1817/Pages/Client/Index/Section/ExhibitionNewsData'
import { AboutPage } from '@/SpecFetures/1817/Pages/Client/Index/Section/AboutPage'
import { SpecialLinkData } from '@/SpecFetures/1817/Pages/Client/Index/Section/SpecialLinkData'
import { DefaultLang } from '@/SysCore/i18n/lang'

const HomePage = () => {
  const lang = DefaultLang
  return (
    <main id="fullpage" className="fullpage-wrapper">
      <div className="bg_area">
        <div className="mainArea" id="mainArea">
          <section className="accesskey_C_H">
            <div className="container-customize3">
              <a accessKey="C" className="accesskey_main C" href="#C" id="content" tabIndex={0} title="中央主要內容區(C)">:::</a>
            </div>
          </section>
          {/* // 輪播BANNER //  */}
          <CarouselData lang={lang} />
          {/* // 最新消息 //  */}
          <NewsData lang={lang} />
          {/* // 最新消息 //  */}
          <ExhibitionNewsData lang={lang} />
          {/* // 相關資料 //  */}
          <AboutPage lang={lang} />
          {/* // 專區連結 //  */}
          <SpecialLinkData lang={lang} />
        </div>
      </div>
    </main>
  );
};

export default HomePage;