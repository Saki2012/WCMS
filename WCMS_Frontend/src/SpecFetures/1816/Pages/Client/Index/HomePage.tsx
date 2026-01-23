import { SearchData } from '@/SpecFetures/1816/Pages/Client/Index/Section/SearchData'
import { LinkData } from '@/SpecFetures/1816/Pages/Client/Index/Section/LinkData'
import { CarouselData } from '@/SpecFetures/1816/Pages/Client/Index/Section/CarouselData'
import { NewsData } from '@/SpecFetures/1816/Pages/Client/Index/Section/NewsData'
import { CollectionsData } from '@/SpecFetures/1816/Pages/Client/Index/Section/CollectionsData'
import { SpecialLinkData } from '@/SpecFetures/1816/Pages/Client/Index/Section/SpecialLinkData'
import { QuickLinksData } from '@/SpecFetures/1816/Pages/Client/Index/Section/QuickLinksData'
import type { Lang } from '@/SysCore/i18n/lang'

const HomePage = (props: { lang: Lang }) => {
  return (
    <main id="Site-Main" className="ALL_Main_DivBar main-fullpage-wraper">
      <div className="background_area">
        <div className="mainArea" id="mainArea">
          {/* // 資源探索 //  */}
          <SearchData lang={props.lang}></SearchData>
          {/* // 連結區 //  */}
          <LinkData lang={props.lang}></LinkData>
          {/* // 輪播BANNER //  */}
          <CarouselData lang={props.lang}></CarouselData>
          {/* // 最新消息 //  */}
          <NewsData lang={props.lang}></NewsData>
          {/* // 館藏櫥窗 //  */}
          <CollectionsData lang={props.lang}></CollectionsData>
          {/* // 專區連結 //  */}
          <SpecialLinkData lang={props.lang}></SpecialLinkData>
          {/* // 快速連結 //  */}
          <QuickLinksData lang={props.lang}></QuickLinksData>
        </div>
      </div>
    </main>
  );
};

export default HomePage;