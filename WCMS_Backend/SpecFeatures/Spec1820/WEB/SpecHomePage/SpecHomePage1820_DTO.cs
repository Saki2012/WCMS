namespace WCMS.SpecFeatures.Spec1820.WEB.SpecHomePage;

/// <summary>
/// 首頁天氣資訊。
/// </summary>
public class SpecHomePageWeather_DTO
{
    /// <summary>
    /// 中央氣象署資料集代碼。
    /// </summary>
    public string CityCode { get; set; } = string.Empty;
    /// <summary>
    /// 地區名稱。
    /// </summary>
    public string LocationName { get; set; } = string.Empty;
    /// <summary>
    /// 天氣現象。
    /// </summary>
    public string Weather { get; set; } = string.Empty;
    /// <summary>
    /// 溫度。
    /// </summary>
    public string Temperature { get; set; } = string.Empty;
    /// <summary>
    /// 體感溫度。
    /// </summary>
    public string ApparentTemperature { get; set; } = string.Empty;
    /// <summary>
    /// 相對濕度。
    /// </summary>
    public string RelativeHumidity { get; set; } = string.Empty;
    /// <summary>
    /// 降雨機率。
    /// </summary>
    public string ProbabilityOfPrecipitation { get; set; } = string.Empty;
    /// <summary>
    /// 預報開始時間。
    /// </summary>
    public DateTime? StartTime { get; set; }
    /// <summary>
    /// 預報結束時間。
    /// </summary>
    public DateTime? EndTime { get; set; }
    /// <summary>
    /// 後端抓取時間。
    /// </summary>
    public DateTime FetchTime { get; set; }
}
