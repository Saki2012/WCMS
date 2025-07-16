import BannerSlider from '../../../../SysCore/Components/BannerSlider/BannerSlider'
import IconCardMenu from '../../../../SysCore/Components/QuickNaviSlider/IconCardMenu'
import CategoryTabs from '../../../../SysCore/Components/TabsList/CategoryTabs'
import EventSession from '../../../../SpecFetures/1810/Client/MainPageComp/EventSession'
import GallerySession from '../../../../SpecFetures/1810/Client/MainPageComp/GallerySession'
import VideoSession from '../../../../SpecFetures/1810/Client/MainPageComp/VideoSession'


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
    </main>
  );
};

export default HomePage;