import { SearchData } from '@/SpecFetures/1816/Pages/Client/Index/Section/SearchData'
import { LinkData } from '@/SpecFetures/1816/Pages/Client/Index/Section/LinkData'
import { CarouselData } from '@/SpecFetures/1816/Pages/Client/Index/Section/CarouselData'
import { NewsData } from '@/SpecFetures/1816/Pages/Client/Index/Section/NewsData'
import { CollectionsData } from '@/SpecFetures/1816/Pages/Client/Index/Section/CollectionsData'
import { SpecialLinkData } from '@/SpecFetures/1816/Pages/Client/Index/Section/SpecialLinkData'
import { QuickLinksData } from '@/SpecFetures/1816/Pages/Client/Index/Section/QuickLinksData'

const HomePage = () => {
  return (
    <main id="Site-Main" className="ALL_Main_DivBar main-fullpage-wraper">
      <div className="background_area">
        <div className="mainArea" id="mainArea">
          {/* // 資源探索 //  */}
          <SearchData></SearchData>
          {/* // 連結區 //  */}
          <LinkData></LinkData>
          {/* // 輪播BANNER //  */}
          <CarouselData></CarouselData>
          {/* // 最新消息 //  */}
          <NewsData></NewsData>
          {/* // 館藏櫥窗 //  */}
          <CollectionsData></CollectionsData>
          {/* // 專區連結 //  */}
          <SpecialLinkData></SpecialLinkData>
          {/* // 快速連結 //  */}
          <QuickLinksData></QuickLinksData>
        </div>
      </div>
    </main>
  );
};

export default HomePage;