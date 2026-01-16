// src/SpecFeatures/Spec1819/Pages/HomePage/HomePage.tsx
import type { Lang } from "@/SysCore/i18n/lang";
import { SubmissionReviewSystem } from "../Scaffold/MainFrame/SubmissionReviewSystem";
import { LatestIssueSection } from "./Section/LatestIssueSection";
import { AccessKeyCSection } from "./Section/AccessKeyCSection";
import { IndexedSection } from "./Section/IndexedSection";
import { AboutPublicationSection } from "./Section/AboutPublicationSection";
import { NewsSection } from "./Section/NewsSection";
import { RelatedLinksSection } from "./Section/RelatedLinksSection";

/**
 * 1819 - HomePage
 * - 目前先提供「骨架版」：對齊 Prototype 的 section 結構與 className
 * - 後續再把每個 section 抽成獨立檔案（Section Component + Hook）
 */
const HomePage = (props: { lang: Lang }) => {
  // 渲染頁面（先對齊 Prototype 的 main/background_area 結構）
  return (
    <main id="Site-Main" className="ALL_Main_DivBar main-fullpage-wraper">
      <div className="background_area">
        {/* 最新卷期 */}
        <LatestIssueSection />
        {/* accesskey C（中央主要內容） */}
        <AccessKeyCSection />
        {/* 索引 */}
        <IndexedSection lang={props.lang} />
        {/* 最新消息 */}
        <NewsSection lang={props.lang} />
        {/* 關於本刊 */}
        <AboutPublicationSection lang={props.lang} />
        {/* 相關連結 */}
        <RelatedLinksSection lang={props.lang} />
      </div>
    </main>
  );
};

export default HomePage;

