namespace WCMS.Features.WEB.SiteViewCount;

#region API 請求/回應 DTO
/// <summary>
/// 主站瀏覽次數請求
/// </summary>
public class TryCountSiteViewRequest_DTO
{
    /// <summary>
    /// 站台代碼(主站可為空字串)
    /// </summary>
    public string SiteIndex { get; set; } = string.Empty;
}
/// <summary>
/// 功能/頁面計次請求
/// </summary>
public class TryCountDetailViewRequest_DTO
{
    /// <summary>
    /// 站台代碼(主站可為空字串)
    /// </summary>
    public string SiteIndex { get; set; } = string.Empty;
    /// <summary>
    /// 功能代碼
    /// </summary>
    public string ProgId { get; set; } = string.Empty;
    /// <summary>
    /// 目標資料 InternalId
    /// </summary>
    public string InternalId { get; set; } = string.Empty;
}
/// <summary>
/// 回應嘗試累加瀏覽次數結果的 DTO
/// </summary>
public class TryCountResult_DTO
{
    /// <summary>
    /// 本次是否實際累加
    /// </summary>
    public bool IsCounted { get; set; }
    /// <summary>
    /// 最新總數
    /// </summary>
    public int CurrentCount { get; set; }
}

/// <summary>
/// 查詢目前站台在線人數 Request
/// </summary>
public class GetCurrentSiteOnlineCountRequest_DTO
{
    /// <summary>
    /// 站台代碼，主站可為空字串
    /// </summary>
    public string SiteIndex { get; set; } = string.Empty;

    /// <summary>
    /// 往前查詢幾分鐘，未帶預設 10
    /// </summary>
    public int? Minutes { get; set; }
}

/// <summary>
/// 查詢目前站台在線人數 Result
/// </summary>
public class GetCurrentSiteOnlineCountResult_DTO
{
    /// <summary>
    /// 站台代碼
    /// </summary>
    public string SiteIndex { get; set; } = string.Empty;

    /// <summary>
    /// 實際查詢分鐘數
    /// </summary>
    public int Minutes { get; set; }

    /// <summary>
    /// 在線人數
    /// </summary>
    public int CurrentOnlineCount { get; set; }

    /// <summary>
    /// 查詢時間
    /// </summary>
    public DateTime QueryTime { get; set; }
}
#endregion
