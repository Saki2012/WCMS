using System.Text.Json;
using System.Text.Json.Serialization;

namespace WCMS.SysCore.I18n
{
    [JsonConverter(typeof(LangCodeJsonConverter))]
    public enum LangCode
    {
        /// <summary>
        /// 繁體中文
        /// </summary>
        zhtw,
        /// <summary>
        /// 檢體中文
        /// </summary>
        zhcn,
        /// <summary>
        /// 英文
        /// </summary>
        en,
    }

    public static class LangCodeExt
    {
        public static string ToCode(this LangCode lang) => lang switch
        {
            LangCode.zhtw => "zh-tw",
            LangCode.zhcn => "zh-cn",
            LangCode.en => "en",
            _ => "zh-tw"
        };

        public static string ToLabel(this LangCode lang) => lang switch
        {
            LangCode.zhtw => "繁體中文",
            LangCode.zhcn => "簡體中文",
            LangCode.en => "English",
            _ => "繁體中文"
        };

        /// <summary>
        /// 外部輸入（route/query/cookie/header/db）→ 收斂成 canonical enum
        /// </summary>
        public static bool TryParse(string? raw, out LangCode lang)
        {
            var v = (raw ?? "").Trim().ToLowerInvariant();
            lang = v switch
            {
                // zh
                "zh-tw" or "zh-hant" or "zh-hk" => LangCode.zhtw,
                "zh-cn" or "zh-hans" or "zh-sg" => LangCode.zhcn,
                // en aliases → en
                "en" or "en-us" or "en-gb" or "en-au" => LangCode.en,
                _ => default
            };

            return v is 
                "zh-tw" or "zh-hant" or "zh-hk" or
                "zh-cn" or "zh-hans" or "zh-sg" or
                "en" or "en-us" or "en-gb" or "en-au";
        }

        public static LangCode Normalize(string? raw)
            => TryParse(raw, out var lang) ? lang : LangCode.zhtw;
    }

    /// <summary>
    /// 讓 LangCode 在 JSON 永遠以 "zh-tw"/"en" 形式輸出，且讀入也接受 alias。
    /// 同時支援 LangCode 與 LangCode?
    /// </summary>
    public sealed class LangCodeJsonConverter : JsonConverterFactory
    {
        public override bool CanConvert(Type typeToConvert)
            => typeToConvert == typeof(LangCode) || typeToConvert == typeof(LangCode?);

        public override JsonConverter CreateConverter(Type typeToConvert, JsonSerializerOptions options)
        {
            if (typeToConvert == typeof(LangCode)) return new NonNullable();
            if (typeToConvert == typeof(LangCode?)) return new Nullable();
            throw new NotSupportedException($"LangCodeJsonConverter cannot convert {typeToConvert}.");
        }

        private sealed class NonNullable : JsonConverter<LangCode>
        {
            public override LangCode Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            {
                if (reader.TokenType != JsonTokenType.String) throw new JsonException("LangCode must be a string.");
                return LangCodeExt.Normalize(reader.GetString());
            }

            public override void Write(Utf8JsonWriter writer, LangCode value, JsonSerializerOptions options)
                => writer.WriteStringValue(value.ToCode());
        }

        private sealed class Nullable : JsonConverter<LangCode?>
        {
            public override LangCode? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            {
                if (reader.TokenType == JsonTokenType.Null) return null;
                if (reader.TokenType != JsonTokenType.String) throw new JsonException("LangCode must be a string or null.");
                return LangCodeExt.Normalize(reader.GetString());
            }

            public override void Write(Utf8JsonWriter writer, LangCode? value, JsonSerializerOptions options)
            {
                if (!value.HasValue) { writer.WriteNullValue(); return; }
                writer.WriteStringValue(value.Value.ToCode());
            }
        }
    }

    public static class LangCodeJson
    {
        /// <summary>LangCode[] -> JSON array string, e.g. ["zh-tw","en"]</summary>
        public static string ToJsonArray(params LangCode[] langs)
        {
            var codes = (langs ?? Array.Empty<LangCode>())
                .Select(x => x.ToCode())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            return JsonSerializer.Serialize(codes);
        }

        /// <summary>string[] (codes) -> JSON array string, normalize+dedupe</summary>
        public static string ToJsonArrayFromCodes(params string[] codes)
        {
            var list = (codes ?? Array.Empty<string>())
                .Select(x => LangCodeExt.Normalize(x).ToCode())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            return JsonSerializer.Serialize(list);
        }

        /// <summary>Parse JSON array string -> LangCode list, with fallback.</summary>
        public static List<LangCode> Parse(string? json, params LangCode[] fallback)
        {
            var fb = (fallback?.Length ?? 0) > 0
                ? fallback.Distinct().ToList()
                : new List<LangCode> { LangCode.zhtw, LangCode.en };

            if (string.IsNullOrWhiteSpace(json)) return fb;

            try
            {
                var arr = JsonSerializer.Deserialize<List<string>>(json) ?? new();
                var result = arr.Select(LangCodeExt.Normalize).Distinct().ToList();
                return result.Count > 0 ? result : fb;
            }
            catch
            {
                return fb;
            }
        }
    }

}
