using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1810.WEB.SpecResearch;
using WCMS.SpecFeatures.Spec1810.WEB.SpecUSR;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecCategory;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.Spec.SpecCategory)]
public class SpecCategoryBiz(BizDeps bizDeps) : BizService<SpecCategory>(bizDeps)
{
    #region Public
    public Dictionary<string, string> GetShowColumnItems(string progId)
    {
        Dictionary<string, string> result = [];

        switch (progId)
        {
            case "SpecResearch":
                {
                    string[] notmapFields = [nameof(SpecResearchDetail_DTO.ResearchId), nameof(SpecResearchDetail_DTO.RowId), nameof(SpecResearchDetail_DTO.Lang)];
                    foreach (var prop in ModelMetadata.GetProperties<SpecResearchDetail_DTO>())
                    {
                        if (notmapFields.Contains(prop.Name)) continue;
                        result.Add(prop.Name, I18n.GetLabel(prop));
                    }
                    break;
                }
            case "SpecUSR":
                {
                    string[] notmapFields = [nameof(SpecUSRDetail_DTO.USRId), nameof(SpecUSRDetail_DTO.RowId), nameof(SpecUSRDetail_DTO.Lang)
                        , nameof(SpecUSRDetail_DTO.Url), nameof(SpecUSRDetail_DTO.UrlDescription)];
                    foreach (var prop in ModelMetadata.GetProperties<SpecUSRDetail_DTO>())
                    {
                        if (notmapFields.Contains(prop.Name)) continue;
                        result.Add(prop.Name, I18n.GetLabel(prop));
                    }
                    break;
                }
        }
        return result;
    }
    #endregion

    #region Protected
    protected override async Task BeforeUpdate(SpecCategory set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                DoRemergeData(set.SpecCategory);
                break;
            case FuncAction.Delete:
                await CheckIsUsedAsync(set);
                break;
        }
    }
    #endregion

    #region Private
    /// <summary>
    /// 重新組合多筆資料(類別、狀態、標籤)
    /// </summary>
    /// <param name="header"></param>
    private static void DoRemergeData(SpecCategory header)
    {
        header.ShowColumnItems = header.ShowColumnItems.Remerge(",");
    }
    private async Task CheckIsUsedAsync(SpecCategory set)
    {
        string progId = set.SpecCategory.ProgId;
        string cateId = set.SpecCategory.CategoryId;
        string cateName = set.SpecCategoryDetail.FirstOrDefault(p => p.Lang == EffectiveLang).CategoryName;
        int useCount = 0;
        switch (progId)
        {
            case "SpecUSR":
                useCount = await DoQueryListCountAsync<SpecUSR>($@"{nameof(SpecUSR.CategoryId)} = {cateId}");
                break;
            case "SpecResearch":
                useCount = await DoQueryListCountAsync<SpecResearch>($@"{nameof(SpecResearch.CategoryId)} = {cateId}");
                break;
        }
        if (useCount > 0) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00018, cateName);
    }
    #endregion
}
