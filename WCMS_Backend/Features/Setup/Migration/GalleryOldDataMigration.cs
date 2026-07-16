using System.Data;
using WCMS.Features.WEB.Gallery;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Runtime;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.PlatformServices.FileManagement;
using static WCMS.SysCore.Library.LibData;
namespace WCMS.Features.Setup.Migration;

/// <summary>
/// 將舊站 Gallery 資料轉為標準相簿資料。
/// </summary>
internal static class GalleryOldDataMigration
{
    #region Public
    /// <summary>
    /// 轉換並建立舊站相簿資料。
    /// </summary>
    public static async Task MigrateAsync(IBizService<Gallery> service, IList<FileManage> sourceFiles, CancellationToken ct)
    {
        List<FileManage> usedFiles = [];
        Gallery[] data = ConvertToModels(sourceFiles, usedFiles);
        OldDataMigrationSource.MarkFiles(usedFiles, service.ProgId);
        await service.BizInitCreateDatasAsync(data, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 將舊站相簿資料轉為目前資料模型。
    /// </summary>
    private static Gallery[] ConvertToModels(IList<FileManage> sourceFiles, List<FileManage> usedFiles)
    {
        DataSet dataSet = GetMigrationData();
        Dictionary<string, string> fileMap = OldDataMigrationSource.BuildFilePathMap(sourceFiles);
        List<Gallery> result = [];
        foreach (DataRow row in dataSet.Tables["Gallery"]!.Rows)
            result.Add(BuildGallery(row, dataSet, sourceFiles, fileMap, usedFiles));
        return [.. result];
    }
    /// <summary>
    /// 讀取舊站相簿主檔、相片與多語資料。
    /// </summary>
    private static DataSet GetMigrationData()
    {
        Dictionary<string, string> sqls = new()
        {
            { "Gallery", "SELECT * FROM Gallery" },
            { "Gallery_Lang", "SELECT * FROM Gallery_Lang" },
            { "Gallery_Album", "SELECT * FROM Gallery_Album" },
            { "Gallery_Album_Lang", "SELECT * FROM Gallery_Album_Lang" },
        };
        return OldDataMigrationSource.GetOldData(sqls);
    }
    /// <summary>
    /// 建立單筆相簿 Graph。
    /// </summary>
    private static Gallery BuildGallery(DataRow row, DataSet dataSet, IList<FileManage> sourceFiles, Dictionary<string, string> fileMap, List<FileManage> usedFiles)
    {
        Gallery result = CreateGalleryHeader(row);
        AddGalleryInfo(result, dataSet.Tables["Gallery_Lang"]!, sourceFiles, fileMap, usedFiles);
        AddPhotos(result, row, dataSet, sourceFiles, usedFiles);
        return result;
    }
    /// <summary>
    /// 建立相簿主檔欄位。
    /// </summary>
    private static Gallery CreateGalleryHeader(DataRow row)
    {
        return new Gallery
        {
            GalleryId = row["Sn"].ToString(),
            CoverPicSrcId = string.Empty,
            Categories = row["Category"].ToString(),
            ContentStatus = OldDataMigrationSource.ParseContentStatus(row["Status"].ToString()),
            Tags = row["Tag"].ToString(),
            CreateTime = row["CreateTime"].ToString().ToDateTime(),
            ModifyTime = row["UpdateTime"].ToString().ToDateTime(),
            Validate_Start = row["StartDate"].ToString().ToDateTime(),
        };
    }
    /// <summary>
    /// 加入相簿多語資訊並記錄內文使用檔案。
    /// </summary>
    private static void AddGalleryInfo(Gallery data, DataTable languageTable, IList<FileManage> sourceFiles, Dictionary<string, string> fileMap, List<FileManage> usedFiles)
    {
        IEnumerable<DataRow> rows = languageTable.AsEnumerable().Where(row => row["Sn"].ToString() == data.GalleryId);
        int rowId = 1;
        foreach (DataRow row in rows)
        {
            GalleryInfo? info = BuildGalleryInfo(data.GalleryId, rowId++, row, sourceFiles, fileMap, usedFiles);
            if (info != null) data._GalleryInfo.Add(info);
        }
    }
    /// <summary>
    /// 建立單筆相簿多語資訊。
    /// </summary>
    private static GalleryInfo? BuildGalleryInfo(string galleryId, int rowId, DataRow row, IList<FileManage> sourceFiles, Dictionary<string, string> fileMap, List<FileManage> usedFiles)
    {
        if (row["Title"].IsNullOrEmpty()) return null;
        string content = HtmlInternalIdByFullPath.TransformHtml_ReplaceSrcWithDataInternalId(row["Content"].ToString(), fileMap, out List<string> usedIds);
        usedFiles.AddRange(sourceFiles.Where(file => usedIds.Contains(file.InternalId)));
        _ = LangCodeExt.TryParse(row["Lang"].ToString(), out LangCode lang);
        return new GalleryInfo { GalleryId = galleryId, RowId = rowId, Lang = lang, Title = row["Title"].ToString(), Content = content };
    }
    /// <summary>
    /// 加入相簿相片與相片多語資訊。
    /// </summary>
    private static void AddPhotos(Gallery data, DataRow header, DataSet dataSet, IList<FileManage> sourceFiles, List<FileManage> usedFiles)
    {
        IEnumerable<DataRow> rows = dataSet.Tables["Gallery_Album"]!.AsEnumerable()
            .Where(row => row["Sn"].ToString() == data.GalleryId)
            .OrderBy(row => row["PhotoName"].ToString());
        int rowId = 1;
        foreach (DataRow row in rows) AddPhoto(data, header, rowId++, row, dataSet.Tables["Gallery_Album_Lang"]!, sourceFiles, usedFiles);
    }
    /// <summary>
    /// 建立並加入單筆相簿相片。
    /// </summary>
    private static void AddPhoto(Gallery data, DataRow header, int rowId, DataRow row, DataTable languageTable, IList<FileManage> sourceFiles, List<FileManage> usedFiles)
    {
        FileManage? file = FindPhoto(row["Sn"].ToString(), row["PhotoName"].ToString(), sourceFiles);
        if (file == null) return;
        file.FileName = row["PhotoName"].ToString();
        usedFiles.Add(file);
        GalleryPhotos photo = new() { GalleryId = data.GalleryId, RowId = rowId, PicSrcId = file.InternalId, Sort = rowId };
        AddPhotoInfo(photo, row, languageTable, file);
        data._GalleryPhotos.Add(photo);
        if (row["PhotoID"].ToString() == header["Cover"].ToString()) data.CoverPicSrcId = photo.PicSrcId;
    }
    /// <summary>
    /// 加入相簿相片多語標題。
    /// </summary>
    private static void AddPhotoInfo(GalleryPhotos photo, DataRow sourceRow, DataTable languageTable, FileManage file)
    {
        IEnumerable<DataRow> rows = languageTable.AsEnumerable().Where(row => row["PhotoID"].ToString() == sourceRow["PhotoID"].ToString());
        int rowId = 1;
        foreach (DataRow row in rows)
        {
            GalleryPhotosInfo? info = BuildPhotoInfo(photo, rowId++, row, file);
            if (info != null) photo._GalleryPhotosInfo.Add(info);
        }
    }
    /// <summary>
    /// 建立單筆相片多語標題。
    /// </summary>
    private static GalleryPhotosInfo? BuildPhotoInfo(GalleryPhotos photo, int rowId, DataRow row, FileManage file)
    {
        if (row["Title"].IsNullOrEmpty()) return null;
        _ = LangCodeExt.TryParse(row["Lang"].ToString(), out LangCode lang);
        if (lang == LangCode.zhtw) file.FileDescription = row["Title"].ToString();
        return new GalleryPhotosInfo { GalleryId = photo.GalleryId, ParentRowId = photo.RowId, RowId = rowId, Lang = lang, Title = row["Title"].ToString() };
    }
    /// <summary>
    /// 依舊站相簿路徑取得已匯入相片。
    /// </summary>
    private static FileManage? FindPhoto(string albumId, string fileName, IEnumerable<FileManage> sourceFiles)
    {
        string sourcePath = $"file/image/album/{albumId}/{fileName}";
        return sourceFiles.FirstOrDefault(file => file._FileManage_SyncInfo.Any(info => info.SrcFullPath.Contains(sourcePath, StringComparison.OrdinalIgnoreCase)));
    }
    #endregion
}
