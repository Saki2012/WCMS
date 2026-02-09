import { LinkData } from '@/SpecFetures/1816/Pages/Client/Index/Section/LinkData'
import { CollectionsData } from '@/SpecFetures/1816/Pages/Client/Index/Section/CollectionsData'
import { SpecialLinkData } from '@/SpecFetures/1816/Pages/Client/Index/Section/SpecialLinkData'
import { QuickLinksData } from '@/SpecFetures/1816/Pages/Client/Index/Section/QuickLinksData'
import type { Lang } from '@/SysCore/i18n/lang'
import { NewsCalendarData } from '@/SpecFetures/1816/Pages/Client/Index/Section/NewsCalendarData'
import { BannerNews } from '@/SpecFetures/1816/Pages/Client/Index/Section/BannerNews'

const HomePage = (props: { lang: Lang }) => {
  return (
    <main id="Site-Main" className="ALL_Main_DivBar main-fullpage-wraper">
      <div className="background_area">
        <LinkData {...props} />
        <NewsCalendarData {...props} />
        <section className="accesskey_C_H">
          <div className="container-customize4">
            <a id="content" accessKey="C" href="#C" className="accesskey_main C" title="中央主要內容區(C)">:::</a>
          </div>
        </section>
        {/* 輪播+最新消息 */}
        <BannerNews {...props} />
        {/* 館藏櫥窗  */}
        <CollectionsData {...props} />
        {/* 專區連結  */}
        <SpecialLinkData {...props} />
        {/* 快速連結  */}
        <QuickLinksData {...props} />
      </div>
    </main>
  );
};

export default HomePage;