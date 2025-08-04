using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using System.Data;
using WCMS.Features.SiteEdit.Category;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.WebResource
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class WebResourceController(IBizService<WebResourceSet> service) : ApiDataController<WebResourceSet>(service)
    {



#if DEBUG //轉移舊系統資料
        [HttpPost(nameof(Migrate))]
        public async Task<IActionResult> Migrate()
        {
            WebResourceSet[] datas = ConvertToApiModel();
            return await InitialCreateData(datas);
        }
        private static WebResourceSet[] ConvertToApiModel()
        {
            List<WebResourceSet> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "WebResource", "Select * From WebResource" },
                { "WebResource_Lang", "Select * From WebResource_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            foreach (DataRow row in ds.Tables["WebResource"].Rows)
            {
                WebResourceSet set = new() { };
                result.Add(set);
                set.WebResource.WebResourceId = row["Sn"].ToString();
                set.WebResource.Categories = row["Category"].ToString();
                set.WebResource.ContentStatus = GetContentStatus(row["Status"].ToString());
                set.WebResource.Tags = row["Tag"].ToString();
                set.WebResource.PicId = row["Pic"].ToString();
                set.WebResource.PicDescription = row["PicDescription"].ToString();
                set.WebResource.CreateTime = Convert.ToDateTime(row["CreateTime"]);
                set.WebResource.ModifyTime = Convert.ToDateTime(row["UpdateTime"]);
                set.WebResource.IsIniData = true;
                int rowId = 1;
                foreach (var dRow in ds.Tables["WebResource_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.WebResource.WebResourceId).ToList())
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
#endif
    }
}
