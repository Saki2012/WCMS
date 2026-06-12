using System.Data;
using WCMS.Features._Resx;
using WCMS.Features.WEB.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.Features.WEB.Banner;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.Banner)]
public class BannerBiz(BizDeps bizDeps) : BizService<BannerSet>(bizDeps), IBizService<BannerSet> 
{
    #region Protected Virtual
    protected override async Task BeforeUpdate(BannerSet set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                if (!CheckData(set)) return;
                SetData(set);
                break;
        }

    }
    #endregion

    #region Protected
    protected bool CheckData(BannerSet set)
    {
        AACheck(set.BannerDetailInfo);
        return Message.HasError;
    }
    protected static void SetData(BannerSet set)
    {
        ResetBannerSort(set.BannerDetail);
    }
    #endregion

    #region Private

    /// <summary>
    /// 檢查AAContent，將舊資料的AAContent轉成新的格式
    /// </summary>
    /// <param name="langDt"></param>
    private void AACheck(List< BannerDetailInfo >infos)
    {
        if (!SpecSettings.AACheck) return;
        infos.ForEach(dt =>
        {
            if(dt.Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.AACode00004,I18nCache.GetLabel<BannerDetailInfo_DTO>(),dt._BannerDetail.RowId,dt.Lang.ToLabel(), I18nCache.GetLabel<BannerDetailInfo_DTO>(x => x.Title));
        });
    }

    private static void ResetBannerSort(List<BannerDetail> dt)
    {
        if (!dt.HasData()) return;
        List<BannerDetail> sorted = [.. dt.OrderBy(p => p.Sort).ThenByDescending(p => p.RowId)];
        for (int i = 0; i < sorted.Count; i++) sorted[i].Sort = (ushort)(i + 1);
    }
    #endregion

    #region Migration Old Data
    public async Task Migrate(string importFileLabel = "1810", IList<FileManageSet> srcFileSets = default)
    {
        BannerSet[] datas = ConvertToApiModel(importFileLabel, srcFileSets);
        await BizInitCreateSetsAsync(datas);
        
    }
    private BannerSet[] ConvertToApiModel(string importFileLabel, IList<FileManageSet> srcFileSets)
    {
        List<BannerSet> result = [];
        Dictionary<string, string> sqls = new()
        {
            { "AdBannerCategory", "Select * From AdBannerCategory" },
            { "AdBanner", "Select * From AdBanner" },
            { "AdBanner_Lang","Select * From AdBanner_Lang" },
        };
        DataSet ds = MigrateOldData.GetOldData(sqls);


        var fileSrcIdDic = srcFileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
        List<FileManageSet> updateFileSets = [];

        foreach (DataRow row in ds.Tables["AdBannerCategory"].Rows)
        {
            BannerSet set = new() { };
            result.Add(set);
            set.Banner.BannerId = row["Sn"].ToString();
            set.Banner.BannerCategoryName = row["Category"].ToString();
            set.Banner.Interval = Convert.ToInt16(row["Interval"]);
            set.Banner.Speed = Convert.ToInt16(row["Speed"]);
            set.Banner.Height = Convert.ToInt16(row["Height"]);
            set.Banner.Width = Convert.ToInt16(row["Width"]);
            int rowId = 1;
            foreach (var dRow in ds.Tables["AdBanner"].AsEnumerable().Where(dr => dr["CategorySn"].ToString() == set.Banner.BannerId).ToList())
            {
                string picFileName = dRow["Pic"].ToString();
                if (!picFileName.IsNullOrEmpty())
                {
                    FileManageSet fileInfo = GetSetByPicture(picFileName, srcFileSets);
                    updateFileSets.Add(fileInfo);
                    picFileName = fileInfo.FileManage.InternalId;
                }
                int.TryParse(dRow["FontColor"].ToString(), out int fontcolor);
                BannerDetail detail = new()
                {
                    BannerId = set.Banner.BannerId,
                    RowId = rowId,
                    PicSrcId = picFileName,
                    Validate_Start = Convert.ToDateTime(dRow["StartDate"]),
                    Validate_End = Convert.ToDateTime(dRow["EndDate"]),
                    FontColor = fontcolor.ToString(),
                    Sort = Convert.ToUInt16(dRow["Sort"]),
                };
                set.BannerDetail.Add(detail);
                int subRowId = 1;
                foreach (var detailLangRow in ds.Tables["AdBanner_Lang"].AsEnumerable().Where(langRow => langRow["Sn"].ToString() == dRow["Sn"].ToString()).ToList())
                {
                    if (!detailLangRow["Title"].IsNullOrEmpty())
                    {
                        LangCodeExt.TryParse(detailLangRow["Lang"].ToString(), out LangCode lang);
                        BannerDetailInfo detailInfo = new()
                        {
                            BannerId = set.Banner.BannerId,
                            ParentRowId = rowId,
                            RowId = subRowId,
                            Lang = lang,
                            Title = detailLangRow["Title"].ToString(),
                            Content = detailLangRow["Content"].ToString(),
                            URL = detailLangRow["Url"].ToString(),
                            URL_Open = (WindowTarget)Convert.ToByte(detailLangRow["URL_Open"]),
                        };
                        set.BannerDetailInfo.Add(detailInfo);
                        subRowId++;
                    }
                }
                rowId++;
            }
        }
        foreach (var set in updateFileSets)
        {
            set.FileManage.ProgId = ProgId;
        }
        return [.. result];
    }
    private static FileManageSet GetSetByPicture(string srcPic, IList<FileManageSet> fileSets)
    {
        return fileSets.Where(x => x.FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/Banner/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
    }
    #endregion
}
