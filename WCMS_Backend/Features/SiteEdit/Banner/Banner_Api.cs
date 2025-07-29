using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Diagnostics;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;

namespace WCMS.Features.SiteEdit.Banner
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class BannerController(IBizService<BannerSet> service) : ApiDataController<BannerSet>(service)
    {


#if DEBUG //轉移舊系統資料
        [HttpPost(nameof(Migrate))]
        public async Task<IActionResult> Migrate()
        {
            BannerSet[] datas = ConvertToApiModel();
            return await InitialCreateData(datas);
        }
        private static BannerSet[] ConvertToApiModel()
        {
            List<BannerSet> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "AdBannerCategory", "Select * From AdBannerCategory" },
                { "AdBanner", "Select * From AdBanner" },
                { "AdBanner_Lang","Select * From AdBanner_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            Dictionary<string, int> subRowId = new Dictionary<string, int>();
            foreach (DataRow row in ds.Tables["AdBannerCategory"].Rows)
            {
                BannerSet set = new() {};
                result.Add(set);
                set.Banner.BannerId = row["Sn"].ToString();
                set.Banner.BannerCategoryName = row["Category"].ToString();
                set.Banner.Interval = Convert.ToInt16(row["Interval"]);
                set.Banner.Speed = Convert.ToInt16(row["Speed"]);
                set.Banner.Height = Convert.ToInt16(row["Height"]);
                set.Banner.Width = Convert.ToInt16(row["Width"]);
                set.Banner.Effect = row["Effect"].ToString();
                set.Banner.IsIniData = true;
                int rowId = 1;
                foreach(var detailRow in ds.Tables["AdBanner"].AsEnumerable().Where(dr => dr["CategorySn"].ToString() == set.Banner.BannerId).ToList())
                {
                    BannerDetail detail = new()
                    {
                        BannerId = set.Banner.BannerId,
                        RowId = rowId,
                        PicSrcId = detailRow["Pic"].ToString(),
                        Validate_Start = Convert.ToDateTime(detailRow["StartDate"]),
                        Validate_End = Convert.ToDateTime(detailRow["EndDate"]),
                        FontColor = detailRow["FontColor"].ToString(),
                        Sort = Convert.ToUInt16(detailRow["Sort"]),
                    };
                    set.BannerDetail.Add(detail);
                    foreach (var detailLangRow in ds.Tables["AdBanner_Lang"].AsEnumerable().Where(langRow => langRow["Sn"].ToString() == detailRow["Sn"].ToString()).ToList())
                    {
                        if (!detailLangRow["Title"].IsNullOrEmpty())
                        {
                            string key = $"{row["Sn"]},{detailRow["Sn"]}";
                            if (!subRowId.ContainsKey(key)) subRowId[key] = 1;
                            BannerDetailInfo detailInfo = new()
                            {
                                BannerId = set.Banner.BannerId,
                                ParentRowId = rowId,
                                RowId = subRowId[key]++,
                                Lang = detailLangRow["Lang"].ToString(),
                                Title = detailLangRow["Title"].ToString(),
                                Content = detailLangRow["Content"].ToString(),
                                URL_Open = Convert.ToByte(detailLangRow["URL_Open"]),
                            };
                            set.BannerDetailInfo.Add(detailInfo);
                        }
                    }
                    rowId++;
                }
            }
            return [.. result];
        }
#endif
    }
}
