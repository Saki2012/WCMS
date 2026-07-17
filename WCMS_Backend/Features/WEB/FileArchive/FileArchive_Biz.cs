using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.WEB.FileArchive;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.FileArchive)]
public class FileArchiveBiz(BizDeps bizDeps) : BizService<FileArchive>(bizDeps)
{
    #region Protected Virtual
    protected override async Task BeforeUpdate(FileArchive set, FuncAction act, CancellationToken ct = default)
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

    #region Protected
    /// <summary>
    /// 
    /// </summary>
    /// <param name="set"></param>
    protected void CheckData(FileArchive set)
    {
        CheckDataIsEmpty(set);
        foreach (var urlDt in set._FileArchiveInfo.SelectMany(info => info._FileArchiveUrlDetail).ToList())
        {
            CheckRegularUrl(urlDt);
            CheckUrlIsEmpty(urlDt);
        }
    }
    /// <summary>
    /// 
    /// </summary>
    /// <param name="set"></param>
    protected static void SetData(FileArchive set)
    {
        DoRemergeData(set);
        foreach (FileArchiveInfo info in set._FileArchiveInfo)
        {
            RemoveEmptyFileSrcData(info._FileArchiveDetail);
            RemoveEmptyUrlSrcData(info._FileArchiveUrlDetail);
        }
    }
    #endregion

    #region Private
    /// <summary>
    /// 檢查類別是否為空
    /// </summary>
    /// <param name="header"></param>
    private void CheckDataIsEmpty(FileArchive set)
    {
        if (set.CategoriesId == "") Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<FileArchive>(x => x.CategoriesId));
        if (set._FileArchiveInfo.FirstOrDefault(p => p.Lang == SiteDefaultLang) == null || set._FileArchiveInfo.FirstOrDefault(p => p.Lang == SiteDefaultLang).Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00015, SiteDefaultLang.ToLabel(), I18n.GetLabel<FileArchiveInfo>(x => x.Title));
    }
    /// <summary>
    /// 如果沒有上傳檔案成功的項目，就移除該項目防呆
    /// </summary>
    /// <param name="fileArchiveDetail"></param>
    private static void RemoveEmptyFileSrcData(List<FileArchiveDetail> fileArchiveDetail)
    {
        for (int i = fileArchiveDetail.Count - 1; i >= 0; i--) if (fileArchiveDetail[i].FileSrcId.IsNullOrEmpty()) fileArchiveDetail.RemoveAt(i);
    }
    /// <summary>
    /// 如果沒有輸入網址和網址說明的，就移除該項目防呆
    /// </summary>
    /// <param name="fileArchiveDetail"></param>
    private static void RemoveEmptyUrlSrcData(List<FileArchiveUrlDetail> detail)
    {
        for (int i = detail.Count - 1; i >= 0; i--) if (detail[i].Url.IsNullOrEmpty() && detail[i].UrlDescription.IsNullOrEmpty()) detail.RemoveAt(i);
    }
    /// <summary>
    /// 重新組合多筆資料(類別、狀態、標籤)
    /// </summary>
    /// <param name="header"></param>
    private static void DoRemergeData(FileArchive header)
    {
        header.CategoriesId = header.CategoriesId.Remerge(",");
        header.TagsId = header.TagsId.Remerge(",");
    }
    /// <summary>
    /// 
    /// </summary>
    /// <param name="dt"></param>
    private void CheckRegularUrl(FileArchiveUrlDetail dt)
    {
        if (!dt.Url.IsNullOrEmpty() && !LibData.UrlChecks.IsHttpOrRelativeUrl(dt.Url)) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00027, dt.Url);
    }

    private void CheckUrlIsEmpty(FileArchiveUrlDetail dt)
    {
        if (!dt.Url.IsNullOrEmpty() && dt.UrlDescription.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<FileArchiveUrlDetail>(x => x.UrlDescription));
        if (dt.Url.IsNullOrEmpty() && !dt.UrlDescription.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<FileArchiveUrlDetail>(x => x.Url));
    }
    #endregion
}
