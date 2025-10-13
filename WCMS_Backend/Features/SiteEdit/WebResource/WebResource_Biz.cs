using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Resx;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.WebResource
{
    [ProgId("WebResource")]
    public class WebResourceBiz(IRepositoryMapProvider repo, IErrorHelper message) : BizService<WebResourceSet>(repo, message), IBizService<WebResourceSet> 
    {

        #region Migration Old Data
        public async Task Migrate(string importFileLabel = "1810", IList<FileManageSet> srcFileSets = default)
        {
            WebResourceSet[] datas = await ConvertToApiModel(importFileLabel,srcFileSets);
            await BizInitCreateSetsAsync(datas);
        }
        private async Task<WebResourceSet[]> ConvertToApiModel(string importFileLabel, IList<FileManageSet> srcFileSets = default)
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
                        WebResourceInfo detail = new()
                        {
                            WebResourceId = set.WebResource.WebResourceId,
                            RowId = rowId++,
                            Lang = dRow["Lang"].ToString(),
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
        protected override void BeforeUpdate(WebResourceSet set, SysEnum.FuncAction act)
        {
            base.BeforeUpdate(set, act);
            switch (act)
            {
                case SysEnum.FuncAction.Create:
                case SysEnum.FuncAction.Update:
                    CheckData(set);
                    DoRemergeData(set.WebResource);
                    break;
            }
        }
        #endregion

        private void CheckData(WebResourceSet set)
        {
            CheckDate(set.WebResource);
        }


        private void CheckDate(WebResource header)
        {
            //if (header.Validate_Start == null) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<WebResource>(x => x.Validate_Start));
            //if (header.Validate_End == null) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<WebResource>(x => x.Validate_End));
            //if (header.Validate_End != null && header.Validate_Start > header.Validate_End) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00014, I18nCache.GetLabel<WebResource>(x => x.Validate_End) , I18nCache.GetLabel<WebResource>(x => x.Validate_Start));

            if (header.Categories == "") Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<WebResource>(x => x.Categories));

        }


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
        #endregion
    }
}
