using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data;
using WCMS.Features.SiteEdit.Banner;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.Features.SiteEdit.Tag
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class TagController : ApiDataController<TagSet,TagSet_DTO>
    {
        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task<IActionResult> Migrate(CancellationToken ct)
        {
            TagSet_DTO[] datas = ConvertToApiModel();
            return await InitialCreateData(datas,ct);
        }
        private static TagSet_DTO[] ConvertToApiModel()
        {
            List<TagSet_DTO> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "Tag", "SELECT * FROM Tag" },
                { "Tag_Lang", "SELECT * FROM Tag_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            foreach (DataRow row in ds.Tables["Tag"].Rows)
            {
                TagSet_DTO set = new();
                result.Add(set);
                set.TagData.TagId = row["Sn"].ToString();
                set.TagData.ProgId = MigrateOldData.ChangeProgId(row["Module"].ToString());
                int rowId = 1;
                foreach (var detailRow in ds.Tables["Tag_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.TagData.TagId).ToList())
                {
                    TagDetail_DTO dt = new()
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
    public class TagSet_DTO : ITSet_DTO
    {
        public TagData_DTO TagData { get; set; } = new();
        public List<TagDetail_DTO> TagDetail { get; set; } = [];
    }
    public class TagData_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 類別ID
        /// </summary>
        [LibDesc] public string TagId { get; set; } = string.Empty;
        /// <summary>
        /// 對應功能模塊ID
        /// </summary>
        [LibDesc] public string ProgId { get; set; } = string.Empty;
    }
    public class TagDetail_DTO
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc] public string TagId { get; set; } = string.Empty;
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc] public string Lang { get; set; } = string.Empty;
        /// <summary>
        /// 標籤名稱
        /// </summary>
        [LibDesc] public string TagName { get; set; } = string.Empty;
    }
}
