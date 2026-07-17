using WCMS.Features._Resx;
using WCMS.SysCore.Configuration;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.FeatureDriver.Runtime;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.WEB.PageManagement;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.PageManagement)]
public class PageManagementBiz(BizDeps bizDeps) : BizService<PageManagement>(bizDeps)
{
    #region Public
    /// <summary>
    /// 獲取可被SiteMenu設定的功能模塊列表
    /// </summary>
    /// <returns></returns>
    public Dictionary<string, string> GetSiteMenuUsedProgList()
    {
        Dictionary<string, string> dict = new()
        {
            { ProgKeys.WEB.PageManagement, I18n.GetFieldLabel(typeof(ProgKeys.WEB), nameof(ProgKeys.WEB.PageManagement))},
            { ProgKeys.WEB.Announcement, I18n.GetFieldLabel(typeof(ProgKeys.WEB), nameof(ProgKeys.WEB.Announcement))},
            { ProgKeys.WEB.FileArchive, I18n.GetFieldLabel(typeof(ProgKeys.WEB), nameof(ProgKeys.WEB.FileArchive))},
            { ProgKeys.WEB.WebResource, I18n.GetFieldLabel(typeof(ProgKeys.WEB), nameof(ProgKeys.WEB.WebResource))},
            { ProgKeys.WEB.Gallery, I18n.GetFieldLabel(typeof(ProgKeys.WEB), nameof(ProgKeys.WEB.Gallery))},
            { ProgKeys.MAT.Material, I18n.GetFieldLabel(typeof(ProgKeys.MAT), nameof(ProgKeys.MAT.Material))},
        };
        SpecGetSiteMenuUsedProgList(dict);
        return dict;
    }
    #endregion

    #region Protected Virtual
    /// <summary>
    /// 保存前執行 AA 與功能代碼驗證。
    /// </summary>
    protected override async Task BeforeUpdate(PageManagement data, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(data, act, ct);
        if (act is FuncAction.Create or FuncAction.Update) CheckData(data);
    }
    /// <summary>
    /// 給Spec功能要追加的功能模塊
    /// </summary>
    /// <param name="dict"></param>
    protected virtual void SpecGetSiteMenuUsedProgList(Dictionary<string, string> dict) { }
    #endregion

    #region Protected
    protected void CheckData(PageManagement set)
    {
        AACheck(set);
        CheckProgId(set);
    }

    protected void CheckInUsed(PageManagement set)
    {
        CheckIsUsedBySiteMenu();
    }
    #endregion

    #region Private
    /// <summary>
    /// 檢查AAContent，將舊資料的AAContent轉成新的格式
    /// </summary>
    /// <param name="langDt"></param>
    private void AACheck(PageManagement set)
    {
        if (!SpecSettings.AACheck) return;
        set._PageManagementDetail.ForEach(dt =>
        {
            if (dt.Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.AACode00003, dt.Lang.ToLabel(), I18n.GetLabel<PageManagementDetail>(x => x.Title));
            if (LibAAData.CheckAAContent(dt.Content, Message, I18n, out string newContent)) dt.Content = newContent;
        });
    }
    /// <summary>
    /// 如果【所屬功能模塊】欄位不在GetSiteMenuUsedProgList之中，就自動帶入PageManagement，避免使用者輸入錯誤的ProgId導致SiteMenu無法設定
    /// </summary>
    /// <param name="header"></param>
    private void CheckProgId(PageManagement header)
    {
        List<string> progIds = [.. GetSiteMenuUsedProgList().Keys];
        if (!progIds.Contains(header.ProgId)) header.ProgId = ProgKeys.WEB.PageManagement;
    }
    /// <summary>
    /// 檢查資料是否被網站導覽給使用
    /// </summary>
    private void CheckIsUsedBySiteMenu()
    {
        /* 需要先整理一下前端對於這些Json的格式後在來處理，否則會東一塊西一塊的名稱 */
    }
    #endregion
}
