using HtmlAgilityPack;
using MimeDetective;
using MimeDetective.Storage;
using System.Collections;
using System.ComponentModel;
using System.Linq.Expressions;
using System.Net;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml;
using WCMS.SysCore.Enum;
using static MimeDetective.Definitions.DefaultDefinitions;

namespace WCMS.SysCore.Library
{
    public static class LibData
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="str"></param>
        /// <param name="vals"></param>
        /// <returns></returns>
        public static string Format(string str, params object[] vals)
        {
            int len = vals.Length;
            string[] qVals = new string[len];
            for (int i = 0; i < len; i++)
            {
                qVals[i] = vals[i].Quote();
            }
            return string.Format(str, qVals);
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="val"></param>
        /// <returns></returns>
        public static string Quote(this object val)
        {
            //Q:Null Value And DbNull
            string result = val.GetType() switch
            {
                Type stringType when stringType == typeof(string) => $"'{val}'",
                null => "Is Null",
                _ => val.ToString(),
            };
            return result;
        }
        /// <summary>
        /// 重新排序組合資料
        /// </summary>
        /// <param name="val">源字串</param>
        /// <param name="mergeStr">合併連接字 Ex:,</param>
        /// <param name="hasEmpty">是否包含空字串</param>
        /// <param name="isDesc">是否倒敘排列</param>
        /// <param name="isRemoveDuplicates">是否去除重複資料</param>
        /// <returns></returns>
        public static string Remerge(this string val, string mergeStr, bool hasEmpty = false, bool isDesc = false, bool isRemoveDuplicates = false, RemergeSortMode sortMode = RemergeSortMode.Auto)
        {
            if (string.IsNullOrWhiteSpace(val)) return string.Empty;
            var data = val.Split(mergeStr, StringSplitOptions.None).Where(p => hasEmpty || !string.IsNullOrWhiteSpace(p)).ToList();
            if (isRemoveDuplicates) data = [.. data.Distinct()];
            RemergeSortMode finalMode = sortMode == RemergeSortMode.Auto ? DetectSortMode(data) : sortMode;
            switch (finalMode)
            {
                case RemergeSortMode.Number:
                    data = [.. data.OrderBy(p => int.TryParse(p, out var num) ? num : int.MaxValue)];
                    break;
                case RemergeSortMode.Natural:
                    data = [.. data.OrderBy(p => Regex.Replace(p, @"\d+", match => match.Value.PadLeft(10, '0')))];
                    break;
                case RemergeSortMode.String:
                    data = [.. data.OrderBy(p => p)];
                    break;
                case RemergeSortMode.None:
                default: break;
            }
            if (isDesc) data.Reverse();
            return Merge(mergeStr, hasEmpty, data.ToArray());
        }
        /// <summary>
        /// 合併
        /// </summary>
        /// <param name="mergeStr"></param>
        /// <param name="hasEmpty"></param>
        /// <param name="strs"></param>
        /// <returns></returns>
        public static string Merge(char mergeStr, bool hasEmpty, params object[] strs)
        {
            return Merge(mergeStr.ToString(), hasEmpty, strs);
        }
        /// <summary>
        /// 合併
        /// </summary>
        /// <param name="mergeStr">合併連接字 Ex:,</param>
        /// <param name="hasEmpty">是否包含空字串</param>
        /// <param name="strs">組合字串組</param>
        /// <returns></returns>
        public static string Merge(string mergeStr, bool hasEmpty, params object[] strs)
        {
            if (strs == null || strs.Length == 0) return string.Empty;
            var parts = new List<string>();
            foreach (var item in strs)
            {
                var str = item?.ToString() ?? string.Empty;
                if (hasEmpty || !string.IsNullOrEmpty(str)) parts.Add(str);
            }
            return string.Join(mergeStr, parts);
        }
        /// <summary>
        /// 字串是否為空
        /// </summary>
        /// <param name="val"></param>
        /// <returns></returns>
        public static bool IsNullOrEmpty(this object val)
        {
            if (null == val)
            {
                return true;
            }

            return val.GetType() switch
            {
                Type type when type == typeof(string) => string.IsNullOrEmpty(val.ToString()),
                Type type when type == typeof(byte) => val.ToByte() == 0,
                Type type when type == typeof(short) => val.ToInt16() == 0,
                Type type when type == typeof(int) => val.ToInt32() == 0,
                Type type when type == typeof(long) => val.ToInt64() == 0,
                Type type when type == typeof(decimal) => val.ToDecimal() == decimal.Zero,
                Type type when type == typeof(float) => val.ToFloat() == 0f,
                Type type when type == typeof(double) => val.ToDouble() == 0f,
                Type type when type == typeof(DateTime) => (DateTime)val == DateTime.MinValue,
                _ => null == val || DBNull.Value == val,
            };
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="str"></param>
        /// <param name="idx"></param>
        /// <param name="len"></param>
        /// <param name="encoding"></param>
        /// <returns></returns>
        public static string ByteSubString(this string str, int idx, int len)
        {
            return str.ByteSubString(idx, len, Encoding.GetEncoding(950));
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="str"></param>
        /// <param name="idx"></param>
        /// <param name="len"></param>
        /// <param name="encoding"></param>
        /// <returns></returns>
        public static string ByteSubString(this string str, int idx, int len, Encoding encoding)
        {
            byte[] arr = encoding.GetBytes(str);
            return encoding.GetString(arr, idx, len);
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="str"></param>
        /// <returns></returns>
        public static int ByteLen(this string str)
        {
            return str.ByteLen(Encoding.GetEncoding(950));
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="str"></param>
        /// <param name="encoding"></param>
        /// <returns></returns>
        public static int ByteLen(this string str, Encoding encoding)
        {
            return encoding.GetBytes(str).Length;
        }
        /// <summary>
        /// 檢查是否為數字
        /// </summary>
        /// <param name="str"></param>
        /// <returns></returns>
        public static bool IsNumberString(this string str)
        {
            return Regex.IsMatch(str, "^[0-9]*$");
        }
        /// <summary>
        /// 包含資料
        /// </summary>
        /// <param name="val"></param>
        /// <param name="elements"></param>
        /// <returns></returns>
        public static bool In(this object val, params dynamic[] elements)
        {
            foreach (dynamic element in elements)
            {
                if (element.GetType() == val.GetType() && string.Compare(element.ToString(), val.ToString()) == 0)
                {
                    return true;
                }
            }
            return false;
        }
        /// <summary>
        /// 獲取營業日
        /// </summary>
        /// <param name="workDateDic"></param>
        /// <param name="date"></param>
        /// <param name="isNext"></param>
        /// <returns></returns>
        public static DateTime GetWorkDate(Dictionary<DateTime, bool> workDateDic, DateTime date, int days = 0, bool isNext = true)
        {
            return isNext ?
                workDateDic.Where(p => p.Value == true && p.Key >= date).OrderBy(p => p.Key).ElementAt(Math.Abs(days)).Key :
                workDateDic.Where(p => p.Value == true && p.Key <= date).OrderByDescending(p => p.Key).ElementAt(Math.Abs(days)).Key;
        }
        /// <summary>
        /// 轉換駝峰式文字
        /// </summary>
        /// <param name="s"></param>
        /// <returns></returns>
        public static string ToCamelCase(this string s)
        {
            var x = s.Replace("_", "");
            if (x.Length == 0) return s;
            x = Regex.Replace(x, "([A-Z])([A-Z]+)($|[A-Z])",
                m => m.Groups[1].Value + m.Groups[2].Value.ToLower() + m.Groups[3].Value);
            return char.ToLower(x[0]) + x.Substring(1);
        }
        /// Convert
        public static short ToInt16(this object val)
        {
            return Convert.ToInt16(val);
        }
        public static int ToInt32(this object val)
        {
            return Convert.ToInt32(val);
        }
        public static long ToInt64(this object val)
        {
            return Convert.ToInt64(val);
        }
        public static string ToString(this object val)
        {
            return Convert.ToString(val);
        }
        public static decimal ToDecimal(this object val)
        {
            if (null == val || DBNull.Value == val) return decimal.Zero;
            return Convert.ToDecimal(val);
        }
        public static double ToDouble(this object val)
        {
            return Convert.ToDouble(val);
        }
        public static float ToFloat(this object val)
        {
            return Convert.ToSingle(val);
        }
        public static byte ToByte(this object val)
        {
            return Convert.ToByte(val);
        }
        /// <summary>
        /// 獲取月初日
        /// </summary>
        /// <param name="val"></param>
        /// <returns></returns>
        public static DateTime GetFirstDate(this DateTime val)
        {
            return val.AddDays(-(val.Day - 1));
        }
        /// <summary>
        /// 獲取月末日
        /// </summary>
        /// <param name="val"></param>
        /// <returns></returns>
        public static DateTime GetLastDate(this DateTime val)
        {
            return val.GetFirstDate().AddMonths(1).AddDays(-1);
        }
        public static DateTime ToDateTime(this string val)
        {
            val = val.ToADDateFormat();
            return Convert.ToDateTime(val);
        }
        /// <summary>
        /// 西元年轉民國年
        /// </summary>
        /// <param name="datetime"></param>
        /// <returns></returns>
        public static string ToROCDate(this DateTime datetime)
        {
            string[] strsDate = datetime.AddYears(-1911).ToString("yyy/MM/dd").Split('/');
            return $"{strsDate[0]}{strsDate[1]}{strsDate[2]}";
        }
        /// <summary>
        /// 轉換為yyyy/MM/dd
        /// </summary>
        /// <param name="val"></param>
        /// <returns></returns>
        public static string ToADDateFormat(this string val)
        {
            return val.Length == 8 ? $"{val.Substring(0, 4)}/{val.Substring(4, 2)}/{val.Substring(6, 2)}" : val;
        }
        /// <summary>
        /// 民國年轉西元年
        /// </summary>
        /// <param name="val"></param>
        /// <returns></returns>
        public static DateTime ROCDateToCEDate(this string val)
        {
            return val.Length == 7 ? $"{val.Substring(0, 3).ToInt32() + 1911}/{val.Substring(3, 2)}/{val.Substring(5, 2)}".ToDateTime() : DateTime.MinValue;
        }
        /// <summary>
        /// 檢查列表是否有值
        /// </summary>
        /// <param name="val"></param>
        /// <returns></returns>
        public static bool HasData(this IList val)
        {
            return null != val && val.Count > 0;
        }
        /// <summary>
        /// 獲取亂數
        /// </summary>
        /// <param name="len"></param>
        /// <returns></returns>
        public static string GenRandomString(int len)
        {
            Random rd = new Random(Convert.ToInt32(DateTime.Now.Ticks % int.MaxValue));
            return GenRandomString(rd, len);
        }
        /// <summary>
        /// 獲取亂數
        /// </summary>
        /// <param name="rd"></param>
        /// <param name="len"></param>
        /// <returns></returns>
        public static string GenRandomString(Random rd, int len)
        {
            string result = string.Empty;
            for (int i = 0; i < len; i++)
            {
                char c = ' ';
                while (c == ' ')
                {
                    int num = rd.Next(48, 122);
                    if (num >= 48 && num <= 57 || num >= 65 && num <= 90 || num >= 97 && num <= 122)
                    {
                        c = (char)num;
                    }
                }
                result += c.ToString();
            }
            return result;
        }
        /// <summary>
        /// 獲取最底層的Exception
        /// </summary>
        /// <param name="ex"></param>
        /// <returns></returns>
        public static Exception GetInnermostException(this Exception ex)
        {
            Exception innerEx = ex;
            while (innerEx.InnerException != null)
            {
                innerEx = ex.InnerException;
            }
            return innerEx;
        }
        /// <summary>
        /// 序列化成byte[]
        /// </summary>
        /// <param name="obj"></param>
        /// <returns></returns>
        public static byte[] ObjectToByteArray(this object obj)
        {
            return JsonSerializer.SerializeToUtf8Bytes(obj, obj.GetType());
        }
        /// <summary>
        /// 反序列化
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="bytes"></param>
        /// <returns></returns>
        public static T ByteArrayToObject<T>(this byte[] bytes)
        {
            return JsonSerializer.Deserialize<T>(bytes);
        }
        /// <summary>
        /// 將 Stream 轉成 byte[]
        /// </summary>
        /// <param name="stream"></param>
        /// <returns></returns>
        public static byte[] StreamToBytes(this Stream stream)
        {
            byte[] bytes = new byte[stream.Length];
            stream.Read(bytes, 0, bytes.Length);
            stream.Seek(0, SeekOrigin.Begin);
            return bytes;
        }

        public static List<T> SumListData<T>(this List<T> val, Expression<Func<T, T, object>> propertyExpression)
        {
            //var propertyInfo = (propertyExpression.Body.NodeType == ExpressionType.Convert) ?
            //(PropertyInfo)((MemberExpression)((UnaryExpression)propertyExpression.Body).Operand).Member
            //: (PropertyInfo)((MemberExpression)propertyExpression.Body).Member;
            return val;
        }

        public static Func<object[], T> Build<T>()
        {
            var t = typeof(T);

            var param = Expression.Parameter(typeof(object[]), "args");

            var ctor = t.GetConstructors()[0];

            var argsExp = ctor.GetParameters().Select(
                (p, i) =>
                {
                    Expression index = Expression.Constant(i);
                    Expression paramAccessorExp = Expression.ArrayIndex(param, index);
                    Expression paramCastExp = Expression.Convert(paramAccessorExp, p.ParameterType);

                    return paramCastExp;
                });

            var exp = Expression.New(ctor, argsExp);

            return Expression.Lambda<Func<object[], T>>(exp, param).Compile();
        }
        /// <summary>
        /// 檢查某一欄位是否有重複
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="details"></param>
        /// <param name="keySelector"></param>
        /// <returns></returns>
        public static bool CheckItemUnique<T>(this List<T> details, Func<T, string> keySelector)
        {
            if (details == null || details.Count == 0) return true;
            if (details.Count > 10000)
            {
                var seen = new HashSet<string>();
                foreach (var item in details)
                {
                    var key = keySelector(item);
                    if (string.IsNullOrEmpty(key)) continue;
                    if (!seen.Add(key)) return false;
                }
                return true;
            }
            else { 
                return details
                    .Select(keySelector)
                    .Where(k => !string.IsNullOrEmpty(k))
                    .GroupBy(k => k)
                    .All(g => g.Count() == 1);
            }
        }
        /// <summary>
        /// 深度拷貝資料 (拷貝資料快照)
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="obj"></param>
        /// <returns></returns>
        public static T DeepClone<T>(this T obj)
        {
            var json = JsonSerializer.Serialize(obj);
            return JsonSerializer.Deserialize<T>(json);
        }
        /// <summary>
        /// 轉換Json元素成c#接受的型態
        /// </summary>
        /// <param name="jsonElement"></param>
        /// <returns></returns>
        /// <exception cref="NotSupportedException"></exception>
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
        /// 轉換Json元素成c#接受的型態
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        public static object[] ConvertJsonElement(object[] key)
        {
            return key.Select(x =>
            {
                if (x is JsonElement jsonElement) return ConvertJsonElement(jsonElement);
                return x; // 原樣回傳，如 string/int 等
            }).ToArray();
        }

        /// <summary>
        /// 獲取SHA256值
        /// </summary>
        /// <param name="file"></param>
        /// <returns></returns>
        public static string GetFileSHA256(IFormFile file)
        {
            using var ms = new MemoryStream();
            file.CopyTo(ms);
            ms.Position = 0;
            return GetFileSHA256(ms);
        }

        public static string GetFileSHA256(string filePath)
        {
            using var hashStream = File.OpenRead(filePath);
            hashStream.Position = 0;
            return GetFileSHA256(hashStream);
        }

        public static string GetFileSHA256(Stream stream)
        {
            var hashBytes = SHA256.HashData(stream);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
        }

        public static string GetFileExtenstion(Stream stream)
        {
            stream.Position = 0;
            var inspector = new ContentInspectorBuilder() { Definitions = All() }.Build();
            FileType fileType = inspector.Inspect(stream).OrderByDescending(p=>p.Points).FirstOrDefault().Definition.File;
            stream.Position = 0;
            if (fileType != null) return fileType.Extensions.FirstOrDefault().ToLowerInvariant();
            return string.Empty;
        }
        public static string GetFileMimeType(Stream stream)
        {
            stream.Position = 0;
            var inspector = new ContentInspectorBuilder() { Definitions = All() }.Build();
            FileType fileType = inspector.Inspect(stream).OrderByDescending(p => p.Points).FirstOrDefault().Definition.File;
            stream.Position = 0;
            if (fileType != null) return fileType.MimeType.ToLowerInvariant();
            return string.Empty;
        }

        public class EnumOption
        {
            public int Key { get; set; }
            public string DisplayName { get; set; }
        }

        public static class EnumHelper
        {
            public static List<EnumOption> GetEnumOptions(string enumTypeName)
            {
                var enumType = AppDomain.CurrentDomain.GetAssemblies().SelectMany(a => a.GetTypes()).FirstOrDefault(t => t.IsEnum && t.Name == enumTypeName);
                if (enumType == null) throw new ArgumentException($"Enum type '{enumTypeName}' not found.");

                return [.. System.Enum.GetValues(enumType)
                    .Cast<System.Enum>()
                    .Where(e => Convert.ToInt32(e) != 0) // 可視情況包含 None
                    .Select(e => new EnumOption
                    {
                        Key = Convert.ToInt32(e),
                        DisplayName = GetEnumDisplayName(e)
                    })];
            }

            private static string GetEnumDisplayName(System.Enum value)
            {
                var field =  value.GetType().GetField(value.ToString());
                var attr = field?.GetCustomAttribute<LibDescAttribute>();
                return attr?.Description ?? value.ToString();
            }
        }

        public static string LocalhostIp
        {
            get
            {
                if (_LocalhostIp.IsNullOrEmpty())
                {
                    IPHostEntry hostEntry = Dns.GetHostEntry(Dns.GetHostName());
                    _LocalhostIp = hostEntry.AddressList.FirstOrDefault(ip => ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork).ToString();
                }
                return _LocalhostIp;
            }
        }
        private static string _LocalhostIp { get; set; } = string.Empty;
        /// <summary>
        /// 縮小格式化XML資料
        /// </summary>
        /// <param name="htmlOrXml"></param>
        /// <returns></returns>
        public static string MinifyXml(string htmlOrXml)
        {
            try
            {
                var doc = new HtmlDocument{ OptionWriteEmptyNodes = true, OptionAutoCloseOnEnd = true, OptionFixNestedTags = true };
                doc.LoadHtml(htmlOrXml);
                using var ms = new MemoryStream();
                using var writer = new StreamWriter(ms, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
                doc.Save(writer);
                writer.Flush();
                ms.Position = 0;
                using var reader = new StreamReader(ms, Encoding.UTF8);
                string result = reader.ReadToEnd().Replace("\r", "").Replace("\n", "").Replace("\t", "").Trim();
                result = Regex.Replace(result, @"<br\s*>", "<br />", RegexOptions.IgnoreCase);
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"HTML/XML 處理錯誤: {ex.Message}");
                return htmlOrXml;
            }
        }

        public static class HtmlInternalIdByFullPath
        {
            private static readonly string[] Tags = { "img", "a", "video", "audio", "source", "embed", "iframe" };
            private static readonly string[] Attrs = { "src", "href" };

            public static string TransformHtml_ReplaceSrcWithDataInternalId(string html, Dictionary<string, string> fullPathToInternalId,out List<string> usedInternalIds)
            {
                var normalizedDict = fullPathToInternalId.ToDictionary(pair => NormalizePath(pair.Key),pair => pair.Value);
                var doc = new HtmlDocument { OptionFixNestedTags = true, OptionAutoCloseOnEnd = true };
                doc.LoadHtml(html);
                usedInternalIds = [];
                foreach (var tag in Tags)
                {
                    var nodes = doc.DocumentNode.SelectNodes($"//{tag}");
                    if (nodes == null) continue;
                    foreach (var node in nodes)
                    {
                        foreach (var attr in Attrs)
                        {
                            if (!node.Attributes.Contains(attr)) continue;

                            string rawPath = node.GetAttributeValue(attr, "").Trim();
                            if (!IsLocalFile(rawPath)) continue;

                            string decoded = Uri.UnescapeDataString(rawPath);
                            string normalized = NormalizePath(decoded); // 統一處理大小寫、開頭斜線

                            if (normalizedDict.TryGetValue(normalized, out var internalId))
                            {
                                usedInternalIds.Add(internalId);
                                node.SetAttributeValue("data-internalId", internalId);
                                node.Attributes.Remove(attr); // ✅ 將 src/href 移除
                            }
                        }
                    }
                }
                using var sw = new StringWriter();
                doc.Save(sw);
                return MinifyXml(sw.ToString());
            }

            private static bool IsLocalFile(string path)
            {
                if (string.IsNullOrWhiteSpace(path)) return false;
                path = path.ToLowerInvariant();
                return !(path.StartsWith("http://") || path.StartsWith("https://") ||
                         path.StartsWith("mailto:") || path.StartsWith("tel:") ||
                         path.StartsWith("javascript:"));
            }

            private static string NormalizePath(string path)
            {
                // 統一格式：不含開頭/，全部小寫
                return path.TrimStart('/').Replace("\\", "/").ToLowerInvariant();
            }
        }

        public static bool IsListPropertyType(this PropertyInfo prop)
        {
            Type type = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;
            if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(List<>)) return true;
            if (type != typeof(string) && typeof(IEnumerable).IsAssignableFrom(type)) return true;
            return false;
        }
        #region private 
        /// <summary>
        /// 自動偵測排序模式
        /// </summary>
        /// <param name="items"></param>
        /// <returns></returns>
        private static RemergeSortMode DetectSortMode(List<string> items)
        {
            bool allNumber = items.All(x => int.TryParse(x, out _));
            if (allNumber) return RemergeSortMode.Number;
            bool hasDigit = items.Any(x => Regex.IsMatch(x, @"\d"));
            bool hasAlpha = items.Any(x => Regex.IsMatch(x, @"[a-zA-Z]"));
            if (hasDigit && hasAlpha) return RemergeSortMode.Natural;
            return RemergeSortMode.String;
        }
        #endregion
    }
    
}
