using System.Data;
using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.Features.WEB.WebResource;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.WebResource)]
public class WebResourceBiz(BizDeps bizDeps) : BizService<WebResourceSet>(bizDeps), IBizService<WebResourceSet> 
{
    #region Migration Old Data
    public async Task Migrate(string importFileLabel = "1810", IList<FileManageSet> srcFileSets = default)
    {
        WebResourceSet[] datas = ConvertToApiModel(importFileLabel,srcFileSets);
        await BizInitCreateSetsAsync(datas);
    }
    private WebResourceSet[] ConvertToApiModel(string importFileLabel, IList<FileManageSet> srcFileSets = default)
    {
        List<WebResourceSet> result = [];
        Dictionary<string, string> sqls = new()
        {
            { "WebResource", "Select * From WebResource" },
            { "WebResource_Lang", "Select * From WebResource_Lang" },
        };
        DataSet ds = MigrateOldData.GetOldData(sqls);
        var fileSrcIdDic = srcFileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
        List<FileManageSet> updateFileSets = [];

        foreach (DataRow row in ds.Tables["WebResource"].Rows)
        {
            WebResourceSet set = new() { };
            result.Add(set);

            string picFileName = row["Pic"].ToString();
            string picDescription = row["PicDescription"].ToString();
            set.WebResource.PicId = picFileName;
            if (!picFileName.IsNullOrEmpty())
            {
                FileManageSet fileInfo = GetSetByPicture(picFileName, srcFileSets);
                updateFileSets.Add(fileInfo);
                fileInfo.FileManage.FileName = picFileName;
                if (!picDescription.IsNullOrEmpty()) fileInfo.FileManage.FileDescription = picDescription;
                set.WebResource.PicId = fileInfo.FileManage.InternalId;
                fileInfo.FileManage.FileDescription = picDescription;
            }
            set.WebResource.PicDescription = picDescription;
            set.WebResource.WebResourceId = row["Sn"].ToString();
            set.WebResource.Categories = row["Category"].ToString();
            set.WebResource.ContentStatus = GetContentStatus(row["Status"].ToString());
            set.WebResource.Tags = row["Tag"].ToString();
            set.WebResource.CreateTime = row["CreateTime"].ToString().ToDateTime();
            set.WebResource.ModifyTime = row["UpdateTime"].ToString().ToDateTime();

            int rowId = 1;
            foreach (var dRow in ds.Tables["WebResource_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.WebResource.WebResourceId).ToList())
            {
                if (!dRow["Title"].ToString().IsNullOrEmpty())
                {
                    LangCodeExt.TryParse(dRow["Lang"].ToString(), out LangCode lang);
                    WebResourceInfo detail = new()
                    {
                        WebResourceId = set.WebResource.WebResourceId,
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
                    set.WebResourceInfo.Add(detail);
                }
            }
        }
        foreach (var set in updateFileSets.Distinct())
        {
            set.FileManage.ProgId = ProgId;
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
    private FileManageSet GetSetByPicture(string srcPic, IList<FileManageSet> fileSets)
    {
        return fileSets.Where(x => x.FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/WebResource/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
    }
    #endregion

    #region Protected
    protected override async Task BeforeUpdate(WebResourceSet set, FuncAction act, CancellationToken ct = default)
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
    private void CheckData(WebResourceSet set)
    {
        CheckIsEmpty(set);
    }
    private void CheckIsEmpty(WebResourceSet set)
    {
        if (set.WebResourceInfo.FirstOrDefault(p => p.Lang==SiteDefaultLang) == null || set.WebResourceInfo.FirstOrDefault(p => p.Lang== SiteDefaultLang).Title.IsNullOrEmpty())
            Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00015, SiteDefaultLang.ToLabel(), I18nCache.GetLabel<WebResourceInfo_DTO>(x => x.Title));
    }
    /// <summary>
    /// 重新組合多筆資料(類別、狀態、標籤)
    /// </summary>
    /// <param name="header"></param>
    private static void DoRemergeData(WebResource header)
    {
        header.Categories = header.Categories.Remerge(",");
        header.Tags = header.Tags.Remerge(",");
    }
    private static void SetData(WebResourceSet set)
    {
        DoRemergeData(set.WebResource);
        foreach (var dt in set.WebResourceInfo)
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
        dt.ResUrl= YouTubeUrlHelper.NormalizeToShortUrlOrOriginal(dt.ResUrl);
    }
    #endregion
}
