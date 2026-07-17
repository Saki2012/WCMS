using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;
using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Biz;

namespace WCMS.SpecFeatures.Spec1820.WEB.SpecHomePage;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.HomePageSetting)]
public class SpecHomePage1820_Biz(BizDeps bizDeps, IHttpClientFactory httpClientFactory, IMemoryCache memoryCache) : BizService<SpecHomePage1820>(bizDeps)
{
    #region Property
    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;
    private readonly IMemoryCache _memoryCache = memoryCache;
    private const string _CwaApiKey = "CWA-C6803308-F451-4A6F-A4D5-5DF89E6B4E58";
    private const string _CityCode = "F-D0047-077";
    private const string _LocationName = "新化區";

    private static readonly SemaphoreSlim WeatherCacheLock = new(1, 1);
    private static readonly TimeSpan WeatherCacheTtl = TimeSpan.FromHours(3);
    private static readonly TimeSpan WeatherStaleCacheTtl = TimeSpan.FromHours(12);
    private const string WeatherCacheKey = "Spec1820:HomePage:Weather:F-D0047-077:新化區";
    private const string WeatherStaleCacheKey = WeatherCacheKey + ":Stale";
    #endregion

    #region Public
    /// <summary>
    /// 取得中央氣象署天氣資訊，使用三小時快取避免弱掃或高流量打爆外部 API
    /// </summary>
    /// <param name="ct">取消權杖</param>
    /// <returns></returns>
    public async Task<SpecHomePageWeather_DTO> GetWeatherDataAsync(CancellationToken ct = default)
    {
        if (TryGetWeatherCache(WeatherCacheKey, out SpecHomePageWeather_DTO cached)) return cached;
        await WeatherCacheLock.WaitAsync(ct);

        try
        {
            if (TryGetWeatherCache(WeatherCacheKey, out cached)) return cached;
            SpecHomePageWeather_DTO result = await FetchWeatherDataAsync(ct);
            SetWeatherCache(result);
            return result;
        }
        catch (Exception) when (!ct.IsCancellationRequested)
        {
            if (TryGetWeatherCache(WeatherStaleCacheKey, out SpecHomePageWeather_DTO stale)) return stale;
            throw;
        }
        finally
        {
            WeatherCacheLock.Release();
        }
    }
    #endregion

    #region Private

    /// <summary>
    /// 組合中央氣象署 API Url
    /// </summary>
    /// <param name="apiKey">API Key</param>
    /// <param name="cityCode">城市資料代碼</param>
    /// <param name="locationName">地區名稱</param>
    /// <returns></returns>
    private static string CwaUrl
    {
        get {
            string elements = string.Join(",",[WeatherConsts.ElementTemperature,WeatherConsts.ElementHumidity,WeatherConsts.ElementApparentTemperature,WeatherConsts.ElementPop3H,WeatherConsts.ElementWeather,]);
            return $"{WeatherConsts.ApiBase}/{Uri.EscapeDataString(_CityCode)}" + $"?Authorization={Uri.EscapeDataString(_CwaApiKey)}" + $"&locationName={Uri.EscapeDataString(_LocationName)}" + $"&elementName={Uri.EscapeDataString(elements)}"; 
        }
    }

    /// <summary>
    /// 解析中央氣象署回傳資料
    /// </summary>
    /// <param name="root">JSON Root</param>
    /// <param name="request">查詢條件</param>
    /// <returns></returns>
    private static SpecHomePageWeather_DTO ParseWeather(JsonElement root)
    {
        JsonElement location = GetLocation(root);
        JsonElement weatherElements = location.GetProperty(WeatherConsts.JsonWeatherElement);
        JsonElement? wx = FindWeatherElement(weatherElements, WeatherConsts.ElementWeather, WeatherConsts.CodeWeather);
        JsonElement? temp = FindWeatherElement(weatherElements, WeatherConsts.ElementTemperature, WeatherConsts.CodeTemperature);
        JsonElement? apparentTemp = FindWeatherElement(weatherElements, WeatherConsts.ElementApparentTemperature, WeatherConsts.CodeApparentTemperature);
        JsonElement? humidity = FindWeatherElement(weatherElements, WeatherConsts.ElementHumidity, WeatherConsts.CodeHumidity);
        JsonElement? pop = FindWeatherElement(weatherElements, WeatherConsts.ElementPop3H, WeatherConsts.CodePop, WeatherConsts.CodePop6H);
        JsonElement? time = GetFirstTime(wx) ?? GetFirstTime(temp) ?? GetFirstTime(apparentTemp) ?? GetFirstTime(humidity) ?? GetFirstTime(pop);
        return new()
        {
            CityCode = _CityCode,
            LocationName = _LocationName,
            Weather = ReadElementValue(wx, WeatherConsts.ValueWeather),
            Temperature = ReadElementValue(temp, WeatherConsts.ValueTemperature),
            ApparentTemperature = ReadElementValue(apparentTemp, WeatherConsts.ValueApparentTemperature),
            RelativeHumidity = ReadElementValue(humidity, WeatherConsts.ValueRelativeHumidity),
            ProbabilityOfPrecipitation = ReadElementValue(pop, WeatherConsts.ValueProbabilityOfPrecipitation),
            StartTime = ReadDateTime(time, WeatherConsts.JsonStartTime, WeatherConsts.JsonDataTime),
            EndTime = ReadDateTime(time, WeatherConsts.JsonEndTime, WeatherConsts.JsonStopTime),
            FetchTime = DateTime.Now,
        };
    }

    /// <summary>
    /// 取得第一筆地區資料
    /// </summary>
    /// <param name="root">JSON Root</param>
    /// <returns></returns>
    private static JsonElement GetLocation(JsonElement root)
    {
        JsonElement records = root.GetProperty(WeatherConsts.JsonRecords);
        JsonElement locations = GetFirstArrayItem(records, WeatherConsts.JsonLocations);
        return GetFirstArrayItem(locations, WeatherConsts.JsonLocation);
    }

    /// <summary>
    /// 取得指定陣列欄位的第一筆資料
    /// </summary>
    /// <param name="parent">父節點</param>
    /// <param name="propertyName">陣列欄位名</param>
    /// <returns></returns>
    private static JsonElement GetFirstArrayItem(JsonElement parent, string propertyName)
    {
        JsonElement item = parent.GetProperty(propertyName).EnumerateArray().FirstOrDefault();
        if (item.ValueKind != JsonValueKind.Undefined) return item;
        throw new InvalidOperationException($"中央氣象署回傳缺少 {propertyName} 資料。");
    }

    /// <summary>
    /// 依欄位名稱找指定天氣元素
    /// </summary>
    /// <param name="items">天氣元素陣列</param>
    /// <param name="names">可能的名稱</param>
    /// <returns></returns>
    private static JsonElement? FindWeatherElement(JsonElement items, params string[] names)
    {
        foreach (JsonElement item in items.EnumerateArray())
        {
            string name = ReadString(item, WeatherConsts.JsonElementName);
            if (names.Any(x => string.Equals(x, name, StringComparison.OrdinalIgnoreCase))) return item;
        }

        return null;
    }

    /// <summary>
    /// 取得天氣元素第一筆時間區間
    /// </summary>
    /// <param name="weatherElement">天氣元素</param>
    /// <returns></returns>
    private static JsonElement? GetFirstTime(JsonElement? weatherElement)
    {
        if (weatherElement == null) return null;
        if (!weatherElement.Value.TryGetProperty(WeatherConsts.JsonTime, out JsonElement times)) return null;

        JsonElement time = times.EnumerateArray().FirstOrDefault();
        return time.ValueKind == JsonValueKind.Undefined ? null : time;
    }

    /// <summary>
    /// 讀取第一筆 Time -> ElementValue 中的指定值
    /// </summary>
    /// <param name="weatherElement">天氣元素</param>
    /// <param name="targetName">目標欄位名</param>
    /// <returns></returns>
    private static string ReadElementValue(JsonElement? weatherElement, string targetName)
    {
        JsonElement? time = GetFirstTime(weatherElement);
        JsonElement? value = GetFirstElementValue(time);
        if (value == null) return string.Empty;
        if (value.Value.TryGetProperty(targetName, out JsonElement result)) return result.GetString() ?? string.Empty;
        return ReadFirstStringValue(value.Value);
    }

    /// <summary>
    /// 取得第一筆 Time 下的 ElementValue
    /// </summary>
    /// <param name="time">時間節點</param>
    /// <returns></returns>
    private static JsonElement? GetFirstElementValue(JsonElement? time)
    {
        if (time == null) return null;
        if (!time.Value.TryGetProperty(WeatherConsts.JsonElementValue, out JsonElement values)) return null;

        JsonElement value = values.EnumerateArray().FirstOrDefault();
        return value.ValueKind == JsonValueKind.Undefined ? null : value;
    }

    /// <summary>
    /// 讀取物件中的第一個字串值
    /// </summary>
    /// <param name="element">JSON 物件</param>
    /// <returns></returns>
    private static string ReadFirstStringValue(JsonElement element)
    {
        foreach (JsonProperty prop in element.EnumerateObject())
        {
            if (prop.Value.ValueKind == JsonValueKind.String) return prop.Value.GetString() ?? string.Empty;
        }

        return element.ToString();
    }

    /// <summary>
    /// 讀取 JSON 指定字串欄位
    /// </summary>
    /// <param name="element">JSON 物件</param>
    /// <param name="propertyName">欄位名</param>
    /// <returns></returns>
    private static string ReadString(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out JsonElement value) ? value.GetString() ?? string.Empty : string.Empty;
    }

    /// <summary>
    /// 讀取時間欄位
    /// </summary>
    /// <param name="time">時間物件</param>
    /// <param name="propertyNames">欄位名</param>
    /// <returns></returns>
    private static DateTime? ReadDateTime(JsonElement? time, params string[] propertyNames)
    {
        if (time == null) return null;
        foreach (string propertyName in propertyNames)
        {
            if (!time.Value.TryGetProperty(propertyName, out JsonElement value)) continue;
            if (DateTime.TryParse(value.GetString(), out DateTime result)) return result;
        }
        return null;
    }

    /// <summary>
    /// 實際呼叫中央氣象署 API
    /// </summary>
    /// <param name="ct">取消權杖</param>
    /// <returns></returns>
    private async Task<SpecHomePageWeather_DTO> FetchWeatherDataAsync(CancellationToken ct)
    {
        using var http = _httpClientFactory.CreateClient();
        http.Timeout = TimeSpan.FromSeconds(5);

        using var res = await http.GetAsync(CwaUrl, ct);
        res.EnsureSuccessStatusCode();

        await using var stream = await res.Content.ReadAsStreamAsync(ct);
        using JsonDocument doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

        return ParseWeather(doc.RootElement);
    }

    /// <summary>
    /// 嘗試取得天氣快取資料
    /// </summary>
    /// <param name="key">快取 Key</param>
    /// <param name="data">天氣資料</param>
    /// <returns></returns>
    private bool TryGetWeatherCache(string key, out SpecHomePageWeather_DTO data)
    {
        if (_memoryCache.TryGetValue(key, out SpecHomePageWeather_DTO? cached) && cached != null)
        {
            data = cached;
            return true;
        }
        data = new();
        return false;
    }
    /// <summary>
    /// 寫入三小時主要快取與十二小時備援快取
    /// </summary>
    /// <param name="data">天氣資料</param>
    private void SetWeatherCache(SpecHomePageWeather_DTO data)
    {
        _memoryCache.Set(WeatherCacheKey, data, new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = WeatherCacheTtl });
        _memoryCache.Set(WeatherStaleCacheKey, data, new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = WeatherStaleCacheTtl });
    }
    #endregion
}
/// <summary>
/// 天氣 API 相關常數
/// </summary>
internal static class WeatherConsts
{
    public const string ApiBase = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";

    public const string DefaultCityCode = "F-D0047-077";
    public const string DefaultLocationName = "新化區";

    public const string ElementWeather = "天氣現象";
    public const string ElementTemperature = "溫度";
    public const string ElementApparentTemperature = "體感溫度";
    public const string ElementHumidity = "相對濕度";
    public const string ElementPop3H = "3小時降雨機率";

    public const string CodeWeather = "Wx";
    public const string CodeTemperature = "T";
    public const string CodeApparentTemperature = "AT";
    public const string CodeHumidity = "RH";
    public const string CodePop = "PoP";
    public const string CodePop6H = "PoP6h";

    public const string JsonRecords = "records";
    public const string JsonLocations = "Locations";
    public const string JsonLocation = "Location";
    public const string JsonWeatherElement = "WeatherElement";
    public const string JsonElementName = "ElementName";
    public const string JsonTime = "Time";
    public const string JsonElementValue = "ElementValue";
    public const string JsonStartTime = "StartTime";
    public const string JsonEndTime = "EndTime";
    public const string JsonStopTime = "StopTime";
    public const string JsonDataTime = "DataTime";

    public const string ValueWeather = "Weather";
    public const string ValueTemperature = "Temperature";
    public const string ValueApparentTemperature = "ApparentTemperature";
    public const string ValueRelativeHumidity = "RelativeHumidity";
    public const string ValueProbabilityOfPrecipitation = "ProbabilityOfPrecipitation";
}