using System.Data;
using WCMS.Features._Resx;
using WCMS.Features.WEB.Content;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.PlatformServices.FileManagement;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.WEB.WebResource;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.WebResource)]
public class WebResourceBiz(BizDeps bizDeps) : BizService<WebResource>(bizDeps), IBizService<WebResource>
{
    #region Migration Old Data
    public async Task Migrate(string importFileLabel = "1810", IList<FileManageModel> srcFileSets = default)
    {
        WebResource[] datas = ConvertToApiModel(importFileLabel, srcFileSets);
        await BizInitCreateDatasAsync(datas);
    }
    private WebResource[] ConvertToApiModel(string importFileLabel, IList<FileManageModel> srcFileSets = default)
    {
        List<WebResource> result = [];
        Dictionary<string, string> sqls = new()
        {
            { "WebResource", "Select * From WebResource" },
            { "WebResource_Lang", "Select * From WebResource_Lang" },
        };
        DataSet ds = MigrateOldData.GetOldData(sqls);
        List<FileManageModel> updateFileSets = [];

        foreach (DataRow row in ds.Tables["WebResource"].Rows)
        {
            WebResource set = new() { };
            result.Add(set);

            string picFileName = row["Pic"].ToString();
            string picDescription = row["PicDescription"].ToString();
            set.PicId = picFileName;
            if (!picFileName.IsNullOrEmpty())
            {
                FileManageModel fileInfo = GetSetByPicture(picFileName, srcFileSets);
                updateFileSets.Add(fileInfo);
                fileInfo.FileName = picFileName;
                if (!picDescription.IsNullOrEmpty()) fileInfo.FileDescription = picDescription;
                set.PicId = fileInfo.InternalId;
                fileInfo.FileDescription = picDescription;
            }
            set.PicDescription = picDescription;
            set.WebResourceId = row["Sn"].ToString();
            set.Categories = row["Category"].ToString();
            set.ContentStatus = GetContentStatus(row["Status"].ToString());
            set.Tags = row["Tag"].ToString();
            set.CreateTime = row["CreateTime"].ToString().ToDateTime();
            set.ModifyTime = row["UpdateTime"].ToString().ToDateTime();

            int rowId = 1;
            foreach (var dRow in ds.Tables["WebResource_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.WebResourceId).ToList())
            {
                if (!dRow["Title"].ToString().IsNullOrEmpty())
                {
                    LangCodeExt.TryParse(dRow["Lang"].ToString(), out LangCode lang);
                    WebResourceInfo detail = new()
                    {
                        WebResourceId = set.WebResourceId,
                        RowId = rowId++,
                        Lang = lang,
                        Title = dRow["Title"].ToString(),
                        Content = dRow["Content"].ToString(),
                        ResUrl = dRow["Url"].ToString(),
                        Url_OpenType = dRow["URL_Open"].ToString() switch
                        {
                            "2" => WindowTarget.Blank,
                            _ => WindowTarget.Self,
                        },
                    };
                    set._WebResourceInfo.Add(detail);
                }
            }
        }
        foreach (var set in updateFileSets.Distinct())
        {
            set.ProgId = ProgId;
        }
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
    private FileManageModel GetSetByPicture(string srcPic, IList<FileManageModel> fileSets)
    {
        return fileSets.Where(x => x._FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/WebResource/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
    }
    #endregion

    #region Protected Virtual
    protected override async Task BeforeUpdate(WebResource set, FuncAction act, CancellationToken ct = default)
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
    protected void CheckData(WebResource set)
    {
        CheckIsEmpty(set);
    }
    protected void CheckIsEmpty(WebResource set)
    {
        if (set._WebResourceInfo.FirstOrDefault(p => p.Lang == SiteDefaultLang) == null || set._WebResourceInfo.FirstOrDefault(p => p.Lang == SiteDefaultLang).Title.IsNullOrEmpty())
            Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00015, SiteDefaultLang.ToLabel(), I18n.GetLabel<WebResourceInfo>(x => x.Title));
    }
    #endregion  

    #region Private

    /// <summary>
    /// 重新組合多筆資料(類別、狀態、標籤)
    /// </summary>
    /// <param name="header"></param>
    private static void DoRemergeData(WebResource header)
    {
        header.Categories = header.Categories.Remerge(",");
        header.Tags = header.Tags.Remerge(",");
    }
    private static void SetData(WebResource set)
    {
        DoRemergeData(set);
        foreach (var dt in set._WebResourceInfo)
        {
            SetYoutubeUrl(dt);
        }
    }
    /// <summary>
    /// 自動轉譯Youtube短網址
    /// </summary>
    /// <param name="set"></param>
    private static void SetYoutubeUrl(WebResourceInfo dt)
    {
        dt.ResUrl = YouTubeUrlHelper.NormalizeToShortUrlOrOriginal(dt.ResUrl);
    }
    #endregion
}
