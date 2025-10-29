import { BannerSlider } from '@/SpecFetures/1810/Pages/Client/Index/BannerSlider'
import { IconCardMenu } from '@/SpecFetures/1810/Pages/Client/Index/IconCardMenu'
import { CategoryTabs } from '@/SpecFetures/1810/Pages/Client/Index/CategoryTabs'
import { EventSession } from '@/SpecFetures/1810/Pages/Client/Index/EventSession'
import { GallerySession } from '@/SpecFetures/1810/Pages/Client/Index/GallerySession'
import { VideoSession } from '@/SpecFetures/1810/Pages/Client/Index/VideoSession'
import { GoTopButton } from '@/Features/Pages/Client/BizFunc/MainPage/SubPages'
import { LEGACY_JS, LEGACY_CSS } from "./LegacySrc.ts";

LEGACY_CSS.forEach((href) => {
  if (!document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
});

LEGACY_JS.forEach((src) => {
  if (!document.querySelector(`script[src="${src}"]`)) {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;         // 用 defer，避免阻塞、又保留順序
    document.body.appendChild(script);
  }
});

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
      <GoTopButton />
    </main>
  );
};

export default HomePage;