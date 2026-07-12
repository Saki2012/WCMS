using System.Data;
using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.PlatformServices.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.Library.LibData;
namespace WCMS.Features.WEB.PageManagement;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.PageManagement)]
public class PageManagementBiz(BizDeps bizDeps) : BizService<PageManagement>(bizDeps), IBizService<PageManagement>
{
    #region Migration Old Data
    public async Task Migrate(string importFileLabel = "1810", IList<FileManageModel> srcFileSets = default)
    {
        PageManagement[] datas = ConvertToApiModel(importFileLabel, srcFileSets);
        await BizInitCreateDatasAsync(datas);
    }
    private PageManagement[] ConvertToApiModel(string importFileLabel, IList<FileManageModel> srcFileSets = default)
    {
        List<PageManagement> result = [];
        Dictionary<string, string> sqls = new()
        {
            { "Page", "Select * From Page" },
            { "Page_Lang", "Select * From Page_Lang" },
        };
        DataSet ds = MigrateOldData.GetOldData(sqls);

        var fileSrcIdDic = srcFileSets.SelectMany(s => s._FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
        List<FileManageModel> updateFileSets = [];

        foreach (DataRow row in ds.Tables["Page"].Rows)
        {
            PageManagement set = new();
            result.Add(set);
            set.PageId = row["Sn"].ToString();
            set.CategoryId = row["Category"].ToString();
            set.CreateTime = row["CreateTime"].ToString().ToDateTime();
            set.ModifyTime = row["UpdateTime"].ToString().ToDateTime();
            int rowId = 1;
            foreach (var dRow in ds.Tables["Page_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.PageId).ToList())
            {
                if (dRow["Title"].IsNullOrEmpty()) continue;
                string contentXml = HtmlInternalIdByFullPath.TransformHtml_ReplaceSrcWithDataInternalId(dRow["Content"].ToString(), fileSrcIdDic, out List<string> usedInternalIds);
                updateFileSets.AddRange(srcFileSets.Where(p => usedInternalIds.Contains(p.InternalId)));
                LangCodeExt.TryParse(dRow["Lang"].ToString(), out LangCode lang);
                PageManagementDetail detail = new()
                {
                    PageId = set.PageId,
                    RowId = rowId++,
                    Lang = lang,
                    Title = dRow["Title"].ToString(),
                    Content = contentXml,
                };
                set._PageManagementDetail.Add(detail);
            }
        }
        foreach (var set in updateFileSets.Distinct())
        {
            set.ProgId = ProgId;
        }
        return [.. result];
    }
    #endregion

    #region Public
    /// <summary>
    /// 獲取可被SiteMenu設定的功能模塊列表
    /// </summary>
    /// <returns></returns>
    public Dictionary<string, string> GetSiteMenuUsedProgList()
    {
        Dictionary<string, string> dict = new()
        {
            { ProgKeys.WEB.PageManagement, I18nCache.GetFieldLabel(typeof(ProgKeys.WEB), nameof(ProgKeys.WEB.PageManagement))},
            { ProgKeys.WEB.Announcement, I18nCache.GetFieldLabel(typeof(ProgKeys.WEB), nameof(ProgKeys.WEB.Announcement))},
            { ProgKeys.WEB.FileArchive, I18nCache.GetFieldLabel(typeof(ProgKeys.WEB), nameof(ProgKeys.WEB.FileArchive))},
            { ProgKeys.WEB.WebResource, I18nCache.GetFieldLabel(typeof(ProgKeys.WEB), nameof(ProgKeys.WEB.WebResource))},
            { ProgKeys.WEB.Gallery, I18nCache.GetFieldLabel(typeof(ProgKeys.WEB), nameof(ProgKeys.WEB.Gallery))},
            { ProgKeys.MAT.Material, I18nCache.GetFieldLabel(typeof(ProgKeys.MAT), nameof(ProgKeys.MAT.Material))},
        };
        SpecGetSiteMenuUsedProgList(dict);
        return dict;
    }
    #endregion

    #region Protected Virtual
    /// <summary>
    /// 保存前執行 AA 與功能代碼驗證。
    /// </summary>
    protected override async Task BeforeUpdate(PageManagement data, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(data, act, ct);
        if (act is FuncAction.Create or FuncAction.Update) CheckData(data);
    }
    /// <summary>
    /// 給Spec功能要追加的功能模塊
    /// </summary>
    /// <param name="dict"></param>
    protected virtual void SpecGetSiteMenuUsedProgList(Dictionary<string, string> dict) { }
    #endregion

    #region Protected
    protected void CheckData(PageManagement set)
    {
        AACheck(set);
        CheckProgId(set);
    }

    protected void CheckInUsed(PageManagement set)
    {
        CheckIsUsedBySiteMenu();
    }
    #endregion

    #region Private
    /// <summary>
    /// 檢查AAContent，將舊資料的AAContent轉成新的格式
    /// </summary>
    /// <param name="langDt"></param>
    private void AACheck(PageManagement set)
    {
        if (!SpecSettings.AACheck) return;
        set._PageManagementDetail.ForEach(dt =>
        {
            if (dt.Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.AACode00003, dt.Lang.ToLabel(), I18nCache.GetLabel<PageManagementDetail>(x => x.Title));
            if (LibAAData.CheckAAContent(dt.Content, Message, out string newContent)) dt.Content = newContent;
        });
    }
    /// <summary>
    /// 如果【所屬功能模塊】欄位不在GetSiteMenuUsedProgList之中，就自動帶入PageManagement，避免使用者輸入錯誤的ProgId導致SiteMenu無法設定
    /// </summary>
    /// <param name="header"></param>
    private void CheckProgId(PageManagement header)
    {
        List<string> progIds = [.. GetSiteMenuUsedProgList().Keys];
        if (!progIds.Contains(header.ProgId)) header.ProgId = ProgKeys.WEB.PageManagement;
    }
    /// <summary>
    /// 檢查資料是否被網站導覽給使用
    /// </summary>
    private void CheckIsUsedBySiteMenu()
    {
        /* 需要先整理一下前端對於這些Json的格式後在來處理，否則會東一塊西一塊的名稱 */
    }
    #endregion
}
