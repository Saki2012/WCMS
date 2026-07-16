using WCMS.Features._Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecUSR;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.Spec.SpecUSR)]
public class SpecUSRBiz(BizDeps bizDeps) : BizService<SpecUSR>(bizDeps), IBizService<SpecUSR> 
{
    #region Protected
    protected override async Task BeforeUpdate(SpecUSR set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                CheckData(set);
                SetData(set);
                break;
        }
    }
    #endregion

    #region Private
    private void CheckData(SpecUSR set)
    {
        CheckIsEmpty(set);
    }
    private void SetData(SpecUSR set)
    {
        DoRemergeData(set.SpecUSR);
        SetFileEmptyToNull(set.SpecUSR);
    }
    private void CheckIsEmpty(SpecUSR set)
    {
        if (set.SpecUSR.CategoryId.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<SpecUSR>(x => x.CategoryId));
    }
    /// <summary>
    /// 重新組合多筆資料(類別、狀態、標籤)
    /// </summary>
    /// <param name="header"></param>
    private static void DoRemergeData(SpecUSR header)
    {
        header.Tags = header.Tags.Remerge(",");
    }
    /// <summary>
    /// 將空白的圖片(無檔案)設置為null，避免報錯
    /// </summary>
    /// <param name="header"></param>
    private static void SetFileEmptyToNull(SpecUSR header) 
    {
        if (header.PictureId.IsNullOrEmpty()) header.PictureId = null;
    }
    #endregion
}
