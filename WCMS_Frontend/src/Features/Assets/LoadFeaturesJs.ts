// LoadFeaturesJs.ts

import { setTrustedScriptElementSrc } from "@/SysCore/Security/Runtime/TrustedTypesPolicy";
import loginAnimateUrl from "./Server/ContentBack/bg_dynamic/login-particles.js?url";
import bootstrapUrl from "./Server/ContentBack/bootstrap-5.1.1/js/bootstrap.bundle.min.js?url";
import jqueryUrl from "./Server/ContentBack/jquery-3.7.1/jquery-3.7.1.min.js?url";
import ekkoUrl from "./Server/fonts/feather/feather.min.js?url";
import custompcodedUrl from "./Server/js/Custompcoded.js?url";
import owlUrl from "./Server/js/simplebarv6.2.5.min.js?url";

// #region Public
/** ✅ 新增：只在 Login 頁「DOM 已存在」時才載入 particles */
export const loadLoginParticles = async () =>
{
    if (typeof document === "undefined") return; // SSR 略過

    // 確保掛載點存在，避免 script 先跑導致失效
    const host = document.getElementById("particles-js");
    if (!host) return;

    await loadScriptOnce(loginAnimateUrl, "wcms-login-particles");
};
// #endregion

// #region Private
/** 共用：用 <script> 動態掛載一支 JS（避免重複載入） */
const loadScriptOnce = (src: string, id: string) =>
    new Promise<void>((resolve, reject) =>
    {
        if (typeof document === "undefined")
        {
            resolve(); // SSR：直接略過
            return;
        }

        if (document.getElementById(id))
        {
            resolve(); // 已載入
            return;
        }

        const s = document.createElement("script");
        s.id = id;
        setTrustedScriptElementSrc(s, src);
        s.async = false; // 保持原本同步順序
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`load script failed: ${src}`));
        document.body.appendChild(s);
    });


/** 既有：Bootstrap / 必要腳本 */
const loadBootstrapAndSwiper = async () =>
{
    await loadScriptOnce(bootstrapUrl, "wcms-bootstrap");
};


/** 既有：jQuery 與 plugins（不包含 login particles） */
const loadJQueryAndPlugins = async () =>
{
    await Promise.all([
        loadScriptOnce(jqueryUrl, "wcms-jquery"),
        loadScriptOnce(ekkoUrl, "wcms-feather"),
        loadScriptOnce(custompcodedUrl, "wcms-custompcoded"),
        loadScriptOnce(owlUrl, "wcms-simplebar"),
    ]);
};


// 這支檔案一被 import 就開始載入（維持你原本行為）
void (async () =>
{
    await loadBootstrapAndSwiper();
    void loadJQueryAndPlugins();
})();
// #endregion
