import { BannerSlider } from '@/SpecFetures/1810/Pages/Client/Index/Section/BannerSlider'
import { IconCardMenu } from '@/SpecFetures/1810/Pages/Client/Index/Section/IconCardMenu'
import { CategoryTabs } from '@/SpecFetures/1810/Pages/Client/Index/Section/CategoryTabs'
import { EventSession } from '@/SpecFetures/1810/Pages/Client/Index/Section/EventSession'
import { GallerySession } from '@/SpecFetures/1810/Pages/Client/Index/Section/GallerySession'
import { VideoSession } from '@/SpecFetures/1810/Pages/Client/Index/Section/VideoSession'

const HomePage = () => {
  return (
    <main id="fullpage" className="fullpage-wrapper">
      <div className="bg_area">
        <div className="mainArea" id="mainArea">
          {/* // 輪播BANNER // */}
          <BannerSlider />
          {/* IConCard 輪播 */}
          <IconCardMenu />
          {/* // 最新消息 // */}
          <CategoryTabs />
          {/* // 活動資訊 start // */}
          <EventSession />
          {/* // 活動花絮 start // */}
          <GallerySession />
          {/* // 影音專區 start // */}
          <VideoSession />
        </div>
      </div>
    </main>
  );
};

export default HomePage;