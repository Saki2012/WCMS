using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using WCMS.Features._Resx;
using WCMS.SysCore.Auditing.ErrorHandling;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.FeatureDriver.Repo;
using WCMS.SysCore.Library;
using WCMS.SysCore.PlatformServices.SystemMonitor;
namespace WCMS.SysCore.PlatformServices.FileManagement;

public class FileManagementBiz(BizDeps bizDeps, IOptions<FilePathOptions> options, IWebHostEnvironment Env) : BizService<FileManage>(bizDeps), IBizService<FileManage>
{
    #region Property
    private readonly FilePathOptions FilePath = options.Value;
    /// <summary>
    /// 單次匯入允許處理的最大檔案項目數量。
    /// </summary>
    private const int MaxImportEntryCount = 10000;
    /// <summary>
    /// 單一匯入檔案允許的最大解壓縮大小。
    /// </summary>
    private const long MaxImportEntrySize = 200L * 1024 * 1024;
    /// <summary>
    /// 單次匯入允許的最大解壓縮總容量。
    /// </summary>
    private const long MaxImportTotalSize = 2L * 1024 * 1024 * 1024;
    /// <summary>
    /// 公開下載去重時間窗
    /// </summary>
    private static readonly TimeSpan PublicDownloadRecentWindow = TimeSpan.FromMinutes(10);
    /// <summary>
    /// 預覽類型常數
    /// </summary>
    private static class FilePreviewTypes
    {
        public const string None = "none";
        public const string Pdf = "pdf";
        public const string Image = "image";
        public const string Video = "video";
        public const string Audio = "audio";
        public const string Text = "text";
    }
    #endregion

    #region Public
    /// <summary>
    /// 讀取檔案
    /// </summary>
    /// <param name="internalIds"></param>
    public async Task<IList<FileManage>> ReadFileInfo(string[] internalIds, bool isPublic = true)
    {
        if (internalIds.Length == 0)
        {
            Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00033);
            return [];
        }
        else
        {
            var param = GetReadFileQueryParam(internalIds, isPublic);
            var result = (await BizQueryListAsync(param)).Select(p => p).ToList();
            CheckFileExistInPysical(result);
            CheckFileExistInDB(internalIds, result);
            return result;
        }
    }
    /// <summary>
    /// 嘗試累加前台公開下載次數（含 Recent 去重）
    /// </summary>
    public async Task TryCountPublicDownload(string internalId, string visitorKey, string refererUrl, CancellationToken ct = default)
    {
        bool ownsTx = false;
        var now = DateTime.UtcNow;
        var safeRefererUrl = refererUrl?.Trim() ?? string.Empty;
        try
        {
            ct.ThrowIfCancellationRequested();
            if (string.IsNullOrWhiteSpace(internalId) || string.IsNullOrWhiteSpace(visitorKey)) return;
            ownsTx = await TryBeginTransactionAsync(ct);
            var recent = await GetDownloadRecentAsync(internalId, visitorKey, ct);
            if (recent != null && !ShouldCountPublicDownload(recent.LastCountTime, now))
            {
                await TryCommitAsync(ownsTx, ct);
                return;
            }
            await SaveDownloadRecentAsync(recent, internalId, visitorKey, safeRefererUrl, now, ct);
            await IncreasePublicDownloadCountAsync(internalId, ct);
            await TryCommitAsync(ownsTx, ct);
        }
        catch
        {
            await TryRollbackAsync(ownsTx, CancellationToken.None);
            throw;
        }
    }
    /// <summary>
    /// 確認檔案是否可以預覽
    /// </summary>
    /// <param name="fileManage"></param>
    /// <returns></returns>
    public bool CheckFileCanPreview(FileManage fileManage, out bool isPdf)
    {
        // return
        var fileType = GetPreviewType(fileManage);
        isPdf = fileType == FilePreviewTypes.Pdf;
        return fileType != FilePreviewTypes.None;
    }

    /// <summary>
    /// 暫時上傳，放至暫存區
    /// </summary>
    /// <param name="file"></param>
    public async Task<string> UploadTemp(IFormFile file)
    {
        string sha256 = LibData.GetFileSHA256(file);
        var (isNew, set) = await CheckSHA256Async(sha256, file);
        if (CheckFileLegal(file, set))
        {
            await DoStoreFileToSystem(file, set);
            set.FileStatus = FileStatus.Pending;
        }
        await (isNew ? BizCreateDataAsync(set) : BizUpdateDataAsync(set.InternalId, set));
        //更新完DB後再把Message訊息加回，避免MessageError時無法正常保存
        var syncInfo = set._FileManage_SyncInfo.LastOrDefault();
        if (syncInfo != null && !syncInfo.ErrorCode.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00025, syncInfo.ErrorMessage);
        return set.InternalId;
    }
    /// <summary>
    /// 確定保存，移至正式區
    /// </summary>
    /// <param name="internalIds"></param>
    public async Task MoveToPermanent(string[] internalIds)
    {
        if (internalIds.IsNullOrEmpty() || internalIds.Length == 0) return;
        List<FileManage> sets = [];
        var list = await this.DoQueryListAsync(typeof(FileManage),
            [nameof(FileManage.InternalId), nameof(FileManage.FileName)],
            $@"{nameof(FileManage.InternalId)} in ({LibData.Merge(",", false, internalIds)}) And
                   {nameof(FileManage.FileStatus)} = {FileStatus.Pending}", default, 0, 0);

        foreach (var item in list) sets.Add(await DoQueryDataAsync(((FileManage)item).InternalId));
        await MoveFileFromTempToFinal(sets);
    }
    /// <summary>
    /// 取消上傳檔案
    /// </summary>
    /// <param name="internalIds"></param>
    /// <returns></returns>
    public async Task CancelUploadFiles(string[] internalIds)
    {
        if (internalIds.IsNullOrEmpty() || internalIds.Length == 0) return;
        List<FileManage> sets = [];
        var list = await this.DoQueryListAsync(typeof(FileManage),
            [nameof(FileManage.InternalId), nameof(FileManage.FileName)],
            $@"{nameof(FileManage.InternalId)} in ({LibData.Merge(",", false, internalIds)}) And
                    {nameof(FileManage.FileStatus)} = {FileStatus.Pending}", default, 0, 0);

        foreach (var item in list) sets.Add(await DoQueryDataAsync(((FileManage)item).InternalId));
        await DeleteFromTemp(sets);
    }
    /// <summary>
    /// 匯入初始檔案
    /// </summary>
    /// <param name="label"></param>
    /// <returns></returns>
    public async Task ImportZip(string label)
    {
        await Decompress(label);
    }
    /// <summary>
    /// 同步檔案至不同Service
    /// </summary>
    public async void SyncFiles()
    {

    }
    #endregion

    #region Private

    #region Read File
    /// <summary>
    /// 組成讀檔案資訊的Query參數
    /// </summary>
    /// <param name="internalIds"></param>
    /// <param name="isPublic"></param>
    /// <returns></returns>
    private QueryListParam GetReadFileQueryParam(string[] internalIds, bool isPublic = true)
    {
        string[] selectFields = [nameof(FileManage.InternalId), nameof(FileManage.Path), nameof(FileManage.FileExtension), nameof(FileManage.FileName), nameof(FileManage.MimeType), nameof(FileManage.FileSHA256), nameof(FileManage.ModifyTime)];
        string condition;
        if (internalIds.Length == 1) condition = $"{nameof(FileManage.InternalId)} = {internalIds[0]}";
        else condition = $"{nameof(FileManage.InternalId)} In {LibData.Merge(',', false, internalIds)}";
        if (isPublic) condition = LibData.Merge(SysParam.QueryOperators.And, false, condition, $"{nameof(FileManage.IsPublic)} = {isPublic}");
        return new QueryListParam() { Fields = selectFields, Condition = condition, };
    }
    /// <summary>
    /// 檢查檔案是否存在於實體路徑中，若不存在則回傳警告訊息
    /// </summary>
    /// <param name="filemanage"></param>
    private void CheckFileExistInPysical(List<FileManage> filemanages)
    {
        for (int i = filemanages.Count - 1; i >= 0; i--)
        {
            var filemanage = filemanages[i];
            string fullPath = Path.Combine(Env.ContentRootPath, filemanage.Path, $"{filemanage.InternalId}.{filemanage.FileExtension}");
            if (!File.Exists(fullPath))
            {
                Message.AddMessage(MessageStatus.Warning, SysMessageCode.BECode00032, filemanage.InternalId, filemanage.FileName);
                filemanages.RemoveAt(i);
            }
        }
    }
    /// <summary>
    /// 檢查檔案是否存在於資料庫中，若不存在則回傳警告訊息
    /// </summary>
    /// <param name="internalIds"></param>
    /// <param name="filemanage"></param>
    private void CheckFileExistInDB(string[] internalIds, List<FileManage> filemanage)
    {
        internalIds.Except(filemanage.Select(p => p.InternalId)).ToList().ForEach(id =>
        {
            Message.AddMessage(MessageStatus.Warning, SysMessageCode.BECode00031, id);
        });
    }

    /// <summary>
    /// 取得目前訪客對該檔案的 Recent 紀錄
    /// </summary>
    private async Task<FileManage_DownloadRecent?> GetDownloadRecentAsync(string internalId, string visitorKey, CancellationToken ct = default)
    {
        // 宣告變數
        string[] fields = [nameof(FileManage_DownloadRecent.InternalId), nameof(FileManage_DownloadRecent.RowId), nameof(FileManage_DownloadRecent.VisitorKey),
            nameof(FileManage_DownloadRecent.RefererURL), nameof(FileManage_DownloadRecent.LastCountTime),];
        string condition = LibData.Merge(SysParam.QueryOperators.And, false, $@"{nameof(FileManage_DownloadRecent.InternalId)} = {internalId}", $@"{nameof(FileManage_DownloadRecent.VisitorKey)} = {visitorKey}");
        // 執行 function
        ct.ThrowIfCancellationRequested();
        var list = await DoQueryListAsync<FileManage_DownloadRecent>(fields, condition, default, 0, 1, ct: ct);
        // return
        return list.Cast<FileManage_DownloadRecent>().FirstOrDefault();
    }
    /// <summary>
    /// 判斷本次是否應正式累加下載次數
    /// </summary>
    private static bool ShouldCountPublicDownload(DateTime lastCountTime, DateTime now)
    {
        return now - lastCountTime >= PublicDownloadRecentWindow;
    }
    /// <summary>
    /// 新增或更新 DownloadRecent
    /// </summary>
    private async Task SaveDownloadRecentAsync(
        FileManage_DownloadRecent? currentRecent,
        string internalId,
        string visitorKey,
        string refererUrl,
        DateTime now,
        CancellationToken ct = default)
    {
        // 執行 function
        ct.ThrowIfCancellationRequested();

        if (currentRecent == null)
        {
            await CreateDownloadRecentAsync(internalId, visitorKey, refererUrl, now, ct);
            return;
        }

        await UpdateDownloadRecentAsync(currentRecent, refererUrl, now, ct);
    }

    /// <summary>
    /// 新增 DownloadRecent
    /// </summary>
    private async Task CreateDownloadRecentAsync(
        string internalId,
        string visitorKey,
        string refererUrl,
        DateTime now,
        CancellationToken ct = default)
    {
        // 宣告變數
        dynamic recentRepo = DbRepositoryProvider.GetRepo(typeof(FileManage_DownloadRecent));
        var nextRowId = await GetNextDownloadRecentRowIdAsync(internalId, ct);
        var newRecent = new FileManage_DownloadRecent
        {
            InternalId = internalId,
            RowId = nextRowId,
            VisitorKey = visitorKey,
            RefererURL = refererUrl,
            LastCountTime = now,
        };

        // 執行 function
        ct.ThrowIfCancellationRequested();
        await recentRepo.CreateAsync(newRecent, ct);
    }

    /// <summary>
    /// 更新 DownloadRecent
    /// </summary>
    private async Task UpdateDownloadRecentAsync(
        FileManage_DownloadRecent currentRecent,
        string refererUrl,
        DateTime now,
        CancellationToken ct = default)
    {
        // 宣告變數
        dynamic recentRepo = DbRepositoryProvider.GetRepo(typeof(FileManage_DownloadRecent));
        FileManage_DownloadRecent oldRecent = await recentRepo.FindByKeyAsync(ct, currentRecent.InternalId, currentRecent.RowId);
        var newRecent = oldRecent.Snapshot();

        // 執行 function
        ct.ThrowIfCancellationRequested();
        newRecent.RefererURL = refererUrl;
        newRecent.LastCountTime = now;
        await recentRepo.UpdateAsync(oldRecent, newRecent, ct);
    }

    /// <summary>
    /// 取得下一個 DownloadRecent RowId
    /// </summary>
    private async Task<int> GetNextDownloadRecentRowIdAsync(string internalId, CancellationToken ct = default)
    {
        // 宣告變數
        string[] fields = [nameof(FileManage_DownloadRecent.RowId)];
        string condition = $"{nameof(FileManage_DownloadRecent.InternalId)} = {internalId}";

        // 執行 function
        ct.ThrowIfCancellationRequested();
        var list = await DoQueryListAsync<FileManage_DownloadRecent>(fields, condition, default, 0, 0, ct: ct);
        var maxRowId = list.Cast<FileManage_DownloadRecent>().Select(p => p.RowId).DefaultIfEmpty(0).Max();

        // return
        return maxRowId + 1;
    }

    /// <summary>
    /// 累加主表公開下載次數
    /// </summary>
    private async Task IncreasePublicDownloadCountAsync(string internalId, CancellationToken ct = default)
    {
        // 宣告變數
        dynamic fileRepo = DbRepositoryProvider.GetRepo(typeof(FileManage));
        FileManage? oldFile = await fileRepo.FindByKeyAsync(ct, internalId);
        if (oldFile == null) return;

        var newFile = oldFile.Snapshot();

        // 執行 function
        ct.ThrowIfCancellationRequested();
        newFile.PublicDownloadCount += 1;
        await fileRepo.UpdateAsync(oldFile, newFile, ct);
    }


    /// <summary>
    /// 取得檔案預覽類型
    /// </summary>
    /// <param name="fileManage"></param>
    /// <returns></returns>
    private string GetPreviewType(FileManage fileManage)
    {
        // 宣告變數
        string mimeType = (fileManage.MimeType ?? string.Empty).Trim().ToLowerInvariant();
        string extension = (fileManage.FileExtension ?? string.Empty).Trim().TrimStart('.').ToLowerInvariant();

        // 執行 function：先用 MimeType 判斷
        string mimePreviewType = GetPreviewTypeByMimeType(mimeType);
        if (mimePreviewType != FilePreviewTypes.None) return mimePreviewType;

        // 執行 function：MimeType 無法判斷時，再看副檔名
        // return
        return GetPreviewTypeByExtension(extension);
    }
    /// <summary>
    /// 依 MimeType 取得預覽類型
    /// </summary>
    /// <param name="mimeType"></param>
    /// <returns></returns>
    private static string GetPreviewTypeByMimeType(string mimeType)
    {
        string[] pdfList = [MimeTypes.APPLICATION_PDF,];
        string[] imageList = [MimeTypes.IMAGE_JPEG, MimeTypes.IMAGE_PNG, MimeTypes.IMAGE_GIF, MimeTypes.IMAGE_BMP, MimeTypes.IMAGE_WEBP, MimeTypes.IMAGE_SVG_XML,];
        string[] videoList = [MimeTypes.VIDEO_MP4,];
        string[] audioList = [MimeTypes.AUDIO_MPEG, MimeTypes.AUDIO_WAV, MimeTypes.AUDIO_MP4,];
        string[] textList = [MimeTypes.TEXT_PLAIN, MimeTypes.TEXT_CSV,];
        if (pdfList.Contains(mimeType)) return FilePreviewTypes.Pdf;
        if (imageList.Contains(mimeType)) return FilePreviewTypes.Image;
        if (videoList.Contains(mimeType)) return FilePreviewTypes.Video;
        if (audioList.Contains(mimeType)) return FilePreviewTypes.Audio;
        if (textList.Contains(mimeType)) return FilePreviewTypes.Text;
        return FilePreviewTypes.None;
    }

    /// <summary>
    /// 依副檔名取得預覽類型
    /// </summary>
    /// <param name="extension"></param>
    /// <returns></returns>
    private static string GetPreviewTypeByExtension(string extension)
    {
        string[] pdfList = [FileExtensions.PDF,];
        string[] imageList = [FileExtensions.JPG, FileExtensions.JPEG, FileExtensions.PNG, FileExtensions.GIF, FileExtensions.BMP, FileExtensions.WEBP, FileExtensions.SVG,];
        string[] videoList = [FileExtensions.MP4,];
        string[] audioList = [FileExtensions.MP3, FileExtensions.WAV, FileExtensions.M4A,];
        string[] textList = [FileExtensions.TXT, FileExtensions.CSV,];
        if (pdfList.Contains(extension)) return FilePreviewTypes.Pdf;
        if (imageList.Contains(extension)) return FilePreviewTypes.Image;
        if (videoList.Contains(extension)) return FilePreviewTypes.Video;
        if (audioList.Contains(extension)) return FilePreviewTypes.Audio;
        if (textList.Contains(extension)) return FilePreviewTypes.Text;
        return FilePreviewTypes.None;
    }
    #endregion

    #region Upload File
    /// <summary>
    /// 創建暫存檔案資訊
    /// </summary>
    /// <param name="file"></param>
    /// <returns></returns>
    private FileManage CreateNewFileInfo(IFormFile file, string sha256)
    {
        DateTime today = DateTime.UtcNow;
        string internalId = Guid.NewGuid().ToString();
        using var stream = file.OpenReadStream();
        var (Extension, MimeType) = LibData.GetUploadFileMeta(stream, file.FileName);
        FileManage set = new()
        {
            InternalId = internalId,
            ProgId = string.Empty,
            Path = LibData.Merge("/", false, FilePath.Root, FilePath.Pending, today.Year, today.Month, today.Day, string.Empty),
            FileExtension = Extension,
            MimeType = MimeType,
            FileName = Path.GetFileNameWithoutExtension(file.FileName),
            FileDescription = file.FileName,
            FileStatus = FileStatus.None,
            FileSHA256 = sha256,
            FileSize = file.Length,
            IsPublic = true,
        };
        return set;
    }


    /// <summary>
    /// 檢查檔案是否合法上傳
    /// </summary>
    /// <param name="file"></param>
    /// <param name="set"></param>
    /// <returns></returns>
    private bool CheckFileLegal(IFormFile file, FileManage set)
    {
        if (file == null || file.Length == 0) return false;
        var filemanage = set;
        var syncInfo = set._FileManage_SyncInfo.LastOrDefault();
        if (CheckFileExist(filemanage, syncInfo)) return false;
        if (!CheckFileExtension(filemanage, syncInfo)) return false;
        if (!CheckFileSize(filemanage, syncInfo)) return false;
        return true;
    }
    /// <summary>
    /// 檢查檔案格式是否符合上傳規範
    /// </summary>
    /// <param name="file"></param>
    /// <param name="set"></param>
    /// <returns></returns>
    private bool CheckFileExtension(FileManage filemanage, FileManage_SyncInfo syncInfo)
    {
        if (!CheckExtension(filemanage.FileExtension))
        {
            filemanage.FileStatus = FileStatus.Failed;
            syncInfo.FileStatus = FileStatus.Failed;
            syncInfo.ErrorCode = SysMessageCode.BECode00023;
            syncInfo.ErrorMessage = ErrorHelper.GetResxMsg(SysMessageCode.BECode00023, filemanage.FileExtension);
            return false;
        }
        if (!CheckMimeType(filemanage.MimeType))
        {
            filemanage.FileStatus = FileStatus.Failed;
            syncInfo.FileStatus = FileStatus.Failed;
            syncInfo.ErrorCode = SysMessageCode.BECode00022;
            syncInfo.ErrorMessage = ErrorHelper.GetResxMsg(SysMessageCode.BECode00022, filemanage.MimeType);
            return false;
        }
        return true;
    }
    /// <summary>
    /// 檢查檔案大小是否符合上傳規範
    /// </summary>
    /// <param name="file"></param>
    /// <param name="set"></param>
    /// <returns></returns>
    private bool CheckFileSize(FileManage filemanage, FileManage_SyncInfo syncInfo)
    {
        const int mb = 200;
        const long maxFileSize = mb * 1024 * 1024;
        if (filemanage.FileSize > maxFileSize)
        {
            syncInfo.ErrorCode = SysMessageCode.BECode00024;
            syncInfo.ErrorMessage = ErrorHelper.GetResxMsg(SysMessageCode.BECode00024, mb);
            return false;
        }
        return true;
    }
    /// <summary>
    /// 檢查檔案是否已存在
    /// </summary>
    /// <param name="set"></param>
    /// <returns></returns>
    private bool CheckFileExist(FileManage filemanage, FileManage_SyncInfo syncInfo)
    {
        string fullPath = Path.Combine(filemanage.Path, $"{filemanage.InternalId}.{filemanage.FileExtension}");
        if (filemanage.FileStatus.In(FileStatus.Pending, FileStatus.Success) || File.Exists(fullPath))
        {
            syncInfo.FileStatus = FileStatus.Skipped;
            return true;
        }
        return false;
    }
    /// <summary>
    /// 檢查副檔名是否合法
    /// </summary>
    /// <param name="fileType"></param>
    /// <returns></returns>
    private static bool CheckExtension(string fileType)
    {
        string[] checkList = [
            #region 文字檔案
            FileExtensions.PDF,
            FileExtensions.DOCX,
            FileExtensions.DOC,
            FileExtensions.XLSX,
            FileExtensions.XLS,
            FileExtensions.PPTX,
            FileExtensions.TXT,
            FileExtensions.CSV,
            FileExtensions.ODT,
            #endregion
            #region 圖片
            FileExtensions.JPG,
            FileExtensions.JPEG,
            FileExtensions.PNG,
            FileExtensions.GIF,
            FileExtensions.BMP,
            FileExtensions.WEBP,
            FileExtensions.SVG ,
            #endregion
            #region 壓縮檔案
            FileExtensions.ZIP,
            FileExtensions.RAR,
            FileExtensions._7Z ,
            #endregion
            #region 影音
            FileExtensions.MP3,
            FileExtensions.WAV,
            FileExtensions.MP4,
            FileExtensions.MOV,
            FileExtensions.MKV,
            FileExtensions.M4A,
            #endregion
        ];
        return checkList.Contains(fileType.ToLowerInvariant());
    }
    /// <summary>
    /// 檢查網際網路媒體類型是否合法
    /// </summary>
    /// <param name="mimeType"></param>
    /// <returns></returns>
    private static bool CheckMimeType(string fileType)
    {
        string[] checkList = [
            MimeTypes.APPLICATION_PDF,
            MimeTypes.APPLICATION_MSWORD,
            MimeTypes.APPLICATION_VND_OPENXML_WORD ,
            MimeTypes.APPLICATION_VND_EXCEL         ,
            MimeTypes.APPLICATION_VND_OPENXML_EXCEL ,
            MimeTypes.APPLICATION_VND_POWERPOINT ,
            MimeTypes.APPLICATION_ODT,
            MimeTypes.APPLICATION_VND_OPENXML_POWERPOINT ,
            MimeTypes.TEXT_PLAIN ,
            MimeTypes.TEXT_CSV ,
            MimeTypes.IMAGE_JPEG,
            MimeTypes.IMAGE_PNG ,
            MimeTypes.IMAGE_GIF ,
            MimeTypes.IMAGE_BMP ,
            MimeTypes.IMAGE_WEBP ,
            MimeTypes.IMAGE_SVG_XML,
            MimeTypes.APPLICATION_ZIP,
            MimeTypes.APPLICATION_VND_RAR ,
            MimeTypes.APPLICATION_X_7Z_COMPRESSED ,
            MimeTypes.AUDIO_MPEG,
            MimeTypes.AUDIO_WAV,
            MimeTypes.AUDIO_MP4,
            MimeTypes.VIDEO_QUICKTIME,
            MimeTypes.VIDEO_MP4,
            MimeTypes.APPLICATION_EXCEL,
            MimeTypes.APPLICATION_X_EXCEL,
            MimeTypes.APPLICATION_X_MSEXCEL,
            ];
        return checkList.Contains(fileType.ToLowerInvariant());
    }
    /// <summary>
    /// 檢查 SHA256 是否存在系統中，並同步目前上傳檔案解析結果
    /// </summary>
    private async Task<(bool isNew, FileManage set)> CheckSHA256Async(string sha256, IFormFile file)
    {
        // 宣告變數：查詢是否已有相同 SHA256
        var exist = await DoQueryListAsync(
            typeof(FileManage),
            [nameof(FileManage.InternalId), nameof(FileManage.FileSHA256)],
            @$"{nameof(FileManage.FileSHA256)} = {sha256}", default, 0, 0
        );

        // 宣告變數：不存在就建立新資料，存在就讀取 DB set
        bool isNew = exist.Count == 0;
        FileManage set = isNew ? CreateNewFileInfo(file, sha256) : await DoQueryDataAsync(((FileManage)exist[0]).InternalId);

        // 執行：既有檔案需重新同步目前解析到的副檔名 / MIME
        if (!isNew) SyncUploadFileMeta(set, file, sha256);

        // 執行：新增本次同步紀錄
        AddUploadSyncInfo(set, file);

        // return
        return (isNew, set);
    }
    /// <summary>
    /// 同步目前上傳檔案解析出的格式資訊
    /// </summary>
    private static void SyncUploadFileMeta(FileManage filemanage, IFormFile file, string sha256)
    {
        // 宣告變數：重新解析目前上傳檔案
        using var stream = file.OpenReadStream();
        var (extension, mimeType) = LibData.GetUploadFileMeta(stream, file.FileName);

        // 宣告變數：更新 DB 內可由檔案本體推導出的資訊
        bool metaChanged = false;
        metaChanged |= SyncFileExtension(filemanage, extension);
        metaChanged |= SyncMimeType(filemanage, mimeType);
        metaChanged |= SyncFileSize(filemanage, file.Length);
        metaChanged |= SyncFileSHA256(filemanage, sha256);
        metaChanged |= SyncEmptyFileName(filemanage, file.FileName);

        // 執行：若舊資料是 Failed，且本次解析結果已補齊，就讓後續重新檢查合法性
        if (ShouldResetFailedFileStatus(filemanage, metaChanged))
            filemanage.FileStatus = FileStatus.None;
    }
    /// <summary>
    /// 同步副檔名
    /// </summary>
    private static bool SyncFileExtension(FileManage filemanage, string extension)
    {
        // 執行：空值不覆蓋既有正確資料
        if (string.IsNullOrWhiteSpace(extension)) return false;
        if (string.Equals(filemanage.FileExtension, extension, StringComparison.OrdinalIgnoreCase)) return false;

        // 執行：更新副檔名
        filemanage.FileExtension = extension;

        // return
        return true;
    }

    /// <summary>
    /// 同步 MIME Type
    /// </summary>
    private static bool SyncMimeType(FileManage filemanage, string mimeType)
    {
        // 執行：空值不覆蓋既有正確資料
        if (string.IsNullOrWhiteSpace(mimeType)) return false;
        if (string.Equals(filemanage.MimeType, mimeType, StringComparison.OrdinalIgnoreCase)) return false;

        // 執行：更新 MIME Type
        filemanage.MimeType = mimeType;

        // return
        return true;
    }

    /// <summary>
    /// 同步檔案大小
    /// </summary>
    private static bool SyncFileSize(FileManage filemanage, long fileSize)
    {
        // 執行：相同大小不處理
        if (filemanage.FileSize == fileSize) return false;

        // 執行：更新檔案大小
        filemanage.FileSize = fileSize;

        // return
        return true;
    }

    /// <summary>
    /// 同步 SHA256
    /// </summary>
    private static bool SyncFileSHA256(FileManage filemanage, string sha256)
    {
        // 執行：空值不覆蓋
        if (string.IsNullOrWhiteSpace(sha256)) return false;
        if (string.Equals(filemanage.FileSHA256, sha256, StringComparison.OrdinalIgnoreCase)) return false;

        // 執行：更新 SHA256
        filemanage.FileSHA256 = sha256;

        // return
        return true;
    }

    /// <summary>
    /// DB 檔名為空時，補上目前上傳檔名
    /// </summary>
    private static bool SyncEmptyFileName(FileManage filemanage, string fileName)
    {
        // 宣告變數
        string safeFileName = Path.GetFileNameWithoutExtension(fileName);
        // 執行：避免同 SHA256 但不同檔名時，覆蓋既有顯示名稱
        if (!string.IsNullOrWhiteSpace(filemanage.FileName)) return false;
        if (string.IsNullOrWhiteSpace(safeFileName)) return false;
        // 執行：補上空檔名
        filemanage.FileName = safeFileName;
        filemanage.FileDescription = fileName;
        // return
        return true;
    }

    /// <summary>
    /// 判斷是否需要重置 Failed 狀態
    /// </summary>
    private static bool ShouldResetFailedFileStatus(FileManage filemanage, bool metaChanged)
    {
        // 執行：沒有異動不用重置
        if (!metaChanged) return false;

        // 執行：只有 Failed 需要重置
        if (filemanage.FileStatus != FileStatus.Failed) return false;

        // return：副檔名與 MIME 都已解析成功才重置
        return !string.IsNullOrWhiteSpace(filemanage.FileExtension) && !string.IsNullOrWhiteSpace(filemanage.MimeType);
    }

    /// <summary>
    /// 新增上傳同步紀錄
    /// </summary>
    private static void AddUploadSyncInfo(FileManage set, IFormFile file)
    {
        // 執行：新增本次同步資訊
        set._FileManage_SyncInfo.Add(new FileManage_SyncInfo()
        {
            InternalId = set.InternalId,
            FileStatus = FileStatus.Pending,
            SrcIP = "",
            SrcNode = "Guest",
            SrcFullPath = file.FileName,
            DestIP = HostNetworkInfo.LocalIPv4,
            DestNode = Environment.MachineName,
            DestFullPath = "",
        });
    }
    /// <summary>
    /// 存入系統
    /// </summary>
    /// <param name="file"></param>
    /// <param name="set"></param>
    private static async Task DoStoreFileToSystem(IFormFile file, FileManage set)
    {
        if (file == null || file.Length == 0) return;
        if (!Directory.Exists(set.Path)) Directory.CreateDirectory(set.Path);
        var fileName = $"{set.InternalId}.{set.FileExtension}";
        var fullPath = Path.Combine(set.Path, fileName);
        using var stream = new FileStream(fullPath, FileMode.Create);
        await file.CopyToAsync(stream);
    }
    #endregion

    #region Move File
    /// <summary>
    /// 將檔案從暫存區移至正式區
    /// </summary>
    /// <param name="sets"></param>
    private async Task MoveFileFromTempToFinal(List<FileManage> sets)
    {
        DateTime today = DateTime.UtcNow;
        string dstPath = LibData.Merge("/", false, FilePath.Root, FilePath.Permanent, today.Year, today.Month, today.Day, ProgId);
        if (!Directory.Exists(dstPath)) Directory.CreateDirectory(dstPath);
        foreach (var set in sets)
        {
            if (set.FileStatus != FileStatus.Pending) continue;
            var header = set;
            var curSyncInfo = new FileManage_SyncInfo() { InternalId = set.InternalId, FileStatus = FileStatus.Success };
            set._FileManage_SyncInfo.Add(curSyncInfo);
            string srcPath = header.Path;
            string srcFullPath = LibData.Merge("/", false, header.Path, $"{header.InternalId}.{header.FileExtension}");
            string dstFullPath = LibData.Merge("/", false, dstPath, $"{header.InternalId}.{header.FileExtension}");
            header.FileStatus = FileStatus.Success;
            header.Path = dstPath;
            curSyncInfo.SrcFullPath = srcFullPath;
            curSyncInfo.DestFullPath = dstFullPath;
            curSyncInfo.FileStatus = FileStatus.Success;
            curSyncInfo.SrcIP = HostNetworkInfo.LocalIPv4;
            curSyncInfo.SrcNode = Environment.MachineName;
            curSyncInfo.DestIP = HostNetworkInfo.LocalIPv4;
            curSyncInfo.DestNode = Environment.MachineName;
            if (File.Exists(srcFullPath)) File.Move(srcFullPath, dstFullPath);
            else
            {
                header.FileStatus = FileStatus.Pending;
                header.Path = srcPath;
                curSyncInfo.FileStatus = FileStatus.Failed;
                curSyncInfo.ErrorMessage = "找不到檔案可移動。";
            }
            await this.BizUpdateDataAsync(header.InternalId, set);
        }
    }
    #endregion

    #region Delete File
    /// <summary>
    /// 將檔案從暫存區刪除
    /// </summary>
    /// <param name="sets"></param>
    private async Task DeleteFromTemp(List<FileManage> sets)
    {
        foreach (var set in sets)
        {
            if (set.FileStatus != FileStatus.Pending) continue;
            var header = set;
            var curSyncInfo = new FileManage_SyncInfo() { InternalId = set.InternalId, FileStatus = FileStatus.Canceled };
            set._FileManage_SyncInfo.Add(curSyncInfo);
            string srcPath = header.Path;
            string srcFullPath = LibData.Merge("/", false, header.Path, $"{header.InternalId}.{header.FileExtension}");
            string dstFullPath = string.Empty;
            header.FileStatus = FileStatus.Success;
            header.Path = string.Empty;
            curSyncInfo.SrcFullPath = srcFullPath;
            curSyncInfo.DestFullPath = dstFullPath;
            curSyncInfo.FileStatus = FileStatus.Success;
            curSyncInfo.SrcIP = HostNetworkInfo.LocalIPv4;
            curSyncInfo.SrcNode = Environment.MachineName;
            curSyncInfo.DestIP = HostNetworkInfo.LocalIPv4;
            curSyncInfo.DestNode = Environment.MachineName;
            if (File.Exists(srcFullPath)) File.Delete(srcFullPath);
            else
            {
                header.FileStatus = FileStatus.None;
                header.Path = srcPath;
                curSyncInfo.FileStatus = FileStatus.Failed;
                curSyncInfo.ErrorMessage = "找不到檔案可刪除。";
            }
            await this.BizUpdateDataAsync(header.InternalId, set);
        }
    }
    #endregion


    /// <summary>
    /// 解壓初始匯入檔案，並將實體檔案與管理資料保存至匯入區。
    /// </summary>
    private async Task Decompress(string label)
    {
        ValidateImportLabel(label);
        string rootPath = LibData.Merge("/", false, FilePath.Root, FilePath.Import);
        string archivePath = LibData.Merge("/", false, rootPath, $"{label}.zip");
        string destinationPath = LibData.Merge("/", false, rootPath, label);
        string temporaryPath = Path.Combine(rootPath, $".{label}-{Guid.NewGuid():N}");
        try
        {
            ZipExtractResult result = await ExtractImportArchiveAsync(archivePath, temporaryPath);
            await SaveExtractedFilesAsync(result.Files, destinationPath, label);
        }
        finally
        {
            DeleteDirectorySilently(temporaryPath);
        }
    }
    /// <summary>
    /// 依匯入限制安全解壓 ZIP 至暫存目錄。
    /// </summary>
    private static Task<ZipExtractResult> ExtractImportArchiveAsync(string archivePath, string temporaryPath)
    {
        ZipExtractOptions options = new()
        {
            MaxEntryCount = MaxImportEntryCount,
            MaxEntryLength = MaxImportEntrySize,
            MaxTotalLength = MaxImportTotalSize,
            ShouldExtractEntry = ShouldExtractImportEntry,
        };
        return LibZipArchive.ExtractAsync(archivePath, temporaryPath, options);
    }
    /// <summary>
    /// 將解壓後的檔案去重、搬移並建立檔案管理資料。
    /// </summary>
    private async Task SaveExtractedFilesAsync(
        IReadOnlyList<ZipExtractedFile> files,
        string destinationPath,
        string label)
    {
        Dictionary<string, FileManage> filesByHash = [];
        foreach (ZipExtractedFile file in files)
            RegisterImportedFile(file, destinationPath, label, filesByHash);
        foreach (FileManage file in filesByHash.Values)
            await BizCreateDataAsync(file);
    }
    /// <summary>
    /// 登記單一解壓檔案，重複內容沿用既有主檔。
    /// </summary>
    private static void RegisterImportedFile(
        ZipExtractedFile file,
        string destinationPath,
        string label,
        Dictionary<string, FileManage> filesByHash)
    {
        string hash = LibData.GetFileSHA256(file.FullPath);
        FileStatus status = FileStatus.Skipped;
        if (!filesByHash.TryGetValue(hash, out FileManage? set))
        {
            set = CreateImportedFile(file, destinationPath, label, hash);
            filesByHash.Add(hash, set);
            status = FileStatus.Success;
        }
        set._FileManage_SyncInfo.Add(BuildImportSyncInfo(set, file.EntryName, status));
    }
    /// <summary>
    /// 將解壓檔案移至正式匯入路徑並建立主檔資料。
    /// </summary>
    private static FileManage CreateImportedFile(
        ZipExtractedFile file,
        string destinationPath,
        string label,
        string hash)
    {
        string internalId = Guid.NewGuid().ToString();
        (string extension, string mimeType) = ReadImportFileMeta(file);
        string directory = ResolveImportDirectory(destinationPath, file.RelativePath);
        Directory.CreateDirectory(directory);
        string destination = Path.Combine(directory, $"{internalId}.{extension}");
        File.Move(file.FullPath, destination);
        return BuildImportedFile(internalId, file.EntryName, directory, extension,
            mimeType, hash, file.Length, label);
    }
    /// <summary>
    /// 讀取解壓檔案的實際格式與 MIME Type。
    /// </summary>
    private static (string Extension, string MimeType) ReadImportFileMeta(ZipExtractedFile file)
    {
        using FileStream stream = File.OpenRead(file.FullPath);
        return LibData.GetUploadFileMeta(stream, file.EntryName);
    }
    /// <summary>
    /// 取得解壓檔案在正式匯入目錄中的安全目的資料夾。
    /// </summary>
    private static string ResolveImportDirectory(string destinationPath, string relativePath)
    {
        string rootPath = Path.GetFullPath(destinationPath);
        string relativeDirectory = Path.GetDirectoryName(relativePath) ?? string.Empty;
        string fullPath = Path.GetFullPath(Path.Combine(rootPath, relativeDirectory));
        string rootPrefix = rootPath.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        StringComparison comparison = OperatingSystem.IsWindows()
            ? StringComparison.OrdinalIgnoreCase
            : StringComparison.Ordinal;
        if (fullPath.Equals(rootPath, comparison) || fullPath.StartsWith(rootPrefix, comparison))
            return fullPath;
        throw new InvalidDataException($"ZIP 目的資料夾路徑不合法：{relativePath}");
    }
    /// <summary>
    /// 判斷 ZIP 項目是否需要匯入。
    /// </summary>
    private static bool ShouldExtractImportEntry(string entryName)
    {
        string fileName = Path.GetFileNameWithoutExtension(entryName);
        return !fileName.Equals("thumbs", StringComparison.OrdinalIgnoreCase);
    }
    /// <summary>
    /// 清除本次匯入使用的暫存解壓目錄。
    /// </summary>
    private static void DeleteDirectorySilently(string path)
    {
        try
        {
            if (Directory.Exists(path)) Directory.Delete(path, true);
        }
        catch
        {
            // 清理失敗不覆蓋原始匯入例外。
        }
    }
    /// <summary>
    /// 建立匯入檔案主檔資料。
    /// </summary>
    private static FileManage BuildImportedFile(
        string internalId,
        string entryName,
        string directory,
        string extension,
        string mimeType,
        string hash,
        long size,
        string label)
    {
        string fileName = Path.GetFileNameWithoutExtension(entryName);
        return new FileManage
        {
            InternalId = internalId,
            Path = directory.Replace("\\", "/"),
            FileName = fileName,
            FileExtension = extension,
            FileDescription = fileName,
            ProgId = string.Empty,
            MimeType = mimeType,
            FileSHA256 = hash,
            FileSize = size,
            ImportLabel = label,
            FileStatus = FileStatus.Success,
            IsIniData = true,
        };
    }
    /// <summary>
    /// 建立匯入來源與實體目的地的同步紀錄。
    /// </summary>
    private static FileManage_SyncInfo BuildImportSyncInfo(FileManage file, string entryName, FileStatus status)
    {
        return new FileManage_SyncInfo
        {
            InternalId = file.InternalId,
            FileStatus = status,
            SrcIP = HostNetworkInfo.LocalIPv4,
            SrcNode = Environment.MachineName,
            SrcFullPath = entryName,
            DestIP = HostNetworkInfo.LocalIPv4,
            DestNode = Environment.MachineName,
            DestFullPath = LibData.Merge("/", false, file.Path, $"{file.InternalId}.{file.FileExtension}")
        };
    }
    /// <summary>
    /// 驗證匯入標籤不可包含路徑或特殊目錄語意。
    /// </summary>
    private static void ValidateImportLabel(string label)
    {
        bool hasSeparator = label.Contains('/') || label.Contains('\\');
        bool isValid = !string.IsNullOrWhiteSpace(label)
            && !hasSeparator
            && string.Equals(Path.GetFileName(label), label, StringComparison.Ordinal)
            && !label.Equals(".", StringComparison.Ordinal)
            && !label.Equals("..", StringComparison.Ordinal);
        if (!isValid) throw new ArgumentException("匯入標籤格式不合法。", nameof(label));
    }

    #endregion
}