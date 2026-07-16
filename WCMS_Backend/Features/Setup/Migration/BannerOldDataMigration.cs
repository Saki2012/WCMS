using System.Data;
using WCMS.Features.WEB.Banner;
using WCMS.Features.WEB.Content;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.PlatformServices.FileManagement;
namespace WCMS.Features.Setup.Migration;

/// <summary>
/// 將舊站 AdBanner 資料轉為標準 Banner 資料。
/// </summary>
internal static class BannerOldDataMigration
{
    #region Public
    /// <summary>
    /// 轉換並建立舊站 Banner 資料。
    /// </summary>
    public static async Task MigrateAsync(IBizService<Banner> service, IList<FileManage> sourceFiles, CancellationToken ct)
    {
        List<FileManage> usedFiles = [];
        Banner[] data = ConvertToModels(sourceFiles, usedFiles);
        OldDataMigrationSource.MarkFiles(usedFiles, service.ProgId);
        await service.BizInitCreateDatasAsync(data, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 將舊站 Banner 資料轉為目前資料模型。
    /// </summary>
    private static Banner[] ConvertToModels(IList<FileManage> sourceFiles, List<FileManage> usedFiles)
    {
        DataSet dataSet = GetMigrationData();
        List<Banner> result = [];
        foreach (DataRow row in dataSet.Tables["AdBannerCategory"]!.Rows)
            result.Add(BuildBanner(row, dataSet, sourceFiles, usedFiles));
        return [.. result];
    }
    /// <summary>
    /// 讀取舊站 Banner 類別、明細與多語資料。
    /// </summary>
    private static DataSet GetMigrationData()
    {
        Dictionary<string, string> sqls = new()
        {
            { "AdBannerCategory", "SELECT * FROM AdBannerCategory" },
            { "AdBanner", "SELECT * FROM AdBanner" },
            { "AdBanner_Lang", "SELECT * FROM AdBanner_Lang" },
        };
        return OldDataMigrationSource.GetOldData(sqls);
    }
    /// <summary>
    /// 建立單筆 Banner Graph。
    /// </summary>
    private static Banner BuildBanner(DataRow row, DataSet dataSet, IList<FileManage> sourceFiles, List<FileManage> usedFiles)
    {
        Banner result = new()
        {
            BannerId = row["Sn"].ToString(),
            BannerCategoryName = row["Category"].ToString(),
            Interval = Convert.ToInt16(row["Interval"]),
            Speed = Convert.ToInt16(row["Speed"]),
            Height = Convert.ToInt16(row["Height"]),
            Width = Convert.ToInt16(row["Width"]),
        };
        AddBannerDetails(result, dataSet, sourceFiles, usedFiles);
        return result;
    }
    /// <summary>
    /// 加入 Banner 圖片與多語明細。
    /// </summary>
    private static void AddBannerDetails(Banner banner, DataSet dataSet, IList<FileManage> sourceFiles, List<FileManage> usedFiles)
    {
        IEnumerable<DataRow> rows = dataSet.Tables["AdBanner"]!.AsEnumerable().Where(row => row["CategorySn"].ToString() == banner.BannerId);
        int rowId = 1;
        foreach (DataRow row in rows)
        {
            BannerDetail detail = BuildBannerDetail(banner.BannerId, rowId++, row, sourceFiles, usedFiles);
            AddBannerDetailInfo(detail, dataSet.Tables["AdBanner_Lang"]!, row);
            banner._BannerDetail.Add(detail);
        }
    }
    /// <summary>
    /// 建立單筆 Banner 圖片明細。
    /// </summary>
    private static BannerDetail BuildBannerDetail(string bannerId, int rowId, DataRow row, IList<FileManage> sourceFiles, List<FileManage> usedFiles)
    {
        string pictureId = ResolvePictureId(row["Pic"].ToString(), sourceFiles, usedFiles);
        _ = int.TryParse(row["FontColor"].ToString(), out int fontColor);
        return new BannerDetail
        {
            BannerId = bannerId,
            RowId = rowId,
            PicSrcId = pictureId,
            Validate_Start = Convert.ToDateTime(row["StartDate"]),
            Validate_End = Convert.ToDateTime(row["EndDate"]),
            FontColor = fontColor.ToString(),
            Sort = Convert.ToUInt16(row["Sort"]),
        };
    }
    /// <summary>
    /// 取得 Banner 匯入圖片 InternalId。
    /// </summary>
    private static string ResolvePictureId(string fileName, IList<FileManage> sourceFiles, List<FileManage> usedFiles)
    {
        if (fileName.IsNullOrEmpty()) return string.Empty;
        FileManage? file = OldDataMigrationSource.FindImportedFile(sourceFiles, $"File/Banner/{fileName}");
        if (file == null) return string.Empty;
        usedFiles.Add(file);
        return file.InternalId;
    }
    /// <summary>
    /// 加入 Banner 圖片多語資訊。
    /// </summary>
    private static void AddBannerDetailInfo(BannerDetail detail, DataTable languageTable, DataRow sourceRow)
    {
        IEnumerable<DataRow> rows = languageTable.AsEnumerable().Where(row => row["Sn"].ToString() == sourceRow["Sn"].ToString());
        int rowId = 1;
        foreach (DataRow row in rows)
        {
            BannerDetailInfo? info = BuildBannerDetailInfo(detail, rowId++, row);
            if (info != null) detail._BannerDetailInfo.Add(info);
        }
    }
    /// <summary>
    /// 建立單筆 Banner 多語資訊。
    /// </summary>
    private static BannerDetailInfo? BuildBannerDetailInfo(BannerDetail detail, int rowId, DataRow row)
    {
        if (row["Title"].IsNullOrEmpty()) return null;
        _ = LangCodeExt.TryParse(row["Lang"].ToString(), out LangCode lang);
        return new BannerDetailInfo
        {
            BannerId = detail.BannerId,
            ParentRowId = detail.RowId,
            RowId = rowId,
            Lang = lang,
            Title = row["Title"].ToString(),
            Content = row["Content"].ToString(),
            URL = row["Url"].ToString(),
            URL_Open = (WindowTarget)Convert.ToByte(row["URL_Open"]),
        };
    }
    #endregion
}
