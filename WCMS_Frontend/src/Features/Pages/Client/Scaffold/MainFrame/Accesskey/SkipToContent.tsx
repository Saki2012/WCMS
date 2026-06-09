import type { Lang } from "@/SysCore/i18n/lang";
import { DefaultLang } from "@/SysCore/i18n/lang";
import "./SkipToContent.css"

// #region Property
interface SkipToContentProps {
  lang?: Lang;
}


/* =========================
 * i18n
 * ========================= */

const SKIP_MAP: Record<Lang, { skip: string; noscript: string }> = {
  "zh-tw": {
    skip: "跳到頁面主要內容區",
    noscript: "您的瀏覽器不支援 JavaScript，請開啟 Javascript 功能。",
  },
  "zh-cn": {
    skip: "跳到页面主要内容区",
    noscript: "您的浏览器不支持 JavaScript，请开启 Javascript 功能。",
  },
  en: {
    skip: "Skip to main content",
    noscript: "Your browser does not support JavaScript.",
  },
};
// #endregion

// #region Private
const getSkipText = (lang?: Lang) => {
  const key = lang ?? DefaultLang;
  return SKIP_MAP[key] ?? SKIP_MAP[DefaultLang];
};


/* =========================
 * component
 * ========================= */

const SkipToContent: React.FC<SkipToContentProps> = ({ lang }) => {
  const text = getSkipText(lang);

  return (
    <>
      <noscript>
        <div style={{ color: "red" }}>
          {text.noscript}
        </div>
      </noscript>

      <a
        href="#AC"
        id="gotocenter"
        title={text.skip}
        aria-label={text.skip}
        tabIndex={1}
        className="sr-only sr-only-focusable"
      >
        {text.skip}
      </a>
    </>
  );
};


export default SkipToContent;
// #endregion
