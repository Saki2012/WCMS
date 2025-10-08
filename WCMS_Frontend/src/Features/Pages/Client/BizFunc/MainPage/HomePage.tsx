import { BannerSlider } from '@/SpecFetures/1810/Pages/Client/Index/BannerSlider'
import { IconCardMenu } from '@/SpecFetures/1810/Pages/Client/Index/IconCardMenu'
import { CategoryTabs } from '@/SpecFetures/1810/Pages/Client/Index/CategoryTabs'
import { EventSession } from '@/SpecFetures/1810/Pages/Client/Index/EventSession'
import { GallerySession } from '@/SpecFetures/1810/Pages/Client/Index/GallerySession'
import { VideoSession } from '@/SpecFetures/1810/Pages/Client/Index/VideoSession'
import { GoTopButton } from './SubPages'


const HomePage = () => {
  return (
    <main id="fullpage" className="fullpage-wrapper">
      <div className="bg_area">
        <div className="mainArea" id="mainArea">
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