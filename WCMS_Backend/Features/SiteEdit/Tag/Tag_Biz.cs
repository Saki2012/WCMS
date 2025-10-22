using System.Data;
using System.Runtime.InteropServices;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.Tag
{
    [ProgId("Tag")]
    public class TagBiz(IRepositoryMapProvider repo, IErrorHelper message) : BizService<TagSet>(repo, message), IBizService<TagSet> {

        #region Protected
        protected override async Task BeforeUpdate(TagSet set, SysEnum.FuncAction act)
        {
            await base.BeforeUpdate(set, act);
            switch (act)
            {
                case SysEnum.FuncAction.Create:
                case SysEnum.FuncAction.Update:
                    CheckData(set);
                    break;
                case SysEnum.FuncAction.Delete:
                    await CheckIsUsedAsync(set, "zh-tw");
                    break;
            }
        }
        protected virtual Task SpecCheckIsUsed(string progId, string tagId, string tagName) => Task.CompletedTask;
        #endregion


        #region Private
        private void CheckData(TagSet set)
        {
            CheckTagName(set.TagDetail, "zh-tw");
        }
        private void CheckTagName(IList<TagDetail> datail, string lang)
        {
            if (datail.Any(p => p.Lang.Equals(lang) && p.TagName.IsNullOrEmpty())) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00015,"繁體中文", I18nCache.GetLabel<TagDetail>(x => x.TagName));
        }
        private async Task CheckIsUsedAsync(TagSet set, string defaultLang)
        {
            string progId = set.TagData.ProgId;
            string tagId = set.TagData.TagId;
            string tagName = set.TagDetail.FirstOrDefault(p => p.Lang.Equals(defaultLang)).TagName;
            int useCount = 0;
            switch (progId)
            {
                case "Announcement":
                    useCount = await DoQueryListCountAsync<Announcement.Announcement>([nameof(BasicDataModel.InternalId)], $@"{nameof(Announcement.Announcement.Tags)} HasAny {tagId}");
                    break;
                case "FileArchive":
                    useCount = await DoQueryListCountAsync<FileArchive.FileArchive>([nameof(BasicDataModel.InternalId)], $@"{nameof(FileArchive.FileArchive.TagsId)} HasAny {tagId}");
                    break;
                case "Gallery":
                    useCount = await DoQueryListCountAsync<Gallery.Gallery>([nameof(BasicDataModel.InternalId)], $@"{nameof(Gallery.Gallery.Tags)} HasAny {tagId}");
                    break;
                default:
                    await SpecCheckIsUsed(progId, tagId, tagName);
                    break;
            }
            if (useCount > 0) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00017, tagName);
        }

        #endregion
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
