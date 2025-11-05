import { GoTopButton } from '@/Features/Pages/Client/BizFunc/MainPage/SubPages'
import { SearchData } from '@/SpecFetures/1816/Pages/Client/Index/SearchData'
import { LinkData } from '@/SpecFetures/1816/Pages/Client/Index/LinkData'
import { CarouselData } from '@/SpecFetures/1816/Pages/Client/Index/CarouselData'
import { NewsData } from '@/SpecFetures/1816/Pages/Client/Index/NewsData'
import { CollectionsData } from '@/SpecFetures/1816/Pages/Client/Index/CollectionsData'
import { SpecialLinkData } from '@/SpecFetures/1816/Pages/Client/Index/SpecialLinkData'
import { QuickLinksData } from '@/SpecFetures/1816/Pages/Client/Index/QuickLinksData'
// import { LEGACY_JS, LEGACY_CSS } from "./LegacySrc.ts";

// LEGACY_CSS.forEach((href) => {
//   if (!document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
//     const link = document.createElement("link");
//     link.rel = "stylesheet";
//     link.href = href;
//     document.head.appendChild(link);
//   }
// });

// LEGACY_JS.forEach((src) => {
//   if (!document.querySelector(`script[src="${src}"]`)) {
//     const script = document.createElement("script");
//     script.src = src;
//     script.defer = true;         // 用 defer，避免阻塞、又保留順序
//     document.body.appendChild(script);
//   }
// });


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
      <GoTopButton />
    </main>
  );
};

export default HomePage;