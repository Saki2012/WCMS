using System.Data;
using WCMS.Features._Resx;
using WCMS.Features.WEB.Announcement;
using WCMS.Features.WEB.FileArchive;
using WCMS.Features.WEB.Gallery;
using WCMS.SysCore;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.COMM.Tag;

[LibBiz(ProgKeys.COMM.Code, ProgKeys.COMM.Calendar)]
public class TagBiz(BizDeps bizDeps) : BizService<TagSet>(bizDeps), IBizService<TagSet> {

    #region Protected
    protected override async Task BeforeUpdate(TagSet set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
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
                useCount = await DoQueryListCountAsync<Announcement>($@"{nameof(Announcement.Tags)} HasAny {tagId}");
                break;
            case "FileArchive":
                useCount = await DoQueryListCountAsync<FileArchive>($@"{nameof(FileArchive.TagsId)} HasAny {tagId}");
                break;
            case "Gallery":
                useCount = await DoQueryListCountAsync<Gallery>($@"{nameof(Gallery.Tags)} HasAny {tagId}");
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
