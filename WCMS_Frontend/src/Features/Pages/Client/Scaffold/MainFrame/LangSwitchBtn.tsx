import React, { useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLang } from "@/SysCore/i18n/LangContext";
import { DefaultLang, isSupportedLang, LangLabelMap, type Lang } from "@/SysCore/i18n/lang";
import type { INormSite } from "../../Route/Site-Routing";

export const LangSwitchBtn: React.FC<{ site: INormSite }> = ({ site }) => {
  const ctx = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  // 1) 從 Site 推 supportedLang（先用 indexInfo/tree 推；之後你要完全改用 SiteInfo.SupportLangs 也很好接）
  const supportedLangs = useMemo(() => {
    const fromIndex = Object.keys(site.indexInfoByLang ?? {}).map(s => s.toLowerCase()).filter(isSupportedLang) as Lang[];
    const fromTree = Object.keys(site.treeByLang ?? {}).map(s => s.toLowerCase()).filter(isSupportedLang) as Lang[];
    const uniq = Array.from(new Set<Lang>([DefaultLang, ...fromIndex, ...fromTree]));
    return uniq;
  }, [site.indexInfoByLang, site.treeByLang]);
  // 2) 只有 default：不顯示
  if (supportedLangs.length <= 1) return null;
  // 3) 後台/服務路徑：不影響（你要求的第2點）
  if (location.pathname.startsWith("/Server") || location.pathname.startsWith("/Service")) return null;
  const activeLang = ((ctx.code ?? DefaultLang) as Lang);
  const buildSwitchTo = useCallback((target: Lang) => {
    const pathname = location.pathname;
    // 去掉 leading lang segment（如果有人手打 /zh-tw/xxx 也會被收斂掉）
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] && isSupportedLang(parts[0])) parts.shift();
    const base = "/" + parts.join("/");
    const cleanBase = base === "/" ? "/" : base;
    const nextPath = target === DefaultLang ? cleanBase : (cleanBase === "/" ? `/${target}` : `/${target}${cleanBase}`);
    return `${nextPath}${location.search}${location.hash}`;
  }, [location.pathname, location.search, location.hash]);
  const go = useCallback((target: Lang) => {
    if (target === activeLang) return;
    navigate(buildSwitchTo(target), { replace: true });
  }, [activeLang, buildSwitchTo, navigate]);
  // 4) default + 1：顯示一顆切換 button（你現在的 UI）
  if (supportedLangs.length === 2) {
    const other = supportedLangs.find(x => x !== activeLang) ?? supportedLangs[1];
    return (
      <li>
        <div className="icons">
          <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1">
            <a type="button" role="button" title={LangLabelMap?.[other] ?? other} tabIndex={0} onClick={(e) => { e.preventDefault(); go(other); }}>
              <div className="link-text">{LangLabelMap?.[other] ?? other}</div>
            </a>
          </div>
        </div>
      </li>
    );
  }
  // 5) >=3：dropdown
  return (
    <li>
      <div className="icons">
        <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1 dropdown">
          <a className="dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" title="Language" tabIndex={0} onClick={(e) => e.preventDefault()}>
            <div className="link-text">{LangLabelMap?.[activeLang] ?? activeLang}</div>
          </a>
          <ul className="dropdown-menu">
            {supportedLangs.map(l => (
              <li key={l}>
                <a className={`dropdown-item ${l === activeLang ? "active" : ""}`} onClick={(e) => { e.preventDefault(); go(l); }}>
                  {LangLabelMap?.[l] ?? l}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
};
