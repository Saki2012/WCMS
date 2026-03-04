import React, { useMemo, useCallback, useRef } from "react";
import { useFetcher, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "@/SysCore/i18n/LangContext";
import { DefaultLang, isSupportedLang, LangLabelMap, type Lang } from "@/SysCore/i18n/lang";
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import GlobalPic from '@/Features/Assets/Client/icon-custom-global-W.svg'

export const LangSwitchBtn: React.FC<{ site: INormSite }> = ({ site }) => {
  // 取得語系/路由/導頁工具
  const ctx = useLang();
  const location = useLocation();
  const navigate = useNavigate();

  const fetcher = useFetcher();
  const lastPrefetchUrlRef = useRef<string | null>(null);

  // 執行 function：避免同一個 url 重複 prefetch
  const prefetchUrl = useCallback((url: string) => {
    if (!url) return;
    if (lastPrefetchUrlRef.current === url) return;
    lastPrefetchUrlRef.current = url;
    fetcher.load(url);
  }, [fetcher]);

  // 執行 function：hover / focus / touch 就先 prefetch（AA：鍵盤也吃得到）
  const getIntentPrefetchHandlers = useCallback((url: string) => {
    return {
      onMouseEnter: () => prefetchUrl(url),
      onFocus: () => prefetchUrl(url),
      onTouchStart: () => prefetchUrl(url),
    };
  }, [prefetchUrl]);
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

  const onLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, target: Lang) => {
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    go(target);
  }, [go]);

  // ★注意：所有 hooks 都已經呼叫完，現在才允許 return（避免 #310）
  const path = location.pathname.toLowerCase();

  // 執行判斷：只匹配 /server 或 /service（必須是完整 segment）
  const isServerRoute = path === "/server" || path.startsWith("/server/");
  const isServiceRoute = path === "/service" || path.startsWith("/service/");

  const shouldHide = supportedLangs.length <= 1 || isServerRoute || isServiceRoute;
  if (shouldHide) return null;

  const is1816 = import.meta.env.VITE_SPEC_CODE === "1816";


  // 只有兩種語系：顯示一顆切換按鈕
  if (supportedLangs.length === 2) {
    const other = supportedLangs.find(x => x !== activeLang) ?? supportedLangs[1];
    const switchUrl = buildSwitchTo(other);
    const intentHandlers = getIntentPrefetchHandlers(switchUrl);
    return (
      <li>
        <div className="icons">
          <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1">
            <a href={switchUrl} type="button" role="button" title={LangLabelMap?.[other] ?? other} tabIndex={0} {...intentHandlers} onClick={(e) => onLinkClick(e, other)}>
              {is1816 ?
                <div className="link-text">
                  <img src={GlobalPic} alt="" className="me-1" />
                  {other === "zh-tw" ? "中文" : "ＥＮ"}
                </div>
                :
                <div className="link-text">
                  {LangLabelMap?.[other] ?? other}
                </div>
              }
            </a>
          </div>
        </div>
      </li>
    );
  }

  // 三種以上語系：dropdown
  return (
    <li>
      <div className="icons">
        <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1 dropdown">
          <a className="dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" title="Language" tabIndex={0} onClick={(e) => e.preventDefault()}>
            <div className="link-text">{LangLabelMap?.[activeLang] ?? activeLang}</div>
          </a>

          <ul className="dropdown-menu">
            {supportedLangs.map(l => {
              const url = buildSwitchTo(l);
              const intentHandlers = getIntentPrefetchHandlers(url);

              return (
                <li key={l}>
                  <a href={url} className={`dropdown-item ${l === activeLang ? "active" : ""}`} {...intentHandlers} onClick={(e) => onLinkClick(e, l)}>
                    {LangLabelMap?.[l] ?? l}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </li>
  );
};
