using System.Data;
using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.Library.LibData;

namespace WCMS.Features.WEB.PageManagement;
   
[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.PageManagement)]
public class PageManagementBiz(BizDeps bizDeps) : BizService<PageManagementSet>(bizDeps), IBizService<PageManagementSet>
{
    #region Migration Old Data
    public async Task Migrate(string importFileLabel = "1810", IList<FileManageSet> srcFileSets = default)
    {
        PageManagementSet[] datas = ConvertToApiModel(importFileLabel, srcFileSets);
        await BizInitCreateSetsAsync(datas);
    }
    private PageManagementSet[] ConvertToApiModel(string importFileLabel, IList<FileManageSet> srcFileSets = default)
    {
        List<PageManagementSet> result = [];
        Dictionary<string, string> sqls = new()
        {
            { "Page", "Select * From Page" },
            { "Page_Lang", "Select * From Page_Lang" },
        };
        DataSet ds = MigrateOldData.GetOldData(sqls);

        var fileSrcIdDic = srcFileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
        List<FileManageSet> updateFileSets = [];

        foreach (DataRow row in ds.Tables["Page"].Rows)
        {
            PageManagementSet set = new();
            result.Add(set);
            set.PageManagement.PageId = row["Sn"].ToString();
            set.PageManagement.CategoryId = row["Category"].ToString();
            set.PageManagement.CreateTime = row["CreateTime"].ToString().ToDateTime();
            set.PageManagement.ModifyTime = row["UpdateTime"].ToString().ToDateTime();
            int rowId = 1;
            foreach (var dRow in ds.Tables["Page_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.PageManagement.PageId).ToList())
            {
                if (dRow["Title"].IsNullOrEmpty()) continue;
                string contentXml = HtmlInternalIdByFullPath.TransformHtml_ReplaceSrcWithDataInternalId(dRow["Content"].ToString(), fileSrcIdDic, out List<string> usedInternalIds);
                updateFileSets.AddRange(srcFileSets.Where(p => usedInternalIds.Contains(p.FileManage.InternalId)));
                LangCodeExt.TryParse(dRow["Lang"].ToString(), out LangCode lang);
                PageManagementDetail detail = new()
                {
                    PageId = set.PageManagement.PageId,
                    RowId = rowId++,
                    Lang = lang,
                    Title = dRow["Title"].ToString(),
                    Content = contentXml,
                };
                set.PageManagementDetail.Add(detail);
            }
        }
        foreach (var set in updateFileSets.Distinct())
        {
            set.FileManage.ProgId = ProgId;
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
    protected override Task BeforeUpdate(PageManagementSet set, FuncAction act, CancellationToken ct = default)
    {
        var @base = base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                CheckData(set);
                break;
            case FuncAction.Delete:

                break;
        }
        return @base;
    }
    /// <summary>
    /// 給Spec功能要追加的功能模塊
    /// </summary>
    /// <param name="dict"></param>
    protected virtual void SpecGetSiteMenuUsedProgList(Dictionary<string,string> dict){}
    #endregion

    #region Protected
    protected void CheckData(PageManagementSet set)
    {
        AACheck(set);
        CheckProgId(set.PageManagement);
    }

    protected void CheckInUsed(PageManagementSet set)
    {

    }
    #endregion

    #region Private
    /// <summary>
    /// 檢查AAContent，將舊資料的AAContent轉成新的格式
    /// </summary>
    /// <param name="langDt"></param>
    private void AACheck(PageManagementSet set)
    {
        if (!SpecSettings.AACheck) return;
        set.PageManagementDetail.ForEach(dt => 
        {
            if (dt.Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.AACode00003, dt.Lang.ToLabel(), I18nCache.GetLabel<PageManagementDetail_DTO>(x => x.Title));
            if (LibAAData.CheckAAContent(dt.Content,Message,out string newContent)) dt.Content = newContent; 
        });
    }
    /// <summary>
    /// 如果【所屬功能模塊】欄位不在GetSiteMenuUsedProgList之中，就自動帶入PageManagement，避免使用者輸入錯誤的ProgId導致SiteMenu無法設定
    /// </summary>
    /// <param name="header"></param>
    private void CheckProgId(PageManagement header)
    {
        List<string> progIds = [.. GetSiteMenuUsedProgList().Keys];
        if (!progIds.Contains(header.ProgId)) header.ProgId=ProgKeys.WEB.PageManagement;
    }
    /// <summary>
    /// 檢查資料是否被網站導覽給使用
    /// </summary>
    private void CheckIsUsedBySiteMenu()
    {

    }
    #endregion
}
