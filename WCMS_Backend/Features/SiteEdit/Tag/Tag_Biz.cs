using System.Data;
using System.Runtime.InteropServices;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.Tag
{
    [ProgId("Tag")]
    public class TagBiz(BizDeps bizDeps) : BizService<TagSet>(bizDeps), IBizService<TagSet> {

        #region Protected
        protected override async Task BeforeUpdate(TagSet set, FuncAction act)
        {
            await base.BeforeUpdate(set, act);
            switch (act)
            {
                case FuncAction.Create:
                case FuncAction.Update:
                    CheckData(set);
                    break;
                case FuncAction.Delete:
                    await CheckIsUsedAsync(set);
                    break;
            }
        }
        protected virtual Task SpecCheckIsUsed(string progId, string tagId, string tagName) => Task.CompletedTask;
        #endregion

        #region Private
        private void CheckData(TagSet set)
        {
            CheckTagName(set.TagDetail,LangCode.zhtw);
        }
        private void CheckTagName(IList<TagDetail> datail, LangCode lang)
        {
            if (datail.Any(p => p.Lang.Equals(lang) && p.TagName.IsNullOrEmpty())) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00015,"繁體中文", I18nCache.GetLabel<TagDetail>(x => x.TagName));
        }
        private async Task CheckIsUsedAsync(TagSet set)
        {
            string progId = set.TagData.ProgId;
            string tagId = set.TagData.TagId;
            string tagName = set.TagDetail.FirstOrDefault(p => p.Lang==EffectiveLang).TagName;
            int useCount = 0;
            switch (progId)
            {
                case "Announcement":
                    useCount = await DoQueryListCountAsync<Announcement.Announcement>($@"{nameof(Announcement.Announcement.Tags)} HasAny {tagId}");
                    break;
                case "FileArchive":
                    useCount = await DoQueryListCountAsync<FileArchive.FileArchive>($@"{nameof(FileArchive.FileArchive.TagsId)} HasAny {tagId}");
                    break;
                case "Gallery":
                    useCount = await DoQueryListCountAsync<Gallery.Gallery>($@"{nameof(Gallery.Gallery.Tags)} HasAny {tagId}");
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
                    LangCodeExt.TryParse(detailRow["Lang"].ToString(), out LangCode lang);
                    TagDetail dt = new()
                    {
                        TagId = set.TagData.TagId,
                        RowId = rowId++,
                        Lang = lang,
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
