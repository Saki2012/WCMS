using System.Text.Json;
using System.Text.Json.Serialization;
using WCMS.Features._Resx;
using WCMS.SysCore.Auditing.ErrorHandling;

namespace WCMS.SysCore.FeatureDriver.Api.Serialization;

/// <summary>
/// 將 JSON null 轉為指定非 Nullable Property Type 的預設值。
/// </summary>
internal sealed class LibJsonNullDefaultConverter<T>(JsonConverter? innerConverter) : JsonConverter<T>
{
    #region Property
    private readonly JsonConverter? _innerConverter = innerConverter;
    public override bool HandleNull => true;
    #endregion

    #region Public
    /// <summary>
    /// 讀取 JSON 值，null 時改用 WCMS 預設值。
    /// </summary>
    public override T? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return (T?)LibJsonDefaultValueFactory.Create(typeToConvert);

        JsonConverter<T> converter = ResolveInnerConverter(options);
        return ReadValue(converter, ref reader, typeToConvert, options);
    }

    /// <summary>
    /// 使用原型別 Converter 輸出 JSON 值。
    /// </summary>
    public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options)
    {
        JsonConverter<T> converter = ResolveInnerConverter(options);
        converter.Write(writer, value, options);
    }
    #endregion

    #region Private
    /// <summary>
    /// 讀取非 null JSON 值，並將可預期的格式錯誤轉為 WCMS JSON 例外。
    /// </summary>
    private static T? ReadValue(
        JsonConverter<T> converter,
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options)
    {
        try
        {
            return converter.Read(ref reader, typeToConvert, options);
        }
        catch (WCMSJsonException)
        {
            throw;
        }
        catch (Exception exception) when (IsInvalidJsonValueException(exception))
        {
            throw new WCMSJsonException(SysMessageCode.BECode00035, exception, "資料");
        }
    }

    /// <summary>
    /// 判斷例外是否屬於 Request JSON 值的格式或數值範圍錯誤。
    /// </summary>
    private static bool IsInvalidJsonValueException(Exception exception)
    {
        return exception is JsonException
            or FormatException
            or OverflowException;
    }

    /// <summary>
    /// 解析 Property 或型別原有的 JSON Converter。
    /// </summary>
    private JsonConverter<T> ResolveInnerConverter(JsonSerializerOptions options)
    {
        JsonConverter converter = _innerConverter ?? options.GetConverter(typeof(T));
        if (ReferenceEquals(converter, this)) throw new InvalidOperationException($"Recursive JSON converter: {typeof(T).FullName}");
        if (converter is JsonConverterFactory factory)
            converter = factory.CreateConverter(typeof(T), options)
                ?? throw new InvalidOperationException($"Cannot resolve JSON converter: {typeof(T).FullName}");
        return converter as JsonConverter<T>
            ?? throw new InvalidOperationException($"Invalid JSON converter: {typeof(T).FullName}");
    }
    #endregion
}

/// <summary>
/// 集中建立 API null 正規化所需的型別預設值。
/// </summary>
internal static class LibJsonDefaultValueFactory
{
    #region Public
    /// <summary>
    /// 判斷目前型別是否有安全且明確的預設值。
    /// </summary>
    public static bool CanCreate(Type type)
    {
        if (type == typeof(string) || type.IsValueType || type.IsArray) return true;
        if (ResolveCollectionType(type) != null) return true;
        return IsConcreteCollection(type);
    }

    /// <summary>
    /// 建立指定型別的 WCMS 預設值。
    /// </summary>
    public static object? Create(Type type)
    {
        if (type == typeof(string)) return string.Empty;
        if (type.IsArray) return Array.CreateInstance(type.GetElementType()!, 0);
        Type? concreteType = ResolveCollectionType(type);
        return Activator.CreateInstance(concreteType ?? type);
    }
    #endregion

    #region Private
    /// <summary>
    /// 判斷是否為可安全建立空值的具體集合。
    /// </summary>
    private static bool IsConcreteCollection(Type type)
    {
        if (type.IsAbstract || type.IsInterface) return false;
        if (!typeof(System.Collections.IEnumerable).IsAssignableFrom(type)) return false;
        return type.GetConstructor(Type.EmptyTypes) != null;
    }

    /// <summary>
    /// 將常用集合介面解析為可建立的實體型別。
    /// </summary>
    private static Type? ResolveCollectionType(Type type)
    {
        if (!type.IsInterface || !type.IsGenericType) return null;
        Type definition = type.GetGenericTypeDefinition();
        Type[] args = type.GetGenericArguments();
        if (IsDictionary(definition)) return typeof(Dictionary<,>).MakeGenericType(args);
        if (IsSet(definition)) return typeof(HashSet<>).MakeGenericType(args);
        if (IsList(definition)) return typeof(List<>).MakeGenericType(args);
        return null;
    }

    /// <summary>
    /// 判斷是否為字典介面。
    /// </summary>
    private static bool IsDictionary(Type definition)
    {
        return definition == typeof(IDictionary<,>) || definition == typeof(IReadOnlyDictionary<,>);
    }

    /// <summary>
    /// 判斷是否為集合介面。
    /// </summary>
    private static bool IsSet(Type definition)
    {
        return definition == typeof(ISet<>) || definition == typeof(IReadOnlySet<>);
    }

    /// <summary>
    /// 判斷是否為清單介面。
    /// </summary>
    private static bool IsList(Type definition)
    {
        return definition == typeof(IEnumerable<>) || definition == typeof(ICollection<>)
            || definition == typeof(IList<>) || definition == typeof(IReadOnlyCollection<>)
            || definition == typeof(IReadOnlyList<>);
    }
    #endregion
}
