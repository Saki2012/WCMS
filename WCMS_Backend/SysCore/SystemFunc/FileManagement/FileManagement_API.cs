using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.IO.Compression;
using System.Text.RegularExpressions;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n.Resx;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.Enum.SysParam;

namespace WCMS.SysCore.SystemFunc.FileManagement
{
    [ApiController, Route(ServiceRoute)]
    public class FileManagementController(IWebHostEnvironment Env) : ApiDataController<FileManageSet,FileManageSet_DTO>
    {
        #region Public

        #region 對外公開API
        /// <summary>
        /// 下載檔案
        /// </summary>
        /// <param name="internalId"></param>
        /// <returns></returns>
        [HttpGet($"{nameof(Public_Download)}/{{internalId}}"), AllowAnonymous, IgnoreAntiforgeryToken]
        public async Task<IActionResult> Public_Download(string internalId, CancellationToken ct, [FromQuery] string? fileName = null)
        {
            // 宣告變數：取得單筆公開檔案
            var (errorResult, file) = await ReadSingleFileAsync(internalId, true);
            if (errorResult != null || file == null) return errorResult!;
            // 執行 function：前台下載計次
            await CountPublicDownloadAsync(file.InternalId, ct);
            // return
            return BuildDownloadResult(file, fileName);
        }
        /// <summary>
        /// 預覽檔案（inline，適合圖片、PDF等瀏覽器可直接顯示的格式）
        /// </summary>
        /// <param name="internalId"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpGet($"{nameof(Public_Preview)}/{{internalId}}"), AllowAnonymous, IgnoreAntiforgeryToken]
        public async Task<IActionResult> Public_Preview(string internalId, CancellationToken ct, [FromQuery] string? fileName = null)
        {
            // 宣告變數：取得單筆公開檔案
            var (errorResult, file) = await ReadSingleFileAsync(internalId, true);
            if (errorResult != null || file == null) return errorResult!;
            // 宣告變數：確認是否可預覽
            var previewError = EnsureCanPreview(file, out var isPdf);
            if (previewError != null) return previewError;
            // 執行 function：PDF preview 視同下載時才計次
            if (isPdf) await CountPublicDownloadAsync(file.InternalId, ct);
            // return
            return BuildPreviewResult(file, fileName, isPublic: true);
        }
        #endregion

        #region 後台權限API
        /// <summary>
        /// 後台預覽檔案（inline，適合圖片、PDF、影音等瀏覽器可直接顯示的格式）
        /// </summary>
        /// <param name="internalId"></param>
        /// <param name="ct"></param>
        /// <param name="fileName"></param>
        /// <returns></returns>
        [HttpGet($"{nameof(Server_Preview)}/{{internalId}}"), Authorize]
        public async Task<IActionResult> Server_Preview(string internalId, CancellationToken ct, [FromQuery] string? fileName = null)
        {
            // 宣告變數：取得單筆後台檔案
            var (errorResult, file) = await ReadSingleFileAsync(internalId, false);
            if (errorResult != null || file == null) return errorResult!;

            // 宣告變數：確認是否可預覽
            var previewError = EnsureCanPreview(file, out _);
            if (previewError != null) return previewError;

            // return
            return BuildPreviewResult(file, fileName, isPublic: false);
        }
        /// <summary>
        /// 後台下載檔案
        /// </summary>
        /// <param name="internalId"></param>
        /// <param name="ct"></param>
        /// <param name="fileName"></param>
        /// <returns></returns>
        [HttpGet($"{nameof(Server_Download)}/{{internalId}}"), Authorize]
        public async Task<IActionResult> Server_Download(string internalId, CancellationToken ct, [FromQuery] string? fileName = null)
        {
            // 宣告變數：紀錄操作
            OperateLogModel followInfo = OperateLog.AddOperateLog(
                $"{Service.ProgId}/{nameof(Server_Download)}",
                OperateUser.UserId,
                JsonConvert.SerializeObject(internalId),
                Request.Headers["HTTP_CLIENT_IP"].ToString());

            // 宣告變數：取得單筆後台檔案
            var (errorResult, file) = await ReadSingleFileAsync(internalId, false);
            if (errorResult != null || file == null) return errorResult!;

            // return
            return BuildDownloadResult(file, fileName);
        }
        /// <summary>
        /// 後台上傳檔案(先到暫存區)
        /// </summary>
        /// <param name="file"></param>
        /// <returns></returns>
        [HttpPost(nameof(Server_UploadTemp)), AllowAnonymous, IgnoreAntiforgeryToken, RequestSizeLimit(200L * 1024 * 1024)]// 200 MB限制
        public async Task<IActionResult> Server_UploadTemp(IFormFile file)
        {
            OperateLogModel followInfo = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(Server_UploadTemp)}", OperateUser.UserId, JsonConvert.SerializeObject(file), Request.Headers["HTTP_CLIENT_IP"].ToString());
            var internalId = await ((FileManagementBiz)Service).UploadTemp(file);
            var response = new ApiResponse<string>() { Data = [internalId], SysMessage = Message.Messages };
            return Ok(response);
        }
        /// <summary>
        /// 後台上傳檔案移至永久區
        /// </summary>
        /// <param name="internalIds"></param>
        /// <returns></returns>
        [HttpPost(nameof(Server_MoveToPermanent)), AllowAnonymous, IgnoreAntiforgeryToken]
        public async Task<IActionResult> Server_MoveToPermanent(string[] internalIds)
        {
            OperateLogModel followInfo = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(Server_MoveToPermanent)}", OperateUser.UserId, JsonConvert.SerializeObject(internalIds), Request.Headers["HTTP_CLIENT_IP"].ToString());
            await ((FileManagementBiz)Service).MoveToPermanent(internalIds);
            var response = new ApiResponse<string>() { Data = internalIds, SysMessage = Message.Messages };
            return Ok(response);
        }
        /// <summary>
        /// 取消上傳檔案(從暫存區刪除)
        /// </summary>
        /// <param name="internalIds"></param>
        /// <returns></returns>
        [HttpPost(nameof(Server_CancelUploadFiles)), AllowAnonymous, IgnoreAntiforgeryToken]
        public async Task<IActionResult> Server_CancelUploadFiles(string[] internalIds)
        {
            OperateLogModel followInfo = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(Server_CancelUploadFiles)}", OperateUser.UserId, JsonConvert.SerializeObject(internalIds), Request.Headers["HTTP_CLIENT_IP"].ToString());
            await ((FileManagementBiz)Service).CancelUploadFiles(internalIds);
            var response = new ApiResponse<string>() { Data = internalIds, SysMessage = Message.Messages };
            return Ok(response);
        }
        #endregion

        /// <summary>
        /// 匯入初始檔案資料
        /// </summary>
        /// <param name="label"></param>
        /// <param name="zipFile"></param>
        /// <returns></returns>
        [DisableRequestSizeLimit]
        [RequestSizeLimit(1024L * 1024 * 1024 * 2)] // 2 GB
        [HttpPost(nameof(ImportInitialFiles))]
        public async Task<IActionResult> ImportInitialFiles(string label = "1810")
        {
            await ((FileManagementBiz)Service).ImportZip(label);
            return Ok();
        }

        #endregion

        #region Private

        #region File Preview / Download 共用
        /// <summary>
        /// 取得 FileManagementBiz
        /// </summary>
        private FileManagementBiz GetFileBiz()
        {
            return (FileManagementBiz)Service;
        }
        /// <summary>
        /// 讀取單筆檔案，並統一處理錯誤回傳
        /// </summary>
        private async Task<(IActionResult? errorResult, FileManageModel? file)> ReadSingleFileAsync(string internalId, bool onlyPublic)
        {
            // 宣告變數：讀取檔案資訊
            var result = await GetFileBiz().ReadFileInfo([internalId], onlyPublic);
            // 執行 function：處理 Biz 錯誤
            if (Message.HasError) return (BadRequest(Message.Messages), null);
            if (result.Count == 0) return (NotFound(), null);
            if (result.Count != 1) return (BadRequest(), null);
            return (null, result[0]);
        }

        /// <summary>
        /// 確認檔案是否可預覽
        /// </summary>
        private IActionResult? EnsureCanPreview(FileManageModel file, out bool isPdf)
        {
            // 宣告變數：檢查是否可預覽
            var canPreview = GetFileBiz().CheckFileCanPreview(file, out isPdf);
            // 執行 function：不可預覽則回錯誤
            if (!canPreview)
            {
                Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00033, file.InternalId);
                return BadRequest(Message.Messages);
            }
            return null;
        }

        /// <summary>
        /// 前台下載計次
        /// </summary>
        private async Task CountPublicDownloadAsync(string fileInternalId, CancellationToken ct)
        {
            // 宣告變數：取得訪客資訊
            var visitorKey = GetOrCreateVisitorKey();
            var refererUrl = Request.Headers.Referer.ToString();

            // 執行 function：累加前台下載次數
            await GetFileBiz().TryCountPublicDownload(fileInternalId, visitorKey, refererUrl, ct);
        }

        /// <summary>
        /// 建立實體檔案路徑
        /// </summary>
        private string BuildPhysicalPath(FileManageModel file)
        {
            var ext = (file.FileExtension ?? string.Empty).Trim().TrimStart('.');
            return Path.Combine(Env.ContentRootPath, file.Path ?? string.Empty, $"{file.InternalId}.{ext}");
        }
        /// <summary>
        /// 建立回傳給瀏覽器的檔名
        /// </summary>
        private string BuildFileName(FileManageModel file, string? fileName)
        {
            // 宣告變數：整理副檔名
            var ext = (file.FileExtension ?? string.Empty).Trim().TrimStart('.');
            var baseName = string.IsNullOrWhiteSpace(file.FileName) ? file.InternalId : file.FileName.Trim();
            // 執行 function：有指定檔名就優先使用
            if (!string.IsNullOrWhiteSpace(fileName)) return string.IsNullOrWhiteSpace(ext) ? fileName.Trim() : $"{fileName.Trim()}.{ext}";
            // return
            return string.IsNullOrWhiteSpace(ext) ? baseName : $"{baseName}.{ext}";
        }
        /// <summary>
        /// 補正 Content-Type
        /// </summary>
        private string ResolveContentType(FileManageModel file, string safeFileName)
        {
            // 宣告變數：先取既有 MimeType
            var contentType = file.MimeType;
            // 執行 function：若 MimeType 不完整則依副檔名推斷
            if (string.IsNullOrWhiteSpace(contentType) || contentType.Equals("application/octet-stream", StringComparison.OrdinalIgnoreCase))
            {
                var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
                if (!provider.TryGetContentType(safeFileName, out contentType)) contentType = "application/octet-stream";
            }
            // return
            return contentType;
        }
        /// <summary>
        /// 設定預覽 Header
        /// </summary>
        private void ApplyPreviewHeaders(FileManageModel file, string safeFileName, bool isPublic)
        {
            // 執行 function：設定快取 Header
            if (!string.IsNullOrWhiteSpace(file.FileSHA256)) Response.Headers.ETag = $"W/\"{file.FileSHA256}\"";
            if (file.ModifyTime != default)
            {
                DateTime utc = file.ModifyTime ?? DateTime.UtcNow;
                var lastModified = new DateTimeOffset(utc).AddTicks(-(utc.Ticks % TimeSpan.TicksPerSecond));
                if (lastModified > DateTimeOffset.UtcNow) lastModified = DateTimeOffset.UtcNow;
                Response.Headers.LastModified = lastModified.ToString("R");
            }
            Response.Headers.CacheControl = isPublic ? "public, max-age=31536000, immutable" : "private, max-age=0, must-revalidate";
            // 執行 function：設定 inline 檔名
            var asciiFallback = Regex.Replace(safeFileName, @"[^\x20-\x7E]", "_").Replace("\"", "'");
            Response.Headers.ContentDisposition = $"inline; filename=\"{asciiFallback}\"; filename*=UTF-8''{Uri.EscapeDataString(safeFileName)}";
            Response.Headers.XContentTypeOptions = "nosniff";
        }
        /// <summary>
        /// 建立下載回應
        /// </summary>
        private IActionResult BuildDownloadResult(FileManageModel file, string? fileName)
        {
            var physicalPath = BuildPhysicalPath(file);
            var downloadFileName = BuildFileName(file, fileName);
            var contentType = ResolveContentType(file, downloadFileName);
            return PhysicalFile(physicalPath, contentType, downloadFileName);
        }
        /// <summary>
        /// 建立預覽回應
        /// </summary>
        private IActionResult BuildPreviewResult(FileManageModel file, string? fileName, bool isPublic)
        {
            // 宣告變數：建立回應內容
            var physicalPath = BuildPhysicalPath(file);
            var safeFileName = BuildFileName(file, fileName);
            var contentType = ResolveContentType(file, safeFileName);
            // 執行 function：設定預覽 Header
            ApplyPreviewHeaders(file, safeFileName, isPublic);
            return PhysicalFile(physicalPath, contentType, enableRangeProcessing: true);
        }
        #endregion

        #region Cookies相關
        /// <summary>
        /// 獲取或建立前台匿名訪客識別碼（VisitorKey）
        /// </summary>
        /// <returns></returns>
        private string GetOrCreateVisitorKey()
        {
            var visitorKey = TryGetVisitorKey();
            if (!string.IsNullOrWhiteSpace(visitorKey)) return visitorKey;
            visitorKey = Guid.NewGuid().ToString("N");
            WriteVisitorKeyCookie(visitorKey);
            return visitorKey;
        }
        /// <summary>
        /// 讀取前台匿名訪客 Cookie
        /// </summary>
        private string TryGetVisitorKey()
        {
            var hasValue = Request.Cookies.TryGetValue(CookieNames.VisitorKey, out var visitorKey);
            return hasValue ? (visitorKey ?? string.Empty).Trim() : string.Empty;
        }
        /// <summary>
        /// 寫入前台匿名訪客 Cookie
        /// </summary>
        private void WriteVisitorKeyCookie(string visitorKey)
        {
            var option = new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                IsEssential = true,
                Expires = DateTimeOffset.UtcNow.AddMonths(6),
                Path = "/",
            };
            Response.Cookies.Append(CookieNames.VisitorKey, visitorKey, option);
        }
        #endregion

        #endregion
    }
}
