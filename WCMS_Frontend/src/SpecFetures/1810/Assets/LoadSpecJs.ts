// import "./Client/Content/bootstrap-5.3.3/js/bootstrap.bundle.min.js";
// import "./Client/Content/owlcarousel_2/owl.carousel_v2.3.4.js";

import bootstrapUrl from "./Client/Content/bootstrap-5.3.3/js/bootstrap.bundle.min.js?url";
import jqueryUrl from "./Client/Content/jquery-3.4.1/jquery-3.7.1.min.js?url";
import owlUrl from "./Client/Content/owlcarousel_2/owl.carousel_v2.3.4.js?url";

/** 共用：用 <script> 動態掛載一支 JS（以同步順序載入） */
const loadScript = (src: string) =>
    new Promise<void>((resolve, reject) =>
    {
        const s = document.createElement("script");
        s.src = src;
        s.async = false; // 保持原本同步順序
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(s);
    });

/** 先載 Bootstrap / Swiper（不依賴 jQuery） */
const loadBootstrapAndSwiper = async () =>
{
    await Promise.all([
        loadScript(bootstrapUrl),
    ]);
};

/** 再載 jQuery + 相關外掛（owl / ekko） */
const loadJQueryAndPlugins = async () =>
{
    await loadScript(jqueryUrl);

    // 確保 jQuery 掛到 global（舊版外掛都會用到）
    const w = window as any;
    if (w.jQuery)
    {
        w.$ = w.jQuery;
    }

    await Promise.all([
        loadScript(owlUrl),
    ]);
};

// 這支檔案一被 import 就開始載入
void (async () =>
{
    // 先保證 Bootstrap / Swiper 有載
    await loadBootstrapAndSwiper();

    // jQuery 外掛可以不用等（你有些地方只用 Bootstrap collapse）
    void loadJQueryAndPlugins();
})();
