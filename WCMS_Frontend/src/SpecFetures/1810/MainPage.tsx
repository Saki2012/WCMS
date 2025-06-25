import BannerSlider from '../../Features/Temp/Page/Components/BannerSlider'
import IconCardMenu from '../../Features/Temp/Page/Components/IconCardMenu'
import CategoryTabs from '../../Features/Temp/Page/Components/CategoryTabs'
import EventSession from './MainPageComp/EventSession'
import GallerySession from './MainPageComp/GallerySession'
import VideoSession from './MainPageComp/VideoSession'


const MainContent = () => {
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

export default MainContent;