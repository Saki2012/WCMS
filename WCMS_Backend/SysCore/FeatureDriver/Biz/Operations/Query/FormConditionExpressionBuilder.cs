using System.Collections;
using System.Linq.Dynamic.Core;
using System.Linq.Expressions;
using System.Text.RegularExpressions;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Persistence;

namespace WCMS.SysCore.FeatureDriver.Biz.Operations.Query;

/// <summary>
/// 將 WCMS 查詢字串轉換為可供 Repository 執行的條件 Expression。
/// </summary>
internal sealed class FormConditionExpressionBuilder(ModelTypeMetadataCache modelMetadata)
{
    #region Property
    /// <summary>
    /// Model Reflection Metadata Cache。
    /// </summary>
    private ModelTypeMetadataCache ModelMetadata { get; } = modelMetadata;
    #endregion

    #region Internal
    internal LambdaExpression Build(Type modelType, string condition)
    {
        var param = Expression.Parameter(modelType, "x");
        string normalized = NormalizeCondition(modelType, condition, out object[] args);
        if (string.IsNullOrWhiteSpace(normalized)) return Expression.Lambda(Expression.Constant(true), param);
        var config = new ParsingConfig { ResolveTypesBySimpleName = true, AllowNewToEvaluateAnyType = true, UseParameterizedNamesInDynamicQuery = true, CustomTypeProvider = new WcmsTypeProvider() };
        var lambda = DynamicExpressionParser.ParseLambda(config, new[] { param }, typeof(bool), normalized, args);
        return lambda;
    }
    // 1) 取代原本的 NormalizeCondition
    private string NormalizeCondition(Type modelType, string rawCondition, out object[] args)
    {
        var argList = new List<object>();
        // 與你原本相同的前置清理：補空白、統一運算子
        rawCondition = Regex.Replace(rawCondition, @"(?<=[^!\s<>!=])=(?=[^=])", " == ");
        rawCondition = Regex.Replace(rawCondition, @"(?<=[^\s])(?<op>==|!=|>=|<=|>|<)(?=[^\s])", " ${op} ");
        string normalized = NormalizeRec(modelType, rawCondition, argList);
        args = argList.ToArray();
        return normalized;
    }
    // 2) 遞迴解析：保留括號分組，只在頂層切 and/or
    private string NormalizeRec(Type modelType, string input, List<object> args)
    {
        var (chunks, connectors) = SplitTopLevelByAndOr(input);
        var pieces = new List<string>();
        int i = 0;
        while (i < chunks.Count)
        {
            string seg = chunks[i].Trim();
            if (string.IsNullOrEmpty(seg))
            {
                i++;
                continue;
            }
            var s0 = seg.TrimStart();
            var isNot = s0.StartsWith("not ", StringComparison.OrdinalIgnoreCase) || s0.StartsWith("not(", StringComparison.OrdinalIgnoreCase) || s0.StartsWith("!", StringComparison.Ordinal);
            if (isNot)
            {
                // 取出 not/! 後面的 operand
                var operand = s0.StartsWith("!", StringComparison.Ordinal) ? s0.Substring(1).Trim() : s0.Substring(3).Trim(); // "not"
                // 若是 not(...) 形式，去掉外層括號
                if (operand.StartsWith("(") && operand.EndsWith(")") && IsBalanced(operand)) operand = operand.Substring(1, operand.Length - 2);
                // 先把 operand 正規化成 bool expr
                string innerNorm;
                if (TryParseSimpleClause(operand, out var p, out var opx, out var vx)) innerNorm = BuildNestedClause(modelType, p, opx, vx, ref args) ?? "true";
                else innerNorm = NormalizeRec(modelType, operand, args);
                pieces.Add($"!({innerNorm})");
                // 正常補 connector（未合併的情況）
                if (i < connectors.Count) pieces.Add(connectors[i]);
                i++;
                continue;
            }
            // ( ... ) → 遞迴處理後再包回括號（括號群組不做合併）
            if (seg.StartsWith("(") && seg.EndsWith(")") && IsBalanced(seg))
            {
                string inner = seg.Substring(1, seg.Length - 2);
                string innerNorm = NormalizeRec(modelType, inner, args);
                pieces.Add("(" + innerNorm + ")");
            }
            else
            {
                // 嘗試：同 collection nav + AND 連續子句合併
                if (TryParseSimpleClause(seg, out var p0, out var op0, out var v0) && p0.Length >= 2 && TryGetEnumerableElementType(modelType, p0[0], out var elementType))
                {
                    var nav = p0[0];

                    // 收集連續 AND 同 nav 的子句
                    var group = new List<(string[] RestPath, string Op, string? Val)>
            {
                (p0.Skip(1).ToArray(), op0, v0)
            };

                    int j = i;
                    while (j < connectors.Count && connectors[j].Equals("and", StringComparison.OrdinalIgnoreCase))
                    {
                        var nextSeg = chunks[j + 1].Trim();

                        // 不跨括號合併
                        if (nextSeg.StartsWith("(")) break;

                        if (!TryParseSimpleClause(nextSeg, out var pn, out var opn, out var vn)) break;
                        if (pn.Length < 2) break;
                        if (!pn[0].Equals(nav, StringComparison.OrdinalIgnoreCase)) break;

                        group.Add((pn.Skip(1).ToArray(), opn, vn));
                        j++;
                    }

                    if (group.Count >= 2)
                    {
                        // ✅ 合併成單一 Any
                        var merged = BuildMergedAnyClause(modelType, nav, elementType, group, ref args);
                        if (!string.IsNullOrEmpty(merged)) pieces.Add(merged);

                        // group 吃掉了 chunks[i..j]，下一個 connector 是 connectors[j]
                        i = j + 1;

                        // 補回 group 後面那個 connector（如果還有）
                        if (j < connectors.Count) pieces.Add(connectors[j]);
                        continue;
                    }
                }

                // fallback：沿用你原本單子句 BuildNestedClause
                if (TryParseSimpleClause(seg, out var pathParts, out var op, out var val))
                {
                    string? clause = BuildNestedClause(modelType, pathParts, op, val, ref args);
                    if (!string.IsNullOrEmpty(clause)) pieces.Add(clause);
                }
            }

            // 正常補 connector（未合併的情況）
            if (i < connectors.Count) pieces.Add(connectors[i]);
            i++;
        }

        return string.Join(" ", pieces);
    }
    // 3) 只在「括號深度為 0」時，辨識 and / or 作為分隔
    private static (List<string> chunks, List<string> connectors) SplitTopLevelByAndOr(string s)
    {
        // 宣告變數
        var chunks = new List<string>();
        var connectors = new List<string>();
        var sb = new System.Text.StringBuilder();
        int depth = 0;
        bool inSingleQuote = false;
        bool inDoubleQuote = false;

        // 執行 function
        for (int i = 0; i < s.Length;)
        {
            char ch = s[i];

            // 單引號字串：支援 SQL 風格 '' 跳脫
            if (ch == '\'' && !inDoubleQuote)
            {
                if (inSingleQuote && i + 1 < s.Length && s[i + 1] == '\'')
                {
                    sb.Append("''");
                    i += 2;
                    continue;
                }

                if (IsUnescapedQuote(s, i))
                {
                    inSingleQuote = !inSingleQuote;
                    sb.Append(ch);
                    i++;
                    continue;
                }
            }

            // 雙引號字串：支援 "" 跳脫
            if (ch == '"' && !inSingleQuote)
            {
                if (inDoubleQuote && i + 1 < s.Length && s[i + 1] == '"')
                {
                    sb.Append("\"\"");
                    i += 2;
                    continue;
                }

                if (IsUnescapedQuote(s, i))
                {
                    inDoubleQuote = !inDoubleQuote;
                    sb.Append(ch);
                    i++;
                    continue;
                }
            }

            // 只有在不在引號內時，才處理括號與 connector
            if (!inSingleQuote && !inDoubleQuote)
            {
                if (ch == '(')
                {
                    depth++;
                    sb.Append(ch);
                    i++;
                    continue;
                }

                if (ch == ')')
                {
                    depth = Math.Max(0, depth - 1);
                    sb.Append(ch);
                    i++;
                    continue;
                }

                if (depth == 0 && TryReadConnector(s, i, out string? conn, out int adv))
                {
                    chunks.Add(sb.ToString());
                    sb.Clear();
                    connectors.Add(conn!);
                    i += adv;
                    continue;
                }
            }

            sb.Append(ch);
            i++;
        }

        chunks.Add(sb.ToString());

        // return
        return (chunks, connectors);
    }
    // 4) 辨識 and / or（允許左右空白）
    private static bool TryReadConnector(string s, int index, out string? conn, out int advance)
    {
        // 宣告變數
        int i = index;

        // 執行 function
        while (i < s.Length && char.IsWhiteSpace(s[i])) i++;

        bool Match(string word)
        {
            if (i + word.Length > s.Length) return false;
            if (!s.AsSpan(i, word.Length).Equals(word, StringComparison.OrdinalIgnoreCase)) return false;
            if (!IsConnectorBoundary(s, i - 1)) return false;
            if (!IsConnectorBoundary(s, i + word.Length)) return false;
            return true;
        }

        if (Match("and"))
        {
            int j = i + 3;
            while (j < s.Length && char.IsWhiteSpace(s[j])) j++;

            conn = "and";
            advance = j - index;
            return true;
        }

        if (Match("or"))
        {
            int j = i + 2;
            while (j < s.Length && char.IsWhiteSpace(s[j])) j++;

            conn = "or";
            advance = j - index;
            return true;
        }

        conn = null;
        advance = 0;

        // return
        return false;
    }
    // 5) 檢查括號是否平衡
    private static bool IsBalanced(string s)
    {
        // 宣告變數
        int depth = 0;
        bool inSingleQuote = false;
        bool inDoubleQuote = false;

        // 執行 function
        for (int i = 0; i < s.Length; i++)
        {
            char ch = s[i];

            if (ch == '\'' && !inDoubleQuote)
            {
                if (inSingleQuote && i + 1 < s.Length && s[i + 1] == '\'')
                {
                    i++;
                    continue;
                }

                if (IsUnescapedQuote(s, i))
                {
                    inSingleQuote = !inSingleQuote;
                    continue;
                }
            }

            if (ch == '"' && !inSingleQuote)
            {
                if (inDoubleQuote && i + 1 < s.Length && s[i + 1] == '"')
                {
                    i++;
                    continue;
                }

                if (IsUnescapedQuote(s, i))
                {
                    inDoubleQuote = !inDoubleQuote;
                    continue;
                }
            }

            if (inSingleQuote || inDoubleQuote) continue;

            if (ch == '(') depth++;
            else if (ch == ')')
            {
                depth--;
                if (depth < 0) return false;
            }
        }

        // return
        return depth == 0;
    }
    private static string? UnescapeQuotedValue(string? raw)
    {
        // 宣告變數
        bool isEmpty = string.IsNullOrEmpty(raw);

        // 執行 function
        if (isEmpty) return raw;

        // return
        return raw!
            .Replace("''", "'")
            .Replace("\"\"", "\"");
    }
    private static bool IsUnescapedQuote(string s, int index)
    {
        // 宣告變數
        int slashCount = 0;
        int i = index - 1;

        // 執行 function
        while (i >= 0 && s[i] == '\\')
        {
            slashCount++;
            i--;
        }

        // return
        return slashCount % 2 == 0;
    }
    private static bool IsConnectorBoundary(string s, int index)
    {
        // 宣告變數
        bool isEdge = index < 0 || index >= s.Length;

        // 執行 function
        if (isEdge) return true;

        char ch = s[index];

        // return
        return char.IsWhiteSpace(ch) || ch == '(' || ch == ')';
    }
    private string? BuildNestedClause(Type type, string[] pathParts, string op, string? val, ref List<object> args, int index = 0)
    {
        // 宣告變數
        if (index >= pathParts.Length) return null;

        string current = pathParts[index];
        var prop = ModelMetadata.GetProperty(type, current);
        if (prop == null) return null;

        Type nextType = prop.PropertyType;
        bool isEnumerable = typeof(IEnumerable).IsAssignableFrom(nextType) && nextType != typeof(string);
        if (isEnumerable) nextType = nextType.IsGenericType ? nextType.GetGenericArguments()[0] : nextType.GetElementType();

        // 執行 function
        if (index == pathParts.Length - 1)
        {
            string fieldExpr = current;
            string expr = null;

            switch (op.ToLowerInvariant())
            {
                case "is null":
                    expr = $"{fieldExpr} == null";
                    break;

                case "is not null":
                    expr = $"{fieldExpr} != null";
                    break;

                case "in":
                case "not in":
                    {
                        // 宣告變數：取得欄位型別與實際比對型別
                        var cleaned = val?.Trim('(', ')') ?? "";
                        var fieldProp = ModelMetadata.GetProperty(type, fieldExpr).PropertyType;
                        var targetType = Nullable.GetUnderlyingType(fieldProp) ?? fieldProp;
                        var isIn = op.Equals("in", StringComparison.OrdinalIgnoreCase);

                        // 執行：整理 in / not in 的值
                        var valuesArray = cleaned
                            .Split(',', StringSplitOptions.RemoveEmptyEntries)
                            .Select(v => v.Trim().Trim('\'', '"'))
                            .Where(v => !string.IsNullOrWhiteSpace(v))
                            .ToArray();

                        if (valuesArray.Length == 0)
                        {
                            expr = isIn ? "false" : "true";
                            break;
                        }

                        // 執行：建立強型別陣列，避免 object[] 造成 Contains 解析失敗
                        var convertedArray = BuildTypedConditionArray(valuesArray, targetType);

                        int paramIndex = args.Count;
                        args.Add(convertedArray);

                        // return：nullable 欄位需要用 Value 比對
                        expr = BuildInConditionExpr(fieldExpr, fieldProp, isIn, paramIndex);
                        break;
                    }

                case "like":
                    {
                        int pIndex = args.Count;
                        args.Add(val ?? string.Empty);
                        expr = $"{fieldExpr} != null && {fieldExpr}.Contains(@{pIndex})";
                        break;
                    }

                case "hasany":
                    {
                        var raw = (val ?? string.Empty).Trim();

                        if ((raw.StartsWith("(") && raw.EndsWith(")")) || (raw.StartsWith("[") && raw.EndsWith("]")))
                            raw = raw.Substring(1, raw.Length - 2);

                        var tokens = raw
                            .Split(',')
                            .Select(s => s.Trim().Trim('"', '\''))
                            .Where(s => !string.IsNullOrWhiteSpace(s))
                            .ToArray();

                        if (tokens.Length == 0) return null;

                        int pIndex = args.Count;
                        args.Add(tokens);
                        expr = $"ApplicationDbContext.SplitToStringTable({fieldExpr}).Any(@{pIndex}.Contains(Id.ToUpper()))";
                        break;
                    }

                case "hasall":
                    {
                        var raw = (val ?? string.Empty).Trim();

                        if ((raw.StartsWith("(") && raw.EndsWith(")")) || (raw.StartsWith("[") && raw.EndsWith("]")))
                            raw = raw.Substring(1, raw.Length - 2);

                        var tokens = raw
                            .Split(',', StringSplitOptions.RemoveEmptyEntries)
                            .Select(s => s.Trim().Trim('"', '\''))
                            .Where(s => !string.IsNullOrWhiteSpace(s))
                            .Select(s => s.ToUpperInvariant())
                            .ToArray();

                        if (tokens.Length == 0) return null;

                        int pIndex = args.Count;
                        args.Add(tokens);

                        var split = $"ApplicationDbContext.SplitToStringTable({fieldExpr})";
                        expr =
                            $"{split}.Count(@{pIndex}.Contains(Id.ToUpper())) == @{pIndex}.Length && " +
                            $"{split}.Count() == @{pIndex}.Length";

                        break;
                    }

                case "hasallof":
                    {
                        var raw = (val ?? string.Empty).Trim();

                        if ((raw.StartsWith("(") && raw.EndsWith(")")) || (raw.StartsWith("[") && raw.EndsWith("]")))
                            raw = raw.Substring(1, raw.Length - 2);

                        var tokens = raw
                            .Split(',', StringSplitOptions.RemoveEmptyEntries)
                            .Select(s => s.Trim().Trim('"', '\''))
                            .Where(s => !string.IsNullOrWhiteSpace(s))
                            .Select(s => s.ToUpperInvariant())
                            .ToArray();

                        if (tokens.Length == 0) return null;

                        int pIndex = args.Count;
                        args.Add(tokens);

                        var split = $"ApplicationDbContext.SplitToStringTable({fieldExpr})";
                        expr = $"{split}.Count(@{pIndex}.Contains(Id.ToUpper())) == @{pIndex}.Length";

                        break;
                    }

                case "&":
                case "!&":
                    {
                        var raw = (val ?? string.Empty).Trim();
                        if ((raw.StartsWith("(") && raw.EndsWith(")")) || (raw.StartsWith("[") && raw.EndsWith("]")))
                            raw = raw.Substring(1, raw.Length - 2);

                        var propInfo = ModelMetadata.GetProperty(type, fieldExpr);
                        var propType = propInfo.PropertyType;
                        var isNullable = Nullable.GetUnderlyingType(propType) != null;
                        var nonNullType = Nullable.GetUnderlyingType(propType) ?? propType;

                        Type underlying;
                        if (nonNullType.IsEnum)
                            underlying = System.Enum.GetUnderlyingType(nonNullType);
                        else
                            underlying = nonNullType;

                        long acc = 0;
                        foreach (var p in raw.Split(new[] { '|', ',', ' ' }, StringSplitOptions.RemoveEmptyEntries))
                            acc |= Convert.ToInt64(p);

                        object flagVal =
                            underlying == typeof(long) ? acc :
                            underlying == typeof(int) ? (int)acc :
                            underlying == typeof(short) ? (short)acc :
                            underlying == typeof(byte) ? (byte)acc :
                            Convert.ChangeType(acc, underlying);

                        var pIndex = args.Count;
                        args.Add(flagVal);

                        var left = isNullable ? $"({fieldExpr} ?? 0)" : fieldExpr;
                        var cmp = op == "&" ? "!= 0" : "== 0";
                        expr = $"(({left} & @{pIndex}) {cmp})";
                        break;
                    }

                default:
                    {
                        var pi = ModelMetadata.GetProperty(type, fieldExpr);
                        var propType = pi?.PropertyType ?? typeof(string);
                        var nonNullType = Nullable.GetUnderlyingType(propType) ?? propType;
                        var dynOp = op == "=" ? "==" : op;

                        object? converted = val;
                        if (nonNullType.IsEnum) converted = ParseEnumFromString(nonNullType, val ?? "");

                        int pIndex = args.Count;
                        args.Add(converted!);
                        expr = $"{fieldExpr} {dynOp} @{pIndex}";
                        break;
                    }
            }

            return expr;
        }

        string inner = BuildNestedClause(nextType, pathParts, op, val, ref args, index + 1);
        if (string.IsNullOrEmpty(inner)) return null;

        string thisLevel = current;

        // return
        return isEnumerable ? $"{thisLevel}.Any({inner})" : $"{thisLevel}.{inner}";
    }
    /// <summary>
    /// 從 rawCondition 抽出「集合導航」的條件：
    /// e.g. "_Detail.PublishStatus == 1 and _Detail.Year >= 2024"
    ///  ->  { "_Detail": "PublishStatus == 1 and Year >= 2024" }
    /// 限制：目前只處理頂層 AND（先不處理 OR/巢狀括號）
    /// </summary>
    private Dictionary<string, string> ExtractDetailConditionMap(Type modelType, string rawCondition)
    {
        var map = new Dictionary<string, string>(StringComparer.Ordinal);
        if (string.IsNullOrWhiteSpace(rawCondition)) return map;
        var (chunks, connectors) = SplitTopLevelByAndOr(rawCondition);
        for (int i = 0; i < chunks.Count; i++)
        {
            var seg = chunks[i].Trim();
            if (string.IsNullOrEmpty(seg)) continue;
            // 只做 AND；遇到 OR 先跳過（避免行為錯）
            if (i < connectors.Count && connectors[i].Equals("or", StringComparison.OrdinalIgnoreCase)) continue;
            var m = Regex.Match(seg, @"^(?<fullPath>[\w.]+)\s*(?<op>=|&|!&|==|!=|>=|<=|>|<|in|not in|like|is null|is not null|hasany|hasallof|hasall)\s*(?<val>.+)?$", RegexOptions.IgnoreCase);
            if (!m.Success) continue;
            var fullPath = m.Groups["fullPath"].Value;
            var op = m.Groups["op"].Value;
            var val = m.Groups["val"].Success ? m.Groups["val"].Value.Trim() : null;
            var parts = fullPath.Split('.', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 2) continue;
            var first = parts[0];
            var p = ModelMetadata.GetProperty(modelType, first);
            if (p == null) continue;
            var isEnumerable = typeof(IEnumerable).IsAssignableFrom(p.PropertyType) && p.PropertyType != typeof(string);
            if (!isEnumerable) continue;
            // 去掉集合前綴：_Detail.PublishStatus -> PublishStatus
            var restPath = string.Join('.', parts.Skip(1));
            var rebuilt = string.IsNullOrWhiteSpace(val) ? $"{restPath} {op}" : $"{restPath} {op} {val}";
            // 同集合多條件以 AND 合併
            map[first] = map.TryGetValue(first, out var exist) ? $"{exist} and {rebuilt}" : rebuilt;
        }
        return map;
    }
    private static readonly Dictionary<Type, Func<string, object>> EnumStringMappers = new()
    {
        [typeof(LangCode)] = s => LangCodeExt.Normalize(s),
    };
    private static object ParseEnumFromString(Type enumType, string raw)
    {
        raw ??= string.Empty;
        // 1) 專用 mapping（LangCode: zh-tw/en...）
        if (EnumStringMappers.TryGetValue(enumType, out var map)) return map(raw);
        // 2) 通用：把 zh-tw -> zhtw 這種格式轉成 enum name 嘗試 parse
        var normalized = raw.Trim().Replace("-", "").Replace("_", "");
        try { return System.Enum.Parse(enumType, normalized, ignoreCase: true); } catch { }
        // 3) 通用：數字（若你有些 enum 仍用數值傳入）
        if (long.TryParse(raw.Trim(), out var n)) return System.Enum.ToObject(enumType, n);
        throw new FormatException($"Cannot parse '{raw}' to enum '{enumType.Name}'.");
    }
    // 解析單一子句：AnnouncementDetail.Lang = en
    private static bool TryParseSimpleClause(string seg, out string[] pathParts, out string op, out string? val)
    {
        // 宣告變數
        var m = Regex.Match(
            seg,
            @"^(?<fullPath>[\w.]+)\s*(?<op>=|&|!&|==|!=|>=|<=|>|<|in|not in|like|is null|is not null|hasany|hasallof|hasall)\s*(?<val>.+)?$",
            RegexOptions.IgnoreCase);

        pathParts = Array.Empty<string>();
        op = "";
        val = null;

        // 執行 function
        if (!m.Success) return false;

        var fullPath = m.Groups["fullPath"].Value;
        op = m.Groups["op"].Value;

        if (m.Groups["val"].Success)
        {
            var rawVal = m.Groups["val"].Value.Trim().Trim('\'', '"');
            val = UnescapeQuotedValue(rawVal);
        }

        pathParts = fullPath.Split('.');

        // return
        return pathParts.Length > 0;
    }
    // 判斷 modelType.nav 是否為 IEnumerable（非 string），並取 elementType
    private bool TryGetEnumerableElementType(Type modelType, string navName, out Type elementType)
    {
        elementType = typeof(object);
        var prop = ModelMetadata.GetProperty(modelType, navName);
        if (prop == null) return false;
        var t = prop.PropertyType;
        var isEnumerable = typeof(IEnumerable).IsAssignableFrom(t) && t != typeof(string);
        if (!isEnumerable) return false;
        if (t.IsArray)
        {
            elementType = t.GetElementType() ?? typeof(object);
            return true;
        }
        if (t.IsGenericType)
        {
            elementType = t.GetGenericArguments()[0];
            return true;
        }
        // fallback（很少見）
        elementType = typeof(object);
        return true;
    }

    // 合併：AnnouncementDetail.Any(Lang == @0 and Title != @1)
    private string? BuildMergedAnyClause(Type modelType, string navName, Type elementType, List<(string[] RestPath, string Op, string? Val)> clauses, ref List<object> args)
    {
        // 逐條在 elementType 上 BuildNestedClause，避免每條都各自 Any()
        var innerParts = new List<string>();
        foreach (var c in clauses)
        {
            var inner = BuildNestedClause(elementType, c.RestPath, c.Op, c.Val, ref args, 0);
            if (!string.IsNullOrEmpty(inner)) innerParts.Add(inner);
        }
        if (innerParts.Count == 0) return null;
        // 多條用 and 串（同一筆明細必須同時成立）
        var innerExpr = string.Join(" and ", innerParts);
        return $"{navName}.Any({innerExpr})";
    }
    private static Array BuildTypedConditionArray(string[] values, Type targetType)
    {
        // 宣告變數
        var array = Array.CreateInstance(targetType, values.Length);

        // 執行 function：逐筆轉成欄位實際型別
        for (int i = 0; i < values.Length; i++) array.SetValue(ConvertConditionValue(values[i], targetType), i);

        // return
        return array;
    }

    /// <summary>
    /// 轉換條件值，支援 enum / Guid / 一般型別。
    /// </summary>
    private static object ConvertConditionValue(string raw, Type targetType)
    {
        // 宣告變數
        var value = raw.Trim().Trim('\'', '"');

        // 執行 function：依欄位型別轉換
        if (targetType.IsEnum) return ParseEnumFromString(targetType, value);
        if (targetType == typeof(Guid)) return Guid.Parse(value);
        if (targetType == typeof(string)) return value;

        // return
        return Convert.ChangeType(value, targetType);
    }

    /// <summary>
    /// 建立 in / not in 條件式，nullable value type 需先判斷 null。
    /// </summary>
    private static string BuildInConditionExpr(string fieldExpr, Type fieldType, bool isIn, int paramIndex)
    {
        // 宣告變數
        var isNullableValueType = Nullable.GetUnderlyingType(fieldType) != null;

        // 執行 function：非 nullable 欄位可直接比對
        if (!isNullableValueType)
            return isIn ? $"@{paramIndex}.Contains({fieldExpr})" : $"!@{paramIndex}.Contains({fieldExpr})";

        // return：nullable 欄位需用 Value 比對
        return isIn
            ? $"{fieldExpr} != null && @{paramIndex}.Contains({fieldExpr}.Value)"
            : $"{fieldExpr} == null || !@{paramIndex}.Contains({fieldExpr}.Value)";
    }
    #endregion
}
