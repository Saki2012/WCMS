import { BannerSlider } from '@/SpecFetures/1810/Pages/Client/Index/BannerSlider'
import { IconCardMenu } from '@/SpecFetures/1810/Pages/Client/Index/IconCardMenu'
import { CategoryTabs } from '@/SpecFetures/1810/Pages/Client/Index/CategoryTabs'
import { EventSession } from '@/SpecFetures/1810/Pages/Client/Index/EventSession'
import { GallerySession } from '@/SpecFetures/1810/Pages/Client/Index/GallerySession'
import { VideoSession } from '@/SpecFetures/1810/Pages/Client/Index/VideoSession'
import { GoTopButton } from './SubPages'
{/*
import { SearchData } from '@/SpecFetures/1816/Pages/Client/Index/SearchData'
import { LinkData } from '@/SpecFetures/1816/Pages/Client/Index/LinkData'
import { CarouselData } from '@/SpecFetures/1816/Pages/Client/Index/CarouselData'
import { NewsData } from '@/SpecFetures/1816/Pages/Client/Index/NewsData'
import { CollectionsData } from '@/SpecFetures/1816/Pages/Client/Index/CollectionsData'
import { SpecialLinkData } from '@/SpecFetures/1816/Pages/Client/Index/SpecialLinkData'
import { QuickLinksData } from '@/SpecFetures/1816/Pages/Client/Index/QuickLinksData'
*/}


const HomePage = () => {
  return (
    <main id="fullpage" className="fullpage-wrapper">
      <div className="bg_area">
        <div className="mainArea" id="mainArea">


          {/*
           // 資源探索 // 
          <SearchData></SearchData>
           // 連結區 // 
          <LinkData></LinkData>
           // 輪播BANNER // 
          <CarouselData></CarouselData>
           // 最新消息 // 
          <NewsData></NewsData>
           // 館藏櫥窗 // 
          <CollectionsData></CollectionsData>
           // 專區連結 // 
          <SpecialLinkData></SpecialLinkData>
           // 快速連結 // 
          <QuickLinksData></QuickLinksData>

*/}




          {/* // 輪播BANNER // */}
          <BannerSlider></BannerSlider>
          {/* IConCard 輪播 */}
          <IconCardMenu></IconCardMenu>
          {/* // 最新消息 // */}
          <CategoryTabs></CategoryTabs>
          {/* // 活動資訊 start // */}
          <EventSession></EventSession>
          {/* // 活動花絮 start // */}
          <GallerySession></GallerySession>
          {/* // 影音專區 start // */}
          <VideoSession></VideoSession>
        </div>
      </div>
      <GoTopButton />

    </main>
  );
};

export default HomePage;