using System.Data;
using WCMS.Features._Resx;
using WCMS.Features.WEB.Announcement;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.WEB.FileArchive;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.FileArchive)]
public class FileArchiveBiz(BizDeps bizDeps) : BizService<FileArchive>(bizDeps), IBizService<FileArchive> {

    #region Migration Old Data
    public async Task Migrate(string importFileLabel = "1810", IList<FileManageModel> srcFileSets = default)
    {
        FileArchive[] datas = ConvertToApiModel(importFileLabel,srcFileSets);
        await BizInitCreateDatasAsync(datas);
    }
    private FileArchive[] ConvertToApiModel(string importFileLabel, IList<FileManageModel> srcFileSets = default)
    {
        List<FileArchive> result = [];
        Dictionary<string, string> sqls = new()
        {
            { "Archive", "Select * From Archive" },
            { "Archive_Lang", "Select * From Archive_Lang" },
        };
        DataSet ds = MigrateOldData.GetOldData(sqls);
        List<FileManageModel> updateFileSets = [];
        foreach (DataRow srcHeader in ds.Tables["Archive"].Rows)
        {
            FileArchive set = new()
            {
                FileArchiveId = srcHeader["Sn"].ToString(),
                CategoriesId = srcHeader["Category"].ToString(),
                TagsId = srcHeader["Tag"].ToString(),
                ContentStatus = GetContentStatus(srcHeader["Status"].ToString()),
                CreateTime = srcHeader["CreateTime"].ToString().ToDateTime(),
                ModifyTime = srcHeader["UpdateTime"].ToString().ToDateTime(),
            };
            int rowId = 1;
            ds.Tables["Archive_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.FileArchiveId).ToList().ForEach(dRow =>
            {
                if (!dRow["Title"].IsNullOrEmpty())
                {
                    LangCodeExt.TryParse(dRow["Lang"].ToString(), out LangCode lang);
                    FileArchiveInfo info = new()
                    {
                        FileArchiveId = set.FileArchiveId,
                        RowId = rowId,
                        Lang = lang,
                        Title = dRow["Title"].ToString(),
                    };
                    set._FileArchiveInfo.Add(info);
                    for (int i = 1; i < 10; i++)
                    {
                        string subFileName = dRow[$"Filename{i}"].ToString();
                        string subFileRName = dRow[$"File{i}"].ToString();
                        if (!subFileName.IsNullOrEmpty() && !subFileRName.IsNullOrEmpty())
                        {
                            FileManageModel fileSet = GetSetByPicture(subFileRName, srcFileSets);
                            updateFileSets.Add(fileSet);
                            fileSet.FileName = subFileName;
                            fileSet.FileDescription = subFileName;
                            info._FileArchiveDetail.Add(new FileArchiveDetail()
                            {
                                FileArchiveId = set.FileArchiveId,
                                ParentRowId = rowId,
                                RowId = i,
                                FileSrcId = fileSet.InternalId,
                                FileName = subFileName,
                            });
                        }
                    }
                    rowId++;
                }
            });
            result.Add(set);
        }
        foreach (var set in updateFileSets.Distinct()) { set.ProgId = ProgId; }
        return [.. result];
    }
    private static ContentStatus GetContentStatus(string status)
    {
        ContentStatus result = ContentStatus.None;
        foreach (string s in status.Split(','))
        {
            switch (s.Trim().ToLower())
            {
                case "hide":
                    result |= ContentStatus.Hidden;
                    break;
                case "hot":
                    result |= ContentStatus.Hot;
                    break;
                case "top":
                    result |= ContentStatus.Top;
                    break;
            }
        }
        return result;
    }
    private static FileManageModel GetSetByPicture(string srcPic, IList<FileManageModel> fileSets)
    {
        return fileSets.Where(x => x._FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/Archive/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
    }
    #endregion

    #region Protected
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

    #region Private
    /// <summary>
    /// 
    /// </summary>
    /// <param name="set"></param>
    private void CheckData(FileArchive set)
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
    private static void SetData(FileArchive set)
    {
        DoRemergeData(set);
        foreach (FileArchiveInfo info in set._FileArchiveInfo)
        {
            RemoveEmptyFileSrcData(info._FileArchiveDetail);
            RemoveEmptyUrlSrcData(info._FileArchiveUrlDetail);
        }
    }
    /// <summary>
    /// 檢查類別是否為空
    /// </summary>
    /// <param name="header"></param>
    private void CheckDataIsEmpty(FileArchive set)
    {
        if (set.CategoriesId == "") Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<FileArchive>(x => x.CategoriesId));
        if (set._FileArchiveInfo.FirstOrDefault(p => p.Lang==SiteDefaultLang) == null || set._FileArchiveInfo.FirstOrDefault(p => p.Lang == SiteDefaultLang).Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00015, SiteDefaultLang.ToLabel(), I18nCache.GetLabel<FileArchiveInfo>(x => x.Title));
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
        for (int i = detail.Count - 1; i >= 0; i--) if (detail[i].Url.IsNullOrEmpty()&& detail[i].UrlDescription.IsNullOrEmpty()) detail.RemoveAt(i);
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
        if (!dt.Url.IsNullOrEmpty() && dt.UrlDescription.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<FileArchiveUrlDetail>(x => x.UrlDescription));
        if (dt.Url.IsNullOrEmpty() && !dt.UrlDescription.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<FileArchiveUrlDetail>(x => x.Url));
    }
    #endregion
}
