using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using System.Data;
using System.IO;
using WCMS.Features.SiteEdit.Category;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.WebResource
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class WebResourceController : ApiDataController<WebResourceSet>
    {
#if DEBUG //轉移舊系統資料
        [HttpPost(nameof(Migrate))]
        public async Task<IActionResult> Migrate(CancellationToken ct, string importFileLabel="1810")
        {
            WebResourceSet[] datas = await ConvertToApiModel(importFileLabel);
            return await InitialCreateData(datas,ct);
        }
        private async Task<WebResourceSet[]> ConvertToApiModel(string importFileLabel)
        {
            List<WebResourceSet> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "WebResource", "Select * From WebResource" },
                { "WebResource_Lang", "Select * From WebResource_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);

            var importFileInternalIds = await FileService.QueryListAsync([nameof(FileManageModel.InternalId)], $"{nameof(FileManageModel.ImportLabel)} = {importFileLabel}", 0, 0);
            List<FileManageSet> fileSets = [];
            foreach (var id in importFileInternalIds.Data.Select(p => p.FileManage.InternalId).ToList().Distinct())
            {
                var data = await FileService.QuerySetAsync(id);
                fileSets.Add(data.Data.LastOrDefault());
            }
            var fileSrcIdDic = fileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
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
                    FileManageSet fileInfo = GetSetByPicture(picFileName, fileSets);
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
                set.WebResource.CreateTime = Convert.ToDateTime(row["CreateTime"]);
                set.WebResource.ModifyTime = Convert.ToDateTime(row["UpdateTime"]);
                set.WebResource.IsIniData = true;
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
                            ResUrl = dRow["URL"].ToString(),
                            Url_OpenType = dRow["URL_Open"].ToString(),
                        };
                        set.WebResourceInfo.Add(detail);
                    }
                }
            }
            foreach (var set in updateFileSets.Distinct())
            {
                set.FileManage.ProgId = this.Service.ProgId;
                await FileService.UpdateSetAsync(set.FileManage.InternalId, set);
            }
            return [.. result];
        }

        private static ContentStatus GetContentStatus(string status)
        {
            ContentStatus result = ContentStatus.None;
            foreach(string s in status.Split(','))
            {
                switch (s.Trim().ToLower())
                {
                    case "hide":
                        result|= ContentStatus.Hidden;
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
        private FileManageSet GetSetByPicture(string srcPic, List<FileManageSet> fileSets)
        {
            return fileSets.Where(x => x.FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/WebResource/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
        }
#endif
    }
}
