using Microsoft.AspNetCore.Mvc;
using System.Data;
using WCMS.Features.SiteEdit.WebResource;
using WCMS.SysCore;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;

namespace WCMS.Features.SiteEdit.Tag
{
    public class TagBiz(IRepositoryMapProvider repo, IErrorHelper message) : BizService<TagSet>(repo, message), IBizService<TagSet> {
        #region Migration Old Data
        public async Task Migrate()
        {
            TagSet[] datas = ConvertToApiModel();
            await BizInitCreateSetsAsync(datas);
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
        #endregion
    }
}
