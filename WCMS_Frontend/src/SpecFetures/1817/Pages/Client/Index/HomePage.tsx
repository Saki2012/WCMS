import { CarouselData } from '@/SpecFetures/1817/Pages/Client/Index/Section/CarouselData'
import { PerformancesPage } from '@/SpecFetures/1817/Pages/Client/Index/Section/PerformancesPage'
import { NewsData } from '@/SpecFetures/1817/Pages/Client/Index/Section/NewsData'
import { ExhibitionNewsData } from '@/SpecFetures/1817/Pages/Client/Index/Section/ExhibitionNewsData'
import { AboutPage } from '@/SpecFetures/1817/Pages/Client/Index/Section/AboutPage'
import { SpecialLinkData } from '@/SpecFetures/1817/Pages/Client/Index/Section/SpecialLinkData'

const HomePage = () => {
  return (
    <main id="fullpage" className="fullpage-wrapper">
      <div className="bg_area">
        <div className="mainArea" id="mainArea">
          {/* // 輪播BANNER //  */}
          <CarouselData></CarouselData>
          <section className="accesskey_C_H">
            <div className="container-customize3">
              <a accessKey="C" className="accesskey_main C" href="#C" id="content" tabIndex={0} title="中央主要內容區(C)">:::</a>
            </div>
          </section>
          {/* // 最新展演 //  */}
          <PerformancesPage></PerformancesPage>
          {/* // 最新消息 //  */}
          <NewsData></NewsData>
          {/* // 最新消息 //  */}
          <ExhibitionNewsData></ExhibitionNewsData>
          {/* // 相關資料 //  */}
          <AboutPage></AboutPage>
          {/* // 專區連結 //  */}
          <SpecialLinkData></SpecialLinkData>
        </div>
      </div>
    </main>
  );
};

export default HomePage;