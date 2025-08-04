using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Linq.Dynamic.Core;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.Announcement
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class AnnouncementController(IBizService<AnnouncementSet> service) : ApiDataController<AnnouncementSet>(service)
    {

#if DEBUG //轉移舊系統資料
        [HttpPost(nameof(Migrate))]
        public async Task<IActionResult> Migrate()
        {
            AnnouncementSet[] datas = ConvertToApiModel();
            return await InitialCreateData(datas);
        }
        private static AnnouncementSet[] ConvertToApiModel()
        {
            List<AnnouncementSet> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "Announcement", "SELECT * FROM News" },
                { "AnnouncementDetail", "SELECT * FROM News_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            foreach(DataRow row in ds.Tables["Announcement"].Rows)
            {
                AnnouncementSet set = new() {};
                result.Add(set);
                set.Announcement.AnnouncementId = row["Sn"].ToString();
                set.Announcement.Categories = row["Category"].ToString();
                set.Announcement.Tags = row["Tag"].ToString();
                set.Announcement.ContentStatus = GetContentStatus(row["Status"].ToString());
                set.Announcement.PictureId = row["Pic"].ToString();
                set.Announcement.PicDescription = row["PicDescription"].ToString();
                set.Announcement.CreateTime = Convert.ToDateTime(row["CreateTime"]);
                set.Announcement.ModifyTime = Convert.ToDateTime(row["UpdateTime"]);
                set.Announcement.IsIniData = true;
                int r = 0;
                if (row["ViewCount"] != DBNull.Value)
                {
                    int.TryParse(row["ViewCount"].ToString(), out r);
                }
                set.Announcement.ViewCount = r;
                set.Announcement.Validate_Start = Convert.ToDateTime(row["StartDate"]);
                set.Announcement.Validate_End = Convert.ToDateTime(row["EndDate"]);
                ds.Tables["AnnouncementDetail"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.Announcement.AnnouncementId).ToList().ForEach(detailRow =>
                {
                    if (!detailRow["Title"].IsNullOrEmpty() && !detailRow["Content"].IsNullOrEmpty())
                    {
                        int rowId = 1;
                        AnnouncementDetail detail = new()
                        {
                            AnnouncementId = set.Announcement.AnnouncementId,
                            RowId = rowId++,
                            Lang = detailRow["Lang"].ToString(),
                            Title = detailRow["Title"].ToString(),
                            Content = detailRow["Content"].ToString(),
                            SubTitle = detailRow["SubTitle"].ToString(),
                            Url = detailRow["URL"].ToString(),
                        };
                        set.AnnouncementDetail.Add(detail);
                    }
                    //for(int i = 1; i < 10; i++)
                    //{     在看怎麼轉寫檔案比較好
                    //    if (!detailRow[$"Filename{i}"].ToString().IsNullOrEmpty() && !detailRow[$"File{i}"].ToString().IsNullOrEmpty())
                    //    {
                    //        AnnouncementDetailFile detailFile = new()
                    //        {
                    //            AnnouncementId = set.Announcement.AnnouncementId,
                    //            ParentRowId = rowId,
                    //            RowId = i,
                    //        };
                    //    }
                    //}
                });
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
#endif
    }
}
