using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;
using WCMS.Features._Resx;
using WCMS.Features.COMM.Category;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Api;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.Features.MAT.MatCategory;

[LibApiController(ProgKeys.MAT.Code, ProgKeys.MAT.MatCategory, SysEnum.FuncAction.MasterData)]
public class MatCategoryController : CategoryControllerBase<MatCategoryDataSet, MatCategoryDataSet_DTO>{

    #region Public
    /// <summary>
    /// 取得物件類別的動態欄位資訊（Field Id 跟對應語系的顯示名稱）
    /// </summary>
    [HttpGet(nameof(GetMatCateInfoFields)), AllowAnonymous, IgnoreAntiforgeryToken]
    public async Task<IActionResult> GetMatCateInfoFields(string catId, string lang, CancellationToken ct)
    {
        LangCode langCode = LangCodeExt.Normalize(lang);
        QueryListParam param = new()
        {
            Fields = [
                nameof(MatCategoryInfoField.CategoryId),
                $"{nameof(Category._MatCategoryInfoField)}.{nameof(MatCategoryInfoField.Field)}",
                $"{nameof(Category._MatCategoryInfoField)}.{nameof(MatCategoryInfoField._MatCategoryInfoFieldDisplay)}.{nameof(MatCategoryInfoFieldDisplay.Lang)}",
                $"{nameof(Category._MatCategoryInfoField)}.{nameof(MatCategoryInfoField._MatCategoryInfoFieldDisplay)}.{nameof(MatCategoryInfoFieldDisplay.FieldDisplayName)}",
                ],
            Condition =  LibData.Merge(" And ",false, $"{nameof(Category.CategoryId)} = {catId}",
            $"{nameof(Category._MatCategoryInfoField)}.{nameof(MatCategoryInfoField._MatCategoryInfoFieldDisplay)}.{nameof(MatCategoryInfoFieldDisplay.Lang)} = {langCode}"
            )
        };
        var queryResult = (await Service.BizQueryListAsync(param,ct)).FirstOrDefault();
        var result = new Dictionary<string, string>();
        queryResult.MatCategoryInfoField.ForEach(data => { result.TryAdd(data.Field, data._MatCategoryInfoFieldDisplay.Find(p => p.Lang == langCode).FieldDisplayName); });
        // 回傳結果
        var response = new ApiResponse<Dictionary<string, string>>() { Data = [result], SysMessage = Message.Messages };
        return Ok(response);
    }
    #endregion
}
