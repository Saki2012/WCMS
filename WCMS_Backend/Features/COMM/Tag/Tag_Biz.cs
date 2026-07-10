using System.Data;
using WCMS.Features._Resx;
using WCMS.Features.WEB.Announcement;
using WCMS.Features.WEB.FileArchive;
using WCMS.Features.WEB.Gallery;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.COMM.Tag;

/// <summary>
/// 標籤資料驗證、使用檢查與舊資料匯入。
/// </summary>
[LibBiz(ProgKeys.COMM.Code, ProgKeys.COMM.Calendar)]
public class TagBiz(BizDeps bizDeps) : BizService<TagData>(bizDeps), IBizService<TagData>
{
    #region Protected Virtual
    /// <summary>
    /// 保存前驗證標籤名稱，刪除前檢查使用狀況。
    /// </summary>
    protected override async Task BeforeUpdate(TagData data, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(data, act, ct);
        if (act is FuncAction.Create or FuncAction.Update) CheckData(data);
        if (act == FuncAction.Delete) await CheckIsUsedAsync(data);
    }
    /// <summary>
    /// 提供 Spec 功能追加標籤使用檢查。
    /// </summary>
    protected virtual Task SpecCheckIsUsed(string progId, string tagId, string tagName) => Task.CompletedTask;
    #endregion

    #region Private
    /// <summary>
    /// 驗證繁體中文標籤名稱。
    /// </summary>
    private void CheckData(TagData data)
    {
        bool isEmpty = data._TagDetail.Any(item => item.Lang == LangCode.zhtw && item.TagName.IsNullOrEmpty());
        if (isEmpty) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00015, LangCode.zhtw.ToLabel(), I18nCache.GetLabel<TagDetail>(item => item.TagName));
    }
    /// <summary>
    /// 檢查標籤是否已被對應功能資料使用。
    /// </summary>
    private async Task CheckIsUsedAsync(TagData data)
    {
        string tagName = ResolveTagName(data._TagDetail);
        int useCount = await GetTagUseCountAsync(data.ProgId, data.TagId, tagName);
        if (useCount > 0) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00017, tagName);
    }
    /// <summary>
    /// 依功能代碼取得標籤使用筆數。
    /// </summary>
    private async Task<int> GetTagUseCountAsync(string progId, string tagId, string tagName)
    {
        return progId switch
        {
            ProgKeys.WEB.Announcement => await DoQueryListCountAsync<Announcement>($@"{nameof(Announcement.Tags)} HasAny {tagId}"),
            ProgKeys.WEB.FileArchive => await DoQueryListCountAsync<FileArchive>($@"{nameof(FileArchive.TagsId)} HasAny {tagId}"),
            ProgKeys.WEB.Gallery => await DoQueryListCountAsync<Gallery>($@"{nameof(Gallery.Tags)} HasAny {tagId}"),
            _ => await GetSpecTagUseCountAsync(progId, tagId, tagName),
        };
    }
    /// <summary>
    /// 執行 Spec 使用檢查並回傳共用層使用筆數。
    /// </summary>
    private async Task<int> GetSpecTagUseCountAsync(string progId, string tagId, string tagName)
    {
        await SpecCheckIsUsed(progId, tagId, tagName);
        return 0;
    }
    /// <summary>
    /// 優先取得目前語系，找不到時使用第一筆標籤名稱。
    /// </summary>
    private string ResolveTagName(IEnumerable<TagDetail> details)
    {
        return details.FirstOrDefault(item => item.Lang == EffectiveLang)?.TagName
            ?? details.FirstOrDefault()?.TagName
            ?? string.Empty;
    }
    #endregion

    #region Migration Old Data
    /// <summary>
    /// 匯入舊站標籤資料。
    /// </summary>
    public async Task Migrate()
    {
        TagData[] data = ConvertToApiModel();
        await BizInitCreateDatasAsync(data);
    }
    /// <summary>
    /// 將舊站標籤資料轉為目前 API Model。
    /// </summary>
    private static TagData[] ConvertToApiModel()
    {
        DataSet dataSet = GetMigrationData();
        List<TagData> result = [];
        foreach (DataRow row in dataSet.Tables["Tag"].Rows) result.Add(BuildTag(row, dataSet));
        return [.. result];
    }
    /// <summary>
    /// 讀取舊站標籤主檔與多語明細。
    /// </summary>
    private static DataSet GetMigrationData()
    {
        Dictionary<string, string> sqls = new()
        {
            { "Tag", "SELECT * FROM Tag" },
            { "Tag_Lang", "SELECT * FROM Tag_Lang" },
        };
        return MigrateOldData.GetOldData(sqls);
    }
    /// <summary>
    /// 建立單筆標籤與多語明細 Graph。
    /// </summary>
    private static TagData BuildTag(DataRow row, DataSet dataSet)
    {
        TagData data = new() { TagId = row["Sn"].ToString(), ProgId = MigrateOldData.ChangeProgId(row["Module"].ToString()) };
        IEnumerable<DataRow> rows = dataSet.Tables["Tag_Lang"].AsEnumerable().Where(item => item["Sn"].ToString() == data.TagId);
        int rowId = 1;
        foreach (DataRow detailRow in rows) data._TagDetail.Add(BuildTagDetail(data.TagId, rowId++, detailRow));
        return data;
    }
    /// <summary>
    /// 建立單筆標籤多語明細。
    /// </summary>
    private static TagDetail BuildTagDetail(string tagId, int rowId, DataRow row)
    {
        LangCodeExt.TryParse(row["Lang"].ToString(), out LangCode lang);
        return new TagDetail { TagId = tagId, RowId = rowId, Lang = lang, TagName = row["TagName"].ToString() };
    }
    #endregion
}
