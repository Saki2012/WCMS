using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WCMS.Features._Resx;
using WCMS.Features.COMM.Category;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Api.Contracts;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
namespace WCMS.Features.MAT.MatCategory;

/// <summary>
/// MAT 類別組合式表單 API。
/// </summary>
[LibApiController(ProgKeys.MAT.Code, ProgKeys.MAT.MatCategory, FuncAction.MasterData)]
public class MatCategoryController : CategoryControllerBase<MatCategoryFormModel>
{
    #region Public
    /// <summary>
    /// 取得物件類別的動態欄位與指定語系顯示名稱。
    /// </summary>
    [HttpGet(nameof(GetMatCateInfoFields)), AllowAnonymous, IgnoreAntiforgeryToken]
    public async Task<IActionResult> GetMatCateInfoFields(string catId, string lang, CancellationToken ct)
    {
        LangCode langCode = LangCodeExt.Normalize(lang);
        QueryListParam param = BuildInfoFieldQuery(catId, langCode);
        MatCategoryFormModel? form = (await Service.BizQueryListAsync(param, ct)).FirstOrDefault();
        Dictionary<string, string> result = BuildInfoFieldResult(form, langCode);
        return Ok(new ApiResponse<Dictionary<string, string>> { Data = [result], SysMessage = Message.Messages });
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立 MAT 類別動態欄位查詢條件。
    /// </summary>
    private static QueryListParam BuildInfoFieldQuery(string categoryId, LangCode lang)
    {
        string fieldPath = nameof(MatCategoryFormModel.MatCategoryInfoField);
        string displayPath = $"{fieldPath}.{nameof(MatCategoryInfoField._MatCategoryInfoFieldDisplay)}";
        return new QueryListParam
        {
            Fields = [
                $"{nameof(MatCategoryFormModel.Category)}.{nameof(Category.CategoryId)}",
                $"{fieldPath}.{nameof(MatCategoryInfoField.Field)}",
                $"{displayPath}.{nameof(MatCategoryInfoFieldDisplay.Lang)}",
                $"{displayPath}.{nameof(MatCategoryInfoFieldDisplay.FieldDisplayName)}"
            ],
            Condition = LibData.Merge(SysParam.QueryOperators.And, false,
                $"{nameof(MatCategoryFormModel.Category)}.{nameof(Category.CategoryId)} = \"{EscapeQueryValue(categoryId)}\"",
                $"{displayPath}.{nameof(MatCategoryInfoFieldDisplay.Lang)} = {lang}")
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
    /// 將 MAT 類別動態欄位整理成 Field 與顯示名稱對照。
    /// </summary>
    private static Dictionary<string, string> BuildInfoFieldResult(MatCategoryFormModel? form, LangCode lang)
    {
        Dictionary<string, string> result = [];
        foreach (MatCategoryInfoField field in form?.MatCategoryInfoField ?? [])
        {
            string? displayName = field._MatCategoryInfoFieldDisplay.FirstOrDefault(item => item.Lang == lang)?.FieldDisplayName;
            if (!string.IsNullOrWhiteSpace(field.Field) && displayName != null) result.TryAdd(field.Field, displayName);
        }
        return result;
    }
    #endregion
}
