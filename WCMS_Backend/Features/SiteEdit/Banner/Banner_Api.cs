using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Diagnostics;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using WCMS.SysCore.SystemFunc.FileManagement;

namespace WCMS.Features.SiteEdit.Banner
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class BannerController: ApiDataController<BannerSet, BannerSet_DTO>
    {

        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task<IActionResult> Migrate(CancellationToken ct, string importFileLabel = "1810")
        {
            BannerSet_DTO[] datas = await ConvertToApiModel(importFileLabel);
            return await InitialCreateData(datas, ct);
        }
        private async Task<BannerSet_DTO[]> ConvertToApiModel(string importFileLabel)
        {
            List<BannerSet_DTO> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "AdBannerCategory", "Select * From AdBannerCategory" },
                { "AdBanner", "Select * From AdBanner" },
                { "AdBanner_Lang","Select * From AdBanner_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);

            var importFileInternalIds = await FileService.BizQueryListAsync([nameof(FileManageModel.InternalId)], $"{nameof(FileManageModel.ImportLabel)} = {importFileLabel}", 0, 0);
            List<FileManageSet> fileSets = [];
            foreach (var id in importFileInternalIds.Select(p => p.FileManage.InternalId).ToList().Distinct())
            {
                var data = await FileService.BizQuerySetAsync(id);
                fileSets.Add(data);
            }
            var fileSrcIdDic = fileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
            List<FileManageSet> updateFileSets = [];

            foreach (DataRow row in ds.Tables["AdBannerCategory"].Rows)
            {
                BannerSet_DTO set = new() {};
                result.Add(set);
                set.Banner.BannerId = row["Sn"].ToString();
                set.Banner.BannerCategoryName = row["Category"].ToString();
                set.Banner.Interval = Convert.ToInt16(row["Interval"]);
                set.Banner.Speed = Convert.ToInt16(row["Speed"]);
                set.Banner.Height = Convert.ToInt16(row["Height"]);
                set.Banner.Width = Convert.ToInt16(row["Width"]);
                set.Banner.Effect = row["Effect"].ToString();
                int rowId = 1;
                foreach(var dRow in ds.Tables["AdBanner"].AsEnumerable().Where(dr => dr["CategorySn"].ToString() == set.Banner.BannerId).ToList())
                {
                    string picFileName = dRow["Pic"].ToString();
                    if (!picFileName.IsNullOrEmpty())
                    {
                        FileManageSet fileInfo = GetSetByPicture(picFileName, fileSets);
                        updateFileSets.Add(fileInfo);
                        fileInfo.FileManage.ProgId = this.Service.ProgId;
                        picFileName = fileInfo.FileManage.InternalId;
                    }

                    BannerDetail_DTO detail = new()
                    {
                        BannerId = set.Banner.BannerId,
                        RowId = rowId,
                        PicSrcId = picFileName,
                        Validate_Start = Convert.ToDateTime(dRow["StartDate"]),
                        Validate_End = Convert.ToDateTime(dRow["EndDate"]),
                        FontColor = dRow["FontColor"].ToString(),
                        Sort = Convert.ToUInt16(dRow["Sort"]),
                    };
                    set.BannerDetail.Add(detail);
                    int subRowId = 1;
                    foreach (var detailLangRow in ds.Tables["AdBanner_Lang"].AsEnumerable().Where(langRow => langRow["Sn"].ToString() == dRow["Sn"].ToString()).ToList())
                    {
                        if (!detailLangRow["Title"].IsNullOrEmpty())
                        {
                            BannerDetailInfo_DTO detailInfo = new()
                            {
                                BannerId = set.Banner.BannerId,
                                ParentRowId = rowId,
                                RowId = subRowId,
                                Lang = detailLangRow["Lang"].ToString(),
                                Title = detailLangRow["Title"].ToString(),
                                Content = detailLangRow["Content"].ToString(),
                                URL = detailLangRow["URL"].ToString(),
                                URL_Open = Convert.ToByte(detailLangRow["URL_Open"]),
                            };
                            set.BannerDetailInfo.Add(detailInfo);
                            subRowId++;
                        }
                    }
                    rowId++;
                }
            }
            foreach (var set in updateFileSets) 
            {
                set.FileManage.ProgId = this.Service.ProgId;
                await FileService.BizUpdateSetAsync(set.FileManage.InternalId, set); 
            }
            return [.. result];
        }
        private FileManageSet GetSetByPicture(string srcPic, List<FileManageSet> fileSets)
        {
            return fileSets.Where(x => x.FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/Banner/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
        }
        #endregion
    }

    public class BannerSet_DTO: ITSet_DTO
    {
        [LibDesc] public Banner_DTO Banner { get; set; } = new();
        [LibDesc] public List<BannerDetail_DTO> BannerDetail { get; set; } = [];
        [LibDesc] public List<BannerDetailInfo_DTO> BannerDetailInfo { get; set; } = [];
    }
    public class Banner_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 橫幅ID
        /// </summary>
        [LibDesc(ModelDisplayName.BannerId)] public string BannerId { get; set; }
        /// <summary>
        /// 類別ID
        /// </summary>
        [LibDesc(ModelDisplayName.Banner_CategoryName)]public string BannerCategoryName { get; set; }
        /// <summary>
        /// 轉換間隔
        /// </summary>
        [LibDesc(ModelDisplayName.Banner_Interval)] public short Interval { get; set; }
        /// <summary>
        /// 轉換速度
        /// </summary>
        [LibDesc(ModelDisplayName.Banner_Speed)] public short Speed { get; set; }
        /// <summary>
        /// 橫幅高度
        /// </summary>
        [LibDesc(ModelDisplayName.Banner_Height)]public short Height { get; set; }
        /// <summary>
        /// 橫幅寬度
        /// </summary>
        [LibDesc(ModelDisplayName.Banner_Width)]public short Width { get; set; }
        /// <summary>
        /// 橫幅效果
        /// </summary>
        [LibDesc(ModelDisplayName.Banner_Effect)]public string Effect { get; set; }
    }
    public class BannerDetail_DTO
    {
        /// <summary>
        /// 
        /// </summary>
        [LibDesc(ModelDisplayName.BannerId)] public string BannerId { get; set; }
        /// <summary>
        /// 
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId)] public int RowId { get; set; }
        /// <summary>
        /// 圖片來源取檔案關聯
        /// </summary>
        [LibDesc(ModelDisplayName.Banner_PicSrcId)] public string PicSrcId { get; set; }
        /// <summary>
        /// 字體顏色
        /// </summary>
        [LibDesc(ModelDisplayName.Banner_FontColor)] public string FontColor { get; set; }
        /// <summary>
        /// 資料有效日期-起
        /// </summary>
        [LibDesc(ModelDisplayName.Banner_StartDate)] public DateTime Validate_Start { get; set; }
        /// <summary>
        /// 資料有效日期-迄
        /// </summary>
        [LibDesc(ModelDisplayName.Banner_EndDate)] public DateTime Validate_End { get; set; }
        /// <summary>
        /// 播放順序
        /// </summary>
        [LibDesc(ModelDisplayName.Banner_Sort)] public ushort Sort { get; set; }
    }
    public class BannerDetailInfo_DTO
    {
        /// <summary>
        /// 
        /// </summary>
        [LibDesc(ModelDisplayName.BannerId)] public string BannerId { get; set; }
        /// <summary>
        /// 
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ParentRowId)] public int ParentRowId { get; set; }
        /// <summary>
        /// 
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId)] public int RowId { get; set; }
        /// <summary>
        /// 語系
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Lang)] public string Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Title)] public string Title { get; set; }
        /// <summary>
        /// 
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Content)] public string Content { get; set; }

        [LibDesc(ModelDisplayName.Common_Url)] public string URL { get; set; }
        /// <summary>
        /// 網址開啟方式
        /// </summary>
        [LibDesc(ModelDisplayName.Common_UrlOpen)] public byte URL_Open { get; set; }
    }
}
