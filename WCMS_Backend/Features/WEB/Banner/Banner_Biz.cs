using System.Data;
using WCMS.Features._Resx;
using WCMS.Features.WEB.PageManagement;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.Features.WEB.Banner;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.Banner)]
public class BannerBiz(BizDeps bizDeps) : BizService<Banner>(bizDeps), IBizService<Banner> 
{
    #region Protected Virtual
    protected override async Task BeforeUpdate(Banner set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                CheckData(set);
                if (Message.HasError) return;
                SetData(set);
                break;
        }

    }
    #endregion

    #region Protected
    protected void CheckData(Banner set)
    {
        AACheck(set._BannerDetail.SelectMany(detail => detail._BannerDetailInfo).ToList());
    }
    protected static void SetData(Banner set)
    {
        ResetBannerSort(set._BannerDetail);
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
            if(dt.Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.AACode00004,I18nCache.GetLabel<BannerDetail>(),dt.ParentRowId, dt.Lang.ToLabel(), I18nCache.GetLabel<BannerDetailInfo>(x => x.Title));
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
    public async Task Migrate(string importFileLabel = "1810", IList<FileManageModel> srcFileSets = default)
    {
        Banner[] datas = ConvertToApiModel(importFileLabel, srcFileSets);
        await BizInitCreateDatasAsync(datas);
        
    }
    private Banner[] ConvertToApiModel(string importFileLabel, IList<FileManageModel> srcFileSets)
    {
        List<Banner> result = [];
        Dictionary<string, string> sqls = new()
        {
            { "AdBannerCategory", "Select * From AdBannerCategory" },
            { "AdBanner", "Select * From AdBanner" },
            { "AdBanner_Lang","Select * From AdBanner_Lang" },
        };
        DataSet ds = MigrateOldData.GetOldData(sqls);


        List<FileManageModel> updateFileSets = [];

        foreach (DataRow row in ds.Tables["AdBannerCategory"].Rows)
        {
            Banner set = new() { };
            result.Add(set);
            set.BannerId = row["Sn"].ToString();
            set.BannerCategoryName = row["Category"].ToString();
            set.Interval = Convert.ToInt16(row["Interval"]);
            set.Speed = Convert.ToInt16(row["Speed"]);
            set.Height = Convert.ToInt16(row["Height"]);
            set.Width = Convert.ToInt16(row["Width"]);
            int rowId = 1;
            foreach (var dRow in ds.Tables["AdBanner"].AsEnumerable().Where(dr => dr["CategorySn"].ToString() == set.BannerId).ToList())
            {
                string picFileName = dRow["Pic"].ToString();
                if (!picFileName.IsNullOrEmpty())
                {
                    FileManageModel fileInfo = GetSetByPicture(picFileName, srcFileSets);
                    updateFileSets.Add(fileInfo);
                    picFileName = fileInfo.InternalId;
                }
                int.TryParse(dRow["FontColor"].ToString(), out int fontcolor);
                BannerDetail detail = new()
                {
                    BannerId = set.BannerId,
                    RowId = rowId,
                    PicSrcId = picFileName,
                    Validate_Start = Convert.ToDateTime(dRow["StartDate"]),
                    Validate_End = Convert.ToDateTime(dRow["EndDate"]),
                    FontColor = fontcolor.ToString(),
                    Sort = Convert.ToUInt16(dRow["Sort"]),
                };
                set._BannerDetail.Add(detail);
                int subRowId = 1;
                foreach (var detailLangRow in ds.Tables["AdBanner_Lang"].AsEnumerable().Where(langRow => langRow["Sn"].ToString() == dRow["Sn"].ToString()).ToList())
                {
                    if (!detailLangRow["Title"].IsNullOrEmpty())
                    {
                        LangCodeExt.TryParse(detailLangRow["Lang"].ToString(), out LangCode lang);
                        BannerDetailInfo detailInfo = new()
                        {
                            BannerId = set.BannerId,
                            ParentRowId = rowId,
                            RowId = subRowId,
                            Lang = lang,
                            Title = detailLangRow["Title"].ToString(),
                            Content = detailLangRow["Content"].ToString(),
                            URL = detailLangRow["Url"].ToString(),
                            URL_Open = (WindowTarget)Convert.ToByte(detailLangRow["URL_Open"]),
                        };
                        detail._BannerDetailInfo.Add(detailInfo);
                        subRowId++;
                    }
                }
                rowId++;
            }
        }
        foreach (var set in updateFileSets)
        {
            set.ProgId = ProgId;
        }
        return [.. result];
    }
    private static FileManageModel GetSetByPicture(string srcPic, IList<FileManageModel> fileSets)
    {
        return fileSets.Where(x => x._FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/Banner/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
    }
    #endregion
}
