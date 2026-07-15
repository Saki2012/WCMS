using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Api.Contracts;

namespace WCMS.SysCore.PlatformServices.Captcha;

/*
 * ============================================================
 * WCMS Captcha / Cloudflare Turnstile 設定與維護說明
 * ============================================================
 *
 * 一、功能定位
 * ------------------------------------------------------------
 * Captcha 是 WCMS 系統層級的匿名表單防機器人驗證功能。
 * 此功能不是一般資料表 CRUD，也不需要後台 ProgId / FuncAction 權限。
 *
 * 因此 CaptchaController 使用 ControllerBase，不繼承 ApiBaseController。
 * ApiBaseController 主要用於資料表型 API，例如 QueryList / QueryData / 權限 / ModelDisplay 等流程。
 * Captcha 僅提供系統驗證設定與驗證服務，不屬於一般資料管理功能。
 *
 * 目前採用 Cloudflare Turnstile Managed 模式。
 * 前端會透過本 API 取得 SiteKey，渲染 Turnstile widget。
 * 使用者完成驗證後，前端取得一次性 token，並在送出表單時傳回後端。
 * 後端必須使用 SecretKey 呼叫 Cloudflare Siteverify 驗證 token，成功後才可寫入資料。
 *
 *
 * 二、Cloudflare Dashboard 申請流程
 * ------------------------------------------------------------
 * 1. 登入 Cloudflare Dashboard：
 *    https://dash.cloudflare.com/
 *
 * 2. 進入 Turnstile：
 *    Protect & Connect
 *    → Application security
 *    → Turnstile
 *    → Add widget
 *
 * 3. 建立 Widget 時建議設定：
 *
 *    Widget name：
 *    WCMS-Shared-Turnstile
 *
 *    Widget Mode：
 *    Managed (Recommended)
 *
 *    Hostname Management：
 *    填入允許使用此 Turnstile widget 的正式網域。
 *
 *    範例：
 *    wcms1820.it-easygoapp.com
 *
 * 4. Hostname 只填網域，不要填 protocol、port、path。
 *
 *    正確：
 *    wcms1820.it-easygoapp.com
 *
 *    錯誤：
 *    https://wcms1820.it-easygoapp.com
 *    http://wcms1820.it-easygoapp.com
 *    wcms1820.it-easygoapp.com:443
 *    wcms1820.it-easygoapp.com/contact
 *
 * 5. 建立完成後會取得兩個 key：
 *
 *    SiteKey：
 *    可公開給前端使用。
 *    本 API 的 Public_GetConfig 會回傳 SiteKey 給前端。
 *
 *    SecretKey：
 *    僅能放在後端 appsettings / appsettings.production.json / 環境變數。
 *    不可回傳前端，不可寫入前端專案。
 *
 *
 * 三、共用 Turnstile Key 的維護規則
 * ------------------------------------------------------------
 * 目前 WCMS 可先共用同一組 Turnstile SiteKey / SecretKey。
 * 但共用時需分成兩層控管：
 *
 * 1. Cloudflare Turnstile Hostname Management
 *    這是 Cloudflare 後台的總白名單。
 *    需要放所有允許使用這組 SiteKey / SecretKey 的客戶網域。
 *
 * 2. appsettings Captcha.AllowedHostnames
 *    這是目前這個後端 case 的白名單。
 *    每個 case 只放自己的正式網域。
 *
 * 範例：
 *
 * Cloudflare 後台 Hostname Management：
 * wcms1819.it-easygoapp.com
 * wcms1820.it-easygoapp.com
 * www.client-a.gov.tw
 *
 * WCMS1820 appsettings：
 * "AllowedHostnames": [ "wcms1820.it-easygoapp.com" ]
 *
 * Client-A appsettings：
 * "AllowedHostnames": [ "www.client-a.gov.tw" ]
 *
 * 也就是：
 * Cloudflare 後台 Hostname = 總白名單
 * appsettings AllowedHostnames = 目前此 case 的白名單
 *
 * 新增客戶正式站時，至少要確認兩個地方：
 * 1. Cloudflare Turnstile Widget 追加該客戶 hostname
 * 2. 該 case 的 appsettings Captcha.AllowedHostnames 追加該客戶 hostname
 *
 *
 * 四、appsettings.json 設定範例
 * ------------------------------------------------------------
 * "Captcha": {
 *   "Enabled": true,
 *   "Provider": "Turnstile",
 *   "SiteKey": "Cloudflare Turnstile SiteKey",
 *   "SecretKey": "Cloudflare Turnstile SecretKey",
 *   "TimeoutSeconds": 10,
 *   "AllowedHostnames": [
 *     "wcms1820.it-easygoapp.com"
 *   ]
 * }
 *
 * 欄位說明：
 *
 * Enabled：
 * 驗證碼總開關。
 * false 時 Captcha_BIZ.VerifyAsync 會直接視為通過。
 * true 時會要求前端 token 並呼叫 Cloudflare Siteverify。
 *
 * Provider：
 * 目前支援 Turnstile。
 * 保留此欄位是為了未來如果要改接 Google reCAPTCHA、hCaptcha 或自製 Captcha，可在 BIZ 層擴充。
 *
 * SiteKey：
 * 前端 Turnstile widget 使用。
 * 可透過 Public_GetConfig 回傳給前端。
 * 這不是敏感資料。
 *
 * SecretKey：
 * 後端呼叫 Cloudflare Siteverify API 使用。
 * 不可回傳前端。
 * 正式環境建議放 appsettings.production.json 或環境變數。
 *
 * TimeoutSeconds：
 * 後端呼叫 Cloudflare Siteverify API 的等待秒數。
 * 這不是使用者填表時間限制。
 * 使用者填表很久導致 Turnstile token 過期時，應由前端 reset widget 並要求重新驗證。
 *
 * AllowedHostnames：
 * 後端驗證 Cloudflare Siteverify 回傳的 hostname 是否符合此 case。
 * 空陣列代表不檢查 hostname。
 * 正式 case 建議填入該 case 實際網域。
 *
 *
 * 五、前後端驗證流程
 * ------------------------------------------------------------
 * 1. 前端呼叫：
 *    GET /Service/Captcha/Public_GetConfig
 *
 * 2. 前端取得：
 *    Enabled / Provider / SiteKey
 *
 * 3. 如果 Enabled = false：
 *    前端可不顯示 Turnstile，後端 VerifyAsync 也會直接通過。
 *
 * 4. 如果 Enabled = true：
 *    前端使用 SiteKey 渲染 Turnstile widget。
 *
 * 5. 使用者完成驗證後，Cloudflare 產生一次性 token。
 *
 * 6. 前端提交匿名表單時，將 token 放入表單 DTO。
 *    目前建議欄位名稱：CaptchaToken。
 *
 * 7. 後端匿名提交 API，例如 SurveySubmission.Public_Submit，
 *    必須在寫入資料前呼叫 Captcha_BIZ.VerifyAsync。
 *
 * 8. Captcha_BIZ 使用 SecretKey 呼叫 Cloudflare Siteverify。
 *
 * 9. 驗證成功才繼續寫入資料。
 *    驗證失敗則回傳錯誤，不寫入 DB。
 *
 *
 * 六、開關與失敗處理規則
 * ------------------------------------------------------------
 * 1. Captcha.Enabled = false
 *    代表人工明確關閉驗證碼。
 *    後端會直接略過 Captcha 檢查。
 *
 * 2. Captcha.Enabled = true 但 SecretKey 空白
 *    代表設定不完整。
 *    後端不放行，回傳「驗證碼服務尚未設定」。
 *
 * 3. Captcha.Enabled = true 但 Cloudflare Siteverify 打不到或逾時
 *    正式流程不自動略過。
 *    後端不寫入資料，回傳「驗證碼服務暫時無法驗證」。
 *
 * 4. Token 空白、過期、重複使用或驗證失敗
 *    後端不寫入資料。
 *    前端應 reset Turnstile widget，並請使用者重新驗證。
 *
 *
 * 七、安全注意事項
 * ------------------------------------------------------------
 * 1. SecretKey 不可放前端。
 * 2. SecretKey 不可由 Public_GetConfig 回傳。
 * 3. 前端取得 Turnstile token 不代表驗證完成，後端仍必須呼叫 Siteverify。
 * 4. Turnstile token 具有有效期限，且只能驗證一次。
 * 5. localhost / Swagger 測試可使用 Cloudflare 官方 testing key。
 * 6. 如果 SecretKey 曾經外流、提交到公開 Git，或已提供給非維護人員，正式上線前建議 Rotate Secret Key。
 *
 *
 * 八、目前不使用 Action 的原因
 * ------------------------------------------------------------
 * Cloudflare Turnstile 支援 action / cData，可用來區分不同表單用途。
 * 但 WCMS 第一版先不啟用 action 檢查，避免各功能散落手寫 action 字串造成後續維護困難。
 *
 * 目前第一版防護重點為：
 * 1. 後端 Siteverify
 * 2. SecretKey 只在後端使用
 * 3. AllowedHostnames 檢查來源網域
 * 4. 匿名表單寫入 DB 前必須先驗證
 *
 * 若未來需要啟用 action，請集中建立 CaptchaActions 常數，避免在各功能中散落字串。
 */

/// <summary>
/// 驗證碼系統功能 API。
/// </summary>
/// <remarks>
/// 此 Controller 僅提供前端讀取 Captcha 公開設定。
/// 實際 token 驗證流程應由各匿名提交 API 在寫入資料前呼叫 Captcha_BIZ.VerifyAsync。
/// </remarks>
[ApiController, Route(SysParam.ApiRoutes.Service)]
public class CaptchaController(ICaptchaBiz captchaBiz) : ControllerBase
{
    #region Property
    private readonly ICaptchaBiz CaptchaBiz = captchaBiz;
    #endregion

    #region Public
    /// <summary>
    /// 取得前台驗證碼公開設定。
    /// </summary>
    /// <remarks>
    /// 前端透過此 API 取得 Turnstile SiteKey。
    ///
    /// 此 API 僅允許回傳可公開資訊：
    /// Enabled、Provider、SiteKey。
    ///
    /// SecretKey 不可由此 API 回傳。
    /// SecretKey 僅能留在後端 Captcha_BIZ 呼叫 Cloudflare Siteverify 時使用。
    /// </remarks>
    [HttpGet(nameof(Public_GetConfig)), AllowAnonymous, IgnoreAntiforgeryToken]
    [ProducesResponseType(typeof(ApiResponse<CaptchaPublicConfig_DTO>), StatusCodes.Status200OK)]
    public IActionResult Public_GetConfig()
    {
        ApiResponse<CaptchaPublicConfig_DTO> response = new() { Data = [CaptchaBiz.GetPublicConfig()] };
        return Ok(response);
    }
    #endregion
}
