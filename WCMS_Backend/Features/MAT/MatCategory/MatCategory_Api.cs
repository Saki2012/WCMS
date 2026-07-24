using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WCMS.Features._Resx;
using WCMS.Features.COMM.Category;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Api.Contracts;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.MAT.MatCategory;

/// <summary>
/// MAT 類別組合式表單 API。
/// </summary>
[LibApiController(ProgKeys.MAT.Code, ProgKeys.MAT.MatCategory, FuncAction.MasterData)]
public class MatCategoryController : CategoryControllerBase<MatCategoryFormModel>
{
    #region Public
    /// <summary>
    /// 取得物件類別的有序動態欄位與語系顯示名稱。
    /// </summary>
    [HttpGet(nameof(GetMatCateInfoFields)), AllowAnonymous, IgnoreAntiforgeryToken]
    public async Task<IActionResult> GetMatCateInfoFields(string catId, string lang, CancellationToken ct)
    {
        LangCode langCode = LangCodeExt.Normalize(lang);
        QueryListParam param = BuildInfoFieldQuery(catId);
        MatCategoryFormModel? form = (await Service.BizQueryListAsync(param, ct)).FirstOrDefault();
        List<MatCategoryInfoFieldItem_DTO> result = BuildInfoFieldResult(form, langCode);
        return Ok(new ApiResponse<MatCategoryInfoFieldItem_DTO> { Data = result, SysMessage = Message.Messages });
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立 MAT 類別動態欄位查詢條件，保留全部語系供顯示名稱 fallback。
    /// </summary>
    private static QueryListParam BuildInfoFieldQuery(string categoryId)
    {
        string fieldPath = nameof(MatCategoryFormModel.MatCategoryInfoField);
        string displayPath = $"{fieldPath}.{nameof(MatCategoryInfoField._MatCategoryInfoFieldDisplay)}";
        return new QueryListParam
        {
            Fields = [
                $"{nameof(MatCategoryFormModel.Category)}.{nameof(Category.CategoryId)}",
                $"{fieldPath}.{nameof(MatCategoryInfoField.RowId)}",
                $"{fieldPath}.{nameof(MatCategoryInfoField.RowNo)}",
                $"{fieldPath}.{nameof(MatCategoryInfoField.Field)}",
                $"{displayPath}.{nameof(MatCategoryInfoFieldDisplay.ParentRowId)}",
                $"{displayPath}.{nameof(MatCategoryInfoFieldDisplay.RowId)}",
                $"{displayPath}.{nameof(MatCategoryInfoFieldDisplay.RowNo)}",
                $"{displayPath}.{nameof(MatCategoryInfoFieldDisplay.Lang)}",
                $"{displayPath}.{nameof(MatCategoryInfoFieldDisplay.FieldDisplayName)}"
            ],
            Condition = $"{nameof(MatCategoryFormModel.Category)}.{nameof(Category.CategoryId)} = \"{EscapeQueryValue(categoryId)}\""
        };
    }
    /// <summary>
    /// 跳脫查詢條件中的雙引號字串值。
    /// </summary>
    private static string EscapeQueryValue(string value)
    {
        return (value ?? string.Empty).Replace("\"", "\"\"");
    }
    /// <summary>
    /// 依後台 RowNo 將動態欄位整理成有序回傳資料。
    /// </summary>
    private static List<MatCategoryInfoFieldItem_DTO> BuildInfoFieldResult(MatCategoryFormModel? form, LangCode lang)
    {
        List<MatCategoryInfoFieldItem_DTO> result = [];
        HashSet<string> fieldKeys = new(StringComparer.Ordinal);
        IEnumerable<MatCategoryInfoField> fields = (form?.MatCategoryInfoField ?? [])
            .OrderBy(item => Convert.ToInt32(item.RowNo))
            .ThenBy(item => Convert.ToInt32(item.RowId));
        foreach (MatCategoryInfoField field in fields) AddInfoFieldResult(result, fieldKeys, field, lang);
        return result;
    }
    /// <summary>
    /// 將單一有效欄位加入結果並避免重複 Field key。
    /// </summary>
    private static void AddInfoFieldResult(List<MatCategoryInfoFieldItem_DTO> result, HashSet<string> fieldKeys, MatCategoryInfoField field, LangCode lang)
    {
        string fieldKey = field.Field ?? string.Empty;
        if (string.IsNullOrWhiteSpace(fieldKey) || !fieldKeys.Add(fieldKey)) return;
        result.Add(new MatCategoryInfoFieldItem_DTO
        {
            Field = fieldKey,
            DisplayName = ResolveDisplayName(field, lang, fieldKey),
            RowNo = Convert.ToInt32(field.RowNo)
        });
    }
    /// <summary>
    /// 依目前語系、繁中、其他語系、Field key 的順序取得顯示名稱。
    /// </summary>
    private static string ResolveDisplayName(MatCategoryInfoField field, LangCode lang, string fieldKey)
    {
        List<MatCategoryInfoFieldDisplay> displays = field._MatCategoryInfoFieldDisplay ?? [];
        string? current = FindDisplayName(displays, lang);
        string? zhtw = FindDisplayName(displays, LangCode.zhtw);
        string? first = displays
            .OrderBy(item => Convert.ToInt32(item.RowNo))
            .ThenBy(item => Convert.ToInt32(item.RowId))
            .Select(item => NormalizeDisplayName(item.FieldDisplayName))
            .FirstOrDefault(item => item != null);
        return current ?? zhtw ?? first ?? $"【{fieldKey}】";
    }
    /// <summary>
    /// 取得指定語系第一個有效顯示名稱。
    /// </summary>
    private static string? FindDisplayName(IEnumerable<MatCategoryInfoFieldDisplay> displays, LangCode lang)
    {
        return displays
            .Where(item => item.Lang == lang)
            .OrderBy(item => Convert.ToInt32(item.RowNo))
            .ThenBy(item => Convert.ToInt32(item.RowId))
            .Select(item => NormalizeDisplayName(item.FieldDisplayName))
            .FirstOrDefault(item => item != null);
    }
    /// <summary>
    /// 正規化顯示名稱，空白內容視為未設定。
    /// </summary>
    private static string? NormalizeDisplayName(string? displayName)
    {
        return string.IsNullOrWhiteSpace(displayName) ? null : displayName.Trim();
    }
    #endregion
}
