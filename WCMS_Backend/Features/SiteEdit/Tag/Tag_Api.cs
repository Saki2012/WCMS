using Microsoft.AspNetCore.Mvc;
using System.Data;
using WCMS.Features.SiteEdit.Banner;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;

namespace WCMS.Features.SiteEdit.Tag
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class TagController(IBizService<TagSet> service) : ApiDataController<TagSet>(service)
    {


#if DEBUG //轉移舊系統資料
        [HttpPost(nameof(Migrate))]
        public async Task<IActionResult> Migrate()
        {
            TagSet[] datas = ConvertToApiModel();
            return await InitialCreateData(datas);
        }
        private static TagSet[] ConvertToApiModel()
        {
            List<TagSet> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "Tag", "SELECT * FROM Tag" },
                { "Tag_Lang", "SELECT * FROM Tag_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            foreach (DataRow row in ds.Tables["Tag"].Rows)
            {
                TagSet set = new();
                result.Add(set);
                set.TagData.TagId = row["Sn"].ToString();
                set.TagData.ProgId = MigrateOldData.ChangeProgId(row["Module"].ToString());
                set.TagData.IsIniData = true;
                int rowId = 1;
                foreach (var detailRow in ds.Tables["Tag_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.TagData.TagId).ToList())
                {
                    TagDetail dt = new()
                    {
                        TagId = set.TagData.TagId,
                        RowId = rowId++,
                        Lang = detailRow["Lang"].ToString(),
                        TagName = detailRow["TagName"].ToString(),
                    };
                    set.TagDetail.Add(dt);
                }
            }
            return [.. result];
        }
#endif
    }
}
