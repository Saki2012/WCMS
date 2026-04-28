// Alt + U 上方導覽連結區(header) 此區塊列有本網站主要連結
// Alt + C 中央內容區塊(main) 為本頁主要內容區
// Alt + L 左方導覽區塊(sidemenu)
// Alt + Z 頁尾網站資訊(footer)

// 使用 
/**
 * import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
 * <Accesskey type="U" lang={lang} /> 上方導覽連結區
 * <Accesskey type="C" lang={lang} /> 中央內容區塊
 * <Accesskey type="L" lang={lang} /> 左方導覽區塊
 * <Accesskey type="Z" lang={lang} /> 頁尾網站資訊
 * -------------------------------------
 * <Accesskey type=" " lang={lang} className="可選擇加或不加"/>
 */


import { DefaultLang } from "@/SysCore/i18n/lang";
import type { Lang } from "@/SysCore/i18n/lang";
import "./Accesskey.css"

/* =========================
 * types
 * ========================= */

type AccesskeyType = "U" | "C" | "L" | "Z";

type AccesskeyA11yText = {
  title: string;
};

/* =========================
 * i18n map
 * ========================= */

const ACCESSKEY_MAP: Record<
  AccesskeyType,
  Partial<Record<Lang, AccesskeyA11yText>>
> = {
  U: {
    "zh-tw": { title: "上方導覽連結區 (Alt+U)" },
    "zh-cn": { title: "上方导览连结区 (Alt+U)" },
    en: { title: "Top Navigation Bar (Alt+U)" },
  },
  C: {
    "zh-tw": { title: "中央內容區塊 (Alt+C)" },
    "zh-cn": { title: "中央内容区块 (Alt+C)" },
    en: { title: "Main Content Block (Alt+C)" },
  },
  L: {
    "zh-tw": { title: "左方導覽區塊 (Alt+L)" },
    "zh-cn": { title: "左方导览区块 (Alt+L)" },
    en: { title: "Left Navigation (Alt+L)" },
  },
  Z: {
    "zh-tw": { title: "頁尾網站資訊 (Alt+Z)" },
    "zh-cn": { title: "页尾网站资讯 (Alt+Z)" },
    en: { title: "Website Footer (Alt+Z)" },
  },
};

/* =========================
 * className map（核心）
 * ========================= */

const ACCESSKEY_CLASS_MAP: Record<AccesskeyType, string> = {
  U: "accesskey_header",
  C: "accesskey_main",
  L: "accesskey_left",
  Z: "accesskey_footer",
};

/* =========================
 * getter
 * ========================= */

const getAccesskey = (
  type: AccesskeyType,
  lang?: Lang
): AccesskeyA11yText => {
  const key = lang ?? DefaultLang;

  const map = ACCESSKEY_MAP[type];

  return map[key] ?? ACCESSKEY_MAP[type][DefaultLang]!;
};

/* =========================
 * props
 * ========================= */

interface AccesskeyProps {
  type: AccesskeyType;
  lang?: Lang;
  className?: string;
}

/* =========================
 * component
 * ========================= */

export const Accesskey: React.FC<AccesskeyProps> = ({
  type,
  lang,
  className,
}) => {
  const a11y = getAccesskey(type, lang);

  return (
    <section className="accesskey_section">
      <a
        accessKey={type}
        id={`A${type}`}   // 👈 中央內容區 id
        href={`#A${type}`}
        className={`${ACCESSKEY_CLASS_MAP[type]} ${className ?? ""}`}
        title={a11y.title}
        aria-label={a11y.title}
      >
        :::
      </a>
    </section>
  );
};