import { CarouselData } from '@/SpecFetures/1817/Pages/Client/Index/Section/CarouselData'
import { NewsData } from '@/SpecFetures/1817/Pages/Client/Index/Section/NewsData'
import { ExhibitionNewsData } from '@/SpecFetures/1817/Pages/Client/Index/Section/ExhibitionNewsData'
import { AboutPage } from '@/SpecFetures/1817/Pages/Client/Index/Section/AboutPage'
import { SpecialLinkData } from '@/SpecFetures/1817/Pages/Client/Index/Section/SpecialLinkData'
import type { Lang } from '@/SysCore/i18n/lang'
import { Navigate } from 'react-router'

const HomePage = (props: { lang: Lang }) => {
  if (props.lang === "en") return <Navigate to="/en/about-en/about-us-en" replace />;
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
          <CarouselData lang={props.lang} />
          {/* // 最新消息 //  */}
          <NewsData lang={props.lang} />
          {/* // 最新消息 //  */}
          <ExhibitionNewsData lang={props.lang} />
          {/* // 相關資料 //  */}
          <AboutPage lang={props.lang} />
          {/* // 專區連結 //  */}
          <SpecialLinkData lang={props.lang} />
        </div>
      </div>
    </main>
  );
};

export default HomePage;