using System.Text.Json;
using System.Text.Json.Serialization;
namespace WCMS.SysCore.Library;

/// <summary>
/// 提供 JSON 序列化、資料快照與 JsonElement 型別轉換。
/// </summary>
public static partial class LibData
{
    #region Public
    /// <summary>
    /// 將物件序列化為 UTF-8 位元組陣列。
    /// </summary>
    public static byte[] ObjectToByteArray(this object obj)
    {
        return JsonSerializer.SerializeToUtf8Bytes(obj, obj.GetType());
    }
    /// <summary>
    /// 將 UTF-8 位元組陣列反序列化為指定型別。
    /// </summary>
    public static T ByteArrayToObject<T>(this byte[] bytes)
    {
        return JsonSerializer.Deserialize<T>(bytes);
    }
    /// <summary>
    /// 建立只供比對或紀錄使用的深層資料快照。
    /// </summary>
    public static T Snapshot<T>(this T obj)
    {
        var opt = new JsonSerializerOptions
        {
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
            MaxDepth = 128
        };
        var json = JsonSerializer.Serialize(obj, opt);
        return JsonSerializer.Deserialize<T>(json, opt)!;
    }
    /// <summary>
    /// 將 JsonElement 轉換為 C# 可使用的基礎型別。
    /// </summary>
    public static object ConvertJsonElement(this JsonElement jsonElement)
    {
        switch (jsonElement.ValueKind)
        {
            case JsonValueKind.String:
                return jsonElement.GetString();
            case JsonValueKind.Number:
                if (jsonElement.TryGetInt32(out int intVal)) return intVal;
                if (jsonElement.TryGetInt64(out long longVal)) return longVal;
                if (jsonElement.TryGetDouble(out double doubleVal)) return doubleVal;
                if (jsonElement.TryGetDecimal(out decimal decimalVal)) return decimalVal;
                return jsonElement;
            case JsonValueKind.True:
            case JsonValueKind.False:
                return jsonElement.GetBoolean();
            case JsonValueKind.Null: return null;
            default: return jsonElement;
        }
    }
    /// <summary>
    /// 將物件陣列中的 JsonElement 轉換為 C# 基礎型別。
    /// </summary>
    public static object[] ConvertJsonElement(object[] key)
    {
        return [.. key.Select(x =>
        {
            if (x is JsonElement jsonElement) return ConvertJsonElement(jsonElement);
            return x;
        })];
    }
    #endregion
}
