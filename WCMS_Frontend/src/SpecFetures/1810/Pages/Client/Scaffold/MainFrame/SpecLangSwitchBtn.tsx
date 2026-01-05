import React, { useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLang } from "@/SysCore/i18n/LangContext";
import { DefaultLang, isSupportedLang, LangLabelMap, type Lang } from "@/SysCore/i18n/lang";
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";

export const SpecLangSwitchBtn: React.FC<{ site: INormSite }> = ({ site }) => {
  // 取得語系/路由/導頁工具
  const ctx = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  // 從 site 推導可用語系清單（default 一定要存在）
  const supportedLangs = useMemo(() => {
    const fromIndex = Object.keys(site.indexInfoByLang ?? {}).map(s => s.toLowerCase()).filter(isSupportedLang) as Lang[];
    const fromTree = Object.keys(site.treeByLang ?? {}).map(s => s.toLowerCase()).filter(isSupportedLang) as Lang[];
    const uniq = Array.from(new Set<Lang>([DefaultLang, ...fromIndex, ...fromTree]));
    return uniq;
  }, [site.indexInfoByLang, site.treeByLang]);
  // 目前語系（優先 ctx）
  const activeLang = ((ctx.code ?? DefaultLang) as Lang);
  // 組出「切換後」的網址（維持原 query/hash）
  const buildSwitchTo = useCallback((target: Lang) => {
    const pathname = location.pathname;
    // 去掉 leading lang segment（如果有人手打 /en/xxx）
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] && isSupportedLang(parts[0])) parts.shift();
    const base = "/" + parts.join("/");
    const cleanBase = base === "/" ? "/" : base;
    const nextPath = target === DefaultLang ? cleanBase : (cleanBase === "/" ? `/${target}` : `/${target}${cleanBase}`);
    return `${nextPath}${location.search}${location.hash}`;
  }, [location.pathname, location.search, location.hash]);

  // 執行切換（同語系就不動）
  const go = useCallback((target: Lang) => {
    if (target === activeLang) return;
    navigate(buildSwitchTo(target), { replace: true });
  }, [activeLang, buildSwitchTo, navigate]);

  const onBtnKeyDown = (e: React.KeyboardEvent, target: Lang) => {
    // Enter / Space 觸發
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go(target);
    }
  };

  // ★注意：所有 hooks 都已經呼叫完，現在才允許 return（避免 #310）
  const shouldHide =
    supportedLangs.length <= 1 ||
    location.pathname.startsWith("/Server") ||
    location.pathname.startsWith("/Service");

  if (shouldHide) return null;

  // 只有兩種語系：顯示一顆切換按鈕
  if (supportedLangs.length === 2) {
    const other = supportedLangs.find(x => x !== activeLang) ?? supportedLangs[1];

    return (
      <a className="nav-link" role="button" title={LangLabelMap?.[other] ?? other} tabIndex={0} onClick={(e) => { e.preventDefault(); go(other); }} onKeyDown={(e) => onBtnKeyDown(e, other)}>
        <div className="link-text">{LangLabelMap?.[other] ?? other}</div>
      </a>
    );
  }

  // 三種以上語系：dropdown
  return (
    <div className="icons">
      <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1 dropdown">
        <a className="dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" title="Language" tabIndex={0} onClick={(e) => e.preventDefault()}>
          <div className="link-text">{LangLabelMap?.[activeLang] ?? activeLang}</div>
        </a>

        <ul className="dropdown-menu">
          {supportedLangs.map(l => (
            <li key={l}>
              <a className={`dropdown-item ${l === activeLang ? "active" : ""}`} role="button" tabIndex={0} onClick={(e) => { e.preventDefault(); go(l); }} onKeyDown={(e) => onBtnKeyDown(e, l)}>
                {LangLabelMap?.[l] ?? l}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

