using System.Globalization;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using WCMS.Features._Resx;
using WCMS.Features.WEB.Survey;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using SurveyFormModel = WCMS.Features.WEB.Survey.Survey;
namespace WCMS.Features.WEB.SurveySubmission;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.SurveySubmission)]
public class SurveySubmissionBiz(BizDeps bizDeps) : BizService<SurveySubmissions>(bizDeps)
{
    #region Property
    private static readonly Regex SurveyIdRegex = new(@"^[A-Za-z0-9_\-]+$", RegexOptions.Compiled);
    private static readonly Regex EmailRegex = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);
    private static readonly Regex PhoneRegex = new(@"^[0-9+\-#()\s]{6,30}$", RegexOptions.Compiled);
    private static readonly Regex DateRegex = new(@"^\d{4}-\d{2}-\d{2}$", RegexOptions.Compiled);
    /// <summary>
    /// 問卷提交 JSON 序列化設定
    /// </summary>
    private static readonly JsonSerializerOptions SubmitJsonOptions = new()
    {
        PropertyNamingPolicy = null,
        WriteIndented = false,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };
    private static readonly string[] OptionArrayNames = ["options", "Options", "items", "Items", "data", "Data"];
    private static readonly string[] OptionValueNames = ["value", "Value", "id", "Id", "key", "Key", "code", "Code"];
    private static readonly string[] OptionLabelNames = ["label", "Label", "text", "Text", "name", "Name", "title", "Title"];
    #endregion

    #region Public
    /// <summary>
    /// 前台提交問卷
    /// </summary>
    public async Task SubmitSurvey(SurveySubmissions submit, string? rawFormDataJson, CancellationToken ct = default)
    {
        await ExecTransactionAsync(async token =>
        {
            SurveySubmitContext context = await CheckSubmission(submit, rawFormDataJson, token);
            if (Message.HasError) return submit;

            AutoSetSubmission(submit, context);
            if (Message.HasError) return submit;

            await CommitSubmission(submit, token);
            return submit;
        },
        async (_, _) =>
        {
            Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00002);
            await Task.CompletedTask;
        }, ct);
    }
    #endregion

    #region Protected
    /// <summary>
    /// 檢查前台提交問卷
    /// </summary>
    internal virtual async Task<SurveySubmitContext> CheckSubmission(SurveySubmissions submit, string? rawFormDataJson, CancellationToken ct = default)
    {
        SurveySubmitContext context = new() { Submit = submit, RawFormDataJson = NormalizeRawFormDataJson(rawFormDataJson) };
        CheckSubmissionHeader(submit);
        if (Message.HasError) return context;
        context.Survey = await GetSubmitSurvey(submit.SurveyId?.Trim() ?? string.Empty, ct);
        CheckSurveyExists(context);
        if (Message.HasError) return context;
        context.FormData = ParseFormDataJson(context.RawFormDataJson);
        CheckBaseFields(submit);
        CheckFormDataKeys(context);
        CheckDynamicFields(context);
        return context;
    }
    /// <summary>
    /// 自動整理前台提交問卷
    /// </summary>
    internal virtual void AutoSetSubmission(SurveySubmissions submit, SurveySubmitContext context)
    {
        if (submit == null || Message.HasError) return;
        AutoSetSubmissionId(submit);
        AutoSetSubmissionStatus(submit);
        AutoSetSubmissionText(submit);
        AutoSetSubmissionJson(submit, context);
    }
    /// <summary>
    /// 保存前台提交資料
    /// </summary>
    protected virtual async Task CommitSubmission(SurveySubmissions submit, CancellationToken ct = default)
    {
        if (submit == null || Message.HasError) return;
        await GraphRepo.GetRepo<SurveySubmissions>().CreateAsync(submit, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 檢查提交基本資料
    /// </summary>
    private void CheckSubmissionHeader(SurveySubmissions submit)
    {
        if (submit == null) { AddCustomError("問卷提交資料不可為空。"); return; }

        if (submit.SurveyId.IsNullOrEmpty()) AddRequiredError(nameof(SurveySubmissions.SurveyId));
        else if (!SurveyIdRegex.IsMatch(submit.SurveyId?.Trim() ?? string.Empty)) AddFormatError(nameof(SurveySubmissions.SurveyId));
    }
    /// <summary>
    /// 檢查問卷是否存在
    ///// </summary>
    private void CheckSurveyExists(SurveySubmitContext context)
    {
        if (!context.Survey.SurveyId.IsNullOrEmpty()) return;
        AddCustomError($"找不到問卷資料：{context.Submit?.SurveyId}");
    }
    /// <summary>
    /// 檢查固定欄位
    /// </summary>
    private void CheckBaseFields(SurveySubmissions submit)
    {
        CheckRequiredText(submit.UserName, GetBaseFieldLabel(nameof(SurveySubmissions.UserName)));
        CheckRequiredText(submit.Email, GetBaseFieldLabel(nameof(SurveySubmissions.Email)));
        CheckEmail(submit.Email, GetBaseFieldLabel(nameof(SurveySubmissions.Email)));
        CheckPhone(submit.ContactPhone, GetBaseFieldLabel(nameof(SurveySubmissions.ContactPhone)));
    }
    /// <summary>
    /// 檢查 FormDataJson 欄位 key
    /// </summary>
    private void CheckFormDataKeys(SurveySubmitContext context)
    {
        HashSet<string> validKeys = GetValidFieldKeys(context);

        foreach (string key in context.FormData.Keys)
        {
            if (key.IsNullOrEmpty()) AddCustomError("FormDataJson 含有空白欄位代號。");
            else if (!validKeys.Contains(key)) AddCustomError($"欄位[{key}]不是此問卷有效欄位。");
        }
    }
    /// <summary>
    /// 檢查動態欄位
    /// </summary>
    private void CheckDynamicFields(SurveySubmitContext context)
    {
        foreach (SurveyItem item in context.Survey._SurveyItem) CheckDynamicField(context, item);
    }
    /// <summary>
    /// 檢查單一動態欄位
    /// </summary>
    private void CheckDynamicField(SurveySubmitContext context, SurveyItem item)
    {
        string fieldKey = GetSurveyFieldKey(item);
        string fieldName = GetFieldDisplayName(context, item);
        bool hasValue = HasFormValue(context.FormData, item);

        if (IsRequired(item) && !hasValue) { AddRequiredError(fieldName); return; }
        if (!hasValue) return;

        CheckDynamicFieldFormat(context.FormData[fieldKey], item, fieldName);
    }
    /// <summary>
    /// 檢查動態欄位格式
    /// </summary>
    private void CheckDynamicFieldFormat(JsonElement value, SurveyItem item, string fieldName)
    {
        LibInputType inputType = GetInputType(item);

        switch (inputType)
        {
            case LibInputType.Email:
                CheckEmail(GetScalarValue(value), fieldName);
                break;
            case LibInputType.Phone:
                CheckPhone(GetScalarValue(value), fieldName);
                break;
            case LibInputType.Number:
                CheckNumber(GetScalarValue(value), fieldName);
                break;
            case LibInputType.Date:
                CheckDate(GetScalarValue(value), fieldName);
                break;
            case LibInputType.Radio:
            case LibInputType.Select:
                CheckSingleOption(value, item, fieldName);
                break;
            case LibInputType.Checkbox:
                CheckMultipleOption(value, item, fieldName);
                break;
        }
    }
    /// <summary>
    /// 檢查必填文字
    /// </summary>
    private void CheckRequiredText(string? value, string fieldName)
    {
        if (value.IsNullOrEmpty()) AddRequiredError(fieldName);
    }
    /// <summary>
    /// 檢查 Email
    /// </summary>
    private void CheckEmail(string? value, string fieldName)
    {
        if (value.IsNullOrEmpty()) return;
        if (!EmailRegex.IsMatch(value?.Trim() ?? string.Empty)) AddFormatError(fieldName);
    }
    /// <summary>
    /// 檢查電話
    /// </summary>
    private void CheckPhone(string? value, string fieldName)
    {
        if (value.IsNullOrEmpty()) return;
        if (!PhoneRegex.IsMatch(value?.Trim() ?? string.Empty)) AddFormatError(fieldName);
    }
    /// <summary>
    /// 檢查數字
    /// </summary>
    private void CheckNumber(string? value, string fieldName)
    {
        if (value.IsNullOrEmpty()) return;

        bool isValid = decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out _)
            || decimal.TryParse(value, out _);

        if (!isValid) AddFormatError(fieldName);
    }
    /// <summary>
    /// 檢查日期
    /// </summary>
    private void CheckDate(string? value, string fieldName)
    {
        if (value.IsNullOrEmpty()) return;

        bool isValid = DateRegex.IsMatch(value?.Trim() ?? string.Empty)
            && DateOnly.TryParse(value, out _);

        if (!isValid) AddFormatError(fieldName);
    }
    /// <summary>
    /// 檢查單選選項
    /// </summary>
    private void CheckSingleOption(JsonElement value, SurveyItem item, string fieldName)
    {
        string selected = GetScalarValue(value);
        HashSet<string> options = GetOptionValueSet(item.Options);

        if (selected.IsNullOrEmpty()) return;
        if (!options.Contains(selected)) AddFormatError(fieldName);
    }

    /// <summary>
    /// 檢查複選選項
    /// </summary>
    private void CheckMultipleOption(JsonElement value, SurveyItem item, string fieldName)
    {
        string[] selected = GetArrayValues(value);
        HashSet<string> options = GetOptionValueSet(item.Options);

        if (selected.Any(p => !options.Contains(p))) AddFormatError(fieldName);
    }

    /// <summary>
    /// 依 SurveyId 讀取問卷設定
    /// </summary>
    private async Task<SurveyFormModel> GetSubmitSurvey(string surveyId, CancellationToken ct = default)
    {
        string condition = BuildSurveyIdCondition(surveyId);
        SurveyFormModel survey = await GetSubmitSurveyHeader(condition, ct) ?? new();
        if (survey.SurveyId.IsNullOrEmpty()) return survey;
        List<SurveyItem> items = await GetSubmitSurveyItems(condition, ct);
        List<SurveyItemLang> langs = await GetSubmitSurveyItemLangs(condition, ct);
        BindSurveyItemLangs(items, langs);
        survey._SurveyItem = items;
        return survey;
    }

    /// <summary>
    /// 讀取問卷主檔。
    /// </summary>
    private async Task<SurveyFormModel?> GetSubmitSurveyHeader(string condition, CancellationToken ct = default)
    {
        IList<SurveyFormModel> data = [.. (await DoQueryListAsync<SurveyFormModel>([], condition, null, 0, 1)).Cast<SurveyFormModel>()];
        return data.FirstOrDefault();
    }

    /// <summary>
    /// 讀取問卷欄位
    /// </summary>
    private async Task<List<SurveyItem>> GetSubmitSurveyItems(string condition, CancellationToken ct = default)
    {
        IList<SurveyItem> data = (await DoQueryListAsync<SurveyItem>([], condition, null, 0, 0)).Cast<SurveyItem>().ToList();
        return data.OrderBy(p => ToInt(p.RowId)).ToList();
    }

    /// <summary>
    /// 讀取問卷欄位語系
    /// </summary>
    private async Task<List<SurveyItemLang>> GetSubmitSurveyItemLangs(string condition, CancellationToken ct = default)
    {
        IList<SurveyItemLang> data = (await DoQueryListAsync<SurveyItemLang>([], condition, null, 0, 0)).Cast<SurveyItemLang>().ToList();
        return data.OrderBy(p => ToInt(p.ParentRowId)).ThenBy(p => ToInt(p.RowId)).ToList();
    }
    /// <summary>
    /// 將欄位語系資料掛回對應問卷欄位。
    /// </summary>
    private static void BindSurveyItemLangs(List<SurveyItem> items, List<SurveyItemLang> langs)
    {
        foreach (SurveyItem item in items)
        {
            item._SurveyItemLang = langs
                .Where(p => p.ParentRowId == item.RowId)
                .OrderBy(p => p.RowId)
                .ToList();
        }
    }
    /// <summary>
    /// 整理前台送入的 FormDataJson
    /// </summary>
    private string NormalizeRawFormDataJson(string? rawFormDataJson)
    {
        string json = rawFormDataJson?.Trim() ?? string.Empty;
        return json.IsNullOrEmpty() ? "{}" : json;
    }
    /// <summary>
    /// 解析 FormDataJson
    /// </summary>
    private Dictionary<string, JsonElement> ParseFormDataJson(string? json)
    {
        if (json.IsNullOrEmpty()) return new(StringComparer.OrdinalIgnoreCase);

        try
        {
            using JsonDocument doc = JsonDocument.Parse(json);
            return ParseFormDataObject(doc.RootElement);
        }
        catch (JsonException)
        {
            AddFormatError(nameof(SurveySubmissions.FormDataZip));
            return new(StringComparer.OrdinalIgnoreCase);
        }
    }

    /// <summary>
    /// 解析 FormDataJson Object
    /// </summary>
    private Dictionary<string, JsonElement> ParseFormDataObject(JsonElement root)
    {
        Dictionary<string, JsonElement> map = new(StringComparer.OrdinalIgnoreCase);

        if (root.ValueKind != JsonValueKind.Object) { AddFormatError(nameof(SurveySubmissions.FormDataZip)); return map; }
        foreach (JsonProperty prop in root.EnumerateObject()) map[prop.Name.Trim()] = prop.Value.Clone();

        return map;
    }

    /// <summary>
    /// 自動產生提交代碼
    /// </summary>
    private void AutoSetSubmissionId(SurveySubmissions submit)
    {
        submit.SurveySubmissionId = Guid.NewGuid().ToString();
    }

    /// <summary>
    /// 自動設定提交狀態
    /// </summary>
    private void AutoSetSubmissionStatus(SurveySubmissions submit)
    {
        if (((object?)submit.Lang) == null) submit.Lang = SiteDefaultLang;

        submit.SubmitTime = DateTime.UtcNow;
        submit.ReplyStatus = false;
    }

    /// <summary>
    /// 自動整理文字欄位
    /// </summary>
    private void AutoSetSubmissionText(SurveySubmissions submit)
    {
        submit.SurveyId = TrimText(submit.SurveyId);
        submit.UserName = TrimText(submit.UserName);
        submit.Email = TrimText(submit.Email);
        submit.ContactPhone = TrimText(submit.ContactPhone);
    }

    /// <summary>
    /// 自動整理 Json 欄位
    /// </summary>
    private void AutoSetSubmissionJson(SurveySubmissions submit, SurveySubmitContext context)
    {
        string formDataJson = BuildNormalizedFormDataJson(context);
        string fieldSnapshotJson = BuildFieldSnapshotJson(context);

        submit.FormDataZip = LibCompress.BrotliCompressString(formDataJson);
        submit.FieldSnapshotZip = LibCompress.BrotliCompressString(fieldSnapshotJson);
    }

    /// <summary>
    /// 建立正規化 FormDataJson
    /// </summary>
    private string BuildNormalizedFormDataJson(SurveySubmitContext context)
    {
        Dictionary<string, object?> result = new(StringComparer.OrdinalIgnoreCase);

        foreach (SurveyItem item in context.Survey._SurveyItem)
        {
            string key = GetSurveyFieldKey(item);
            result[key] = BuildNormalizedValue(item, context.FormData);
        }

        return JsonSerializer.Serialize(result, SubmitJsonOptions);
    }

    /// <summary>
    /// 建立單一欄位正規化值
    /// </summary>
    private object? BuildNormalizedValue(SurveyItem item, Dictionary<string, JsonElement> formData)
    {
        string key = GetSurveyFieldKey(item);
        if (!formData.TryGetValue(key, out JsonElement value)) return GetEmptyValue(item);

        return GetInputType(item) == LibInputType.Checkbox ? GetArrayValues(value) : GetScalarValue(value);
    }

    /// <summary>
    /// 取得空值預設
    /// </summary>
    private object GetEmptyValue(SurveyItem item)
    {
        return GetInputType(item) == LibInputType.Checkbox ? Array.Empty<string>() : string.Empty;
    }

    /// <summary>
    /// 建立欄位快照 Json
    /// </summary>
    private string BuildFieldSnapshotJson(SurveySubmitContext context)
    {
        List<SurveyFieldSnapshot> snapshot = [.. context.Survey._SurveyItem.OrderBy(p => ToInt(p.RowId)).Select(p => BuildFieldSnapshot(context, p))];
        return JsonSerializer.Serialize(snapshot, SubmitJsonOptions);
    }
    /// <summary>
    /// 建立單一欄位快照
    /// </summary>
    private SurveyFieldSnapshot BuildFieldSnapshot(SurveySubmitContext context, SurveyItem item)
    {
        LibInputType inputType = GetInputType(item);
        return new SurveyFieldSnapshot
        {
            FieldId = GetSurveyFieldKey(item),
            FieldName = GetFieldDisplayName(context, item),
            InputType = inputType.ToString(),
            IsRequired = IsRequired(item),
            Options = GetSnapshotOptions(item),
            Langs = BuildFieldLangSnapshots(item),
        };
    }
    /// <summary>
    /// 建立欄位語系快照
    /// </summary>
    private List<SurveyFieldLangSnapshot> BuildFieldLangSnapshots(SurveyItem item)
    {
        return [.. item._SurveyItemLang.Where(p => !p.FieldName.IsNullOrEmpty()).OrderBy(p => p.RowId).Select(p => new SurveyFieldLangSnapshot { Lang = p.Lang.ToString(), FieldName = p.FieldName })];
    }
    /// <summary>
    /// 取得快照選項文字
    /// </summary>
    private string? GetSnapshotOptions(SurveyItem item)
    {
        if (!IsOptionInputType(item)) return null;
        string optionText = NormalizeOptionText(item.Options);
        return optionText.IsNullOrEmpty() ? null : optionText;
    }
    /// <summary>
    /// 判斷是否為選項型欄位
    /// </summary>
    private bool IsOptionInputType(SurveyItem item)
    {
        return GetInputType(item).In(LibInputType.Radio, LibInputType.Select, LibInputType.Checkbox);
    }
    /// <summary>
    /// 取得有效欄位 key
    /// </summary>
    private HashSet<string> GetValidFieldKeys(SurveySubmitContext context)
    {
        return context.Survey._SurveyItem.Select(GetSurveyFieldKey).ToHashSet(StringComparer.OrdinalIgnoreCase);
    }
    /// <summary>
    /// 判斷欄位是否有值
    /// </summary>
    private bool HasFormValue(Dictionary<string, JsonElement> formData, SurveyItem item)
    {
        string key = GetSurveyFieldKey(item);
        return formData.TryGetValue(key, out JsonElement value) && HasJsonValue(value);
    }
    /// <summary>
    /// 判斷 Json 是否有值
    /// </summary>
    private bool HasJsonValue(JsonElement value)
    {
        if (value.ValueKind == JsonValueKind.Array) return GetArrayValues(value).Length > 0;
        return !GetScalarValue(value).IsNullOrEmpty();
    }
    /// <summary>
    /// 取得欄位單值
    /// </summary>
    private string GetScalarValue(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString()?.Trim() ?? string.Empty,
            JsonValueKind.Number => value.GetRawText().Trim(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            _ => string.Empty,
        };
    }
    /// <summary>
    /// 取得欄位陣列值
    /// </summary>
    private string[] GetArrayValues(JsonElement value)
    {
        if (value.ValueKind != JsonValueKind.Array)
        {
            string scalar = GetScalarValue(value);
            return scalar.IsNullOrEmpty() ? [] : [scalar];
        }
        return value.EnumerateArray().Select(GetScalarValue).Where(p => !p.IsNullOrEmpty()).ToArray();
    }
    /// <summary>
    /// 取得欄位選項集合
    /// </summary>
    private HashSet<string> GetOptionValueSet(string? optionText)
    {
        return ParseOptionValues(optionText).ToHashSet(StringComparer.OrdinalIgnoreCase);
    }
    /// <summary>
    /// 解析欄位選項值
    /// </summary>
    private List<string> ParseOptionValues(string? optionText)
    {
        return [.. (optionText ?? string.Empty).Replace("\t", " ").Split(["\r\n", "\n", "\r"], StringSplitOptions.None).Select(p => p.Trim()).Where(p => !p.IsNullOrEmpty()).Distinct(StringComparer.OrdinalIgnoreCase)];
    }
    /// <summary>
    /// 收集選項值
    /// </summary>
    private IEnumerable<string> CollectOptionValues(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Array) return element.EnumerateArray().Select(GetOptionValue).Where(p => !p.IsNullOrEmpty());
        if (element.ValueKind == JsonValueKind.Object) return GetOptionValuesFromObject(element);
        return [GetScalarValue(element)];
    }
    /// <summary>
    /// 從物件收集選項值
    /// </summary>
    private IEnumerable<string> GetOptionValuesFromObject(JsonElement element)
    {
        JsonElement? array = TryGetWrappedOptionArray(element);
        if (array.HasValue) return CollectOptionValues(array.Value);

        return element.EnumerateObject().Select(p => p.Name).Where(p => !p.IsNullOrEmpty());
    }
    /// <summary>
    /// 取得單一選項值
    /// </summary>
    private string GetOptionValue(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object) return GetScalarValue(element);
        string value = GetFirstJsonText(element, OptionValueNames);
        if (!value.IsNullOrEmpty()) return value;
        return GetFirstJsonText(element, OptionLabelNames);
    }
    /// <summary>
    /// 取得包裝選項陣列
    /// </summary>
    private JsonElement? TryGetWrappedOptionArray(JsonElement element)
    {
        foreach (string name in OptionArrayNames)
            if (element.TryGetProperty(name, out JsonElement value) && value.ValueKind == JsonValueKind.Array) return value;
        return null;
    }
    /// <summary>
    /// 取得第一個 JSON 文字
    /// </summary>
    private string GetFirstJsonText(JsonElement element, string[] names)
    {
        foreach (string name in names)
            if (element.TryGetProperty(name, out JsonElement value) && !GetScalarValue(value).IsNullOrEmpty()) return GetScalarValue(value);
        return string.Empty;
    }
    /// <summary>
    /// 取得欄位 key
    /// </summary>
    private string GetSurveyFieldKey(SurveyItem item)
    {
        if (!item.FieldId.IsNullOrEmpty()) return item.FieldId?.Trim() ?? string.Empty;
        return $"RowId_{ToInt(item.RowId)}";
    }
    /// <summary>
    /// 取得欄位顯示名稱
    /// </summary>
    private string GetFieldDisplayName(SurveySubmitContext context, SurveyItem item)
    {
        LangCode lang = GetSubmissionLang(context.Submit);
        List<SurveyItemLang> rows = GetFieldLangRows(item);
        SurveyItemLang? current = rows.FirstOrDefault(p => Equals(p.Lang, lang));
        SurveyItemLang? fallback = rows.FirstOrDefault(p => Equals(p.Lang, SiteDefaultLang));
        return FirstText(current?.FieldName, fallback?.FieldName, item.FieldId, $"RowId_{ToInt(item.RowId)}");
    }
    /// <summary>
    /// 取得欄位語系列
    /// </summary>
    private static List<SurveyItemLang> GetFieldLangRows(SurveyItem item)
    {
        return item._SurveyItemLang.OrderBy(p => p.RowId).ToList();
    }
    /// <summary>
    /// 取得提交語系
    /// </summary>
    private LangCode GetSubmissionLang(SurveySubmissions submit)
    {
        object? raw = submit.Lang;
        return raw == null ? SiteDefaultLang : (LangCode)raw;
    }
    /// <summary>
    /// 取得欄位類型
    /// </summary>
    private LibInputType GetInputType(SurveyItem item)
    {
        byte value = Convert.ToByte((object?)item.InputType ?? 0);
        return Enum.IsDefined(typeof(LibInputType), value) ? (LibInputType)value : LibInputType.Text;
    }
    /// <summary>
    /// 是否為必填
    /// </summary>
    private bool IsRequired(SurveyItem item)
    {
        return item.IsRequired == true;
    }
    /// <summary>
    /// 建立 SurveyId 查詢條件
    /// </summary>
    private string BuildSurveyIdCondition(string surveyId)
    {
        string safeValue = surveyId.Replace("\\", "\\\\").Replace("\"", "\\\"");
        return $@"{nameof(SurveyFormModel.SurveyId)} = ""{safeValue}""";
    }
    /// <summary>
    /// 取得固定欄位名稱
    /// </summary>
    private string GetBaseFieldLabel(string fieldName)
    {
        return fieldName switch
        {
            nameof(SurveySubmissions.UserName) => I18n.GetLabel<SurveySubmissions>(x => x.UserName),
            nameof(SurveySubmissions.Email) => I18n.GetLabel<SurveySubmissions>(x => x.Email),
            nameof(SurveySubmissions.ContactPhone) => I18n.GetLabel<SurveySubmissions>(x => x.ContactPhone),
            _ => fieldName,
        };
    }
    /// <summary>
    /// 取得第一個有值文字
    /// </summary>
    private string FirstText(params string?[] values)
    {
        return values.FirstOrDefault(p => !p.IsNullOrEmpty())?.Trim() ?? string.Empty;
    }
    /// <summary>
    /// 轉成 int
    /// </summary>
    private int ToInt(object? value)
    {
        return value == null ? 0 : Convert.ToInt32(value);
    }

    /// <summary>
    /// 整理文字
    /// </summary>
    private string TrimText(string? value)
    {
        return value?.Trim() ?? string.Empty;
    }
    /// <summary>
    /// 加入必填錯誤
    /// </summary>
    private void AddRequiredError(string fieldName)
    {
        Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, fieldName);
    }
    /// <summary>
    /// 加入格式錯誤
    /// </summary>
    private void AddFormatError(string fieldName)
    {
        Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00035, fieldName);
    }
    /// <summary>
    /// 加入自訂錯誤
    /// </summary>
    private void AddCustomError(string message)
    {
        Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00000, message);
    }
    /// <summary>
    /// 整理選項文字
    /// </summary>
    private string NormalizeOptionText(string? optionText)
    {
        List<string> options = [.. (optionText ?? string.Empty).Replace("\t", " ").Split(["\r\n", "\n", "\r"], StringSplitOptions.None).Select(p => p.Trim()).Where(p => !p.IsNullOrEmpty()).Distinct(StringComparer.OrdinalIgnoreCase)];
        return options.Count == 0 ? string.Empty : string.Join("\n", options);
    }
    #endregion
}