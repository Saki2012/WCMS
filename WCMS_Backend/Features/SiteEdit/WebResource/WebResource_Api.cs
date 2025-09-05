using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.IO;
using WCMS.Features.SiteEdit.Category;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.WebResource
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class WebResourceController : ApiDataController<WebResourceSet, WebResourceSet_DTO>
    {
        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task<IActionResult> Migrate(CancellationToken ct, string importFileLabel="1810")
        {
            WebResourceSet_DTO[] datas = await ConvertToApiModel(importFileLabel);
            return await InitialCreateData(datas,ct);
        }
        private async Task<WebResourceSet_DTO[]> ConvertToApiModel(string importFileLabel)
        {
            List<WebResourceSet_DTO> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "WebResource", "Select * From WebResource" },
                { "WebResource_Lang", "Select * From WebResource_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);

            var importFileInternalIds = await FileService.BizQueryListAsync([nameof(FileManageModel.InternalId)], $"{nameof(FileManageModel.ImportLabel)} = {importFileLabel}", default, 0, 0);
            List<FileManageSet> fileSets = [];
            foreach (var id in importFileInternalIds.Select(p => p.FileManage.InternalId).ToList().Distinct())
            {
                var data = await FileService.BizQuerySetAsync(id);
                fileSets.Add(data);
            }
            var fileSrcIdDic = fileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
            List<FileManageSet> updateFileSets = [];

            foreach (DataRow row in ds.Tables["WebResource"].Rows)
            {
                WebResourceSet_DTO set = new() { };
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
                int rowId = 1;
                foreach (var dRow in ds.Tables["WebResource_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.WebResource.WebResourceId).ToList())
                {
                    if (!dRow["Title"].ToString().IsNullOrEmpty()) 
                    { 
                        WebResourceInfo_DTO detail = new()
                        {
                            WebResourceId = set.WebResource.WebResourceId,
                            RowId = rowId++,
                            Lang = dRow["Lang"].ToString(),
                            Title = dRow["Title"].ToString(),
                            Content = dRow["Content"].ToString(),
                            ResUrl = dRow["Url"].ToString(),
                            Url_OpenType = dRow["URL_Open"].ToString(),
                        };
                        set.WebResourceInfo.Add(detail);
                    }
                }
            }
            foreach (var set in updateFileSets.Distinct())
            {
                set.FileManage.ProgId = this.Service.ProgId;
                await FileService.BizUpdateSetAsync(set.FileManage.InternalId, set);
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
        #endregion
    }

    public class WebResourceSet_DTO : ITSet_DTO
    {
        public WebResource_DTO WebResource { get; set; } = new();
        public List<WebResourceInfo_DTO> WebResourceInfo { get; set; } = [];
    }
    /// <summary>
    /// 網路資源
    /// </summary>
    public class WebResource_DTO: DTOBasicDataModel
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc(ModelDisplayName.WebResourceId)] public string WebResourceId { get; set; }
        /// <summary>
        /// 類別ID(多個)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Category)] public string Categories { get; set; }
        /// <summary>
        /// 標籤ID(多個)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Tag)] public string Tags { get; set; }
        /// <summary>
        /// 狀態:置頂/熱門/隱藏
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ContentStatus)] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 圖片顯示
        /// </summary>
        [LibDesc(ModelDisplayName.WebResource_PicId)] public string PicId { get; set; }
        /// <summary>
        /// 圖片顯示描述
        /// </summary>
        [LibDesc(ModelDisplayName.WebResource_PicDescription)] public string PicDescription { get; set; }

        public List<WebResourceInfo_DTO> WebResourceInfo { get; set; } = [];
    }
    /// <summary>
    /// 網路資源資訊
    /// </summary>
    public class WebResourceInfo_DTO
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc(ModelDisplayName.WebResourceId)] public string WebResourceId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId)] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Lang)] public string Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Title)]public string Title { get; set; }
        /// <summary>
        /// 內容
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Content)]public string Content { get; set; }
        /// <summary>
        /// 超連結
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Url)]public string ResUrl { get; set; }
        /// <summary>
        /// 超連結開啟方式
        /// </summary>
        [LibDesc(ModelDisplayName.Common_UrlOpen)]public string Url_OpenType { get; set; }
    }
}
