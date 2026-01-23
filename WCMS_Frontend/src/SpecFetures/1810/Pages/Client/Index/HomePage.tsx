import { BannerSlider } from '@/SpecFetures/1810/Pages/Client/Index/Section/BannerSlider'
import { IconCardMenu } from '@/SpecFetures/1810/Pages/Client/Index/Section/IconCardMenu'
import { CategoryTabs } from '@/SpecFetures/1810/Pages/Client/Index/Section/CategoryTabs'
import { EventSession } from '@/SpecFetures/1810/Pages/Client/Index/Section/EventSession'
import { GallerySession } from '@/SpecFetures/1810/Pages/Client/Index/Section/GallerySession'
import { VideoSession } from '@/SpecFetures/1810/Pages/Client/Index/Section/VideoSession'
import type { Lang } from '@/SysCore/i18n/lang'
import { AutoRedirect } from '@/SysCore/Utils/Route/AutoRedirect'
import { Navigate } from 'react-router'


// /About-ORD-en/Introduction-en

const HomePage = (props: { lang: Lang }) => {
  // ✅ 如果是 en：這裡先不要 render fullpage 結構（避免短暫初始化又被切走）
  if (props.lang === "en") return <Navigate to="/en/About-ORD-en/Introduction-en" replace />;
  // if (props.lang === "en") return <Navigate to="/en/About-ORD-en/Introduction-en" replace />;
  return (
    <main id="fullpage" className="fullpage-wrapper">
      <div className="bg_area">
        <div className="mainArea" id="mainArea">
          {/* // 輪播BANNER // */}
          <BannerSlider lang={props.lang} />
          {/* IConCard 輪播 */}
          <IconCardMenu lang={props.lang} />
          {/* // 最新消息 // */}
          <CategoryTabs lang={props.lang} />
          {/* // 活動資訊 start // */}
          <EventSession lang={props.lang} />
          {/* // 活動花絮 start // */}
          <GallerySession lang={props.lang} />
          {/* // 影音專區 start // */}
          <VideoSession lang={props.lang} />
        </div>
      </div>
    </main>
  );
};

export default HomePage;